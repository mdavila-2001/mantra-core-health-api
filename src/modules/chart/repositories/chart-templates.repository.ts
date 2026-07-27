import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { ChartTemplateAssignments, SpecialtyChartTemplates } from '../entities';
import { createdBy } from '../../../common';

/** Datos de alta de una asignación de plantilla de chart. */
export interface CreateAssignmentData {
  templateId: string;
  practiceId?: string;
  practitionerProfileId?: string;
  isDefault: boolean;
  statusConceptId: string;
  actorUserId?: string;
}

/** Filtro de scope para la regla "un solo default". */
export interface AssignmentScope {
  practiceId?: string;
  practitionerProfileId?: string;
}

/**
 * Acceso a datos de asignaciones de plantillas de chart por especialidad.
 * Métodos stateless que reciben el `EntityManager` activo.
 */
@Injectable()
export class ChartTemplatesRepository {
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
