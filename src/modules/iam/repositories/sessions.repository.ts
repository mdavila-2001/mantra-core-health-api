import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { Sessions } from '../entities';
import { CONCEPTS, createdBy } from '../../../common';

/** Alta de una sesión al abrir o rotar tokens. */
export interface CreateSessionData {
  userId: string;
  tokenId: string;
  expiresAt: Date;
  deviceId?: string;
  ip?: string;
  actorUserId?: string;
}

/**
 * Acceso a datos de `iam.sessions`. Métodos stateless que reciben el
 * `EntityManager` activo; las revocaciones en bloque usan `nativeUpdate` para no
 * materializar filas que no se necesitan.
 */
@Injectable()
export class SessionsRepository {
  /** Crea una sesión ACTIVA (sin flush). */
  create(em: EntityManager, data: CreateSessionData): Sessions {
    return em.create(
      Sessions,
      {
        userId: data.userId,
        tokenId: data.tokenId,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
        expiresAt: data.expiresAt,
        deviceId: data.deviceId,
        ip: data.ip,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /** Busca una sesión por id; `null` si no existe. */
  findById(em: EntityManager, id: string): Promise<Sessions | null> {
    return em.findOne(Sessions, { id });
  }

  /** Revoca una sesión concreta (detección de reuso de refresh token). */
  revokeById(em: EntityManager, id: string): Promise<number> {
    return em.nativeUpdate(
      Sessions,
      { id },
      { stateConceptId: CONCEPTS.STATE_REVOKED, updatedAt: new Date() },
    );
  }

  /** Ids de las sesiones ACTIVAS del usuario (para cascada a refresh tokens). */
  async activeSessionIdsForUser(
    em: EntityManager,
    userId: string,
  ): Promise<string[]> {
    const rows = await em.find(
      Sessions,
      { userId, stateConceptId: CONCEPTS.STATE_ACTIVE },
      { fields: ['id'] },
    );
    return rows.map((s) => s.id);
  }

  /** Revoca en bloque las sesiones ACTIVAS del usuario. Devuelve nº afectadas. */
  revokeAllActiveForUser(em: EntityManager, userId: string): Promise<number> {
    return em.nativeUpdate(
      Sessions,
      { userId, stateConceptId: CONCEPTS.STATE_ACTIVE },
      { stateConceptId: CONCEPTS.STATE_REVOKED, updatedAt: new Date() },
    );
  }

  /** Marca EXPIRED las sesiones ACTIVAS ya vencidas. Devuelve nº afectadas. */
  purgeExpired(em: EntityManager, now: Date): Promise<number> {
    return em.nativeUpdate(
      Sessions,
      { stateConceptId: CONCEPTS.STATE_ACTIVE, expiresAt: { $lt: now } },
      { stateConceptId: CONCEPTS.STATE_EXPIRED, updatedAt: now },
    );
  }
}
