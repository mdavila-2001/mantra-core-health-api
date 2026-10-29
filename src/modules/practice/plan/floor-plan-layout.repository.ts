import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { isoTimestampSql } from '../../../common/pagination/iso-timestamp-sql';
import type { Bbox } from '../domain/plan-geometry';
import type {
  ElementWrite,
  PlacementWrite,
} from '../domain/plan-layout-validator';
import { pgUuidArray } from './floor-plans.repository';
import type {
  LayoutElementRow,
  LayoutQuery,
  LayoutSpaceRow,
} from './floor-plans.repository';
import type {
  AreaMismatchWarning,
  PlanValidationIssue,
} from './floor-plan.types';

/** Historia de una tabla del plano: tabla de origen y columna que apunta a ella. */
export type PlanHistoryKind =
  'floor_plans' | 'space_placements' | 'plan_elements';

const HISTORY_COLUMN: Readonly<Record<PlanHistoryKind, string>> = {
  floor_plans: 'floor_plan_id',
  space_placements: 'space_placement_id',
  plan_elements: 'plan_element_id',
};

const asBbox = (
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
): Bbox => [minX, minY, maxX, maxY];

/**
 * Escrituras y lecturas de ubicaciones y elementos del plano (SQL directo; ver
 * `FloorPlansRepository` para el porqué). Las derivadas (`outline`, `bbox`,
 * `sibling_group_id`, `layout_version`) las calcula la base.
 */
@Injectable()
export class FloorPlanLayoutRepository {
  // ----------------------------------------------------------- escrituras

  /** Inserta una ubicación. `vertices` es obligatorio aunque sea RECT (la base lo recalcula). */
  async insertPlacement(
    tx: EntityManager,
    ctx: { tenantId: string; planId: string; actorUserId: string },
    write: PlacementWrite,
    id: string,
  ): Promise<void> {
    await tx.execute(
      `insert into practice.space_placements
         (id, tenant_id, floor_plan_id, care_space_id, shape_kind, center_x_m, center_y_m, width_m, depth_m,
          rotation_deg, vertices, z_order, locked, created_by_user_id, updated_by_user_id)
       values (?::uuid, ?::uuid, ?::uuid, ?::uuid, ?, ?, ?, ?, ?, ?, ?::jsonb, ?, ?, ?::uuid, ?::uuid)`,
      [
        id,
        ctx.tenantId,
        ctx.planId,
        write.spaceId,
        write.shapeKind,
        write.centerXM,
        write.centerYM,
        write.widthM,
        write.depthM,
        write.rotationDeg,
        JSON.stringify(write.vertices),
        write.zOrder,
        write.locked,
        ctx.actorUserId,
        ctx.actorUserId,
      ],
    );
  }

  /** Actualiza una ubicación; `false` si la versión de la fila ya no es la esperada. */
  async updatePlacement(
    tx: EntityManager,
    ctx: { tenantId: string; planId: string; actorUserId: string },
    write: PlacementWrite,
    currentRowVersion: number,
  ): Promise<boolean> {
    const rows = await tx.execute<{ id: string }[]>(
      `update practice.space_placements
          set shape_kind = ?, center_x_m = ?, center_y_m = ?, width_m = ?, depth_m = ?, rotation_deg = ?,
              vertices = ?::jsonb, z_order = ?, locked = ?, row_version = row_version + 1,
              updated_at = now(), updated_by_user_id = ?::uuid
        where id = ?::uuid and tenant_id = ?::uuid and floor_plan_id = ?::uuid and row_version = ?
        returning id`,
      [
        write.shapeKind,
        write.centerXM,
        write.centerYM,
        write.widthM,
        write.depthM,
        write.rotationDeg,
        JSON.stringify(write.vertices),
        write.zOrder,
        write.locked,
        ctx.actorUserId,
        write.placementId,
        ctx.tenantId,
        ctx.planId,
        currentRowVersion,
      ],
    );
    return rows.length > 0;
  }

  /** Borra ubicaciones (la historia se escribe antes). */
  async deletePlacements(
    tx: EntityManager,
    tenantId: string,
    planId: string,
    placementIds: readonly string[],
  ): Promise<number> {
    if (placementIds.length === 0) return 0;
    const rows = await tx.execute<{ id: string }[]>(
      `delete from practice.space_placements
        where id = any(?::uuid[]) and tenant_id = ?::uuid and floor_plan_id = ?::uuid returning id`,
      [pgUuidArray(placementIds), tenantId, planId],
    );
    return rows.length;
  }

  /** Inserta un elemento. */
  async insertElement(
    tx: EntityManager,
    ctx: { tenantId: string; planId: string; actorUserId: string },
    write: ElementWrite,
  ): Promise<void> {
    await tx.execute(
      `insert into practice.plan_elements
         (id, tenant_id, floor_plan_id, kind, vertices, thickness_m, host_element_id, offset_m, width_m, swing,
          swing_side, label, vertical_link_code, connects_space_a_id, connects_space_b_id, z_order,
          created_by_user_id, updated_by_user_id)
       values (?::uuid, ?::uuid, ?::uuid, ?, ?::jsonb, ?, ?::uuid, ?, ?, ?, ?, ?, ?, ?::uuid, ?::uuid, ?, ?::uuid, ?::uuid)`,
      [
        write.id,
        ctx.tenantId,
        ctx.planId,
        write.kind,
        write.vertices === null ? null : JSON.stringify(write.vertices),
        write.thicknessM,
        write.hostElementId,
        write.offsetM,
        write.widthM,
        write.swing,
        write.swingSide,
        write.label,
        write.verticalLinkCode,
        write.connectsSpaceAId,
        write.connectsSpaceBId,
        write.zOrder,
        ctx.actorUserId,
        ctx.actorUserId,
      ],
    );
  }

  /** Actualiza un elemento; `false` si la versión de la fila ya no es la esperada. */
  async updateElement(
    tx: EntityManager,
    ctx: { tenantId: string; planId: string; actorUserId: string },
    write: ElementWrite,
    currentRowVersion: number,
  ): Promise<boolean> {
    const rows = await tx.execute<{ id: string }[]>(
      `update practice.plan_elements
          set kind = ?, vertices = ?::jsonb, thickness_m = ?, host_element_id = ?::uuid, offset_m = ?, width_m = ?,
              swing = ?, swing_side = ?, label = ?, vertical_link_code = ?,
              connects_space_a_id = ?::uuid, connects_space_b_id = ?::uuid, z_order = ?,
              row_version = row_version + 1, updated_at = now(), updated_by_user_id = ?::uuid
        where id = ?::uuid and tenant_id = ?::uuid and floor_plan_id = ?::uuid and row_version = ?
        returning id`,
      [
        write.kind,
        write.vertices === null ? null : JSON.stringify(write.vertices),
        write.thicknessM,
        write.hostElementId,
        write.offsetM,
        write.widthM,
        write.swing,
        write.swingSide,
        write.label,
        write.verticalLinkCode,
        write.connectsSpaceAId,
        write.connectsSpaceBId,
        write.zOrder,
        ctx.actorUserId,
        write.id,
        ctx.tenantId,
        ctx.planId,
        currentRowVersion,
      ],
    );
    return rows.length > 0;
  }

  /** Borra elementos (la historia se escribe antes). */
  async deleteElements(
    tx: EntityManager,
    tenantId: string,
    planId: string,
    ids: readonly string[],
  ): Promise<number> {
    if (ids.length === 0) return 0;
    const rows = await tx.execute<{ id: string }[]>(
      `delete from practice.plan_elements
        where id = any(?::uuid[]) and tenant_id = ?::uuid and floor_plan_id = ?::uuid returning id`,
      [pgUuidArray(ids), tenantId, planId],
    );
    return rows.length;
  }

  // -------------------------------------------------------------- historia

  /**
   * Sella una revisión por fila en `audit.<tabla>_history` (SCD-2 sólo
   * inserción): cierra la anterior (`valid_to`) y agrega la nueva con la foto
   * actual de la fila. Para los borrados se llama **antes** de borrar (el
   * trigger de tenant y la foto leen la fila de origen) y la revisión nace
   * cerrada.
   *
   * @param operationConceptId - `AUDIT_OP_INSERT|UPDATE|DELETE`.
   */
  async appendHistory(
    tx: EntityManager,
    kind: PlanHistoryKind,
    ids: readonly string[],
    operationConceptId: string,
    actorUserId: string,
    tenantId: string,
    closed = false,
  ): Promise<void> {
    if (ids.length === 0) return;
    const sourceColumn = HISTORY_COLUMN[kind];
    const history = `audit.${kind}_history`;
    const arr = pgUuidArray(ids);
    await tx.execute(
      `update ${history} set valid_to = now()
        where ${sourceColumn} = any(?::uuid[]) and valid_to is null`,
      [arr],
    );
    await tx.execute(
      `insert into ${history}
         (history_id, ${sourceColumn}, revision_no, operation_concept_id, valid_from, valid_to,
          data_snapshot, changed_by_user_id, recorded_at, tenant_id)
       select gen_random_uuid(), t.id,
              coalesce((select max(h.revision_no) from ${history} h where h.${sourceColumn} = t.id), 0) + 1,
              ?::uuid, now(), ${closed ? 'now()' : 'null'}, to_jsonb(t.*), ?::uuid, now(), ?::uuid
         from practice.${kind} t
        where t.id = any(?::uuid[])`,
      [operationConceptId, actorUserId, tenantId, arr],
    );
  }

  // ----------------------------------------------------------- verificación

  /**
   * Las tres comprobaciones de `practice.plan_validate`, acotadas a las
   * ubicaciones tocadas (y a los hijos de las movidas): es la verificación de la
   * base antes de confirmar, con los mismos códigos que el endpoint de validación.
   */
  async scopedIssues(
    tx: EntityManager,
    planId: string,
    spaceIds: readonly string[],
  ): Promise<PlanValidationIssue[]> {
    if (spaceIds.length === 0) return [];
    const rows = await tx.execute<
      {
        severity: 'ERROR';
        code: string;
        subject_id: string;
        other_id: string | null;
        detail: string;
      }[]
    >(
      `with t as (
         select sp.id, sp.care_space_id, sp.sibling_group_id, sp.overlap_outline, sp.outline
           from practice.space_placements sp
          where sp.floor_plan_id = ?::uuid
            and (sp.care_space_id = any(?::uuid[])
              or sp.care_space_id in (select c.id from practice.care_spaces c
                                       where c.parent_space_id = any(?::uuid[])))
       )
       select 'ERROR'::text as severity, 'SIBLING_OVERLAP'::text as code, a.care_space_id as subject_id,
              b.care_space_id as other_id, 'los espacios comparten superficie dentro de la tolerancia de contacto'::text as detail
         from t a
         join practice.space_placements b
           on b.floor_plan_id = ?::uuid and b.sibling_group_id = a.sibling_group_id and b.id <> a.id
          and a.overlap_outline && b.overlap_outline
        where a.care_space_id < b.care_space_id
           or b.care_space_id <> all(?::uuid[])
       union all
       select 'ERROR', 'CHILD_OUTSIDE_PARENT', c.care_space_id, cs.parent_space_id,
              'el espacio no cabe dentro de la geometría de su padre'
         from t c
         join practice.care_spaces cs on cs.id = c.care_space_id
         join practice.space_placements p on p.care_space_id = cs.parent_space_id and p.floor_plan_id = ?::uuid
        where not (p.outline @> c.overlap_outline)
       union all
       select 'ERROR', 'OUT_OF_BOUNDS', sp.care_space_id, null::uuid, 'la caja envolvente sale del lienzo'
         from practice.space_placements sp
         join practice.floor_plans fp on fp.id = sp.floor_plan_id
        where sp.floor_plan_id = ?::uuid and sp.care_space_id = any(?::uuid[])
          and ((sp.bbox[1])[0] < -fp.contact_tolerance_m or (sp.bbox[1])[1] < -fp.contact_tolerance_m
            or (sp.bbox[0])[0] > fp.width_m + fp.contact_tolerance_m
            or (sp.bbox[0])[1] > fp.height_m + fp.contact_tolerance_m)`,
      [
        planId,
        pgUuidArray(spaceIds),
        pgUuidArray(spaceIds),
        planId,
        pgUuidArray(spaceIds),
        planId,
        planId,
        pgUuidArray(spaceIds),
      ],
    );
    return rows.map((row) => ({
      severity: row.severity,
      code: row.code,
      subjectId: row.subject_id,
      otherId: row.other_id ?? undefined,
      detail: row.detail,
    }));
  }

  /** Auditoría completa del lienzo (`practice.plan_validate`). */
  async validate(
    tx: EntityManager,
    planId: string,
  ): Promise<PlanValidationIssue[]> {
    const rows = await tx.execute<
      {
        severity: 'ERROR' | 'WARNING';
        code: string;
        subject_id: string;
        other_id: string | null;
        detail: string;
      }[]
    >(
      `select severity, code, subject_id, other_id, detail from practice.plan_validate(?::uuid)`,
      [planId],
    );
    return rows.map((row) => ({
      severity: row.severity,
      code: row.code,
      subjectId: row.subject_id,
      otherId: row.other_id ?? undefined,
      detail: row.detail,
    }));
  }

  /** Advertencias `AREA_MISMATCH` de las ubicaciones tocadas (INV-PL-14). */
  async areaWarnings(
    tx: EntityManager,
    planId: string,
    spaceIds: readonly string[],
  ): Promise<AreaMismatchWarning[]> {
    if (spaceIds.length === 0) return [];
    const rows = await tx.execute<
      {
        care_space_id: string;
        area_declared_m2: number;
        area_calc_m2: number;
        deviation_pct: number;
        tolerance_pct: number;
      }[]
    >(
      `select v.care_space_id, v.area_declared_m2::float8 as area_declared_m2, v.area_calc_m2::float8 as area_calc_m2,
              v.deviation_pct::float8 as deviation_pct, v.tolerance_pct::float8 as tolerance_pct
         from practice.v_floor_plan_spaces v
        where v.floor_plan_id = ?::uuid and v.care_space_id = any(?::uuid[]) and v.within_tolerance = false`,
      [planId, pgUuidArray(spaceIds)],
    );
    return rows.map((row) => ({
      code: 'AREA_MISMATCH' as const,
      spaceId: row.care_space_id,
      declaredM2: row.area_declared_m2,
      calculatedM2: row.area_calc_m2,
      deviationPct: row.deviation_pct,
      tolerancePct: row.tolerance_pct,
    }));
  }

  // ----------------------------------------------------------------- lectura

  /**
   * Sello de la estructura que alimenta el layout: el layout depende no sólo de
   * `layout_version` sino de los nombres, estados y vínculos de los espacios.
   */
  async structureStamp(tx: EntityManager, planId: string): Promise<string> {
    const rows = await tx.execute<{ stamp: string }[]>(
      `select md5(
          coalesce((select max(cs.updated_at)::text || ':' || sum(cs.row_version)::text
                      from practice.space_placements sp join practice.care_spaces cs on cs.id = sp.care_space_id
                     where sp.floor_plan_id = ?::uuid), '-') || '|' ||
          coalesce((select max(greatest(a.valid_from, coalesce(a.valid_to, a.valid_from)))::text || ':' || count(*)::text
                      from practice.space_placements sp join practice.space_unit_assignments a on a.care_space_id = sp.care_space_id
                     where sp.floor_plan_id = ?::uuid), '-')
        ) as stamp`,
      [planId, planId],
    );
    return rows[0]?.stamp ?? '-';
  }

  /** Ubicaciones del layout con la identidad del espacio, paginadas por keyset. */
  async layoutSpaces(
    tx: EntityManager,
    query: LayoutQuery,
    retiredConceptId: string,
  ): Promise<{ rows: LayoutSpaceRow[]; total: number }> {
    const where: string[] = [
      'sp.floor_plan_id = ?::uuid',
      'sp.tenant_id = ?::uuid',
    ];
    const params: unknown[] = [query.planId, query.tenantId];
    if (!query.includeRetired) {
      where.push('cs.status_concept_id <> ?::uuid');
      params.push(retiredConceptId);
    }
    if (query.bbox) {
      where.push('sp.bbox && box(point(?, ?), point(?, ?))');
      params.push(query.bbox[0], query.bbox[1], query.bbox[2], query.bbox[3]);
    }
    if (query.onlySpaceIds) {
      where.push('sp.care_space_id = any(?::uuid[])');
      params.push(pgUuidArray(query.onlySpaceIds));
    }
    const base = where.join(' and ');
    const baseParams = [...params];
    if (query.cursor) {
      where.push('(sp.z_order, sp.id) > (?, ?::uuid)');
      params.push(query.cursor.z, query.cursor.id);
    }
    const select = `
      select sp.id as placement_id, sp.care_space_id as space_id, sp.row_version, sp.z_order, sp.locked, sp.shape_kind,
             sp.center_x_m::float8 as center_x_m, sp.center_y_m::float8 as center_y_m,
             sp.width_m::float8 as width_m, sp.depth_m::float8 as depth_m, sp.rotation_deg::float8 as rotation_deg,
             sp.vertices, (sp.bbox[1])[0]::float8 as min_x, (sp.bbox[1])[1]::float8 as min_y,
             (sp.bbox[0])[0]::float8 as max_x, (sp.bbox[0])[1]::float8 as max_y, sp.area_calc_m2::float8 as area_calc_m2,
             cs.code, cs.name, cs.parent_space_id, cs.form_concept_id, cs.space_type_concept_id as function_concept_id,
             cs.status_concept_id, cs.area_m2::float8 as area_declared_m2, cs.capacity,
             cs.asepsis_concept_id, cs.pressure_concept_id, cs.air_changes_per_hour::float8 as air_changes_per_hour,
             to_char(cs.hvac_validated_on, 'YYYY-MM-DD') as hvac_validated_on,
             cs.sex_restriction_concept_id, cs.age_group_concept_id, cs.bed_category_concept_id
        from practice.space_placements sp
        join practice.care_spaces cs on cs.id = sp.care_space_id
       where ${where.join(' and ')}
       order by sp.z_order, sp.id
       limit ?`;
    const rows = await tx.execute<Record<string, unknown>[]>(select, [
      ...params,
      query.limit + 1,
    ]);
    const counted = await tx.execute<{ total: number }[]>(
      `select count(*)::int as total from practice.space_placements sp
         join practice.care_spaces cs on cs.id = sp.care_space_id where ${base}`,
      baseParams,
    );
    return {
      total: counted[0]?.total ?? 0,
      rows: rows.map((r) => ({
        placementId: r.placement_id as string,
        spaceId: r.space_id as string,
        rowVersion: r.row_version as number,
        zOrder: r.z_order as number,
        locked: r.locked as boolean,
        shapeKind: r.shape_kind as 'RECT' | 'POLYGON',
        centerXM: r.center_x_m as number | null,
        centerYM: r.center_y_m as number | null,
        widthM: r.width_m as number | null,
        depthM: r.depth_m as number | null,
        rotationDeg: r.rotation_deg as number | null,
        vertices: r.vertices as [number, number][],
        bbox: asBbox(
          r.min_x as number,
          r.min_y as number,
          r.max_x as number,
          r.max_y as number,
        ),
        areaCalcM2: r.area_calc_m2 as number,
        code: r.code as string,
        name: r.name as string,
        parentId: (r.parent_space_id as string | null) ?? null,
        formConceptId: r.form_concept_id as string,
        functionConceptId: r.function_concept_id as string,
        statusConceptId: r.status_concept_id as string,
        areaDeclaredM2: (r.area_declared_m2 as number | null) ?? null,
        capacity: (r.capacity as number | null) ?? null,
        asepsisConceptId: (r.asepsis_concept_id as string | null) ?? null,
        pressureConceptId: (r.pressure_concept_id as string | null) ?? null,
        airChangesPerHour: (r.air_changes_per_hour as number | null) ?? null,
        hvacValidatedOn: (r.hvac_validated_on as string | null) ?? null,
        sexRestrictionConceptId:
          (r.sex_restriction_concept_id as string | null) ?? null,
        ageGroupConceptId: (r.age_group_concept_id as string | null) ?? null,
        bedCategoryConceptId:
          (r.bed_category_concept_id as string | null) ?? null,
      })),
    };
  }

  /** Elementos del lienzo (los alojados viajan con su muro cuando éste entra en la ventana). */
  async layoutElements(
    tx: EntityManager,
    planId: string,
    tenantId: string,
    bbox: Bbox | undefined,
  ): Promise<LayoutElementRow[]> {
    const params: unknown[] = [planId, tenantId];
    let windowSql = '';
    if (bbox) {
      windowSql = `and (e.bbox is null and e.host_element_id in (
                           select w.id from practice.plan_elements w
                            where w.floor_plan_id = e.floor_plan_id and w.bbox && box(point(?, ?), point(?, ?)))
                        or e.bbox && box(point(?, ?), point(?, ?)))`;
      params.push(...bbox, ...bbox);
    }
    const rows = await tx.execute<Record<string, unknown>[]>(
      `select e.id, e.kind, e.row_version, e.z_order, e.vertices, e.thickness_m::float8 as thickness_m,
              e.host_element_id, e.offset_m::float8 as offset_m, e.width_m::float8 as width_m, e.swing, e.swing_side,
              e.label, e.vertical_link_code, e.connects_space_a_id, e.connects_space_b_id,
              (e.bbox[1])[0]::float8 as min_x, (e.bbox[1])[1]::float8 as min_y,
              (e.bbox[0])[0]::float8 as max_x, (e.bbox[0])[1]::float8 as max_y
         from practice.plan_elements e
        where e.floor_plan_id = ?::uuid and e.tenant_id = ?::uuid ${windowSql}
        order by e.z_order, e.id`,
      params,
    );
    return rows.map((r) => ({
      id: r.id as string,
      kind: r.kind as string,
      rowVersion: r.row_version as number,
      zOrder: r.z_order as number,
      vertices: (r.vertices as [number, number][] | null) ?? null,
      thicknessM: (r.thickness_m as number | null) ?? null,
      hostElementId: (r.host_element_id as string | null) ?? null,
      offsetM: (r.offset_m as number | null) ?? null,
      widthM: (r.width_m as number | null) ?? null,
      swing: (r.swing as string | null) ?? null,
      swingSide: (r.swing_side as string | null) ?? null,
      label: (r.label as string | null) ?? null,
      verticalLinkCode: (r.vertical_link_code as string | null) ?? null,
      connectsSpaceAId: (r.connects_space_a_id as string | null) ?? null,
      connectsSpaceBId: (r.connects_space_b_id as string | null) ?? null,
      bbox:
        r.min_x === null || r.min_x === undefined
          ? null
          : asBbox(
              r.min_x as number,
              r.min_y as number,
              r.max_x as number,
              r.max_y as number,
            ),
    }));
  }

  /** Nombres y rutas de los espacios pedidos, para la tarjeta (`detail=full`). */
  async cardExtras(
    tx: EntityManager,
    tenantId: string,
    spaceIds: readonly string[],
    activeConceptId: string,
    bedFormConceptId: string,
    ownerRoleConceptId: string,
  ): Promise<{
    owners: Map<string, { id: string; code: string; name: string }>;
    beds: Map<string, { beds: number; censable: number }>;
    paths: Map<
      string,
      { id: string; code: string; name: string; form: string }[]
    >;
  }> {
    const ids = pgUuidArray(spaceIds);
    const [owners, beds, paths] = await Promise.all([
      tx.execute<
        { space_id: string; id: string; code: string; name: string }[]
      >(
        `select a.care_space_id as space_id, u.id, u.code, u.name
           from practice.space_unit_assignments a
           join practice.clinical_units u on u.id = a.clinical_unit_id
          where a.care_space_id = any(?::uuid[]) and a.role_concept_id = ?::uuid
            and a.valid_from <= now() and (a.valid_to is null or a.valid_to > now())`,
        [ids, ownerRoleConceptId],
      ),
      tx.execute<{ root: string; beds: number; censable: number }[]>(
        `with recursive d(root, id) as (
           select cs.id, cs.id from practice.care_spaces cs where cs.id = any(?::uuid[]) and cs.tenant_id = ?::uuid
           union all
           select d.root, c.id from practice.care_spaces c join d on c.parent_space_id = d.id
         )
         select d.root,
                count(*) filter (where cs.form_concept_id = ?::uuid and cs.status_concept_id = ?::uuid)::int as beds,
                count(*) filter (where cs.form_concept_id = ?::uuid and cs.status_concept_id = ?::uuid and cs.censable is true)::int as censable
           from d join practice.care_spaces cs on cs.id = d.id group by d.root`,
        [
          ids,
          tenantId,
          bedFormConceptId,
          activeConceptId,
          bedFormConceptId,
          activeConceptId,
        ],
      ),
      tx.execute<
        {
          start_id: string;
          id: string;
          code: string;
          name: string;
          form_concept_id: string;
          depth: number;
        }[]
      >(
        `with recursive up(start_id, id, depth) as (
           select cs.id, cs.parent_space_id, 1 from practice.care_spaces cs
            where cs.id = any(?::uuid[]) and cs.tenant_id = ?::uuid and cs.parent_space_id is not null
           union all
           select up.start_id, p.parent_space_id, up.depth + 1
             from practice.care_spaces p join up on p.id = up.id where p.parent_space_id is not null
         )
         select up.start_id, a.id, a.code, a.name, a.form_concept_id, up.depth
           from up join practice.care_spaces a on a.id = up.id
          order by up.start_id, up.depth desc`,
        [ids, tenantId],
      ),
    ]);
    const pathMap = new Map<
      string,
      { id: string; code: string; name: string; form: string }[]
    >();
    for (const row of paths) {
      const list = pathMap.get(row.start_id) ?? [];
      list.push({
        id: row.id,
        code: row.code,
        name: row.name,
        form: row.form_concept_id,
      });
      pathMap.set(row.start_id, list);
    }
    return {
      owners: new Map(
        owners.map((o) => [
          o.space_id,
          { id: o.id, code: o.code, name: o.name },
        ]),
      ),
      beds: new Map(
        beds.map((b) => [b.root, { beds: b.beds, censable: b.censable }]),
      ),
      paths: pathMap,
    };
  }

  /** Raíz de los árboles de foco: el subárbol de un espacio. */
  async subtreeIds(
    tx: EntityManager,
    tenantId: string,
    rootId: string,
  ): Promise<string[]> {
    const rows = await tx.execute<{ id: string }[]>(
      `with recursive sub as (
         select id from practice.care_spaces where id = ?::uuid and tenant_id = ?::uuid
         union
         select c.id from practice.care_spaces c join sub on c.parent_space_id = sub.id
       ) select id from sub`,
      [rootId, tenantId],
    );
    return rows.map((r) => r.id);
  }

  /** Espacios vinculados (vigentes) a una unidad o a sus descendientes, con su subárbol. */
  async unitSpaceIds(
    tx: EntityManager,
    tenantId: string,
    unitIds: readonly string[],
    extraSpaceIds: readonly string[] = [],
  ): Promise<string[]> {
    const rows = await tx.execute<{ id: string }[]>(
      `with recursive units(id) as (
         select u.id from practice.clinical_units u where u.id = any(?::uuid[]) and u.tenant_id = ?::uuid
         union
         select c.id from practice.clinical_units c join units on c.parent_unit_id = units.id
       ), roots(id) as (
         select a.care_space_id from practice.space_unit_assignments a join units u on u.id = a.clinical_unit_id
          where a.valid_from <= now() and (a.valid_to is null or a.valid_to > now())
         union
         select cs.id from practice.care_spaces cs where cs.id = any(?::uuid[]) and cs.tenant_id = ?::uuid
       ), sub(id) as (
         select id from roots
         union
         select c.id from practice.care_spaces c join sub on c.parent_space_id = sub.id
       ) select id from sub`,
      [pgUuidArray(unitIds), tenantId, pgUuidArray(extraSpaceIds), tenantId],
    );
    return rows.map((r) => r.id);
  }

  /** Camas dibujadas en el lienzo con ocupación activa (INV-PL-12). */
  async occupiedPlacedBeds(
    tx: EntityManager,
    planId: string,
    tenantId: string,
    activeLocationConceptId: string,
    bedFormConceptId: string,
  ): Promise<string[]> {
    const rows = await tx.execute<{ id: string }[]>(
      `select distinct sp.care_space_id as id
         from practice.space_placements sp
         join practice.care_spaces cs on cs.id = sp.care_space_id and cs.form_concept_id = ?::uuid
         join clinical.encounter_locations el on el.care_space_id = sp.care_space_id
        where sp.floor_plan_id = ?::uuid and sp.tenant_id = ?::uuid
          and el.location_status_concept_id = ?::uuid and el.period_end is null`,
      [bedFormConceptId, planId, tenantId, activeLocationConceptId],
    );
    return rows.map((r) => r.id);
  }

  /** Espacios del conjunto que están dibujados en el lienzo y el recuadro que los abarca. */
  async placedBounds(
    tx: EntityManager,
    planId: string,
    tenantId: string,
    spaceIds: readonly string[],
  ): Promise<{ spaceIds: string[]; bbox: Bbox | null }> {
    if (spaceIds.length === 0) return { spaceIds: [], bbox: null };
    const rows = await tx.execute<
      {
        ids: string[] | null;
        min_x: number | null;
        min_y: number | null;
        max_x: number | null;
        max_y: number | null;
      }[]
    >(
      `select array_agg(sp.care_space_id order by sp.care_space_id) as ids,
              min((sp.bbox[1])[0])::float8 as min_x, min((sp.bbox[1])[1])::float8 as min_y,
              max((sp.bbox[0])[0])::float8 as max_x, max((sp.bbox[0])[1])::float8 as max_y
         from practice.space_placements sp
        where sp.floor_plan_id = ?::uuid and sp.tenant_id = ?::uuid and sp.care_space_id = any(?::uuid[])`,
      [planId, tenantId, pgUuidArray(spaceIds)],
    );
    const row = rows[0];
    if (!row?.ids) return { spaceIds: [], bbox: null };
    return {
      spaceIds: row.ids,
      bbox: asBbox(
        row.min_x as number,
        row.min_y as number,
        row.max_x as number,
        row.max_y as number,
      ),
    };
  }

  /** Espacios dibujados en el lienzo con lo mínimo para armar el estado y los recuentos por contenedor. */
  async placedTree(
    tx: EntityManager,
    planId: string,
    tenantId: string,
    bbox?: Bbox,
  ): Promise<
    {
      spaceId: string;
      parentId: string | null;
      formConceptId: string;
      statusConceptId: string;
      censable: boolean;
    }[]
  > {
    const params: unknown[] = [planId, tenantId];
    let window = '';
    if (bbox) {
      window = 'and sp.bbox && box(point(?, ?), point(?, ?))';
      params.push(...bbox);
    }
    const rows = await tx.execute<
      {
        space_id: string;
        parent_space_id: string | null;
        form_concept_id: string;
        status_concept_id: string;
        censable: boolean | null;
      }[]
    >(
      `select sp.care_space_id as space_id, cs.parent_space_id, cs.form_concept_id, cs.status_concept_id, cs.censable
         from practice.space_placements sp join practice.care_spaces cs on cs.id = sp.care_space_id
        where sp.floor_plan_id = ?::uuid and sp.tenant_id = ?::uuid ${window}`,
      params,
    );
    return rows.map((r) => ({
      spaceId: r.space_id,
      parentId: r.parent_space_id,
      formConceptId: r.form_concept_id,
      statusConceptId: r.status_concept_id,
      censable: r.censable === true,
    }));
  }

  /** Fecha del servidor (ISO), para `asOf`. */
  async serverNow(tx: EntityManager): Promise<string> {
    const rows = await tx.execute<{ now: string }[]>(
      `select ${isoTimestampSql('clock_timestamp()')} as now`,
    );
    return rows[0].now;
  }
}
