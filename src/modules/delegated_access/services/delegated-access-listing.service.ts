import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  DEFAULT_KEYSET_PAGE_SIZE,
  ResourceNotFoundException,
  afterIdOf,
  toKeysetPage,
} from '../../../common';
import type {
  ListAccessRequestsResponseDto,
  ListPermissionSetItemsResponseDto,
  ListOrgUserAssignmentsResponseDto,
  ListPractitionerDelegatesResponseDto,
} from '../dto';

/** Opciones de paginación keyset de los listados del hub. */
interface PageOptions {
  cursor?: string;
  limit?: number;
}

type Row = Record<string, unknown>;

/**
 * CV-13 (BR-28): lecturas del hub `delegated-access`, que hasta ahora sólo
 * escribía. Ninguna de estas tablas tiene `tenant_id` propio: el tenant se
 * alcanza por `organization_user_assignments.tenant_membership_id →
 * directory.tenant_memberships.tenant_id`, así que cada consulta parte de
 * ese join y filtra por el tenant del actor. Nunca se lista el de otro.
 */
@Injectable()
export class DelegatedAccessListingService {
  constructor(private readonly em: EntityManager) {}

  /** Asignaciones de usuario de organización del tenant. */
  async listOrgUserAssignments(
    tenantId: string,
    options: PageOptions,
  ): Promise<ListOrgUserAssignmentsResponseDto> {
    const limit = options.limit ?? DEFAULT_KEYSET_PAGE_SIZE;
    const afterId = afterIdOf(options.cursor) ?? null;
    const rows = await this.fetch(
      `select a.id, a.tenant_membership_id, a.practice_id, a.practice_site_id,
              a.assignment_role_concept_id, a.access_scope_concept_id,
              a.status_concept_id, a.valid_from, a.valid_to, a.created_at
         from delegated_access.organization_user_assignments a
         join directory.tenant_memberships m on m.id = a.tenant_membership_id
        where m.tenant_id = ? and (?::uuid is null or a.id > ?::uuid)
        order by a.id
        limit ?`,
      [tenantId, afterId, afterId, limit + 1],
    );
    return toKeysetPage(
      rows.map((r) => ({
        id: r.id as string,
        tenantMembershipId: r.tenant_membership_id as string,
        practiceId: (r.practice_id as string | null) ?? undefined,
        practiceSiteId: (r.practice_site_id as string | null) ?? undefined,
        assignmentRoleConceptId: r.assignment_role_concept_id as string,
        accessScopeConceptId: r.access_scope_concept_id as string,
        statusConceptId: r.status_concept_id as string,
        validFrom: (r.valid_from as Date | null) ?? undefined,
        validTo: (r.valid_to as Date | null) ?? undefined,
        createdAt: r.created_at as Date,
      })),
      limit,
    );
  }

  /** Delegaciones de profesional a usuario de organización del tenant. */
  async listPractitionerDelegates(
    tenantId: string,
    options: PageOptions,
  ): Promise<ListPractitionerDelegatesResponseDto> {
    const limit = options.limit ?? DEFAULT_KEYSET_PAGE_SIZE;
    const afterId = afterIdOf(options.cursor) ?? null;
    const rows = await this.fetch(
      `select d.id, d.practitioner_role_assignment_id, d.delegate_user_assignment_id,
              d.delegated_permission_set_id, d.delegate_role_concept_id,
              d.status_concept_id, d.valid_from, d.valid_to, d.created_at
         from delegated_access.practitioner_delegate_assignments d
         join delegated_access.organization_user_assignments a
           on a.id = d.delegate_user_assignment_id
         join directory.tenant_memberships m on m.id = a.tenant_membership_id
        where m.tenant_id = ? and (?::uuid is null or d.id > ?::uuid)
        order by d.id
        limit ?`,
      [tenantId, afterId, afterId, limit + 1],
    );
    return toKeysetPage(
      rows.map((r) => ({
        id: r.id as string,
        practitionerRoleAssignmentId:
          r.practitioner_role_assignment_id as string,
        delegateUserAssignmentId: r.delegate_user_assignment_id as string,
        delegatedPermissionSetId: r.delegated_permission_set_id as string,
        delegateRoleConceptId: r.delegate_role_concept_id as string,
        statusConceptId: r.status_concept_id as string,
        validFrom: (r.valid_from as Date | null) ?? undefined,
        validTo: (r.valid_to as Date | null) ?? undefined,
        createdAt: r.created_at as Date,
      })),
      limit,
    );
  }

  /** Solicitudes de acceso delegado del tenant. */
  async listAccessRequests(
    tenantId: string,
    options: PageOptions,
  ): Promise<ListAccessRequestsResponseDto> {
    const limit = options.limit ?? DEFAULT_KEYSET_PAGE_SIZE;
    const afterId = afterIdOf(options.cursor) ?? null;
    const rows = await this.fetch(
      `select r.id, r.practitioner_delegate_assignment_id, r.requested_permission_id,
              r.patient_profile_id, r.status_concept_id, r.decision_concept_id,
              r.requested_at, r.decided_at
         from delegated_access.delegated_access_approval_requests r
         join delegated_access.practitioner_delegate_assignments d
           on d.id = r.practitioner_delegate_assignment_id
         join delegated_access.organization_user_assignments a
           on a.id = d.delegate_user_assignment_id
         join directory.tenant_memberships m on m.id = a.tenant_membership_id
        where m.tenant_id = ? and (?::uuid is null or r.id > ?::uuid)
        order by r.id
        limit ?`,
      [tenantId, afterId, afterId, limit + 1],
    );
    return toKeysetPage(
      rows.map((r) => ({
        id: r.id as string,
        practitionerDelegateAssignmentId:
          r.practitioner_delegate_assignment_id as string,
        requestedPermissionId: r.requested_permission_id as string,
        patientProfileId: (r.patient_profile_id as string | null) ?? undefined,
        statusConceptId: r.status_concept_id as string,
        decisionConceptId: r.decision_concept_id as string,
        requestedAt: (r.requested_at as Date | null) ?? undefined,
        decidedAt: (r.decided_at as Date | null) ?? undefined,
      })),
      limit,
    );
  }

  /**
   * Los permisos de un set delegado. `delegated_permission_sets` sí tiene
   * `tenant_id`: el set tiene que ser del tenant del actor, y uno ajeno o
   * inexistente responde el mismo 404.
   */
  async listPermissionSetItems(
    tenantId: string,
    setId: string,
  ): Promise<ListPermissionSetItemsResponseDto> {
    const [set] = await this.fetch(
      `select id from delegated_access.delegated_permission_sets
        where id = ? and tenant_id = ?`,
      [setId, tenantId],
    );
    if (!set) {
      throw new ResourceNotFoundException('Set de permisos no encontrado', {
        setId,
      });
    }
    const rows = await this.fetch(
      `select id, permission_id, requires_step_up_authentication, constraint_json
         from delegated_access.delegated_permission_set_items
        where delegated_permission_set_id = ?
        order by id`,
      [setId],
    );
    return {
      permissionSetId: setId,
      items: rows.map((r) => ({
        id: r.id as string,
        permissionId: r.permission_id as string,
        requiresStepUpAuthentication:
          (r.requires_step_up_authentication as boolean | null) ?? undefined,
        constraint:
          (r.constraint_json as Record<string, unknown> | null) ?? undefined,
      })),
    };
  }

  private fetch(sql: string, params: unknown[]): Promise<Row[]> {
    return this.em.fork().getConnection().execute<Row[]>(sql, params);
  }
}
