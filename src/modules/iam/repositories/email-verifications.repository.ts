import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { EmailVerifications } from '../entities';
import { CONCEPTS, createdBy } from '../../../common';

/** Datos para emitir una verificación de correo de un solo uso. */
export interface CreateEmailVerificationData {
  /**
   * Identificador asociado a user.
   */
  userId: string;
  /**
   * Dirección que se está verificando.
   */
  email: string;
  /** SHA-256 (hex) del token; el token en claro nunca se persiste. */
  tokenHash: string;
  /**
   * Valor de expires at mantenido por la instancia.
   */
  expiresAt: Date;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Acceso a datos de `iam.email_verifications`.
 *
 * Recibe el `EntityManager` activo para que el servicio controle la transacción.
 * Sin reglas de negocio: solo consultas y materialización.
 */
@Injectable()
export class EmailVerificationsRepository {
  /** Crea una verificación en estado ACTIVE (pendiente de consumo). Sin flush. */
  create(
    em: EntityManager,
    data: CreateEmailVerificationData,
  ): EmailVerifications {
    return em.create(
      EmailVerifications,
      {
        userId: data.userId,
        email: data.email,
        tokenHash: data.tokenHash,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
        expiresAt: data.expiresAt,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /** Verificación por hash del token; `null` si no existe. */
  findByTokenHash(
    em: EntityManager,
    tokenHash: string,
  ): Promise<EmailVerifications | null> {
    return em.findOne(EmailVerifications, { tokenHash });
  }
}
