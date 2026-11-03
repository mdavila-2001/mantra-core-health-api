import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { InventoryLots } from '../../entities';
import { createdBy } from '../../../../common';
import { buildSqlFilters } from './sql-filters';

/** Datos para crear un lote de inventario. */
export interface CreateLotData {
  /**
   * Identificador asociado a pharmacy product.
   */
  pharmacyProductId: string;
  /**
   * Valor de lot number mantenido por la instancia.
   */
  lotNumber: string;
  /**
   * Valor de manufacturer lot number mantenido por la instancia.
   */
  manufacturerLotNumber?: string;
  /**
   * Valor de expires at mantenido por la instancia.
   */
  expiresAt?: Date;
  /**
   * Valor de received at mantenido por la instancia.
   */
  receivedAt?: Date;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `pharmacy_inventory.inventory_lots`. */
@Injectable()
export class LotsRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<InventoryLots | null>`.
   */
  findById(em: EntityManager, id: string): Promise<InventoryLots | null> {
    return em.findOne(InventoryLots, { id });
  }

  /** Busca el lote de un producto por número (para el UPSERT de recepción). */
  findByProductAndNumber(
    em: EntityManager,
    pharmacyProductId: string,
    lotNumber: string,
  ): Promise<InventoryLots | null> {
    return em.findOne(InventoryLots, { pharmacyProductId, lotNumber });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `InventoryLots`.
   */
  create(em: EntityManager, data: CreateLotData): InventoryLots {
    return em.create(
      InventoryLots,
      {
        pharmacyProductId: data.pharmacyProductId,
        lotNumber: data.lotNumber,
        manufacturerLotNumber: data.manufacturerLotNumber,
        expiresAt: data.expiresAt,
        receivedAt: data.receivedAt,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Management view of the lots of a pharmacy: one page ordered by expiry
   * (no expiry last), with their quarantine and recall states. With `siteId`,
   * only lots that have a position in that site. Expired lots are left out
   * unless `includeExpired` is set.
   */
  async listForManagement(
    em: EntityManager,
    filter: LotListFilter,
  ): Promise<{ rows: LotListRow[]; total: number }> {
    const { where, params } = buildSqlFilters(
      [['p.pharmacy_id = ?', filter.pharmacyId]],
      [
        [filter.productId, 'lot.pharmacy_product_id = ?'],
        [filter.expiringBefore, 'lot.expires_at < ?'],
        [
          filter.siteId,
          `exists (select 1
                     from pharmacy_inventory.inventory_stock_positions st
                     join pharmacy_inventory.inventory_locations loc on loc.id = st.inventory_location_id
                    where st.inventory_lot_id = lot.id and loc.pharmacy_site_id = ?)`,
        ],
      ],
      [
        [
          filter.includeExpired !== true,
          '(lot.expires_at is null or lot.expires_at >= current_date)',
        ],
      ],
    );
    const from = `from pharmacy_inventory.inventory_lots lot
         join pharmacy.pharmacy_products p on p.id = lot.pharmacy_product_id`;
    const count = await em.execute<{ total: string | number }[]>(
      `select count(*) as total ${from} ${where}`,
      params,
    );
    const rows = await em.execute<LotListRow[]>(
      `select lot.id,
              lot.pharmacy_product_id as "productId",
              coalesce(p.brand_name, p.generic_name, p.product_code) as "productName",
              lot.lot_number as "lotNumber",
              lot.expires_at::text as "expiresAt",
              qs.code as "quarantineCode",
              qs.display as "quarantineDisplay",
              rs.code as "recallCode",
              rs.display as "recallDisplay"
         ${from}
         left join terminology.catalog_concepts qs on qs.id = lot.quarantine_status_concept_id
         left join terminology.catalog_concepts rs on rs.id = lot.recall_status_concept_id
        ${where}
        order by lot.expires_at nulls last, lot.lot_number, lot.id
        limit ? offset ?`,
      [...params, filter.limit, filter.offset],
    );
    return { rows, total: Number(count?.[0]?.total ?? 0) };
  }
}

/** Filters of {@link LotsRepository.listForManagement}. */
export interface LotListFilter {
  pharmacyId: string;
  siteId?: string;
  productId?: string;
  /** Only lots that expire strictly before this date. */
  expiringBefore?: string;
  includeExpired?: boolean;
  limit: number;
  offset: number;
}

/** One lot with the names and states resolved by the query. */
export interface LotListRow {
  id: string;
  productId: string;
  productName: string;
  lotNumber: string;
  /** Expiry date as `YYYY-MM-DD`. */
  expiresAt: string | null;
  quarantineCode: string | null;
  quarantineDisplay: string | null;
  recallCode: string | null;
  recallDisplay: string | null;
}
