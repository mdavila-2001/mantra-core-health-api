import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  FieldAssignments,
  ExtensionTargetPolicies,
  DynamicFieldSections,
} from '../entities';
import { createdBy } from '../../../common';

/** Alta de una sección por defecto para alojar asignaciones. */
export interface CreateSectionData {
  code: string;
  name: string;
  ordinal?: number;
  stateConceptId?: string;
  actorUserId?: string;
}

/** Alta de una asignación de campo a un target. */
export interface CreateAssignmentData {
  fieldId: string;
  targetResourceConceptId: string;
  sectionId: string;
  profileTypeConceptId?: string;
  tenantId?: string;
  branchId?: string;
  required: boolean;
  visible: boolean;
  editable: boolean;
  ordinal?: number;
  stateConceptId: string;
  actorUserId?: string;
}

/**
 * Acceso a datos de `forms.field_assignments`, la política de extensibilidad que
 * las gobierna y las secciones que las contienen.
 */
@Injectable()
export class AssignmentsRepository {
  /** Política de extensibilidad activa para un target (enforcement de gobernanza). */
  findActivePolicy(
    em: EntityManager,
    targetResourceConceptId: string,
    statusConceptId: string,
  ): Promise<ExtensionTargetPolicies | null> {
    return em.findOne(ExtensionTargetPolicies, {
      targetResourceConceptId,
      statusConceptId,
    });
  }

  /** Cuenta asignaciones activas para un target (presupuesto de campos). */
  countActiveAssignments(
    em: EntityManager,
    targetResourceConceptId: string,
    stateConceptId: string,
  ): Promise<number> {
    return em.count(FieldAssignments, {
      targetResourceConceptId,
      stateConceptId,
    });
  }

  createSection(
    em: EntityManager,
    data: CreateSectionData,
  ): DynamicFieldSections {
    const { actorUserId, ...rest } = data;
    return em.create(
      DynamicFieldSections,
      { ...rest, ...createdBy(actorUserId) },
      { partial: true },
    );
  }

  createAssignment(
    em: EntityManager,
    data: CreateAssignmentData,
  ): FieldAssignments {
    const { actorUserId, ...rest } = data;
    return em.create(
      FieldAssignments,
      { ...rest, ...createdBy(actorUserId) },
      { partial: true },
    );
  }
}
