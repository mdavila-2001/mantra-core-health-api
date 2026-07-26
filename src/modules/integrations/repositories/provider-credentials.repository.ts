import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { ProviderCredentials } from '../entities';
import { createdBy } from '../../../common';

/** Datos para crear una credencial de conexión (UC-12-02 / UC-12-03). */
export interface CreateCredentialData {
  connectionId: string;
  secretTypeConceptId: string;
  stateConceptId: string;
  secretRef?: string;
  encrypted?: boolean;
  expiresAt?: Date;
  rotatedAt?: Date;
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
