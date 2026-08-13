import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ResourceNotFoundException,
  decodeKeysetCursor,
  encodeKeysetCursor,
} from '../../../common';
import { PublicProfilesRepository, ReviewsRepository } from '../repositories';
import { COMM } from '../community.concepts';
import type { ServiceReviewPageDto } from '../dto';

/**
 * Cara de lectura de las reviews de servicio (UC-19-11).
 *
 * La proyección al DTO **descarta `verified_encounter_id` y
 * `reviewer_patient_profile_id`** y eso es la mitad del trabajo de este
 * servicio: la primera columna ata la reseña a un encuentro clínico concreto y
 * la segunda a un paciente concreto. Publicar cualquiera de las dos convertiría
 * la ficha pública de un profesional en una lista de quién se atendió con él.
 */
@Injectable()
export class CommunityReviewsReadService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param profilesRepo - Acceso a `community.public_profiles`.
   * @param reviewsRepo - Acceso a reviews, dimensiones y respuestas.
   * @param logger - Logger estructurado.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly profilesRepo: PublicProfilesRepository,
    private readonly reviewsRepo: ReviewsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CommunityReviewsReadService.name);
  }

  /**
   * Reviews publicadas de un perfil.
   *
   * @param profileId - Perfil calificado.
   * @param options - Cursor y tope.
   * @returns Página de reviews con dimensiones y respuestas.
   * @throws ResourceNotFoundException si el perfil no existe.
   */
  async listProfileReviews(
    profileId: string,
    options: {
      /** Cursor opaco de la página anterior. */
      cursor?: string;
      /** Tope de filas. */
      limit: number;
    },
  ): Promise<ServiceReviewPageDto> {
    const em = this.em.fork();
    const profile = await this.profilesRepo.findById(em, profileId);
    if (!profile)
      throw new ResourceNotFoundException('Perfil público no encontrado', {
        profileId,
      });

    const after = options.cursor
      ? decodeKeysetCursor(options.cursor)
      : undefined;
    const afterKey =
      typeof after?.createdAt === 'string' && typeof after?.id === 'string'
        ? { createdAt: after.createdAt, id: after.id }
        : undefined;

    const rows = await this.reviewsRepo.listByTargetPage(
      em,
      profileId,
      COMM.PUBLICATION_PUBLISHED,
      afterKey,
      options.limit + 1,
    );
    const hasMore = rows.length > options.limit;
    const page = hasMore ? rows.slice(0, options.limit) : rows;
    const reviewIds = page.map((review) => review.id);

    const [scores, responses] = await Promise.all([
      this.reviewsRepo.listDimensionScores(em, reviewIds),
      this.reviewsRepo.listResponses(em, reviewIds),
    ]);

    const last = page.at(-1);
    return {
      items: page.map((review) => ({
        id: review.id,
        targetPublicProfileId: review.targetPublicProfileId,
        overallRating: review.overallRating,
        reviewText: review.reviewText ?? null,
        reviewerDisplayModeConceptId:
          review.reviewerDisplayModeConceptId ?? null,
        verificationStatusConceptId: review.verificationStatusConceptId,
        publishedAt: review.publishedAt ?? null,
        editedAt: review.editedAt ?? null,
        dimensionScores: scores
          .filter((score) => score.reviewId === review.id)
          .map((score) => ({
            dimensionConceptId: score.dimensionConceptId,
            score: score.score,
          })),
        responses: responses
          .filter((response) => response.reviewId === review.id)
          .map((response) => ({
            id: response.id,
            responderPublicProfileId: response.responderPublicProfileId,
            responseText: response.responseText,
            publishedAt: response.publishedAt ?? null,
          })),
      })),
      count: page.length,
      limit: options.limit,
      nextCursor:
        hasMore && last
          ? encodeKeysetCursor({
              createdAt: last.createdAt.toISOString(),
              id: last.id,
            })
          : null,
    };
  }
}
