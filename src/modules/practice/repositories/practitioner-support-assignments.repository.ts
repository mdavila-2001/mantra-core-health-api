import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PractitionerSupportAssignments } from '../entities';
import { createdBy } from '../../../common';

/** Datos para adjuntar personal de apoyo a un rol de profesional. */
export interface CreateSupportAssignmentData {
  practitionerRoleAssignmentId: string;
  supportProfileId: string;
  supportRoleConceptId: string;
  statusConceptId: string;
  scopeConceptId?: string;
  validFrom?: Date;
  validTo?: Date;
  actorUserId?: string;
}

/** Acceso a datos de `practice.practitioner_support_assignments` (stateless). */
@Injectable()
export class PractitionerSupportAssignmentsRepository {
  findById(
    em: EntityManager,
    id: string,
  ): Promise<PractitionerSupportAssignments | null> {
    return em.findOne(PractitionerSupportAssignments, { id });
  }

  create(
    em: EntityManager,
    data: CreateSupportAssignmentData,
  ): PractitionerSupportAssignments {
    return em.create(
      PractitionerSupportAssignments,
      {
        practitionerRoleAssignmentId: data.practitionerRoleAssignmentId,
        supportProfileId: data.supportProfileId,
        supportRoleConceptId: data.supportRoleConceptId,
        scopeConceptId: data.scopeConceptId,
        validFrom: data.validFrom,
        validTo: data.validTo,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
