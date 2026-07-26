import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PractitionerRoleAssignments } from '../entities';
import { createdBy } from '../../../common';

/** Datos para asignar un rol de profesional a sitio/unidad/servicio. */
export interface CreateRoleAssignmentData {
  practitionerProfileId: string;
  practiceId: string;
  roleConceptId: string;
  statusConceptId: string;
  practiceSiteId?: string;
  clinicalUnitId?: string;
  healthcareServiceId?: string;
  specialtyConceptId?: string;
  supervisorPractitionerProfileId?: string;
  revenueSharePercent?: string;
  isPrimary?: boolean;
  validFrom?: Date;
  validTo?: Date;
  actorUserId?: string;
}

/** Acceso a datos de `practice.practitioner_role_assignments` (stateless). */
@Injectable()
export class PractitionerRoleAssignmentsRepository {
  findById(em: EntityManager, id: string): Promise<PractitionerRoleAssignments | null> {
    return em.findOne(PractitionerRoleAssignments, { id });
  }

  findBySite(em: EntityManager, practiceSiteId: string): Promise<PractitionerRoleAssignments[]> {
    return em.find(PractitionerRoleAssignments, { practiceSiteId });
  }

  create(em: EntityManager, data: CreateRoleAssignmentData): PractitionerRoleAssignments {
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
