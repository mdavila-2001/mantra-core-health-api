import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { AuthenticationCredentials } from '../entities';
import { CONCEPTS, createdBy } from '../../../common';

/** Alta de una credencial de contraseña (identidad de login del usuario). */
export interface CreatePasswordCredentialData {
  userId: string;
  externalSubject: string;
  secretHash: string;
  actorUserId?: string;
}

/** Alta de una credencial federada (proveedor externo de identidad). */
export interface CreateFederatedCredentialData {
  userId: string;
  identityProvider: string;
  externalSubject: string;
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
}
