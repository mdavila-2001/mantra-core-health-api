import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import { RefreshTokens } from '../entities';
import { CONCEPTS, createdBy } from '../../../common';

/** Alta de un refresh token ligado a una sesión. */
export interface CreateRefreshTokenData {
  /**
   * Identificador asociado a session.
   */
  sessionId: string;
  /**
   * Valor de token hash mantenido por la instancia.
   */
  tokenHash: string;
  /**
   * Valor de expires at mantenido por la instancia.
   */
  expiresAt: Date;
  /**
   * Identificador asociado a replaced by.
   */
  replacedById?: string;
  /**
   * Identificador asociado a actor user.
   */
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
    return em.create(
      RefreshTokens,
      {
        sessionId: data.sessionId,
        tokenHash: data.tokenHash,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
        expiresAt: data.expiresAt,
        replacedById: data.replacedById,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /** Busca un refresh token por su hash SHA-256. */
  findByHash(
    em: EntityManager,
    tokenHash: string,
  ): Promise<RefreshTokens | null> {
    return em.findOne(RefreshTokens, { tokenHash });
  }

  /**
   * Lee el refresh token bloqueando su fila (`FOR UPDATE`) hasta el fin de la
   * transacción. Dos peticiones con el mismo token se serializan acá: la
   * segunda espera y ve el estado que dejó la primera (MCH-005).
   *
   * @param em - Transacción activa; el bloqueo no existe fuera de una.
   * @param tokenHash - SHA-256 del token presentado.
   * @returns El token bloqueado, o `null`.
   */
  findByHashForUpdate(
    em: EntityManager,
    tokenHash: string,
  ): Promise<RefreshTokens | null> {
    return em.findOne(
      RefreshTokens,
      { tokenHash },
      { lockMode: LockMode.PESSIMISTIC_WRITE, refresh: true },
    );
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
  revokeActiveBySessionIds(
    em: EntityManager,
    sessionIds: string[],
  ): Promise<number> {
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
