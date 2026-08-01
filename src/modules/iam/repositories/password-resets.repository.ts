import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PasswordResets } from '../entities';
import { CONCEPTS, createdBy } from '../../../common';

/** Datos para emitir una solicitud de restablecimiento de un solo uso. */
export interface CreatePasswordResetData {
  /**
   * Identificador asociado a user.
   */
  userId: string;
  /** Identificador con el que se pidió (email o documento). */
  externalSubject: string;
  /** SHA-256 (hex) del token; el token en claro nunca se persiste. */
  tokenHash: string;
  /**
   * Valor de expires at mantenido por la instancia.
   */
  expiresAt: Date;
  /** Origen de la solicitud, para auditar abuso del formulario. */
  requestedIp?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Acceso a datos de `iam.password_resets`.
 *
 * Recibe el `EntityManager` activo para que el servicio controle la transacción.
 * Sin reglas de negocio: sólo consultas y materialización.
 */
@Injectable()
export class PasswordResetsRepository {
  /** Crea una solicitud en estado ACTIVE (pendiente de consumo). Sin flush. */
  create(em: EntityManager, data: CreatePasswordResetData): PasswordResets {
    return em.create(
      PasswordResets,
      {
        userId: data.userId,
        externalSubject: data.externalSubject,
        tokenHash: data.tokenHash,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
        expiresAt: data.expiresAt,
        requestedIp: data.requestedIp,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /** Solicitud por hash del token; `null` si no existe. */
  findByTokenHash(
    em: EntityManager,
    tokenHash: string,
  ): Promise<PasswordResets | null> {
    return em.findOne(PasswordResets, { tokenHash });
  }

  /**
   * Revoca las solicitudes vivas del usuario.
   *
   * Pedir un enlace nuevo invalida los anteriores: si no, cada solicitud dejaría
   * una llave más rondando en una bandeja de entrada, y bastaría con que una sola
   * de todas se filtrara. También es lo que cierra la puerta después de un
   * restablecimiento consumado.
   *
   * @param em - Contexto de persistencia.
   * @param userId - Usuario cuyas solicitudes vivas se invalidan.
   * @returns Cuántas solicitudes se revocaron.
   */
  revokeActiveForUser(em: EntityManager, userId: string): Promise<number> {
    return em.nativeUpdate(
      PasswordResets,
      { userId, stateConceptId: CONCEPTS.STATE_ACTIVE },
      { stateConceptId: CONCEPTS.STATE_REVOKED, updatedAt: new Date() },
    );
  }
}
