import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { DiagnosticUnitPractitionerAssignments } from '../entities';
import { createdBy } from '../../../common';
import { DUNIT } from '../diagnostic_units.concepts';

/** Datos de asignación de un especialista a la unidad/sitio (UC-23-10). */
export interface CreateAssignmentData {
  /**
   * Identificador asociado a diagnostic unit.
   */
  diagnosticUnitId: string;
  /**
   * Identificador asociado a practitioner role assignment.
   */
  practitionerRoleAssignmentId: string;
  /**
   * Identificador asociado a diagnostic unit site.
   */
  diagnosticUnitSiteId?: string;
  /**
   * Identificador asociado a specialty concept.
   */
  specialtyConceptId?: string;
  /**
   * Identificador asociado a assignment role concept.
   */
  assignmentRoleConceptId?: string;
  /**
   * Valor de may validate results mantenido por la instancia.
   */
  mayValidateResults?: boolean;
  /**
   * Valor de may sign reports mantenido por la instancia.
   */
  maySignReports?: boolean;
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

/** Acceso a datos de `diagnostic_units.diagnostic_unit_practitioner_assignments`. */
@Injectable()
export class DiagnosticUnitPractitionerAssignmentsRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<DiagnosticUnitPractitionerAssignments | null>`.
   */
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

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `DiagnosticUnitPractitionerAssignments`.
   */
  create(
    em: EntityManager,
    data: CreateAssignmentData,
  ): DiagnosticUnitPractitionerAssignments {
    return em.create(
      DiagnosticUnitPractitionerAssignments,
      {
        diagnosticUnitId: data.diagnosticUnitId,
        practitionerRoleAssignmentId: data.practitionerRoleAssignmentId,
        diagnosticUnitSiteId: data.diagnosticUnitSiteId,
        specialtyConceptId: data.specialtyConceptId,
        assignmentRoleConceptId:
          data.assignmentRoleConceptId ?? DUNIT.ASSIGNMENT_ROLE_SPECIALIST,
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
