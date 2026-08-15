import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { SurveyTemplates, SurveyVersions, SurveyQuestions } from '../entities';
import { createdBy } from '../../../common';

/** Alta de una plantilla de encuesta. */
export interface CreateTemplateData {
  /**
   * Identificador asociado a tenant.
   */
  tenantId: string;
  /**
   * Identificador asociado a owner practitioner.
   */
  ownerPractitionerId: string;
  /**
   * Valor de title mantenido por la instancia.
   */
  title: string;
  /**
   * Valor de description mantenido por la instancia.
   */
  description?: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Alta de una versión de la plantilla. */
export interface CreateVersionData {
  /**
   * Identificador asociado a survey template.
   */
  surveyTemplateId: string;
  /**
   * Valor de version number mantenido por la instancia.
   */
  versionNumber: number;
  /**
   * Identificador asociado a publication status concept.
   */
  publicationStatusConceptId: string;
  /**
   * Valor de response window days mantenido por la instancia.
   */
  responseWindowDays: number;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Alta de una pregunta dentro de una versión en borrador. */
export interface CreateQuestionData {
  /**
   * Identificador asociado a survey version.
   */
  surveyVersionId: string;
  /**
   * Valor de position mantenido por la instancia.
   */
  position: number;
  /**
   * Valor de question text mantenido por la instancia.
   */
  questionText: string;
  /**
   * Identificador asociado a answer type concept.
   */
  answerTypeConceptId: string;
  /**
   * Valor de required mantenido por la instancia.
   */
  required: boolean;
  /**
   * Valor de options mantenido por la instancia.
   */
  options?: string[];
  /**
   * Valor de scale min mantenido por la instancia.
   */
  scaleMin?: number;
  /**
   * Valor de scale max mantenido por la instancia.
   */
  scaleMax?: number;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `surveys.survey_templates`, `_versions` y `_questions`. */
@Injectable()
export class TemplatesRepository {
  /**
   * Obtiene find template by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de la plantilla.
   * @returns Resultado conforme al contrato `Promise<SurveyTemplates | null>`.
   */
  findTemplateById(
    em: EntityManager,
    id: string,
  ): Promise<SurveyTemplates | null> {
    return em.findOne(SurveyTemplates, { id });
  }

  /**
   * Lista las plantillas de un profesional, más recientes primero.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Identificador de la organización.
   * @param ownerPractitionerId - Identificador del profesional dueño.
   * @returns Resultado conforme al contrato `Promise<SurveyTemplates[]>`.
   */
  listTemplatesByOwner(
    em: EntityManager,
    tenantId: string,
    ownerPractitionerId: string,
  ): Promise<SurveyTemplates[]> {
    return em.find(
      SurveyTemplates,
      { tenantId, ownerPractitionerId },
      { orderBy: { createdAt: 'desc' } },
    );
  }

  /**
   * Crea la plantilla.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Datos del alta.
   * @returns Resultado conforme al contrato `SurveyTemplates`.
   */
  createTemplate(em: EntityManager, data: CreateTemplateData): SurveyTemplates {
    const { actorUserId, ...rest } = data;
    return em.create(
      SurveyTemplates,
      { ...rest, ...createdBy(actorUserId) },
      { partial: true },
    );
  }

  /**
   * Obtiene find version by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de la versión.
   * @returns Resultado conforme al contrato `Promise<SurveyVersions | null>`.
   */
  findVersionById(
    em: EntityManager,
    id: string,
  ): Promise<SurveyVersions | null> {
    return em.findOne(SurveyVersions, { id });
  }

  /**
   * Obtiene la versión de mayor número de una plantilla.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param surveyTemplateId - Identificador de la plantilla.
   * @returns Resultado conforme al contrato `Promise<SurveyVersions | null>`.
   */
  findLatestVersion(
    em: EntityManager,
    surveyTemplateId: string,
  ): Promise<SurveyVersions | null> {
    return em.findOne(
      SurveyVersions,
      { surveyTemplateId },
      { orderBy: { versionNumber: 'desc' } },
    );
  }

  /**
   * Obtiene la versión con un número concreto dentro de la plantilla.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param surveyTemplateId - Identificador de la plantilla.
   * @param versionNumber - Número de versión buscado.
   * @returns Resultado conforme al contrato `Promise<SurveyVersions | null>`.
   */
  findVersionByNumber(
    em: EntityManager,
    surveyTemplateId: string,
    versionNumber: number,
  ): Promise<SurveyVersions | null> {
    return em.findOne(SurveyVersions, { surveyTemplateId, versionNumber });
  }

  /**
   * Crea la versión.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Datos del alta.
   * @returns Resultado conforme al contrato `SurveyVersions`.
   */
  createVersion(em: EntityManager, data: CreateVersionData): SurveyVersions {
    const { actorUserId, ...rest } = data;
    return em.create(
      SurveyVersions,
      { ...rest, ...createdBy(actorUserId) },
      { partial: true },
    );
  }

  /**
   * Lista las preguntas de una versión en orden de presentación.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param surveyVersionId - Identificador de la versión.
   * @returns Resultado conforme al contrato `Promise<SurveyQuestions[]>`.
   */
  listQuestions(
    em: EntityManager,
    surveyVersionId: string,
  ): Promise<SurveyQuestions[]> {
    return em.find(
      SurveyQuestions,
      { surveyVersionId },
      { orderBy: { position: 'asc' } },
    );
  }

  /**
   * Cuenta las preguntas de una versión.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param surveyVersionId - Identificador de la versión.
   * @returns Resultado conforme al contrato `Promise<number>`.
   */
  countQuestions(em: EntityManager, surveyVersionId: string): Promise<number> {
    return em.count(SurveyQuestions, { surveyVersionId });
  }

  /**
   * Crea la pregunta.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Datos del alta.
   * @returns Resultado conforme al contrato `SurveyQuestions`.
   */
  createQuestion(em: EntityManager, data: CreateQuestionData): SurveyQuestions {
    const { actorUserId, ...rest } = data;
    return em.create(
      SurveyQuestions,
      { ...rest, ...createdBy(actorUserId) },
      { partial: true },
    );
  }
}
