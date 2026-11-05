import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { buildSqlFilters } from './sql-filters';

/**
 * Read side of `pharmacy_inventory.inventory_ledger_entries` for the
 * management view. Separate from {@link LedgerRepository}, which is the write
 * side (append-only) used by the stock commands.
 */
@Injectable()
export class LedgerManagementRepository {
  /**
   * Management view of the ledger: one page of a pharmacy's entries, newest
   * first, with the names the screen needs. The pharmacy comes from the
   * already-resolved scope; the other filters are optional and parameterized.
   */
  async listForManagement(
    em: EntityManager,
    filter: LedgerListFilter,
  ): Promise<{ rows: LedgerListRow[]; total: number }> {
    const { where, params } = buildSqlFilters(
      [['e.pharmacy_id = ?', filter.pharmacyId]],
      [
        [filter.siteId, 'e.pharmacy_site_id = ?'],
        [filter.productId, 'e.pharmacy_product_id = ?'],
        [filter.lotId, 'e.inventory_lot_id = ?'],
        [filter.movementTypeCode, 'mt.code = ?'],
        [filter.from, 'e.occurred_at >= ?'],
        [filter.to, 'e.occurred_at <= ?'],
      ],
    );
    const base = `from pharmacy_inventory.inventory_ledger_entries e
         join terminology.catalog_concepts mt on mt.id = e.movement_type_concept_id`;
    const names = `join pharmacy.pharmacy_products p on p.id = e.pharmacy_product_id
         join pharmacy.pharmacy_sites s on s.id = e.pharmacy_site_id
         join pharmacy_inventory.inventory_locations loc on loc.id = e.inventory_location_id
         left join pharmacy_inventory.inventory_lots lot on lot.id = e.inventory_lot_id
         left join terminology.catalog_concepts st on st.id = e.source_type_concept_id
         left join terminology.catalog_concepts cur on cur.id = e.currency_concept_id`;
    const count = await em.execute<{ total: string | number }[]>(
      `select count(*) as total ${base} ${where}`,
      params,
    );
    const rows = await em.execute<LedgerListRow[]>(
      `select e.id,
              e.ledger_sequence::text as "sequence",
              e.occurred_at as "occurredAt",
              mt.id as "movementTypeId",
              mt.code as "movementTypeCode",
              mt.display as "movementTypeDisplay",
              e.pharmacy_product_id as "productId",
              coalesce(p.brand_name, p.generic_name, p.product_code) as "productName",
              e.pharmacy_site_id as "siteId",
              s.name as "siteName",
              e.inventory_location_id as "locationId",
              loc.code as "locationCode",
              loc.name as "locationName",
              e.inventory_lot_id as "lotId",
              lot.lot_number as "lotNumber",
              lot.expires_at::text as "lotExpiresAt",
              e.quantity_delta::text as "quantityDelta",
              coalesce(e.reservation_delta, 0)::text as "reservationDelta",
              coalesce(e.quarantine_delta, 0)::text as "quarantineDelta",
              st.code as "sourceTypeCode",
              st.display as "sourceTypeDisplay",
              e.source_id as "sourceId",
              e.unit_cost_amount::text as "unitCostAmount",
              cur.code as "currencyCode"
         ${base}
         ${names}
        ${where}
        order by e.ledger_sequence desc
        limit ? offset ?`,
      [...params, filter.limit, filter.offset],
    );
    return { rows, total: Number(count?.[0]?.total ?? 0) };
  }
}

/** Filters of {@link LedgerManagementRepository.listForManagement}. */
export interface LedgerListFilter {
  pharmacyId: string;
  siteId?: string;
  productId?: string;
  lotId?: string;
  /** Concept code of the movement type (not the concept id). */
  movementTypeCode?: string;
  from?: Date;
  to?: Date;
  limit: number;
  offset: number;
}

/** One ledger entry with the names resolved by the query. */
export interface LedgerListRow {
  id: string;
  sequence: string;
  occurredAt: Date | string;
  movementTypeId: string;
  movementTypeCode: string;
  movementTypeDisplay: string;
  productId: string;
  productName: string;
  siteId: string;
  siteName: string;
  locationId: string;
  locationCode: string;
  locationName: string;
  lotId: string | null;
  lotNumber: string | null;
  /** Expiry date of the lot as `YYYY-MM-DD`. */
  lotExpiresAt: string | null;
  quantityDelta: string;
  reservationDelta: string;
  quarantineDelta: string;
  sourceTypeCode: string | null;
  sourceTypeDisplay: string | null;
  sourceId: string | null;
  unitCostAmount: string | null;
  currencyCode: string | null;
}
