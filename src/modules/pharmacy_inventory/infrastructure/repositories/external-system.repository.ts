import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { createdBy, touch } from '../../../../common';
import {
  ExternalProviders,
  ProviderConnections,
  ProviderCredentials,
} from '../../../integrations/entities';
import { INTEG } from '../../../integrations/integrations.concepts';
import {
  EXTERNAL_SYSTEM_PROVIDER_CODE,
  EXTERNAL_SYSTEM_PROVIDER_NAME,
  type ExternalSystemFormat,
} from '../../domain/sync/external-system';

/** Una conexión de integraciones con su credencial activa, si la tiene. */
export interface ExternalSystemRow {
  readonly connection: ProviderConnections;
  readonly credential: ProviderCredentials | null;
}

/**
 * El sistema propio de cada farmacia guardado en el módulo de integraciones
 * (FAR-C9 · C9-3): un proveedor por formato (`external_providers`), una
 * conexión por conexión de farmacia (`provider_connections`, con la dirección
 * y el código en `config_json`) y la clave cifrada en su credencial
 * (`provider_credentials`).
 *
 * Es infraestructura: el único lugar del inventario de farmacia que conoce las
 * tablas de integraciones.
 */
@Injectable()
export class ExternalSystemRepository {
  /**
   * El proveedor del formato; si no existe, lo crea activo. La fila es la
   * misma para todas las farmacias que hablan ese formato.
   */
  async ensureProvider(
    em: EntityManager,
    format: ExternalSystemFormat,
    actorUserId: string,
  ): Promise<ExternalProviders> {
    const code = EXTERNAL_SYSTEM_PROVIDER_CODE[format];
    const found = await em.findOne(ExternalProviders, { code });
    if (found) return found;
    const provider = em.create(
      ExternalProviders,
      {
        code,
        name: EXTERNAL_SYSTEM_PROVIDER_NAME[format],
        providerTypeConceptId: INTEG.PROVIDER_TYPE_GENERIC,
        authTypeConceptId: INTEG.AUTH_API_KEY,
        stateConceptId: INTEG.PROVIDER_ACTIVE,
        ...createdBy(actorUserId),
      },
      { partial: true },
    );
    em.persist(provider);
    return provider;
  }

  /** La conexión del tenant, con su credencial activa; `null` si no es suya. */
  async find(
    em: EntityManager,
    connectionId: string,
    tenantId: string,
  ): Promise<ExternalSystemRow | null> {
    const connection = await em.findOne(ProviderConnections, {
      id: connectionId,
      tenantId,
    });
    if (!connection) return null;
    const credential = await em.findOne(
      ProviderCredentials,
      { connectionId, stateConceptId: INTEG.CRED_ACTIVE },
      { orderBy: { createdAt: 'desc' } },
    );
    return { connection, credential };
  }

  /** Varias conexiones del tenant a la vez (para el listado). */
  async findMany(
    em: EntityManager,
    connectionIds: readonly string[],
    tenantId: string,
  ): Promise<Map<string, ExternalSystemRow>> {
    const rows = new Map<string, ExternalSystemRow>();
    if (connectionIds.length === 0) return rows;
    const connections = await em.find(ProviderConnections, {
      id: { $in: [...connectionIds] },
      tenantId,
    });
    const credentials = await em.find(
      ProviderCredentials,
      {
        connectionId: { $in: connections.map((c) => c.id) },
        stateConceptId: INTEG.CRED_ACTIVE,
      },
      { orderBy: { createdAt: 'desc' } },
    );
    for (const connection of connections) {
      rows.set(connection.id, {
        connection,
        credential:
          credentials.find((c) => c.connectionId === connection.id) ?? null,
      });
    }
    return rows;
  }

  /** Una conexión nueva del tenant, activa, con su configuración. */
  createConnection(
    em: EntityManager,
    data: {
      providerId: string;
      tenantId: string;
      configJson: Record<string, unknown>;
      actorUserId: string;
    },
  ): ProviderConnections {
    const connection = em.create(
      ProviderConnections,
      {
        providerId: data.providerId,
        tenantId: data.tenantId,
        configJson: data.configJson,
        stateConceptId: INTEG.CONN_ACTIVE,
        validFrom: new Date(),
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
    em.persist(connection);
    return connection;
  }

  /** Una credencial activa nueva con la clave ya cifrada. */
  createCredential(
    em: EntityManager,
    data: {
      connectionId: string;
      encryptedKeyRef: string;
      actorUserId: string;
    },
  ): ProviderCredentials {
    const credential = em.create(
      ProviderCredentials,
      {
        connectionId: data.connectionId,
        secretTypeConceptId: INTEG.SECRET_API_KEY,
        stateConceptId: INTEG.CRED_ACTIVE,
        secretRef: data.encryptedKeyRef,
        encrypted: true,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
    em.persist(credential);
    return credential;
  }

  /** Retira una credencial: deja de valer, la fila queda para auditoría. */
  retireCredential(credential: ProviderCredentials, actorUserId: string): void {
    credential.stateConceptId = INTEG.CRED_RETIRED;
    credential.rotatedAt = new Date();
    touch(credential, actorUserId);
  }

  /** Pausa una conexión que la farmacia dejó de usar. */
  pauseConnection(connection: ProviderConnections, actorUserId: string): void {
    connection.stateConceptId = INTEG.CONN_PAUSED;
    connection.validTo = new Date();
    touch(connection, actorUserId);
  }
}
