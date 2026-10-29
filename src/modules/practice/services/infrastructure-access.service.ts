import { Inject, Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  CONCEPTS,
  requireTenantId,
  type AuthenticatedUser,
} from '../../../common';
import { InsufficientRoleException } from '../../../common/errors/domain.exception';
import { DELEG } from '../../delegated_access/delegated_access.concepts';
import { DIR } from '../../directory/directory.concepts';
import { TenantMembershipsRepository } from '../../directory/repositories';
import { FUNCTIONS } from '../infrastructure-catalog';
import { OpsErrorReason } from '../practice-ops.error-reasons';
import {
  IMPLIED_ROLES,
  INFRA_POLICIES,
  InfraPolicyRegistry,
  type InfraActionRule,
  type InfraRole,
} from '../policies/infra-policy';
import { placeholders, str, strOrNull } from './ops-rows';
import { practiceOutOfScope } from './practice-scope';
import { StructureAccessService } from './structure-access.service';

/** Sobre qué se pide la acción. */
export type InfraTarget =
  | { readonly careSpaceId: string }
  | { readonly siteId: string }
  | { readonly unitId: string };

/** Un rol del actor con el alcance con el que lo tiene. */
export interface InfraRoleGrant {
  readonly role: InfraRole;
  /** `true`: cubre toda la sede (organización, sucursal, sede o práctica). */
  readonly wide: boolean;
  /** Unidad de la asignación (alcance de unidad). */
  readonly unitId?: string;
  /** Espacio de la asignación (alcance de espacio). */
  readonly spaceId?: string;
}

/** Datos del espacio objetivo que la política necesita. */
export interface InfraTargetSpace {
  readonly id: string;
  readonly parentSpaceId: string | null;
  readonly spaceTypeConceptId: string;
}

/** Resultado de autorizar: tenant, sede, objetivo y los roles con los que se actúa. */
export interface InfraGrant {
  readonly tenantId: string;
  readonly site: {
    readonly id: string;
    readonly practiceId: string;
    readonly branchId: string | null;
  };
  /** Presente si el objetivo es un espacio. */
  readonly space?: InfraTargetSpace;
  /** Roles que cubren el objetivo, con su alcance. */
  readonly grants: readonly InfraRoleGrant[];
  /** Roles (de los que cubren el objetivo) que permiten la acción pedida. */
  readonly actingRoles: readonly InfraRole[];
}

/** Roles operativos que se leen de `delegated_access.organization_user_assignments`. */
const DELEGATED_ROLES: ReadonlyMap<string, InfraRole> = new Map([
  [DELEG.ASSIGN_ROLE_NURSE, 'NURSE'],
  [DELEG.ASSIGN_ROLE_NURSE_SUPERVISOR, 'NURSE_SUPERVISOR'],
  [DELEG.ASSIGN_ROLE_ADMISSION, 'ADMISSION'],
  [DELEG.ASSIGN_ROLE_HOUSEKEEPING, 'HOUSEKEEPING'],
  [DELEG.ASSIGN_ROLE_HOUSEKEEPING_SUPERVISOR, 'HOUSEKEEPING_SUPERVISOR'],
  [DELEG.ASSIGN_ROLE_MAINTENANCE, 'MAINTENANCE'],
  [DELEG.ASSIGN_ROLE_OR_MANAGER, 'OR_MANAGER'],
  [DELEG.ASSIGN_ROLE_INFECTION_CONTROL, 'INFECTION_CONTROL'],
  [DELEG.ASSIGN_ROLE_BILLING, 'BILLING'],
]);

/** Una asignación operativa vigente del actor, sin resolver. */
interface RawAssignment {
  readonly role: InfraRole;
  readonly scopeId: string;
  readonly practiceId: string | null;
  readonly siteId: string | null;
  readonly unitId: string | null;
  readonly spaceId: string | null;
}

/**
 * Evaluador único de «quién puede qué sobre qué espacio» de la infraestructura
 * hospitalaria (CONTRATO-F2-F5 §0.3).
 *
 * `assertCan(actor, action, target, tx)`:
 *
 * 1. resuelve el objetivo en el **tenant** del contexto (otro tenant, otra
 *    sucursal o inexistente: el mismo **404**, nunca 403);
 * 2. junta los roles del actor que **cubren** el objetivo: los de estructura
 *    (plataforma, organización, sucursal) salen de la membresía y los operativos de
 *    `organization_user_assignments`, con alcance sede, unidad o espacio (camino de
 *    `parent_space_id` y vínculos `space_unit_assignments` vigentes);
 * 3. sin ningún rol que lo cubra: 404; con alguno pero ninguno permite la acción:
 *    **403** `INFRA_ACTION_NOT_ALLOWED` con `details.requiredRoles`.
 *
 * Cada franja declara sus acciones en su propio archivo de política
 * (`policies/infra-<franja>.policy.ts`), registrado en `INFRA_POLICIES`.
 */
@Injectable()
export class InfrastructureAccessService {
  /**
   * @param structure - Nivel del actor en la estructura (plataforma, organización, sucursal).
   * @param memberships - Membresías del tenant.
   * @param policies - Registro de políticas por franja.
   */
  constructor(
    private readonly structure: StructureAccessService,
    private readonly memberships: TenantMembershipsRepository,
    @Inject(INFRA_POLICIES) private readonly policies: InfraPolicyRegistry,
  ) {}

  /**
   * Autoriza la acción o lanza el error que corresponde.
   *
   * @param actor - Quien la pide.
   * @param action - Acción de una política (`infra.block.clinical`…).
   * @param target - Espacio, sede o unidad sobre la que se pide.
   * @param tx - Transacción o contexto activo.
   * @returns Tenant, sede, espacio y roles con los que se actúa.
   * @throws ResourceNotFoundException (404) fuera del tenant o del alcance del actor.
   * @throws InsufficientRoleException (403 `INFRA_ACTION_NOT_ALLOWED`) si ve el objetivo pero ningún rol suyo permite la acción.
   */
  async assertCan(
    actor: AuthenticatedUser,
    action: string,
    target: InfraTarget,
    tx: EntityManager,
  ): Promise<InfraGrant> {
    const rule = this.policies.rule(action);
    if (!rule) {
      throw new Error(`Acción de infraestructura sin política: ${action}`);
    }
    const tenantId = requireTenantId();
    const resolved = await this.resolveTarget(tx, tenantId, target);
    const grants = await this.rolesCovering(tx, tenantId, actor, resolved);
    if (grants.length === 0) throw practiceOutOfScope(resolved.notFound);

    const acting = this.actingRoles(rule, grants, resolved.space);
    if (acting.length === 0) {
      throw new InsufficientRoleException(
        'Ningún rol suyo permite esta acción sobre el espacio',
        { action, requiredRoles: [...rule.roles] },
        OpsErrorReason.INFRA_ACTION_NOT_ALLOWED,
      );
    }
    return {
      tenantId,
      site: resolved.site,
      space: resolved.space,
      grants,
      actingRoles: acting,
    };
  }

  /**
   * ¿Cubre algún rol de {@link roles} este espacio de la sede? Sirve para decidir
   * por celda si viaja el paciente o si una orden de limpieza entra en la cola.
   *
   * @param tx - Transacción o contexto activo.
   * @param grant - Resultado de {@link assertCan} sobre la sede.
   * @param roles - Roles que interesan.
   * @returns `null` si cubren toda la sede; si no, los espacios cubiertos.
   */
  async coveredSpaceIds(
    tx: EntityManager,
    grant: InfraGrant,
    roles: readonly InfraRole[],
  ): Promise<Set<string> | null> {
    const relevant = grant.grants.filter((g) => roles.includes(g.role));
    if (relevant.some((g) => g.wide)) return null;
    const unitIds = [
      ...new Set(relevant.map((g) => g.unitId).filter(Boolean)),
    ] as string[];
    const spaceIds = [
      ...new Set(relevant.map((g) => g.spaceId).filter(Boolean)),
    ] as string[];
    if (unitIds.length === 0 && spaceIds.length === 0) return new Set();
    const now = new Date();
    const rows = await tx.execute<{ id: string }[]>(
      `with recursive
         unit_tree(id) as (
           select id from practice.clinical_units
            where ${unitIds.length ? `id in (${placeholders(unitIds.length)})` : 'false'}
           union
           select u.id from practice.clinical_units u join unit_tree t on u.parent_unit_id = t.id
         ),
         seed(id) as (
           select sua.care_space_id from practice.space_unit_assignments sua
            where sua.clinical_unit_id in (select id from unit_tree)
              and (sua.valid_to is null or sua.valid_to > ?)
           union
           select cs.id from practice.care_spaces cs
            where cs.clinical_unit_id in (select id from unit_tree)
           union
           select cs.id from practice.care_spaces cs
            where ${spaceIds.length ? `cs.id in (${placeholders(spaceIds.length)})` : 'false'}
         ),
         down(id) as (
           select id from seed
           union
           select c.id from practice.care_spaces c join down d on c.parent_space_id = d.id
         )
       select down.id from down
         join practice.care_spaces s on s.id = down.id
        where s.practice_site_id = ? and s.tenant_id = ?`,
      [...unitIds, now, ...spaceIds, grant.site.id, grant.tenantId],
    );
    return new Set(rows.map((row) => String(row.id)));
  }

  /** ¿Tiene el actor alguno de estos roles cubriendo el objetivo? */
  hasRole(grant: InfraGrant, ...roles: InfraRole[]): boolean {
    return grant.grants.some((g) => roles.includes(g.role));
  }

  // --------------------------------------------------------------- internos

  /** Roles que, de los que cubren el objetivo, permiten la acción. */
  private actingRoles(
    rule: InfraActionRule,
    grants: readonly InfraRoleGrant[],
    space: InfraTargetSpace | undefined,
  ): InfraRole[] {
    const functionCode = space
      ? (FUNCTIONS.byConceptId(space.spaceTypeConceptId)?.code ?? '')
      : '';
    const acting = new Set<InfraRole>();
    for (const grant of grants) {
      if (!rule.roles.includes(grant.role)) continue;
      const limit = rule.onlyFunctions?.[grant.role];
      if (
        limit &&
        !limit.some((suffix) => functionCode === `SPACE_FN_${suffix}`)
      )
        continue;
      acting.add(grant.role);
    }
    return [...acting];
  }

  /** Objetivo resuelto en el tenant, o 404. */
  private async resolveTarget(
    tx: EntityManager,
    tenantId: string,
    target: InfraTarget,
  ): Promise<{
    site: InfraGrant['site'];
    space?: InfraTargetSpace;
    unitId?: string;
    notFound: string;
  }> {
    if ('careSpaceId' in target) {
      const rows = await tx.execute<Record<string, unknown>[]>(
        `select cs.id, cs.parent_space_id, cs.space_type_concept_id, cs.practice_site_id,
                s.practice_id, s.branch_id
           from practice.care_spaces cs
           join practice.practice_sites s on s.id = cs.practice_site_id
          where cs.id = ? and cs.tenant_id = ? and s.tenant_id = ?`,
        [target.careSpaceId, tenantId, tenantId],
      );
      if (rows.length === 0) throw practiceOutOfScope('Espacio no encontrado');
      const raw = rows[0];
      return {
        site: {
          id: str(raw.practice_site_id),
          practiceId: str(raw.practice_id),
          branchId: strOrNull(raw.branch_id),
        },
        space: {
          id: str(raw.id),
          parentSpaceId: raw.parent_space_id ? str(raw.parent_space_id) : null,
          spaceTypeConceptId: str(raw.space_type_concept_id),
        },
        notFound: 'Espacio no encontrado',
      };
    }
    if ('unitId' in target) {
      const rows = await tx.execute<Record<string, unknown>[]>(
        `select u.id, u.practice_site_id, s.practice_id, s.branch_id
           from practice.clinical_units u
           join practice.practice_sites s on s.id = u.practice_site_id
          where u.id = ? and u.tenant_id = ? and s.tenant_id = ?`,
        [target.unitId, tenantId, tenantId],
      );
      if (rows.length === 0) throw practiceOutOfScope('Unidad no encontrada');
      const raw = rows[0];
      return {
        site: {
          id: str(raw.practice_site_id),
          practiceId: str(raw.practice_id),
          branchId: strOrNull(raw.branch_id),
        },
        unitId: str(raw.id),
        notFound: 'Unidad no encontrada',
      };
    }
    const rows = await tx.execute<Record<string, unknown>[]>(
      `select s.id, s.practice_id, s.branch_id from practice.practice_sites s
        where s.id = ? and s.tenant_id = ?`,
      [target.siteId, tenantId],
    );
    if (rows.length === 0) throw practiceOutOfScope('Sitio no encontrado');
    const raw = rows[0];
    return {
      site: {
        id: str(raw.id),
        practiceId: str(raw.practice_id),
        branchId: strOrNull(raw.branch_id),
      },
      notFound: 'Sitio no encontrado',
    };
  }

  /** Los roles del actor que cubren el objetivo (con su alcance), implicados incluidos. */
  private async rolesCovering(
    tx: EntityManager,
    tenantId: string,
    actor: AuthenticatedUser,
    resolved: {
      site: InfraGrant['site'];
      space?: InfraTargetSpace;
      unitId?: string;
    },
  ): Promise<InfraRoleGrant[]> {
    const grants: InfraRoleGrant[] = [];
    const access = await this.structure.resolve(tx, tenantId, actor);
    if (access.level === 'PLATFORM') {
      grants.push({ role: 'SUPERADMIN', wide: true });
    } else if (access.level === 'ORG') {
      grants.push({ role: 'ORG_ADMIN', wide: true });
    } else if (
      access.level === 'BRANCH_ADMIN' &&
      this.structure.canSee(access, {
        branchId: resolved.site.branchId ?? undefined,
      })
    ) {
      grants.push({ role: 'BRANCH_ADMIN', wide: true });
    }

    if (access.level !== 'NONE') {
      const raw = await this.delegatedAssignments(tx, tenantId, actor);
      grants.push(...(await this.coveringAssignments(tx, raw, resolved)));
    }

    // El supervisor puede lo que el operario.
    for (const grant of [...grants]) {
      for (const implied of IMPLIED_ROLES[grant.role] ?? []) {
        grants.push({ ...grant, role: implied });
      }
    }
    return grants;
  }

  /** Asignaciones operativas vigentes del actor en el tenant. */
  private async delegatedAssignments(
    tx: EntityManager,
    tenantId: string,
    actor: AuthenticatedUser,
  ): Promise<RawAssignment[]> {
    const membership = await this.memberships.findActiveByUserTenant(
      tx,
      actor.id,
      tenantId,
      DIR.MEMBERSHIP_ACTIVE,
    );
    if (!membership) return [];
    const roleIds = [...DELEGATED_ROLES.keys()];
    const now = new Date();
    const rows = await tx.execute<Record<string, unknown>[]>(
      `select a.assignment_role_concept_id, a.access_scope_concept_id,
              a.practice_id, a.practice_site_id, a.clinical_unit_id, a.care_space_id
         from delegated_access.organization_user_assignments a
        where a.tenant_membership_id = ?
          and a.status_concept_id = ?
          and (a.valid_from is null or a.valid_from <= ?)
          and (a.valid_to is null or a.valid_to > ?)
          and a.assignment_role_concept_id in (${placeholders(roleIds.length)})`,
      [membership.id, CONCEPTS.STATE_ACTIVE, now, now, ...roleIds],
    );
    return rows.map((raw) => ({
      role: DELEGATED_ROLES.get(str(raw.assignment_role_concept_id))!,
      scopeId: str(raw.access_scope_concept_id),
      practiceId: strOrNull(raw.practice_id),
      siteId: strOrNull(raw.practice_site_id),
      unitId: strOrNull(raw.clinical_unit_id),
      spaceId: strOrNull(raw.care_space_id),
    }));
  }

  /** De las asignaciones, las que alcanzan el objetivo. */
  private async coveringAssignments(
    tx: EntityManager,
    assignments: readonly RawAssignment[],
    resolved: {
      site: InfraGrant['site'];
      space?: InfraTargetSpace;
      unitId?: string;
    },
  ): Promise<InfraRoleGrant[]> {
    const covering: InfraRoleGrant[] = [];
    const narrow: RawAssignment[] = [];
    for (const a of assignments) {
      if (a.scopeId === DELEG.SCOPE_TENANT) {
        covering.push({ role: a.role, wide: true });
      } else if (
        a.scopeId === DELEG.SCOPE_PRACTICE &&
        a.practiceId === resolved.site.practiceId
      ) {
        covering.push({ role: a.role, wide: true });
      } else if (
        a.scopeId === DELEG.SCOPE_SITE &&
        a.siteId === resolved.site.id
      ) {
        covering.push({ role: a.role, wide: true });
      } else if (
        (a.scopeId === DELEG.SCOPE_UNIT && a.unitId) ||
        (a.scopeId === DELEG.SCOPE_SPACE && a.spaceId)
      ) {
        narrow.push(a);
      }
    }
    if (narrow.length === 0) return covering;

    // Las de unidad o espacio: ¿son de esta sede? ¿contienen el objetivo?
    const unitIds = [
      ...new Set(narrow.map((a) => a.unitId).filter(Boolean)),
    ] as string[];
    const spaceIds = [
      ...new Set(narrow.map((a) => a.spaceId).filter(Boolean)),
    ] as string[];
    const unitsInSite = await this.idsInSite(
      tx,
      'practice.clinical_units',
      unitIds,
      resolved.site.id,
    );
    const spacesInSite = await this.idsInSite(
      tx,
      'practice.care_spaces',
      spaceIds,
      resolved.site.id,
    );
    const containing = resolved.space
      ? await this.spaceAncestry(tx, resolved.space.id)
      : resolved.unitId
        ? await this.unitAncestry(tx, resolved.unitId)
        : null;

    for (const a of narrow) {
      if (a.scopeId === DELEG.SCOPE_UNIT && a.unitId) {
        if (!unitsInSite.has(a.unitId)) continue;
        if (!containing) {
          covering.push({ role: a.role, wide: false, unitId: a.unitId });
        } else if (containing.unitIds.has(a.unitId)) {
          covering.push({ role: a.role, wide: false, unitId: a.unitId });
        }
      } else if (a.scopeId === DELEG.SCOPE_SPACE && a.spaceId) {
        if (!spacesInSite.has(a.spaceId)) continue;
        if (!containing) {
          covering.push({ role: a.role, wide: false, spaceId: a.spaceId });
        } else if (containing.spaceIds.has(a.spaceId)) {
          covering.push({ role: a.role, wide: false, spaceId: a.spaceId });
        }
      }
    }
    return covering;
  }

  /** Cuáles de los ids pertenecen a la sede. */
  private async idsInSite(
    tx: EntityManager,
    table: 'practice.clinical_units' | 'practice.care_spaces',
    ids: readonly string[],
    siteId: string,
  ): Promise<Set<string>> {
    if (ids.length === 0) return new Set();
    const rows = await tx.execute<{ id: string }[]>(
      `select id from ${table} where practice_site_id = ? and id in (${placeholders(ids.length)})`,
      [siteId, ...ids],
    );
    return new Set(rows.map((row) => String(row.id)));
  }

  /**
   * El espacio y sus ancestros, y las unidades a las que pertenecen (con las
   * unidades superiores): «lo que contiene» al espacio.
   */
  private async spaceAncestry(
    tx: EntityManager,
    spaceId: string,
  ): Promise<{ spaceIds: Set<string>; unitIds: Set<string> }> {
    const rows = await tx.execute<{ kind: string; id: string }[]>(
      `with recursive anc(id, parent_space_id) as (
         select id, parent_space_id from practice.care_spaces where id = ?
         union all
         select p.id, p.parent_space_id from practice.care_spaces p join anc on p.id = anc.parent_space_id
       ),
       direct_units as (
         select sua.clinical_unit_id as id from practice.space_unit_assignments sua
          where sua.care_space_id in (select id from anc)
            and (sua.valid_to is null or sua.valid_to > ?)
         union
         select cs.clinical_unit_id from practice.care_spaces cs
          where cs.id in (select id from anc) and cs.clinical_unit_id is not null
       ),
       up(id, parent_unit_id) as (
         select u.id, u.parent_unit_id from practice.clinical_units u
          where u.id in (select id from direct_units)
         union
         select p.id, p.parent_unit_id from practice.clinical_units p join up on p.id = up.parent_unit_id
       )
       select 'space' as kind, id from anc
       union all
       select 'unit' as kind, id from up`,
      [spaceId, new Date()],
    );
    return {
      spaceIds: new Set(
        rows.filter((r) => r.kind === 'space').map((r) => String(r.id)),
      ),
      unitIds: new Set(
        rows.filter((r) => r.kind === 'unit').map((r) => String(r.id)),
      ),
    };
  }

  /** La unidad y sus unidades superiores. */
  private async unitAncestry(
    tx: EntityManager,
    unitId: string,
  ): Promise<{ spaceIds: Set<string>; unitIds: Set<string> }> {
    const rows = await tx.execute<{ id: string }[]>(
      `with recursive up(id, parent_unit_id) as (
         select id, parent_unit_id from practice.clinical_units where id = ?
         union all
         select p.id, p.parent_unit_id from practice.clinical_units p join up on p.id = up.parent_unit_id
       ) select id from up`,
      [unitId],
    );
    return {
      spaceIds: new Set(),
      unitIds: new Set(rows.map((row) => String(row.id))),
    };
  }
}
