import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  CONCEPTS,
  ResourceNotFoundException,
  requireTenantId,
  roleAuthorizesInTenant,
  type AuthenticatedUser,
} from '../../../common';
import { InsufficientRoleException } from '../../../common/errors/domain.exception';
import { DELEG } from '../../delegated_access/delegated_access.concepts';
import { DIR } from '../../directory/directory.concepts';
import {
  StructureAccessService,
  type StructureAccess,
} from '../../practice/services/structure-access.service';
import { ClinicalErrorReason } from '../clinical.error-reasons';
import {
  IMPLIED_ROLES,
  INFRA_F3_ACTIONS,
  INFRA_F3_POLICY,
  INFRA_OPERATIONAL_ROLE_CONCEPTS,
  type InfraAdminRole,
  type InfraF3Action,
  type InfraOperationalRole,
} from '../policies/infra-f3.policy';

/** Alcance resuelto de una petición: tenant, sede y roles del actor ahí. */
export interface AdtScope {
  /** Tenant del contexto. */
  readonly tenantId: string;
  /** Sede del objetivo. */
  readonly siteId: string;
  /** Práctica de la sede. */
  readonly practiceId: string;
  /** Sucursal de la sede (para el alcance de sucursal). */
  readonly branchId: string | null;
  /** Roles operativos del actor que **contienen** el objetivo. */
  readonly operational: ReadonlySet<InfraOperationalRole>;
  /** Roles de estructura / plataforma del actor sobre la sede. */
  readonly admin: ReadonlySet<InfraAdminRole>;
  /** Nivel crudo de acceso a la estructura. */
  readonly access: StructureAccess;
}

/** Fila de asignación delegada del actor. */
interface AssignmentRow {
  role: string;
  scope: string;
  practice_id: string | null;
  practice_site_id: string | null;
  clinical_unit_id: string | null;
  care_space_id: string | null;
}

/** Lo que el alcance de un espacio necesita para decidir si lo contiene. */
interface SpaceContainment {
  readonly spaceIds: ReadonlySet<string>;
  readonly unitIds: ReadonlySet<string>;
}

/**
 * Evaluador de la política de F3 (CONTRATO-F2-F5 §0.3).
 *
 * Orden fijo, el mismo que el de la estructura de F1: **tenant → alcance →
 * permiso**. Un recurso de otro tenant (o inexistente) responde 404 uniforme,
 * sin distinguirlo; un recurso del tenant sobre el que el actor no tiene el rol
 * que exige la acción responde 403 `INFRA_ACTION_NOT_ALLOWED` con
 * `details.requiredRoles`.
 *
 * El rol operativo (Enfermería, Admisión…) se reconoce por una asignación
 * delegada **vigente** de la membresía del actor cuyo alcance —tenant, práctica,
 * sede, unidad o espacio— contiene al objetivo. La unidad de una cama es la del
 * espacio y la de sus ancestros por `parent_space_id`, más sus vínculos
 * `space_unit_assignments` vigentes. Ocultar un control en la interfaz no
 * reemplaza nada de esto.
 */
@Injectable()
export class AdtAccessService {
  /**
   * @param structureAccess - Nivel de acceso a la estructura (admin org / sucursal / plataforma).
   */
  constructor(private readonly structureAccess: StructureAccessService) {}

  /**
   * Alcance sobre una sede.
   *
   * @param tx - Transacción o contexto de persistencia.
   * @param siteId - Sede (id del cliente).
   * @param actor - Quien pide.
   * @throws ResourceNotFoundException (404) si no existe o es de otro tenant.
   */
  async forSite(
    tx: EntityManager,
    siteId: string,
    actor: AuthenticatedUser,
  ): Promise<AdtScope> {
    const tenantId = requireTenantId();
    const site = await this.loadSite(tx, siteId, tenantId);
    return this.resolve(tx, tenantId, site, actor, null);
  }

  /**
   * Alcance sobre una cama (o cualquier espacio).
   *
   * @param tx - Transacción o contexto de persistencia.
   * @param careSpaceId - Espacio (id del cliente).
   * @param actor - Quien pide.
   * @throws ResourceNotFoundException (404) si no existe o es de otro tenant.
   */
  async forSpace(
    tx: EntityManager,
    careSpaceId: string,
    actor: AuthenticatedUser,
  ): Promise<AdtScope> {
    const tenantId = requireTenantId();
    const rows = await tx.execute<
      { practice_site_id: string; tenant_id: string }[]
    >(
      'select practice_site_id, tenant_id from practice.care_spaces where id = ?',
      [careSpaceId],
    );
    if (rows.length === 0 || rows[0].tenant_id !== tenantId)
      throw this.outOfScope();
    const site = await this.loadSite(tx, rows[0].practice_site_id, tenantId);
    return this.resolve(
      tx,
      tenantId,
      site,
      actor,
      await this.containment(tx, careSpaceId),
    );
  }

  /**
   * Exige que el actor pueda hacer la acción.
   *
   * @param scope - Alcance resuelto con {@link forSite} o {@link forSpace}.
   * @param action - Acción de F3.
   * @throws InsufficientRoleException (403 `INFRA_ACTION_NOT_ALLOWED`) si no puede.
   */
  assertCan(scope: AdtScope, action: InfraF3Action): void {
    if (this.can(scope, action)) return;
    const rule = INFRA_F3_POLICY[action];
    throw new InsufficientRoleException(
      'Tu rol no permite esta acción sobre este establecimiento',
      {
        action,
        requiredRoles: [...rule.operational, ...rule.admin],
      },
      ClinicalErrorReason.INFRA_ACTION_NOT_ALLOWED,
    );
  }

  /**
   * ¿Puede el actor la acción?
   *
   * @param scope - Alcance resuelto.
   * @param action - Acción de F3.
   */
  can(scope: AdtScope, action: InfraF3Action): boolean {
    const rule = INFRA_F3_POLICY[action];
    return (
      rule.operational.some((role) => scope.operational.has(role)) ||
      rule.admin.some((role) => scope.admin.has(role))
    );
  }

  /**
   * ¿Tiene el actor, sobre el alcance, el rol de control de infecciones que avala
   * una cohorte?
   *
   * @param scope - Alcance resuelto.
   */
  canApproveCohort(scope: AdtScope): boolean {
    return this.can(scope, INFRA_F3_ACTIONS.COHORT_APPROVAL);
  }

  private async loadSite(
    tx: EntityManager,
    siteId: string,
    tenantId: string,
  ): Promise<{ id: string; practiceId: string; branchId: string | null }> {
    const rows = await tx.execute<
      {
        id: string;
        tenant_id: string;
        practice_id: string;
        branch_id: string | null;
      }[]
    >(
      'select id, tenant_id, practice_id, branch_id from practice.practice_sites where id = ?',
      [siteId],
    );
    if (rows.length === 0 || rows[0].tenant_id !== tenantId)
      throw this.outOfScope();
    return {
      id: rows[0].id,
      practiceId: rows[0].practice_id,
      branchId: rows[0].branch_id,
    };
  }

  private async resolve(
    tx: EntityManager,
    tenantId: string,
    site: { id: string; practiceId: string; branchId: string | null },
    actor: AuthenticatedUser,
    space: SpaceContainment | null,
  ): Promise<AdtScope> {
    const access = await this.structureAccess.resolve(tx, tenantId, actor);
    const admin = new Set<InfraAdminRole>();
    if (access.level === 'PLATFORM') admin.add('PLATFORM');
    if (access.level === 'ORG') admin.add('ORG_ADMIN');
    if (
      access.level === 'BRANCH_ADMIN' &&
      this.structureAccess.canSee(access, {
        branchId: site.branchId ?? undefined,
      })
    )
      admin.add('BRANCH_ADMIN');

    const operational = new Set<InfraOperationalRole>();
    const assignments = await this.assignments(tx, actor.id, tenantId);
    const byConcept = new Map<string, InfraOperationalRole>(
      (
        Object.entries(INFRA_OPERATIONAL_ROLE_CONCEPTS) as [
          InfraOperationalRole,
          string,
        ][]
      ).map(([role, concept]) => [concept, role]),
    );
    for (const row of assignments) {
      const role = byConcept.get(row.role);
      if (!role || !this.contains(row, site, space)) continue;
      operational.add(role);
      for (const implied of IMPLIED_ROLES[role] ?? []) operational.add(implied);
    }
    if (roleAuthorizesInTenant(actor, 'BILLING', tenantId))
      operational.add('BILLING');

    return {
      tenantId,
      siteId: site.id,
      practiceId: site.practiceId,
      branchId: site.branchId,
      operational,
      admin,
      access,
    };
  }

  private async assignments(
    tx: EntityManager,
    userId: string,
    tenantId: string,
  ): Promise<AssignmentRow[]> {
    return tx.execute<AssignmentRow[]>(
      `select a.assignment_role_concept_id as role,
              a.access_scope_concept_id as scope,
              a.practice_id, a.practice_site_id, a.clinical_unit_id, a.care_space_id
         from delegated_access.organization_user_assignments a
         join directory.tenant_memberships m on m.id = a.tenant_membership_id
        where m.user_id = ? and m.tenant_id = ? and m.status_concept_id = ?
          and a.status_concept_id = ?
          and (a.valid_from is null or a.valid_from <= now())
          and (a.valid_to is null or a.valid_to > now())
          and a.assignment_role_concept_id in (${Object.values(
            INFRA_OPERATIONAL_ROLE_CONCEPTS,
          )
            .map(() => '?')
            .join(', ')})`,
      [
        userId,
        tenantId,
        DIR.MEMBERSHIP_ACTIVE,
        CONCEPTS.STATE_ACTIVE,
        ...Object.values(INFRA_OPERATIONAL_ROLE_CONCEPTS),
      ],
    );
  }

  private contains(
    row: AssignmentRow,
    site: { id: string; practiceId: string },
    space: SpaceContainment | null,
  ): boolean {
    switch (row.scope) {
      case DELEG.SCOPE_TENANT:
        return true;
      case DELEG.SCOPE_PRACTICE:
        return row.practice_id === site.practiceId;
      case DELEG.SCOPE_SITE:
        return row.practice_site_id === site.id;
      case DELEG.SCOPE_UNIT:
        return (
          !!space &&
          !!row.clinical_unit_id &&
          space.unitIds.has(row.clinical_unit_id)
        );
      case DELEG.SCOPE_SPACE:
        return (
          !!space &&
          !!row.care_space_id &&
          space.spaceIds.has(row.care_space_id)
        );
      default:
        return false;
    }
  }

  /** El espacio, sus ancestros y las unidades que los contienen (vínculos vigentes incluidos). */
  private async containment(
    tx: EntityManager,
    careSpaceId: string,
  ): Promise<SpaceContainment> {
    const rows = await tx.execute<
      {
        id: string;
        clinical_unit_id: string | null;
        assigned: string[] | null;
      }[]
    >(
      `with recursive path as (
         select id, parent_space_id, clinical_unit_id from practice.care_spaces where id = ?
         union
         select c.id, c.parent_space_id, c.clinical_unit_id
           from practice.care_spaces c join path p on c.id = p.parent_space_id
       )
       select p.id, p.clinical_unit_id,
              (select array_agg(a.clinical_unit_id)
                 from practice.space_unit_assignments a
                where a.care_space_id = p.id and a.valid_from <= now()
                  and (a.valid_to is null or a.valid_to > now())) as assigned
         from path p`,
      [careSpaceId],
    );
    const spaceIds = new Set<string>();
    const unitIds = new Set<string>();
    for (const row of rows) {
      spaceIds.add(row.id);
      if (row.clinical_unit_id) unitIds.add(row.clinical_unit_id);
      for (const unit of row.assigned ?? []) unitIds.add(unit);
    }
    return { spaceIds, unitIds };
  }

  private outOfScope(): ResourceNotFoundException {
    return new ResourceNotFoundException(
      'Recurso no encontrado',
      undefined,
      ClinicalErrorReason.ADT_RESOURCE_OUT_OF_SCOPE,
    );
  }
}
