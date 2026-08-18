import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS, createdBy, touch } from '../../../common';
import { PublicProfiles, VerifiedBadges } from '../entities';
import { VerifiedBadgesHistory } from '../../audit/entities';
import { COMM } from '../community.concepts';

/** Datos con los que se emite o se refresca un sello. */
export interface GrantBadgeData {
  /** Perfil público al que se le pone el sello. */
  readonly subjectRefId: string;
  /** Tipo de sujeto del perfil (`target_type_concept_id`). */
  readonly subjectTypeConceptId: string;
  /** Qué se verificó (matrícula, identidad institucional). */
  readonly badgeTypeConceptId: string;
  /** Cómo se verificó (autoridad externa, alta manual auditada). */
  readonly verificationMethodConceptId: string;
  /** Quién lo registró. */
  readonly actorUserId: string;
  /** Referencia a la evidencia (el caso de verificación). */
  readonly evidenceRef?: string;
  /** Desde cuándo vale. */
  readonly validFrom?: Date;
  /** Hasta cuándo vale; `undefined` = sin vencimiento conocido. */
  readonly validTo?: Date;
}

/**
 * Escrituras y lecturas de `community.verified_badges`.
 *
 * ## Por qué existe un repositorio y no se escribe suelto
 *
 * Antes de P13 **nadie escribía esta tabla**: había lectura (`listBadgesBySubject`)
 * y ningún camino de escritura, así que el sello sólo podía existir si alguien
 * metía la fila a mano en la base. Concentrar la escritura acá es lo que
 * permite que el puente desde `identity_assurance` sea el único camino y que
 * cada movimiento quede en `audit.verified_badges_history`.
 *
 * ## Un sello vigente por tipo y sujeto
 *
 * `grant` es un upsert sobre `(subjectRefId, badgeTypeConceptId)` vigente: una
 * re-verificación **extiende** el sello que ya está, no apila un segundo. Dos
 * sellos vigentes del mismo tipo sobre el mismo perfil serían dos respuestas a
 * «¿desde cuándo está verificado?».
 */
@Injectable()
export class VerifiedBadgesRepository {
  /**
   * El sello vigente de ese tipo para ese sujeto, o `null`.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param subjectRefId - Perfil público.
   * @param badgeTypeConceptId - Tipo de sello.
   * @returns El sello activo, o `null`.
   */
  findActive(
    em: EntityManager,
    subjectRefId: string,
    badgeTypeConceptId: string,
  ): Promise<VerifiedBadges | null> {
    return em.findOne(VerifiedBadges, {
      subjectRefId,
      badgeTypeConceptId,
      statusConceptId: CONCEPTS.STATE_ACTIVE,
    });
  }

  /** Todos los sellos del sujeto, vigentes o no (para revocarlos en bloque). */
  findAllBySubject(
    em: EntityManager,
    subjectRefId: string,
  ): Promise<VerifiedBadges[]> {
    return em.find(VerifiedBadges, { subjectRefId });
  }

  /**
   * Emite el sello, o extiende el que ya estaba vigente.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Sujeto, tipo, método y vigencia.
   * @param existente - El sello vigente, si lo había.
   * @returns El sello resultante y si fue alta o actualización.
   */
  grant(
    em: EntityManager,
    data: GrantBadgeData,
    existente: VerifiedBadges | null,
  ): { badge: VerifiedBadges; created: boolean } {
    const now = new Date();

    if (existente) {
      // Re-verificación: se conserva `validFrom` —el sello no «nace» de nuevo
      // cada vez que la autoridad confirma— y se corre el vencimiento.
      existente.verificationMethodConceptId = data.verificationMethodConceptId;
      existente.verifiedByUserId = data.actorUserId;
      existente.evidenceRef = data.evidenceRef;
      existente.validTo = data.validTo;
      existente.statusConceptId = CONCEPTS.STATE_ACTIVE;
      touch(existente, data.actorUserId);
      return { badge: existente, created: false };
    }

    const badge = em.create(
      VerifiedBadges,
      {
        subjectTypeConceptId: data.subjectTypeConceptId,
        subjectRefId: data.subjectRefId,
        badgeTypeConceptId: data.badgeTypeConceptId,
        verificationMethodConceptId: data.verificationMethodConceptId,
        verifiedByUserId: data.actorUserId,
        evidenceRef: data.evidenceRef,
        validFrom: data.validFrom ?? now,
        validTo: data.validTo,
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
    return { badge, created: true };
  }

  /**
   * Baja el sello: deja de estar vigente y su ventana se cierra ahora.
   *
   * Se marca en vez de borrarse porque «este perfil estuvo verificado hasta el
   * 3 de marzo» es un hecho que hay que poder responder — y porque un borrado
   * no deja rastro que auditar.
   *
   * @param badge - Sello a bajar.
   * @param actorUserId - Quién lo bajó.
   */
  revoke(
    badge: VerifiedBadges,
    actorUserId: string,
    motivo: 'REVOKED' | 'EXPIRED',
  ): void {
    // Se distingue revocado de vencido porque no significan lo mismo: uno dice
    // «la autoridad retiró el respaldo», el otro «hay que renovar». La pantalla
    // los muestra distinto y quien audita necesita poder separarlos.
    badge.statusConceptId =
      motivo === 'REVOKED' ? CONCEPTS.STATE_REVOKED : CONCEPTS.STATE_EXPIRED;
    // Un vencido ya tiene su `validTo` en el pasado y no se pisa: la fecha en
    // que dejó de valer es la que decía el sello, no la del barrido que lo notó.
    if (motivo === 'REVOKED' || !badge.validTo) {
      badge.validTo = new Date();
    }
    touch(badge, actorUserId);
  }

  /**
   * Anota el movimiento en `audit.verified_badges_history`.
   *
   * La tabla ya recibía filas por disparador de base, pero con la operación
   * genérica (`OPERATION_INSERT`, `OPERATION_UPDATE`): decían **que** la fila
   * cambió, no **qué significó** el cambio. Un `UPDATE` sobre el sello puede ser
   * una renovación o una revocación, y son cosas opuestas para quien audita.
   *
   * Estas filas agregan esa semántica —emitido, renovado, revocado— junto al
   * estado con que quedó el sello. Es lo que permite responder quién puso un
   * sello y con qué evidencia, que es la única forma de que un alta manual sea
   * aceptable.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param badge - Sello afectado.
   * @param operationConceptId - Alta, actualización o baja.
   */
  recordHistory(
    em: EntityManager,
    badge: VerifiedBadges,
    operationConceptId: string,
  ): void {
    em.create(
      VerifiedBadgesHistory,
      {
        verifiedBadgesId: badge.id,
        operationConceptId,
        // El estado del sello tal como queda tras el movimiento. Guardar el
        // snapshot y no sólo el id es lo que permite responder «cómo estaba»
        // aunque después la fila cambie o desaparezca — que es justo cuando la
        // pregunta importa.
        dataSnapshot: {
          subjectTypeConceptId: badge.subjectTypeConceptId,
          subjectRefId: badge.subjectRefId,
          badgeTypeConceptId: badge.badgeTypeConceptId,
          verificationMethodConceptId: badge.verificationMethodConceptId,
          verifiedByUserId: badge.verifiedByUserId ?? null,
          evidenceRef: badge.evidenceRef ?? null,
          validFrom: badge.validFrom?.toISOString() ?? null,
          validTo: badge.validTo?.toISOString() ?? null,
          statusConceptId: badge.statusConceptId,
        },
        changedByUserId: badge.updatedByUserId ?? badge.createdByUserId,
        recordedAt: new Date(),
        validFrom: new Date(),
      },
      { partial: true },
    );
  }

  /** El perfil público de un sujeto de dominio (profesional, institución). */
  findProfileByTarget(
    em: EntityManager,
    targetId: string,
  ): Promise<PublicProfiles | null> {
    return em.findOne(PublicProfiles, { targetId });
  }

  /**
   * Perfiles cuyo sello está vigente pero cuya ventana ya venció.
   *
   * Es el barrido que hace que un sello con `validTo` en el pasado **caiga
   * solo**. Sin él, un sello con vencimiento seguiría mostrándose activo hasta
   * que alguien revocara el caso a mano, que es precisamente el sello que
   * miente.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param now - Momento contra el que se evalúa el vencimiento.
   * @param limit - Tope del lote.
   * @returns Los sellos vencidos que siguen marcados como vigentes.
   */
  findExpired(
    em: EntityManager,
    now: Date,
    limit: number,
  ): Promise<VerifiedBadges[]> {
    return em.find(
      VerifiedBadges,
      {
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        validTo: { $ne: null, $lt: now },
      },
      { orderBy: { validTo: 'ASC' }, limit },
    );
  }
}

/** Tipo de sello que le corresponde a cada tipo de sujeto del perfil. */
export const BADGE_TYPE_BY_TARGET: Record<string, string> = {
  [COMM.PROFILE_TARGET_PRACTITIONER]: COMM.BADGE_TYPE_LICENSE_VERIFIED,
  [COMM.PROFILE_TARGET_USER]: COMM.BADGE_TYPE_LICENSE_VERIFIED,
  [COMM.PROFILE_TARGET_ORGANIZATION]: COMM.BADGE_TYPE_ORGANIZATION_VERIFIED,
  [COMM.PROFILE_TARGET_PHARMACY]: COMM.BADGE_TYPE_ORGANIZATION_VERIFIED,
  [COMM.PROFILE_TARGET_DIAGNOSTIC_UNIT]: COMM.BADGE_TYPE_ORGANIZATION_VERIFIED,
  [COMM.PROFILE_TARGET_INSURER]: COMM.BADGE_TYPE_ORGANIZATION_VERIFIED,
};
