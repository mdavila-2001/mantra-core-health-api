import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PHARM } from '../../../pharmacy/pharmacy.concepts';
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

/** Un producto de la farmacia que todavía no tiene posición en una sede. */
export interface ProductWithoutSitePosition {
  /** Producto de la farmacia. */
  readonly productId: string;
  /** Conteo declarado en el catálogo; `null` es «hay» sin número. */
  readonly stockQuantity: number | null;
  /** «No tengo» de toda la farmacia. */
  readonly outOfStockDeclared: boolean;
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

  /**
   * Si la sede lleva su propio stock: tiene al menos una posición en alguna de
   * sus ubicaciones activas. Es la misma condición que decide el «modo libro»
   * en `domain/site-product-availability.ts`.
   */
  async siteKeepsLedger(
    em: EntityManager,
    pharmacySiteId: string,
  ): Promise<boolean> {
    const rows = await em.execute<{ kept: boolean }[]>(
      `select exists (
                select 1
                  from pharmacy_inventory.inventory_locations loc
                  join pharmacy_inventory.inventory_stock_positions st
                    on st.inventory_location_id = loc.id
                 where loc.pharmacy_site_id = ?
                   and loc.status_concept_id = ?
              ) as kept`,
      [pharmacySiteId, PINV.LOCATION_ACTIVE],
    );
    return rows?.[0]?.kept === true;
  }

  /**
   * Productos no retirados de la farmacia (publicados y borradores) sin ninguna
   * posición en las ubicaciones activas de la sede, con lo que declara el
   * catálogo de cada uno. Ordenados por id para que la escritura sea estable.
   */
  async findProductsWithoutPositionInSite(
    em: EntityManager,
    pharmacyId: string,
    pharmacySiteId: string,
  ): Promise<ProductWithoutSitePosition[]> {
    const rows = await em.execute<
      {
        id: string;
        stock_quantity: number | string | null;
        out_of_stock_declared: boolean | null;
      }[]
    >(
      `select prod.id, prod.stock_quantity, prod.out_of_stock_declared
         from pharmacy.pharmacy_products prod
        where prod.pharmacy_id = ?
          and prod.status_concept_id <> ?
          and not exists (
                select 1
                  from pharmacy_inventory.inventory_locations loc
                  join pharmacy_inventory.inventory_stock_positions st
                    on st.inventory_location_id = loc.id
                 where loc.pharmacy_site_id = ?
                   and loc.status_concept_id = ?
                   and st.pharmacy_product_id = prod.id
              )
        order by prod.id`,
      [pharmacyId, PHARM.PRODUCT_RETIRED, pharmacySiteId, PINV.LOCATION_ACTIVE],
    );
    return (rows ?? []).map((row) => ({
      productId: row.id,
      stockQuantity:
        row.stock_quantity === null ? null : Number(row.stock_quantity),
      outOfStockDeclared: row.out_of_stock_declared === true,
    }));
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
