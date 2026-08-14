import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { ChartTemplateAssignments, SpecialtyChartTemplates } from '../entities';
import {
  DynamicFieldDefinitions,
  DynamicFieldSections,
  FieldAssignments,
} from '../../forms/entities';
import { createdBy } from '../../../common';

/** Datos de alta de una plantilla de chart (sin su esquema de campos todavía). */
export interface CreateTemplateData {
  /** Especialidad a la que pertenece la plantilla. */
  specialtyConceptId: string;
  /** Tenant dueño de la plantilla, si no es global. */
  tenantId?: string;
  /** Código único de la plantilla. */
  code: string;
  /** Nombre legible de la plantilla. */
  name: string;
  /** Concept id del estado inicial. */
  statusConceptId: string;
  /** Identificador asociado a actor user. */
  actorUserId?: string;
}

/** Datos de alta de la sección que aloja el esquema de campos de una plantilla. */
export interface CreateTemplateSectionData {
  /** Código único de la sección. */
  code: string;
  /** Nombre legible de la sección. */
  name: string;
  /** Concept id del estado inicial. */
  stateConceptId?: string;
  /** Identificador asociado a actor user. */
  actorUserId?: string;
}

/** Datos de alta de un campo dinámico propio de una plantilla. */
export interface CreateTemplateFieldData {
  /** Código único del campo. */
  code: string;
  /** Nombre legible del campo. */
  name: string;
  /** Tipo de dato técnico. */
  dataType: string;
  /** Value set de valores permitidos, si aplica. */
  valueSetId?: string;
  /** Concept id del estado inicial. */
  stateConceptId: string;
  /** Identificador asociado a actor user. */
  actorUserId?: string;
}

/** Datos de alta de la asignación de un campo a la sección de una plantilla. */
export interface CreateTemplateFieldAssignmentData {
  /** Identificador asociado a field. */
  fieldId: string;
  /** Identificador asociado a target resource concept. */
  targetResourceConceptId: string;
  /** Identificador asociado a section. */
  sectionId: string;
  /** Identificador asociado a tenant. */
  tenantId?: string;
  /** Valor de required mantenido por la instancia. */
  required: boolean;
  /** Orden de presentación dentro de la plantilla. */
  ordinal?: number;
  /** Concept id del estado inicial. */
  stateConceptId: string;
  /** Identificador asociado a actor user. */
  actorUserId?: string;
}

/** Datos de alta de una asignación de plantilla de chart. */
export interface CreateAssignmentData {
  /**
   * Identificador asociado a template.
   */
  templateId: string;
  /**
   * Identificador asociado a practice.
   */
  practiceId?: string;
  /**
   * Identificador asociado a practitioner profile.
   */
  practitionerProfileId?: string;
  /**
   * Valor de is default mantenido por la instancia.
   */
  isDefault: boolean;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Filtro de scope para la regla "un solo default". */
export interface AssignmentScope {
  /**
   * Identificador asociado a practice.
   */
  practiceId?: string;
  /**
   * Identificador asociado a practitioner profile.
   */
  practitionerProfileId?: string;
}

/**
 * Acceso a datos de asignaciones de plantillas de chart por especialidad.
 * Métodos stateless que reciben el `EntityManager` activo.
 */
@Injectable()
export class ChartTemplatesRepository {
  /**
   * Obtiene find template by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find template by id conforme al contrato `Promise<SpecialtyChartTemplates | null>`.
   */
  findTemplateById(
    em: EntityManager,
    id: string,
  ): Promise<SpecialtyChartTemplates | null> {
    return em.findOne(SpecialtyChartTemplates, { id });
  }

  /** Asignaciones default vigentes dentro del mismo scope (practice + practitioner). */
  findActiveDefaults(
    em: EntityManager,
    statusConceptId: string,
    scope: AssignmentScope,
  ): Promise<ChartTemplateAssignments[]> {
    return em.find(ChartTemplateAssignments, {
      isDefault: true,
      statusConceptId,
      practiceId: scope.practiceId ?? null,
      practitionerProfileId: scope.practitionerProfileId ?? null,
    });
  }

  /**
   * Crea create assignment.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create assignment conforme al contrato `ChartTemplateAssignments`.
   */
  createAssignment(
    em: EntityManager,
    data: CreateAssignmentData,
  ): ChartTemplateAssignments {
    return em.create(
      ChartTemplateAssignments,
      {
        templateId: data.templateId,
        practiceId: data.practiceId,
        practitionerProfileId: data.practitionerProfileId,
        isDefault: data.isDefault,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /** Plantillas por especialidad, opcionalmente acotadas a una especialidad concreta. */
  findTemplates(
    em: EntityManager,
    specialtyConceptId?: string,
  ): Promise<SpecialtyChartTemplates[]> {
    return em.find(
      SpecialtyChartTemplates,
      specialtyConceptId ? { specialtyConceptId } : {},
      { orderBy: { name: 'ASC' } },
    );
  }

  /** Crea la plantilla; el esquema de campos se compone después, sobre su sección. */
  createTemplate(
    em: EntityManager,
    data: CreateTemplateData,
  ): SpecialtyChartTemplates {
    const { actorUserId, ...rest } = data;
    return em.create(
      SpecialtyChartTemplates,
      { ...rest, version: 1, ...createdBy(actorUserId) },
      { partial: true },
    );
  }

  /** Sección que aloja el esquema de campos de una plantilla (una por plantilla). */
  createTemplateSection(
    em: EntityManager,
    data: CreateTemplateSectionData,
  ): DynamicFieldSections {
    const { actorUserId, ...rest } = data;
    return em.create(
      DynamicFieldSections,
      { ...rest, ...createdBy(actorUserId) },
      { partial: true },
    );
  }

  /** Un campo propio de la especialidad, declarado junto con la plantilla. */
  createTemplateField(
    em: EntityManager,
    data: CreateTemplateFieldData,
  ): DynamicFieldDefinitions {
    const { actorUserId, ...rest } = data;
    return em.create(
      DynamicFieldDefinitions,
      { ...rest, schemaVersion: 1, ...createdBy(actorUserId) },
      { partial: true },
    );
  }

  /** Asigna un campo a la sección de la plantilla que lo declaró. */
  createTemplateFieldAssignment(
    em: EntityManager,
    data: CreateTemplateFieldAssignmentData,
  ): FieldAssignments {
    const { actorUserId, ...rest } = data;
    return em.create(
      FieldAssignments,
      {
        ...rest,
        visible: true,
        editable: true,
        ...createdBy(actorUserId),
      },
      { partial: true },
    );
  }

  /** Asignaciones de campo vigentes de la sección de una plantilla, en su orden de presentación. */
  findFieldAssignmentsBySection(
    em: EntityManager,
    sectionId: string,
  ): Promise<FieldAssignments[]> {
    return em.find(
      FieldAssignments,
      { sectionId },
      { orderBy: { ordinal: 'ASC' } },
    );
  }

  /** Definiciones de campo por id, para resolver el esquema de una plantilla. */
  findFieldDefinitionsByIds(
    em: EntityManager,
    ids: readonly string[],
  ): Promise<DynamicFieldDefinitions[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return em.find(DynamicFieldDefinitions, { id: { $in: [...ids] } });
  }
}
