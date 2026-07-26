import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { InventoryStockPositions } from '../entities';

/** Clave lógica de una posición de stock (ubicación + producto + lote). */
export interface StockPositionKey {
  inventoryLocationId: string;
  pharmacyProductId: string;
  inventoryLotId?: string;
}

/** Datos para crear una posición de stock nueva (en cero). */
export interface CreateStockPositionData extends StockPositionKey {
  onHandQuantity?: string;
  reservedQuantity?: string;
  quarantineQuantity?: string;
  availableQuantity?: string;
  lastLedgerSequence?: string;
}

/**
 * Acceso a datos de `pharmacy_inventory.inventory_stock_positions`.
 *
 * No hay unique compuesto en BD; el servicio usa `find` por clave lógica para
 * decidir entre actualizar o crear (upsert aplicativo dentro de la transacción).
 */
@Injectable()
export class StockPositionsRepository {
  findByKey(em: EntityManager, key: StockPositionKey): Promise<InventoryStockPositions | null> {
    return em.findOne(InventoryStockPositions, {
      inventoryLocationId: key.inventoryLocationId,
      pharmacyProductId: key.pharmacyProductId,
      inventoryLotId: key.inventoryLotId ?? null,
    });
  }

  /** Todas las posiciones de un lote (para recall/liberación en cualquier ubicación). */
  findByLot(em: EntityManager, inventoryLotId: string): Promise<InventoryStockPositions[]> {
    return em.find(InventoryStockPositions, { inventoryLotId });
  }

  create(em: EntityManager, data: CreateStockPositionData): InventoryStockPositions {
    return em.create(
      InventoryStockPositions,
      {
        inventoryLocationId: data.inventoryLocationId,
        pharmacyProductId: data.pharmacyProductId,
        inventoryLotId: data.inventoryLotId,
        onHandQuantity: data.onHandQuantity ?? '0',
        reservedQuantity: data.reservedQuantity ?? '0',
        quarantineQuantity: data.quarantineQuantity ?? '0',
        availableQuantity: data.availableQuantity ?? '0',
        lastLedgerSequence: data.lastLedgerSequence ?? '0',
        updatedAt: new Date(),
      },
      { partial: true },
    );
  }
}
