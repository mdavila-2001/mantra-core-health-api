import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PractitionerRoleAssignments } from '../entities';
import { createdBy } from '../../../common';

/** Datos para asignar un rol de profesional a sitio/unidad/servicio. */
export interface CreateRoleAssignmentData {
  /**
   * Identificador asociado a practitioner profile.
   */
  practitionerProfileId: string;
  /**
   * Identificador asociado a practice.
   */
  practiceId: string;
  /**
   * Identificador asociado a role concept.
   */
  roleConceptId: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a practice site.
   */
  practiceSiteId?: string;
  /**
   * Identificador asociado a clinical unit.
   */
  clinicalUnitId?: string;
  /**
   * Identificador asociado a healthcare service.
   */
  healthcareServiceId?: string;
  /**
   * Identificador asociado a specialty concept.
   */
  specialtyConceptId?: string;
  /**
   * Identificador asociado a supervisor practitioner profile.
   */
  supervisorPractitionerProfileId?: string;
  /**
   * Valor de revenue share percent mantenido por la instancia.
   */
  revenueSharePercent?: string;
  /**
   * Valor de is primary mantenido por la instancia.
   */
  isPrimary?: boolean;
  /**
   * Valor de valid from mantenido por la instancia.
   */
  validFrom?: Date;
  /**
   * Valor de valid to mantenido por la instancia.
   */
  validTo?: Date;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `practice.practitioner_role_assignments` (stateless). */
@Injectable()
export class PractitionerRoleAssignmentsRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<PractitionerRoleAssignments | null>`.
   */
  findById(
    em: EntityManager,
    id: string,
  ): Promise<PractitionerRoleAssignments | null> {
    return em.findOne(PractitionerRoleAssignments, { id });
  }

  /**
   * Obtiene find by site.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param practiceSiteId - Identificador de practice site.
   * @returns Resultado de find by site conforme al contrato `Promise<PractitionerRoleAssignments[]>`.
   */
  findBySite(
    em: EntityManager,
    practiceSiteId: string,
  ): Promise<PractitionerRoleAssignments[]> {
    return em.find(PractitionerRoleAssignments, { practiceSiteId });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `PractitionerRoleAssignments`.
   */
  create(
    em: EntityManager,
    data: CreateRoleAssignmentData,
  ): PractitionerRoleAssignments {
    return em.create(
      PractitionerRoleAssignments,
      {
        practitionerProfileId: data.practitionerProfileId,
        practiceId: data.practiceId,
        practiceSiteId: data.practiceSiteId,
        clinicalUnitId: data.clinicalUnitId,
        healthcareServiceId: data.healthcareServiceId,
        roleConceptId: data.roleConceptId,
        specialtyConceptId: data.specialtyConceptId,
        supervisorPractitionerProfileId: data.supervisorPractitionerProfileId,
        revenueSharePercent: data.revenueSharePercent,
        isPrimary: data.isPrimary,
        validFrom: data.validFrom,
        validTo: data.validTo,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
