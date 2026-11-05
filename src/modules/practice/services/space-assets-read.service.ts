import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import type { AuthenticatedUser } from '../../../common';
import { PINV } from '../../pharmacy_inventory/domain/pharmacy_inventory.concepts';
import { InfrastructureAccessService } from './infrastructure-access.service';
import { OpsCellBuilder } from './ops/ops-cell-builder';
import { collectionPointsOfSite } from './ops/collection-points';
import { CareSpaces } from '../entities';

/** Código corto del tipo de ubicación (el mismo que acepta el alta). */
const LOCATION_TYPE_CODE = new Map<string, string>([
  [PINV.LOCATION_TYPE_WARD_STOCK, 'WARD_STOCK'],
  [PINV.LOCATION_TYPE_SHELF, 'SHELF'],
]);

/** Concepto `{code, display}`. */
export interface ConceptView {
  code: string;
  display: string;
}

/** Equipo con su sala (forma `LocatedEquipment` de la web, W-F4F5). */
export interface LocatedEquipmentView {
  id: string;
  siteId: string;
  diagnosticUnitSiteName: string;
  type: ConceptView | null;
  manufacturer: string | null;
  model: string | null;
  serialNumber: string | null;
  modality: ConceptView | null;
  operationalStatus: ConceptView | null;
  careSpace: { id: string; code: string; name: string; path: string } | null;
  aeTitle: string | null;
  stationName: string | null;
  schedulableResourceId: string | null;
}

const EQUIPMENT_SQL = `
  WITH RECURSIVE chain AS (
    SELECT cs.id AS leaf, cs.id, cs.parent_space_id, cs.name, 0 AS depth
      FROM practice.care_spaces cs
     WHERE cs.id IN (SELECT care_space_id FROM diagnostic_units.diagnostic_equipment e2
                       JOIN diagnostic_units.diagnostic_unit_sites s2 ON s2.id = e2.diagnostic_unit_site_id
                      WHERE s2.practice_site_id = ? AND e2.care_space_id IS NOT NULL)
    UNION ALL
    SELECT c.leaf, p.id, p.parent_space_id, p.name, c.depth + 1
      FROM chain c JOIN practice.care_spaces p ON p.id = c.parent_space_id
     WHERE c.depth < 32
  ), paths AS (
    SELECT leaf, string_agg(name, ' / ' ORDER BY depth DESC) AS path FROM chain GROUP BY leaf
  )
  SELECT e.id, s.practice_site_id AS site_id, du.name AS unit_name,
         e.manufacturer, e.model, e.serial_number, e.ae_title, e.station_name,
         e.schedulable_resource_id, e.care_space_id,
         cs.code AS space_code, cs.name AS space_name, paths.path,
         t.code AS type_code, t.display AS type_display,
         m.code AS modality_code, m.display AS modality_display,
         st.code AS status_code, st.display AS status_display
    FROM diagnostic_units.diagnostic_equipment e
    JOIN diagnostic_units.diagnostic_unit_sites s ON s.id = e.diagnostic_unit_site_id
    JOIN diagnostic_units.diagnostic_units du ON du.id = s.diagnostic_unit_id
    LEFT JOIN practice.care_spaces cs ON cs.id = e.care_space_id
    LEFT JOIN paths ON paths.leaf = e.care_space_id
    LEFT JOIN terminology.catalog_concepts t ON t.id = e.equipment_type_concept_id
    LEFT JOIN terminology.catalog_concepts m ON m.id = e.modality_concept_id
    LEFT JOIN terminology.catalog_concepts st ON st.id = e.operational_status_concept_id
   WHERE s.practice_site_id = ? AND du.tenant_id = ?`;

/**
 * Lecturas de la ficha de espacio de F5 que la web consume (Desvíos W-F4F5):
 * `GET /care-spaces/:id/stock`, `GET /care-spaces/:id/equipment` y
 * `GET /sites/:siteId/diagnostic-equipment`. SQL de sólo lectura sobre
 * `pharmacy_inventory` y `diagnostic_units` (igual que
 * `RetireBlockersRepository`: `practice` no importa esos módulos), siempre con
 * el tenant activo y filtrado por el alcance del actor.
 */
@Injectable()
export class SpaceAssetsReadService {
  constructor(
    private readonly em: EntityManager,
    private readonly access: InfrastructureAccessService,
    private readonly cells: OpsCellBuilder,
  ) {}

  /**
   * `GET /sites/:siteId/sample-collection-points` (§F5b): puntos de toma
   * ACTIVE y disponibles (sin bloqueo F2) de una sede del tenant activo, con
   * su unidad y su celda operativa. Permisos «los de la orden/toma
   * existentes»: cualquier miembro del tenant que ordena; la sede tiene que
   * ser del tenant (404). Sin datos de paciente.
   *
   * @param siteId - Sede.
   * @param tenantId - Tenant activo.
   */
  async collectionPoints(siteId: string, tenantId: string) {
    const em = this.em.fork();
    const target = await this.access.resolve(em, { siteId }, tenantId);
    const points = (await collectionPointsOfSite(em, siteId)).filter(
      (p) => p.available,
    );
    const spaces = points.length
      ? await em.find(CareSpaces, { id: { $in: points.map((p) => p.id) } })
      : [];
    const byId = new Map(spaces.map((s) => [s.id, s]));
    const out = [];
    for (const p of points) {
      const space = byId.get(p.id);
      if (!space) continue;
      out.push({
        careSpace: { id: p.id, code: p.code, name: p.name },
        unit: p.unitId ? { id: p.unitId, name: p.unitName ?? '' } : null,
        cell: await this.cells.cellFor(em, space, target.site.practiceId),
        hours: null,
      });
    }
    return out;
  }

  /**
   * Ubicaciones de inventario del espacio y farmacias de su sede.
   *
   * @param careSpaceId - Espacio.
   * @param actor - Actor.
   * @param tenantId - Tenant activo.
   */
  async stock(careSpaceId: string, actor: AuthenticatedUser, tenantId: string) {
    const em = this.em.fork();
    const { target } = await this.access.assertCan(
      actor,
      'f5.space.stock.read',
      { careSpaceId },
      em,
      tenantId,
    );
    const pharmacySites = await em.execute<{ id: string; name: string }[]>(
      `SELECT ps.id, ps.name FROM pharmacy.pharmacy_sites ps
         JOIN pharmacy.pharmacies p ON p.id = ps.pharmacy_id
        WHERE ps.practice_site_id = ? AND p.tenant_id = ? ORDER BY ps.name, ps.id`,
      [target.site.id, tenantId],
      'all',
    );
    const locations = await em.execute<
      {
        id: string;
        pharmacy_site_id: string;
        code: string;
        name: string;
        type_id: string;
        type_code: string | null;
        type_display: string | null;
        status_code: string | null;
        status_display: string | null;
        space_code: string | null;
        space_name: string | null;
        care_space_id: string | null;
        clinical_unit_id: string | null;
        unit_name: string | null;
      }[]
    >(
      `SELECT l.id, l.pharmacy_site_id, l.code, l.name, l.care_space_id, l.clinical_unit_id,
              l.location_type_concept_id AS type_id,
              t.code AS type_code, t.display AS type_display,
              st.code AS status_code, st.display AS status_display,
              cs.code AS space_code, cs.name AS space_name, u.name AS unit_name
         FROM pharmacy_inventory.inventory_locations l
         JOIN pharmacy.pharmacy_sites ps ON ps.id = l.pharmacy_site_id
         JOIN pharmacy.pharmacies p ON p.id = ps.pharmacy_id
         LEFT JOIN practice.care_spaces cs ON cs.id = l.care_space_id
         LEFT JOIN practice.clinical_units u ON u.id = l.clinical_unit_id
         LEFT JOIN terminology.catalog_concepts t ON t.id = l.location_type_concept_id
         LEFT JOIN terminology.catalog_concepts st ON st.id = l.status_concept_id
        WHERE l.care_space_id = ? AND p.tenant_id = ?
        ORDER BY l.code, l.id`,
      [careSpaceId, tenantId],
      'all',
    );
    const lines = locations.length
      ? await em.execute<
          {
            inventory_location_id: string;
            product_name: string | null;
            lot_number: string | null;
            expires_at: string | null;
            on_hand_quantity: string;
            available_quantity: string;
            package_size_text: string | null;
          }[]
        >(
          `SELECT sp.inventory_location_id, coalesce(pr.brand_name, pr.generic_name) AS product_name,
                  lt.lot_number, lt.expires_at, sp.on_hand_quantity, sp.available_quantity,
                  pr.package_size_text
             FROM pharmacy_inventory.inventory_stock_positions sp
             JOIN pharmacy.pharmacy_products pr ON pr.id = sp.pharmacy_product_id
             LEFT JOIN pharmacy_inventory.inventory_lots lt ON lt.id = sp.inventory_lot_id
            WHERE sp.inventory_location_id = ANY(?::uuid[])
            ORDER BY product_name, lt.expires_at NULLS LAST`,
          [`{${locations.map((l) => l.id).join(',')}}`],
          'all',
        )
      : [];
    return {
      pharmacySites,
      locations: locations.map((l) => ({
        id: l.id,
        pharmacySiteId: l.pharmacy_site_id,
        code: l.code,
        name: l.name,
        locationType: concept(
          LOCATION_TYPE_CODE.get(l.type_id) ?? l.type_code,
          l.type_display,
        ),
        careSpace: l.care_space_id
          ? {
              id: l.care_space_id,
              code: l.space_code ?? '',
              name: l.space_name ?? '',
            }
          : null,
        clinicalUnit: l.clinical_unit_id
          ? { id: l.clinical_unit_id, name: l.unit_name ?? '' }
          : null,
        status: concept(l.status_code, l.status_display),
        lines: lines
          .filter((x) => x.inventory_location_id === l.id)
          .map((x) => ({
            productName: x.product_name ?? '',
            lotNumber: x.lot_number,
            expiryDate: x.expires_at
              ? new Date(x.expires_at).toISOString().slice(0, 10)
              : null,
            onHandQuantity: String(x.on_hand_quantity),
            availableQuantity: String(x.available_quantity),
            unit: x.package_size_text ?? '',
          })),
      })),
    };
  }

  /**
   * Equipos ubicados en el espacio.
   *
   * @param careSpaceId - Espacio.
   * @param actor - Actor.
   * @param tenantId - Tenant activo.
   */
  async spaceEquipment(
    careSpaceId: string,
    actor: AuthenticatedUser,
    tenantId: string,
  ): Promise<LocatedEquipmentView[]> {
    const em = this.em.fork();
    const { target } = await this.access.assertCan(
      actor,
      'f5.space.equipment.read',
      { careSpaceId },
      em,
      tenantId,
    );
    const rows = await this.equipmentRows(em, target.site.id, tenantId);
    return rows.filter((r) => r.careSpace?.id === careSpaceId);
  }

  /**
   * Equipos de las unidades diagnósticas de la sede; sin rol de nivel sede,
   * sólo los ubicados en espacios del alcance del actor.
   *
   * @param siteId - Sede de práctica.
   * @param actor - Actor.
   * @param tenantId - Tenant activo.
   */
  async siteEquipment(
    siteId: string,
    actor: AuthenticatedUser,
    tenantId: string,
  ): Promise<LocatedEquipmentView[]> {
    const em = this.em.fork();
    const filter = await this.access.scopeFilter(
      actor,
      'f5.space.equipment.read',
      siteId,
      em,
      tenantId,
    );
    const rows = await this.equipmentRows(em, siteId, tenantId);
    return filter.allSite
      ? rows
      : rows.filter((r) => !!r.careSpace && filter.allowsSpace(r.careSpace.id));
  }

  private async equipmentRows(
    em: EntityManager,
    siteId: string,
    tenantId: string,
  ): Promise<LocatedEquipmentView[]> {
    const rows = await em.execute<Record<string, string | null>[]>(
      `${EQUIPMENT_SQL} ORDER BY e.id`,
      [siteId, siteId, tenantId],
      'all',
    );
    return rows.map((r) => ({
      id: r.id!,
      siteId: r.site_id!,
      diagnosticUnitSiteName: r.unit_name ?? '',
      type: concept(r.type_code, r.type_display),
      manufacturer: r.manufacturer,
      model: r.model,
      serialNumber: r.serial_number,
      modality: r.modality_code
        ? concept(r.modality_code, r.modality_display)
        : null,
      operationalStatus: concept(r.status_code, r.status_display),
      careSpace: r.care_space_id
        ? {
            id: r.care_space_id,
            code: r.space_code ?? '',
            name: r.space_name ?? '',
            path: r.path ?? r.space_name ?? '',
          }
        : null,
      aeTitle: r.ae_title,
      stationName: r.station_name,
      schedulableResourceId: r.schedulable_resource_id,
    }));
  }
}

function concept(code: string | null, display: string | null): ConceptView {
  return { code: code ?? '', display: display ?? code ?? '' };
}
