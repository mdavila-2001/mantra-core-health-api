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
  /**
   * Valor de code mantenido por la instancia.
   */
  code: string;
  /**
   * Valor de name mantenido por la instancia.
   */
  name: string;
  /**
   * Valor de ordinal mantenido por la instancia.
   */
  ordinal?: number;
  /**
   * Identificador asociado a state concept.
   */
  stateConceptId?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Alta de una asignación de campo a un target. */
export interface CreateAssignmentData {
  /**
   * Identificador asociado a field.
   */
  fieldId: string;
  /**
   * Identificador asociado a target resource concept.
   */
  targetResourceConceptId: string;
  /**
   * Identificador asociado a section.
   */
  sectionId: string;
  /**
   * Identificador asociado a profile type concept.
   */
  profileTypeConceptId?: string;
  /**
   * Identificador asociado a tenant.
   */
  tenantId?: string;
  /**
   * Identificador asociado a branch.
   */
  branchId?: string;
  /**
   * Valor de required mantenido por la instancia.
   */
  required: boolean;
  /**
   * Valor de visible mantenido por la instancia.
   */
  visible: boolean;
  /**
   * Valor de editable mantenido por la instancia.
   */
  editable: boolean;
  /**
   * Valor de ordinal mantenido por la instancia.
   */
  ordinal?: number;
  /**
   * Identificador asociado a state concept.
   */
  stateConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
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

  /**
   * Crea create section.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create section conforme al contrato `DynamicFieldSections`.
   */
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

  /**
   * Crea create assignment.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create assignment conforme al contrato `FieldAssignments`.
   */
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
