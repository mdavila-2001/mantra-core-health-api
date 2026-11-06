import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { SurveyTemplates, SurveyVersions } from '../entities';
import { createdBy } from '../../../common';

/** Alta de una plantilla importada del catálogo estándar. */
export interface CreateImportedTemplateData {
  /** Id determinista (`standardSurveyIds`). */
  id: string;
  /** Organización. */
  tenantId: string;
  /** Profesional dueño. */
  ownerPractitionerId: string;
  /** Código `STD_*` de procedencia. */
  standardCatalogCode: string;
  /** Título. */
  title: string;
  /** Consigna. */
  description?: string;
  /** Estado de la plantilla. */
  statusConceptId: string;
  /** Quien la crea. */
  actorUserId?: string;
}

/**
 * Lecturas y alta de las plantillas importadas del catálogo estándar
 * (`survey_templates.standard_catalog_code`, v4.2.91), y las lecturas por lote
 * que necesita la vista de encuestas por servicio.
 */
@Injectable()
export class StandardTemplatesRepository {
  /**
   * La plantilla que un profesional ya importó con ese código, si existe
   * (`uq_survey_templates_practitioner_catalog_code`).
   */
  findByCatalogCode(
    em: EntityManager,
    tenantId: string,
    ownerPractitionerId: string,
    standardCatalogCode: string,
  ): Promise<SurveyTemplates | null> {
    return em.findOne(SurveyTemplates, {
      tenantId,
      ownerPractitionerId,
      standardCatalogCode,
    });
  }

  /** Crea la plantilla importada. */
  create(em: EntityManager, data: CreateImportedTemplateData): SurveyTemplates {
    const { actorUserId, ...rest } = data;
    return em.create(
      SurveyTemplates,
      { ...rest, ...createdBy(actorUserId) },
      { partial: true },
    );
  }

  /** Plantillas por identificador, de una sola consulta. */
  findTemplatesByIds(
    em: EntityManager,
    ids: readonly string[],
  ): Promise<SurveyTemplates[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return em.find(SurveyTemplates, { id: { $in: [...ids] } });
  }

  /** Versiones por identificador, de una sola consulta. */
  findVersionsByIds(
    em: EntityManager,
    ids: readonly string[],
  ): Promise<SurveyVersions[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return em.find(SurveyVersions, { id: { $in: [...ids] } });
  }
}
