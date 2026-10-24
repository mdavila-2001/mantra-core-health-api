import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import type { AuthenticatedUser } from '../../../common';
import { COMM } from '../community.concepts';
import type {
  MyRatingDto,
  RatingListDto,
  RatingPartyType,
  RatingSummaryDto,
} from '../dto/party-rating.dto';
import {
  PartyRatingsRepository,
  reviewerOf,
  targetOf,
  type RatingParty,
} from '../repositories/party-ratings.repository';
import { RatingPartiesService } from './rating-parties.service';

/** Lo que moderación retiró no cuenta en la nota ni se muestra. */
const EXCLUDED_MODERATION: readonly string[] = [COMM.MODERATION_REMOVED];

/** Tope de calificaciones individuales que devuelve una lectura. */
const ITEMS_LIMIT = 50;

/** Tope de calificaciones propias que devuelve `mine`. */
const MINE_LIMIT = 200;

/**
 * Lecturas de la calificación en malla.
 *
 * ## Quién lee qué
 *
 * - La nota de un **médico** o de una **organización** la lee cualquier sesión.
 * - La de un **paciente**, sólo profesionales y el propio paciente. No hay
 *   ruta pública para ella, y la regla vive en {@link RatingPartiesService}.
 *
 * Ninguna lectura dice **quién** calificó ni **qué atención** lo respalda: el
 * par «este médico calificó a este paciente» ya revela una relación clínica.
 */
@Injectable()
export class PartyRatingsReadService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param ratingsRepo - Acceso a `community.party_ratings`.
   * @param parties - Reglas de identidad y de lectura.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly ratingsRepo: PartyRatingsRepository,
    private readonly parties: RatingPartiesService,
  ) {}

  /**
   * Nota media de una parte.
   *
   * @param target - La parte.
   * @param actor - La sesión.
   * @returns Media y cantidad.
   */
  async summary(
    target: RatingParty,
    actor: AuthenticatedUser,
  ): Promise<RatingSummaryDto> {
    const em = this.em.fork();
    await this.assertCanRead(em, target, actor);
    return this.ratingsRepo.aggregate(em, target, EXCLUDED_MODERATION);
  }

  /**
   * Nota media y calificaciones individuales de una parte.
   *
   * @param target - La parte.
   * @param actor - La sesión.
   * @returns Media, cantidad y las 50 más recientes.
   */
  async list(
    target: RatingParty,
    actor: AuthenticatedUser,
  ): Promise<RatingListDto> {
    const em = this.em.fork();
    await this.assertCanRead(em, target, actor);
    const [aggregate, rows] = await Promise.all([
      this.ratingsRepo.aggregate(em, target, EXCLUDED_MODERATION),
      this.ratingsRepo.findByTarget(
        em,
        target,
        EXCLUDED_MODERATION,
        ITEMS_LIMIT,
      ),
    ]);
    return {
      ...aggregate,
      items: rows.map((row) => ({
        id: row.id,
        reviewerType: reviewerOf(row).type,
        overallRating: row.overallRating,
        commentText: row.commentText ?? undefined,
        updatedAt: row.updatedAt,
      })),
    };
  }

  /**
   * Las calificaciones que hice con una identidad, para precargar formularios.
   *
   * @param reviewerType - Con qué identidad.
   * @param organizationId - La organización, si `reviewerType = ORGANIZATION`.
   * @param actor - La sesión.
   * @returns Mis calificaciones, de la más reciente a la más vieja.
   */
  async mine(
    reviewerType: RatingPartyType,
    organizationId: string | undefined,
    actor: AuthenticatedUser,
  ): Promise<MyRatingDto[]> {
    const em = this.em.fork();
    const reviewer = await this.parties.resolveReviewer(
      em,
      reviewerType,
      organizationId,
      actor,
    );
    const rows = await this.ratingsRepo.findByReviewer(
      em,
      reviewer,
      MINE_LIMIT,
    );
    return rows.map((row) => {
      const target = targetOf(row);
      return {
        id: row.id,
        reviewerType: reviewer.type,
        targetType: target.type,
        targetId: target.id,
        encounterId: row.verifiedEncounterId ?? undefined,
        roleAssignmentId: row.verifiedRoleAssignmentId ?? undefined,
        overallRating: row.overallRating,
        commentText: row.commentText ?? undefined,
      };
    });
  }

  /**
   * La nota de un paciente exige ser profesional o ser él.
   *
   * @param em - Contexto de persistencia.
   * @param target - La parte cuya nota se pide.
   * @param actor - La sesión.
   */
  private async assertCanRead(
    em: EntityManager,
    target: RatingParty,
    actor: AuthenticatedUser,
  ): Promise<void> {
    if (target.type !== 'PATIENT') return;
    await this.parties.assertCanReadPatientRatings(em, target.id, actor);
  }
}
