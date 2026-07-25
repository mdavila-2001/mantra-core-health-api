import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { RefreshTokens } from '../entities';
import { CONCEPTS, createdBy } from '../../../common';

/** Alta de un refresh token ligado a una sesión. */
export interface CreateRefreshTokenData {
  sessionId: string;
  tokenHash: string;
  expiresAt: Date;
  replacedById?: string;
  actorUserId?: string;
}

/**
 * Acceso a datos de `iam.refresh_tokens`. La detección de reuso y la rotación se
 * apoyan en búsquedas por hash y en revocaciones en bloque por sesión.
 */
@Injectable()
export class RefreshTokensRepository {
  /** Crea un refresh token ACTIVO (sin flush). */
  create(em: EntityManager, data: CreateRefreshTokenData): RefreshTokens {
    return em.create(RefreshTokens, {
      sessionId: data.sessionId,
      tokenHash: data.tokenHash,
      stateConceptId: CONCEPTS.STATE_ACTIVE,
      expiresAt: data.expiresAt,
      replacedById: data.replacedById,
      ...createdBy(data.actorUserId),
    }, { partial: true });
  }

  /** Busca un refresh token por su hash SHA-256. */
  findByHash(em: EntityManager, tokenHash: string): Promise<RefreshTokens | null> {
    return em.findOne(RefreshTokens, { tokenHash });
  }

  /** Revoca todos los refresh tokens de una sesión (detección de reuso). */
  revokeBySessionId(em: EntityManager, sessionId: string): Promise<number> {
    return em.nativeUpdate(
      RefreshTokens,
      { sessionId },
      { stateConceptId: CONCEPTS.STATE_REVOKED, updatedAt: new Date() },
    );
  }

  /** Revoca los refresh tokens ACTIVOS de un conjunto de sesiones. */
  revokeActiveBySessionIds(em: EntityManager, sessionIds: string[]): Promise<number> {
    if (sessionIds.length === 0) return Promise.resolve(0);
    return em.nativeUpdate(
      RefreshTokens,
      { sessionId: { $in: sessionIds }, stateConceptId: CONCEPTS.STATE_ACTIVE },
      { stateConceptId: CONCEPTS.STATE_REVOKED, updatedAt: new Date() },
    );
  }

  /** Marca EXPIRED los refresh tokens ACTIVOS ya vencidos. */
  purgeExpired(em: EntityManager, now: Date): Promise<number> {
    return em.nativeUpdate(
      RefreshTokens,
      { stateConceptId: CONCEPTS.STATE_ACTIVE, expiresAt: { $lt: now } },
      { stateConceptId: CONCEPTS.STATE_EXPIRED, updatedAt: now },
    );
  }
}
