import type { EntityManager } from '@mikro-orm/postgresql';
import type {
  ExternalSystemConfig,
  ExternalSystemFormat,
} from '../../domain/sync/external-system';
import type { ExternalPharmacyCatalogPort } from './external-pharmacy-catalog.port';

/** De quién es el sistema con que se habla. */
export type ExternalSystemSource = 'PHARMACY' | 'SERVER';

/** Lo que resulta de buscar el sistema de una conexión de farmacia. */
export type ResolvedExternalSystem =
  | {
      readonly status: 'READY';
      readonly source: ExternalSystemSource;
      readonly client: ExternalPharmacyCatalogPort;
    }
  /** Ni la farmacia cargó el suyo ni el servidor tiene uno. */
  | { readonly status: 'NOT_CONFIGURED' }
  /** La farmacia cargó una dirección que la política de hosts no deja llamar. */
  | { readonly status: 'HOST_NOT_ALLOWED' };

/** Lo que se muestra del sistema de la farmacia. Nunca la clave. */
export interface ExternalSystemSummary {
  readonly format: ExternalSystemFormat;
  readonly baseUrl: string;
  readonly externalPharmacyCode: string;
  /** Si hay una clave activa guardada. */
  readonly apiKeyConfigured: boolean;
  readonly configuredAt: string;
}

/**
 * El sistema propio de cada farmacia (FAR-C9 · C9-3): guardarlo, quitarlo,
 * describirlo y conseguir el cliente para hablarle. Lo implementa la
 * infraestructura sobre el módulo de integraciones.
 */
export interface ExternalPharmacySystemPort {
  /** Si el servidor tiene su propio sistema (`PHARMACY_ERP_BASE_URL`). */
  serverConfigured(): boolean;

  /**
   * El sistema con que se habla para una conexión de farmacia: el suyo si
   * tiene `connectionId`, si no el del servidor.
   */
  resolve(
    em: EntityManager,
    tenantId: string,
    connectionId: string | null,
  ): Promise<ResolvedExternalSystem>;

  /** El resumen de varias conexiones de integraciones del tenant. */
  describe(
    em: EntityManager,
    tenantId: string,
    connectionIds: readonly string[],
  ): Promise<Map<string, ExternalSystemSummary>>;

  /** `null` si se puede llamar a esa dirección; si no, el motivo. */
  urlProblem(baseUrl: string): 'URL_INVALID' | 'HOST_NOT_ALLOWED' | null;

  /** Un cliente para una configuración todavía no guardada (para probarla). */
  clientFor(
    config: ExternalSystemConfig,
    apiKey: string,
  ): ExternalPharmacyCatalogPort;

  /**
   * Guarda el sistema: crea la conexión de integraciones si `connectionId` es
   * nulo, o la actualiza; la clave anterior se retira y queda la nueva.
   *
   * @returns El id de la conexión de integraciones.
   */
  save(
    em: EntityManager,
    data: {
      readonly tenantId: string;
      readonly connectionId: string | null;
      readonly config: ExternalSystemConfig;
      readonly apiKey: string;
      readonly actorUserId: string;
    },
  ): Promise<string>;

  /** Pausa la conexión de integraciones y retira su clave. */
  remove(
    em: EntityManager,
    data: {
      readonly tenantId: string;
      readonly connectionId: string;
      readonly actorUserId: string;
    },
  ): Promise<void>;
}

/** Token de inyección del puerto. */
export const EXTERNAL_PHARMACY_SYSTEM_PORT = Symbol(
  'EXTERNAL_PHARMACY_SYSTEM_PORT',
);
