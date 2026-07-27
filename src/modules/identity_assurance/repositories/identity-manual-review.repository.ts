import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { IdentityManualReviewCases } from '../entities';
import { createdBy } from '../../../common';

/** Escalado de un caso a revisión manual (UC-27-08). */
export interface CreateManualReviewData {
  identityVerificationCaseId: string;
  reviewReasonConceptId: string;
  assignedToUserId?: string;
  statusConceptId: string;
  openedAt: Date;
  actorUserId?: string;
}

/** Acceso a datos de `identity_assurance.identity_manual_review_cases`. */
@Injectable()
export class IdentityManualReviewCasesRepository {
  findById(
    em: EntityManager,
    id: string,
  ): Promise<IdentityManualReviewCases | null> {
    return em.findOne(IdentityManualReviewCases, { id });
  }

  countOpenByCase(
    em: EntityManager,
    caseId: string,
    openStatusConceptId: string,
  ): Promise<number> {
    return em.count(IdentityManualReviewCases, {
      identityVerificationCaseId: caseId,
      statusConceptId: openStatusConceptId,
    });
  }

  create(
    em: EntityManager,
    data: CreateManualReviewData,
  ): IdentityManualReviewCases {
    return em.create(
      IdentityManualReviewCases,
      {
        identityVerificationCaseId: data.identityVerificationCaseId,
        reviewReasonConceptId: data.reviewReasonConceptId,
        assignedToUserId: data.assignedToUserId,
        statusConceptId: data.statusConceptId,
        openedAt: data.openedAt,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
