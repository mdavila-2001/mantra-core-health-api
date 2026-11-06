import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { buildSqlFilters } from './sql-filters';

/**
 * Read side of `pharmacy_inventory.inventory_stock_positions` for the
 * management view. Separate from {@link StockPositionsRepository}, which is the
 * write side used by the stock commands.
 */
@Injectable()
export class StockManagementRepository {
  /**
   * Management view of the positions of a pharmacy: one page with the names
   * the screen needs, ordered by site, location, product and expiry (no expiry
   * last). The pharmacy comes from the already-resolved scope.
   */
  async listForManagement(
    em: EntityManager,
    filter: PositionListFilter,
  ): Promise<{ rows: PositionListRow[]; total: number }> {
    const { where, params } = buildSqlFilters(
      [['s.pharmacy_id = ?', filter.pharmacyId]],
      [
        [filter.siteId, 's.id = ?'],
        [filter.locationId, 'st.inventory_location_id = ?'],
        [filter.productId, 'st.pharmacy_product_id = ?'],
        [filter.lotId, 'st.inventory_lot_id = ?'],
      ],
      [
        [
          filter.onlyWithStock === true,
          '(st.on_hand_quantity > 0 or st.quarantine_quantity > 0)',
        ],
      ],
    );
    const from = `from pharmacy_inventory.inventory_stock_positions st
         join pharmacy_inventory.inventory_locations loc on loc.id = st.inventory_location_id
         join pharmacy.pharmacy_sites s on s.id = loc.pharmacy_site_id
         join pharmacy.pharmacy_products p on p.id = st.pharmacy_product_id
         left join pharmacy_inventory.inventory_lots lot on lot.id = st.inventory_lot_id`;
    const count = await em.execute<{ total: string | number }[]>(
      `select count(*) as total ${from} ${where}`,
      params,
    );
    const rows = await em.execute<PositionListRow[]>(
      `select st.id,
              st.pharmacy_product_id as "productId",
              coalesce(p.brand_name, p.generic_name, p.product_code) as "productName",
              s.id as "siteId",
              s.name as "siteName",
              loc.id as "locationId",
              loc.code as "locationCode",
              loc.name as "locationName",
              st.inventory_lot_id as "lotId",
              lot.lot_number as "lotNumber",
              lot.expires_at::text as "expiresAt",
              st.on_hand_quantity::text as "onHand",
              st.reserved_quantity::text as "reserved",
              st.quarantine_quantity::text as "quarantine",
              st.available_quantity::text as "available"
         ${from}
        ${where}
        order by s.name, loc.code, "productName", lot.expires_at nulls last, lot.lot_number, st.id
        limit ? offset ?`,
      [...params, filter.limit, filter.offset],
    );
    return { rows, total: Number(count?.[0]?.total ?? 0) };
  }

  /**
   * On-hand totals of the given lots, one row per lot and site. Sites are
   * restricted to the pharmacy as defense in depth; `siteId` narrows further.
   */
  async sumOnHandByLotAndSite(
    em: EntityManager,
    pharmacyId: string,
    lotIds: readonly string[],
    siteId?: string,
  ): Promise<LotSiteStockRow[]> {
    if (lotIds.length === 0) return [];
    const siteClause = siteId === undefined ? '' : 'and s.id = ?';
    const params =
      siteId === undefined
        ? [...lotIds, pharmacyId]
        : [...lotIds, pharmacyId, siteId];
    return em.execute<LotSiteStockRow[]>(
      `select st.inventory_lot_id as "lotId",
              s.id as "siteId",
              s.name as "siteName",
              sum(st.on_hand_quantity)::text as "onHand"
         from pharmacy_inventory.inventory_stock_positions st
         join pharmacy_inventory.inventory_locations loc on loc.id = st.inventory_location_id
         join pharmacy.pharmacy_sites s on s.id = loc.pharmacy_site_id
        where st.inventory_lot_id in (${lotIds.map(() => '?').join(', ')})
          and s.pharmacy_id = ?
          ${siteClause}
        group by st.inventory_lot_id, s.id, s.name
        order by s.name, s.id`,
      params,
    );
  }
}

/** Filters of {@link StockManagementRepository.listForManagement}. */
export interface PositionListFilter {
  pharmacyId: string;
  siteId?: string;
  locationId?: string;
  productId?: string;
  lotId?: string;
  onlyWithStock?: boolean;
  limit: number;
  offset: number;
}

/** One stock position with the names resolved by the query. */
export interface PositionListRow {
  id: string;
  productId: string;
  productName: string;
  siteId: string;
  siteName: string;
  locationId: string;
  locationCode: string;
  locationName: string;
  lotId: string | null;
  lotNumber: string | null;
  /** Expiry date as `YYYY-MM-DD`. */
  expiresAt: string | null;
  onHand: string;
  reserved: string;
  quarantine: string;
  available: string;
}

/** On-hand quantity of a lot in one site. */
export interface LotSiteStockRow {
  lotId: string;
  siteId: string;
  siteName: string;
  onHand: string;
}
