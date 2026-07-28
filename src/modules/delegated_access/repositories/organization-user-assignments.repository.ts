import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { OrganizationUserAssignments } from '../entities';
import { createdBy } from '../../../common';

/** Datos para dar de alta una asignación de usuario de organización. */
export interface CreateOrgAssignmentData {
  /**
   * Identificador asociado a tenant membership.
   */
  tenantMembershipId: string;
  /**
   * Identificador asociado a practice.
   */
  practiceId?: string;
  /**
   * Identificador asociado a practice site.
   */
  practiceSiteId?: string;
  /**
   * Identificador asociado a clinical unit.
   */
  clinicalUnitId?: string;
  /**
   * Identificador asociado a care space.
   */
  careSpaceId?: string;
  /**
   * Identificador asociado a diagnostic unit.
   */
  diagnosticUnitId?: string;
  /**
   * Identificador asociado a pharmacy.
   */
  pharmacyId?: string;
  /**
   * Identificador asociado a assignment role concept.
   */
  assignmentRoleConceptId: string;
  /**
   * Identificador asociado a access scope concept.
   */
  accessScopeConceptId: string;
  /**
   * Identificador asociado a supervisor user.
   */
  supervisorUserId?: string;
  /**
   * Valor de valid from mantenido por la instancia.
   */
  validFrom?: Date;
  /**
   * Valor de valid to mantenido por la instancia.
   */
  validTo?: Date;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Acceso a datos de `delegated_access.organization_user_assignments`. Stateless:
 * cada método recibe el `EntityManager` activo para que el servicio controle la
 * transacción.
 */
@Injectable()
export class OrganizationUserAssignmentsRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<OrganizationUserAssignments | null>`.
   */
  findById(
    em: EntityManager,
    id: string,
  ): Promise<OrganizationUserAssignments | null> {
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

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `OrganizationUserAssignments`.
   */
  create(
    em: EntityManager,
    data: CreateOrgAssignmentData,
  ): OrganizationUserAssignments {
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
