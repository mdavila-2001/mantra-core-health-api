import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { DiagnosticUnitPractitionerAssignments } from '../entities';
import { createdBy } from '../../../common';
import { DUNIT } from '../diagnostic_units.concepts';

/** Datos de asignación de un especialista a la unidad/sitio (UC-23-10). */
export interface CreateAssignmentData {
  diagnosticUnitId: string;
  practitionerRoleAssignmentId: string;
  diagnosticUnitSiteId?: string;
  specialtyConceptId?: string;
  assignmentRoleConceptId?: string;
  mayValidateResults?: boolean;
  maySignReports?: boolean;
  validFrom?: Date;
  validTo?: Date;
  actorUserId?: string;
}

/** Acceso a datos de `diagnostic_units.diagnostic_unit_practitioner_assignments`. */
@Injectable()
export class DiagnosticUnitPractitionerAssignmentsRepository {
  findById(
    em: EntityManager,
    id: string,
  ): Promise<DiagnosticUnitPractitionerAssignments | null> {
    return em.findOne(DiagnosticUnitPractitionerAssignments, { id });
  }

  /** Asignación ACTIVA solapada del mismo profesional en el mismo rol/sitio. */
  findActiveOverlap(
    em: EntityManager,
    diagnosticUnitId: string,
    practitionerRoleAssignmentId: string,
    diagnosticUnitSiteId?: string,
  ): Promise<DiagnosticUnitPractitionerAssignments | null> {
    return em.findOne(DiagnosticUnitPractitionerAssignments, {
      diagnosticUnitId,
      practitionerRoleAssignmentId,
      diagnosticUnitSiteId: diagnosticUnitSiteId ?? null,
      statusConceptId: DUNIT.ASSIGNMENT_ACTIVE,
      validTo: null,
    });
  }

  create(em: EntityManager, data: CreateAssignmentData): DiagnosticUnitPractitionerAssignments {
    return em.create(
      DiagnosticUnitPractitionerAssignments,
      {
        diagnosticUnitId: data.diagnosticUnitId,
        practitionerRoleAssignmentId: data.practitionerRoleAssignmentId,
        diagnosticUnitSiteId: data.diagnosticUnitSiteId,
        specialtyConceptId: data.specialtyConceptId,
        assignmentRoleConceptId: data.assignmentRoleConceptId ?? DUNIT.ASSIGNMENT_ROLE_SPECIALIST,
        mayValidateResults: data.mayValidateResults,
        maySignReports: data.maySignReports,
        validFrom: data.validFrom,
        validTo: data.validTo,
        statusConceptId: DUNIT.ASSIGNMENT_ACTIVE,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
