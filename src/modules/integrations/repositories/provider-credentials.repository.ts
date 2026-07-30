import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { ProviderCredentials } from '../entities';
import { createdBy } from '../../../common';

/** Datos para crear una credencial de conexión (UC-12-02 / UC-12-03). */
export interface CreateCredentialData {
  /**
   * Identificador asociado a connection.
   */
  connectionId: string;
  /**
   * Identificador asociado a secret type concept.
   */
  secretTypeConceptId: string;
  /**
   * Identificador asociado a state concept.
   */
  stateConceptId: string;
  /**
   * Valor de secret ref mantenido por la instancia.
   */
  secretRef?: string;
  /**
   * Valor de encrypted mantenido por la instancia.
   */
  encrypted?: boolean;
  /**
   * Valor de expires at mantenido por la instancia.
   */
  expiresAt?: Date;
  /**
   * Valor de rotated at mantenido por la instancia.
   */
  rotatedAt?: Date;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `integrations.provider_credentials`. */
@Injectable()
export class ProviderCredentialsRepository {
  /** Credencial actualmente ACTIVE de una conexión (a lo sumo una). */
  findActiveByConnection(
    em: EntityManager,
    connectionId: string,
    activeStateConceptId: string,
  ): Promise<ProviderCredentials | null> {
    return em.findOne(ProviderCredentials, {
      connectionId,
      stateConceptId: activeStateConceptId,
    });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `ProviderCredentials`.
   */
  create(em: EntityManager, data: CreateCredentialData): ProviderCredentials {
    return em.create(
      ProviderCredentials,
      {
        connectionId: data.connectionId,
        secretTypeConceptId: data.secretTypeConceptId,
        stateConceptId: data.stateConceptId,
        secretRef: data.secretRef,
        encrypted: data.encrypted,
        expiresAt: data.expiresAt,
        rotatedAt: data.rotatedAt,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
