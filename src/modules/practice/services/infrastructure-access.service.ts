import { roleAuthorizesInTenant } from '../../../common/auth/roles.guard';
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

/** Alcance de un actor sobre una sede (`scopeFilter`). */
export interface ScopeFilter {
  readonly allSite: boolean;
  readonly site: PracticeSites;
  readonly scope: ActorScope;
  readonly careSpaceIds: ReadonlySet<string>;
  readonly clinicalUnitIds: ReadonlySet<string>;
  /** `true` si el espacio es de la sede y está en el alcance. */
  allowsSpace(careSpaceId: string): boolean;
  /** `true` si la unidad está en el alcance. */
  allowsUnit(unitId: string | null | undefined): boolean;
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
  ACCOUNTING_APPROVER: 'ACCOUNTING',
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
      // Un rol con ámbito (MCH-001) sólo vale en el tenant que lo indexa.
      if (roleAuthorizesInTenant(actor, global, site.tenantId))
        globals.push(mapped);
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
   * Roles de nivel sede u organización: los base (plataforma, admin) más las
   * asignaciones TENANT/PRACTICE/SITE que contienen la sede. Una asignación
   * de unidad o de espacio **no** cuenta: sirve para decidir si una colección
   * por sede se devuelve entera o filtrada a lo permitido.
   *
   * @param scope - Alcance del actor.
   * @param site - Sede.
   */
  siteLevelRoles(
    scope: ActorScope,
    site: { id: string; practiceId: string },
  ): Set<InfraRole> {
    return rolesOn(
      scope.base,
      scope.grants.filter(
        (g) =>
          g.scope === 'TENANT' || g.scope === 'PRACTICE' || g.scope === 'SITE',
      ),
      {
        practiceId: site.practiceId,
        siteId: site.id,
        unitIds: [],
        spaceChain: [],
      },
    );
  }

  /**
   * Exige `action` a nivel práctica: plataforma, admin de la organización,
   * asignación TENANT/PRACTICE o un rol global que la regla admita. La
   * práctica tiene que ser del tenant activo (404 si no).
   *
   * @param tx - Contexto.
   * @param actor - Actor.
   * @param practiceId - Práctica.
   * @param tenantId - Tenant activo.
   * @param action - Acción registrada.
   */
  async assertPracticeLevel(
    tx: EntityManager,
    actor: AuthenticatedUser,
    practiceId: string,
    tenantId: string,
    action: string,
  ): Promise<void> {
    const [p] = await tx.execute<{ tenant_id: string }[]>(
      'SELECT tenant_id FROM practice.practices WHERE id = ?',
      [practiceId],
      'all',
    );
    if (!p || p.tenant_id !== tenantId)
      throw new ResourceNotFoundException('Práctica no encontrada', {
        practiceId,
      });
    const pseudoSite = {
      id: '',
      practiceId,
      tenantId,
      branchId: undefined,
    } as never;
    const scope = await this.actorScope(tx, actor, pseudoSite);
    this.decide(
      action,
      this.siteLevelRoles(scope, { id: '', practiceId }),
      false,
      scope,
    );
  }

  /**
   * `true` si el actor puede `action` sobre la sede entera.
   *
   * @param action - Acción registrada.
   * @param scope - Alcance del actor.
   * @param site - Sede.
   */
  canAtSiteLevel(
    action: string,
    scope: ActorScope,
    site: { id: string; practiceId: string },
  ): boolean {
    return this.can(action, this.siteLevelRoles(scope, site), false, scope);
  }

  /**
   * `true` si el actor puede `action` sobre una unidad concreta de la sede
   * (nivel sede, o asignación UNIT de esa misma unidad). Fail-closed: una
   * unidad `null` (camas sin unidad) sólo la ve el nivel sede.
   *
   * @param action - Acción registrada.
   * @param scope - Alcance del actor.
   * @param site - Sede.
   * @param unitId - Unidad.
   */
  canOnUnit(
    action: string,
    scope: ActorScope,
    site: { id: string; practiceId: string },
    unitId: string | null,
  ): boolean {
    if (this.canAtSiteLevel(action, scope, site)) return true;
    if (!unitId) return false;
    const roles = rolesOn(scope.base, scope.grants, {
      practiceId: site.practiceId,
      siteId: site.id,
      unitIds: [unitId],
      spaceChain: [],
    });
    return this.can(action, roles, false, scope);
  }

  /**
   * Filtro de alcance único para colecciones y para ids que manda el cliente
   * (revisión de seguridad F2–F4). Autoriza la acción sobre la sede (404 de
   * otro tenant, 403 sin ningún rol) y devuelve:
   * - `allSite`: el actor tiene la acción a nivel sede u organización;
   * - `careSpaceIds`: si no, los espacios de la sede sobre los que la tiene
   *   (por SITE/UNIT/SPACE, camino de padres y vínculos vigentes; los roles de
   *   quirófano sólo sobre quirófanos);
   * - `clinicalUnitIds`: las unidades de la sede sobre las que la tiene.
   *
   * @param actor - Actor.
   * @param action - Acción registrada.
   * @param siteId - Sede.
   * @param tx - Contexto.
   * @param tenantId - Tenant activo.
   */
  async scopeFilter(
    actor: AuthenticatedUser,
    action: string,
    siteId: string,
    tx: EntityManager,
    tenantId: string,
  ): Promise<ScopeFilter> {
    const { target, scope } = await this.assertCan(
      actor,
      action,
      { siteId },
      tx,
      tenantId,
    );
    const allSite = this.canAtSiteLevel(action, scope, target.site);
    const careSpaceIds = new Set<string>();
    const clinicalUnitIds = new Set<string>();
    const index = await this.opsRepo.siteScopeIndex(tx, siteId);
    const siteSpaces = new Set(index.spaces.map((sp) => sp.id));
    const siteUnits = new Set(index.units.map((u) => u.id));
    if (!allSite) {
      const byId = new Map(index.spaces.map((sp) => [sp.id, sp]));
      const unitParent = new Map(
        index.units.map((u) => [u.id, u.parent_unit_id]),
      );
      const linksBySpace = new Map<string, string[]>();
      for (const l of index.links) {
        linksBySpace.set(l.care_space_id, [
          ...(linksBySpace.get(l.care_space_id) ?? []),
          l.clinical_unit_id,
        ]);
      }
      for (const u of index.units) {
        if (this.canOnUnit(action, scope, target.site, u.id))
          clinicalUnitIds.add(u.id);
      }
      for (const sp of index.spaces) {
        const chain: string[] = [];
        let cur: string | null | undefined = sp.id;
        while (cur && chain.length < 32 && !chain.includes(cur)) {
          chain.push(cur);
          cur = byId.get(cur)?.parent_space_id;
        }
        const direct = new Set<string>();
        for (const id of chain) {
          for (const u of linksBySpace.get(id) ?? []) direct.add(u);
          const own = byId.get(id)?.clinical_unit_id;
          if (own) direct.add(own);
        }
        const units = new Set<string>();
        for (const u of direct) {
          let c: string | null | undefined = u;
          while (c && !units.has(c)) {
            units.add(c);
            c = unitParent.get(c);
          }
        }
        const roles = rolesOn(scope.base, scope.grants, {
          practiceId: target.site.practiceId,
          siteId,
          unitIds: [...units],
          spaceChain: chain,
        });
        if (
          this.can(
            action,
            roles,
            sp.space_type_concept_id === PRAC.SPACE_FN_OPERATING_ROOM,
            scope,
          )
        ) {
          careSpaceIds.add(sp.id);
        }
      }
    }
    return {
      allSite,
      site: target.site,
      scope,
      careSpaceIds,
      clinicalUnitIds,
      allowsSpace: (id) =>
        siteSpaces.has(id) && (allSite || careSpaceIds.has(id)),
      allowsUnit: (id) =>
        !!id && siteUnits.has(id) && (allSite || clinicalUnitIds.has(id)),
    };
  }

  /**
   * Un id que manda el cliente (espacio o unidad) dentro del alcance del
   * filtro, o 404 (sin decir si existe fuera).
   *
   * @param filter - Resultado de `scopeFilter`.
   * @param ref - Espacio o unidad pedidos.
   */
  assertTargetInScope(
    filter: ScopeFilter,
    ref: { careSpaceId?: string | null; unitId?: string | null },
  ): void {
    if (ref.careSpaceId && !filter.allowsSpace(ref.careSpaceId)) {
      throw new ResourceNotFoundException('Espacio no encontrado', {
        spaceId: ref.careSpaceId,
      });
    }
    if (ref.unitId && !filter.allowsUnit(ref.unitId)) {
      throw new ResourceNotFoundException('Unidad clínica no encontrada', {
        unitId: ref.unitId,
      });
    }
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
