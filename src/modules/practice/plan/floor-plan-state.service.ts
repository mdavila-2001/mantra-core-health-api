import { createHash } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  PreconditionFailedException,
  requireTenantId,
  type AuthenticatedUser,
} from '../../../common';
import { AUD } from '../../audit/audit.concepts';
import { DataAccessLogRepository } from '../../audit/repositories';
import { FORMS } from '../infrastructure-catalog';
import { PRAC } from '../practice.concepts';
import { CareSpacesRepository } from '../repositories';
import { practiceOutOfScope } from '../services/practice-scope';
import type { Bbox } from '../domain/plan-geometry';
import type { StateQueryDto } from './floor-plan.dto';
import {
  OCCUPANT_VIEWED,
  OCCUPANT_VIEWED_DEDUPE_SECONDS,
  STATE_AXES,
} from './floor-plan.constants';
import { FloorPlanReason } from './floor-plan.error-reasons';
import type {
  PlanCardResponse,
  PlanRollup,
  PlanStateResponse,
  SpaceState,
} from './floor-plan.types';
import { FloorPlanContextService } from './floor-plan-context.service';
import { FloorPlanLayoutRepository } from './floor-plan-layout.repository';
import { etagMatches } from './layout-if-match';
import {
  PLAN_OPERATIONAL_STATE,
  type PatientVisibility,
  type PlanOperationalStatePort,
} from './plan-operational-state.port';
import { PlanViewerService, type PlanViewer } from './plan-viewer.service';

/** Resultado de leer el estado: 304 sin cuerpo, o 200 con cuerpo. */
export type StateReadResult =
  | { readonly status: 304; readonly etag: string }
  | { readonly status: 200; readonly etag: string; readonly body: PlanStateResponse };

const emptyRollup = (): PlanRollup => ({
  beds: 0,
  censable: 0,
  occupied: 0,
  reserved: 0,
  assignable: 0,
  blocked: 0,
  maintenance: 0,
  dirty: 0,
  cleaning: 0,
  isolation: 0,
  contaminated: 0,
});

/** Suma el estado de una cama a un recuento. */
function addBed(rollup: PlanRollup, state: SpaceState, censable: boolean): void {
  rollup.beds += 1;
  if (censable) rollup.censable += 1;
  if (state.assignable) rollup.assignable += 1;
  const occupancy = state.occupancy?.code;
  if (occupancy === 'OCC_OCCUPIED') rollup.occupied += 1;
  if (occupancy === 'OCC_RESERVED') rollup.reserved += 1;
  const availability = state.availability?.code ?? '';
  if (availability === 'SPACE_OP_MAINTENANCE') rollup.maintenance += 1;
  else if (availability !== '' && availability !== 'SPACE_OP_AVAILABLE')
    rollup.blocked += 1;
  const hygiene = state.hygiene?.code;
  if (hygiene === 'HYG_DIRTY') rollup.dirty += 1;
  if (hygiene === 'HYG_CLEANING') rollup.cleaning += 1;
  if (hygiene === 'HYG_CONTAMINATED') rollup.contaminated += 1;
  if (state.isolation && state.isolation.code !== 'ISO_NONE') rollup.isolation += 1;
}

/**
 * Estado operativo superpuesto al plano y tarjeta bajo demanda del paciente
 * (CONTRATO-PLANO §3.6 y §3.7).
 *
 * El estado **no lleva geometría**: el cliente lo une por `spaceId`. Lo que
 * hace es decidir **quién ve qué**: un espacio fuera del alcance del actor no
 * aparece, y la clave `patient` no existe en la respuesta de quien no puede
 * verla (ausente ≠ nulo): el puerto ni siquiera consulta a la persona fuera de
 * ese alcance. El nombre completo sólo sale de `plan-card`, que además deja
 * rastro de acceso.
 */
@Injectable()
export class FloorPlanStateService {
  /**
   * @param em - Contexto de persistencia.
   * @param context - Carga y autoriza.
   * @param layout - Ubicaciones.
   * @param viewers - Alcance del actor.
   * @param spaces - Espacios del árbol.
   * @param ops - Estado operativo (reemplazable por F2).
   * @param accessLog - Rastro de acceso a datos del paciente.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly context: FloorPlanContextService,
    private readonly layout: FloorPlanLayoutRepository,
    private readonly viewers: PlanViewerService,
    private readonly spaces: CareSpacesRepository,
    @Inject(PLAN_OPERATIONAL_STATE)
    private readonly ops: PlanOperationalStatePort,
    private readonly accessLog: DataAccessLogRepository,
  ) {}

  /**
   * `GET /floor-plans/:id/state`.
   *
   * @param planId - Lienzo.
   * @param query - Ventana, foco y ejes.
   * @param ifNoneMatch - Cabecera `If-None-Match` del cliente.
   * @param actor - Quien lee.
   * @returns 304 o el estado.
   */
  async state(
    planId: string,
    query: StateQueryDto,
    ifNoneMatch: string | undefined,
    actor: AuthenticatedUser,
  ): Promise<StateReadResult> {
    return this.em.transactional(async (tx) => {
      const { tenantId, plan, site, viewer } = await this.context.plan(
        tx,
        planId,
        actor,
      );
      if (query.focusSpaceId && query.unitId) {
        throw new PreconditionFailedException(
          'Indicá `focusSpaceId` o `unitId` (uno solo)',
          undefined,
          FloorPlanReason.PLAN_FOCUS_PARAM_INVALID,
        );
      }
      const bbox = windowOf(query.bbox);
      const axes = new Set(
        (query.axis ?? STATE_AXES.join(',')).split(',') as (typeof STATE_AXES)[number][],
      );
      const fingerprint = await this.ops.fingerprint(tx, tenantId, plan.id);
      const hash = createHash('sha1')
        .update(
          JSON.stringify([
            bbox ?? null,
            query.focusSpaceId ?? null,
            query.unitId ?? null,
            [...axes].sort(),
            viewer.key,
          ]),
        )
        .digest('hex')
        .slice(0, 12);
      const etag = `W/"fs:${plan.id}:v${plan.layoutVersion}:${fingerprint.slice(0, 16)}:${hash}"`;
      if (etagMatches(ifNoneMatch, etag)) return { status: 304, etag };

      const asOf = await this.layout.serverNow(tx);
      const lastEventAt = await this.ops.lastEventAt(tx, plan.id);
      const base = {
        asOf,
        lastEventAt,
        layoutVersion: plan.layoutVersion,
        viewer: viewer.caps,
      };
      if (!viewer.state) {
        return {
          status: 200,
          etag,
          body: {
            ...base,
            spaces: {},
            rollups: {},
            counts: emptyRollupCounts(),
          },
        };
      }

      // Qué espacios del lienzo se pueden leer: ventana, foco y alcance del actor.
      const tree = await this.layout.placedTree(tx, plan.id, tenantId, bbox);
      let allowed = new Set(tree.map((t) => t.spaceId));
      if (query.focusSpaceId) {
        const focus = new Set(
          await this.layout.subtreeIds(tx, tenantId, query.focusSpaceId),
        );
        allowed = new Set([...allowed].filter((id) => focus.has(id)));
      } else if (query.unitId) {
        const focus = new Set(
          await this.layout.unitSpaceIds(tx, tenantId, [query.unitId]),
        );
        allowed = new Set([...allowed].filter((id) => focus.has(id)));
      }
      const stateScope = await this.viewers.resolveIds(tx, tenantId, viewer.state);
      if (stateScope !== 'ALL') {
        allowed = new Set([...allowed].filter((id) => stateScope.has(id)));
      }
      const retired = new Set(
        tree.filter((t) => t.statusConceptId === PRAC.SPACE_RETIRED).map((t) => t.spaceId),
      );
      const spaceIds = [...allowed].filter((id) => !retired.has(id));

      const patientVisibility = await this.patientVisibility(tx, tenantId, viewer);
      const states = await this.ops.read(tx, {
        tenantId,
        practiceId: site.practiceId,
        spaceIds,
        patientVisibility,
      });

      // Recuentos por contenedor (camas activas, hacia arriba por el árbol dibujado).
      const meta = new Map(tree.map((t) => [t.spaceId, t]));
      const bedForm = FORMS.byInput('LOC_FORM_BED')!.id;
      const rollups: Record<string, PlanRollup> = {};
      const counts = emptyRollup();
      for (const [spaceId, state] of states) {
        const node = meta.get(spaceId);
        if (!node || node.formConceptId !== bedForm) continue;
        addBed(counts, state, node.censable);
        let parent = node.parentId;
        let guard = 0;
        while (parent && guard < 64) {
          guard += 1;
          const up = meta.get(parent);
          if (!up) break;
          const roll = (rollups[parent] ??= emptyRollup());
          addBed(roll, state, node.censable);
          parent = up.parentId;
        }
      }

      const spacesOut: Record<string, SpaceState> = {};
      for (const [spaceId, state] of states) {
        spacesOut[spaceId] = filterAxes(state, axes);
      }
      const body: PlanStateResponse = {
        ...base,
        spaces: spacesOut,
        rollups,
        counts: {
          total: counts.beds,
          assignable: counts.assignable,
          occupied: counts.occupied,
          reserved: counts.reserved,
          blocked: counts.blocked,
          maintenance: counts.maintenance,
          dirty: counts.dirty,
          cleaning: counts.cleaning,
          isolation: counts.isolation,
          contaminated: counts.contaminated,
        },
      };
      return { status: 200, etag, body };
    });
  }

  /**
   * `GET /care-spaces/:id/plan-card`: bloqueos, orden de limpieza abierta y, sólo
   * para Enfermería con alcance sobre el espacio y Admisión, el paciente.
   *
   * Para Limpieza, Mantenimiento y los demás roles la respuesta es **200 sin la
   * clave `patient`** (no 403: siguen viendo bloqueos y orden de limpieza). Cada
   * lectura con `patient` queda en el rastro de acceso, sin repetir dentro de
   * una ventana corta (leer PHI es un acceso, no una vista gratuita).
   *
   * @param spaceId - Espacio.
   * @param actor - Quien lee.
   * @returns La tarjeta; el controlador agrega `Cache-Control: private, no-store`.
   */
  async card(
    spaceId: string,
    actor: AuthenticatedUser,
  ): Promise<PlanCardResponse> {
    return this.em.transactional(async (tx) => {
      const tenantId = requireTenantId();
      const space = await this.spaces.findByIdInTenant(tx, spaceId, tenantId);
      if (!space) throw practiceOutOfScope('Espacio no encontrado');
      const { viewer } = await this.context.site(tx, space.practiceSiteId, actor);
      const identity = await this.viewers.resolveIds(tx, tenantId, viewer.identity);
      if (identity !== 'ALL' && !identity.has(spaceId)) {
        throw practiceOutOfScope('Espacio no encontrado');
      }
      const asOf = await this.layout.serverNow(tx);
      if (!viewer.state) {
        return { asOf, openBlocks: [], viewer: viewer.caps };
      }
      const stateScope = await this.viewers.resolveIds(tx, tenantId, viewer.state);
      if (stateScope !== 'ALL' && !stateScope.has(spaceId)) {
        return { asOf, openBlocks: [], viewer: viewer.caps };
      }
      const visibility = await this.patientVisibility(tx, tenantId, viewer);
      const mayShowPatient =
        visibility === 'ALL' ||
        (visibility !== 'NONE' && visibility.has(spaceId));
      const view = await this.ops.card(tx, tenantId, spaceId, mayShowPatient);
      let patient: PlanCardResponse['patient'];
      if (view.occupant && mayShowPatient) {
        await this.recordOccupantAccess(
          tx,
          tenantId,
          actor.id,
          spaceId,
          view.occupant.patientProfileId,
        );
        patient = {
          displayName: view.occupant.displayName,
          initials: view.occupant.initials,
          sexCode: view.occupant.sexCode,
          ageYears: view.occupant.ageYears,
          encounterId: view.occupant.encounterId,
          admittedAt: view.occupant.admittedAt,
          losDays: view.occupant.losDays,
          ...(view.occupant.expectedDischargeAt
            ? { expectedDischargeAt: view.occupant.expectedDischargeAt }
            : {}),
        };
      }
      return {
        asOf,
        ...(patient ? { patient } : {}),
        openBlocks: view.openBlocks,
        ...(view.openCleaningOrder
          ? { openCleaningOrder: view.openCleaningOrder }
          : {}),
        viewer: viewer.caps,
      };
    });
  }

  // -------------------------------------------------------------- utilidades

  private async patientVisibility(
    tx: EntityManager,
    tenantId: string,
    viewer: PlanViewer,
  ): Promise<PatientVisibility> {
    if (!viewer.patient) return 'NONE';
    const ids = await this.viewers.resolveIds(tx, tenantId, viewer.patient);
    return ids === 'ALL' ? 'ALL' : ids;
  }

  /** Rastro de acceso `PLAN_OCCUPANT_VIEWED`, con deduplicación por usuario, espacio y paciente. */
  private async recordOccupantAccess(
    tx: EntityManager,
    tenantId: string,
    userId: string,
    spaceId: string,
    patientProfileId: string,
  ): Promise<void> {
    const recent = await tx.execute<{ id: string }[]>(
      `select id from audit.data_access_log
        where user_id = ?::uuid and resource_type = ? and resource_id = ?::uuid and patient_profile_id = ?::uuid
          and recorded_at > now() - make_interval(secs => ?)
        limit 1`,
      [userId, OCCUPANT_VIEWED, spaceId, patientProfileId, OCCUPANT_VIEWED_DEDUPE_SECONDS],
    );
    if (recent.length > 0) return;
    this.accessLog.record(tx, {
      userId,
      actionConceptId: AUD.ACTION_READ,
      patientProfileId,
      tenantId,
      purpose: 'OPERATIONS',
      resourceType: OCCUPANT_VIEWED,
      resourceId: spaceId,
    });
    await tx.flush();
  }
}

function windowOf(raw: number[] | undefined): Bbox | undefined {
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

function emptyRollupCounts(): PlanStateResponse['counts'] {
  return {
    total: 0,
    assignable: 0,
    occupied: 0,
    reserved: 0,
    blocked: 0,
    maintenance: 0,
    dirty: 0,
    cleaning: 0,
    isolation: 0,
    contaminated: 0,
  };
}

/** Deja sólo los ejes pedidos (el ciclo de vida, el resumen v2 y la asignabilidad siempre viajan). */
function filterAxes(
  state: SpaceState,
  axes: ReadonlySet<(typeof STATE_AXES)[number]>,
): SpaceState {
  if (axes.size === STATE_AXES.length) return state;
  return {
    lifecycle: state.lifecycle,
    ...(axes.has('availability') && state.availability
      ? { availability: state.availability }
      : {}),
    ...(axes.has('occupancy') && state.occupancy ? { occupancy: state.occupancy } : {}),
    ...(axes.has('hygiene') && state.hygiene ? { hygiene: state.hygiene } : {}),
    ...(axes.has('isolation') && state.isolation ? { isolation: state.isolation } : {}),
    v2Code: state.v2Code,
    assignable: state.assignable,
    ...(state.openCleaningOrderId
      ? { openCleaningOrderId: state.openCleaningOrderId }
      : {}),
    lastEventAt: state.lastEventAt,
    opsVersion: state.opsVersion,
  };
}
