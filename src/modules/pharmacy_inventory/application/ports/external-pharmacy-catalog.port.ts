import type { PharmacySystemCode } from '../../domain/erp-connection/pharmacy-stock-mode';
import type {
  ExternalPrice,
  ExternalProduct,
  ExternalStockLine,
} from '../../domain/sync/external-catalog';

export type { ExternalPrice, ExternalProduct, ExternalStockLine };

/**
 * Puerto de salida hacia el sistema de gestión de una farmacia externa
 * (FAR-07): su catálogo y el stock de cada sucursal, con sus propios códigos.
 * La traducción a productos de la plataforma la hacen los vínculos de la
 * conexión, no el adaptador.
 *
 * Un adaptador que no puede hablar con el sistema lanza
 * `ExternalCatalogUnavailableError` (dominio), nunca un error del cliente HTTP.
 */
export interface ExternalPharmacyCatalogPort {
  /** Si el entorno dice dónde está el sistema externo. */
  isConfigured(): boolean;
  /** El catálogo del sistema externo. */
  listProducts(): Promise<ExternalProduct[]>;
  /**
   * El stock de una sucursal, por el código que la farmacia le da a esa sede y
   * el de la farmacia (`pharmacies.code`): dos farmacias pueden tener sedes con
   * el mismo código, y no comparten stock.
   */
  stockForSite(
    siteCode: string,
    pharmacyCode?: string,
  ): Promise<ExternalStockLine[]>;
}

/** Token de inyección del puerto (resuelto por el adaptador HTTP). */
export const EXTERNAL_PHARMACY_CATALOG_PORT = Symbol(
  'EXTERNAL_PHARMACY_CATALOG_PORT',
);

/**
 * El sistema de **una** farmacia, con la dirección y la clave que ella cargó
 * (FAR-C9). Es el mismo puerto de lectura, ampliado sin romper lo de FAR-07:
 * suma la prueba de salud y los precios.
 */
export interface ConnectedPharmacyCatalog extends ExternalPharmacyCatalogPort {
  /**
   * Comprueba que el sistema responde y acepta la clave. Lanza
   * `ExternalCatalogUnavailableError` con `kind` si no.
   */
  checkHealth(): Promise<void>;
  /** Precios del sistema de la farmacia. */
  listPrices(): Promise<ExternalPrice[]>;
}

/** Con qué se habla con el sistema de una farmacia. La clave va en claro solo en memoria. */
export interface PharmacySystemAccess {
  readonly systemCode: PharmacySystemCode;
  /** Sin barra final. */
  readonly baseUrl: string;
  readonly apiKey: string;
  /** El código con que el sistema conoce a la farmacia. */
  readonly pharmacyCode: string;
  readonly timeoutMs: number;
}

/**
 * Elige el adaptador por el `code` del tipo de sistema
 * (`integrations.external_providers.code`): uno por tipo.
 */
export interface PharmacyCatalogFactoryPort {
  forAccess(access: PharmacySystemAccess): ConnectedPharmacyCatalog;
}

export const PHARMACY_CATALOG_FACTORY_PORT = Symbol(
  'PHARMACY_CATALOG_FACTORY_PORT',
);

/** Cifrado de la clave de la conexión (AES-256-GCM, llave propia). */
export interface PharmacyConnectionCipherPort {
  /** Si el servidor tiene `PHARMACY_CONNECTION_SECRET_KEY`. */
  isConfigured(): boolean;
  /** Lanza si no hay llave. */
  encrypt(plain: string): string;
  /** Lanza si no hay llave o el texto no es de esta llave. */
  decrypt(sealed: string): string;
}

export const PHARMACY_CONNECTION_CIPHER_PORT = Symbol(
  'PHARMACY_CONNECTION_CIPHER_PORT',
);
