import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PartyRatings } from '../entities';
import { createdBy, touch } from '../../../common';
import type { RatingPartyType } from '../dto/party-rating.dto';

/** Columna de autor por tipo de parte. */
const REVIEWER_COLUMN = {
  PATIENT: 'reviewerPatientProfileId',
  PRACTITIONER: 'reviewerPractitionerProfileId',
  ORGANIZATION: 'reviewerPracticeId',
} as const satisfies Record<RatingPartyType, keyof PartyRatings>;

/** Columna de calificado por tipo de parte. */
const TARGET_COLUMN = {
  PATIENT: 'targetPatientProfileId',
  PRACTITIONER: 'targetPractitionerProfileId',
  ORGANIZATION: 'targetPracticeId',
} as const satisfies Record<RatingPartyType, keyof PartyRatings>;

/** Una parte de la malla: tipo + id canónico. */
export interface RatingParty {
  type: RatingPartyType;
  id: string;
}

/** Lo que respalda una calificación: una atención o un vínculo de trabajo. */
export interface RatingBasis {
  encounterId?: string;
  roleAssignmentId?: string;
}

/** Datos de alta de una calificación. */
export interface CreatePartyRatingData {
  reviewer: RatingParty;
  target: RatingParty;
  basis: RatingBasis;
  overallRating: number;
  commentText?: string;
  moderationStatusConceptId: string;
  actorUserId: string;
}

/** Media y cantidad de calificaciones de una parte. */
export interface RatingAggregate {
  average: number | null;
  count: number;
}

/**
 * Acceso a `community.party_ratings`.
 *
 * Las columnas de autor y de calificado son mutuamente excluyentes (una por
 * tipo de parte); este repositorio es el único lugar que traduce
 * «parte de tipo X» a «columna Y», para que ningún servicio escriba dos.
 */
@Injectable()
export class PartyRatingsRepository {
  /**
   * La calificación previa del mismo autor, al mismo calificado, por el mismo
   * respaldo — la clave de `uq_party_ratings_basis`.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param reviewer - Quién califica.
   * @param target - A quién.
   * @param basis - Respaldo.
   * @returns La fila previa, o `null`.
   */
  findExisting(
    em: EntityManager,
    reviewer: RatingParty,
    target: RatingParty,
    basis: RatingBasis,
  ): Promise<PartyRatings | null> {
    return em.findOne(PartyRatings, {
      [REVIEWER_COLUMN[reviewer.type]]: reviewer.id,
      [TARGET_COLUMN[target.type]]: target.id,
      verifiedEncounterId: basis.encounterId ?? null,
      verifiedRoleAssignmentId: basis.roleAssignmentId ?? null,
    });
  }

  /**
   * Alta de una calificación.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Autor, calificado, respaldo y estrellas.
   * @returns La entidad persistible.
   */
  create(em: EntityManager, data: CreatePartyRatingData): PartyRatings {
    return em.create(
      PartyRatings,
      {
        [REVIEWER_COLUMN[data.reviewer.type]]: data.reviewer.id,
        [TARGET_COLUMN[data.target.type]]: data.target.id,
        verifiedEncounterId: data.basis.encounterId,
        verifiedRoleAssignmentId: data.basis.roleAssignmentId,
        overallRating: data.overallRating,
        commentText: data.commentText,
        moderationStatusConceptId: data.moderationStatusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Recalifica: cambia estrellas y comentario de una fila existente.
   *
   * @param rating - Fila previa.
   * @param overallRating - Estrellas nuevas.
   * @param commentText - Comentario nuevo (vacío lo borra).
   * @param actorUserId - Quién recalifica.
   * @returns La misma entidad, modificada.
   */
  update(
    rating: PartyRatings,
    overallRating: number,
    commentText: string | undefined,
    actorUserId: string,
  ): PartyRatings {
    rating.overallRating = overallRating;
    rating.commentText = commentText;
    return touch(rating, actorUserId);
  }

  /**
   * Calificaciones vigentes de una parte, de la más reciente a la más vieja.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param target - La parte calificada.
   * @param excludedModerationStatusIds - Estados de moderación que no cuentan.
   * @param limit - Tope de filas.
   * @returns Las filas.
   */
  findByTarget(
    em: EntityManager,
    target: RatingParty,
    excludedModerationStatusIds: readonly string[],
    limit: number,
  ): Promise<PartyRatings[]> {
    return em.find(
      PartyRatings,
      {
        [TARGET_COLUMN[target.type]]: target.id,
        moderationStatusConceptId: { $nin: [...excludedModerationStatusIds] },
      },
      { orderBy: { updatedAt: 'DESC' }, limit },
    );
  }

  /**
   * Media y cantidad de calificaciones vigentes de una parte, sobre **todas**
   * sus filas y no sobre una página. Trae sólo la columna de estrellas y suma en
   * memoria, igual que `ReviewsRepository.averageByTargets`.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param target - La parte calificada.
   * @param excludedModerationStatusIds - Estados de moderación que no cuentan.
   * @returns La media (con un decimal) y la cantidad.
   */
  async aggregate(
    em: EntityManager,
    target: RatingParty,
    excludedModerationStatusIds: readonly string[],
  ): Promise<RatingAggregate> {
    const filas = await em.find(
      PartyRatings,
      {
        [TARGET_COLUMN[target.type]]: target.id,
        moderationStatusConceptId: { $nin: [...excludedModerationStatusIds] },
      },
      { fields: ['overallRating'] },
    );
    if (filas.length === 0) return { average: null, count: 0 };
    const total = filas.reduce((suma, fila) => suma + fila.overallRating, 0);
    return {
      average: Math.round((total / filas.length) * 10) / 10,
      count: filas.length,
    };
  }

  /**
   * Las calificaciones que hizo una parte, para precargar formularios.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param reviewer - Quién calificó.
   * @param limit - Tope de filas.
   * @returns Las filas, de la más reciente a la más vieja.
   */
  findByReviewer(
    em: EntityManager,
    reviewer: RatingParty,
    limit: number,
  ): Promise<PartyRatings[]> {
    return em.find(
      PartyRatings,
      {
        [REVIEWER_COLUMN[reviewer.type]]: reviewer.id,
      },
      { orderBy: { updatedAt: 'DESC' }, limit },
    );
  }
}

/**
 * Lee de una fila qué parte la escribió.
 *
 * @param rating - La fila.
 * @returns El tipo y el id del autor.
 */
export function reviewerOf(rating: PartyRatings): RatingParty {
  if (rating.reviewerPatientProfileId) {
    return { type: 'PATIENT', id: rating.reviewerPatientProfileId };
  }
  if (rating.reviewerPractitionerProfileId) {
    return { type: 'PRACTITIONER', id: rating.reviewerPractitionerProfileId };
  }
  return { type: 'ORGANIZATION', id: rating.reviewerPracticeId as string };
}

/**
 * Lee de una fila qué parte quedó calificada.
 *
 * @param rating - La fila.
 * @returns El tipo y el id del calificado.
 */
export function targetOf(rating: PartyRatings): RatingParty {
  if (rating.targetPatientProfileId) {
    return { type: 'PATIENT', id: rating.targetPatientProfileId };
  }
  if (rating.targetPractitionerProfileId) {
    return { type: 'PRACTITIONER', id: rating.targetPractitionerProfileId };
  }
  return { type: 'ORGANIZATION', id: rating.targetPracticeId as string };
}
