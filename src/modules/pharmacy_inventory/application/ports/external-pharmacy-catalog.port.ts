import type {
  ExternalProduct,
  ExternalStockLine,
} from '../../domain/sync/external-catalog';

export type { ExternalProduct, ExternalStockLine };

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
