import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
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
}
