import { Injectable } from '@nestjs/common';
import { UniqueConstraintViolationException } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { deterministicId, touch } from '../../../common';
import { AssignmentsRepository, TemplatesRepository } from '../repositories';
import {
  SYSTEM_BASE_RESPONSE_WINDOW_DAYS,
  SYSTEM_BASE_SURVEYS,
  SYSTEM_BASE_SURVEY_VERSION,
  type SystemSurveyKind,
} from '../surveys.base-definitions';
import {
  ANSWER_TYPE_BY_CODE,
  SURVEYS,
  SYSTEM_OWNER_TYPE_BY_KIND,
} from '../surveys.concepts';

/**
 * La encuesta base de un tenant, lista para repartirse.
 *
 * Son sólo identificadores y el plazo: el emisor no necesita más, y devolver
 * entidades administradas por otro `EntityManager` invitaría a mutarlas.
 */
export interface SystemSurvey {
  /** Tipo de encuesta base. */
  kind: SystemSurveyKind;
  /** Plantilla de sistema del tenant. */
  templateId: string;
  /** Versión vigente de la base. */
  versionId: string;
  /** Asignación de sistema a la que cuelgan las invitaciones base. */
  assignmentId: string;
  /** Plazo, en días, para responder la invitación base. */
  responseWindowDays: number;
}

/**
 * Ids deterministas de la encuesta base de un tenant.
 *
 * Derivados de `(tenant, tipo, versión del contenido, posición)`: dos réplicas
 * que materializan a la vez escriben las mismas filas, y la clave primaria
 * resuelve la carrera. También permite a otros módulos (el resumen del médico)
 * saber qué pregunta es cuál sin consultar la base.
 *
 * @param tenantId - Organización.
 * @param kind - Tipo de encuesta base.
 * @param versionNumber - Versión del contenido (`SYSTEM_BASE_SURVEY_VERSION`).
 * @returns Los ids de plantilla, versión, asignación y de cada pregunta por posición.
 */
export function systemSurveyIds(
  tenantId: string,
  kind: SystemSurveyKind,
  versionNumber: number = SYSTEM_BASE_SURVEY_VERSION,
): {
  /** Plantilla. */
  templateId: string; /** Versión. */
  versionId: string; /** Asignación de sistema. */
  assignmentId: string; /** Id de la pregunta en esa posición (desde 1). */
  questionId: (position: number) => string;
} {
  const key = (...parts: (string | number)[]) =>
    deterministicId(['surveys', 'system-base', ...parts].join(':'));
  return {
    templateId: key('template', tenantId, kind),
    versionId: key('version', tenantId, kind, versionNumber),
    assignmentId: key('assignment', tenantId, kind, versionNumber),
    questionId: (position) =>
      key('question', tenantId, kind, versionNumber, position),
  };
}

/**
 * Materializa la encuesta base del sistema en un tenant.
 *
 * La base se define en código y se escribe en la base de datos la primera vez
 * que hace falta: una plantilla por tenant y por tipo, sin profesional dueño
 * (dueño tipado: el tenant), con su versión publicada, sus preguntas y la
 * asignación de sistema de la que cuelgan las invitaciones. Todo con ids
 * deterministas, así que pedirla de nuevo no crea nada y dos pedidos
 * simultáneos no se duplican.
 *
 * Cuando cambia el contenido (`SYSTEM_BASE_SURVEY_VERSION`) se publica la
 * versión nueva y se retira la anterior; las invitaciones y respuestas ya
 * dadas siguen apuntando a la suya.
 */
@Injectable()
export class SurveysSystemTemplatesService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param templatesRepo - Acceso a plantillas, versiones y preguntas.
   * @param assignmentsRepo - Acceso a asignaciones.
   * @param logger - Registro estructurado del módulo.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly templatesRepo: TemplatesRepository,
    private readonly assignmentsRepo: AssignmentsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(SurveysSystemTemplatesService.name);
  }

  /**
   * Garantiza que el tenant tenga la encuesta base del tipo indicado y la
   * devuelve. Idempotente.
   *
   * Corre en su propia transacción —no en la del emisor— a propósito: si dos
   * emisiones simultáneas la crean a la vez, la que pierde recibe una violación
   * de clave primaria que deja *su* transacción inservible; aislada, la
   * recupera releyendo lo que ganó la otra sin arrastrar la reserva.
   *
   * @param tenantId - Organización.
   * @param kind - Consulta o servicio.
   * @param actorUserId - Quien dispara la creación, para la auditoría de filas.
   * @returns Los identificadores de la base lista para repartir.
   */
  async ensureSystemTemplate(
    tenantId: string,
    kind: SystemSurveyKind,
    actorUserId?: string,
  ): Promise<SystemSurvey> {
    const ids = systemSurveyIds(tenantId, kind);
    const existing = await this.read(this.em.fork(), tenantId, kind);
    if (existing) return existing;

    try {
      await this.em
        .fork()
        .transactional((tx) =>
          this.materialize(tx, tenantId, kind, actorUserId),
        );
    } catch (error) {
      // Otra solicitud la materializó primero: lo que escribió es idéntico.
      if (!(error instanceof UniqueConstraintViolationException)) throw error;
    }

    const created = await this.read(this.em.fork(), tenantId, kind);
    if (!created) {
      throw new Error(
        `La encuesta base ${kind} del tenant no quedó materializada (plantilla ${ids.templateId})`,
      );
    }
    this.logger.info(
      { operation: 'surveys.system.ensure', kind, templateId: ids.templateId },
      'System base survey ensured',
    );
    return created;
  }

  /** Lee la base si está completa (plantilla, versión publicada, preguntas y asignación). */
  private async read(
    em: EntityManager,
    tenantId: string,
    kind: SystemSurveyKind,
  ): Promise<SystemSurvey | null> {
    const ids = systemSurveyIds(tenantId, kind);
    const [version, assignment] = await Promise.all([
      this.templatesRepo.findVersionById(em, ids.versionId),
      this.assignmentsRepo.findById(em, ids.assignmentId),
    ]);
    if (
      !version ||
      !assignment ||
      version.publicationStatusConceptId !== SURVEYS.VERSION_PUBLISHED
    ) {
      return null;
    }
    const questions = await this.templatesRepo.countQuestions(em, version.id);
    if (questions !== SYSTEM_BASE_SURVEYS[kind].questions.length) return null;
    return {
      kind,
      templateId: ids.templateId,
      versionId: version.id,
      assignmentId: assignment.id,
      responseWindowDays: version.responseWindowDays,
    };
  }

  /** Escribe lo que falte de la base, en una transacción. */
  private async materialize(
    tx: EntityManager,
    tenantId: string,
    kind: SystemSurveyKind,
    actorUserId?: string,
  ): Promise<void> {
    const def = SYSTEM_BASE_SURVEYS[kind];
    const ids = systemSurveyIds(tenantId, kind);
    const now = new Date();

    let template = await this.templatesRepo.findTemplateById(
      tx,
      ids.templateId,
    );
    if (!template) {
      template = this.templatesRepo.createTemplate(tx, {
        id: ids.templateId,
        tenantId,
        ownerTypeConceptId: SYSTEM_OWNER_TYPE_BY_KIND[kind],
        ownerId: tenantId,
        title: def.title,
        description: def.description,
        statusConceptId: SURVEYS.TEMPLATE_ACTIVE,
        actorUserId,
      });
      await tx.flush();
    } else {
      // Cambió el contenido: el título y la consigna siguen a la constante.
      template.title = def.title;
      template.description = def.description;
      touch(template, actorUserId);
    }

    // La versión nueva reemplaza a las anteriores: se retiran, no se borran.
    for (const old of await this.templatesRepo.listVersions(tx, template.id)) {
      if (
        old.id !== ids.versionId &&
        old.publicationStatusConceptId === SURVEYS.VERSION_PUBLISHED
      ) {
        old.publicationStatusConceptId = SURVEYS.VERSION_RETIRED;
        old.effectiveTo = now;
        touch(old, actorUserId);
      }
    }

    const version = await this.templatesRepo.findVersionById(tx, ids.versionId);
    if (!version) {
      this.templatesRepo.createVersion(tx, {
        id: ids.versionId,
        surveyTemplateId: template.id,
        versionNumber: SYSTEM_BASE_SURVEY_VERSION,
        publicationStatusConceptId: SURVEYS.VERSION_PUBLISHED,
        responseWindowDays: SYSTEM_BASE_RESPONSE_WINDOW_DAYS,
        effectiveFrom: now,
        publishedAt: now,
        actorUserId,
      });
      await tx.flush();
    }

    for (const question of def.questions) {
      const questionId = ids.questionId(question.position);
      if (await this.templatesRepo.findQuestionById(tx, questionId)) continue;
      this.templatesRepo.createQuestion(tx, {
        id: questionId,
        surveyVersionId: ids.versionId,
        position: question.position,
        questionText: question.text,
        answerTypeConceptId: ANSWER_TYPE_BY_CODE[question.answerType],
        required: question.required,
        options: question.options ? [...question.options] : undefined,
        scaleMin: question.scaleMin,
        scaleMax: question.scaleMax,
        actorUserId,
      });
    }

    if (!(await this.assignmentsRepo.findById(tx, ids.assignmentId))) {
      this.assignmentsRepo.create(tx, {
        id: ids.assignmentId,
        surveyVersionId: ids.versionId,
        tenantId,
        targetTypeConceptId: SURVEYS.TARGET_SYSTEM_BASE,
        targetId: tenantId,
        active: true,
        actorUserId,
      });
    }
    await tx.flush();
  }
}
