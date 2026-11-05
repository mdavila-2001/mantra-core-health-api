import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  Pharmacies,
  PharmacyExternalProductMappings,
  PharmacyIntegrationConnections,
  PharmacyProducts,
  PharmacySites,
} from '../../../pharmacy/entities';
import { PHARM } from '../../../pharmacy/pharmacy.concepts';
import {
  PharmacyInventorySyncBatches,
  PharmacyInventorySyncItems,
} from '../../entities';
import { PINV } from '../../domain/pharmacy_inventory.concepts';

/** Una sede de venta activa, con lo que la sincronización necesita de ella. */
export interface ActiveSiteRow {
  readonly id: string;
  readonly code: string;
  readonly name: string;
}

/**
 * Lecturas de la integración con el sistema de una farmacia externa (FAR-07):
 * conexiones, vínculos, sedes y lotes de sincronización. Cada consulta va
 * acotada por la farmacia o la conexión que el llamador ya resolvió dentro de
 * su ámbito.
 */
@Injectable()
export class IntegrationReadRepository {
  /** Conexiones de una farmacia, de la más nueva a la más vieja. */
  findConnections(
    em: EntityManager,
    pharmacyId: string,
  ): Promise<PharmacyIntegrationConnections[]> {
    return em.find(
      PharmacyIntegrationConnections,
      { pharmacyId },
      { orderBy: { createdAt: 'desc', id: 'asc' } },
    );
  }

  /** Una conexión de la farmacia; `null` si no existe o es de otra. */
  findConnection(
    em: EntityManager,
    pharmacyId: string,
    connectionId: string,
  ): Promise<PharmacyIntegrationConnections | null> {
    return em.findOne(PharmacyIntegrationConnections, {
      id: connectionId,
      pharmacyId,
    });
  }

  /** Vínculos de una conexión, por código externo. */
  findMappings(
    em: EntityManager,
    connectionId: string,
  ): Promise<PharmacyExternalProductMappings[]> {
    return em.find(
      PharmacyExternalProductMappings,
      { pharmacyIntegrationConnectionId: connectionId },
      { orderBy: { externalProductCode: 'asc', createdAt: 'asc' } },
    );
  }

  /** Productos de la farmacia por id (para nombrar los vínculos). */
  findProducts(
    em: EntityManager,
    pharmacyId: string,
    productIds: readonly string[],
  ): Promise<PharmacyProducts[]> {
    if (productIds.length === 0) return Promise.resolve([]);
    return em.find(PharmacyProducts, {
      pharmacyId,
      id: { $in: [...productIds] },
    });
  }

  /** Sedes de venta de la farmacia por id. */
  findSites(
    em: EntityManager,
    pharmacyId: string,
    siteIds: readonly string[],
  ): Promise<PharmacySites[]> {
    if (siteIds.length === 0) return Promise.resolve([]);
    return em.find(PharmacySites, { pharmacyId, id: { $in: [...siteIds] } });
  }

  /** Sedes de venta activas de la farmacia (todas, o solo la indicada). */
  async findActiveSites(
    em: EntityManager,
    pharmacyId: string,
    siteId?: string,
  ): Promise<ActiveSiteRow[]> {
    const sites = await em.find(
      PharmacySites,
      {
        pharmacyId,
        statusConceptId: PHARM.SITE_ACTIVE,
        ...(siteId ? { id: siteId } : {}),
      },
      { orderBy: { createdAt: 'asc', id: 'asc' } },
    );
    return sites.map((site) => ({
      id: site.id,
      code: site.code,
      name: site.name,
    }));
  }

  /** Últimos lotes de una conexión. */
  findBatches(
    em: EntityManager,
    connectionId: string,
    limit: number,
  ): Promise<PharmacyInventorySyncBatches[]> {
    return em.find(
      PharmacyInventorySyncBatches,
      { pharmacyIntegrationConnectionId: connectionId },
      { orderBy: { receivedAt: 'desc', createdAt: 'desc' }, limit },
    );
  }

  /** Cuántos ítems de cada lote quedaron con discrepancia. */
  async countDiscrepancies(
    em: EntityManager,
    batchIds: readonly string[],
  ): Promise<Map<string, number>> {
    const counts = new Map<string, number>();
    if (batchIds.length === 0) return counts;
    const items = await em.find(
      PharmacyInventorySyncItems,
      {
        pharmacyInventorySyncBatchId: { $in: [...batchIds] },
        reconciliationStatusConceptId: PINV.SYNC_ITEM_DISCREPANCY,
      },
      { fields: ['pharmacyInventorySyncBatchId'] },
    );
    for (const item of items) {
      const id = item.pharmacyInventorySyncBatchId;
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    return counts;
  }

  /** Ítems conciliados con producto de un lote. */
  findMatchedItems(
    em: EntityManager,
    batchId: string,
  ): Promise<PharmacyInventorySyncItems[]> {
    return em.find(PharmacyInventorySyncItems, {
      pharmacyInventorySyncBatchId: batchId,
      reconciliationStatusConceptId: PINV.SYNC_ITEM_MATCHED,
    });
  }

  /** El código de la farmacia (`pharmacies.code`); `null` si no existe. */
  async findPharmacyCode(
    em: EntityManager,
    pharmacyId: string,
  ): Promise<string | null> {
    const pharmacy = await em.findOne(
      Pharmacies,
      { id: pharmacyId },
      { fields: ['id', 'code'] },
    );
    return pharmacy?.code ?? null;
  }

  /**
   * De los productos dados, los que la sede marcó «No lo tengo» a mano: nada
   * vendible sin lote en sus ubicaciones activas, y el último asiento de ese
   * producto en la sede es un ajuste manual (`MV_COUNT_ADJUSTMENT`: el
   * interruptor por sede, la carga por sucursal o una confirmación de pedido),
   * no una sincronización ni un pedido.
   */
  async findMarkedNotAvailable(
    em: EntityManager,
    pharmacySiteId: string,
    productIds: readonly string[],
  ): Promise<Set<string>> {
    if (productIds.length === 0) return new Set();
    // Un marcador por id: el driver no convierte un arreglo de JavaScript en
    // uno de Postgres (ver `community/repositories/reactions.repository.ts`).
    const markers = productIds.map(() => '?').join(', ');
    const rows = await em.execute<{ pharmacy_product_id: string }[]>(
      `with sellable as (
         select st.pharmacy_product_id, sum(st.available_quantity) as available
           from pharmacy_inventory.inventory_locations loc
           join pharmacy_inventory.inventory_stock_positions st
             on st.inventory_location_id = loc.id
          where loc.pharmacy_site_id = ?
            and loc.status_concept_id = ?
            and st.inventory_lot_id is null
            and st.pharmacy_product_id in (${markers})
          group by st.pharmacy_product_id
       ), last_entry as (
         select distinct on (le.pharmacy_product_id)
                le.pharmacy_product_id, le.movement_type_concept_id
           from pharmacy_inventory.inventory_ledger_entries le
          where le.pharmacy_site_id = ?
            and le.pharmacy_product_id in (${markers})
          order by le.pharmacy_product_id, le.ledger_sequence desc
       )
       select s.pharmacy_product_id
         from sellable s
         join last_entry l on l.pharmacy_product_id = s.pharmacy_product_id
        where s.available <= 0
          and l.movement_type_concept_id = ?`,
      [
        pharmacySiteId,
        PINV.LOCATION_ACTIVE,
        ...productIds,
        pharmacySiteId,
        ...productIds,
        PINV.MV_COUNT_ADJUSTMENT,
      ],
    );
    return new Set(rows.map((row) => row.pharmacy_product_id));
  }
}
