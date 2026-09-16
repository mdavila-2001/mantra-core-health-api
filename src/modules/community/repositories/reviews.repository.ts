import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  ServiceReviews,
  ReviewDimensionScores,
  ReviewResponses,
} from '../entities';
// El autor de una reseña es una persona de `profiles`: el módulo ya cruza
// esa frontera en otros puntos (`PROF` en `public-search.repository`,
// `PersonAccountLinksRepository` en las notificaciones), y la alternativa
// —duplicar el nombre en `community`— sería un segundo lugar donde guardar
// el mismo hecho.
import { Persons } from '../../profiles/entities';
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
  /** Una review por su id. */
  findById(em: EntityManager, id: string): Promise<ServiceReviews | null> {
    return em.findOne(ServiceReviews, { id });
  }

  /** La respuesta que un perfil ya publicó a una review, si publicó alguna. */
  findResponseByResponder(
    em: EntityManager,
    reviewId: string,
    responderPublicProfileId: string,
  ): Promise<ReviewResponses | null> {
    return em.findOne(ReviewResponses, { reviewId, responderPublicProfileId });
  }

  /**
   * Crea la respuesta de un perfil a una review.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Review, perfil que responde y texto.
   * @returns La respuesta creada.
   */
  createResponse(
    em: EntityManager,
    data: {
      /** Review contestada. */
      reviewId: string;
      /** Vitrina que contesta. */
      responderPublicProfileId: string;
      /** Texto de la respuesta. */
      responseText: string;
      /** Estado de moderación inicial. */
      moderationStatusConceptId: string;
      /** Usuario que ejecuta. */
      actorUserId?: string;
    },
  ): ReviewResponses {
    return em.create(
      ReviewResponses,
      {
        reviewId: data.reviewId,
        responderPublicProfileId: data.responderPublicProfileId,
        responseText: data.responseText,
        moderationStatusConceptId: data.moderationStatusConceptId,
        publishedAt: new Date(),
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

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
   * Página de reseñas publicadas de un perfil, de la más nueva a la más vieja.
   *
   * **Excluye las removidas por moderación.** Antes no lo hacía, y el promedio
   * de la ficha sí las excluye (`ratingsByProfile`): una reseña retirada por un
   * moderador desaparecía del promedio y seguía leyéndose en la lista, que es
   * la única de las dos cosas que el visitante realmente lee.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param targetPublicProfileId - Perfil calificado.
   * @param publishedStatusConceptId - Estado de publicación que se acepta.
   * @param removedModerationStatusConceptId - Estado de moderación que se descarta.
   * @param after - Clave de continuación `(createdAt, id)`.
   * @param limit - Tope de filas.
   * @returns Las reseñas de la página.
   */
  listByTargetPage(
    em: EntityManager,
    targetPublicProfileId: string,
    publishedStatusConceptId: string,
    removedModerationStatusConceptId: string,
    after: { createdAt: string; id: string } | undefined,
    limit: number,
  ): Promise<ServiceReviews[]> {
    return em.find(
      ServiceReviews,
      {
        targetPublicProfileId,
        publicationStatusConceptId: publishedStatusConceptId,
        moderationStatusConceptId: { $ne: removedModerationStatusConceptId },
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

  /**
   * El nombre con el que firma cada autor, por perfil de paciente.
   *
   * `reviewer_patient_profile_id` es el id de la **persona**
   * (`patient_profiles.profile_id` es FK a `profiles.persons(id)`), así que la
   * consulta va directo contra `persons` sin pasar por la tabla intermedia.
   *
   * Es una consulta por lote y no una por reseña: una ficha con veinte reseñas
   * haría veinte viajes, y es la clase de N+1 que no se nota hasta que la ficha
   * es popular.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param personIds - Los autores de la página.
   * @returns Un mapa `personId → nombre`, sin entrada para quien no tenga uno.
   */
  async displayNamesByPerson(
    em: EntityManager,
    personIds: readonly string[],
  ): Promise<Map<string, string>> {
    const salida = new Map<string, string>();
    if (personIds.length === 0) return salida;

    const personas = await em.find(
      Persons,
      { id: { $in: [...new Set(personIds)] } },
      { fields: ['id', 'displayName'] },
    );
    for (const persona of personas) {
      const nombre = persona.displayName?.trim();
      if (nombre) salida.set(persona.id, nombre);
    }
    return salida;
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

  /**
   * Calificación media publicada de varios perfiles, en una sola consulta.
   *
   * Se cuentan **sólo las reseñas publicadas**: una reseña retirada por
   * moderación sigue existiendo en la tabla, y sumarla al promedio dejaría que
   * un contenido que el producto decidió no mostrar siga pesando en la nota que
   * sí se muestra.
   *
   * Va en lote porque quien la usa es un buscador: pedir la media perfil por
   * perfil convierte un listado de veinte centros en veinte consultas.
   *
   * @param em - Contexto de persistencia.
   * @param targetPublicProfileIds - Perfiles calificados.
   * @param publicationStatusConceptId - Estado de publicación exigido.
   * @returns Media y cantidad por perfil; los perfiles sin reseñas no aparecen.
   */
  async averageByTargets(
    em: EntityManager,
    targetPublicProfileIds: readonly string[],
    publicationStatusConceptId: string,
  ): Promise<
    Map<
      string,
      {
        /** Media de `overall_rating`. */
        average: number;
        /** Cuántas reseñas la sostienen. */
        count: number;
      }
    >
  > {
    const resultado = new Map<string, { average: number; count: number }>();
    if (targetPublicProfileIds.length === 0) {
      return resultado;
    }

    const filas = await em.find(
      ServiceReviews,
      {
        targetPublicProfileId: { $in: [...targetPublicProfileIds] },
        publicationStatusConceptId,
      },
      { fields: ['targetPublicProfileId', 'overallRating'] },
    );

    const acumulado = new Map<string, { total: number; count: number }>();
    for (const fila of filas) {
      const previo = acumulado.get(fila.targetPublicProfileId) ?? {
        total: 0,
        count: 0,
      };
      acumulado.set(fila.targetPublicProfileId, {
        total: previo.total + fila.overallRating,
        count: previo.count + 1,
      });
    }
    for (const [profileId, { total, count }] of acumulado) {
      resultado.set(profileId, { average: total / count, count });
    }
    return resultado;
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
