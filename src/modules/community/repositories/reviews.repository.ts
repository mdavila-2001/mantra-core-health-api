import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { ServiceReviews, ReviewDimensionScores } from '../entities';
import { createdBy } from '../../../common';

export interface CreateReviewData {
  targetPublicProfileId: string;
  reviewerPatientProfileId: string;
  verifiedEncounterId?: string;
  overallRating: number;
  reviewText?: string;
  reviewerDisplayModeConceptId?: string;
  verificationStatusConceptId: string;
  moderationStatusConceptId: string;
  publicationStatusConceptId: string;
  publishedAt?: Date;
  actorUserId?: string;
}

/** Acceso a datos de reviews de servicio y sus puntuaciones por dimensión. */
@Injectable()
export class ReviewsRepository {
  /** Review verificada previa del mismo paciente para el mismo encuentro. */
  findByReviewerEncounter(
    em: EntityManager,
    reviewerPatientProfileId: string,
    targetPublicProfileId: string,
    verifiedEncounterId: string,
  ): Promise<ServiceReviews | null> {
    return em.findOne(ServiceReviews, {
      reviewerPatientProfileId,
      targetPublicProfileId,
      verifiedEncounterId,
    });
  }

  create(em: EntityManager, data: CreateReviewData): ServiceReviews {
    return em.create(
      ServiceReviews,
      {
        targetPublicProfileId: data.targetPublicProfileId,
        reviewerPatientProfileId: data.reviewerPatientProfileId,
        verifiedEncounterId: data.verifiedEncounterId,
        overallRating: data.overallRating,
        reviewText: data.reviewText,
        reviewerDisplayModeConceptId: data.reviewerDisplayModeConceptId,
        verificationStatusConceptId: data.verificationStatusConceptId,
        moderationStatusConceptId: data.moderationStatusConceptId,
        publicationStatusConceptId: data.publicationStatusConceptId,
        publishedAt: data.publishedAt,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  createDimensionScore(
    em: EntityManager,
    reviewId: string,
    dimensionConceptId: string,
    score: number,
  ): ReviewDimensionScores {
    return em.create(
      ReviewDimensionScores,
      {
        reviewId,
        dimensionConceptId,
        score,
        createdAt: new Date(),
      },
      { partial: true },
    );
  }
}
