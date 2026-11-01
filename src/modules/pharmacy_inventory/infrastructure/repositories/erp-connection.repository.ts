import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { createdBy, touch } from '../../../../common';
import {
  ExternalProviders,
  ProviderConnections,
  ProviderCredentials,
} from '../../../integrations/entities';
import { INTEG } from '../../../integrations/integrations.concepts';
import { pharmacyConnectionFormat } from '../../domain/erp-connection/pharmacy-connection-format';
import {
  Pharmacies,
  PharmacyIntegrationConnections,
  PharmacySites,
} from '../../../pharmacy/entities';
import { PHARM } from '../../../pharmacy/pharmacy.concepts';
import {
  isPharmacySystemCode,
  type PharmacySystemCode,
} from '../../domain/erp-connection/pharmacy-stock-mode';

/**
 * Lo que se guarda en `provider_connections.config_json` de la conexión de una
 * farmacia con su sistema (FAR-C9). Nunca la clave: la clave va cifrada en
 * `provider_credentials.secret_ref` y acá solo sus últimos 4 caracteres.
 */
export interface ErpConnectionConfig {
  readonly version: 1;
  readonly baseUrl: string;
  /** El código con que el sistema conoce a la farmacia. */
  readonly pharmacyCode: string;
  /** Sede de la plataforma → código de esa sucursal en el sistema de la farmacia. */
  readonly siteCodes: Readonly<Record<string, string>>;
  readonly keyLast4: string | null;
  /** La pista fue calculada sin revelar íntegramente una clave corta. */
  readonly keyHintSafe?: boolean;
  /** `PINV_ERP_CONNECTION_*` de la última llamada o prueba de lo guardado. */
  readonly statusCode: string | null;
  /** `PINV_ERP_REASON_*` si quedó con error. */
  readonly reasonCode: string | null;
  /** Cuándo se supo ese estado (ISO). */
  readonly checkedAt: string | null;
}

/** La conexión de una farmacia, armada desde sus tres tablas. */
export interface ErpConnectionRecord {
  /** La fila de farmacia (`pharmacy_integration_connections`) que la vincula. */
  readonly link: PharmacyIntegrationConnections;
  readonly connection: ProviderConnections;
  readonly systemCode: PharmacySystemCode | null;
  readonly config: ErpConnectionConfig;
  /** La credencial activa, o `null`. */
  readonly credential: ProviderCredentials | null;
}

/** Datos de la farmacia que la conexión necesita. */
export interface PharmacyForConnection {
  readonly id: string;
  readonly tenantId: string;
  readonly code: string;
}

/**
 * Persistencia de la conexión de cada farmacia con su sistema, sobre las
 * entidades de `integrations` (`external_providers`, `provider_connections`,
 * `provider_credentials`) y el `connection_id` de la fila de farmacia. No pasa
 * por el módulo `integrations`: sus endpoints siguen siendo solo de
 * `SECURITY_ADMIN`, y acá se escribe con el ámbito de la farmacia ya resuelto.
 */
@Injectable()
export class ErpConnectionRepository {
  findPharmacy(
    em: EntityManager,
    pharmacyId: string,
  ): Promise<PharmacyForConnection | null> {
    return em
      .findOne(Pharmacies, { id: pharmacyId })
      .then((p) =>
        p ? { id: p.id, tenantId: p.tenantId, code: p.code } : null,
      );
  }

  findActiveSites(
    em: EntityManager,
    pharmacyId: string,
  ): Promise<PharmacySites[]> {
    return em.find(
      PharmacySites,
      { pharmacyId, statusConceptId: PHARM.SITE_ACTIVE },
      { orderBy: { createdAt: 'asc', id: 'asc' } },
    );
  }

  findSite(em: EntityManager, siteId: string): Promise<PharmacySites | null> {
    return em.findOne(PharmacySites, { id: siteId });
  }

  findConnectionById(
    em: EntityManager,
    connectionId: string,
  ): Promise<ProviderConnections | null> {
    return em.findOne(ProviderConnections, { id: connectionId });
  }

  findProviderByCode(
    em: EntityManager,
    code: PharmacySystemCode,
  ): Promise<ExternalProviders | null> {
    return em.findOne(ExternalProviders, {
      code,
      stateConceptId: INTEG.PROVIDER_ACTIVE,
    });
  }

  /**
   * La conexión de la farmacia: la fila de farmacia más nueva que tenga
   * `connection_id`, con su conexión y su credencial activa. `null` si la
   * farmacia nunca configuró su sistema.
   */
  async findForPharmacy(
    em: EntityManager,
    pharmacyId: string,
    options: { linkId?: string; erpOnly?: boolean } = {},
  ): Promise<ErpConnectionRecord | null> {
    const pharmacy = await this.findPharmacy(em, pharmacyId);
    if (!pharmacy) return null;
    const pageSize = 50;
    for (let offset = 0; ; offset += pageSize) {
      const links = await em.find(
        PharmacyIntegrationConnections,
        {
          pharmacyId,
          connectionId: { $ne: null },
          ...(options.linkId ? { id: options.linkId } : {}),
        },
        { orderBy: { createdAt: 'desc', id: 'asc' }, limit: pageSize, offset },
      );
      for (const link of links) {
        if (!link.connectionId) continue;
        const connection = await em.findOne(ProviderConnections, {
          id: link.connectionId,
          tenantId: pharmacy.tenantId,
        });
        if (
          !connection ||
          (options.erpOnly &&
            pharmacyConnectionFormat(connection.configJson) !== 'ERP')
        )
          continue;
        const provider = await em.findOne(ExternalProviders, {
          id: connection.providerId,
        });
        const credential = connection.credentialId
          ? await em.findOne(ProviderCredentials, {
              id: connection.credentialId,
              connectionId: connection.id,
              stateConceptId: INTEG.CRED_ACTIVE,
            })
          : null;
        return {
          link,
          connection,
          systemCode: isPharmacySystemCode(provider?.code)
            ? provider.code
            : null,
          config: readConfig(connection.configJson),
          credential,
        };
      }
      if (links.length < pageSize || options.linkId) return null;
    }
  }

  /**
   * La fila de farmacia que lleva la conexión: la de toda la farmacia (sin
   * sede) más vieja, o una nueva si la farmacia no tiene ninguna. Se crea
   * consultando stock y precios, activa.
   */
  async findOrCreateLink(
    em: EntityManager,
    pharmacyId: string,
    actorUserId: string,
  ): Promise<PharmacyIntegrationConnections> {
    const existing = await em.findOne(
      PharmacyIntegrationConnections,
      { pharmacyId, pharmacySiteId: null },
      { orderBy: { createdAt: 'asc', id: 'asc' } },
    );
    if (existing) return existing;
    return em.create(
      PharmacyIntegrationConnections,
      {
        pharmacyId,
        integrationModeConceptId: PHARM.INTEGRATION_MODE_REALTIME,
        supportsStockQuery: true,
        supportsPriceQuery: true,
        manualFallbackAllowed: true,
        statusConceptId: PHARM.CONNECTION_ACTIVE,
        ...createdBy(actorUserId),
      },
      { partial: true },
    );
  }

  createConnection(
    em: EntityManager,
    data: {
      providerId: string;
      tenantId: string;
      enabled: boolean;
      config: ErpConnectionConfig;
      actorUserId: string;
    },
  ): ProviderConnections {
    return em.create(
      ProviderConnections,
      {
        providerId: data.providerId,
        tenantId: data.tenantId,
        stateConceptId: data.enabled ? INTEG.CONN_ACTIVE : INTEG.CONN_PAUSED,
        environmentConceptId: INTEG.ENV_PRODUCTION,
        configJson: data.config,
        validFrom: new Date(),
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  updateConnection(
    connection: ProviderConnections,
    data: {
      providerId: string;
      enabled: boolean;
      config: ErpConnectionConfig;
      actorUserId: string;
    },
  ): void {
    connection.providerId = data.providerId;
    connection.stateConceptId = data.enabled
      ? INTEG.CONN_ACTIVE
      : INTEG.CONN_PAUSED;
    connection.configJson = data.config;
    touch(connection, data.actorUserId);
  }

  /** Solo el estado de la última llamada: no toca nada más de la conexión. */
  recordStatus(
    connection: ProviderConnections,
    status: Pick<
      ErpConnectionConfig,
      'statusCode' | 'reasonCode' | 'checkedAt'
    >,
  ): void {
    connection.configJson = { ...readConfig(connection.configJson), ...status };
  }

  /** Retira la credencial activa (si hay) y crea la nueva, cifrada. */
  rotateCredential(
    em: EntityManager,
    connection: ProviderConnections,
    previous: ProviderCredentials | null,
    sealedSecret: string,
    actorUserId: string,
  ): ProviderCredentials {
    if (previous) {
      previous.stateConceptId = INTEG.CRED_RETIRED;
      previous.rotatedAt = new Date();
      touch(previous, actorUserId);
    }
    return em.create(
      ProviderCredentials,
      {
        connectionId: connection.id,
        secretTypeConceptId: INTEG.SECRET_API_KEY,
        secretRef: sealedSecret,
        encrypted: true,
        stateConceptId: INTEG.CRED_ACTIVE,
        ...createdBy(actorUserId),
      },
      { partial: true },
    );
  }
}

/** `config_json` tal como quedó guardado; lo que falte, vacío. */
export function readConfig(raw: unknown): ErpConnectionConfig {
  const value =
    typeof raw === 'object' && raw !== null
      ? (raw as Record<string, unknown>)
      : {};
  const text = (key: string): string | null =>
    typeof value[key] === 'string' ? value[key] : null;
  const siteCodes: Record<string, string> = {};
  if (typeof value.siteCodes === 'object' && value.siteCodes !== null) {
    for (const [siteId, code] of Object.entries(value.siteCodes)) {
      if (typeof code === 'string' && code.trim() !== '')
        siteCodes[siteId] = code;
    }
  }
  return {
    version: 1,
    baseUrl: text('baseUrl') ?? '',
    pharmacyCode: text('pharmacyCode') ?? '',
    siteCodes,
    keyLast4: value.keyHintSafe === true ? text('keyLast4') : null,
    keyHintSafe: value.keyHintSafe === true,
    statusCode: text('statusCode'),
    reasonCode: text('reasonCode'),
    checkedAt: text('checkedAt'),
  };
}
