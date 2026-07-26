import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { OrganizationUserAssignments } from '../entities';
import { createdBy } from '../../../common';

/** Datos para dar de alta una asignación de usuario de organización. */
export interface CreateOrgAssignmentData {
  tenantMembershipId: string;
  practiceId?: string;
  practiceSiteId?: string;
  clinicalUnitId?: string;
  careSpaceId?: string;
  diagnosticUnitId?: string;
  pharmacyId?: string;
  assignmentRoleConceptId: string;
  accessScopeConceptId: string;
  supervisorUserId?: string;
  validFrom?: Date;
  validTo?: Date;
  statusConceptId: string;
  actorUserId?: string;
}

/**
 * Acceso a datos de `delegated_access.organization_user_assignments`. Stateless:
 * cada método recibe el `EntityManager` activo para que el servicio controle la
 * transacción.
 */
@Injectable()
export class OrganizationUserAssignmentsRepository {
  findById(em: EntityManager, id: string): Promise<OrganizationUserAssignments | null> {
    return em.findOne(OrganizationUserAssignments, { id });
  }

  /** Asignación ACTIVA que solaparía el mismo rol+scope para la misma membresía. */
  findActiveOverlap(
    em: EntityManager,
    tenantMembershipId: string,
    assignmentRoleConceptId: string,
    accessScopeConceptId: string,
    activeStatusConceptId: string,
  ): Promise<OrganizationUserAssignments | null> {
    return em.findOne(OrganizationUserAssignments, {
      tenantMembershipId,
      assignmentRoleConceptId,
      accessScopeConceptId,
      statusConceptId: activeStatusConceptId,
    });
  }

  create(em: EntityManager, data: CreateOrgAssignmentData): OrganizationUserAssignments {
    return em.create(
      OrganizationUserAssignments,
      {
        tenantMembershipId: data.tenantMembershipId,
        practiceId: data.practiceId,
        practiceSiteId: data.practiceSiteId,
        clinicalUnitId: data.clinicalUnitId,
        careSpaceId: data.careSpaceId,
        diagnosticUnitId: data.diagnosticUnitId,
        pharmacyId: data.pharmacyId,
        assignmentRoleConceptId: data.assignmentRoleConceptId,
        accessScopeConceptId: data.accessScopeConceptId,
        supervisorUserId: data.supervisorUserId,
        validFrom: data.validFrom,
        validTo: data.validTo,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /** Asignaciones ACTIVAS ya vencidas (para el barrido de expiración). */
  findOverdueActive(
    em: EntityManager,
    now: Date,
    activeStatusConceptId: string,
  ): Promise<OrganizationUserAssignments[]> {
    return em.find(OrganizationUserAssignments, {
      statusConceptId: activeStatusConceptId,
      validTo: { $ne: null, $lt: now },
    });
  }
}
