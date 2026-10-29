import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  ConflictException,
  PreconditionFailedException,
  requireTenantId,
  type AuthenticatedUser,
} from '../../../common';
import { AUD } from '../../audit/audit.concepts';
import { CLIN } from '../../clinical/clinical.concepts';
import { FORMS, FUNCTIONS, SPACE_LIFECYCLE } from '../infrastructure-catalog';
import { PRAC } from '../practice.concepts';
import { CareSpacesRepository } from '../repositories';
import { RowVersionMismatchException } from '../http/row-version';
import { practiceOutOfScope } from '../services/practice-scope';
import { StructureContextService } from '../services/structure-context.service';
import {
  ANCHOR_FORMS,
  BACKGROUND_RULES,
  CANVAS_RANGES,
  DEFAULT_ROOM_TEMPLATES,
  ELEMENT_KINDS,
  PLAN_DEFAULTS,
  PLAN_EVENTS,
  PLAN_LIMITS,
  PLAN_SETTING_KEYS,
  STATE_LAYERS,
  type RoomTemplate,
} from './floor-plan.constants';
import type {
  CreateFloorPlanDto,
  FloorPlanLifecycleDto,
  UpdateFloorPlanDto,
} from './floor-plan.dto';
import { FloorPlanReason } from './floor-plan.error-reasons';
import { toFloorPlanMeta, toFloorPlanSummary } from './floor-plan.mapper';
import type {
  FloorPlanMeta,
  FloorPlanSummary,
  PlanLayoutError,
  PlanValidationIssue,
  UnplacedSpace,
  ViewerCaps,
} from './floor-plan.types';
import { FloorPlanContextService } from './floor-plan-context.service';
import { FloorPlanLayoutRepository } from './floor-plan-layout.repository';
import {
  FloorPlansRepository,
  pgUuidArray,
  type PlanRow,
} from './floor-plans.repository';
import { PlanBackgroundUrlService } from './plan-background-url.service';
import {
  planDbException,
  translatePlanDbError,
} from './plan-constraint-reasons';
import { PlanEventsService } from './plan-events.service';
import { PlanViewerService } from './plan-viewer.service';

/** Cuerpo de `GET /practice/floor-plan-catalog`. */
export interface FloorPlanCatalog {
  readonly elementKinds: readonly {
    code: string;
    geometry: string;
    hosted: boolean;
    label: string;
  }[];
  readonly shapeKinds: readonly string[];
  readonly limits: typeof PLAN_LIMITS;
  readonly defaults: typeof PLAN_DEFAULTS;
  readonly roomTemplates: readonly RoomTemplate[];
  readonly roomTemplatesSource: 'SETTING' | 'DEFAULT';
  readonly stateLayers: readonly string[];
  readonly anchorForms: readonly string[];
  readonly canvasRanges: typeof CANVAS_RANGES;
  readonly backgroundRules: {
    mimeTypes: readonly string[];
    svgExcluded: boolean;
    maxBytes: number;
    maxPx: number;
    signedUrlTtlSeconds: number;
  };
}

/** Resultado de `GET /care-spaces/:id/plan-location`. */
export interface PlanLocation {
  readonly placed: boolean;
  readonly floorPlanId?: string;
  readonly floorPlanName?: string;
  readonly bbox?: [number, number, number, number];
  readonly centerXM?: number;
  readonly centerYM?: number;
  readonly canvasLite?: {
    code: string;
    widthM: number;
    heightM: number;
    gridSizeM: number;
    elevationM: number | null;
    layoutVersion: number;
  };
}

/** Una coincidencia de `GET /sites/:siteId/plan-search`. */
export interface PlanSearchHit {
  readonly spaceId: string;
  readonly code: string;
  readonly name: string;
  readonly path: { id: string; code: string; name: string }[];
  readonly floorPlanId: string | null;
  readonly floorPlanName: string | null;
  readonly centerXM: number | null;
  readonly centerYM: number | null;
  readonly bbox: [number, number, number, number] | null;
  readonly placed: boolean;
}

/** Una entrada de `GET /sites/:siteId/plan-focus`. */
export interface PlanFocusEntry {
  readonly floorPlanId: string;
  readonly floorPlanName: string;
  readonly bbox: [number, number, number, number];
  readonly spaceIds: string[];
}

/** Respuesta con lienzo y capacidades del actor. */
export interface FloorPlanWithViewer extends FloorPlanMeta {
  readonly viewer: ViewerCaps;
}

const NORMALIZE = (expr: string): string =>
  `translate(lower(${expr}), 'áéíóúüñÁÉÍÓÚÜÑ', 'aeiouunaeiouun')`;

/** Escapa `%`, `_` y `\` para un `LIKE`. */
function likeEscape(text: string): string {
  return text.replace(/[\\%_]/g, (c) => `\\${c}`);
}

/**
 * Lienzos del plano de planta, su catálogo y sus consultas de apoyo
 * (CONTRATO-PLANO §3.1, §3.2 y §3.5): crear, leer, editar, clausurar, validar,
 * la paleta de espacios sin ubicar y la localización/búsqueda/foco por área o
 * zona. El dibujo en sí (layout) es de `FloorPlanLayoutService`.
 */
@Injectable()
export class FloorPlansService {
  /**
   * @param em - Contexto de persistencia.
   * @param context - Carga y autoriza.
   * @param structure - Sedes (para el catálogo y las búsquedas).
   * @param plans - Lienzos.
   * @param layout - Ubicaciones y elementos.
   * @param spaces - Espacios del árbol.
   * @param viewers - Alcance del actor.
   * @param urls - URL firmadas del fondo.
   * @param events - Outbox.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly context: FloorPlanContextService,
    private readonly structure: StructureContextService,
    private readonly plans: FloorPlansRepository,
    private readonly layout: FloorPlanLayoutRepository,
    private readonly spaces: CareSpacesRepository,
    private readonly viewers: PlanViewerService,
    private readonly urls: PlanBackgroundUrlService,
    private readonly events: PlanEventsService,
  ) {}

  // ------------------------------------------------------------------ catálogo

  /**
   * `GET /practice/floor-plan-catalog`.
   *
   * Los límites del fondo y las plantillas de habitación son **datos** de la
   * práctica (`practice_settings`); sin valor configurado se devuelven los de
   * arranque, que son de producto y no una norma.
   *
   * @param siteId - Sede opcional para leer los valores de su práctica.
   * @param actor - Quien consulta.
   * @returns El catálogo.
   */
  async catalog(
    siteId: string | undefined,
    actor: AuthenticatedUser,
  ): Promise<FloorPlanCatalog> {
    return this.em.transactional(async (tx) => {
      let templates: readonly RoomTemplate[] = DEFAULT_ROOM_TEMPLATES;
      let source: 'SETTING' | 'DEFAULT' = 'DEFAULT';
      let maxBytes: number = BACKGROUND_RULES.defaultMaxBytes;
      let maxPx: number = BACKGROUND_RULES.defaultMaxPx;
      if (siteId) {
        const { site } = await this.structure.site(tx, siteId, actor, 'read');
        const configured = await this.plans.setting(
          tx,
          site.practiceId,
          PLAN_SETTING_KEYS.roomTemplates,
        );
        if (Array.isArray(configured) && configured.length > 0) {
          templates = configured as RoomTemplate[];
          source = 'SETTING';
        }
        const bytes = await this.plans.setting(
          tx,
          site.practiceId,
          PLAN_SETTING_KEYS.backgroundMaxBytes,
        );
        const px = await this.plans.setting(
          tx,
          site.practiceId,
          PLAN_SETTING_KEYS.backgroundMaxPx,
        );
        if (typeof bytes === 'number' && bytes > 0) maxBytes = bytes;
        if (typeof px === 'number' && px > 0) maxPx = px;
      }
      return {
        elementKinds: ELEMENT_KINDS,
        shapeKinds: ['RECT', 'POLYGON'],
        limits: PLAN_LIMITS,
        defaults: PLAN_DEFAULTS,
        roomTemplates: templates,
        roomTemplatesSource: source,
        stateLayers: STATE_LAYERS,
        anchorForms: ANCHOR_FORMS,
        canvasRanges: CANVAS_RANGES,
        backgroundRules: {
          mimeTypes: BACKGROUND_RULES.mimeTypes,
          svgExcluded: BACKGROUND_RULES.svgExcluded,
          maxBytes,
          maxPx,
          signedUrlTtlSeconds: BACKGROUND_RULES.signedUrlTtlSeconds,
        },
      };
    });
  }

  // ------------------------------------------------------------------- lienzos

  /**
   * `GET /sites/:siteId/floor-plans`.
   *
   * @param siteId - Sede.
   * @param includeRetired - Incluye los clausurados.
   * @param actor - Quien lee.
   * @returns Un resumen por lienzo, con recuentos.
   */
  async listBySite(
    siteId: string,
    includeRetired: boolean,
    actor: AuthenticatedUser,
  ): Promise<FloorPlanSummary[]> {
    return this.em.transactional(async (tx) => {
      const { tenantId, site } = await this.context.site(tx, siteId, actor);
      const rows = await this.plans.listPlans(
        tx,
        site.id,
        tenantId,
        includeRetired,
      );
      return rows.map(toFloorPlanSummary);
    });
  }

  /**
   * `POST /sites/:siteId/floor-plans`.
   *
   * @param siteId - Sede.
   * @param dto - Datos del lienzo.
   * @param actor - Quien lo crea.
   * @param supportReason - Motivo del soporte de plataforma.
   * @param correlationId - Id de correlación.
   * @returns El lienzo creado.
   */
  async create(
    siteId: string,
    dto: CreateFloorPlanDto,
    actor: AuthenticatedUser,
    supportReason: string | undefined,
    correlationId?: string,
  ): Promise<FloorPlanWithViewer> {
    return this.em.transactional(async (tx) => {
      const { tenantId, site, viewer } = await this.context.site(
        tx,
        siteId,
        actor,
      );
      this.viewers.assertCanEdit(viewer, supportReason);
      this.structure.assertSiteActive(site);

      const values = {
        code: dto.code.trim(),
        name: dto.name.trim(),
        widthM: dto.widthM,
        heightM: dto.heightM,
        elevationM: dto.elevationM ?? null,
        northBearingDeg: dto.northBearingDeg ?? PLAN_DEFAULTS.northBearingDeg,
        gridSizeM: dto.gridSizeM ?? PLAN_DEFAULTS.gridSizeM,
        snapToGrid: dto.snapToGrid ?? PLAN_DEFAULTS.snapToGrid,
        contactToleranceM:
          dto.contactToleranceM ?? PLAN_DEFAULTS.contactToleranceM,
      };
      this.assertCanvasValid(values, '');

      let anchorSpaceId: string | null = null;
      if (dto.anchorSpaceId) {
        const anchor = await this.spaces.findByIdInTenant(
          tx,
          dto.anchorSpaceId,
          tenantId,
        );
        if (!anchor || anchor.practiceSiteId !== site.id) {
          throw practiceOutOfScope('Espacio ancla no encontrado');
        }
        const form = FORMS.byConceptId(anchor.formConceptId)?.code ?? '';
        if (!ANCHOR_FORMS.includes(form)) {
          throw new PreconditionFailedException(
            `Un lienzo se ancla a un edificio, ala, piso, área o sala; ${form || 'esa forma'} no sirve`,
            { anchorForms: ANCHOR_FORMS, form },
            FloorPlanReason.PLAN_ANCHOR_FORM_INVALID,
          );
        }
        if (anchor.statusConceptId === PRAC.SPACE_RETIRED) {
          throw new PreconditionFailedException(
            'El espacio ancla está clausurado',
            undefined,
            FloorPlanReason.PLAN_ANCHOR_NOT_ACTIVE,
          );
        }
        anchorSpaceId = anchor.id;
      }

      const id = randomUUID();
      try {
        await this.plans.insertPlan(tx, {
          id,
          tenantId,
          siteId: site.id,
          anchorSpaceId,
          ...values,
          actorUserId: actor.id,
        });
        await this.layout.appendHistory(
          tx,
          'floor_plans',
          [id],
          AUD.OPERATION_INSERT,
          actor.id,
          tenantId,
        );
      } catch (error) {
        throw this.translate(error, id, correlationId);
      }
      const created = (await this.plans.findPlan(tx, id, tenantId)) as PlanRow;
      await this.events.publish(tx, {
        type: PLAN_EVENTS.created,
        floorPlanId: id,
        tenantId,
        actorUserId: actor.id,
        correlationId,
        payload: {
          siteId: site.id,
          anchorSpaceId,
          layoutVersion: created.layoutVersion,
          ...(supportReason ? { supportReason } : {}),
        },
      });
      return { ...toFloorPlanMeta(created, null), viewer: viewer.caps };
    });
  }

  /**
   * `GET /floor-plans/:id`.
   *
   * @param planId - Lienzo.
   * @param actor - Quien lee.
   * @returns Metadatos y capacidades del actor.
   */
  async get(
    planId: string,
    actor: AuthenticatedUser,
  ): Promise<FloorPlanWithViewer> {
    return this.em.transactional(async (tx) => {
      const { plan, viewer } = await this.context.plan(tx, planId, actor);
      return {
        ...toFloorPlanMeta(plan, await this.backgroundUrl(tx, plan)),
        viewer: viewer.caps,
      };
    });
  }

  /**
   * `PATCH /floor-plans/:id` (`If-Match: rowVersion`).
   *
   * @param planId - Lienzo.
   * @param dto - Cambios.
   * @param expectedRowVersion - `rowVersion` esperada.
   * @param actor - Quien edita.
   * @param supportReason - Motivo del soporte de plataforma.
   * @param correlationId - Id de correlación.
   * @returns El lienzo actualizado.
   */
  async patch(
    planId: string,
    dto: UpdateFloorPlanDto,
    expectedRowVersion: number,
    actor: AuthenticatedUser,
    supportReason: string | undefined,
    correlationId?: string,
  ): Promise<FloorPlanWithViewer> {
    return this.em.transactional(async (tx) => {
      const { tenantId, plan, viewer } = await this.context.plan(
        tx,
        planId,
        actor,
        true,
      );
      this.viewers.assertCanEdit(viewer, supportReason);
      if (plan.rowVersion !== expectedRowVersion) {
        throw new RowVersionMismatchException(plan.rowVersion);
      }
      this.assertNotRetired(plan);
      const merged = {
        name: dto.name?.trim() ?? plan.name,
        widthM: dto.widthM ?? plan.widthM,
        heightM: dto.heightM ?? plan.heightM,
        elevationM:
          dto.elevationM === undefined ? plan.elevationM : dto.elevationM,
        northBearingDeg: dto.northBearingDeg ?? plan.northBearingDeg,
        gridSizeM: dto.gridSizeM ?? plan.gridSizeM,
        snapToGrid: dto.snapToGrid ?? plan.snapToGrid,
        contactToleranceM: dto.contactToleranceM ?? plan.contactToleranceM,
      };
      this.assertCanvasValid({ ...merged, code: plan.code }, plan.id);
      try {
        const ok = await this.plans.patchPlan(
          tx,
          plan.id,
          tenantId,
          expectedRowVersion,
          {
            name: dto.name !== undefined ? merged.name : undefined,
            widthM: dto.widthM,
            heightM: dto.heightM,
            elevationM: dto.elevationM,
            northBearingDeg: dto.northBearingDeg,
            gridSizeM: dto.gridSizeM,
            snapToGrid: dto.snapToGrid,
            contactToleranceM: dto.contactToleranceM,
          },
          actor.id,
        );
        if (!ok) throw new RowVersionMismatchException();
        await tx.execute('set constraints all immediate');
        await this.layout.appendHistory(
          tx,
          'floor_plans',
          [plan.id],
          AUD.OPERATION_UPDATE,
          actor.id,
          tenantId,
        );
      } catch (error) {
        throw this.translate(error, plan.id, correlationId);
      }
      const updated = (await this.plans.findPlan(
        tx,
        plan.id,
        tenantId,
      )) as PlanRow;
      await this.events.publish(tx, {
        type: PLAN_EVENTS.updated,
        floorPlanId: plan.id,
        tenantId,
        actorUserId: actor.id,
        correlationId,
        payload: {
          siteId: plan.siteId,
          anchorSpaceId: plan.anchorSpaceId,
          layoutVersion: updated.layoutVersion,
          rowVersion: updated.rowVersion,
          changedFields: Object.keys(dto).filter(
            (key) => (dto as Record<string, unknown>)[key] !== undefined,
          ),
          ...(supportReason ? { supportReason } : {}),
        },
      });
      return {
        ...toFloorPlanMeta(updated, await this.backgroundUrl(tx, updated)),
        viewer: viewer.caps,
      };
    });
  }

  /**
   * `POST /floor-plans/:id/lifecycle`: clausura o reabre (`If-Match: rowVersion`).
   * Clausurar con camas ocupadas dibujadas se rechaza (INV-PL-12).
   *
   * @param planId - Lienzo.
   * @param dto - Acción y motivo.
   * @param expectedRowVersion - `rowVersion` esperada.
   * @param actor - Quien lo cambia.
   * @param supportReason - Motivo del soporte de plataforma.
   * @param correlationId - Id de correlación.
   * @returns El lienzo actualizado.
   */
  async lifecycle(
    planId: string,
    dto: FloorPlanLifecycleDto,
    expectedRowVersion: number,
    actor: AuthenticatedUser,
    supportReason: string | undefined,
    correlationId?: string,
  ): Promise<FloorPlanWithViewer> {
    return this.em.transactional(async (tx) => {
      const { tenantId, plan, viewer } = await this.context.plan(
        tx,
        planId,
        actor,
        true,
      );
      this.viewers.assertCanEdit(viewer, supportReason);
      if (plan.rowVersion !== expectedRowVersion) {
        throw new RowVersionMismatchException(plan.rowVersion);
      }
      const retire = dto.action === 'retire';
      if (retire === plan.retired) {
        throw new ConflictException(
          retire ? 'El lienzo ya está clausurado' : 'El lienzo ya está vigente',
          { action: dto.action },
          FloorPlanReason.PLAN_LIFECYCLE_INVALID,
        );
      }
      if (retire) {
        const occupied = await this.layout.occupiedPlacedBeds(
          tx,
          plan.id,
          tenantId,
          CLIN.LOCATION_ACTIVE,
          FORMS.byInput('LOC_FORM_BED')!.id,
        );
        if (occupied.length > 0) {
          throw new ConflictException(
            'No se puede clausurar el lienzo: hay camas ocupadas dibujadas en él',
            {
              occupiedBeds: occupied.length,
              sampleSpaceIds: occupied.slice(0, 5),
              nextAction:
                'Trasladar o dar egreso a los pacientes antes de clausurar',
            },
            FloorPlanReason.PLAN_SPACE_OCCUPIED,
          );
        }
      }
      try {
        const ok = await this.plans.setValidity(
          tx,
          plan.id,
          tenantId,
          expectedRowVersion,
          retire,
          actor.id,
        );
        if (!ok) throw new RowVersionMismatchException();
        await this.layout.appendHistory(
          tx,
          'floor_plans',
          [plan.id],
          AUD.OPERATION_UPDATE,
          actor.id,
          tenantId,
        );
      } catch (error) {
        throw this.translate(error, plan.id, correlationId);
      }
      const updated = (await this.plans.findPlan(
        tx,
        plan.id,
        tenantId,
      )) as PlanRow;
      await this.events.publish(tx, {
        type: PLAN_EVENTS.lifecycleChanged,
        floorPlanId: plan.id,
        tenantId,
        actorUserId: actor.id,
        correlationId,
        payload: {
          siteId: plan.siteId,
          anchorSpaceId: plan.anchorSpaceId,
          layoutVersion: updated.layoutVersion,
          action: dto.action,
          reason: dto.reason.trim(),
          ...(supportReason ? { supportReason } : {}),
        },
      });
      return {
        ...toFloorPlanMeta(updated, await this.backgroundUrl(tx, updated)),
        viewer: viewer.caps,
      };
    });
  }

  // ---------------------------------------------------------------- validación

  /**
   * `GET /floor-plans/:id/validation`: auditoría completa del lienzo.
   *
   * @param planId - Lienzo.
   * @param actor - Quien lee.
   * @returns Los problemas, con ids de espacio y detalle.
   */
  async validation(
    planId: string,
    actor: AuthenticatedUser,
  ): Promise<{ issues: PlanValidationIssue[] }> {
    return this.em.transactional(async (tx) => {
      const { tenantId, plan, viewer } = await this.context.plan(
        tx,
        planId,
        actor,
      );
      const issues = await this.layout.validate(tx, plan.id);
      // El detalle de un problema (m² declarados, vecinos) es identidad del
      // espacio: sólo se informa lo que el actor ve en el layout.
      const visible = await this.viewers.resolveIds(
        tx,
        tenantId,
        viewer.identity,
      );
      if (visible === 'ALL') return { issues };
      return {
        issues: issues.filter(
          (issue) =>
            visible.has(issue.subjectId) &&
            (!issue.otherId || visible.has(issue.otherId)),
        ),
      };
    });
  }

  /**
   * `GET /floor-plans/:id/unplaced-spaces`: la paleta del editor.
   *
   * @param planId - Lienzo.
   * @param cursor - Cursor keyset (`depth|code`).
   * @param limit - Tamaño de página.
   * @param actor - Quien lee.
   * @returns Espacios del alcance del lienzo que no tienen lugar en ningún plano.
   */
  async unplacedSpaces(
    planId: string,
    cursor: string | undefined,
    limit: number,
    actor: AuthenticatedUser,
  ): Promise<{ items: UnplacedSpace[]; nextCursor: string | null }> {
    return this.em.transactional(async (tx) => {
      const { tenantId, plan, viewer } = await this.context.plan(
        tx,
        planId,
        actor,
      );
      // La paleta sólo la usa el editor, y nunca lista lo que el actor no ve.
      this.viewers.assertCanEdit(viewer);
      const visible = await this.viewers.resolveIds(
        tx,
        tenantId,
        viewer.identity,
      );
      let after: { depth: number; code: string } | undefined;
      if (cursor) {
        try {
          after = JSON.parse(
            Buffer.from(cursor, 'base64url').toString('utf8'),
          ) as { depth: number; code: string };
        } catch {
          throw new PreconditionFailedException(
            'El cursor no es válido',
            undefined,
            FloorPlanReason.PLAN_FOCUS_PARAM_INVALID,
          );
        }
      }
      const rows = await tx.execute<
        {
          care_space_id: string;
          code: string;
          name: string;
          parent_space_id: string | null;
          form_concept_id: string;
          function_concept_id: string;
          status_concept_id: string;
          depth: number;
          parent_placed: boolean;
        }[]
      >(
        `select u.care_space_id, u.code, u.name, u.parent_space_id, u.form_concept_id, u.function_concept_id,
                u.status_concept_id, u.depth,
                (u.parent_space_id is null
                  or u.parent_space_id = ?::uuid
                  or exists (select 1 from practice.space_placements p
                              where p.care_space_id = u.parent_space_id and p.floor_plan_id = ?::uuid)) as parent_placed
           from practice.plan_unplaced_spaces(?::uuid) u
          where ${after ? '(u.depth, u.code) > (?, ?)' : 'true'}
            ${visible === 'ALL' ? '' : 'and u.care_space_id = any(?::uuid[])'}
          order by u.depth, u.code
          limit ?`,
        [
          plan.anchorSpaceId ?? '00000000-0000-0000-0000-000000000000',
          plan.id,
          plan.id,
          ...(after ? [after.depth, after.code] : []),
          ...(visible === 'ALL' ? [] : [pgUuidArray([...visible])]),
          limit + 1,
        ],
      );
      const page = rows.slice(0, limit);
      const last = page[page.length - 1];
      const items = page.map((row): UnplacedSpace => {
        const retired = row.status_concept_id === PRAC.SPACE_RETIRED;
        const rootInAnchored =
          row.parent_space_id === null && plan.anchorSpaceId !== null;
        const placeable = !retired && row.parent_placed && !rootInAnchored;
        return {
          spaceId: row.care_space_id,
          code: row.code,
          name: row.name,
          parentId: row.parent_space_id,
          depth: row.depth,
          form: this.concept(FORMS.byConceptId(row.form_concept_id)),
          function: this.concept(
            FUNCTIONS.byConceptId(row.function_concept_id),
          ),
          lifecycle: this.concept(
            SPACE_LIFECYCLE.byConceptId(row.status_concept_id),
          ),
          placeable,
          ...(placeable
            ? {}
            : {
                reason: retired
                  ? FloorPlanReason.PLAN_SPACE_NOT_PLACEABLE
                  : FloorPlanReason.PLAN_PARENT_NOT_PLACED,
              }),
        };
      });
      return {
        items,
        nextCursor:
          rows.length > limit && last
            ? Buffer.from(
                JSON.stringify({ depth: last.depth, code: last.code }),
              ).toString('base64url')
            : null,
      };
    });
  }

  // --------------------------------------------------------------- localización

  /**
   * `GET /care-spaces/:id/plan-location`: abre el plano desde el árbol, el tablero o el ADT.
   *
   * @param spaceId - Espacio.
   * @param actor - Quien consulta.
   * @returns Dónde está dibujado, o `{placed:false}`.
   */
  async location(
    spaceId: string,
    actor: AuthenticatedUser,
  ): Promise<PlanLocation> {
    return this.em.transactional(async (tx) => {
      const tenantId = requireTenantId();
      const space = await this.spaces.findByIdInTenant(tx, spaceId, tenantId);
      if (!space) throw practiceOutOfScope('Espacio no encontrado');
      const { viewer } = await this.context.site(
        tx,
        space.practiceSiteId,
        actor,
      );
      await this.assertInIdentityScope(tx, tenantId, viewer, spaceId);
      const rows = await tx.execute<
        {
          floor_plan_id: string;
          name: string;
          code: string;
          width_m: number;
          height_m: number;
          grid_size_m: number;
          elevation_m: number | null;
          layout_version: number;
          min_x: number;
          min_y: number;
          max_x: number;
          max_y: number;
        }[]
      >(
        `select sp.floor_plan_id, fp.name, fp.code, fp.width_m::float8 as width_m, fp.height_m::float8 as height_m,
                fp.grid_size_m::float8 as grid_size_m, fp.elevation_m::float8 as elevation_m, fp.layout_version,
                (sp.bbox[1])[0]::float8 as min_x, (sp.bbox[1])[1]::float8 as min_y,
                (sp.bbox[0])[0]::float8 as max_x, (sp.bbox[0])[1]::float8 as max_y
           from practice.space_placements sp join practice.floor_plans fp on fp.id = sp.floor_plan_id
          where sp.care_space_id = ?::uuid and sp.tenant_id = ?::uuid`,
        [spaceId, tenantId],
      );
      const row = rows[0];
      if (!row) return { placed: false };
      return {
        placed: true,
        floorPlanId: row.floor_plan_id,
        floorPlanName: row.name,
        bbox: [row.min_x, row.min_y, row.max_x, row.max_y],
        centerXM: Math.round(((row.min_x + row.max_x) / 2) * 1000) / 1000,
        centerYM: Math.round(((row.min_y + row.max_y) / 2) * 1000) / 1000,
        canvasLite: {
          code: row.code,
          widthM: row.width_m,
          heightM: row.height_m,
          gridSizeM: row.grid_size_m,
          elevationM: row.elevation_m,
          layoutVersion: row.layout_version,
        },
      };
    });
  }

  /**
   * `GET /sites/:siteId/plan-search`: búsqueda por código o nombre, sin acentos,
   * sólo de espacios dentro del alcance del actor.
   *
   * @param siteId - Sede.
   * @param q - Texto.
   * @param limit - Máximo de resultados.
   * @param actor - Quien busca.
   * @returns Coincidencias, dibujadas o no.
   */
  async search(
    siteId: string,
    q: string,
    limit: number,
    actor: AuthenticatedUser,
  ): Promise<PlanSearchHit[]> {
    return this.em.transactional(async (tx) => {
      const { tenantId, site, viewer } = await this.context.site(
        tx,
        siteId,
        actor,
      );
      const term = q.trim();
      if (!term) return [];
      const ids = await this.viewers.resolveIds(tx, tenantId, viewer.identity);
      const params: unknown[] = [
        PRAC.SPACE_RETIRED,
        site.id,
        tenantId,
        `%${likeEscape(term.toLowerCase())}%`,
        `%${likeEscape(term.toLowerCase())}%`,
      ];
      let scopeSql = '';
      if (ids !== 'ALL') {
        scopeSql = 'and cs.id = any(?::uuid[])';
        params.push(pgUuidArray([...ids]));
      }
      params.push(
        term.toLowerCase(),
        `${likeEscape(term.toLowerCase())}%`,
        limit,
      );
      const rows = await tx.execute<
        {
          id: string;
          code: string;
          name: string;
          floor_plan_id: string | null;
          plan_name: string | null;
          min_x: number | null;
          min_y: number | null;
          max_x: number | null;
          max_y: number | null;
        }[]
      >(
        `select cs.id, cs.code, cs.name, sp.floor_plan_id, fp.name as plan_name,
                (sp.bbox[1])[0]::float8 as min_x, (sp.bbox[1])[1]::float8 as min_y,
                (sp.bbox[0])[0]::float8 as max_x, (sp.bbox[0])[1]::float8 as max_y
           from practice.care_spaces cs
           left join practice.space_placements sp on sp.care_space_id = cs.id
           left join practice.floor_plans fp on fp.id = sp.floor_plan_id
          where cs.status_concept_id <> ?::uuid and cs.practice_site_id = ?::uuid and cs.tenant_id = ?::uuid
            and (${NORMALIZE('cs.code')} like ${NORMALIZE('?')} escape '\\'
              or ${NORMALIZE('cs.name')} like ${NORMALIZE('?')} escape '\\') ${scopeSql}
          order by (${NORMALIZE('cs.code')} = ${NORMALIZE('?')}) desc,
                   (${NORMALIZE('cs.code')} like ${NORMALIZE('?')} escape '\\') desc, cs.code
          limit ?`,
        params,
      );
      if (rows.length === 0) return [];
      const extras = await this.layout.cardExtras(
        tx,
        tenantId,
        rows.map((r) => r.id),
        PRAC.SPACE_ACTIVE,
        FORMS.byInput('LOC_FORM_BED')!.id,
        PRAC.SPACE_UNIT_ROLE_OWNER,
      );
      return rows.map((row): PlanSearchHit => {
        const placed = row.floor_plan_id !== null && row.min_x !== null;
        return {
          spaceId: row.id,
          code: row.code,
          name: row.name,
          path: (extras.paths.get(row.id) ?? []).map(({ id, code, name }) => ({
            id,
            code,
            name,
          })),
          floorPlanId: row.floor_plan_id,
          floorPlanName: row.plan_name,
          centerXM: placed
            ? Math.round(
                (((row.min_x as number) + (row.max_x as number)) / 2) * 1000,
              ) / 1000
            : null,
          centerYM: placed
            ? Math.round(
                (((row.min_y as number) + (row.max_y as number)) / 2) * 1000,
              ) / 1000
            : null,
          bbox: placed
            ? [
                row.min_x as number,
                row.min_y as number,
                row.max_x as number,
                row.max_y as number,
              ]
            : null,
          placed,
        };
      });
    });
  }

  /**
   * `GET /sites/:siteId/plan-focus`: una entrada por lienzo donde está dibujado
   * un área/sala/ala (`spaceId`) o una unidad (`unitId`). Una unidad que cruza
   * pisos devuelve varias entradas.
   *
   * @param siteId - Sede.
   * @param spaceId - Espacio raíz del foco.
   * @param unitId - Unidad clínica.
   * @param actor - Quien consulta.
   * @returns Lienzos con el recuadro y los espacios del foco.
   */
  async focus(
    siteId: string,
    spaceId: string | undefined,
    unitId: string | undefined,
    actor: AuthenticatedUser,
  ): Promise<PlanFocusEntry[]> {
    if ((spaceId === undefined) === (unitId === undefined)) {
      throw new PreconditionFailedException(
        'Indicá `spaceId` o `unitId` (uno solo)',
        undefined,
        FloorPlanReason.PLAN_FOCUS_PARAM_INVALID,
      );
    }
    return this.em.transactional(async (tx) => {
      const { tenantId, site, viewer } = await this.context.site(
        tx,
        siteId,
        actor,
      );
      let focusIds: string[];
      if (spaceId) {
        const space = await this.spaces.findByIdInTenant(tx, spaceId, tenantId);
        if (!space || space.practiceSiteId !== site.id) {
          throw practiceOutOfScope('Espacio no encontrado');
        }
        focusIds = await this.layout.subtreeIds(tx, tenantId, spaceId);
      } else {
        const unit = await tx.execute<{ id: string }[]>(
          `select id from practice.clinical_units where id = ?::uuid and tenant_id = ?::uuid and practice_site_id = ?::uuid`,
          [unitId, tenantId, site.id],
        );
        if (unit.length === 0) throw practiceOutOfScope('Unidad no encontrada');
        focusIds = await this.layout.unitSpaceIds(tx, tenantId, [
          unitId as string,
        ]);
      }
      const allowed = await this.viewers.resolveIds(
        tx,
        tenantId,
        viewer.identity,
      );
      if (allowed !== 'ALL')
        focusIds = focusIds.filter((id) => allowed.has(id));
      if (focusIds.length === 0) return [];
      const rows = await tx.execute<
        {
          floor_plan_id: string;
          name: string;
          ids: string[];
          min_x: number;
          min_y: number;
          max_x: number;
          max_y: number;
        }[]
      >(
        `select fp.id as floor_plan_id, fp.name, array_agg(sp.care_space_id order by sp.care_space_id) as ids,
                min((sp.bbox[1])[0])::float8 as min_x, min((sp.bbox[1])[1])::float8 as min_y,
                max((sp.bbox[0])[0])::float8 as max_x, max((sp.bbox[0])[1])::float8 as max_y
           from practice.space_placements sp join practice.floor_plans fp on fp.id = sp.floor_plan_id
          where sp.care_space_id = any(?::uuid[]) and fp.practice_site_id = ?::uuid and fp.tenant_id = ?::uuid
            and (fp.valid_to is null or fp.valid_to > now())
          group by fp.id, fp.name, fp.elevation_m
          order by fp.elevation_m nulls last, fp.name`,
        [pgUuidArray(focusIds), site.id, tenantId],
      );
      return rows.map((row) => ({
        floorPlanId: row.floor_plan_id,
        floorPlanName: row.name,
        bbox: [row.min_x, row.min_y, row.max_x, row.max_y],
        spaceIds: row.ids,
      }));
    });
  }

  // ----------------------------------------------------------------- utilidades

  private concept(
    entry: { code: string; display: string } | undefined,
  ): { code: string; display: string } | null {
    return entry ? { code: entry.code, display: entry.display } : null;
  }

  /** URL firmada del fondo vigente del lienzo, o `null`. */
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

  private assertNotRetired(plan: PlanRow): void {
    if (plan.retired) {
      throw new ConflictException(
        'El lienzo está clausurado: reabrilo para editarlo',
        undefined,
        FloorPlanReason.PLAN_RETIRED,
      );
    }
  }

  /** Rechaza lo que los `CHECK` del lienzo rechazarían, con el campo señalado. */
  private assertCanvasValid(
    values: {
      code?: string;
      name: string;
      widthM: number;
      heightM: number;
      elevationM: number | null;
      northBearingDeg: number;
      gridSizeM: number;
      snapToGrid: boolean;
      contactToleranceM: number;
    },
    planId: string,
  ): void {
    const problems: { field: string; message: string }[] = [];
    const inRange = (
      name: string,
      value: number,
      range: { min: number; max: number },
      unit = 'm',
    ): void => {
      if (!Number.isFinite(value) || value < range.min || value > range.max) {
        problems.push({
          field: name,
          message: `${name} va de ${range.min} a ${range.max} ${unit}`,
        });
      }
    };
    if (values.code !== undefined && values.code === '')
      problems.push({
        field: 'code',
        message: 'El código no puede estar vacío',
      });
    if (values.name === '')
      problems.push({
        field: 'name',
        message: 'El nombre no puede estar vacío',
      });
    inRange('widthM', values.widthM, CANVAS_RANGES.sizeM);
    inRange('heightM', values.heightM, CANVAS_RANGES.sizeM);
    inRange('gridSizeM', values.gridSizeM, CANVAS_RANGES.gridSizeM);
    inRange(
      'contactToleranceM',
      values.contactToleranceM,
      CANVAS_RANGES.contactToleranceM,
    );
    if (values.elevationM !== null)
      inRange('elevationM', values.elevationM, CANVAS_RANGES.elevationM);
    if (
      !Number.isFinite(values.northBearingDeg) ||
      values.northBearingDeg < 0 ||
      values.northBearingDeg >= 360
    ) {
      problems.push({
        field: 'northBearingDeg',
        message: 'northBearingDeg va de 0 (incluido) a 360 (excluido) grados',
      });
    }
    if (problems.length === 0) return;
    const errors: PlanLayoutError[] = problems.map((p) => ({
      kind: 'CANVAS',
      id: planId,
      code: FloorPlanReason.PLAN_CANVAS_INVALID,
      field: 'size',
      message: `${p.message}`,
    }));
    throw new PreconditionFailedException(
      'El lienzo no es válido',
      {
        errors: errors.map((e, i) => ({ ...e, property: problems[i].field })),
      },
      FloorPlanReason.PLAN_CANVAS_INVALID,
    );
  }

  /** Traduce un error de la base al vocabulario del plano; lo que no conoce, lo relanza. */
  private translate(
    error: unknown,
    subjectId: string,
    correlationId?: string,
  ): unknown {
    if (
      error instanceof PreconditionFailedException ||
      error instanceof ConflictException
    )
      return error;
    const translation = translatePlanDbError(error);
    return translation
      ? planDbException(translation, subjectId, correlationId)
      : error;
  }

  /** 404 si el espacio está fuera de la identidad que el actor puede ver. */
  private async assertInIdentityScope(
    tx: EntityManager,
    tenantId: string,
    viewer: Awaited<ReturnType<PlanViewerService['resolve']>>,
    spaceId: string,
  ): Promise<void> {
    const ids = await this.viewers.resolveIds(tx, tenantId, viewer.identity);
    if (ids !== 'ALL' && !ids.has(spaceId)) {
      throw practiceOutOfScope('Espacio no encontrado');
    }
  }
}
