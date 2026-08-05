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

  /**
   * Última dirección de correo registrada para el usuario, o `null` si no
   * declaró ninguna.
   *
   * Es la forma de saber a dónde escribirle a alguien que **entra con su
   * documento**: su `external_subject` es la cédula, no un correo. Esta tabla es
   * el único sitio que relaciona `user_id` con una dirección de forma directa;
   * en `common.contact_points` el correo cuelga de la persona o del paciente
   * según el flujo que creó la cuenta, así que no hay una consulta única.
   *
   * Devuelve la más reciente aunque no esté verificada: no poder probar que una
   * dirección es alcanzable no es motivo para no intentar escribirle a alguien
   * que pidió recuperar su cuenta.
   *
   * @param em - Contexto de persistencia.
   * @param userId - Usuario cuyo correo se busca.
   * @returns La verificación más reciente, con su dirección; `null` si no hay.
   */
  findLatestByUser(
    em: EntityManager,
    userId: string,
  ): Promise<EmailVerifications | null> {
    return em.findOne(
      EmailVerifications,
      { userId },
      { orderBy: { createdAt: 'DESC' } },
    );
  }
}
