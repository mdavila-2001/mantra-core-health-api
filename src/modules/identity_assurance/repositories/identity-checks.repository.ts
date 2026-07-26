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
  identityVerificationCaseId: string;
  checkTypeConceptId: string;
  authorityId?: string;
  required?: boolean;
  checkSequence?: number;
  statusConceptId: string;
  actorUserId?: string;
}

/** Registro de un intento contra autoridad externa (UC-27-05). */
export interface CreateAttemptData {
  identityVerificationCaseId: string;
  identityAuthorityEndpointId: string;
  attemptNumber: number;
  requestMessageId?: string;
  responseMessageId?: string;
  idempotencyKey?: string;
  startedAt?: Date;
  completedAt?: Date;
  outcomeConceptId: string;
  technicalErrorCode?: string;
  retryEligible?: boolean;
}

/** Registro append-only de un resultado de check (UC-27-06). */
export interface CreateResultData {
  identityCheckId: string;
  resultVersion: number;
  resultConceptId: string;
  matchScore?: string;
  discrepancyCodesJson?: unknown;
  sourceResponseHash?: string;
  supersedesResultId?: string;
  checkedByActorTypeConceptId?: string;
  checkedByActorId?: string;
}

/** Acceso a datos de `identity_assurance.identity_checks`. */
@Injectable()
export class IdentityChecksRepository {
  findById(em: EntityManager, id: string): Promise<IdentityChecks | null> {
    return em.findOne(IdentityChecks, { id });
  }

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

  countByCaseAndStatus(em: EntityManager, caseId: string, statusConceptId: string): Promise<number> {
    return em.count(IdentityChecks, { identityVerificationCaseId: caseId, statusConceptId });
  }
}

/** Acceso a datos de `identity_assurance.identity_verification_attempts`. */
@Injectable()
export class IdentityVerificationAttemptsRepository {
  countByCase(em: EntityManager, caseId: string): Promise<number> {
    return em.count(IdentityVerificationAttempts, { identityVerificationCaseId: caseId });
  }

  /** ¿Existe algún intento completado para el caso? (precondición de UC-27-06). */
  async existsCompletedForCase(em: EntityManager, caseId: string): Promise<boolean> {
    const n = await em.count(IdentityVerificationAttempts, {
      identityVerificationCaseId: caseId,
      completedAt: { $ne: null },
    });
    return n > 0;
  }

  create(em: EntityManager, data: CreateAttemptData): IdentityVerificationAttempts {
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
  countByCheck(em: EntityManager, checkId: string): Promise<number> {
    return em.count(IdentityCheckResults, { identityCheckId: checkId });
  }

  /** Última versión de resultado del check (para encadenar `supersedes_result_id`). */
  findLatestByCheck(em: EntityManager, checkId: string): Promise<IdentityCheckResults | null> {
    return em.findOne(
      IdentityCheckResults,
      { identityCheckId: checkId },
      { orderBy: { resultVersion: 'DESC' } },
    );
  }

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
