import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { isoTimestampSql } from '../../../common/pagination/iso-timestamp-sql';
import type {
  ElementState,
  PlacementState,
  SpaceInfo,
} from '../domain/plan-layout-validator';
import type { Bbox } from '../domain/plan-geometry';
import { PRAC } from '../practice.concepts';
import { CONCEPTS } from '../../../common';
import { BACKGROUND_RULES } from './floor-plan.constants';

/** Array de PostgreSQL como texto (`{a,b}`) para `?::uuid[]`. */
export function pgUuidArray(ids: readonly string[]): string {
  return `{${ids.join(',')}}`;
}

/** Un lienzo tal como lo lee la API. */
export interface PlanRow {
  id: string;
  tenantId: string;
  siteId: string;
  practiceId: string;
  anchorSpaceId: string | null;
  anchorCode: string | null;
  anchorName: string | null;
  anchorFormConceptId: string | null;
  anchorStatusConceptId: string | null;
  code: string;
  name: string;
  widthM: number;
  heightM: number;
  elevationM: number | null;
  northBearingDeg: number;
  gridSizeM: number;
  snapToGrid: boolean;
  contactToleranceM: number;
  backgroundFileId: string | null;
  backgroundScaleMPerPx: number | null;
  backgroundOffsetXM: number;
  backgroundOffsetYM: number;
  backgroundRotationDeg: number;
  backgroundOpacity: number;
  layoutVersion: number;
  layoutChangedAt: string | null;
  validFrom: string;
  validTo: string | null;
  retired: boolean;
  rowVersion: number;
  createdAt: string;
  updatedAt: string;
}

interface RawPlan {
  id: string;
  tenant_id: string;
  site_id: string;
  practice_id: string;
  anchor_space_id: string | null;
  anchor_code: string | null;
  anchor_name: string | null;
  anchor_form_concept_id: string | null;
  anchor_status_concept_id: string | null;
  code: string;
  name: string;
  width_m: number;
  height_m: number;
  elevation_m: number | null;
  north_bearing_deg: number;
  grid_size_m: number;
  snap_to_grid: boolean;
  contact_tolerance_m: number;
  background_file_id: string | null;
  background_scale_m_per_px: number | null;
  background_offset_x_m: number;
  background_offset_y_m: number;
  background_rotation_deg: number;
  background_opacity: number;
  layout_version: number;
  layout_changed_at: string | null;
  valid_from: string;
  valid_to: string | null;
  retired: boolean;
  row_version: number;
  created_at: string;
  updated_at: string;
}

const PLAN_SELECT = `
  select fp.id, fp.tenant_id, fp.practice_site_id as site_id, ps.practice_id,
         fp.anchor_space_id, a.code as anchor_code, a.name as anchor_name,
         a.form_concept_id as anchor_form_concept_id, a.status_concept_id as anchor_status_concept_id,
         fp.code, fp.name, fp.width_m::float8 as width_m, fp.height_m::float8 as height_m,
         fp.elevation_m::float8 as elevation_m, fp.north_bearing_deg::float8 as north_bearing_deg,
         fp.grid_size_m::float8 as grid_size_m, fp.snap_to_grid, fp.contact_tolerance_m::float8 as contact_tolerance_m,
         fp.background_file_id, fp.background_scale_m_per_px::float8 as background_scale_m_per_px,
         fp.background_offset_x_m::float8 as background_offset_x_m, fp.background_offset_y_m::float8 as background_offset_y_m,
         fp.background_rotation_deg::float8 as background_rotation_deg, fp.background_opacity::float8 as background_opacity,
         fp.layout_version, ${isoTimestampSql('fp.layout_changed_at')} as layout_changed_at,
         ${isoTimestampSql('fp.valid_from')} as valid_from, ${isoTimestampSql('fp.valid_to')} as valid_to,
         (fp.valid_to is not null and fp.valid_to <= now()) as retired,
         fp.row_version, ${isoTimestampSql('fp.created_at')} as created_at, ${isoTimestampSql('fp.updated_at')} as updated_at
    from practice.floor_plans fp
    join practice.practice_sites ps on ps.id = fp.practice_site_id
    left join practice.care_spaces a on a.id = fp.anchor_space_id`;

function toPlan(row: RawPlan): PlanRow {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    siteId: row.site_id,
    practiceId: row.practice_id,
    anchorSpaceId: row.anchor_space_id,
    anchorCode: row.anchor_code,
    anchorName: row.anchor_name,
    anchorFormConceptId: row.anchor_form_concept_id,
    anchorStatusConceptId: row.anchor_status_concept_id,
    code: row.code,
    name: row.name,
    widthM: row.width_m,
    heightM: row.height_m,
    elevationM: row.elevation_m,
    northBearingDeg: row.north_bearing_deg,
    gridSizeM: row.grid_size_m,
    snapToGrid: row.snap_to_grid,
    contactToleranceM: row.contact_tolerance_m,
    backgroundFileId: row.background_file_id,
    backgroundScaleMPerPx: row.background_scale_m_per_px,
    backgroundOffsetXM: row.background_offset_x_m,
    backgroundOffsetYM: row.background_offset_y_m,
    backgroundRotationDeg: row.background_rotation_deg,
    backgroundOpacity: row.background_opacity,
    layoutVersion: row.layout_version,
    layoutChangedAt: row.layout_changed_at,
    validFrom: row.valid_from,
    validTo: row.valid_to,
    retired: row.retired,
    rowVersion: row.row_version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Campos editables de un lienzo. */
export interface PlanPatch {
  name?: string;
  widthM?: number;
  heightM?: number;
  elevationM?: number | null;
  northBearingDeg?: number;
  gridSizeM?: number;
  snapToGrid?: boolean;
  contactToleranceM?: number;
}

/** Datos de un lienzo nuevo. */
export interface PlanInsert {
  id: string;
  tenantId: string;
  siteId: string;
  anchorSpaceId: string | null;
  code: string;
  name: string;
  widthM: number;
  heightM: number;
  elevationM: number | null;
  northBearingDeg: number;
  gridSizeM: number;
  snapToGrid: boolean;
  contactToleranceM: number;
  actorUserId: string;
}

/** Fila cruda de una ubicación. */
interface RawPlacement {
  placement_id: string;
  space_id: string;
  row_version: number;
  z_order: number;
  locked: boolean;
  shape_kind: 'RECT' | 'POLYGON';
  center_x_m: number | null;
  center_y_m: number | null;
  width_m: number | null;
  depth_m: number | null;
  rotation_deg: number | null;
  vertices: [number, number][];
}

/** Fila cruda de un elemento. */
interface RawElement {
  id: string;
  kind: string;
  row_version: number;
  z_order: number;
  vertices: [number, number][] | null;
  thickness_m: number | null;
  host_element_id: string | null;
  offset_m: number | null;
  width_m: number | null;
  swing: string | null;
  swing_side: string | null;
  label: string | null;
  vertical_link_code: string | null;
  connects_space_a_id: string | null;
  connects_space_b_id: string | null;
}

/** Estado completo de un lienzo para validar un guardado. */
export interface WorkingModel {
  placements: PlacementState[];
  elements: ElementState[];
}

/** Parámetros de lectura del layout. */
export interface LayoutQuery {
  planId: string;
  tenantId: string;
  bbox?: Bbox;
  limit: number;
  cursor?: { z: number; id: string };
  includeRetired: boolean;
  /** Si viene, sólo estos espacios (foco `filter`). */
  onlySpaceIds?: readonly string[];
}

/** Fila de ubicación para el layout, con identidad. */
export interface LayoutSpaceRow {
  placementId: string;
  spaceId: string;
  rowVersion: number;
  zOrder: number;
  locked: boolean;
  shapeKind: 'RECT' | 'POLYGON';
  centerXM: number | null;
  centerYM: number | null;
  widthM: number | null;
  depthM: number | null;
  rotationDeg: number | null;
  vertices: [number, number][];
  bbox: Bbox;
  areaCalcM2: number;
  code: string;
  name: string;
  parentId: string | null;
  formConceptId: string;
  functionConceptId: string;
  statusConceptId: string;
  areaDeclaredM2: number | null;
  capacity: number | null;
  asepsisConceptId: string | null;
  pressureConceptId: string | null;
  airChangesPerHour: number | null;
  hvacValidatedOn: string | null;
  sexRestrictionConceptId: string | null;
  ageGroupConceptId: string | null;
  bedCategoryConceptId: string | null;
}

/** Fila de elemento para el layout. */
export interface LayoutElementRow {
  id: string;
  kind: string;
  rowVersion: number;
  zOrder: number;
  vertices: [number, number][] | null;
  thicknessM: number | null;
  hostElementId: string | null;
  offsetM: number | null;
  widthM: number | null;
  swing: string | null;
  swingSide: string | null;
  label: string | null;
  verticalLinkCode: string | null;
  connectsSpaceAId: string | null;
  connectsSpaceBId: string | null;
  bbox: Bbox | null;
}

/**
 * Acceso a datos del plano de planta (`practice.floor_plans`,
 * `space_placements`, `plan_elements`) con SQL directo.
 *
 * Es SQL y no entidades a propósito: la base deriva columnas que el ORM no
 * conoce (`outline`, `overlap_outline`, `bbox`, `sibling_group_id`,
 * `layout_version`), las consultas por ventana usan `box &&` sobre el índice
 * gist y la paginación es keyset. Toda consulta lleva `tenant_id` además de la
 * RLS. Stateless: el `em` activo llega como primer parámetro.
 */
@Injectable()
export class FloorPlansRepository {
  // ------------------------------------------------------------------ lienzos

  /**
   * Un lienzo del tenant.
   *
   * @param tx - Transacción o contexto.
   * @param id - Lienzo.
   * @param tenantId - Tenant activo.
   * @param lock - `true` toma `FOR UPDATE` de la fila del lienzo.
   * @returns El lienzo o `null`.
   */
  async findPlan(
    tx: EntityManager,
    id: string,
    tenantId: string,
    lock = false,
  ): Promise<PlanRow | null> {
    const rows = await tx.execute<RawPlan[]>(
      `${PLAN_SELECT} where fp.id = ?::uuid and fp.tenant_id = ?::uuid ${lock ? 'for update of fp' : ''}`,
      [id, tenantId],
    );
    return rows[0] ? toPlan(rows[0]) : null;
  }

  /** Lienzos de una sede con sus recuentos. */
  async listPlans(
    tx: EntityManager,
    siteId: string,
    tenantId: string,
    includeRetired: boolean,
  ): Promise<
    (PlanRow & { placed: number; unplaced: number; elements: number })[]
  > {
    const rows = await tx.execute<
      (RawPlan & { placed: number; unplaced: number; elements: number })[]
    >(
      `select p.*,
              (select count(*)::int from practice.space_placements sp where sp.floor_plan_id = p.id) as placed,
              (select count(*)::int from practice.plan_unplaced_spaces(p.id)) as unplaced,
              (select count(*)::int from practice.plan_elements e where e.floor_plan_id = p.id) as elements
         from (${PLAN_SELECT} where fp.practice_site_id = ?::uuid and fp.tenant_id = ?::uuid
                ${includeRetired ? '' : 'and (fp.valid_to is null or fp.valid_to > now())'}) p
        order by p.elevation_m nulls last, p.code`,
      [siteId, tenantId],
    );
    return rows.map((row) => ({
      ...toPlan(row),
      placed: row.placed,
      unplaced: row.unplaced,
      elements: row.elements,
    }));
  }

  /** Crea un lienzo. La base valida unicidad y tenant. */
  async insertPlan(tx: EntityManager, data: PlanInsert): Promise<void> {
    await tx.execute(
      `insert into practice.floor_plans
         (id, tenant_id, practice_site_id, anchor_space_id, code, name, width_m, height_m, elevation_m,
          north_bearing_deg, grid_size_m, snap_to_grid, contact_tolerance_m,
          created_by_user_id, updated_by_user_id)
       values (?::uuid, ?::uuid, ?::uuid, ?::uuid, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?::uuid, ?::uuid)`,
      [
        data.id,
        data.tenantId,
        data.siteId,
        data.anchorSpaceId,
        data.code,
        data.name,
        data.widthM,
        data.heightM,
        data.elevationM,
        data.northBearingDeg,
        data.gridSizeM,
        data.snapToGrid,
        data.contactToleranceM,
        data.actorUserId,
        data.actorUserId,
      ],
    );
  }

  /**
   * Edita metadatos con bloqueo optimista por `row_version`.
   *
   * @returns `false` si la versión ya no coincide.
   */
  async patchPlan(
    tx: EntityManager,
    id: string,
    tenantId: string,
    expectedRowVersion: number,
    patch: PlanPatch,
    actorUserId: string,
  ): Promise<boolean> {
    const sets: string[] = [];
    const params: unknown[] = [];
    const add = (column: string, value: unknown): void => {
      sets.push(`${column} = ?`);
      params.push(value);
    };
    if (patch.name !== undefined) add('name', patch.name);
    if (patch.widthM !== undefined) add('width_m', patch.widthM);
    if (patch.heightM !== undefined) add('height_m', patch.heightM);
    if (patch.elevationM !== undefined) add('elevation_m', patch.elevationM);
    if (patch.northBearingDeg !== undefined)
      add('north_bearing_deg', patch.northBearingDeg);
    if (patch.gridSizeM !== undefined) add('grid_size_m', patch.gridSizeM);
    if (patch.snapToGrid !== undefined) add('snap_to_grid', patch.snapToGrid);
    if (patch.contactToleranceM !== undefined)
      add('contact_tolerance_m', patch.contactToleranceM);
    const rows = await tx.execute<{ id: string }[]>(
      `update practice.floor_plans
          set ${sets.join(', ')}${sets.length ? ',' : ''} row_version = row_version + 1,
              updated_at = now(), updated_by_user_id = ?::uuid
        where id = ?::uuid and tenant_id = ?::uuid and row_version = ?
        returning id`,
      [...params, actorUserId, id, tenantId, expectedRowVersion],
    );
    return rows.length > 0;
  }

  /** Clausura (`valid_to = now()`) o reabre (`valid_to = null`) un lienzo. */
  async setValidity(
    tx: EntityManager,
    id: string,
    tenantId: string,
    expectedRowVersion: number,
    retire: boolean,
    actorUserId: string,
  ): Promise<boolean> {
    const rows = await tx.execute<{ id: string }[]>(
      `update practice.floor_plans
          set valid_to = ${retire ? 'now()' : 'null'}, row_version = row_version + 1,
              updated_at = now(), updated_by_user_id = ?::uuid
        where id = ?::uuid and tenant_id = ?::uuid and row_version = ?
        returning id`,
      [actorUserId, id, tenantId, expectedRowVersion],
    );
    return rows.length > 0;
  }

  /** Fija o quita el fondo importado del lienzo. */
  async setBackground(
    tx: EntityManager,
    id: string,
    tenantId: string,
    expectedRowVersion: number,
    background: {
      fileId: string;
      scaleMPerPx: number;
      offsetXM: number;
      offsetYM: number;
      rotationDeg: number;
      opacity: number;
    } | null,
    actorUserId: string,
  ): Promise<boolean> {
    const rows = await tx.execute<{ id: string }[]>(
      `update practice.floor_plans
          set background_file_id = ?::uuid, background_scale_m_per_px = ?,
              background_offset_x_m = ?, background_offset_y_m = ?,
              background_rotation_deg = ?, background_opacity = ?,
              row_version = row_version + 1, updated_at = now(), updated_by_user_id = ?::uuid
        where id = ?::uuid and tenant_id = ?::uuid and row_version = ?
        returning id`,
      [
        background?.fileId ?? null,
        background?.scaleMPerPx ?? null,
        background?.offsetXM ?? 0,
        background?.offsetYM ?? 0,
        background?.rotationDeg ?? 0,
        background?.opacity ?? 0.5,
        actorUserId,
        id,
        tenantId,
        expectedRowVersion,
      ],
    );
    return rows.length > 0;
  }

  /** `layout_version` y su instante tras las escrituras de la transacción. */
  async layoutVersionOf(
    tx: EntityManager,
    planId: string,
  ): Promise<{ version: number; changedAt: string | null }> {
    const rows = await tx.execute<
      { layout_version: number; changed_at: string | null }[]
    >(
      `select layout_version, ${isoTimestampSql('layout_changed_at')} as changed_at
         from practice.floor_plans where id = ?::uuid`,
      [planId],
    );
    return {
      version: rows[0]?.layout_version ?? 0,
      changedAt: rows[0]?.changed_at ?? null,
    };
  }

  /**
   * Versión vigente del fondo **si sigue siendo servible**: archivo del tenant,
   * no borrado, versión sin infectar y con un tipo declarado de la lista cerrada.
   * Es el filtro barato para firmar la URL; el tipo REAL se verifica por contenido
   * cada vez que se sirven los bytes (`FloorPlanBackgroundService.content`).
   */
  async servableBackgroundVersion(
    tx: EntityManager,
    fileId: string,
    tenantId: string,
  ): Promise<string | null> {
    const rows = await tx.execute<{ version_id: string }[]>(
      `select f.current_version_id as version_id
         from common.files f
         join common.file_versions v on v.id = f.current_version_id and v.file_id = f.id
        where f.id = ?::uuid and f.tenant_id = ?::uuid and f.deleted_at is null
          and f.lifecycle_status_concept_id <> ?::uuid
          and v.malware_scan_status_concept_id <> ?::uuid
          and v.mime_type = any(?::text[])`,
      [
        fileId,
        tenantId,
        CONCEPTS.FILE_DELETED,
        CONCEPTS.SCAN_INFECTED,
        `{${BACKGROUND_RULES.mimeTypes.join(',')}}`,
      ],
    );
    return rows[0]?.version_id ?? null;
  }

  /** Valor de un ajuste de la práctica (`practice_settings`), o `undefined`. */
  async setting(
    tx: EntityManager,
    practiceId: string,
    key: string,
  ): Promise<unknown> {
    const rows = await tx.execute<{ value_json: unknown }[]>(
      `select value_json from practice.practice_settings where practice_id = ?::uuid and setting_key = ? limit 1`,
      [practiceId, key],
    );
    return rows[0]?.value_json;
  }

  // ------------------------------------------------------ modelo de trabajo

  /** Ubicaciones y elementos del lienzo, para validar un guardado. */
  async loadWorkingModel(
    tx: EntityManager,
    planId: string,
    tenantId: string,
  ): Promise<WorkingModel> {
    const [placements, elements] = await Promise.all([
      tx.execute<RawPlacement[]>(
        `select sp.id as placement_id, sp.care_space_id as space_id, sp.row_version, sp.z_order, sp.locked,
                sp.shape_kind, sp.center_x_m::float8 as center_x_m, sp.center_y_m::float8 as center_y_m,
                sp.width_m::float8 as width_m, sp.depth_m::float8 as depth_m, sp.rotation_deg::float8 as rotation_deg,
                sp.vertices
           from practice.space_placements sp
          where sp.floor_plan_id = ?::uuid and sp.tenant_id = ?::uuid`,
        [planId, tenantId],
      ),
      tx.execute<RawElement[]>(
        `select e.id, e.kind, e.row_version, e.z_order, e.vertices, e.thickness_m::float8 as thickness_m,
                e.host_element_id, e.offset_m::float8 as offset_m, e.width_m::float8 as width_m,
                e.swing, e.swing_side, e.label, e.vertical_link_code, e.connects_space_a_id, e.connects_space_b_id
           from practice.plan_elements e
          where e.floor_plan_id = ?::uuid and e.tenant_id = ?::uuid`,
        [planId, tenantId],
      ),
    ]);
    return {
      placements: placements.map((row) => ({
        placementId: row.placement_id,
        spaceId: row.space_id,
        rowVersion: row.row_version,
        zOrder: row.z_order,
        locked: row.locked,
        shapeKind: row.shape_kind,
        centerXM: row.center_x_m,
        centerYM: row.center_y_m,
        widthM: row.width_m,
        depthM: row.depth_m,
        rotationDeg: row.rotation_deg,
        vertices: row.vertices,
      })),
      elements: elements.map((row) => ({
        id: row.id,
        kind: row.kind,
        rowVersion: row.row_version,
        zOrder: row.z_order,
        vertices: row.vertices,
        thicknessM: row.thickness_m,
        hostElementId: row.host_element_id,
        offsetM: row.offset_m,
        widthM: row.width_m,
        swing: row.swing,
        swingSide: row.swing_side,
        label: row.label,
        verticalLinkCode: row.vertical_link_code,
        connectsSpaceAId: row.connects_space_a_id,
        connectsSpaceBId: row.connects_space_b_id,
      })),
    };
  }

  /**
   * Datos de árbol de los espacios pedidos **y de todos sus ancestros**, del
   * tenant. Un id que no es del tenant no aparece (la API lo trata como 404).
   */
  async loadSpaceInfos(
    tx: EntityManager,
    tenantId: string,
    ids: readonly string[],
  ): Promise<Map<string, SpaceInfo>> {
    if (ids.length === 0) return new Map();
    const rows = await tx.execute<
      {
        id: string;
        code: string;
        name: string;
        parent_space_id: string | null;
        practice_site_id: string;
        status_concept_id: string;
      }[]
    >(
      `with recursive up as (
         select cs.id, cs.code, cs.name, cs.parent_space_id, cs.practice_site_id, cs.status_concept_id
           from practice.care_spaces cs
          where cs.id = any(?::uuid[]) and cs.tenant_id = ?::uuid
         union
         select p.id, p.code, p.name, p.parent_space_id, p.practice_site_id, p.status_concept_id
           from practice.care_spaces p join up on p.id = up.parent_space_id
          where p.tenant_id = ?::uuid
       ) select * from up`,
      [pgUuidArray(ids), tenantId, tenantId],
    );
    return new Map(
      rows.map((row) => [
        row.id,
        {
          id: row.id,
          code: row.code,
          name: row.name,
          parentId: row.parent_space_id,
          siteId: row.practice_site_id,
          retired: row.status_concept_id === PRAC.SPACE_RETIRED,
        },
      ]),
    );
  }

  /** Ids de los espacios (de los pedidos) que ya tienen lugar en OTRO lienzo. */
  async placedElsewhere(
    tx: EntityManager,
    tenantId: string,
    planId: string,
    spaceIds: readonly string[],
  ): Promise<
    { spaceId: string; floorPlanId: string; floorPlanName: string }[]
  > {
    if (spaceIds.length === 0) return [];
    const rows = await tx.execute<
      { space_id: string; floor_plan_id: string; floor_plan_name: string }[]
    >(
      `select sp.care_space_id as space_id, sp.floor_plan_id, fp.name as floor_plan_name
         from practice.space_placements sp
         join practice.floor_plans fp on fp.id = sp.floor_plan_id
        where sp.care_space_id = any(?::uuid[]) and sp.tenant_id = ?::uuid and sp.floor_plan_id <> ?::uuid`,
      [pgUuidArray(spaceIds), tenantId, planId],
    );
    return rows.map((row) => ({
      spaceId: row.space_id,
      floorPlanId: row.floor_plan_id,
      floorPlanName: row.floor_plan_name,
    }));
  }

  /**
   * Camas con ocupación activa entre estos espacios y todo su subárbol
   * (INV-PL-12: no se saca del plano lo que tiene pacientes).
   */
  async occupiedBedsIn(
    tx: EntityManager,
    tenantId: string,
    rootIds: readonly string[],
    activeLocationConceptId: string,
  ): Promise<{ rootId: string; bedId: string }[]> {
    if (rootIds.length === 0) return [];
    return tx.execute<{ rootId: string; bedId: string }[]>(
      `with recursive d(root, id) as (
         select cs.id, cs.id from practice.care_spaces cs where cs.id = any(?::uuid[]) and cs.tenant_id = ?::uuid
         union
         select d.root, c.id from practice.care_spaces c join d on c.parent_space_id = d.id
       )
       select distinct d.root as "rootId", d.id as "bedId"
         from d
         join clinical.encounter_locations el on el.care_space_id = d.id
        where el.location_status_concept_id = ?::uuid and el.period_end is null`,
      [pgUuidArray(rootIds), tenantId, activeLocationConceptId],
    );
  }
}
