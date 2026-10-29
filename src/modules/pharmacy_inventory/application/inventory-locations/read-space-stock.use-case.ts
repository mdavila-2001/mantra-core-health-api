import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { requireTenantId, type AuthenticatedUser } from '../../../../common';
import { PINV } from '../../domain/pharmacy_inventory.concepts';
import type {
  SpaceStockLocationView,
  SpaceStockPositionView,
  SpaceStockView,
} from '../../presentation/dto/space-stock.types';
import { StockPointAccessService } from './stock-point-access.service';

/** Tope de ubicaciones de una respuesta. */
const MAX_LOCATIONS = 200;

const num = (value: unknown): number => Number(value ?? 0);

/**
 * Ubicaciones de inventario de un espacio y de su subárbol con sus existencias
 * (pestaña «Stock» de la ficha de espacio, solo lectura).
 *
 * Autoriza contra el espacio (`infra.stock.view`): personal de farmacia, plataforma,
 * organización, la sucursal del espacio y enfermería con alcance sobre él. Sólo trae
 * ubicaciones de farmacias del tenant; no lleva datos de pacientes.
 */
@Injectable()
export class ReadSpaceStockUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly access: StockPointAccessService,
  ) {}

  /**
   * @param careSpaceId - Espacio.
   * @param actor - Quien lee.
   * @throws ResourceNotFoundException (404) si el espacio no es del tenant o está fuera del alcance.
   */
  async execute(
    careSpaceId: string,
    actor: AuthenticatedUser,
  ): Promise<SpaceStockView> {
    const tenantId = requireTenantId();
    const tx = this.em.fork();
    await this.access.assertCanView(tx, actor, tenantId, careSpaceId);

    const locations = await tx.execute<Record<string, unknown>[]>(
      `with recursive sub(id) as (
         select id from practice.care_spaces where id = ? and tenant_id = ?
         union
         select c.id from practice.care_spaces c join sub on c.parent_space_id = sub.id
          where c.tenant_id = ?
       )
       select l.id, l.code, l.name, l.location_type_concept_id, l.status_concept_id,
              l.pharmacy_site_id, l.row_version,
              cs.id as space_id, cs.code as space_code, cs.name as space_name,
              u.id as unit_id, u.code as unit_code, u.name as unit_name
         from pharmacy_inventory.inventory_locations l
         join sub on sub.id = l.care_space_id
         join practice.care_spaces cs on cs.id = l.care_space_id and cs.tenant_id = ?
         join pharmacy.pharmacy_sites ps on ps.id = l.pharmacy_site_id
         join pharmacy.pharmacies ph on ph.id = ps.pharmacy_id and ph.tenant_id = ?
         left join practice.clinical_units u on u.id = l.clinical_unit_id and u.tenant_id = ?
        order by cs.name, l.name
        limit ?`,
      [
        careSpaceId,
        tenantId,
        tenantId,
        tenantId,
        tenantId,
        tenantId,
        MAX_LOCATIONS,
      ],
    );
    const ids = locations.map((row) => String(row.id));
    const positions = ids.length
      ? await tx.execute<Record<string, unknown>[]>(
          `select p.inventory_location_id, p.pharmacy_product_id,
                  coalesce(pr.brand_name, pr.generic_name) as product_name,
                  lot.lot_number, lot.expires_at,
                  p.on_hand_quantity, p.reserved_quantity, p.quarantine_quantity, p.available_quantity
             from pharmacy_inventory.inventory_stock_positions p
             join pharmacy.pharmacy_products pr on pr.id = p.pharmacy_product_id
             left join pharmacy_inventory.inventory_lots lot on lot.id = p.inventory_lot_id
            where p.inventory_location_id in (${ids.map(() => '?').join(', ')})
              and (p.on_hand_quantity > 0 or p.reserved_quantity > 0 or p.quarantine_quantity > 0)
            order by product_name, lot.expires_at nulls last`,
          ids,
        )
      : [];
    const byLocation = new Map<string, SpaceStockPositionView[]>();
    for (const row of positions) {
      const key = String(row.inventory_location_id);
      const list = byLocation.get(key) ?? [];
      list.push({
        productId: String(row.pharmacy_product_id),
        productName: row.product_name ? String(row.product_name) : null,
        lotNumber: row.lot_number ? String(row.lot_number) : null,
        expiresAt: row.expires_at
          ? new Date(row.expires_at as string).toISOString()
          : null,
        onHand: num(row.on_hand_quantity),
        reserved: num(row.reserved_quantity),
        quarantine: num(row.quarantine_quantity),
        available: num(row.available_quantity),
      });
      byLocation.set(key, list);
    }

    return {
      careSpaceId,
      generatedAt: new Date().toISOString(),
      locations: locations.map((row): SpaceStockLocationView => {
        const list = byLocation.get(String(row.id)) ?? [];
        const type = String(row.location_type_concept_id);
        return {
          id: String(row.id),
          code: String(row.code),
          name: String(row.name),
          locationType:
            type === PINV.LOCATION_TYPE_WARD_STOCK
              ? 'WARD_STOCK'
              : type === PINV.LOCATION_TYPE_SHELF
                ? 'SHELF'
                : 'OTHER',
          status:
            String(row.status_concept_id) === PINV.LOCATION_ACTIVE
              ? 'ACTIVE'
              : 'OTHER',
          careSpace: {
            id: String(row.space_id),
            code: String(row.space_code),
            name: String(row.space_name),
          },
          clinicalUnit: row.unit_id
            ? {
                id: String(row.unit_id),
                code: String(row.unit_code),
                name: String(row.unit_name),
              }
            : null,
          pharmacySiteId: String(row.pharmacy_site_id),
          rowVersion: num(row.row_version),
          totals: {
            onHand: list.reduce((sum, p) => sum + p.onHand, 0),
            reserved: list.reduce((sum, p) => sum + p.reserved, 0),
            available: list.reduce((sum, p) => sum + p.available, 0),
            positions: list.length,
          },
          positions: list,
        };
      }),
    };
  }
}
