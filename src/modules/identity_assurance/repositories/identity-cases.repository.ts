import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { IdentityVerificationCases } from '../entities';
import { createdBy } from '../../../common';

/** Apertura de un caso de verificación (UC-27-02). */
export interface CreateCaseData {
  subjectTypeConceptId: string;
  subjectEntityId: string;
  identityVerificationPolicyId: string;
  requestedAssuranceLevelConceptId?: string;
  statusConceptId: string;
  riskScore?: string;
  openedAt: Date;
  expiresAt?: Date;
  correlationId?: string;
  actorUserId?: string;
}

/** Acceso a datos de `identity_assurance.identity_verification_cases`. */
@Injectable()
export class IdentityVerificationCasesRepository {
  findById(em: EntityManager, id: string): Promise<IdentityVerificationCases | null> {
    return em.findOne(IdentityVerificationCases, { id });
  }

  create(em: EntityManager, data: CreateCaseData): IdentityVerificationCases {
    return em.create(
      IdentityVerificationCases,
      {
        subjectTypeConceptId: data.subjectTypeConceptId,
        subjectEntityId: data.subjectEntityId,
        identityVerificationPolicyId: data.identityVerificationPolicyId,
        requestedAssuranceLevelConceptId: data.requestedAssuranceLevelConceptId,
        statusConceptId: data.statusConceptId,
        riskScore: data.riskScore,
        openedAt: data.openedAt,
        expiresAt: data.expiresAt,
        correlationId: data.correlationId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /** Casos vencidos (expires_at < now) aún no completados (UC-27-12). */
  findExpirable(
    em: EntityManager,
    openStatuses: string[],
    now: Date,
    limit = 100,
  ): Promise<IdentityVerificationCases[]> {
    return em.find(
      IdentityVerificationCases,
      { statusConceptId: { $in: openStatuses }, expiresAt: { $lt: now } },
      { limit },
    );
  }
}
