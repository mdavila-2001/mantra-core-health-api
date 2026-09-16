import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ResourceNotFoundException,
  decodeKeysetCursor,
  encodeKeysetCursor,
} from '../../../common';
import {
  PublicProfilesRepository,
  PublicSearchRepository,
  ReviewsRepository,
} from '../repositories';
import { COMM } from '../community.concepts';
import type { PublicProfileReviewsDto, ServiceReviewPageDto } from '../dto';

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
   * @param searchRepo - Resolución por slug y promedio del perfil (P31).
   * @param logger - Logger estructurado.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly profilesRepo: PublicProfilesRepository,
    private readonly reviewsRepo: ReviewsRepository,
    private readonly searchRepo: PublicSearchRepository,
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

    return this.projectPage(em, profileId, options);
  }

  /**
   * P31 — las reseñas de una ficha pública, **sin sesión**, con su promedio.
   *
   * ## Por qué no alcanzaba la lectura que ya existía
   *
   * `GET /community/profiles/:profileId/reviews` pide sesión y un uuid de
   * perfil. La ficha pública no tiene ninguna de las dos cosas: la abre un
   * anónimo y lo único que lleva en la URL es el slug. Sin esta lectura, la
   * cabecera de la ficha podía decir «4,6 de 5 · 12 opiniones» —eso ya se
   * calculaba— y no había forma de leer ni una sola de esas doce.
   *
   * ## El promedio es del perfil, no de la página
   *
   * Sale de la misma agregación que alimenta la cabecera del directorio, así
   * que las dos superficies dicen el mismo número. Promediar `items` daría uno
   * que cambia al pasar a la segunda página.
   *
   * @param slug - Slug estable del perfil.
   * @param expectedTargetConceptId - Tipo que exige el prefijo de la ruta.
   * @param options - Cursor y tope.
   * @returns Las reseñas publicadas y las dos cifras de la cabecera.
   * @throws ResourceNotFoundException si no existe, no es público o es de otro tipo.
   */
  async listPublicReviewsBySlug(
    slug: string,
    expectedTargetConceptId: string | undefined,
    options: { cursor?: string; limit: number },
  ): Promise<PublicProfileReviewsDto> {
    const em = this.em.fork();
    const profile = await this.searchRepo.findPublicBySlug(em, slug);

    // Mismo 404 que la ficha: en esta superficie nada distingue «no existe» de
    // «no está publicado», y un slug del tipo equivocado tampoco redirige.
    if (
      !profile ||
      (expectedTargetConceptId &&
        profile.targetTypeConceptId !== expectedTargetConceptId)
    ) {
      throw new ResourceNotFoundException('No encontrado', { slug });
    }

    const [pagina, ratings] = await Promise.all([
      this.projectPage(em, profile.id, options),
      this.searchRepo.ratingsByProfile(em, [profile.id]),
    ]);
    const rating = ratings.get(profile.id);

    return {
      ...pagina,
      // `null` y no `0`: cero estrellas es una calificación pésima y «todavía
      // nadie calificó» no lo es.
      ratingAverage: rating?.average ?? null,
      ratingCount: rating?.count ?? 0,
    };
  }

  /**
   * La página de reseñas de un perfil ya resuelto, con dimensiones, respuestas
   * y la firma de cada autor.
   *
   * Es la parte que comparten la lectura con sesión y la pública: las dos
   * devuelven exactamente las mismas reseñas y sólo difieren en cómo llegan al
   * perfil —por uuid o por slug— y en si además traen el promedio. Tenerla
   * escrita dos veces garantizaría que el día que una gane un campo la otra se
   * quede sin él.
   *
   * @param em - Contexto de persistencia.
   * @param profileId - Perfil calificado, ya verificado.
   * @param options - Cursor y tope.
   * @returns La página proyectada al DTO público.
   */
  private async projectPage(
    em: EntityManager,
    profileId: string,
    options: { cursor?: string; limit: number },
  ): Promise<ServiceReviewPageDto> {
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
      COMM.MODERATION_REMOVED,
      afterKey,
      options.limit + 1,
    );
    const hasMore = rows.length > options.limit;
    const page = hasMore ? rows.slice(0, options.limit) : rows;
    const reviewIds = page.map((review) => review.id);

    // Sólo se pide el nombre de quien eligió firmar. Pedir el de todos y
    // descartarlo después dejaría los nombres de los autores anónimos en la
    // memoria del proceso, que es exactamente lo que la reseña anónima promete
    // que no pasa.
    const firmantes = page
      .filter(
        (review) =>
          review.reviewerDisplayModeConceptId === COMM.REVIEW_DISPLAY_REAL_NAME,
      )
      .map((review) => review.reviewerPatientProfileId);

    const [scores, responses, nombres] = await Promise.all([
      this.reviewsRepo.listDimensionScores(em, reviewIds),
      this.reviewsRepo.listResponses(em, reviewIds),
      this.reviewsRepo.displayNamesByPerson(em, firmantes),
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
        reviewerDisplayName:
          review.reviewerDisplayModeConceptId === COMM.REVIEW_DISPLAY_REAL_NAME
            ? (nombres.get(review.reviewerPatientProfileId) ?? null)
            : null,
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
