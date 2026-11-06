import { Injectable } from '@nestjs/common';
import { UniqueConstraintViolationException } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { deterministicId } from '../../../common';
import {
  StandardTemplatesRepository,
  TemplatesRepository,
} from '../repositories';
import { ANSWER_TYPE_BY_CODE, SURVEYS } from '../surveys.concepts';
import { DEFAULT_RESPONSE_WINDOW_DAYS } from '../surveys.constants';
import type { StandardSurvey } from '../surveys-standard.catalog';

/** La plantilla importada, lista para asignar. */
export interface ImportedTemplate {
  /** Plantilla propia del profesional. */
  templateId: string;
  /** Versión publicada que se reparte. */
  versionId: string;
}

/**
 * Ids deterministas de la plantilla que un profesional importa del catálogo.
 *
 * Derivados de `(tenant, profesional, código)`: dos importaciones simultáneas
 * escriben las mismas filas y la clave primaria (o el índice único
 * `uq_survey_templates_practitioner_catalog_code`) resuelve la carrera, igual
 * que la encuesta base del sistema.
 *
 * @param tenantId - Organización.
 * @param practitionerProfileId - Profesional dueño.
 * @param code - Código `STD_*` del catálogo.
 * @returns Los ids de plantilla, versión 1 y de cada pregunta por posición.
 */
export function standardSurveyIds(
  tenantId: string,
  practitionerProfileId: string,
  code: string,
): {
  /** Plantilla. */
  templateId: string;
  /** Versión 1. */
  versionId: string;
  /** Id de la pregunta en esa posición (desde 1). */
  questionId: (position: number) => string;
} {
  const key = (...parts: (string | number)[]) =>
    deterministicId(
      ['surveys', 'standard', ...parts, tenantId, practitionerProfileId, code]
        .map(String)
        .join(':'),
    );
  return {
    templateId: key('template'),
    versionId: key('version', 1),
    questionId: (position) => key('question', 1, position),
  };
}

/**
 * Materializa, de forma idempotente, la plantilla propia de un profesional a
 * partir de una entrada del catálogo estándar: plantilla activa con
 * `standard_catalog_code`, versión 1 publicada e inmutable y sus preguntas,
 * siempre opcionales (regla del servidor para las preguntas del profesional).
 */
@Injectable()
export class StandardSurveyMaterializer {
  constructor(
    private readonly em: EntityManager,
    private readonly templatesRepo: TemplatesRepository,
    private readonly standardRepo: StandardTemplatesRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(StandardSurveyMaterializer.name);
  }

  /**
   * Garantiza la plantilla y devuelve su versión publicada vigente.
   *
   * Escribe en un savepoint de la petición (como la encuesta base del
   * sistema): si una importación simultánea gana la carrera de la clave, se
   * descarta sólo el savepoint y se relee lo que escribió la otra.
   */
  async materialize(
    tenantId: string,
    practitionerProfileId: string,
    entry: StandardSurvey,
    actorUserId: string,
  ): Promise<ImportedTemplate> {
    const read = () =>
      this.readImported(
        this.em.fork({ keepTransactionContext: true }),
        tenantId,
        practitionerProfileId,
        entry.code,
      );
    const existing = await read();
    if (existing) return existing;

    try {
      await this.em
        .fork({ keepTransactionContext: true })
        .transactional((tx) =>
          this.write(tx, tenantId, practitionerProfileId, entry, actorUserId),
        );
    } catch (error) {
      if (!(error instanceof UniqueConstraintViolationException)) throw error;
    }

    const created = await read();
    if (!created) {
      throw new Error(
        `La plantilla ${entry.code} del profesional no quedó materializada`,
      );
    }
    return created;
  }

  /**
   * La plantilla importada y su versión publicada más alta (el profesional
   * pudo abrir una versión siguiente; un borrador no se reparte).
   */
  private async readImported(
    em: EntityManager,
    tenantId: string,
    practitionerProfileId: string,
    code: string,
  ): Promise<ImportedTemplate | null> {
    const template = await this.standardRepo.findByCatalogCode(
      em,
      tenantId,
      practitionerProfileId,
      code,
    );
    if (!template) return null;
    const versions = await this.templatesRepo.listVersions(em, template.id);
    const published = versions
      .filter((v) => v.publicationStatusConceptId === SURVEYS.VERSION_PUBLISHED)
      .pop();
    if (!published) return null;
    return { templateId: template.id, versionId: published.id };
  }

  /** Escribe la plantilla, su versión 1 publicada y sus preguntas. */
  private async write(
    tx: EntityManager,
    tenantId: string,
    practitionerProfileId: string,
    entry: StandardSurvey,
    actorUserId: string,
  ): Promise<void> {
    const ids = standardSurveyIds(tenantId, practitionerProfileId, entry.code);
    const now = new Date();

    if (!(await this.templatesRepo.findTemplateById(tx, ids.templateId))) {
      this.standardRepo.create(tx, {
        id: ids.templateId,
        tenantId,
        ownerPractitionerId: practitionerProfileId,
        standardCatalogCode: entry.code,
        title: entry.title,
        description: entry.description,
        statusConceptId: SURVEYS.TEMPLATE_ACTIVE,
        actorUserId,
      });
      await tx.flush();
    }

    if (!(await this.templatesRepo.findVersionById(tx, ids.versionId))) {
      this.templatesRepo.createVersion(tx, {
        id: ids.versionId,
        surveyTemplateId: ids.templateId,
        versionNumber: 1,
        publicationStatusConceptId: SURVEYS.VERSION_PUBLISHED,
        responseWindowDays: DEFAULT_RESPONSE_WINDOW_DAYS,
        effectiveFrom: now,
        publishedAt: now,
        actorUserId,
      });
      await tx.flush();
    }

    for (const [index, question] of entry.questions.entries()) {
      const position = index + 1;
      const questionId = ids.questionId(position);
      if (await this.templatesRepo.findQuestionById(tx, questionId)) continue;
      this.templatesRepo.createQuestion(tx, {
        id: questionId,
        surveyVersionId: ids.versionId,
        position,
        questionText: question.text,
        answerTypeConceptId: ANSWER_TYPE_BY_CODE[question.answerType],
        required: false,
        options: question.options ? [...question.options] : undefined,
        scaleMin: question.scaleMin,
        scaleMax: question.scaleMax,
        actorUserId,
      });
    }
    await tx.flush();

    this.logger.info(
      {
        operation: 'surveys.standard.materialize',
        catalogCode: entry.code,
        templateId: ids.templateId,
      },
      'Standard survey materialized',
    );
  }
}
