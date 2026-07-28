import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { ChartTemplateAssignments, SpecialtyChartTemplates } from '../entities';
import { createdBy } from '../../../common';

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
}
