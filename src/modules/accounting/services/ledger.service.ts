import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { ACCT } from '../accounting.concepts';
import {
  JournalRepository,
  AccountsRepository,
  FiscalRepository,
} from '../repositories';
import {
  PostJournalDto,
  LedgerLineDto,
  ReverseJournalDto,
  JournalTransitionDto,
  DetermineAccountsDto,
  AttachFileDto,
  CreateAccountDto,
  JournalTransactionResponseDto,
  DeterminedAccountResponseDto,
  AccountResponseDto,
  AccountingStatusDto,
  AccountType,
  NormalBalance,
} from '../dto';
import { sumCents, fromCents } from './money';
import { clasificar } from './journal-classification';
import { AuditTrailService } from '../../audit/services';
import { PracticeTenantLookupService } from '../../practice/services';

/** Recurso sellado en la cadena WORM para cada transición contable (CAN-AUDIT-001). */
const JOURNAL_AUDIT_ENTITY = 'journal_transaction';

const ACCOUNT_TYPE_CONCEPT: Record<AccountType, string> = {
  ASSET: ACCT.ACCOUNT_TYPE_ASSET,
  LIABILITY: ACCT.ACCOUNT_TYPE_LIABILITY,
  EQUITY: ACCT.ACCOUNT_TYPE_EQUITY,
  REVENUE: ACCT.ACCOUNT_TYPE_REVENUE,
  EXPENSE: ACCT.ACCOUNT_TYPE_EXPENSE,
};

const NORMAL_BALANCE_CONCEPT: Record<NormalBalance, string> = {
  DEBIT: ACCT.DIRECTION_DEBIT,
  CREDIT: ACCT.DIRECTION_CREDIT,
};

/**
 * Máquina de estados canónica del asiento (ALOVIDA C-17). Cada estado declara sus
 * transiciones válidas; cualquier otra combinación la rechaza `assertTransition`
 * con 422 (PreconditionFailed). El efecto en el mayor (sellado de `postedAt`) solo
 * ocurre en la transición APPROVED → POSTED.
 */
const ALLOWED_TRANSITIONS: Record<string, readonly string[]> = {
  // MCH-018: un borrador que el motor de reglas no puede clasificar va a
  // revisión humana en vez de marcarse auto-clasificado. Ese camino lo abre
  // únicamente `classify`: `submitForReview` sigue exigiendo pasar por la
  // clasificación (ver su guardia explícita).
  [ACCT.TXN_DRAFT]: [ACCT.TXN_AUTO_CLASSIFIED, ACCT.TXN_PENDING_REVIEW],
  [ACCT.TXN_AUTO_CLASSIFIED]: [ACCT.TXN_PENDING_REVIEW],
  [ACCT.TXN_PENDING_REVIEW]: [ACCT.TXN_APPROVED],
  [ACCT.TXN_APPROVED]: [ACCT.TXN_POSTED],
  [ACCT.TXN_POSTED]: [ACCT.TXN_REVERSED],
  [ACCT.TXN_REVERSED]: [],
};

/**
 * Roles con autoridad para aprobar un asiento (transición → APPROVED). `approve`
 * exige que el actor porte al menos uno; el gate autoritativo es el `@Roles` del
 * controlador, esta comprobación es la defensa en profundidad a nivel de servicio.
 */
const APPROVAL_ROLES: readonly string[] = [
  'ACCOUNTING_APPROVER',
  'SECURITY_ADMIN',
];

/**
 * Casos de uso del libro mayor: posteo de asientos por partida doble balanceada
 * (UC-16-01, incluye determinación UC-16-02), reversa espejo (UC-16-03), adjunto
 * de soporte (UC-16-13) y alta de cuenta del plan contable (soporte).
 *
 * Regla central del módulo: un asiento SOLO se postea si la suma de débitos iguala
 * la de créditos (`sum(DEBIT) == sum(CREDIT)`). Si no balancea, el servicio lanza
 * `PreconditionFailedException` → 422 y no persiste nada (todo dentro de una única
 * `em.transactional`).
 */
@Injectable()
export class LedgerService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param journalRepo - Valor de journal repo requerido por la operación.
   * @param accountsRepo - Valor de accounts repo requerido por la operación.
   * @param fiscalRepo - Valor de fiscal repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly journalRepo: JournalRepository,
    private readonly accountsRepo: AccountsRepository,
    private readonly fiscalRepo: FiscalRepository,
    private readonly auditTrail: AuditTrailService,
    private readonly practiceTenantLookup: PracticeTenantLookupService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(LedgerService.name);
  }

  /**
   * Carril 18 — un `PRACTITIONER` (a diferencia de `SECURITY_ADMIN`/
   * `ACCOUNTING_APPROVER`) sólo puede tocar asientos de una práctica a la que
   * está vinculado con una asignación de rol ACTIVE. Sin este guardia, abrir
   * `createDraft`/`classify`/`submitForReview`/`attachFile` al rol
   * `PRACTITIONER` habría dejado que un doctor escribiera en la contabilidad
   * de una práctica ajena con solo conocer su `practiceId`.
   *
   * Es un no-op para roles con autoridad administrativa/contable: ellos ya
   * están habilitados a operar cualquier práctica, igual que en el resto del
   * módulo.
   */
  private async assertPractitionerOwnsPractice(
    actor: AuthenticatedUser,
    practiceId: string,
  ): Promise<void> {
    if (
      actor.roles.includes('SECURITY_ADMIN') ||
      actor.roles.includes('ACCOUNTING_APPROVER')
    ) {
      return;
    }
    if (!actor.roles.includes('PRACTITIONER')) {
      // Ningún otro rol llega hoy a estas rutas (el `@Roles` del controlador
      // ya lo impide); no-op defensivo, no un permiso implícito.
      return;
    }
    if (!actor.practitionerProfileId) {
      // Tiene el rol pero el JWT no trae perfil profesional: no hay forma de
      // comprobar pertenencia, así que se deniega — lo contrario sería tratar
      // "no puedo verificar" como "está permitido".
      throw new PreconditionFailedException(
        'La cuenta no tiene un perfil profesional asociado',
        { actorId: actor.id },
      );
    }
    const practiceIds =
      await this.practiceTenantLookup.findActivePracticeIdsForPractitioner(
        actor.practitionerProfileId,
      );
    if (!practiceIds.includes(practiceId)) {
      throw new PreconditionFailedException(
        'El profesional no tiene una vinculación activa con esa práctica',
        { practiceId },
      );
    }
  }

  /**
   * UC-16-01 / atajo directo (crear+postear). Registra un asiento balanceado y lo
   * deja POSTEADO en un solo paso, saltándose el flujo de revisión/aprobación.
   *
   * DECISIÓN DE COMPATIBILIDAD (ALOVIDA C-17): el flujo canónico es
   * `createDraft → classify → submitForReview → approve → post`. Este atajo se
   * conserva para no romper integraciones/tests existentes y está controlado por:
   *   - ROL: el controlador lo restringe a `SECURITY_ADMIN` (`@Roles`), el mismo
   *     rol con autoridad de aprobación; equivale a auto-aprobar el asiento.
   *   - IDEMPOTENCIA: `transactionNumber` es único por práctica (409 si se repite),
   *     de modo que un reintento no duplica el asiento.
   * El posteo efectivo (líneas del mayor + `postedAt`) ocurre aquí, igual que en
   * `post`, aplicando las mismas validaciones (balance de partida doble y periodo
   * ABIERTO).
   */
  async postJournal(
    dto: PostJournalDto,
    actor: AuthenticatedUser,
  ): Promise<JournalTransactionResponseDto> {
    this.logger.info(
      {
        operation: 'accounting.journal.post',
        actorId: actor.id,
        lines: dto.lines.length,
      },
      'Posting journal transaction',
    );

    const { debitCents } = this.assertBalanced(dto.lines);

    return this.em.transactional(async (tx) => {
      // UC-16-05 (include): un asiento solo se postea en un periodo ABIERTO.
      if (dto.fiscalPeriodId) {
        const period = await this.fiscalRepo.findPeriodById(
          tx,
          dto.fiscalPeriodId,
        );
        if (!period) {
          throw new ResourceNotFoundException('Periodo fiscal no encontrado', {
            fiscalPeriodId: dto.fiscalPeriodId,
          });
        }
        if (period.statusConceptId !== ACCT.PERIOD_OPEN) {
          throw new PreconditionFailedException(
            'El periodo fiscal no está ABIERTO',
            {
              fiscalPeriodId: dto.fiscalPeriodId,
              status: period.statusConceptId,
            },
          );
        }
      }

      const number = dto.transactionNumber ?? this.generateNumber('JT');
      const clash = await this.journalRepo.findByTransactionNumber(
        tx,
        dto.practiceId,
        number,
      );
      if (clash) {
        throw new ConflictException(
          'El número de asiento ya existe en la práctica',
          {
            transactionNumber: number,
          },
        );
      }

      const now = new Date();
      const transaction = this.journalRepo.createTransaction(tx, {
        practiceId: dto.practiceId,
        transactionNumber: number,
        transactionTypeConceptId: ACCT.TXN_TYPE_STANDARD,
        transactionDate: new Date(dto.transactionDate),
        statusConceptId: ACCT.TXN_POSTED,
        fiscalPeriodId: dto.fiscalPeriodId,
        currencyConceptId: dto.currencyConceptId,
        totalAmount: fromCents(debitCents),
        description: dto.description,
        reference: dto.reference,
        postedAt: now,
        postedByUserId: actor.id,
        actorUserId: actor.id,
      });
      await tx.flush();

      await this.writeLines(
        tx,
        transaction.id,
        dto.lines,
        actor.id,
        dto.currencyConceptId,
      );

      await this.auditTrail.record(tx, actor, {
        action: 'JOURNAL_POSTED',
        entity: JOURNAL_AUDIT_ENTITY,
        entityId: transaction.id,
      });

      this.logger.info(
        {
          operation: 'accounting.journal.post',
          transactionId: transaction.id,
          total: fromCents(debitCents),
        },
        'Journal transaction posted',
      );

      return {
        id: transaction.id,
        transactionNumber: transaction.transactionNumber,
        status: transaction.statusConceptId,
        totalAmount: fromCents(debitCents),
        lineCount: dto.lines.length,
        postedAt: transaction.postedAt ?? null,
      };
    });
  }

  /**
   * ALOVIDA C-17 — estado inicial DRAFT. Registra el asiento y sus líneas del mayor
   * SIN postearlo: queda en DRAFT (`postedAt` nulo). El efecto en el mayor se aplaza
   * al comando `post`. Se valida la partida doble por adelantado para no aceptar un
   * borrador estructuralmente inválido; el periodo ABIERTO se valida en `post`.
   */
  async createDraft(
    dto: PostJournalDto,
    actor: AuthenticatedUser,
  ): Promise<JournalTransactionResponseDto> {
    const { debitCents } = this.assertBalanced(dto.lines);
    await this.assertPractitionerOwnsPractice(actor, dto.practiceId);

    return this.em.transactional(async (tx) => {
      const number = dto.transactionNumber ?? this.generateNumber('JT');
      const clash = await this.journalRepo.findByTransactionNumber(
        tx,
        dto.practiceId,
        number,
      );
      if (clash) {
        throw new ConflictException(
          'El número de asiento ya existe en la práctica',
          { transactionNumber: number },
        );
      }

      const transaction = this.journalRepo.createTransaction(tx, {
        practiceId: dto.practiceId,
        transactionNumber: number,
        transactionTypeConceptId: ACCT.TXN_TYPE_STANDARD,
        transactionDate: new Date(dto.transactionDate),
        statusConceptId: ACCT.TXN_DRAFT,
        fiscalPeriodId: dto.fiscalPeriodId,
        currencyConceptId: dto.currencyConceptId,
        totalAmount: fromCents(debitCents),
        description: dto.description,
        reference: dto.reference,
        sourceDocumentType: dto.sourceDocumentType,
        sourceDocumentId: dto.sourceDocumentId,
        actorUserId: actor.id,
      });
      await tx.flush();

      await this.writeLines(
        tx,
        transaction.id,
        dto.lines,
        actor.id,
        dto.currencyConceptId,
      );

      this.logger.info(
        {
          operation: 'accounting.journal.draft',
          transactionId: transaction.id,
          lines: dto.lines.length,
        },
        'Journal draft created',
      );

      return this.toResponse(transaction, dto.lines.length);
    });
  }

  /**
   * ALOVIDA C-17 — DRAFT → AUTO_CLASSIFIED. Clasificación automática por reglas.
   *
   * MCH-018: antes esto era un PLACEHOLDER que sólo cambiaba el estado, así que
   * el asiento quedaba "auto-clasificado" sin que ninguna regla se hubiera
   * evaluado. Ahora decide el motor versionado (`journal-classification.ts`):
   * sólo con una regla aplicable el asiento llega a AUTO_CLASSIFIED y se le
   * imputa el tipo que la regla determina. Sin regla, o con reglas en conflicto,
   * va a PENDING_REVIEW sin inventar tipo ni cuenta, y la respuesta dice por qué.
   *
   * @param id - Asiento a clasificar.
   * @param _dto - Cuerpo de la transición; no aporta datos a la decisión.
   * @param actor - Usuario autenticado que la solicita.
   * @returns El asiento con la evidencia de la clasificación.
   */
  async classify(
    id: string,
    _dto: JournalTransitionDto,
    actor: AuthenticatedUser,
  ): Promise<JournalTransactionResponseDto> {
    const owner = await this.journalRepo.findTransactionById(this.em, id);
    if (owner) {
      await this.assertPractitionerOwnsPractice(actor, owner.practiceId);
    }

    return this.em.transactional(async (tx) => {
      const txn = await this.journalRepo.findTransactionById(tx, id);
      if (!txn) {
        throw new ResourceNotFoundException('Asiento no encontrado', {
          transactionId: id,
        });
      }

      const resultado = clasificar({
        sourceDocumentType: txn.sourceDocumentType,
      });
      const destino =
        resultado.decision === 'CLASIFICADA'
          ? ACCT.TXN_AUTO_CLASSIFIED
          : ACCT.TXN_PENDING_REVIEW;
      this.assertTransition(txn.statusConceptId, destino);

      if (resultado.transactionTypeConceptId) {
        txn.transactionTypeConceptId = resultado.transactionTypeConceptId;
      }
      txn.statusConceptId = destino;
      touch(txn, actor.id);

      // La cadena WORM distingue las dos autoridades: una clasificación por
      // reglas no queda sellada igual que un envío a revisión humana.
      await this.auditTrail.record(tx, actor, {
        action:
          resultado.decision === 'CLASIFICADA'
            ? 'JOURNAL_AUTO_CLASSIFIED'
            : 'JOURNAL_CLASSIFICATION_REVIEW',
        entity: JOURNAL_AUDIT_ENTITY,
        entityId: id,
      });

      this.logger.info(
        {
          operation: 'accounting.journal.classify',
          transactionId: id,
          decision: resultado.decision,
          rulesetVersion: resultado.rulesetVersion,
          ruleId: resultado.ruleId,
          to: destino,
        },
        'Journal transaction classified',
      );

      return { ...this.toResponse(txn), classification: resultado };
    });
  }

  /**
   * ALOVIDA C-17 — AUTO_CLASSIFIED → PENDING_REVIEW.
   *
   * MCH-018: desde DRAFT la máquina admite ahora PENDING_REVIEW, pero ese camino
   * es sólo el de `classify` cuando ninguna regla aplica. Enviar a revisión un
   * borrador sin pasar por la clasificación se rechaza acá explícitamente.
   */
  submitForReview(
    id: string,
    _dto: JournalTransitionDto,
    actor: AuthenticatedUser,
  ): Promise<JournalTransactionResponseDto> {
    return this.transition(
      id,
      ACCT.TXN_PENDING_REVIEW,
      actor,
      'submit-review',
      undefined,
      (txn) => {
        if (txn.statusConceptId === ACCT.TXN_DRAFT) {
          throw new PreconditionFailedException(
            'El asiento debe clasificarse antes de enviarse a revisión',
            { transactionId: id },
          );
        }
      },
    );
  }

  /**
   * ALOVIDA C-17 — PENDING_REVIEW → APPROVED. Exige rol de aprobación y sella
   * quién/ cuándo aprobó (segregación de funciones respecto al posteo).
   */
  async approve(
    id: string,
    _dto: JournalTransitionDto,
    actor: AuthenticatedUser,
  ): Promise<JournalTransactionResponseDto> {
    this.assertApprovalRole(actor);
    return this.transition(id, ACCT.TXN_APPROVED, actor, 'approve', (txn) => {
      txn.approvedAt = new Date();
      txn.approvedByUserId = actor.id;
    });
  }

  /**
   * ALOVIDA C-17 — APPROVED → POSTED. ES el posteo efectivo en el mayor: valida la
   * partida doble (recalculada desde las líneas persistidas) y que el periodo esté
   * ABIERTO, y sella `postedAt`/`postedByUserId`. Solo transita desde APPROVED.
   */
  async post(
    id: string,
    dto: JournalTransitionDto,
    actor: AuthenticatedUser,
  ): Promise<JournalTransactionResponseDto> {
    return this.em.transactional(async (tx) => {
      const txn = await this.journalRepo.findTransactionById(tx, id);
      if (!txn) {
        throw new ResourceNotFoundException('Asiento no encontrado', {
          transactionId: id,
        });
      }
      this.assertTransition(txn.statusConceptId, ACCT.TXN_POSTED);

      // Permite enlazar el periodo en el posteo si el borrador no lo fijó.
      if (dto.fiscalPeriodId && !txn.fiscalPeriodId) {
        txn.fiscalPeriodId = dto.fiscalPeriodId;
      }

      // UC-16-05 (include): un asiento solo se postea en un periodo ABIERTO.
      if (txn.fiscalPeriodId) {
        const period = await this.fiscalRepo.findPeriodById(
          tx,
          txn.fiscalPeriodId,
        );
        if (!period) {
          throw new ResourceNotFoundException('Periodo fiscal no encontrado', {
            fiscalPeriodId: txn.fiscalPeriodId,
          });
        }
        if (period.statusConceptId !== ACCT.PERIOD_OPEN) {
          throw new PreconditionFailedException(
            'El periodo fiscal no está ABIERTO',
            {
              fiscalPeriodId: txn.fiscalPeriodId,
              status: period.statusConceptId,
            },
          );
        }
      }

      const entries = await this.journalRepo.ledgerEntriesForTransaction(
        tx,
        id,
      );
      const debitCents = this.assertBalancedEntries(entries);

      const now = new Date();
      txn.statusConceptId = ACCT.TXN_POSTED;
      txn.postedAt = now;
      txn.postedByUserId = actor.id;
      touch(txn, actor.id);

      await this.auditTrail.record(tx, actor, {
        action: 'JOURNAL_POSTED',
        entity: JOURNAL_AUDIT_ENTITY,
        entityId: txn.id,
      });

      this.logger.info(
        {
          operation: 'accounting.journal.post',
          transactionId: id,
          total: fromCents(debitCents),
        },
        'Journal transaction posted from APPROVED',
      );

      return this.toResponse(txn, entries.length);
    });
  }

  /** UC-16-03: crea una transacción de reversa con líneas espejo (débito<->crédito). */
  async reverseJournal(
    transactionId: string,
    dto: ReverseJournalDto,
    actor: AuthenticatedUser,
  ): Promise<JournalTransactionResponseDto> {
    this.logger.info(
      {
        operation: 'accounting.journal.reverse',
        transactionId,
        actorId: actor.id,
      },
      'Reversing journal transaction',
    );

    return this.em.transactional(async (tx) => {
      const original = await this.journalRepo.findTransactionById(
        tx,
        transactionId,
      );
      if (!original) {
        throw new ResourceNotFoundException('Asiento no encontrado', {
          transactionId,
        });
      }
      // ALOVIDA C-17: la reversa es la única transición desde POSTED (POSTED→REVERSED);
      // `assertTransition` rechaza (422) reversar un asiento en cualquier otro estado.
      this.assertTransition(original.statusConceptId, ACCT.TXN_REVERSED);
      const existingLink = await this.journalRepo.findLink(
        tx,
        transactionId,
        ACCT.RELATION_REVERSES,
      );
      if (existingLink) {
        throw new ConflictException('El asiento ya fue reversado', {
          transactionId,
        });
      }

      const originalLines = await this.journalRepo.ledgerEntriesForTransaction(
        tx,
        transactionId,
      );
      const now = new Date();
      const reversal = this.journalRepo.createTransaction(tx, {
        practiceId: original.practiceId,
        transactionNumber: this.generateNumber('REV'),
        transactionTypeConceptId: ACCT.TXN_TYPE_REVERSAL,
        transactionDate: now,
        statusConceptId: ACCT.TXN_POSTED,
        fiscalPeriodId: dto.fiscalPeriodId ?? original.fiscalPeriodId,
        currencyConceptId: original.currencyConceptId,
        totalAmount: original.totalAmount,
        description: `Reversa de ${original.transactionNumber}`,
        reference: original.transactionNumber,
        postedAt: now,
        postedByUserId: actor.id,
        actorUserId: actor.id,
      });
      await tx.flush();

      for (const line of originalLines) {
        const invertedDirection =
          line.directionConceptId === ACCT.DIRECTION_DEBIT
            ? ACCT.DIRECTION_CREDIT
            : ACCT.DIRECTION_DEBIT;
        const mirror = this.journalRepo.createLedgerEntry(tx, {
          transactionId: reversal.id,
          accountId: line.accountId,
          directionConceptId: invertedDirection,
          amount: line.amount,
          lineNo: line.lineNo,
          costCenterId: line.costCenterId,
          currencyConceptId: line.currencyConceptId,
          fxRate: line.fxRate,
          amountBase: line.amountBase,
          memo: line.memo,
          actorUserId: actor.id,
        });
        await tx.flush();

        const originalAssignment = await this.journalRepo.assignmentForEntry(
          tx,
          line.id,
        );
        this.journalRepo.createAssignment(tx, {
          ledgerEntryId: mirror.id,
          costCenterId: originalAssignment?.costCenterId ?? line.costCenterId,
          profitCenterId: originalAssignment?.profitCenterId,
          segmentId: originalAssignment?.segmentId,
          assetId: originalAssignment?.assetId,
          liabilityId: originalAssignment?.liabilityId,
          subledgerAccountId: originalAssignment?.subledgerAccountId,
          assignmentSourceConceptId: ACCT.TXN_TYPE_REVERSAL,
          actorUserId: actor.id,
        });
      }

      this.journalRepo.createLink(tx, {
        sourceTransactionId: transactionId,
        targetTransactionId: reversal.id,
        relationTypeConceptId: ACCT.RELATION_REVERSES,
        reasonText: dto.reason,
        actorUserId: actor.id,
      });

      original.statusConceptId = ACCT.TXN_REVERSED;
      touch(original, actor.id);

      await this.auditTrail.record(tx, actor, {
        action: 'JOURNAL_REVERSED',
        entity: JOURNAL_AUDIT_ENTITY,
        entityId: original.id,
      });

      return {
        id: reversal.id,
        transactionNumber: reversal.transactionNumber,
        status: reversal.statusConceptId,
        totalAmount: reversal.totalAmount ?? '0.00',
        lineCount: originalLines.length,
        postedAt: reversal.postedAt ?? null,
      };
    });
  }

  /** UC-16-13: adjunta un documento soporte (ya en object storage) al asiento. */
  async attachFile(
    transactionId: string,
    dto: AttachFileDto,
    actor: AuthenticatedUser,
  ): Promise<AccountingStatusDto> {
    const owner = await this.journalRepo.findTransactionById(
      this.em,
      transactionId,
    );
    if (owner) {
      await this.assertPractitionerOwnsPractice(actor, owner.practiceId);
    }

    return this.em.transactional(async (tx) => {
      const transaction = await this.journalRepo.findTransactionById(
        tx,
        transactionId,
      );
      if (!transaction) {
        throw new ResourceNotFoundException('Asiento no encontrado', {
          transactionId,
        });
      }
      const file = this.journalRepo.createFile(tx, {
        transactionId,
        fileId: dto.fileId,
        categoryConceptId:
          dto.categoryConceptId ?? CONCEPTS.FILE_CATEGORY_DOCUMENT,
        actorUserId: actor.id,
      });
      await tx.flush();
      this.logger.info(
        {
          operation: 'accounting.journal.attach',
          transactionId,
          fileLinkId: file.id,
        },
        'Document attached to transaction',
      );
      return { ok: true, id: file.id };
    });
  }

  /** UC-16-02: resuelve la cuenta objetivo por regla de determinación vigente. */
  async determineAccounts(
    dto: DetermineAccountsDto,
  ): Promise<DeterminedAccountResponseDto> {
    const em = this.em.fork();
    const rule = await this.accountsRepo.findActiveRule(
      em,
      dto.tenantId,
      dto.postingScenarioConceptId,
      ACCT.RULE_ACTIVE,
    );
    if (!rule) {
      throw new ResourceNotFoundException(
        'No hay regla de determinación vigente para el escenario',
        {
          tenantId: dto.tenantId,
          postingScenarioConceptId: dto.postingScenarioConceptId,
        },
      );
    }
    return {
      ruleId: rule.id,
      targetAccountId: rule.targetAccountId,
      priority: rule.priority ?? null,
    };
  }

  /** Soporte: da de alta una cuenta del plan contable (necesaria para postear). */
  async createAccount(
    dto: CreateAccountDto,
    actor: AuthenticatedUser,
  ): Promise<AccountResponseDto> {
    return this.em.transactional(async (tx) => {
      const clash = await this.accountsRepo.findByCode(
        tx,
        dto.practiceId,
        dto.code,
      );
      if (clash) {
        throw new ConflictException(
          'Ya existe una cuenta con ese código en la práctica',
          {
            code: dto.code,
          },
        );
      }
      const account = this.accountsRepo.create(tx, {
        practiceId: dto.practiceId,
        code: dto.code,
        name: dto.name,
        accountTypeConceptId: ACCOUNT_TYPE_CONCEPT[dto.accountType],
        normalBalanceConceptId: NORMAL_BALANCE_CONCEPT[dto.normalBalance],
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        isConfigurable: true,
        isPostable: dto.isPostable ?? true,
        currencyConceptId: dto.currencyConceptId,
        actorUserId: actor.id,
      });
      await tx.flush();
      return {
        id: account.id,
        code: account.code,
        name: account.name,
        status: account.statusConceptId,
        isPostable: account.isPostable,
      };
    });
  }

  /**
   * Inserta las N líneas del mayor y su asignación 1:1. Reutilizado por otros
   * servicios (devengo, activos, pasivos, clearing) que producen un asiento.
   */
  async writeLines(
    tx: EntityManager,
    transactionId: string,
    lines: LedgerLineDto[],
    actorUserId: string,
    defaultCurrencyConceptId?: string,
  ): Promise<string[]> {
    const entryIds: string[] = [];
    let lineNo = 1;
    for (const line of lines) {
      const entry = this.journalRepo.createLedgerEntry(tx, {
        transactionId,
        accountId: line.accountId,
        directionConceptId:
          line.direction === 'DEBIT'
            ? ACCT.DIRECTION_DEBIT
            : ACCT.DIRECTION_CREDIT,
        amount: line.amount,
        lineNo: lineNo++,
        costCenterId: line.costCenterId,
        currencyConceptId: line.currencyConceptId ?? defaultCurrencyConceptId,
        fxRate: line.fxRate,
        amountBase: line.amountBase,
        memo: line.memo,
        actorUserId,
      });
      await tx.flush();
      this.journalRepo.createAssignment(tx, {
        ledgerEntryId: entry.id,
        costCenterId: line.costCenterId,
        profitCenterId: line.profitCenterId,
        assignmentSourceConceptId: ACCT.TXN_TYPE_STANDARD,
        actorUserId,
      });
      entryIds.push(entry.id);
    }
    return entryIds;
  }

  /**
   * Guarda de la máquina de estados: rechaza (422) cualquier transición que no
   * esté declarada en `ALLOWED_TRANSITIONS`. Único punto de verdad del flujo.
   */
  assertTransition(from: string, to: string): void {
    const allowed = ALLOWED_TRANSITIONS[from] ?? [];
    if (!allowed.includes(to)) {
      throw new PreconditionFailedException('Transición de estado inválida', {
        from,
        to,
      });
    }
  }

  /**
   * Transición genérica de estado: carga el asiento, valida la transición y aplica
   * el nuevo estado (más una mutación opcional específica del comando).
   *
   * @param id - Asiento a transitar.
   * @param to - Estado destino.
   * @param actor - Usuario autenticado que la solicita.
   * @param operation - Nombre del comando, para la traza.
   * @param mutate - Mutación específica del comando, tras cambiar el estado.
   * @param guard - Comprobación previa a la transición sobre el estado actual.
   * @returns El asiento ya transitado.
   */
  private async transition(
    id: string,
    to: string,
    actor: AuthenticatedUser,
    operation: string,
    mutate?: (txn: {
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
      /**
       * Valor de approved at mantenido por la instancia.
       */
      approvedAt?: Date;
      /**
       * Identificador asociado a approved by user.
       */
      approvedByUserId?: string;
    }) => void,
    guard?: (txn: {
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
    }) => void,
  ): Promise<JournalTransactionResponseDto> {
    // Fuera de la transacción: es una lectura contra `practice`, no contra
    // `accounting`, y no necesita compartir el lock de la fila del asiento.
    const owner = await this.journalRepo.findTransactionById(this.em, id);
    if (owner) {
      await this.assertPractitionerOwnsPractice(actor, owner.practiceId);
    }

    return this.em.transactional(async (tx) => {
      const txn = await this.journalRepo.findTransactionById(tx, id);
      if (!txn) {
        throw new ResourceNotFoundException('Asiento no encontrado', {
          transactionId: id,
        });
      }
      guard?.(txn);
      this.assertTransition(txn.statusConceptId, to);
      txn.statusConceptId = to;
      mutate?.(txn);
      touch(txn, actor.id);
      this.logger.info(
        { operation: `accounting.journal.${operation}`, transactionId: id, to },
        'Journal transaction transitioned',
      );
      return this.toResponse(txn);
    });
  }

  /** Exige que el actor porte un rol con autoridad de aprobación (defensa en profundidad). */
  private assertApprovalRole(actor: AuthenticatedUser): void {
    const roles = actor.roles ?? [];
    if (!roles.some((r) => APPROVAL_ROLES.includes(r))) {
      throw new PreconditionFailedException(
        'Se requiere un rol con autoridad de aprobación para aprobar el asiento',
        { requiredAnyOf: APPROVAL_ROLES },
      );
    }
  }

  /** Serializa una transacción a la respuesta estándar del asiento. */
  private toResponse(
    txn: {
      /**
       * Identificador único de la instancia.
       */
      id: string;
      /**
       * Valor de transaction number mantenido por la instancia.
       */
      transactionNumber: string;
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
      /**
       * Valor de total amount mantenido por la instancia.
       */
      totalAmount?: string;
      /**
       * Valor de posted at mantenido por la instancia.
       */
      postedAt?: Date;
    },
    lineCount = 0,
  ): JournalTransactionResponseDto {
    return {
      id: txn.id,
      transactionNumber: txn.transactionNumber,
      status: txn.statusConceptId,
      totalAmount: txn.totalAmount ?? '0.00',
      lineCount,
      postedAt: txn.postedAt ?? null,
    };
  }

  /** Recalcula la partida doble desde las líneas persistidas del mayor (usado por `post`). */
  private assertBalancedEntries(
    entries: {
      /**
       * Identificador asociado a direction concept.
       */
      directionConceptId: string; /**
       * Valor de amount mantenido por la instancia.
       */
      amount: string;
    }[],
  ): number {
    const debitCents = sumCents(
      entries
        .filter((e) => e.directionConceptId === ACCT.DIRECTION_DEBIT)
        .map((e) => e.amount),
    );
    const creditCents = sumCents(
      entries
        .filter((e) => e.directionConceptId === ACCT.DIRECTION_CREDIT)
        .map((e) => e.amount),
    );
    if (debitCents <= 0 || debitCents !== creditCents) {
      throw new PreconditionFailedException(
        'El asiento no balancea (debe != haber)',
        { debit: fromCents(debitCents), credit: fromCents(creditCents) },
      );
    }
    return debitCents;
  }

  /** Valida partida doble: suma de débitos == suma de créditos. Lanza 422 si no. */
  private assertBalanced(lines: LedgerLineDto[]): {
    /**
     * Valor de debit cents mantenido por la instancia.
     */
    debitCents: number;
    /**
     * Valor de credit cents mantenido por la instancia.
     */
    creditCents: number;
  } {
    const debitCents = sumCents(
      lines.filter((l) => l.direction === 'DEBIT').map((l) => l.amount),
    );
    const creditCents = sumCents(
      lines.filter((l) => l.direction === 'CREDIT').map((l) => l.amount),
    );
    if (debitCents <= 0) {
      throw new PreconditionFailedException('El asiento no tiene importe', {});
    }
    if (debitCents !== creditCents) {
      throw new PreconditionFailedException(
        'El asiento no balancea (debe != haber)',
        {
          debit: fromCents(debitCents),
          credit: fromCents(creditCents),
        },
      );
    }
    return { debitCents, creditCents };
  }

  /**
   * Crea generate number.
   *
   * @param prefix - Valor de prefix requerido por la operación.
   * @returns Resultado de generate number conforme al contrato `string`.
   */
  private generateNumber(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
  }
}
