import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { ServiceReviews, ReviewDimensionScores } from '../entities';
import { createdBy } from '../../../common';

/**
 * Describe el contrato estructural de create review data.
 */
export interface CreateReviewData {
  /**
   * Identificador asociado a target public profile.
   */
  targetPublicProfileId: string;
  /**
   * Identificador asociado a reviewer patient profile.
   */
  reviewerPatientProfileId: string;
  /**
   * Identificador asociado a verified encounter.
   */
  verifiedEncounterId?: string;
  /**
   * Valor de overall rating mantenido por la instancia.
   */
  overallRating: number;
  /**
   * Valor de review text mantenido por la instancia.
   */
  reviewText?: string;
  /**
   * Identificador asociado a reviewer display mode concept.
   */
  reviewerDisplayModeConceptId?: string;
  /**
   * Identificador asociado a verification status concept.
   */
  verificationStatusConceptId: string;
  /**
   * Identificador asociado a moderation status concept.
   */
  moderationStatusConceptId: string;
  /**
   * Identificador asociado a publication status concept.
   */
  publicationStatusConceptId: string;
  /**
   * Valor de published at mantenido por la instancia.
   */
  publishedAt?: Date;
  /**
   * Identificador asociado a actor user.
   */
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

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `ServiceReviews`.
   */
  /**
   * Las reseñas de un perfil público.
   *
   * Filtra por estado de moderación por la misma razón que las publicaciones:
   * una reseña en cola no es una reseña publicada, y mostrarla adelantaría un
   * juicio sobre alguien antes de que nadie lo haya revisado.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param targetPublicProfileId - Perfil reseñado.
   * @param moderationStatusConceptId - Estado de moderación exigido, si se exige.
   * @param limit - Tope de filas.
   * @returns Las reseñas, de la más reciente a la más antigua.
   */
  findByTarget(
    em: EntityManager,
    targetPublicProfileId: string,
    moderationStatusConceptId: string | undefined,
    limit: number,
  ): Promise<ServiceReviews[]> {
    const where: Record<string, unknown> = { targetPublicProfileId };
    if (moderationStatusConceptId) {
      where.moderationStatusConceptId = moderationStatusConceptId;
    }
    return em.find(ServiceReviews, where, {
      orderBy: { createdAt: 'DESC' },
      limit,
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

  /**
   * Crea create dimension score.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param reviewId - Identificador de review.
   * @param dimensionConceptId - Identificador de dimension concept.
   * @param score - Valor de score requerido por la operación.
   * @returns Resultado de create dimension score conforme al contrato `ReviewDimensionScores`.
   */
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
