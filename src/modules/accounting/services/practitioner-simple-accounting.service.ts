import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  ConflictException,
  PreconditionFailedException,
  requireTenantId,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { assertResourceInTenant } from '../../../common/tenant/resource-scope';
import { PractitionerSimpleAccountingRepository } from '../repositories';
import { PractitionerAccountingService } from './practitioner-accounting.service';
import { AccountingScopeService } from './accounting-scope.service';
import { PracticeTenantLookupService } from '../../practice/services';
import { Appointments, Encounters } from '../../clinical/entities';
import { CLIN } from '../../clinical/clinical.concepts';
import { Invoices } from '../../billing/entities';
import { BILL } from '../../billing/billing.concepts';
import {
  ClaimAdjudicationVersions,
  InsuranceClaims,
} from '../../insurance/entities';
import { INS } from '../../insurance/domain/insurance.concepts';
import type {
  PractitionerSimpleAccounts,
  PractitionerSimpleRecords,
  PractitionerSimpleTransactions,
} from '../entities';
import { AccountingErrorReason } from '../accounting.error-reasons';
import { fromCents, toCents } from './money';
import {
  CLASS_OF_KIND,
  CODE_PREFIX,
  GENERAL_ACCOUNTS,
  accountNameProblem,
  amountProblem,
  dateProblem,
  descriptionProblem,
  fromIsoDay,
  isAccountClass,
  isRecordKind,
  isUuid,
  normalizeAmount,
  summaryRange,
  toIsoDay,
  withoutAccents,
} from './practitioner-simple-accounting.rules';
import type {
  CreateSimpleAccountDto,
  CreateSimpleRecordDto,
  CreateSimpleTransactionDto,
  SimpleAccountDto,
  SimpleAccountInputDto,
  SimpleAccountsResponseDto,
  SimpleAccountClass,
  SimplePractitionerSummaryDto,
  SimpleRecordDto,
  SimpleRecordInputDto,
  SimpleRecordKind,
  SimpleRecordsResponseDto,
  SimpleSummaryPeriod,
  SimpleTransactionDto,
  SimpleTransactionInputDto,
  SimpleTransactionsResponseDto,
} from '../dto';

/**
 * P49 — la contabilidad simple del doctor.
 *
 * Es la contabilidad llana del consultorio: cuentas con su clase, gastos,
 * activos y deudas (cuyo tipo ES una cuenta de la clase que corresponde) y
 * transacciones debe/haber. **No reemplaza los libros**
 * (`/accounting/journal-transactions`) ni su flujo de aprobación: ninguna
 * operación de aquí genera un asiento (PENDIENTES-BACKEND §P49.3).
 *
 * La autoridad es esta capa: todas las rutas exigen `PRACTITIONER` y
 * {@link PractitionerAccountingService.assertOwnsPractice} verifica la
 * vinculación activa con la práctica. Las operaciones por `:id` resuelven la
 * práctica de la fila y verifican la vinculación contra ella.
 *
 * Los motivos de rechazo van en castellano y se muestran tal cual en el front:
 * validación → 422, nombre repetido o cuenta en uso → 409.
 */
@Injectable()
export class PractitionerSimpleAccountingService {
  constructor(
    private readonly em: EntityManager,
    private readonly repo: PractitionerSimpleAccountingRepository,
    private readonly practitionerAccounting: PractitionerAccountingService,
    private readonly practiceTenantLookup: PracticeTenantLookupService,
    private readonly scope: AccountingScopeService,
  ) {}

  /**
   * Práctica de una escritura: el profesional está vinculado a ella (misma regla
   * que sus hermanos) y es del tenant activo (ACC-01, como `createOwnLiability`).
   */
  private async ownPracticeForWrite(
    actor: AuthenticatedUser,
    practiceId: string,
  ): Promise<void> {
    await this.practitionerAccounting.assertOwnsPractice(actor, practiceId);
    await this.scope.practice(practiceId);
  }

  /**
   * Acota una fila cargada por UUID al tenant activo, a través de su práctica
   * (ACC-01). Lo ajeno responde idéntico a lo inexistente: 404, mismo mensaje y
   * `reason`, sin `details`. Después, la vinculación del profesional con la
   * práctica de la fila.
   */
  private async ownRow<T extends { practiceId: string }>(
    row: T | null,
    actor: AuthenticatedUser,
    failure: { message: string; reason: AccountingErrorReason },
  ): Promise<T> {
    const tenantId = requireTenantId();
    const owner = row
      ? await this.practiceTenantLookup.findTenantOfPractice(row.practiceId)
      : null;
    const scoped = assertResourceInTenant(row, owner, tenantId, failure);
    await this.practitionerAccounting.assertOwnsPractice(
      actor,
      scoped.practiceId,
    );
    return scoped;
  }

  /* ---- los tres números -------------------------------------------------- */

  /**
   * Pacientes atendidos, cuánto se cobró y cuánto se espera de las aseguradoras.
   *
   * - `patientsSeen` / `consultations`: citas del profesional en esa práctica
   *   con estado «cumplida» (`APPT_FULFILLED`) cuyo inicio cae en el período.
   * - `collected`: facturas pagadas de esa práctica, de encuentros del
   *   profesional, emitidas en el período (suma de `paid_total`).
   * - `expectedFromInsurers`: **a hoy**, sin período. Solicitudes del
   *   profesional enviadas sin dictamen (por lo facturado) más las aprobadas,
   *   total o parcialmente, y todavía sin pagar (por lo aprobado).
   */
  async summary(
    practiceId: string,
    period: SimpleSummaryPeriod | undefined,
    actor: AuthenticatedUser,
  ): Promise<SimplePractitionerSummaryDto> {
    const practitionerProfileId =
      await this.practitionerAccounting.assertOwnsPractice(actor, practiceId);
    const range = summaryRange(period, new Date());
    const em = this.em.fork();

    const tenantId =
      await this.practiceTenantLookup.findTenantOfPractice(practiceId);

    const ownAppointments = tenantId
      ? await em.find(Appointments, { practitionerProfileId, tenantId })
      : [];
    const attended = ownAppointments.filter(
      (a) =>
        a.statusConceptId === CLIN.APPOINTMENT_FULFILLED &&
        a.startAt >= range.fromInstant &&
        a.startAt <= range.toInstant,
    );

    const encounterIds = await this.ownEncounterIds(
      em,
      practitionerProfileId,
      ownAppointments.map((a) => a.id),
    );

    const collectedCents = await this.collectedCents(
      em,
      practiceId,
      encounterIds,
      range.from,
      range.to,
    );
    const pending = await this.pendingFromInsurers(
      em,
      practiceId,
      encounterIds,
    );

    return {
      period: range.period,
      from: range.from,
      to: range.to,
      patientsSeen: new Set(attended.map((a) => a.patientProfileId)).size,
      consultations: attended.length,
      collected: fromCents(collectedCents),
      expectedFromInsurers: fromCents(pending.cents),
      pendingClaims: pending.claims,
    };
  }

  /** Encuentros del profesional: los que lo tienen de principal o salen de una cita suya. */
  private async ownEncounterIds(
    em: EntityManager,
    practitionerProfileId: string,
    appointmentIds: readonly string[],
  ): Promise<string[]> {
    const encounters = await em.find(Encounters, {
      $or: [
        { primaryPractitionerId: practitionerProfileId },
        ...(appointmentIds.length > 0
          ? [{ appointmentId: { $in: [...appointmentIds] } }]
          : []),
      ],
    });
    return encounters.map((e) => e.id);
  }

  private async collectedCents(
    em: EntityManager,
    practiceId: string,
    encounterIds: readonly string[],
    from: string,
    to: string,
  ): Promise<number> {
    if (encounterIds.length === 0) return 0;
    const invoices = await em.find(Invoices, {
      practiceId,
      statusConceptId: BILL.INVOICE_PAID,
      encounterId: { $in: [...encounterIds] },
      issueDate: { $gte: fromIsoDay(from), $lte: fromIsoDay(to) },
    });
    return invoices.reduce(
      (total, invoice) =>
        total + (invoice.paidTotal ? toCents(invoice.paidTotal) : 0),
      0,
    );
  }

  private async pendingFromInsurers(
    em: EntityManager,
    practiceId: string,
    encounterIds: readonly string[],
  ): Promise<{ cents: number; claims: number }> {
    if (encounterIds.length === 0) return { cents: 0, claims: 0 };
    const claims = await em.find(InsuranceClaims, {
      billingProviderTypeConceptId: INS.BILLING_PROVIDER_TYPE_PRACTICE,
      billingProviderEntityId: practiceId,
      encounterId: { $in: [...encounterIds] },
      statusConceptId: { $in: [INS.CLAIM_SUBMITTED, INS.CLAIM_ADJUDICATED] },
    });
    if (claims.length === 0) return { cents: 0, claims: 0 };

    const adjudicatedIds = claims
      .filter((c) => c.statusConceptId === INS.CLAIM_ADJUDICATED)
      .map((c) => c.id);
    const versions =
      adjudicatedIds.length > 0
        ? await em.find(ClaimAdjudicationVersions, {
            insuranceClaimId: { $in: adjudicatedIds },
          })
        : [];
    const superseded = new Set(
      versions.map((v) => v.supersedesVersionId).filter((id) => id != null),
    );
    const currentByClaim = new Map<string, ClaimAdjudicationVersions>();
    for (const version of versions) {
      if (superseded.has(version.id)) continue;
      if (!currentByClaim.has(version.insuranceClaimId)) {
        currentByClaim.set(version.insuranceClaimId, version);
      }
    }

    let cents = 0;
    let count = 0;
    for (const claim of claims) {
      let amount: string | undefined;
      if (claim.statusConceptId === INS.CLAIM_SUBMITTED) {
        amount = claim.totalAmount;
      } else {
        const version = currentByClaim.get(claim.id);
        const approved =
          version?.outcomeConceptId === INS.ADJ_OUTCOME_APPROVED ||
          version?.outcomeConceptId === INS.ADJ_OUTCOME_PARTIAL;
        if (approved) amount = version?.totalApprovedAmount;
      }
      if (amount == null) continue;
      cents += toCents(amount);
      count += 1;
    }
    return { cents, claims: count };
  }

  /* ---- cuentas ----------------------------------------------------------- */

  async listAccounts(
    practiceId: string,
    actor: AuthenticatedUser,
  ): Promise<SimpleAccountsResponseDto> {
    await this.practitionerAccounting.assertOwnsPractice(actor, practiceId);
    const em = this.em.fork();
    await this.ensureGeneralAccounts(em, practiceId, actor.id);
    const rows = await this.repo.listAccounts(em, practiceId);
    return {
      items: rows
        .sort((a, b) => a.code.localeCompare(b.code, 'es', { numeric: true }))
        .map(toAccountDto),
    };
  }

  async createAccount(
    dto: CreateSimpleAccountDto,
    actor: AuthenticatedUser,
  ): Promise<SimpleAccountDto> {
    await this.ownPracticeForWrite(actor, dto.practiceId);
    const name = this.validName(dto.name);
    const accountClass = this.validClass(dto.accountClass);
    const em = this.em.fork();
    return em.transactional(async (tx) => {
      await this.ensureGeneralAccounts(tx, dto.practiceId, actor.id);
      const all = await this.repo.listAccounts(tx, dto.practiceId);
      this.assertNameFree(all, accountClass, name, undefined);
      const created = this.repo.createAccount(tx, {
        practiceId: dto.practiceId,
        code: nextCode(all, accountClass),
        name,
        accountClass,
        seeded: false,
        actorUserId: actor.id,
      });
      await tx.flush();
      return toAccountDto(created);
    });
  }

  async updateAccount(
    id: string,
    dto: SimpleAccountInputDto,
    actor: AuthenticatedUser,
  ): Promise<SimpleAccountDto> {
    const em = this.em.fork();
    const account = await this.requireAccount(em, id, actor);
    const name = this.validName(dto.name);
    const accountClass =
      dto.accountClass === undefined
        ? (account.accountClass as SimpleAccountClass)
        : this.validClass(dto.accountClass);

    if (accountClass !== account.accountClass) {
      if (
        account.seeded ||
        (await this.repo.countAccountUsage(em, account.id)) > 0
      ) {
        throw new ConflictException(
          'No se puede cambiar la clase de una cuenta general o que ya se usa.',
          { accountId: id },
          account.seeded
            ? AccountingErrorReason.SIMPLE_ACCOUNT_SEEDED
            : AccountingErrorReason.SIMPLE_ACCOUNT_IN_USE,
        );
      }
    }
    const all = await this.repo.listAccounts(em, account.practiceId);
    this.assertNameFree(all, accountClass, name, account.id);

    account.name = name;
    account.accountClass = accountClass;
    touch(account, actor.id);
    await em.flush();
    return toAccountDto(account);
  }

  async deleteAccount(id: string, actor: AuthenticatedUser): Promise<void> {
    const em = this.em.fork();
    const account = await this.requireAccount(em, id, actor);
    if (account.seeded) {
      throw new ConflictException(
        'Es una cuenta general: se puede renombrar, no borrar.',
        { accountId: id },
        AccountingErrorReason.SIMPLE_ACCOUNT_SEEDED,
      );
    }
    const uses = await this.repo.countAccountUsage(em, account.id);
    if (uses > 0) {
      throw new ConflictException(
        `La usa${uses === 1 ? '' : 'n'} ${uses} registro${uses === 1 ? '' : 's'}: cambiales la cuenta antes de borrarla.`,
        { accountId: id, uses },
        AccountingErrorReason.SIMPLE_ACCOUNT_IN_USE,
      );
    }
    em.remove(account);
    await em.flush();
  }

  /**
   * Siembra las 26 cuentas generales de la práctica si todavía no las tiene.
   *
   * Idempotente y segura ante pedidos simultáneos: la siembra es un
   * `INSERT … ON CONFLICT (practice_id, code) DO NOTHING`
   * ({@link PractitionerSimpleAccountingRepository.seedAccounts}), de modo que si
   * dos pedidos llegan a la vez al primer acceso ninguno falla contra el UNIQUE y
   * la práctica queda con cada cuenta general una sola vez. Nunca pisa una fila
   * existente: un renombre del doctor sobrevive.
   */
  private async ensureGeneralAccounts(
    em: EntityManager,
    practiceId: string,
    actorUserId: string,
  ): Promise<void> {
    if ((await this.repo.countSeededAccounts(em, practiceId)) > 0) return;
    await this.repo.seedAccounts(em, practiceId, GENERAL_ACCOUNTS, actorUserId);
  }

  private async requireAccount(
    em: EntityManager,
    id: string,
    actor: AuthenticatedUser,
  ): Promise<PractitionerSimpleAccounts> {
    const account = isUuid(id) ? await this.repo.findAccount(em, id) : null;
    return this.ownRow(account, actor, {
      message: 'Cuenta no encontrada',
      reason: AccountingErrorReason.SIMPLE_ACCOUNT_NOT_FOUND,
    });
  }

  private validName(name: string | undefined): string {
    const problem = accountNameProblem(name);
    if (problem) this.invalid(problem);
    return (name as string).trim();
  }

  private validClass(value: unknown): SimpleAccountClass {
    if (!isAccountClass(value)) this.invalid('Elija la clase de la cuenta.');
    return value;
  }

  /** Nombre único por clase dentro de la práctica, sin distinguir tildes ni mayúsculas. */
  private assertNameFree(
    accounts: readonly PractitionerSimpleAccounts[],
    accountClass: SimpleAccountClass,
    name: string,
    exceptId: string | undefined,
  ): void {
    const wanted = withoutAccents(name);
    const taken = accounts.some(
      (a) =>
        a.id !== exceptId &&
        a.accountClass === accountClass &&
        withoutAccents(a.name) === wanted,
    );
    if (taken) {
      throw new ConflictException(
        'Ya tiene una cuenta con ese nombre en esa clase.',
        { accountClass },
        AccountingErrorReason.SIMPLE_ACCOUNT_DUPLICATE_NAME,
      );
    }
  }

  /* ---- gastos, activos y deudas ------------------------------------------ */

  async listRecords(
    practiceId: string,
    kind: SimpleRecordKind | undefined,
    actor: AuthenticatedUser,
  ): Promise<SimpleRecordsResponseDto> {
    await this.practitionerAccounting.assertOwnsPractice(actor, practiceId);
    const em = this.em.fork();
    const rows = await this.repo.listRecords(em, practiceId, kind);
    return { items: rows.map(toRecordDto) };
  }

  async createRecord(
    dto: CreateSimpleRecordDto,
    actor: AuthenticatedUser,
  ): Promise<SimpleRecordDto> {
    await this.ownPracticeForWrite(actor, dto.practiceId);
    if (!isRecordKind(dto.kind))
      this.invalid('Falta qué es: gasto, activo o deuda.');
    const kind = dto.kind;
    const em = this.em.fork();
    await this.assertRecordContent(em, dto, kind, dto.practiceId);
    const created = this.repo.createRecord(em, {
      practiceId: dto.practiceId,
      kind,
      recordDate: fromIsoDay(dto.date as string),
      accountId: dto.accountId as string,
      description: (dto.description as string).trim(),
      amount: normalizeAmount(dto.amount as string),
      actorUserId: actor.id,
    });
    await em.flush();
    return toRecordDto(created);
  }

  async updateRecord(
    id: string,
    dto: SimpleRecordInputDto,
    actor: AuthenticatedUser,
  ): Promise<SimpleRecordDto> {
    const em = this.em.fork();
    const record = await this.requireRecord(em, id, actor);
    // El `kind` de un registro no cambia: el tipo se valida contra el de siempre.
    const kind = record.kind as SimpleRecordKind;
    await this.assertRecordContent(em, dto, kind, record.practiceId);
    record.recordDate = fromIsoDay(dto.date as string);
    record.accountId = dto.accountId as string;
    record.description = (dto.description as string).trim();
    record.amount = normalizeAmount(dto.amount as string);
    touch(record, actor.id);
    await em.flush();
    return toRecordDto(record);
  }

  async deleteRecord(id: string, actor: AuthenticatedUser): Promise<void> {
    const em = this.em.fork();
    const record = await this.requireRecord(em, id, actor);
    em.remove(record);
    await em.flush();
  }

  private async assertRecordContent(
    em: EntityManager,
    dto: SimpleRecordInputDto,
    kind: SimpleRecordKind,
    practiceId: string,
  ): Promise<void> {
    const account = isUuid(dto.accountId)
      ? await this.repo.findAccount(em, dto.accountId)
      : null;
    if (!account || account.practiceId !== practiceId) {
      this.invalid('Elija el tipo.');
    }
    if (account.accountClass !== CLASS_OF_KIND[kind]) {
      this.invalid('Ese tipo no corresponde.');
    }
    const problem =
      descriptionProblem(dto.description) ??
      dateProblem(dto.date) ??
      amountProblem(dto.amount);
    if (problem) this.invalid(problem);
  }

  private async requireRecord(
    em: EntityManager,
    id: string,
    actor: AuthenticatedUser,
  ): Promise<PractitionerSimpleRecords> {
    const record = isUuid(id) ? await this.repo.findRecord(em, id) : null;
    return this.ownRow(record, actor, {
      message: 'Registro no encontrado',
      reason: AccountingErrorReason.SIMPLE_RECORD_NOT_FOUND,
    });
  }

  /* ---- transacciones debe/haber ------------------------------------------ */

  async listTransactions(
    practiceId: string,
    actor: AuthenticatedUser,
  ): Promise<SimpleTransactionsResponseDto> {
    await this.practitionerAccounting.assertOwnsPractice(actor, practiceId);
    const em = this.em.fork();
    const rows = await this.repo.listTransactions(em, practiceId);
    return { items: rows.map(toTransactionDto) };
  }

  async createTransaction(
    dto: CreateSimpleTransactionDto,
    actor: AuthenticatedUser,
  ): Promise<SimpleTransactionDto> {
    await this.ownPracticeForWrite(actor, dto.practiceId);
    const em = this.em.fork();
    await this.assertTransactionContent(em, dto, dto.practiceId);
    const created = this.repo.createTransaction(em, {
      practiceId: dto.practiceId,
      transactionDate: fromIsoDay(dto.date as string),
      description: (dto.description as string).trim(),
      debitAccountId: dto.debitAccountId as string,
      creditAccountId: dto.creditAccountId as string,
      amount: normalizeAmount(dto.amount as string),
      actorUserId: actor.id,
    });
    await em.flush();
    return toTransactionDto(created);
  }

  async updateTransaction(
    id: string,
    dto: SimpleTransactionInputDto,
    actor: AuthenticatedUser,
  ): Promise<SimpleTransactionDto> {
    const em = this.em.fork();
    const transaction = await this.requireTransaction(em, id, actor);
    await this.assertTransactionContent(em, dto, transaction.practiceId);
    transaction.transactionDate = fromIsoDay(dto.date as string);
    transaction.description = (dto.description as string).trim();
    transaction.debitAccountId = dto.debitAccountId as string;
    transaction.creditAccountId = dto.creditAccountId as string;
    transaction.amount = normalizeAmount(dto.amount as string);
    touch(transaction, actor.id);
    await em.flush();
    return toTransactionDto(transaction);
  }

  async deleteTransaction(id: string, actor: AuthenticatedUser): Promise<void> {
    const em = this.em.fork();
    const transaction = await this.requireTransaction(em, id, actor);
    em.remove(transaction);
    await em.flush();
  }

  private async assertTransactionContent(
    em: EntityManager,
    dto: SimpleTransactionInputDto,
    practiceId: string,
  ): Promise<void> {
    const descriptionIssue = descriptionProblem(dto.description);
    if (descriptionIssue) this.invalid(descriptionIssue);
    await this.assertOwnAccount(
      em,
      dto.debitAccountId,
      practiceId,
      'Elija la cuenta del debe.',
    );
    await this.assertOwnAccount(
      em,
      dto.creditAccountId,
      practiceId,
      'Elija la cuenta del haber.',
    );
    if (dto.debitAccountId === dto.creditAccountId) {
      this.invalid('El debe y el haber tienen que ser cuentas distintas.');
    }
    const problem = dateProblem(dto.date) ?? amountProblem(dto.amount);
    if (problem) this.invalid(problem);
  }

  private async assertOwnAccount(
    em: EntityManager,
    accountId: string | undefined,
    practiceId: string,
    message: string,
  ): Promise<void> {
    const account = isUuid(accountId)
      ? await this.repo.findAccount(em, accountId)
      : null;
    if (!account || account.practiceId !== practiceId) this.invalid(message);
  }

  private async requireTransaction(
    em: EntityManager,
    id: string,
    actor: AuthenticatedUser,
  ): Promise<PractitionerSimpleTransactions> {
    const transaction = isUuid(id)
      ? await this.repo.findTransaction(em, id)
      : null;
    return this.ownRow(transaction, actor, {
      message: 'Transacción no encontrada',
      reason: AccountingErrorReason.SIMPLE_TRANSACTION_NOT_FOUND,
    });
  }

  /** 422 con el motivo en castellano: el front lo muestra tal cual. */
  private invalid(message: string): never {
    throw new PreconditionFailedException(
      message,
      undefined,
      AccountingErrorReason.SIMPLE_ACCOUNTING_INVALID,
    );
  }
}

/** El siguiente código de la clase: `5.9` → `5.10`. */
function nextCode(
  accounts: readonly PractitionerSimpleAccounts[],
  accountClass: SimpleAccountClass,
): string {
  const used = accounts
    .filter((a) => a.accountClass === accountClass)
    .map((a) => Number(a.code.split('.')[1] ?? 0));
  return `${CODE_PREFIX[accountClass]}.${Math.max(0, ...used) + 1}`;
}

function toAccountDto(account: PractitionerSimpleAccounts): SimpleAccountDto {
  return {
    id: account.id,
    code: account.code,
    name: account.name,
    accountClass: account.accountClass as SimpleAccountClass,
    seeded: account.seeded,
  };
}

function toRecordDto(record: PractitionerSimpleRecords): SimpleRecordDto {
  return {
    id: record.id,
    kind: record.kind as SimpleRecordKind,
    date: toIsoDay(record.recordDate),
    accountId: record.accountId,
    description: record.description,
    amount: record.amount,
  };
}

function toTransactionDto(
  transaction: PractitionerSimpleTransactions,
): SimpleTransactionDto {
  return {
    id: transaction.id,
    date: toIsoDay(transaction.transactionDate),
    description: transaction.description,
    debitAccountId: transaction.debitAccountId,
    creditAccountId: transaction.creditAccountId,
    amount: transaction.amount,
  };
}
