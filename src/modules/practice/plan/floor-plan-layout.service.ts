import { createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  PreconditionFailedException,
  type AuthenticatedUser,
} from '../../../common';
import {
  FORMS,
  FUNCTIONS,
  ATTRIBUTES,
  SPACE_LIFECYCLE,
} from '../infrastructure-catalog';
import { PRAC } from '../practice.concepts';
import { practiceOutOfScope } from '../services/practice-scope';
import { openingPosition } from '../domain/plan-layout-validator';
import type { Bbox } from '../domain/plan-geometry';
import type { LayoutQueryDto } from './floor-plan.dto';
import { PLAN_LIMITS } from './floor-plan.constants';
import { FloorPlanReason } from './floor-plan.error-reasons';
import { toFloorPlanMeta } from './floor-plan.mapper';
import type {
  LayoutResponse,
  PlacementCard,
  PlanElementDTO,
  SpacePlacementDTO,
} from './floor-plan.types';
import { FloorPlanContextService } from './floor-plan-context.service';
import { FloorPlanLayoutRepository } from './floor-plan-layout.repository';
import type {
  LayoutElementRow,
  LayoutSpaceRow,
  PlanRow,
} from './floor-plans.repository';
import { FloorPlansRepository } from './floor-plans.repository';
import { PlanBackgroundUrlService } from './plan-background-url.service';
import { etagMatches } from './layout-if-match';
import { PlanViewerService } from './plan-viewer.service';

/** Resultado de leer el layout: 304 sin cuerpo, o 200 con cuerpo. */
export type LayoutReadResult =
  | { readonly status: 304; readonly etag: string }
  | {
      readonly status: 200;
      readonly etag: string;
      readonly body: LayoutResponse;
    };

const DEFAULT_DETAIL = 'lite';

/**
 * Lectura ligera, paginada y cacheable del layout de un lienzo
 * (CONTRATO-PLANO §3.3).
 *
 * El `ETag` combina `layout_version` con lo que también cambia la respuesta sin
 * mover esa versión: la consulta, el alcance del actor y un sello de los
 * nombres, estados y vínculos de los espacios dibujados. Con el mismo `ETag` la
 * respuesta es 304 y no se arma el cuerpo.
 */
@Injectable()
export class FloorPlanLayoutService {
  /**
   * @param em - Contexto de persistencia.
   * @param context - Carga y autoriza.
   * @param plans - Lienzos.
   * @param layout - Ubicaciones y elementos.
   * @param viewers - Alcance del actor.
   * @param urls - URL firmadas del fondo.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly context: FloorPlanContextService,
    private readonly plans: FloorPlansRepository,
    private readonly layout: FloorPlanLayoutRepository,
    private readonly viewers: PlanViewerService,
    private readonly urls: PlanBackgroundUrlService,
  ) {}

  /**
   * `GET /floor-plans/:id/layout`.
   *
   * @param planId - Lienzo.
   * @param query - Ventana, detalle, paginación y foco.
   * @param ifNoneMatch - Cabecera `If-None-Match` del cliente.
   * @param actor - Quien lee.
   * @returns 304 o el layout.
   */
  async read(
    planId: string,
    query: LayoutQueryDto,
    ifNoneMatch: string | undefined,
    actor: AuthenticatedUser,
  ): Promise<LayoutReadResult> {
    return this.em.transactional(async (tx) => {
      const { tenantId, plan, viewer } = await this.context.plan(
        tx,
        planId,
        actor,
      );
      const bbox = this.windowOf(query.bbox);
      const include = new Set((query.include ?? 'spaces,elements').split(','));
      const detail = query.detail ?? DEFAULT_DETAIL;
      const limit = query.limit ?? PLAN_LIMITS.defaultPageSize;
      const mode = query.unitMode ?? 'filter';
      if (query.focusSpaceId && query.unitId) {
        throw new PreconditionFailedException(
          'Indicá `focusSpaceId` o `unitId` (uno solo)',
          undefined,
          FloorPlanReason.PLAN_FOCUS_PARAM_INVALID,
        );
      }
      const cursor = this.decodeCursor(query.cursor);

      const stamp = await this.layout.structureStamp(tx, plan.id);
      const hash = createHash('sha1')
        .update(
          JSON.stringify([
            bbox ?? null,
            [...include].sort(),
            detail,
            limit,
            query.cursor ?? null,
            query.focusSpaceId ?? null,
            query.unitId ?? null,
            mode,
            query.includeRetired ?? false,
            viewer.key,
            stamp,
          ]),
        )
        .digest('hex')
        .slice(0, 16);
      const etag = `W/"fp:${plan.id}:v${plan.layoutVersion}:${hash}"`;
      if (etagMatches(ifNoneMatch, etag)) return { status: 304, etag };

      // Foco por área/zona: subárbol de un espacio o espacios de una unidad.
      let focusIds: string[] | undefined;
      if (query.focusSpaceId) {
        focusIds = await this.layout.subtreeIds(
          tx,
          tenantId,
          query.focusSpaceId,
        );
        if (focusIds.length === 0)
          throw practiceOutOfScope('Espacio no encontrado');
      } else if (query.unitId) {
        focusIds = await this.layout.unitSpaceIds(tx, tenantId, [query.unitId]);
      }
      const identity = await this.viewers.resolveIds(
        tx,
        tenantId,
        viewer.identity,
      );
      if (focusIds && identity !== 'ALL') {
        focusIds = focusIds.filter((id) => identity.has(id));
      }
      const focusSet = focusIds ? new Set(focusIds) : undefined;

      let rows: LayoutSpaceRow[] = [];
      let total = 0;
      let nextCursor: string | null = null;
      if (include.has('spaces')) {
        const page = await this.layout.layoutSpaces(
          tx,
          {
            planId: plan.id,
            tenantId,
            bbox,
            limit,
            cursor,
            includeRetired: query.includeRetired ?? false,
            onlySpaceIds: focusSet && mode === 'filter' ? focusIds : undefined,
          },
          PRAC.SPACE_RETIRED,
        );
        total = page.total;
        rows = page.rows.slice(0, limit);
        if (page.rows.length > limit) {
          const last = rows[rows.length - 1];
          nextCursor = Buffer.from(
            JSON.stringify({ z: last.zOrder, id: last.placementId }),
          ).toString('base64url');
        }
      }

      const full =
        detail === 'full'
          ? await this.cardData(tx, tenantId, rows, identity)
          : undefined;
      const spaces = rows.map((row) =>
        this.toSpace(row, identity, focusSet, mode, full),
      );

      let elements: PlanElementDTO[] = [];
      if (include.has('elements') && !cursor) {
        elements = this.toElements(
          await this.layout.layoutElements(tx, plan.id, tenantId, bbox),
          identity,
        );
      }

      let focus: LayoutResponse['focus'];
      if (focusSet) {
        const bounds = await this.layout.placedBounds(
          tx,
          plan.id,
          tenantId,
          focusIds ?? [],
        );
        focus = { spaceIds: bounds.spaceIds, bbox: bounds.bbox };
      }

      const body: LayoutResponse = {
        floorPlan: toFloorPlanMeta(plan, await this.backgroundUrl(tx, plan)),
        layoutVersion: plan.layoutVersion,
        asOf: await this.layout.serverNow(tx),
        spaces,
        elements,
        page: { nextCursor, total },
        ...(focus ? { focus } : {}),
        viewer: viewer.caps,
      };
      return { status: 200, etag, body };
    });
  }

  // ------------------------------------------------------------------ mapeo

  private windowOf(raw: number[] | undefined): Bbox | undefined {
    if (!raw) return undefined;
    if (
      raw.length !== 4 ||
      raw.some((n) => !Number.isFinite(n)) ||
      raw[0] >= raw[2] ||
      raw[1] >= raw[3]
    ) {
      throw new PreconditionFailedException(
        '`bbox` es x0,y0,x1,y1 con x0 < x1 e y0 < y1',
        undefined,
        FloorPlanReason.PLAN_FOCUS_PARAM_INVALID,
      );
    }
    return [raw[0], raw[1], raw[2], raw[3]];
  }

  private decodeCursor(
    raw: string | undefined,
  ): { z: number; id: string } | undefined {
    if (!raw) return undefined;
    try {
      const parsed = JSON.parse(
        Buffer.from(raw, 'base64url').toString('utf8'),
      ) as {
        z: unknown;
        id: unknown;
      };
      if (
        typeof parsed.z === 'number' &&
        Number.isInteger(parsed.z) &&
        typeof parsed.id === 'string' &&
        /^[0-9a-f-]{36}$/.test(parsed.id)
      ) {
        return { z: parsed.z, id: parsed.id };
      }
    } catch {
      // cae al rechazo de abajo
    }
    throw new PreconditionFailedException(
      'El cursor no es válido',
      undefined,
      FloorPlanReason.PLAN_FOCUS_PARAM_INVALID,
    );
  }

  /** Datos estáticos de la tarjeta de los espacios visibles de la página. */
  private async cardData(
    tx: EntityManager,
    tenantId: string,
    rows: readonly LayoutSpaceRow[],
    identity: 'ALL' | ReadonlySet<string>,
  ): Promise<{
    extras: Awaited<ReturnType<FloorPlanLayoutRepository['cardExtras']>>;
  }> {
    const visible = rows
      .filter((row) => identity === 'ALL' || identity.has(row.spaceId))
      .map((row) => row.spaceId);
    const extras = await this.layout.cardExtras(
      tx,
      tenantId,
      visible,
      PRAC.SPACE_ACTIVE,
      FORMS.byInput('LOC_FORM_BED')!.id,
      PRAC.SPACE_UNIT_ROLE_OWNER,
    );
    return { extras };
  }

  private toSpace(
    row: LayoutSpaceRow,
    identity: 'ALL' | ReadonlySet<string>,
    focusSet: ReadonlySet<string> | undefined,
    mode: 'filter' | 'flag',
    full:
      | { extras: Awaited<ReturnType<FloorPlanLayoutRepository['cardExtras']>> }
      | undefined,
  ): SpacePlacementDTO {
    const inScope = identity === 'ALL' || identity.has(row.spaceId);
    const geometry: SpacePlacementDTO['geometry'] =
      row.shapeKind === 'RECT'
        ? {
            kind: 'RECT',
            centerXM: row.centerXM as number,
            centerYM: row.centerYM as number,
            widthM: row.widthM as number,
            depthM: row.depthM as number,
            rotationDeg: row.rotationDeg as number,
          }
        : { kind: 'POLYGON', vertices: row.vertices };
    const base = {
      placementId: row.placementId,
      spaceId: row.spaceId,
      rowVersion: row.rowVersion,
      zOrder: row.zOrder,
      locked: row.locked,
      geometry,
      bbox: row.bbox,
      areaCalcM2: row.areaCalcM2,
      inScope,
      ...(focusSet && mode === 'flag'
        ? { inFocus: focusSet.has(row.spaceId) }
        : {}),
    };
    // Fuera de alcance: sólo silueta. Ni código, nombre, forma, función ni estado.
    if (!inScope) return base;
    const card = full ? this.toCard(row, full.extras) : undefined;
    return {
      ...base,
      code: row.code,
      name: row.name,
      parentId: row.parentId,
      form: { code: FORMS.byConceptId(row.formConceptId)?.code ?? '' },
      function: {
        code: FUNCTIONS.byConceptId(row.functionConceptId)?.code ?? '',
      },
      ...(row.statusConceptId === PRAC.SPACE_RETIRED ? { retired: true } : {}),
      ...(card ? { card } : {}),
    };
  }

  private toCard(
    row: LayoutSpaceRow,
    extras: Awaited<ReturnType<FloorPlanLayoutRepository['cardExtras']>>,
  ): PlacementCard {
    const form = FORMS.byConceptId(row.formConceptId);
    const fn = FUNCTIONS.byConceptId(row.functionConceptId);
    const lifecycle = SPACE_LIFECYCLE.byConceptId(row.statusConceptId);
    const counts = extras.beds.get(row.spaceId);
    const technical: NonNullable<PlacementCard['technical']> = {};
    const asepsis = ATTRIBUTES.asepsis.byConceptId(row.asepsisConceptId);
    const pressure = ATTRIBUTES.pressure.byConceptId(row.pressureConceptId);
    const sex = ATTRIBUTES.sex.byConceptId(row.sexRestrictionConceptId);
    const age = ATTRIBUTES.ageGroup.byConceptId(row.ageGroupConceptId);
    const bedCategory = ATTRIBUTES.bedCategory.byConceptId(
      row.bedCategoryConceptId,
    );
    if (asepsis) technical.asepsis = asepsis.code;
    if (pressure) technical.pressure = pressure.code;
    if (row.airChangesPerHour !== null)
      technical.airChangesPerHour = row.airChangesPerHour;
    if (row.hvacValidatedOn) technical.hvacValidatedOn = row.hvacValidatedOn;
    if (sex) technical.sexRestriction = sex.code;
    if (age) technical.ageGroup = age.code;
    if (bedCategory) technical.bedCategory = bedCategory.code;
    return {
      formDisplay: form?.display ?? '',
      functionDisplay: fn?.display ?? '',
      lifecycle: {
        code: lifecycle?.code ?? '',
        display: lifecycle?.display ?? '',
      },
      ownerUnit: extras.owners.get(row.spaceId) ?? null,
      capacity: row.capacity,
      bedCount: counts?.beds ?? 0,
      censableBeds: counts?.censable ?? 0,
      areaDeclaredM2: row.areaDeclaredM2,
      ...(Object.keys(technical).length > 0 ? { technical } : {}),
      path: (extras.paths.get(row.spaceId) ?? []).map((item) => ({
        id: item.id,
        code: item.code,
        name: item.name,
        form: FORMS.byConceptId(item.form)?.code ?? '',
      })),
    };
  }

  private toElements(
    rows: readonly LayoutElementRow[],
    identity: 'ALL' | ReadonlySet<string>,
  ): PlanElementDTO[] {
    // Una puerta que une dos locales no revela cuáles si el actor no los ve.
    const seen = (id: string | null): string | null =>
      id && (identity === 'ALL' || identity.has(id)) ? id : null;
    const walls = new Map(
      rows.filter((r) => r.kind === 'WALL').map((r) => [r.id, r]),
    );
    return rows.map((row): PlanElementDTO => {
      const host = row.hostElementId ? walls.get(row.hostElementId) : undefined;
      const position =
        host?.vertices && row.offsetM !== null && row.widthM !== null
          ? openingPosition(host.vertices, row.offsetM, row.widthM)
          : null;
      return {
        id: row.id,
        kind: row.kind,
        rowVersion: row.rowVersion,
        zOrder: row.zOrder,
        ...(row.vertices ? { vertices: row.vertices } : {}),
        ...(row.thicknessM !== null ? { thicknessM: row.thicknessM } : {}),
        ...(row.hostElementId ? { hostElementId: row.hostElementId } : {}),
        ...(row.offsetM !== null ? { offsetM: row.offsetM } : {}),
        ...(row.widthM !== null ? { widthM: row.widthM } : {}),
        ...(row.swing ? { swing: row.swing } : {}),
        ...(row.swingSide ? { swingSide: row.swingSide } : {}),
        ...(row.label ? { label: row.label } : {}),
        ...(row.verticalLinkCode
          ? { verticalLinkCode: row.verticalLinkCode }
          : {}),
        ...(seen(row.connectsSpaceAId)
          ? { connectsSpaceAId: row.connectsSpaceAId as string }
          : {}),
        ...(seen(row.connectsSpaceBId)
          ? { connectsSpaceBId: row.connectsSpaceBId as string }
          : {}),
        ...(row.bbox ? { bbox: row.bbox } : {}),
        ...(position ? { position } : {}),
      };
    });
  }

  private async backgroundUrl(
    tx: EntityManager,
    plan: PlanRow,
  ): Promise<ReturnType<PlanBackgroundUrlService['sign']> | null> {
    if (!plan.backgroundFileId) return null;
    const versionId = await this.plans.servableBackgroundVersion(
      tx,
      plan.backgroundFileId,
      plan.tenantId,
    );
    return versionId ? this.urls.sign(plan.id, versionId) : null;
  }
}
