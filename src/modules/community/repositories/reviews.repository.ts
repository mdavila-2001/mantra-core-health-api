import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  ServiceReviews,
  ReviewDimensionScores,
  ReviewResponses,
} from '../entities';
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
   * Reviews publicadas de un perfil (UC-19-11, cara de lectura).
   *
   * Sólo lo publicado: una review retirada por moderación no vuelve a la ficha
   * pública del profesional.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param targetPublicProfileId - Perfil calificado.
   * @param publishedStatusConceptId - Estado de publicación visible.
   * @param after - Clave de continuación `(createdAt, id)`.
   * @param limit - Tope de filas.
   * @returns Página de reviews, de la más reciente a la más antigua.
   */
  listByTargetPage(
    em: EntityManager,
    targetPublicProfileId: string,
    publishedStatusConceptId: string,
    after: { createdAt: string; id: string } | undefined,
    limit: number,
  ): Promise<ServiceReviews[]> {
    return em.find(
      ServiceReviews,
      {
        targetPublicProfileId,
        publicationStatusConceptId: publishedStatusConceptId,
        ...(after
          ? {
              $or: [
                { createdAt: { $lt: new Date(after.createdAt) } },
                { createdAt: new Date(after.createdAt), id: { $lt: after.id } },
              ],
            }
          : {}),
      },
      { orderBy: { createdAt: 'DESC', id: 'DESC' }, limit },
    );
  }

  /** Puntuaciones por dimensión de un lote de reviews. */
  listDimensionScores(
    em: EntityManager,
    reviewIds: string[],
  ): Promise<ReviewDimensionScores[]> {
    if (reviewIds.length === 0) return Promise.resolve([]);
    return em.find(ReviewDimensionScores, { reviewId: { $in: reviewIds } });
  }

  /** Respuestas del profesional a un lote de reviews. */
  listResponses(
    em: EntityManager,
    reviewIds: string[],
  ): Promise<ReviewResponses[]> {
    if (reviewIds.length === 0) return Promise.resolve([]);
    return em.find(
      ReviewResponses,
      { reviewId: { $in: reviewIds } },
      { orderBy: { createdAt: 'ASC', id: 'ASC' } },
    );
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `ServiceReviews`.
   */
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
