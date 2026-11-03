import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS, createdBy, touch } from '../../../common';
import { DIR } from '../../directory/directory.concepts';
import { TenantMemberships } from '../../directory/entities';
import { PRAC } from '../../practice/practice.concepts';
import { DELEG } from '../delegated_access.concepts';

/**
 * Operaciones directas de persistencia para la provisión inmediata de personal
 * de apoyo (secretarias) por parte de doctores u organizaciones.
 */
@Injectable()
export class SupportStaffProvisioningRepository {
  /** Vinculación activa de un doctor con su organización. */
  async findActiveRoleAssignmentOfPractitioner(
    em: EntityManager,
    practitionerProfileId: string,
    roleAssignmentId: string,
  ): Promise<{
    id: string;
    tenantId: string;
    organizationName: string | null;
  } | null> {
    const rows = await em.execute<
      { id: string; tenant_id: string; organization_name: string | null }[]
    >(
      `SELECT pra.id, p.tenant_id, per.display_name AS organization_name
         FROM practice.practitioner_role_assignments pra
         JOIN practice.practices p ON p.id = pra.practice_id
         LEFT JOIN directory.tenants t ON t.id = p.tenant_id
         LEFT JOIN profiles.persons per ON per.id = t.organization_id
        WHERE pra.id = ? AND pra.practitioner_profile_id = ?
          AND pra.status_concept_id = ?`,
      [roleAssignmentId, practitionerProfileId, PRAC.ROLE_ASSIGNMENT_ACTIVE],
    );
    const row = rows[0];
    return row
      ? {
          id: row.id,
          tenantId: row.tenant_id,
          organizationName: row.organization_name,
        }
      : null;
  }

  /** Crea un vínculo secretaria-doctor con estado ACTIVE inmediato. */
  async createActivePractitionerLink(
    em: EntityManager,
    data: {
      readonly practitionerRoleAssignmentId: string;
      readonly supportPersonId: string;
      readonly actorUserId: string;
    },
  ): Promise<{ id: string }> {
    const id = randomUUID();
    const now = new Date();
    await em.execute(
      `INSERT INTO practice.practitioner_support_assignments
         (id, practitioner_role_assignment_id, support_profile_id,
          support_role_concept_id, status_concept_id,
          initiated_by_party_concept_id, valid_from, created_at, updated_at,
          created_by_user_id, updated_by_user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.practitionerRoleAssignmentId,
        data.supportPersonId,
        PRAC.SUPPORT_ROLE_SECRETARY,
        PRAC.SUPPORT_ACTIVE,
        DELEG.INITIATOR_PRACTITIONER,
        now,
        now,
        now,
        data.actorUserId,
        data.actorUserId,
      ],
    );
    return { id };
  }

  /** Crea un vínculo de lugar/organización con estado ACTIVE inmediato. */
  async createActiveLocationLink(
    em: EntityManager,
    data: {
      readonly tenantId: string;
      readonly tenantMembershipId: string;
      readonly practiceSiteId?: string;
      readonly clinicalUnitId?: string;
      readonly careSpaceId?: string;
      readonly accessScopeConceptId: string;
      readonly actorUserId: string;
    },
  ): Promise<{ id: string }> {
    const id = randomUUID();
    const now = new Date();
    const hasTenantCol = await em
      .execute<{ n: string | number }[]>(
        `SELECT count(*) AS n FROM information_schema.columns
          WHERE table_schema = 'delegated_access'
            AND table_name = 'organization_user_assignments'
            AND column_name = 'tenant_id'`,
      )
      .then((rows) => Number(rows[0]?.n ?? 0) > 0);

    const row: Record<string, unknown> = {
      id,
      tenant_membership_id: data.tenantMembershipId,
      practice_site_id: data.practiceSiteId ?? null,
      clinical_unit_id: data.clinicalUnitId ?? null,
      care_space_id: data.careSpaceId ?? null,
      assignment_role_concept_id: DELEG.ASSIGN_ROLE_SECRETARY,
      access_scope_concept_id: data.accessScopeConceptId,
      status_concept_id: CONCEPTS.STATE_ACTIVE,
      initiated_by_party_concept_id: DELEG.INITIATOR_ORGANIZATION,
      valid_from: now,
      created_at: now,
      updated_at: now,
      created_by_user_id: data.actorUserId,
      updated_by_user_id: data.actorUserId,
    };
    if (hasTenantCol) row.tenant_id = data.tenantId;

    const columns = Object.keys(row);
    await em.execute(
      `INSERT INTO delegated_access.organization_user_assignments
         (${columns.join(', ')})
       VALUES (${columns.map(() => '?').join(', ')})`,
      Object.values(row),
    );
    return { id };
  }

  /** Garantiza que la membresía de la secretaria en el tenant esté ACTIVE. */
  async ensureActiveTenantMembership(
    em: EntityManager,
    data: {
      readonly userId: string;
      readonly tenantId: string;
      readonly actorUserId: string;
    },
  ): Promise<TenantMemberships> {
    const existing = await em.findOne(
      TenantMemberships,
      {
        userId: data.userId,
        tenantId: data.tenantId,
      },
      { orderBy: { createdAt: 'ASC' } },
    );

    if (existing) {
      if (existing.statusConceptId !== DIR.MEMBERSHIP_ACTIVE) {
        existing.statusConceptId = DIR.MEMBERSHIP_ACTIVE;
        existing.startDate = new Date();
        touch(existing, data.actorUserId);
        await em.flush();
      }
      return existing;
    }

    const membership = em.create(
      TenantMemberships,
      {
        userId: data.userId,
        tenantId: data.tenantId,
        tenantRoleConceptId: DIR.ROLE_SUPPORT,
        statusConceptId: DIR.MEMBERSHIP_ACTIVE,
        accessScopeConceptId: DIR.SCOPE_ALL_TENANT,
        startDate: new Date(),
        invitedByUserId: data.actorUserId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
    await em.flush();
    return membership;
  }
}
