import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import { InventoryStockPositions } from '../entities';

/** Clave lógica de una posición de stock (ubicación + producto + lote). */
export interface StockPositionKey {
  /**
   * Identificador asociado a inventory location.
   */
  inventoryLocationId: string;
  /**
   * Identificador asociado a pharmacy product.
   */
  pharmacyProductId: string;
  /**
   * Identificador asociado a inventory lot.
   */
  inventoryLotId?: string;
}

/** Datos para crear una posición de stock nueva (en cero). */
export interface CreateStockPositionData extends StockPositionKey {
  /**
   * Valor de on hand quantity mantenido por la instancia.
   */
  onHandQuantity?: string;
  /**
   * Valor de reserved quantity mantenido por la instancia.
   */
  reservedQuantity?: string;
  /**
   * Valor de quarantine quantity mantenido por la instancia.
   */
  quarantineQuantity?: string;
  /**
   * Valor de available quantity mantenido por la instancia.
   */
  availableQuantity?: string;
  /**
   * Valor de last ledger sequence mantenido por la instancia.
   */
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
  /**
   * Obtiene find by key.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param key - Valor de key requerido por la operación.
   * @returns Resultado de find by key conforme al contrato `Promise<InventoryStockPositions | null>`.
   */
  findByKey(
    em: EntityManager,
    key: StockPositionKey,
  ): Promise<InventoryStockPositions | null> {
    return em.findOne(InventoryStockPositions, {
      inventoryLocationId: key.inventoryLocationId,
      pharmacyProductId: key.pharmacyProductId,
      inventoryLotId: key.inventoryLotId ?? null,
    });
  }

  /**
   * `SELECT ... FOR UPDATE` sobre la posición de stock por su clave lógica.
   * Serializa el read-modify-write de `on_hand`/`reserved`/`available` entre
   * transacciones concurrentes (anti-oversell). Debe invocarse ANTES de leer las
   * cantidades que luego se van a mutar dentro de la misma transacción.
   */
  findByKeyForUpdate(
    em: EntityManager,
    key: StockPositionKey,
  ): Promise<InventoryStockPositions | null> {
    return em.findOne(
      InventoryStockPositions,
      {
        inventoryLocationId: key.inventoryLocationId,
        pharmacyProductId: key.pharmacyProductId,
        inventoryLotId: key.inventoryLotId ?? null,
      },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /** Todas las posiciones de un lote (para recall/liberación en cualquier ubicación). */
  findByLot(
    em: EntityManager,
    inventoryLotId: string,
  ): Promise<InventoryStockPositions[]> {
    return em.find(InventoryStockPositions, { inventoryLotId });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `InventoryStockPositions`.
   */
  create(
    em: EntityManager,
    data: CreateStockPositionData,
  ): InventoryStockPositions {
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
