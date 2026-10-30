import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import type { InventoryStockPositions } from '../../entities';
import {
  LedgerRepository,
  LocationsRepository,
  StockPositionsRepository,
} from '../../infrastructure/repositories';
import { PINV } from '../../domain/pharmacy_inventory.concepts';
import {
  numericQuantity,
  recomputeAvailableQuantity,
} from '../../domain/counting/stock-quantity';
import { initialSiteQuantity } from '../../domain/site-availability/initial-quantity';
import type { SiteScope } from '../scope/pharmacy-inventory-scope.policy';

/** Código y nombre de la ubicación que se crea si la sede no tiene ninguna. */
const DEFAULT_LOCATION = { code: 'GENERAL', name: 'Depósito general' } as const;

/** Lo que se quiere que una sede tenga **para vender** de un producto. */
export interface SiteStockTarget {
  /** Producto de la farmacia (ya resuelto dentro de su ámbito). */
  readonly productId: string;
  /** Unidades disponibles para vender en la sede; 0 es «No lo tengo». */
  readonly availableQuantity: number;
}

/** Cómo quedan asentados los cambios de una escritura. */
export interface SiteStockMovement {
  /** Tipo de movimiento del libro (`PINV.MV_COUNT_ADJUSTMENT`, `PINV.MV_SYNC_ADJUSTMENT`). */
  readonly movementTypeConceptId: string;
  /** Recurso que origina el cambio (el lote de sincronización, por ejemplo). */
  readonly sourceId?: string;
  /** Usuario que registra los asientos. */
  readonly actorUserId?: string;
}

/** La posición de un producto en la sede después de escribir. */
export interface SiteStockWriteResult {
  readonly productId: string;
  readonly position: InventoryStockPositions;
  /** Si la escritura cambió la existencia (y dejó un asiento). */
  readonly changed: boolean;
}

/**
 * Escribe el stock de una sede por el libro de inventario, dentro de una
 * transacción **ya abierta** por el caso de uso que lo llama.
 *
 * La regla de disponibilidad (`domain/site-product-availability.ts`) pasa una
 * sede entera a «modo libro» en cuanto tiene una posición, y desde ese momento
 * un producto sin posición deja de estar disponible ahí. Por eso cada escritura
 * completa primero, en la misma transacción, la posición de cada producto no
 * retirado que falte, con lo que declara el catálogo: el primer cambio de una
 * sede la inicializa y ningún producto desaparece de rebote; los siguientes
 * cubren lo publicado después (D-06-3).
 *
 * Cada cambio de existencia deja su asiento en `inventory_ledger_entries`. La
 * secuencia se pide una sola vez por escritura (bajo el candado por farmacia de
 * `LedgerRepository.nextSequence`) y se numera en memoria, así inicializar una
 * sede con cientos de productos no hace una lectura por asiento.
 */
@Injectable()
export class SiteStockWriter {
  constructor(
    private readonly locations: LocationsRepository,
    private readonly positions: StockPositionsRepository,
    private readonly ledger: LedgerRepository,
  ) {}

  async write(
    tx: EntityManager,
    site: SiteScope,
    targets: readonly SiteStockTarget[],
    movement: SiteStockMovement,
  ): Promise<SiteStockWriteResult[]> {
    // Una escritura por sede a la vez: la tabla de posiciones no tiene índice
    // único por ubicación-producto-lote, y dos inicializaciones simultáneas
    // duplicarían posiciones.
    await tx.execute('select pg_advisory_xact_lock(hashtext(?))', [
      `pharmacy_inventory.site:${site.siteId}`,
    ]);
    const locationId = await this.defaultLocationId(tx, site, movement);
    const sequences = new SequenceBlock(tx, this.ledger, site.pharmacyId);

    const missing = await this.positions.findProductsWithoutPositionInSite(
      tx,
      site.pharmacyId,
      site.siteId,
    );
    for (const product of missing) {
      const quantity = initialSiteQuantity(product);
      const sequence = quantity === 0 ? '0' : await sequences.next();
      if (quantity !== 0) {
        this.append(tx, site, locationId, product.productId, {
          sequence,
          delta: quantity,
          movement: {
            ...movement,
            movementTypeConceptId: PINV.MV_COUNT_ADJUSTMENT,
          },
        });
      }
      this.positions.create(tx, {
        inventoryLocationId: locationId,
        pharmacyProductId: product.productId,
        onHandQuantity: String(quantity),
        availableQuantity: String(quantity),
        lastLedgerSequence: sequence,
      });
    }
    if (missing.length > 0) await tx.flush();

    const results: SiteStockWriteResult[] = [];
    for (const target of targets) {
      const position =
        (await this.positions.findByKeyForUpdate(tx, {
          inventoryLocationId: locationId,
          pharmacyProductId: target.productId,
        })) ??
        this.positions.create(tx, {
          inventoryLocationId: locationId,
          pharmacyProductId: target.productId,
        });
      // Lo que se fija es lo vendible: lo reservado por pedidos activos y lo
      // retenido en cuarentena se conservan encima.
      const onHand =
        target.availableQuantity +
        numericQuantity(position.reservedQuantity) +
        numericQuantity(position.quarantineQuantity);
      const delta = onHand - numericQuantity(position.onHandQuantity);
      if (delta !== 0) {
        const sequence = await sequences.next();
        this.append(tx, site, locationId, target.productId, {
          sequence,
          delta,
          movement,
        });
        position.onHandQuantity = String(onHand);
        position.availableQuantity = recomputeAvailableQuantity(
          position.onHandQuantity,
          position.reservedQuantity,
          position.quarantineQuantity,
        );
        position.lastLedgerSequence = sequence;
        position.updatedAt = new Date();
      }
      results.push({
        productId: target.productId,
        position,
        changed: delta !== 0,
      });
    }
    await tx.flush();
    return results;
  }

  /** La primera ubicación activa de la sede; si no tiene, crea la general. */
  private async defaultLocationId(
    tx: EntityManager,
    site: SiteScope,
    movement: SiteStockMovement,
  ): Promise<string> {
    const existing = await this.locations.findFirstActiveInSite(
      tx,
      site.siteId,
    );
    if (existing) return existing.id;
    const created = this.locations.create(tx, {
      pharmacySiteId: site.siteId,
      code: DEFAULT_LOCATION.code,
      name: DEFAULT_LOCATION.name,
      locationTypeConceptId: PINV.LOCATION_TYPE_SHELF,
      temperatureZoneConceptId: PINV.TEMPERATURE_ZONE_AMBIENT,
      controlledAccess: false,
      statusConceptId: PINV.LOCATION_ACTIVE,
      actorUserId: movement.actorUserId,
    });
    await tx.flush();
    return created.id;
  }

  private append(
    tx: EntityManager,
    site: SiteScope,
    locationId: string,
    productId: string,
    entry: {
      readonly sequence: string;
      readonly delta: number;
      readonly movement: SiteStockMovement;
    },
  ): void {
    this.ledger.append(tx, {
      pharmacyId: site.pharmacyId,
      pharmacySiteId: site.siteId,
      inventoryLocationId: locationId,
      pharmacyProductId: productId,
      ledgerSequence: entry.sequence,
      movementTypeConceptId: entry.movement.movementTypeConceptId,
      quantityDelta: String(entry.delta),
      sourceId: entry.movement.sourceId,
      recordedByUserId: entry.movement.actorUserId,
    });
  }
}

/**
 * Secuencias del libro para una escritura: la primera se pide al repositorio
 * (que toma el candado por farmacia hasta el final de la transacción), las
 * siguientes son consecutivas en memoria.
 */
class SequenceBlock {
  private last: bigint | null = null;

  constructor(
    private readonly tx: EntityManager,
    private readonly ledger: LedgerRepository,
    private readonly pharmacyId: string,
  ) {}

  async next(): Promise<string> {
    this.last =
      this.last === null
        ? BigInt(await this.ledger.nextSequence(this.tx, this.pharmacyId))
        : this.last + 1n;
    return this.last.toString();
  }
}
