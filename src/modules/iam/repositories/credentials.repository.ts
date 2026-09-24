import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { AuthenticationCredentials } from '../entities';
import { CONCEPTS, createdBy } from '../../../common';

/** Alta de una credencial de contraseña (identidad de login del usuario). */
export interface CreatePasswordCredentialData {
  /**
   * Identificador asociado a user.
   */
  userId: string;
  /**
   * Valor de external subject mantenido por la instancia.
   */
  externalSubject: string;
  /**
   * Valor de secret hash mantenido por la instancia.
   */
  secretHash: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Alta de una credencial federada (proveedor externo de identidad). */
export interface CreateFederatedCredentialData {
  /**
   * Identificador asociado a user.
   */
  userId: string;
  /**
   * Valor de identity provider mantenido por la instancia.
   */
  identityProvider: string;
  /**
   * Valor de external subject mantenido por la instancia.
   */
  externalSubject: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Acceso a datos de `iam.authentication_credentials`.
 *
 * Cada método recibe el `EntityManager` activo para que el servicio controle la
 * transacción. No contiene reglas de negocio: solo consultas y materialización.
 */
@Injectable()
export class CredentialsRepository {
  /** Credencial de contraseña ACTIVA cuyo `external_subject` es el email dado. */
  findActivePasswordBySubject(
    em: EntityManager,
    externalSubject: string,
  ): Promise<AuthenticationCredentials | null> {
    return em.findOne(AuthenticationCredentials, {
      methodConceptId: CONCEPTS.CRED_PASSWORD,
      externalSubject,
      stateConceptId: CONCEPTS.STATE_ACTIVE,
    });
  }

  /**
   * Credenciales cuyo sujeto contiene el texto dado, para buscar usuarios por
   * correo o documento desde el listado de administración.
   *
   * Devuelve sólo el `user_id` porque es lo único que el listado necesita: traer
   * la fila entera arrastraría el hash de la contraseña a memoria en cada
   * búsqueda, sin motivo.
   *
   * @param em - Contexto de persistencia.
   * @param text - Texto a buscar dentro del sujeto.
   * @param limit - Tope de coincidencias a resolver.
   * @returns Identificadores de usuario de las credenciales que casan.
   */
  findBySubjectMatch(
    em: EntityManager,
    text: string,
    limit: number,
  ): Promise<{ userId: string }[]> {
    return em.find(
      AuthenticationCredentials,
      { externalSubject: { $ilike: `%${text}%` } },
      { fields: ['userId'], limit },
    );
  }

  /**
   * Serializa, dentro de la transacción actual, las altas que reclaman el mismo
   * identificador de login (subtarea 7.1).
   *
   * Es un `pg_advisory_xact_lock`, el mismo patrón que `AuditLogRepository`: se
   * toma sobre la transacción que va a insertar la credencial y se libera solo
   * al COMMIT/ROLLBACK. Sin él, dos altas simultáneas con la misma cédula pasan
   * las dos por {@link findLivePasswordBySubject} sin ver nada, y la segunda
   * choca recién contra `ux_authentication_credentials_live_password_subject`
   * con el 409 genérico del filtro. Con él, la segunda espera, vuelve a leer
   * —en READ COMMITTED cada sentencia ve lo ya confirmado— y recibe el 409 de
   * dominio. El índice único sigue siendo la garantía de fondo.
   *
   * La clave va prefijada para no compartir espacio con otros cerrojos.
   */
  lockSubjectForRegistration(
    em: EntityManager,
    externalSubject: string,
  ): Promise<unknown> {
    return em.execute('SELECT pg_advisory_xact_lock(hashtext(?))', [
      `iam:credential-subject:${externalSubject}`,
    ]);
  }

  /**
   * Credencial de contraseña VIVA (ACTIVA o PENDIENTE de activación) para el
   * identificador dado. Sustenta la detección de duplicados del registro asistido
   * (C-18): si ya existe una cuenta con el identificador verificado no se crea otra.
   */
  findLivePasswordBySubject(
    em: EntityManager,
    externalSubject: string,
  ): Promise<AuthenticationCredentials | null> {
    return em.findOne(AuthenticationCredentials, {
      methodConceptId: CONCEPTS.CRED_PASSWORD,
      externalSubject,
      stateConceptId: {
        $in: [CONCEPTS.STATE_ACTIVE, CONCEPTS.STATE_PENDING],
      },
    });
  }

  /** Credencial de contraseña PENDIENTE (sin secreto) de un usuario; para su activación. */
  findPendingPasswordByUser(
    em: EntityManager,
    userId: string,
  ): Promise<AuthenticationCredentials | null> {
    return em.findOne(AuthenticationCredentials, {
      userId,
      methodConceptId: CONCEPTS.CRED_PASSWORD,
      stateConceptId: CONCEPTS.STATE_PENDING,
    });
  }

  /** Credencial federada existente para (usuario, proveedor, sujeto). */
  findFederated(
    em: EntityManager,
    userId: string,
    identityProvider: string,
    externalSubject: string,
  ): Promise<AuthenticationCredentials | null> {
    return em.findOne(AuthenticationCredentials, {
      userId,
      identityProvider,
      externalSubject,
    });
  }

  /** Credencial por id que además pertenece al usuario indicado. */
  findByIdAndUser(
    em: EntityManager,
    id: string,
    userId: string,
  ): Promise<AuthenticationCredentials | null> {
    return em.findOne(AuthenticationCredentials, { id, userId });
  }

  /**
   * Crea una credencial de contraseña PENDIENTE, sin secreto (registro asistido,
   * C-18). Reserva la identidad de login (`external_subject`) y bloquea duplicados,
   * pero no puede autenticar hasta que el titular fije su contraseña en la
   * activación (pasa a ACTIVA con `secret_hash`). Sin flush.
   */
  createPendingPassword(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a user.
       */
      userId: string; /**
       * Valor de external subject mantenido por la instancia.
       */
      externalSubject: string; /**
       * Identificador asociado a actor user.
       */
      actorUserId?: string;
    },
  ): AuthenticationCredentials {
    return em.create(
      AuthenticationCredentials,
      {
        userId: data.userId,
        methodConceptId: CONCEPTS.CRED_PASSWORD,
        stateConceptId: CONCEPTS.STATE_PENDING,
        externalSubject: data.externalSubject,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /** Crea una credencial de contraseña ACTIVA (sin flush). */
  createPassword(
    em: EntityManager,
    data: CreatePasswordCredentialData,
  ): AuthenticationCredentials {
    return em.create(
      AuthenticationCredentials,
      {
        userId: data.userId,
        methodConceptId: CONCEPTS.CRED_PASSWORD,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
        externalSubject: data.externalSubject,
        secretHash: data.secretHash,
        hashAlgorithmConceptId: CONCEPTS.HASH_ARGON2ID,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /** Crea una credencial federada ACTIVA (sin flush). */
  createFederated(
    em: EntityManager,
    data: CreateFederatedCredentialData,
  ): AuthenticationCredentials {
    return em.create(
      AuthenticationCredentials,
      {
        userId: data.userId,
        methodConceptId: CONCEPTS.CRED_FEDERATED,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
        identityProvider: data.identityProvider,
        externalSubject: data.externalSubject,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /** Revoca en bloque todas las credenciales del usuario (anonimización). */
  revokeAllForUser(em: EntityManager, userId: string): Promise<number> {
    return em.nativeUpdate(
      AuthenticationCredentials,
      { userId },
      { stateConceptId: CONCEPTS.STATE_REVOKED, updatedAt: new Date() },
    );
  }

  /**
   * Credenciales del usuario, para la vista de administración.
   *
   * Devuelve la entidad completa; el servicio decide qué se publica. El hash y la
   * clave pública nunca salen de aquí hacia el contrato.
   */
  findByUser(
    em: EntityManager,
    userId: string,
  ): Promise<AuthenticationCredentials[]> {
    return em.find(
      AuthenticationCredentials,
      { userId },
      { orderBy: { createdAt: 'DESC' } },
    );
  }
}
