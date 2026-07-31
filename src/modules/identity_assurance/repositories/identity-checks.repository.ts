import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  IdentityChecks,
  IdentityVerificationAttempts,
  IdentityCheckResults,
} from '../entities';
import { createdBy } from '../../../common';

/** Alta de un check planificado del caso (UC-27-04). */
export interface CreateCheckData {
  /**
   * Identificador asociado a identity verification case.
   */
  identityVerificationCaseId: string;
  /**
   * Identificador asociado a check type concept.
   */
  checkTypeConceptId: string;
  /**
   * Identificador asociado a authority.
   */
  authorityId?: string;
  /**
   * Valor de required mantenido por la instancia.
   */
  required?: boolean;
  /**
   * Valor de check sequence mantenido por la instancia.
   */
  checkSequence?: number;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Registro de un intento contra autoridad externa (UC-27-05). */
export interface CreateAttemptData {
  /**
   * Identificador asociado a identity verification case.
   */
  identityVerificationCaseId: string;
  /**
   * Identificador asociado a identity authority endpoint.
   */
  identityAuthorityEndpointId: string;
  /**
   * Valor de attempt number mantenido por la instancia.
   */
  attemptNumber: number;
  /**
   * Identificador asociado a request message.
   */
  requestMessageId?: string;
  /**
   * Identificador asociado a response message.
   */
  responseMessageId?: string;
  /**
   * Valor de idempotency key mantenido por la instancia.
   */
  idempotencyKey?: string;
  /**
   * Valor de started at mantenido por la instancia.
   */
  startedAt?: Date;
  /**
   * Valor de completed at mantenido por la instancia.
   */
  completedAt?: Date;
  /**
   * Identificador asociado a outcome concept.
   */
  outcomeConceptId: string;
  /**
   * Valor de technical error code mantenido por la instancia.
   */
  technicalErrorCode?: string;
  /**
   * Valor de retry eligible mantenido por la instancia.
   */
  retryEligible?: boolean;
}

/** Registro append-only de un resultado de check (UC-27-06). */
export interface CreateResultData {
  /**
   * Identificador asociado a identity check.
   */
  identityCheckId: string;
  /**
   * Valor de result version mantenido por la instancia.
   */
  resultVersion: number;
  /**
   * Identificador asociado a result concept.
   */
  resultConceptId: string;
  /**
   * Valor de match score mantenido por la instancia.
   */
  matchScore?: string;
  /**
   * Valor de discrepancy codes json mantenido por la instancia.
   */
  discrepancyCodesJson?: unknown;
  /**
   * Valor de source response hash mantenido por la instancia.
   */
  sourceResponseHash?: string;
  /**
   * Identificador asociado a supersedes result.
   */
  supersedesResultId?: string;
  /**
   * Identificador asociado a checked by actor type concept.
   */
  checkedByActorTypeConceptId?: string;
  /**
   * Identificador asociado a checked by actor.
   */
  checkedByActorId?: string;
}

/** Acceso a datos de `identity_assurance.identity_checks`. */
@Injectable()
export class IdentityChecksRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<IdentityChecks | null>`.
   */
  findById(em: EntityManager, id: string): Promise<IdentityChecks | null> {
    return em.findOne(IdentityChecks, { id });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `IdentityChecks`.
   */
  create(em: EntityManager, data: CreateCheckData): IdentityChecks {
    return em.create(
      IdentityChecks,
      {
        identityVerificationCaseId: data.identityVerificationCaseId,
        checkTypeConceptId: data.checkTypeConceptId,
        authorityId: data.authorityId,
        required: data.required,
        checkSequence: data.checkSequence,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /** Checks pendientes del caso (para cancelar en el barrido de expiración). */
  findPendingByCase(
    em: EntityManager,
    caseId: string,
    pendingStatuses: string[],
  ): Promise<IdentityChecks[]> {
    return em.find(IdentityChecks, {
      identityVerificationCaseId: caseId,
      statusConceptId: { $in: pendingStatuses },
    });
  }

  /**
   * Ejecuta la operación count by case and status.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param caseId - Identificador de case.
   * @param statusConceptId - Identificador de status concept.
   * @returns Resultado de count by case and status conforme al contrato `Promise<number>`.
   */
  countByCaseAndStatus(
    em: EntityManager,
    caseId: string,
    statusConceptId: string,
  ): Promise<number> {
    return em.count(IdentityChecks, {
      identityVerificationCaseId: caseId,
      statusConceptId,
    });
  }

  /**
   * Cuántos checks OBLIGATORIOS del caso siguen sin cerrarse.
   *
   * Sustenta la transición del caso a verificado: mientras quede un check
   * requerido sin resolver, el caso no puede darse por bueno. Los opcionales no
   * cuentan — por eso el filtro por `required`, y no un simple "todos".
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param caseId - Identificador de case.
   * @param openStatuses - Estados que se consideran "sin cerrar".
   * @param excludeCheckId - Check que se está resolviendo en esta misma
   *   transacción; su estado nuevo aún no está flusheado, así que se excluye
   *   para no contarlo con el valor viejo.
   * @returns Cuántos checks requeridos siguen abiertos.
   */
  countOpenRequiredByCase(
    em: EntityManager,
    caseId: string,
    openStatuses: string[],
    excludeCheckId: string,
  ): Promise<number> {
    return em.count(IdentityChecks, {
      identityVerificationCaseId: caseId,
      required: true,
      statusConceptId: { $in: openStatuses },
      id: { $ne: excludeCheckId },
    });
  }

  /**
   * Checks listos para despacharse contra la autoridad externa.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param statuses - Estados que admiten despacho o seguimiento.
   * @param limit - Tamaño máximo del lote.
   * @returns Los checks del lote, más antiguos primero.
   */
  findDispatchable(
    em: EntityManager,
    statuses: string[],
    limit: number,
  ): Promise<IdentityChecks[]> {
    return em.find(
      IdentityChecks,
      { statusConceptId: { $in: statuses } },
      { orderBy: { createdAt: 'ASC' }, limit },
    );
  }
}

/** Acceso a datos de `identity_assurance.identity_verification_attempts`. */
@Injectable()
export class IdentityVerificationAttemptsRepository {
  /**
   * Ejecuta la operación count by case.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param caseId - Identificador de case.
   * @returns Resultado de count by case conforme al contrato `Promise<number>`.
   */
  countByCase(em: EntityManager, caseId: string): Promise<number> {
    return em.count(IdentityVerificationAttempts, {
      identityVerificationCaseId: caseId,
    });
  }

  /** ¿Existe algún intento completado para el caso? (precondición de UC-27-06). */
  async existsCompletedForCase(
    em: EntityManager,
    caseId: string,
  ): Promise<boolean> {
    const n = await em.count(IdentityVerificationAttempts, {
      identityVerificationCaseId: caseId,
      completedAt: { $ne: null },
    });
    return n > 0;
  }

  /**
   * Último intento registrado del caso, sin importar su desenlace.
   *
   * Lo usa el worker para saber si ya despachó el check y sigue esperando
   * veredicto (intento PENDIENTE) o si todavía no lo ha despachado.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param caseId - Identificador de case.
   * @returns El intento más reciente, o `null` si no hay ninguno.
   */
  findLatestByCase(
    em: EntityManager,
    caseId: string,
  ): Promise<IdentityVerificationAttempts | null> {
    return em.findOne(
      IdentityVerificationAttempts,
      { identityVerificationCaseId: caseId },
      { orderBy: { attemptNumber: 'DESC' } },
    );
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `IdentityVerificationAttempts`.
   */
  create(
    em: EntityManager,
    data: CreateAttemptData,
  ): IdentityVerificationAttempts {
    return em.create(
      IdentityVerificationAttempts,
      {
        identityVerificationCaseId: data.identityVerificationCaseId,
        identityAuthorityEndpointId: data.identityAuthorityEndpointId,
        attemptNumber: data.attemptNumber,
        requestMessageId: data.requestMessageId,
        responseMessageId: data.responseMessageId,
        idempotencyKey: data.idempotencyKey,
        startedAt: data.startedAt,
        completedAt: data.completedAt,
        outcomeConceptId: data.outcomeConceptId,
        technicalErrorCode: data.technicalErrorCode,
        retryEligible: data.retryEligible,
        createdAt: new Date(),
      },
      { partial: true },
    );
  }
}

/** Acceso a datos de `identity_assurance.identity_check_results` (append-only). */
@Injectable()
export class IdentityCheckResultsRepository {
  /**
   * Ejecuta la operación count by check.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param checkId - Identificador de check.
   * @returns Resultado de count by check conforme al contrato `Promise<number>`.
   */
  countByCheck(em: EntityManager, checkId: string): Promise<number> {
    return em.count(IdentityCheckResults, { identityCheckId: checkId });
  }

  /** Última versión de resultado del check (para encadenar `supersedes_result_id`). */
  findLatestByCheck(
    em: EntityManager,
    checkId: string,
  ): Promise<IdentityCheckResults | null> {
    return em.findOne(
      IdentityCheckResults,
      { identityCheckId: checkId },
      { orderBy: { resultVersion: 'DESC' } },
    );
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `IdentityCheckResults`.
   */
  create(em: EntityManager, data: CreateResultData): IdentityCheckResults {
    return em.create(
      IdentityCheckResults,
      {
        identityCheckId: data.identityCheckId,
        resultVersion: data.resultVersion,
        resultConceptId: data.resultConceptId,
        matchScore: data.matchScore,
        discrepancyCodesJson: data.discrepancyCodesJson,
        sourceResponseHash: data.sourceResponseHash,
        supersedesResultId: data.supersedesResultId,
        checkedAt: new Date(),
        checkedByActorTypeConceptId: data.checkedByActorTypeConceptId,
        checkedByActorId: data.checkedByActorId,
      },
      { partial: true },
    );
  }
}
