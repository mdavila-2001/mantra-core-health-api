import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { InventoryLocations, InventoryStockPositions } from '../../entities';
import { PINV } from '../../domain/pharmacy_inventory.concepts';
import { siteProductAvailabilitySql } from '../../domain/site-product-availability';

/**
 * Consultas de la cara de lectura del módulo 25 (carril E2): ubicaciones y
 * posiciones de stock, siempre por lote y sin N+1. La visibilidad de la sede
 * la decide el servicio contra el directorio de farmacias; acá sólo se accede
 * al modelo de inventario.
 */
@Injectable()
export class InventoryReadRepository {
  /** Ubicaciones activas de las sedes dadas. */
  findActiveLocationsBySites(
    em: EntityManager,
    siteIds: readonly string[],
  ): Promise<InventoryLocations[]> {
    if (siteIds.length === 0) return Promise.resolve([]);
    return em.find(InventoryLocations, {
      pharmacySiteId: { $in: [...siteIds] },
      statusConceptId: PINV.LOCATION_ACTIVE,
    });
  }

  /**
   * Posiciones de stock de las ubicaciones dadas, opcionalmente acotadas a un
   * conjunto de productos. Las cantidades ya vienen desglosadas por el ledger
   * (`on_hand`/`reserved`/`quarantine`/`available`); acá no se recalcula nada.
   */
  findStockPositions(
    em: EntityManager,
    locationIds: readonly string[],
    productIds?: readonly string[],
  ): Promise<InventoryStockPositions[]> {
    if (locationIds.length === 0) return Promise.resolve([]);
    if (productIds !== undefined && productIds.length === 0) {
      return Promise.resolve([]);
    }
    return em.find(InventoryStockPositions, {
      inventoryLocationId: { $in: [...locationIds] },
      ...(productIds ? { pharmacyProductId: { $in: [...productIds] } } : {}),
    });
  }

  /**
   * Qué productos están **disponibles** en cada sede, con la regla única de
   * existencias ({@link siteProductAvailabilitySql}): lotes si el producto
   * tiene posición en la sede, lo declarado en el catálogo si no. Sólo devuelve
   * filas disponibles.
   *
   * @returns `availableQuantity` como texto numérico, o `null` si el producto
   *   no tiene posición en la sede y se declaró sin conteo («hay / no hay»).
   */
  findSiteProductAvailability(
    em: EntityManager,
    siteIds: readonly string[],
    productIds: readonly string[],
  ): Promise<SiteProductAvailabilityRow[]> {
    if (siteIds.length === 0 || productIds.length === 0) {
      return Promise.resolve([]);
    }
    const availability = siteProductAvailabilitySql();
    return em.getConnection().execute(
      `SELECT av.site_id AS "siteId",
              av.product_id AS "productId",
              av.available_quantity::text AS "availableQuantity"
         FROM (${availability.sql}) av
        WHERE av.site_id IN (${siteIds.map(() => '?').join(', ')})
          AND av.product_id IN (${productIds.map(() => '?').join(', ')})`,
      [...availability.params, ...siteIds, ...productIds],
      'all',
    );
  }
}

/** Una fila de {@link InventoryReadRepository.findSiteProductAvailability}. */
export interface SiteProductAvailabilityRow {
  readonly siteId: string;
  readonly productId: string;
  readonly availableQuantity: string | null;
}
