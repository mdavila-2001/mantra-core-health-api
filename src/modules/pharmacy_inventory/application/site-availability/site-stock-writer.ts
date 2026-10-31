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
  /** La posición sin lote de la ubicación por defecto de la sede. */
  readonly position: InventoryStockPositions;
  /** Si la escritura dejó algún asiento (cambió la existencia, o la sede empezó a llevarlo). */
  readonly changed: boolean;
}

/**
 * Escribe el stock de una sede por el libro de inventario, dentro de una
 * transacción **ya abierta** por el caso de uso que lo llama.
 *
 * Sólo escribe los productos que se le piden: la regla de disponibilidad
 * (`domain/site-product-availability.ts`) decide por producto, y uno sin
 * posición en la sede sigue lo que declara el catálogo.
 *
 * La cantidad pedida es lo vendible **de la sede**: queda en la posición sin
 * lote de la ubicación por defecto, y el stock sin lote de las demás
 * ubicaciones activas se lleva a cero.
 *
 * Cada cambio de existencia deja su asiento en `inventory_ledger_entries`. La
 * secuencia se pide una sola vez por escritura (bajo el candado por farmacia de
 * `LedgerRepository.nextSequence`) y se numera en memoria, así sincronizar
 * cientos de productos no hace una lectura por asiento.
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
    // único por ubicación-producto-lote, y dos altas simultáneas del mismo
    // producto duplicarían su posición.
    await tx.execute('select pg_advisory_xact_lock(hashtext(?))', [
      `pharmacy_inventory.site:${site.siteId}`,
    ]);
    const locationId = await this.defaultLocationId(tx, site, movement);
    const looseElsewhere = await this.looseElsewhere(
      tx,
      site,
      locationId,
      targets.map((target) => target.productId),
    );
    const sequences = new SequenceBlock(tx, this.ledger, site.pharmacyId);

    const results: SiteStockWriteResult[] = [];
    for (const target of targets) {
      const existing = await this.positions.findByKeyForUpdate(tx, {
        inventoryLocationId: locationId,
        pharmacyProductId: target.productId,
      });
      const position =
        existing ??
        this.positions.create(tx, {
          inventoryLocationId: locationId,
          pharmacyProductId: target.productId,
        });
      // La primera escritura de un producto en la sede deja asiento aunque no
      // mueva unidades: desde ahí la sede lo lleva por el libro, y el libro
      // tiene que decir quién y cuándo lo decidió.
      let changed = await this.setSellable(tx, site, sequences, {
        position,
        sellable: target.availableQuantity,
        movement,
        recordUnchanged: existing === null,
      });
      // Lo vendible de la sede es la suma de sus ubicaciones activas: el stock
      // sin lote que quedó en otra ubicación (un traslado, una ubicación
      // reactivada) también se lleva a cero, o «No lo tengo» no apagaría el
      // producto. Lo reservado y lo retenido se conservan.
      for (const other of looseElsewhere.get(target.productId) ?? []) {
        const zeroed = await this.setSellable(tx, site, sequences, {
          position: other,
          sellable: 0,
          movement,
          recordUnchanged: false,
        });
        changed = changed || zeroed;
      }
      results.push({ productId: target.productId, position, changed });
    }
    await tx.flush();
    return results;
  }

  /**
   * Fija lo vendible de una posición y deja el asiento del cambio.
   *
   * @returns Si la escritura dejó asiento.
   */
  private async setSellable(
    tx: EntityManager,
    site: SiteScope,
    sequences: SequenceBlock,
    change: {
      readonly position: InventoryStockPositions;
      readonly sellable: number;
      readonly movement: SiteStockMovement;
      /** Asentar aunque la existencia no cambie (posición nueva). */
      readonly recordUnchanged: boolean;
    },
  ): Promise<boolean> {
    const { position } = change;
    // Lo que se fija es lo vendible: lo reservado por pedidos activos y lo
    // retenido en cuarentena se conservan encima.
    const onHand =
      change.sellable +
      numericQuantity(position.reservedQuantity) +
      numericQuantity(position.quarantineQuantity);
    const delta = onHand - numericQuantity(position.onHandQuantity);
    if (delta === 0 && !change.recordUnchanged) return false;
    const sequence = await sequences.next();
    this.append(
      tx,
      site,
      position.inventoryLocationId,
      position.pharmacyProductId,
      {
        sequence,
        delta,
        movement: change.movement,
      },
    );
    position.onHandQuantity = String(onHand);
    position.availableQuantity = recomputeAvailableQuantity(
      position.onHandQuantity,
      position.reservedQuantity,
      position.quarantineQuantity,
    );
    position.lastLedgerSequence = sequence;
    position.updatedAt = new Date();
    return true;
  }

  /**
   * Las posiciones sin lote de los productos en las **otras** ubicaciones
   * activas de la sede, bloqueadas, por producto.
   */
  private async looseElsewhere(
    tx: EntityManager,
    site: SiteScope,
    locationId: string,
    productIds: readonly string[],
  ): Promise<Map<string, InventoryStockPositions[]>> {
    const others = (await this.locations.findActiveInSite(tx, site.siteId))
      .map((location) => location.id)
      .filter((id) => id !== locationId);
    const positions = await this.positions.findLooseForUpdate(
      tx,
      others,
      productIds,
    );
    const byProduct = new Map<string, InventoryStockPositions[]>();
    for (const position of positions) {
      const list = byProduct.get(position.pharmacyProductId) ?? [];
      list.push(position);
      byProduct.set(position.pharmacyProductId, list);
    }
    return byProduct;
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
