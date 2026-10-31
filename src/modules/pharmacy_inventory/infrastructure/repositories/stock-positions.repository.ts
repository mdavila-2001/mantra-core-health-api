import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PINV } from '../../domain/pharmacy_inventory.concepts';
import { InventoryStockPositions } from '../../entities';

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

  /**
   * Las posiciones **sin lote** de unos productos en unas ubicaciones, con
   * `SELECT ... FOR UPDATE`, en un orden estable. Es el stock que una sede
   * declara sin lotes y que el escritor por sede tiene que ver entero.
   */
  findLooseForUpdate(
    em: EntityManager,
    locationIds: readonly string[],
    productIds: readonly string[],
  ): Promise<InventoryStockPositions[]> {
    if (locationIds.length === 0 || productIds.length === 0) {
      return Promise.resolve([]);
    }
    return em.find(
      InventoryStockPositions,
      {
        inventoryLocationId: { $in: [...locationIds] },
        pharmacyProductId: { $in: [...productIds] },
        inventoryLotId: null,
      },
      {
        lockMode: LockMode.PESSIMISTIC_WRITE,
        orderBy: { inventoryLocationId: 'asc', pharmacyProductId: 'asc' },
      },
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

  /**
   * Cuántas posiciones **con lote** tiene un producto en las ubicaciones
   * activas de una sede. Con lotes, la existencia la llevan las recepciones y
   * los conteos, no el interruptor por sede.
   */
  async countLotPositionsInSite(
    em: EntityManager,
    pharmacySiteId: string,
    pharmacyProductId: string,
  ): Promise<number> {
    const rows = await em.execute<{ total: string | number }[]>(
      `select count(*) as total
         from pharmacy_inventory.inventory_locations loc
         join pharmacy_inventory.inventory_stock_positions st
           on st.inventory_location_id = loc.id
        where loc.pharmacy_site_id = ?
          and loc.status_concept_id = ?
          and st.pharmacy_product_id = ?
          and st.inventory_lot_id is not null`,
      [pharmacySiteId, PINV.LOCATION_ACTIVE, pharmacyProductId],
    );
    return Number(rows?.[0]?.total ?? 0);
  }
}
