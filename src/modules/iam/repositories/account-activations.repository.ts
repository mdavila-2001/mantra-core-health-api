import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { AccountActivations } from '../entities';
import { CONCEPTS, createdBy } from '../../../common';

/** Datos para emitir una activación de cuenta de un solo uso (registro asistido). */
export interface CreateActivationData {
  /**
   * Identificador asociado a user.
   */
  userId: string;
  /** SHA-256 (hex) del token de activación; el token en claro nunca se persiste. */
  tokenHash: string;
  /**
   * Valor de expires at mantenido por la instancia.
   */
  expiresAt: Date;
  /**
   * Valor de reason mantenido por la instancia.
   */
  reason?: string;
  /**
   * Identificador asociado a legal representation.
   */
  legalRepresentationId?: string;
  /**
   * Identificador asociado a legal representative user.
   */
  legalRepresentativeUserId?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Acceso a datos de `iam.account_activations`.
 *
 * Recibe el `EntityManager` activo para que el servicio controle la transacción.
 * Sin reglas de negocio: solo consultas y materialización.
 */
@Injectable()
export class AccountActivationsRepository {
  /** Crea una activación en estado ACTIVE (pendiente de consumo). Sin flush. */
  create(em: EntityManager, data: CreateActivationData): AccountActivations {
    return em.create(
      AccountActivations,
      {
        userId: data.userId,
        tokenHash: data.tokenHash,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
        reason: data.reason,
        legalRepresentationId: data.legalRepresentationId,
        legalRepresentativeUserId: data.legalRepresentativeUserId,
        expiresAt: data.expiresAt,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /** Activación por hash del token; `null` si no existe. */
  findByTokenHash(
    em: EntityManager,
    tokenHash: string,
  ): Promise<AccountActivations | null> {
    return em.findOne(AccountActivations, { tokenHash });
  }
}
