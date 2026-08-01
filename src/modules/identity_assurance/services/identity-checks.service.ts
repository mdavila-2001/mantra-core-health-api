import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { randomUUID } from 'node:crypto';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { IDA } from '../identity_assurance.concepts';
import {
  IDA_SEED,
  IDENTITY_CARD_VERTICAL,
  INSTITUTION_DOCUMENT_VERTICAL,
  MEDICAL_LICENSE_VERTICAL,
} from '../identity_assurance.seed';
import {
  IdentityAssertionsRepository,
  IdentityChecksRepository,
  IdentityVerificationAttemptsRepository,
  IdentityCheckResultsRepository,
  IdentityVerificationCasesRepository,
} from '../repositories';
import {
  RecordAttemptDto,
  RecordResultDto,
  AttemptResponseDto,
  CheckResultResponseDto,
  DispatchableCheckDto,
  DispatchableChecksResponseDto,
  type AttemptOutcome,
} from '../dto';
import { IdentityChecks, type IdentityVerificationCases } from '../entities';
import { IdentityVerificationEffectsService } from './identity-verification-effects.service';

const MS_PER_HOUR = 3_600_000;
/** Vigencia por defecto de la aserción emitida automáticamente (1 año). */
const ASSERTION_TTL_HOURS = 8760;

const ATTEMPT_OUTCOME_CONCEPT: Record<AttemptOutcome, string> = {
  SUCCESS: IDA.ATTEMPT_SUCCESS,
  PENDING: IDA.ATTEMPT_PENDING,
  FAILED: IDA.ATTEMPT_FAILED,
};

/** Estados en los que un check todavía no dio veredicto. */
const OPEN_CHECK_STATES = [
  IDA.CHECK_PENDING,
  IDA.CHECK_IN_PROGRESS,
  IDA.CHECK_FAILED,
];

/** Tamaño del lote que el worker atiende por tick. */
const DEFAULT_DISPATCH_BATCH = 50;

/**
 * Qué necesita el worker para despachar cada tipo de check: el código que
 * entiende la autoridad externa y el endpoint que lo atiende. Se resuelve en el
 * backend para que el worker no cargue con el catálogo de conceptos.
 */
const VERTICAL_BY_CHECK_TYPE = new Map<
  string,
  { code: string; endpointId: string }
>([
  [
    IDA.CHECK_TYPE_IDENTITY_CARD,
    {
      code: 'IDENTITY_CARD',
      endpointId: IDENTITY_CARD_VERTICAL.authorityEndpointId,
    },
  ],
  [
    IDA.CHECK_TYPE_MEDICAL_LICENSE,
    {
      code: 'MEDICAL_LICENSE',
      endpointId: MEDICAL_LICENSE_VERTICAL.authorityEndpointId,
    },
  ],
  [
    IDA.CHECK_TYPE_INSTITUTION_DOCUMENT,
    {
      code: 'INSTITUTION_DOCUMENT',
      endpointId: INSTITUTION_DOCUMENT_VERTICAL.authorityEndpointId,
    },
  ],
]);

/**
 * Casos de uso sobre `identity_checks`: ejecutar un intento idempotente contra
 * la autoridad externa (UC-27-05) y registrar el resultado inmutable con
 * supersede (UC-27-06). Un intento API exitoso NO se trata como identidad
 * verificada: el veredicto lo aporta el resultado.
 *
 * El resultado es también el punto donde se cierra el caso: cuando ningún check
 * obligatorio queda abierto, el caso pasa a verificado, se emite su aserción y
 * se aplica el efecto de dominio correspondiente. Antes esa transición no
 * existía en ningún lado —`CASE_VERIFIED` nunca se asignaba—, así que un caso
 * podía quedar con todos sus checks completados y aun así no valer para nada.
 */
@Injectable()
export class IdentityChecksService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param checksRepo - Valor de checks repo requerido por la operación.
   * @param attemptsRepo - Valor de attempts repo requerido por la operación.
   * @param resultsRepo - Valor de results repo requerido por la operación.
   * @param casesRepo - Valor de cases repo requerido por la operación.
   * @param assertionsRepo - Valor de assertions repo requerido por la operación.
   * @param effects - Valor de effects requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly checksRepo: IdentityChecksRepository,
    private readonly attemptsRepo: IdentityVerificationAttemptsRepository,
    private readonly resultsRepo: IdentityCheckResultsRepository,
    private readonly casesRepo: IdentityVerificationCasesRepository,
    private readonly assertionsRepo: IdentityAssertionsRepository,
    private readonly effects: IdentityVerificationEffectsService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(IdentityChecksService.name);
  }

  /**
   * Checks que el worker debe atender: los que aún no se despacharon y los que
   * esperan veredicto de la autoridad.
   *
   * Devuelve el código legible del tipo de comprobación y el endpoint de
   * autoridad que le toca, para que el worker no tenga que conocer el catálogo
   * de conceptos ni la tabla de autoridades.
   *
   * @param limit - Tamaño máximo del lote.
   * @returns Los checks a atender en este tick.
   */
  async listDispatchable(
    limit?: number,
  ): Promise<DispatchableChecksResponseDto> {
    const em = this.em.fork();
    const checks = await this.checksRepo.findDispatchable(
      em,
      [IDA.CHECK_PENDING, IDA.CHECK_IN_PROGRESS],
      limit ?? DEFAULT_DISPATCH_BATCH,
    );

    const dispatchable: DispatchableCheckDto[] = [];
    for (const check of checks) {
      const vertical = VERTICAL_BY_CHECK_TYPE.get(check.checkTypeConceptId);
      if (!vertical) {
        // Un check de un tipo que este backend no sabe despachar no es un
        // error del worker: se deja para el flujo manual y se sigue.
        continue;
      }

      const latest = await this.attemptsRepo.findLatestByCase(
        em,
        check.identityVerificationCaseId,
      );
      dispatchable.push({
        id: check.id,
        identityVerificationCaseId: check.identityVerificationCaseId,
        checkTypeConceptId: check.checkTypeConceptId,
        checkTypeCode: vertical.code,
        identityAuthorityEndpointId: vertical.endpointId,
        awaitingVerdict:
          latest?.outcomeConceptId === IDA.ATTEMPT_PENDING &&
          !latest.completedAt,
      });
    }

    return { checks: dispatchable };
  }

  /** UC-27-05: registra un intento contra la autoridad externa (idempotente). */
  async recordAttempt(
    checkId: string,
    dto: RecordAttemptDto,
    actor: AuthenticatedUser,
  ): Promise<AttemptResponseDto> {
    this.logger.info(
      { operation: 'ida.check.attempt', actorId: actor.id, checkId },
      'Recording attempt',
    );
    return this.em.transactional(async (tx) => {
      const check = await this.loadCheck(tx, checkId);

      const outcome: AttemptOutcome = dto.outcome ?? 'SUCCESS';
      const now = new Date();
      const attemptNumber =
        (await this.attemptsRepo.countByCase(
          tx,
          check.identityVerificationCaseId,
        )) + 1;
      const attempt = this.attemptsRepo.create(tx, {
        identityVerificationCaseId: check.identityVerificationCaseId,
        identityAuthorityEndpointId: dto.identityAuthorityEndpointId,
        attemptNumber,
        requestMessageId: dto.requestMessageId,
        responseMessageId: dto.responseMessageId,
        idempotencyKey:
          dto.idempotencyKey ?? `ida-attempt-${check.id}-${attemptNumber}`,
        startedAt: now,
        completedAt: outcome === 'PENDING' ? undefined : now,
        outcomeConceptId: ATTEMPT_OUTCOME_CONCEPT[outcome],
        technicalErrorCode: dto.technicalErrorCode,
        retryEligible: dto.retryEligible,
      });

      check.statusConceptId =
        outcome === 'FAILED' ? IDA.CHECK_FAILED : IDA.CHECK_IN_PROGRESS;
      touch(check, actor.id);
      await tx.flush();
      return {
        id: attempt.id,
        attemptNumber: attempt.attemptNumber,
        outcome: attempt.outcomeConceptId,
        checkStatus: check.statusConceptId,
      };
    });
  }

  /** UC-27-06: registra un resultado inmutable (append + supersede). */
  async recordResult(
    checkId: string,
    dto: RecordResultDto,
    actor: AuthenticatedUser,
  ): Promise<CheckResultResponseDto> {
    this.logger.info(
      { operation: 'ida.check.result', actorId: actor.id, checkId },
      'Recording result',
    );
    return this.em.transactional(async (tx) => {
      const check = await this.loadCheck(tx, checkId);
      const hasCompleted = await this.attemptsRepo.existsCompletedForCase(
        tx,
        check.identityVerificationCaseId,
      );
      if (!hasCompleted) {
        throw new PreconditionFailedException(
          'No existe un intento completado para registrar resultado',
          {
            checkId,
          },
        );
      }

      const previous = await this.resultsRepo.findLatestByCheck(tx, check.id);
      const resultVersion =
        (await this.resultsRepo.countByCheck(tx, check.id)) + 1;
      const resultConceptId =
        dto.result === 'MATCH' ? IDA.RESULT_MATCH : IDA.RESULT_NO_MATCH;
      const result = this.resultsRepo.create(tx, {
        identityCheckId: check.id,
        resultVersion,
        resultConceptId,
        matchScore: dto.matchScore,
        discrepancyCodesJson: dto.discrepancyCodes,
        sourceResponseHash: dto.sourceResponseHash,
        supersedesResultId: previous?.id,
        checkedByActorTypeConceptId: IDA.ACTOR_TYPE_SYSTEM,
        checkedByActorId: actor.id,
      });

      check.statusConceptId =
        dto.result === 'MATCH' ? IDA.CHECK_COMPLETED : IDA.CHECK_FAILED;
      touch(check, actor.id);

      const caseStatus = await this.settleCase(tx, check, dto.result, actor);

      await tx.flush();
      return {
        id: result.id,
        resultVersion: result.resultVersion,
        result: result.resultConceptId,
        checkStatus: check.statusConceptId,
        caseStatus,
      };
    });
  }

  /**
   * Cierra el caso cuando el veredicto del check lo permite.
   *
   * Un check opcional nunca decide el caso: sólo los obligatorios. Un fallo en
   * uno obligatorio lo rechaza de inmediato (no tiene sentido esperar al resto);
   * un acierto sólo lo verifica si ya no queda ningún otro obligatorio abierto.
   *
   * @param tx - Transacción activa.
   * @param check - Check recién resuelto.
   * @param result - Veredicto registrado.
   * @param actor - Quién registró el resultado.
   * @returns El estado del caso tras el veredicto, o `undefined` si no cambió.
   */
  private async settleCase(
    tx: EntityManager,
    check: IdentityChecks,
    result: 'MATCH' | 'NO_MATCH',
    actor: AuthenticatedUser,
  ): Promise<string | undefined> {
    // Un check opcional no decide nada sobre el caso.
    if (check.required !== true) return undefined;

    const kase = await this.casesRepo.findById(
      tx,
      check.identityVerificationCaseId,
    );
    // Un caso ya expirado, rechazado o revocado no vuelve atrás por un
    // resultado que llegue tarde.
    if (
      !kase ||
      (kase.statusConceptId !== IDA.CASE_OPEN &&
        kase.statusConceptId !== IDA.CASE_IN_VERIFICATION &&
        kase.statusConceptId !== IDA.CASE_AT_RISK)
    ) {
      return undefined;
    }

    if (result === 'NO_MATCH') {
      kase.statusConceptId = IDA.CASE_REJECTED;
      kase.completedAt = new Date();
      touch(kase, actor.id);
      this.logger.warn(
        { operation: 'ida.case.settle', caseId: kase.id },
        'Case rejected: a required check did not match',
      );
      return kase.statusConceptId;
    }

    const stillOpen = await this.checksRepo.countOpenRequiredByCase(
      tx,
      kase.id,
      OPEN_CHECK_STATES,
      check.id,
    );
    if (stillOpen > 0) return undefined;

    kase.statusConceptId = IDA.CASE_VERIFIED;
    touch(kase, actor.id);
    await this.issueAssertion(tx, kase, actor);
    await this.effects.applyVerified(tx, kase, actor.id);

    this.logger.info(
      { operation: 'ida.case.settle', caseId: kase.id },
      'Case verified and asserted after the last required check',
    );
    return kase.statusConceptId;
  }

  /**
   * Emite la aserción del caso verificado y lo deja en ASSERTED.
   *
   * Se emite aquí y no se deja para una llamada aparte porque la aserción es lo
   * que el resto del sistema consulta para saber si una identidad está probada:
   * un caso verificado sin aserción no habilitaría nada, que es justo el vacío
   * que este flujo cierra.
   *
   * @param tx - Transacción activa.
   * @param kase - Caso recién verificado.
   * @param actor - Quién registró el resultado.
   */
  private async issueAssertion(
    tx: EntityManager,
    kase: IdentityVerificationCases,
    actor: AuthenticatedUser,
  ): Promise<void> {
    const now = new Date();
    this.assertionsRepo.create(tx, {
      identityVerificationCaseId: kase.id,
      // La emite la misma autoridad sembrada que resolvió los checks.
      issuerIdentityAuthorityId: IDA_SEED.authorityId,
      subjectTypeConceptId: kase.subjectTypeConceptId,
      subjectEntityId: kase.subjectEntityId,
      assertionTypeConceptId: IDA.ASSERTION_IDENTITY,
      // La política siempre fija un nivel al abrir el caso (`openCase` lo copia
      // de ella si el cliente no lo pide); el IAL2 es el suelo por si un caso
      // antiguo llegara sin él.
      assuranceLevelConceptId:
        kase.requestedAssuranceLevelConceptId ?? IDA.ASSURANCE_LEVEL_IAL2,
      assertionIdentifier: `IDA-ASSERT-${randomUUID()}`,
      assertionHash: randomUUID().replace(/-/g, ''),
      issuedAt: now,
      expiresAt: new Date(now.getTime() + ASSERTION_TTL_HOURS * MS_PER_HOUR),
    });
    kase.statusConceptId = IDA.CASE_ASSERTED;
    kase.completedAt = now;
    touch(kase, actor.id);
  }

  /**
   * Obtiene load check.
   *
   * @param tx - Contexto de persistencia o transacción activa.
   * @param checkId - Identificador de check.
   * @returns Resultado de load check conforme al contrato `Promise<IdentityChecks>`.
   * @throws Error de dominio cuando no se cumplen las precondiciones de la operación.
   */
  private async loadCheck(
    tx: EntityManager,
    checkId: string,
  ): Promise<IdentityChecks> {
    const check = await this.checksRepo.findById(tx, checkId);
    if (!check)
      throw new ResourceNotFoundException('Check de identidad no encontrado', {
        checkId,
      });
    return check;
  }
}
