import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { CONCEPTS, touch } from '../../../common';
import { PublicProfiles, type VerifiedBadges } from '../entities';
import {
  BADGE_TYPE_BY_TARGET,
  VerifiedBadgesRepository,
} from '../repositories';
import { COMM } from '../community.concepts';

/** Lo que la pantalla necesita saber del sello, en un solo campo. */
export type VerifiedBadgeStatus = 'VERIFIED' | 'EXPIRED' | 'NONE';

/**
 * El sello, tal como se sirve en TODAS las superficies.
 *
 * Un solo campo y una sola semántica: buscador, ficha pública, Guía y selector
 * de turnos leen esto, no cuatro interpretaciones de un booleano.
 */
export interface VerifiedBadgeDto {
  /** `VERIFIED` sólo si hay respaldo vigente; `EXPIRED` si lo hubo y venció. */
  status: VerifiedBadgeStatus;
  /** Qué se verificó, o `null` si nunca hubo sello. */
  badgeTypeConceptId: string | null;
  /** Cómo se verificó (autoridad externa, alta manual auditada). */
  verificationMethodConceptId: string | null;
  /** Desde cuándo vale, en ISO. */
  verifiedAt: string | null;
  /** Hasta cuándo vale, en ISO; `null` = sin vencimiento conocido. */
  validUntil: string | null;
}

/** Datos del puente desde `identity_assurance`. */
export interface VerificationOutcome {
  /** Sujeto de dominio verificado (profesional, institución). */
  readonly targetId: string;
  /** Cómo se verificó. */
  readonly methodConceptId: string;
  /** Quién lo registró (normalmente el worker de sistema). */
  readonly actorUserId: string;
  /** Referencia al caso de verificación que lo respalda. */
  readonly evidenceRef?: string;
  /** Vencimiento del respaldo, si la autoridad lo declara. */
  readonly validTo?: Date;
}

/**
 * El sello «Verificado», atado a la verificación real (P13).
 *
 * ## El problema que cierra
 *
 * `community.verified_badges` **no tenía ningún camino de escritura desde la
 * aplicación**: había lectura y nada que la llenara, así que un sello sólo
 * podía existir si alguien metía la fila a mano en la base. Y al revés: los
 * profesionales que sí pasaban
 * la verificación de matrícula (H-01, que ya funciona) **no ganaban el sello**,
 * porque `identity_assurance` activaba la licencia y nadie miraba community.
 *
 * En una red de salud eso no es un campo que falta: que el sello sea confiable
 * ES el producto.
 *
 * ## El único camino
 *
 * `applyVerified` lo llama el puente desde `IdentityVerificationEffectsService`,
 * dentro de la misma transacción que cierra el caso. No hay otra forma de que
 * un sello nazca salvo el alta manual de un `SECURITY_ADMIN`, que queda
 * marcada como manual en el propio sello y anotada en
 * `audit.verified_badges_history`.
 *
 * ## Dos verdades que se mantienen juntas a propósito
 *
 * El sello vive en `verified_badges` (con su tipo, método y evidencia) y el
 * estado resumido en `public_profiles.verification_status_concept_id`. La
 * segunda es una desnormalización: es la que lee el buscador para no hacer un
 * join por fila. Las dos se escriben **siempre juntas en la misma
 * transacción**, y `readBadge` deriva lo que se muestra del sello —la fuente—,
 * no del resumen.
 */
@Injectable()
export class CommunityVerificationService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param repo - Escrituras y lecturas de sellos.
   * @param logger - Logger estructurado.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly repo: VerifiedBadgesRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CommunityVerificationService.name);
  }

  /**
   * Emite o renueva el sello de un sujeto recién verificado.
   *
   * Corre dentro de la transacción del caso: si esto falla, el caso no queda
   * verificado con el perfil diciendo lo contrario.
   *
   * Un sujeto sin vitrina pública **no es un error**: mucha gente se verifica
   * sin publicarse en el directorio. Se anota y se sigue.
   *
   * @param tx - Transacción activa.
   * @param outcome - Sujeto, método, actor y evidencia.
   * @returns Qué pasó con el sello.
   */
  async applyVerified(
    tx: EntityManager,
    outcome: VerificationOutcome,
  ): Promise<{ action: 'granted' | 'renewed' | 'no-profile' }> {
    const profile = await this.repo.findProfileByTarget(tx, outcome.targetId);
    if (!profile) {
      this.logger.info(
        {
          operation: 'community.verification.grant',
          targetId: outcome.targetId,
        },
        'Verified subject has no public profile: no badge to grant',
      );
      return { action: 'no-profile' };
    }

    const badgeTypeConceptId =
      BADGE_TYPE_BY_TARGET[profile.targetTypeConceptId];
    if (!badgeTypeConceptId) {
      // Un tipo de sujeto sin sello definido: mejor no poner ninguno que poner
      // el de otra cosa. Un sello que dice «matrícula verificada» sobre una
      // aseguradora es peor que la ausencia del sello.
      this.logger.warn(
        {
          operation: 'community.verification.grant',
          profileId: profile.id,
          targetTypeConceptId: profile.targetTypeConceptId,
        },
        'Profile target type has no badge type defined',
      );
      return { action: 'no-profile' };
    }

    const existente = await this.repo.findActive(
      tx,
      profile.id,
      badgeTypeConceptId,
    );
    const { badge, created } = this.repo.grant(
      tx,
      {
        subjectRefId: profile.id,
        subjectTypeConceptId: profile.targetTypeConceptId,
        badgeTypeConceptId,
        verificationMethodConceptId: outcome.methodConceptId,
        actorUserId: outcome.actorUserId,
        evidenceRef: outcome.evidenceRef,
        validTo: outcome.validTo,
      },
      existente,
    );
    // El historial apunta al sello por uuid y no por relación, así que el ORM
    // no puede deducir el orden: sin este flush intenta insertar la fila de
    // auditoría antes que el sello al que referencia y la FK la rechaza.
    // Sigue siendo la misma transacción — si algo falla después, no queda ni
    // el sello ni su rastro.
    if (created) {
      await tx.flush();
    }
    this.repo.recordHistory(
      tx,
      badge,
      created ? COMM.BADGE_HISTORY_OP_GRANTED : COMM.BADGE_HISTORY_OP_RENEWED,
    );

    profile.verificationStatusConceptId = CONCEPTS.STATE_ACTIVE;
    touch(profile, outcome.actorUserId);

    this.logger.info(
      {
        operation: 'community.verification.grant',
        profileId: profile.id,
        badgeTypeConceptId,
        created,
      },
      created ? 'Verified badge granted' : 'Verified badge renewed',
    );

    return { action: created ? 'granted' : 'renewed' };
  }

  /**
   * Baja los sellos de un sujeto cuya verificación se revocó o venció.
   *
   * El perfil queda en `STATE_EXPIRED`, **no en `PENDING`**: la pantalla tiene
   * que poder decir «Verificación vencida». Un `PENDING` diría «nunca se
   * verificó», que es falso, y un hueco silencioso sería indistinguible de un
   * perfil que nunca lo intentó.
   *
   * @param tx - Transacción activa.
   * @param targetId - Sujeto de dominio afectado.
   * @param actorUserId - Quién lo registró.
   * @param motivo - Si la autoridad lo retiró o si simplemente venció.
   * @returns Cuántos sellos cayeron.
   */
  async applyRevoked(
    tx: EntityManager,
    targetId: string,
    actorUserId: string,
    motivo: 'REVOKED' | 'EXPIRED' = 'REVOKED',
  ): Promise<{ revoked: number }> {
    const profile = await this.repo.findProfileByTarget(tx, targetId);
    if (!profile) return { revoked: 0 };

    return this.revokeProfileBadges(tx, profile, actorUserId, motivo);
  }

  /**
   * Baja los sellos vigentes de un perfil concreto.
   *
   * Separado de `applyRevoked` porque el barrido de vencidos llega con el
   * perfil ya resuelto y no tiene por qué volver a buscarlo por sujeto.
   *
   * @param tx - Transacción activa.
   * @param profile - Perfil afectado.
   * @param actorUserId - Quién lo registró.
   * @param motivo - Revocado por la autoridad, o vencido por fecha.
   * @returns Cuántos sellos cayeron.
   */
  async revokeProfileBadges(
    tx: EntityManager,
    profile: PublicProfiles,
    actorUserId: string,
    motivo: 'REVOKED' | 'EXPIRED',
  ): Promise<{ revoked: number }> {
    const badges = await this.repo.findAllBySubject(tx, profile.id);
    const vigentes = badges.filter(
      (badge) => badge.statusConceptId === CONCEPTS.STATE_ACTIVE,
    );

    for (const badge of vigentes) {
      this.repo.revoke(badge, actorUserId, motivo);
      this.repo.recordHistory(tx, badge, COMM.BADGE_HISTORY_OP_REVOKED);
    }

    // El resumen cae aunque no hubiera sello que bajar: un perfil marcado como
    // verificado sin ningún sello detrás es exactamente el estado inconsistente
    // que P13 vino a hacer imposible.
    if (profile.verificationStatusConceptId === CONCEPTS.STATE_ACTIVE) {
      profile.verificationStatusConceptId = CONCEPTS.STATE_EXPIRED;
      touch(profile, actorUserId);
    }

    this.logger.info(
      {
        operation: 'community.verification.revoke',
        profileId: profile.id,
        revoked: vigentes.length,
        motivo,
      },
      'Verified badges revoked',
    );

    return { revoked: vigentes.length };
  }

  /**
   * Barrido de sellos vencidos: los que tienen `validTo` en el pasado caen.
   *
   * Sin esto, un sello con vencimiento seguiría mostrándose activo hasta que
   * alguien revocara el caso a mano — que es precisamente el sello que miente.
   *
   * @param actorUserId - Quién corre el barrido (el worker de sistema).
   * @param limit - Tope de sellos por corrida.
   * @returns Cuántos sellos y perfiles cayeron.
   */
  async expireSweep(
    actorUserId: string,
    limit = 200,
  ): Promise<{ expired: number; profiles: number }> {
    return this.em.transactional(async (tx) => {
      const vencidos = await this.repo.findExpired(tx, new Date(), limit);
      const perfiles = new Set<string>();

      for (const badge of vencidos) {
        this.repo.revoke(badge, actorUserId, 'EXPIRED');
        this.repo.recordHistory(tx, badge, COMM.BADGE_HISTORY_OP_REVOKED);
        perfiles.add(badge.subjectRefId);
      }

      // El resumen del perfil se baja sólo si NO le queda ningún otro sello
      // vigente: un profesional con dos sellos que pierde uno sigue verificado.
      for (const profileId of perfiles) {
        const restantes = await this.repo.findAllBySubject(tx, profileId);
        const sigueVigente = restantes.some(
          (badge) => badge.statusConceptId === CONCEPTS.STATE_ACTIVE,
        );
        if (sigueVigente) continue;

        const profile = await tx.findOne(PublicProfiles, { id: profileId });
        if (profile?.verificationStatusConceptId === CONCEPTS.STATE_ACTIVE) {
          profile.verificationStatusConceptId = CONCEPTS.STATE_EXPIRED;
          touch(profile, actorUserId);
        }
      }

      if (vencidos.length > 0) {
        this.logger.info(
          {
            operation: 'community.verification.expire-sweep',
            expired: vencidos.length,
            profiles: perfiles.size,
          },
          'Expired verified badges swept',
        );
      }

      return { expired: vencidos.length, profiles: perfiles.size };
    });
  }

  /**
   * El término de verificación del puntaje de prestigio (P12, tarea 6).
   *
   * P12 —el job `prestige-scores`— todavía no existe. Este método es el punto
   * por el que se va a conectar, y está acá y no allá a propósito: **de dónde
   * sale «verificado» es de este carril**. Si el job leyera
   * `public_profiles.verification_status_concept_id` por su cuenta, el
   * prestigio quedaría atado a la columna resumen en vez de al sello con
   * evidencia, y volveríamos a tener dos verdades.
   *
   * La escala es deliberadamente chata: un sello vigente suma, uno vencido no
   * resta. Restar castigaría a quien está renovando la matrícula, y el
   * prestigio no es el lugar donde se castiga un trámite.
   *
   * @param profile - Perfil público.
   * @param badges - Sus sellos.
   * @returns Término entre 0 y 1 para el puntaje de prestigio.
   */
  verificationTerm(
    profile: Pick<PublicProfiles, 'verificationStatusConceptId'>,
    badges: readonly VerifiedBadges[],
  ): number {
    return this.readBadge(profile, badges).status === 'VERIFIED' ? 1 : 0;
  }

  /**
   * El sello de un perfil, en la forma única que sirven todas las superficies.
   *
   * Deriva de los sellos —la fuente— y usa el resumen del perfil sólo para
   * distinguir «venció» de «nunca hubo». Si las dos se desincronizaran, manda
   * el sello: es el que tiene la evidencia detrás.
   *
   * @param profile - Perfil público.
   * @param badges - Sus sellos (vigentes y caídos).
   * @returns El campo `verifiedBadge` del contrato.
   */
  readBadge(
    profile: Pick<PublicProfiles, 'verificationStatusConceptId'>,
    badges: readonly VerifiedBadges[],
  ): VerifiedBadgeDto {
    const now = Date.now();
    const vigente = badges.find(
      (badge) =>
        badge.statusConceptId === CONCEPTS.STATE_ACTIVE &&
        (!badge.validFrom || badge.validFrom.getTime() <= now) &&
        (!badge.validTo || badge.validTo.getTime() >= now),
    );

    if (vigente) {
      return {
        status: 'VERIFIED',
        badgeTypeConceptId: vigente.badgeTypeConceptId,
        verificationMethodConceptId: vigente.verificationMethodConceptId,
        verifiedAt: vigente.validFrom?.toISOString() ?? null,
        validUntil: vigente.validTo?.toISOString() ?? null,
      };
    }

    // El más reciente de los caídos: es el que sostiene «Verificación vencida»
    // con una fecha, en vez de un rótulo sin respaldo.
    const caido = [...badges].sort(
      (a, b) => (b.validTo?.getTime() ?? 0) - (a.validTo?.getTime() ?? 0),
    )[0];

    const vencio =
      caido !== undefined ||
      profile.verificationStatusConceptId === CONCEPTS.STATE_EXPIRED;

    return {
      status: vencio ? 'EXPIRED' : 'NONE',
      badgeTypeConceptId: caido?.badgeTypeConceptId ?? null,
      verificationMethodConceptId: caido?.verificationMethodConceptId ?? null,
      verifiedAt: caido?.validFrom?.toISOString() ?? null,
      validUntil: caido?.validTo?.toISOString() ?? null,
    };
  }
}
