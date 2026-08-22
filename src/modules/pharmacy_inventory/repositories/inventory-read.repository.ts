import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { InventoryLocations, InventoryStockPositions } from '../entities';
import { PINV } from '../pharmacy_inventory.concepts';

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
}
