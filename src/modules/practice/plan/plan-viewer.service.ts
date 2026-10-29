import { createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  PreconditionFailedException,
  type AuthenticatedUser,
} from '../../../common';
import { InsufficientRoleException } from '../../../common/errors/domain.exception';
import { DIR } from '../../directory/directory.concepts';
import { CONCEPTS } from '../../../common';
import type { PracticeSites } from '../entities';
import {
  StructureAccessService,
  type StructureAccess,
} from '../services/structure-access.service';
import { FloorPlanReason } from './floor-plan.error-reasons';
import {
  CLINICAL_TEXT_PLAN_ROLES,
  InfraPlanPolicy,
  PATIENT_ROLES,
  PLAN_EDIT_REQUIRED_ROLES,
  PLAN_ROLE_BY_ASSIGNMENT_CODE,
  STATE_ROLES,
  type PlanRole,
} from './policies/infra-plan.policy';
import { pgUuidArray } from './floor-plans.repository';
import { FloorPlanLayoutRepository } from './floor-plan-layout.repository';
import type { ViewerCaps } from './floor-plan.types';

/** Alcance resuelto de una capacidad: todo, o unidades/espacios concretos. */
export interface ScopeSet {
  readonly all: boolean;
  readonly unitIds: readonly string[];
  readonly spaceIds: readonly string[];
}

const NO_SCOPE: ScopeSet = { all: false, unitIds: [], spaceIds: [] };

/** Un actor, visto desde el plano de una sede. */
export interface PlanViewer {
  readonly access: StructureAccess;
  readonly roles: ReadonlySet<PlanRole>;
  /** Alcance con el que ve la **identidad** de los espacios (el resto, silueta). */
  readonly identity: ScopeSet;
  /** Alcance del estado operativo; `null` si no lo ve. */
  readonly state: ScopeSet | null;
  /** Alcance del nombre del paciente; `null` si nunca lo ve. */
  readonly patient: ScopeSet | null;
  /** Alcance del texto clínico libre (organismo…); `null` si nunca lo ve. */
  readonly clinical: ScopeSet | null;
  readonly canEdit: boolean;
  readonly isPlatform: boolean;
  readonly caps: ViewerCaps;
  /** Clave estable de lo que cambia la respuesta (para el ETag). */
  readonly key: string;
}

interface AssignmentRow {
  role_code: string;
  practice_id: string | null;
  practice_site_id: string | null;
  clinical_unit_id: string | null;
  care_space_id: string | null;
  unit_site_id: string | null;
  space_site_id: string | null;
}

const union = (a: ScopeSet, b: ScopeSet): ScopeSet => ({
  all: a.all || b.all,
  unitIds: [...new Set([...a.unitIds, ...b.unitIds])],
  spaceIds: [...new Set([...a.spaceIds, ...b.spaceIds])],
});

const hasAny = (scope: ScopeSet): boolean =>
  scope.all || scope.unitIds.length > 0 || scope.spaceIds.length > 0;

/**
 * Resuelve qué ve y qué puede hacer cada actor en el plano de una sede
 * (CONTRATO-PLANO §3.9 y §4).
 *
 * La API **decide**; `ViewerCaps` es el reflejo que la web usa para mostrar u
 * ocultar. Combina el nivel estructural (`StructureAccessService`, el mismo de
 * F1) con los roles operativos de las asignaciones delegadas vigentes
 * (`delegated_access.organization_user_assignments`). Los roles se reconocen por
 * el **código** del concepto de asignación (`DA_ASSIGN_*`), no por su UUID: los
 * conceptos de Admisión, Limpieza, Mantenimiento y Jefe de quirófano los suma F2
 * en su propia rama y este servicio no depende de que ya estén declarados.
 */
@Injectable()
export class PlanViewerService {
  private readonly policy = new InfraPlanPolicy();

  /**
   * @param access - Nivel estructural del actor.
   * @param layout - Consultas del layout (alcance por unidad).
   */
  constructor(
    private readonly access: StructureAccessService,
    private readonly layout: FloorPlanLayoutRepository,
  ) {}

  /**
   * Resuelve al actor para una sede del tenant activo.
   *
   * @param tx - Transacción activa.
   * @param tenantId - Tenant del contexto.
   * @param actor - Quien pide.
   * @param site - Sede ya cargada y autorizada para lectura.
   * @param access - Resultado previo de `StructureAccessService.resolve`.
   * @returns El actor con su alcance y capacidades.
   */
  async resolve(
    tx: EntityManager,
    tenantId: string,
    actor: AuthenticatedUser,
    site: Pick<PracticeSites, 'id' | 'practiceId' | 'branchId'>,
    access: StructureAccess,
  ): Promise<PlanViewer> {
    const canEdit = this.access.canWriteStructure(access, site);
    const isPlatform = access.level === 'PLATFORM';
    const adminLevel = canEdit;

    const rows = await tx.execute<AssignmentRow[]>(
      `select r.code as role_code, a.practice_id, a.practice_site_id,
              a.clinical_unit_id, a.care_space_id, u.practice_site_id as unit_site_id, s.practice_site_id as space_site_id
         from delegated_access.organization_user_assignments a
         join directory.tenant_memberships m on m.id = a.tenant_membership_id
         join terminology.catalog_concepts r on r.id = a.assignment_role_concept_id
         left join practice.clinical_units u on u.id = a.clinical_unit_id
         left join practice.care_spaces s on s.id = a.care_space_id
        where m.user_id = ?::uuid and m.tenant_id = ?::uuid and m.status_concept_id = ?::uuid
          and a.status_concept_id = ?::uuid
          and (a.valid_from is null or a.valid_from <= now())
          and (a.valid_to is null or a.valid_to > now())
          and r.code = any(?::text[])`,
      [
        actor.id,
        tenantId,
        DIR.MEMBERSHIP_ACTIVE,
        CONCEPTS.STATE_ACTIVE,
        `{${Object.keys(PLAN_ROLE_BY_ASSIGNMENT_CODE).join(',')}}`,
      ],
    );

    const roles = new Set<PlanRole>();
    let identity: ScopeSet = adminLevel ? { ...NO_SCOPE, all: true } : NO_SCOPE;
    let state: ScopeSet = adminLevel ? { ...NO_SCOPE, all: true } : NO_SCOPE;
    let patient: ScopeSet = NO_SCOPE;
    let clinical: ScopeSet = NO_SCOPE;
    let anyGrant = false;

    for (const row of rows) {
      const role = PLAN_ROLE_BY_ASSIGNMENT_CODE[row.role_code];
      if (!role) continue;
      const grant = this.scopeOf(row, site);
      if (!grant) continue;
      anyGrant = true;
      roles.add(role);
      identity = union(identity, grant);
      if (STATE_ROLES.has(role)) state = union(state, grant);
      if (PATIENT_ROLES.has(role)) patient = union(patient, grant);
      if (CLINICAL_TEXT_PLAN_ROLES.has(role)) clinical = union(clinical, grant);
    }
    // Sin ninguna asignación operativa el actor es un miembro que lee la
    // estructura (F1): ve la identidad de todos, no el estado.
    if (!anyGrant) identity = { ...NO_SCOPE, all: true };

    const canSeeState = hasAny(state);
    const canSeePatient = hasAny(patient);
    const canSeeClinical = hasAny(clinical) && canSeeState;
    const caps: ViewerCaps = {
      canEditPlan: canEdit,
      canSeeState,
      canSeePatient,
      canOpenSpaceFile: true,
      scope: !canSeeState ? 'NONE' : state.all ? 'ALL' : 'UNITS',
      ...(canSeeState && !state.all ? { unitIds: [...state.unitIds] } : {}),
    };
    const key = createHash('sha1')
      .update(
        JSON.stringify([
          access.level,
          canEdit,
          [...roles].sort(),
          identity,
          canSeeState ? state : null,
          canSeePatient ? patient : null,
          canSeeClinical ? clinical : null,
        ]),
      )
      .digest('hex')
      .slice(0, 12);
    return {
      access,
      roles,
      identity,
      state: canSeeState ? state : null,
      patient: canSeePatient ? patient : null,
      clinical: canSeeClinical ? clinical : null,
      canEdit,
      isPlatform,
      caps,
      key,
    };
  }

  /**
   * Exige poder editar el plano.
   *
   * @param viewer - Actor resuelto.
   * @param supportReason - Motivo del soporte de plataforma (`X-Support-Reason`).
   * @throws InsufficientRoleException (403 `INFRA_ACTION_NOT_ALLOWED`).
   * @throws PreconditionFailedException (422 `SUPPORT_REASON_REQUIRED`).
   */
  assertCanEdit(viewer: PlanViewer, supportReason?: string): void {
    const allowed = this.policy.allows('plan.edit', {
      canWriteStructure: viewer.canEdit,
      isPlatform: viewer.isPlatform,
      roles: viewer.roles,
    });
    if (!allowed) {
      throw new InsufficientRoleException(
        'Editar el plano exige administrar la organización o la sucursal del establecimiento',
        { action: 'plan.edit', requiredRoles: PLAN_EDIT_REQUIRED_ROLES },
        FloorPlanReason.INFRA_ACTION_NOT_ALLOWED,
      );
    }
    if (viewer.isPlatform && !(supportReason ?? '').trim()) {
      throw new PreconditionFailedException(
        'El soporte de plataforma debe indicar el motivo (cabecera X-Support-Reason)',
        { action: 'plan.edit' },
        FloorPlanReason.SUPPORT_REASON_REQUIRED,
      );
    }
  }

  /**
   * Ids de los espacios (del subárbol del alcance) que el actor ve con
   * identidad o estado, para filtrar por SQL sin traer toda la sede.
   *
   * @returns `'ALL'` si no hay restricción; si no, el conjunto de ids.
   */
  async resolveIds(
    tx: EntityManager,
    tenantId: string,
    scope: ScopeSet,
  ): Promise<'ALL' | ReadonlySet<string>> {
    if (scope.all) return 'ALL';
    if (!hasAny(scope)) return new Set();
    return new Set(
      await this.layout.unitSpaceIds(
        tx,
        tenantId,
        scope.unitIds,
        scope.spaceIds,
      ),
    );
  }

  /** Alcance que otorga una asignación sobre esta sede, o `null` si no aplica a ella. */
  private scopeOf(
    row: AssignmentRow,
    site: Pick<PracticeSites, 'id' | 'practiceId'>,
  ): ScopeSet | null {
    const all: ScopeSet = { ...NO_SCOPE, all: true };
    if (row.care_space_id) {
      return row.space_site_id === site.id
        ? { all: false, unitIds: [], spaceIds: [row.care_space_id] }
        : null;
    }
    if (row.clinical_unit_id) {
      return row.unit_site_id === site.id
        ? { all: false, unitIds: [row.clinical_unit_id], spaceIds: [] }
        : null;
    }
    if (row.practice_site_id)
      return row.practice_site_id === site.id ? all : null;
    if (row.practice_id)
      return row.practice_id === site.practiceId ? all : null;
    // Alcance de organización: sin sede, práctica, unidad ni espacio.
    return all;
  }
}

/** Ayuda para armar una lista de uuid en SQL desde un conjunto. */
export function idsParam(ids: ReadonlySet<string> | readonly string[]): string {
  return pgUuidArray([...ids]);
}
