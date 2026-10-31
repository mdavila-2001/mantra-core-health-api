import { Inject, Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import { InsufficientRoleException } from '../../../common/errors/domain.exception';
import { DELEG } from '../../delegated_access/delegated_access.concepts';
import { PRAC } from '../practice.concepts';
import type { CareSpaces, ClinicalUnits, PracticeSites } from '../entities';
import {
  CareSpaceOpsRepository,
  CareSpacesRepository,
  ClinicalUnitsRepository,
  PracticeSitesRepository,
  type ChainRow,
} from '../repositories';
import {
  allows,
  rolesOn,
  type GrantScope,
  type InfraGrant,
  type InfraPolicy,
  type InfraRole,
  type ScopeTarget,
} from '../domain/ops/infra-scope';
import { StructureAccessService } from './structure-access.service';

/** Token del registro de políticas de infraestructura (§0.3). */
export const INFRA_POLICIES = Symbol('INFRA_POLICIES');

/**
 * Registro de políticas por franja. Cada franja declara sus acciones en su
 * propio archivo (`<modulo>/policies/infra-<franja>.policy.ts`) y lo registra
 * al arrancar su módulo: ninguna edita la política de otra.
 */
export class InfraPolicyRegistry {
  private readonly actions = new Map<string, InfraPolicy['actions'][string]>();

  /**
   * Registra una política; una acción repetida es un error de cableado.
   *
   * @param policy - Política de una franja.
   */
  register(policy: InfraPolicy): void {
    for (const [key, rule] of Object.entries(policy.actions)) {
      const existing = this.actions.get(key);
      if (existing && existing !== rule) {
        throw new Error(`Acción de infraestructura duplicada: ${key}`);
      }
      this.actions.set(key, rule);
    }
  }

  /**
   * Regla de una acción.
   *
   * @param action - Clave (`f2.cleaning.work`).
   */
  rule(action: string): InfraPolicy['actions'][string] {
    const rule = this.actions.get(action);
    if (!rule)
      throw new Error(`Acción de infraestructura no registrada: ${action}`);
    return rule;
  }
}

/** Objetivo de una acción (§0.3). */
export type InfraTarget =
  { careSpaceId: string } | { siteId: string } | { unitId: string };

/** Objetivo resuelto: tenant comprobado y camino calculado. */
export interface ResolvedTarget {
  readonly tenantId: string;
  readonly site: PracticeSites;
  readonly space?: CareSpaces;
  readonly unit?: ClinicalUnits;
  readonly chain: readonly ChainRow[];
  readonly scope: ScopeTarget;
  readonly isOperatingRoom: boolean;
}

/** Lo que el evaluador sabe del actor dentro de un tenant. */
export interface ActorScope {
  /** Plataforma y administración: valen sobre cualquier objetivo del tenant. */
  readonly base: readonly InfraRole[];
  readonly grants: readonly InfraGrant[];
  /**
   * Roles globales equivalentes (`PERIOP_ADMIN` → `OR_MANAGER`, `BILLING`).
   * No se suman a los roles del alcance: sólo cuentan donde la regla los
   * admite (`allows`).
   */
  readonly globals: readonly InfraRole[];
}

const ROLE_BY_CONCEPT = new Map<string, InfraRole>([
  [DELEG.ASSIGN_ROLE_NURSE, 'NURSE'],
  [DELEG.ASSIGN_ROLE_NURSE_SUPERVISOR, 'NURSE_SUPERVISOR'],
  [DELEG.ASSIGN_ROLE_ADMISSION, 'ADMISSION'],
  [DELEG.ASSIGN_ROLE_HOUSEKEEPING, 'HOUSEKEEPING'],
  [DELEG.ASSIGN_ROLE_HOUSEKEEPING_SUPERVISOR, 'HOUSEKEEPING_SUPERVISOR'],
  [DELEG.ASSIGN_ROLE_MAINTENANCE, 'MAINTENANCE'],
  [DELEG.ASSIGN_ROLE_OR_MANAGER, 'OR_MANAGER'],
  [DELEG.ASSIGN_ROLE_BILLING, 'BILLING'],
  [DELEG.ASSIGN_ROLE_INFECTION_CONTROL, 'INFECTION_CONTROL'],
  [DELEG.ASSIGN_ROLE_UNIT_HEAD, 'UNIT_HEAD'],
]);

const SCOPE_BY_CONCEPT = new Map<string, GrantScope>([
  [DELEG.SCOPE_TENANT, 'TENANT'],
  [DELEG.SCOPE_PRACTICE, 'PRACTICE'],
  [DELEG.SCOPE_SITE, 'SITE'],
  [DELEG.SCOPE_UNIT, 'UNIT'],
  [DELEG.SCOPE_SPACE, 'SPACE'],
]);

/** Roles globales de plataforma (§0.3 «Superadmin»). */
const PLATFORM_ROLES = ['SECURITY_ADMIN', 'PLATFORM_ADMIN', 'SUPERADMIN'];

/**
 * Roles globales que equivalen a un rol del contrato. Sólo cuentan para su
 * objetivo (`allows`): `OR_MANAGER` sobre quirófanos, `BILLING` en las
 * acciones que lo nombran en `globalRoles`.
 */
const GLOBAL_ROLE_MAP: Record<string, InfraRole> = {
  PERIOP_ADMIN: 'OR_MANAGER',
  BILLING: 'BILLING',
};

/**
 * Evaluador único de la infraestructura hospitalaria (CONTRATO-F2-F5 §0.3).
 *
 * `assertCan(actor, action, target, tx)`: resuelve el tenant del objetivo
 * (otro tenant o inexistente → **404**, sin distinguir), calcula los roles del
 * actor sobre el objetivo —plataforma, admin de organización o de sucursal
 * (`StructureAccessService`), roles globales equivalentes y asignaciones de
 * `delegated_access.organization_user_assignments` cuyo alcance SITE/UNIT/SPACE
 * contiene al objetivo— y decide con la regla registrada. Denegado → **403**
 * `INFRA_ACTION_NOT_ALLOWED` con `details.requiredRoles`.
 */
@Injectable()
export class InfrastructureAccessService {
  /**
   * @param registry - Políticas registradas por franja.
   * @param structureAccess - Admin de organización/sucursal (F1).
   * @param opsRepo - Asignaciones y camino del espacio.
   * @param sitesRepo - Sedes.
   * @param spacesRepo - Espacios.
   * @param unitsRepo - Unidades.
   */
  constructor(
    @Inject(INFRA_POLICIES) private readonly registry: InfraPolicyRegistry,
    private readonly structureAccess: StructureAccessService,
    private readonly opsRepo: CareSpaceOpsRepository,
    private readonly sitesRepo: PracticeSitesRepository,
    private readonly spacesRepo: CareSpacesRepository,
    private readonly unitsRepo: ClinicalUnitsRepository,
  ) {}

  /**
   * Resuelve el objetivo dentro del tenant activo, o 404.
   *
   * @param tx - Contexto.
   * @param target - Espacio, sede o unidad.
   * @param tenantId - Tenant activo.
   */
  async resolve(
    tx: EntityManager,
    target: InfraTarget,
    tenantId: string,
  ): Promise<ResolvedTarget> {
    let space: CareSpaces | undefined;
    let unit: ClinicalUnits | undefined;
    let siteId: string;
    if ('careSpaceId' in target) {
      const found = await this.spacesRepo.findById(tx, target.careSpaceId);
      if (!found || found.tenantId !== tenantId) {
        throw new ResourceNotFoundException('Espacio no encontrado', {
          spaceId: target.careSpaceId,
        });
      }
      space = found;
      siteId = found.practiceSiteId;
    } else if ('unitId' in target) {
      const found = await this.unitsRepo.findById(tx, target.unitId);
      if (!found || found.tenantId !== tenantId) {
        throw new ResourceNotFoundException('Unidad clínica no encontrada', {
          unitId: target.unitId,
        });
      }
      unit = found;
      siteId = found.practiceSiteId;
    } else {
      siteId = target.siteId;
    }
    const site = await this.sitesRepo.findById(tx, siteId);
    if (!site || site.tenantId !== tenantId) {
      throw new ResourceNotFoundException('Sitio no encontrado', { siteId });
    }
    const chain = space ? await this.opsRepo.chain(tx, space.id) : [];
    const chainIds = chain.map((c) => c.id);
    const unitIds = space
      ? await this.opsRepo.unitsOf(tx, chainIds)
      : unit
        ? [unit.id]
        : [];
    return {
      tenantId,
      site,
      space,
      unit,
      chain,
      scope: {
        practiceId: site.practiceId,
        siteId: site.id,
        unitIds,
        spaceChain: chainIds,
      },
      isOperatingRoom:
        space?.spaceTypeConceptId === PRAC.SPACE_FN_OPERATING_ROOM,
    };
  }

  /**
   * Roles base y asignaciones del actor en la sede.
   *
   * @param tx - Contexto.
   * @param actor - Actor.
   * @param site - Sede.
   */
  async actorScope(
    tx: EntityManager,
    actor: AuthenticatedUser,
    site: PracticeSites,
  ): Promise<ActorScope> {
    const base: InfraRole[] = [];
    const roles = actor.roles ?? [];
    if (PLATFORM_ROLES.some((r) => roles.includes(r))) base.push('SUPERADMIN');
    const globals: InfraRole[] = [];
    for (const [global, mapped] of Object.entries(GLOBAL_ROLE_MAP)) {
      if (roles.includes(global)) globals.push(mapped);
    }
    const level = await this.structureAccess.adminLevelOf(tx, site, actor);
    if (level === 'ORG') base.push('ORG_ADMIN', 'SITE_ADMIN');
    if (level === 'BRANCH') base.push('SITE_ADMIN');
    const rows = await this.opsRepo.grants(tx, actor.id, site.tenantId);
    const grants: InfraGrant[] = [];
    for (const row of rows) {
      const role = ROLE_BY_CONCEPT.get(row.role_id);
      const scope = SCOPE_BY_CONCEPT.get(row.scope_id);
      if (!role || !scope) continue;
      grants.push({
        role,
        scope,
        practiceId: row.practice_id,
        siteId: row.practice_site_id,
        unitId: row.clinical_unit_id,
        spaceId: row.care_space_id,
      });
    }
    return { base, grants, globals };
  }

  /**
   * Roles del actor sobre un objetivo ya resuelto.
   *
   * @param scope - Lo que se sabe del actor.
   * @param target - Objetivo.
   */
  rolesOn(scope: ActorScope, target: ScopeTarget): Set<InfraRole> {
    return rolesOn(scope.base, scope.grants, target);
  }

  /**
   * Exige poder hacer `action` sobre el objetivo; devuelve el objetivo
   * resuelto y los roles para que el caso de uso no vuelva a consultarlos.
   *
   * @param actor - Actor.
   * @param action - Acción registrada (`f2.cleaning.work`).
   * @param target - Espacio, sede o unidad.
   * @param tx - Transacción del llamador.
   * @param tenantId - Tenant activo (`requireTenantId()`).
   * @throws ResourceNotFoundException si el objetivo no es del tenant.
   * @throws InsufficientRoleException 403 `INFRA_ACTION_NOT_ALLOWED`.
   */
  async assertCan(
    actor: AuthenticatedUser,
    action: string,
    target: InfraTarget,
    tx: EntityManager,
    tenantId: string,
  ): Promise<{
    target: ResolvedTarget;
    roles: Set<InfraRole>;
    scope: ActorScope;
  }> {
    const resolved = await this.resolve(tx, target, tenantId);
    const scope = await this.actorScope(tx, actor, resolved.site);
    const roles = this.rolesOn(scope, this.siteWide(resolved, scope));
    this.decide(
      action,
      roles,
      resolved.isOperatingRoom,
      scope,
      !resolved.space,
    );
    return { target: resolved, roles, scope };
  }

  /**
   * `true` si los roles alcanzan para la acción (sin lanzar).
   *
   * @param action - Acción registrada.
   * @param roles - Roles del actor sobre el objetivo.
   * @param isOperatingRoom - El objetivo es un quirófano.
   * @param scope - Alcance del actor (aporta sus roles globales).
   */
  can(
    action: string,
    roles: ReadonlySet<InfraRole>,
    isOperatingRoom = false,
    scope?: ActorScope,
  ): boolean {
    return allows(
      this.registry.rule(action),
      roles,
      isOperatingRoom,
      scope?.globals ?? [],
    );
  }

  /**
   * Lanza 403 si los roles no alcanzan.
   *
   * @param action - Acción registrada.
   * @param roles - Roles del actor.
   * @param isOperatingRoom - El objetivo es un quirófano.
   * @param scope - Alcance del actor (aporta sus roles globales).
   * @param partial - Objetivo de colección (sede o unidad).
   */
  decide(
    action: string,
    roles: ReadonlySet<InfraRole>,
    isOperatingRoom = false,
    scope?: ActorScope,
    partial = false,
  ): void {
    const rule = this.registry.rule(action);
    if (allows(rule, roles, isOperatingRoom, scope?.globals ?? [], partial))
      return;
    throw new InsufficientRoleException(
      'Su rol no permite esta acción sobre este espacio',
      {
        action,
        requiredRoles: [
          ...rule.roles,
          ...(isOperatingRoom ? (rule.operatingRoomRoles ?? []) : []),
        ],
      },
      'INFRA_ACTION_NOT_ALLOWED',
    );
  }

  /**
   * Objetivo de alcance. Para una sede o unidad, una asignación de alcance
   * menor (UNIT/SPACE dentro de la sede) también habilita la acción: las
   * lecturas de colección filtran después por fila (§0.3, F5g).
   */
  private siteWide(target: ResolvedTarget, scope: ActorScope): ScopeTarget {
    if (target.space) return target.scope;
    const inner = scope.grants.filter(
      (g) =>
        (g.scope === 'UNIT' || g.scope === 'SPACE') &&
        g.siteId === target.site.id,
    );
    return {
      ...target.scope,
      unitIds: [
        ...target.scope.unitIds,
        ...(target.unit
          ? []
          : inner.flatMap((g) => (g.unitId ? [g.unitId] : []))),
      ],
      spaceChain: target.unit
        ? target.scope.spaceChain
        : inner.flatMap((g) => (g.spaceId ? [g.spaceId] : [])),
    };
  }
}
