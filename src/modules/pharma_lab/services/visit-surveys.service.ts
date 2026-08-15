import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { AuditTrailService } from '../../audit/services/audit-trail.service';
import {
  CreateVisitSurveyDto,
  CreatedResourceDto,
  SubmitSurveyResponseDto,
  TransitionResultDto,
} from '../dto';
import type {
  VisitSurveyQuestions,
  VisitSurveyResponses,
  VisitSurveys,
} from '../entities';
import { SurveysRepository } from '../repositories';
import { PHL } from '../pharma_lab.concepts';
import { PharmaLabAccessService } from './pharma-lab-access.service';

/** Indicador agregado de una pregunta de encuesta. */
export interface SurveyQuestionIndicator {
  /** Pregunta. */
  visitSurveyQuestionId: string;
  /** Enunciado. */
  prompt: string;
  /** Cuántas personas la respondieron. */
  answered: number;
  /** Promedio, cuando la pregunta es de escala. */
  average: number | null;
  /** Cuántas respondieron «sí», cuando la pregunta es booleana. */
  affirmative: number | null;
}

/** Resultados agregados de una encuesta. */
export interface SurveyResults {
  /** Encuesta. */
  visitSurveyId: string;
  /** Título. */
  title: string;
  /** Envíos emitidos. */
  issued: number;
  /** Envíos respondidos. */
  submitted: number;
  /** Indicadores por pregunta. */
  indicators: SurveyQuestionIndicator[];
}

/**
 * UC-17-27 y UC-17-28: encuestas posteriores a la visita (spec 5526-5547).
 *
 * Dos reglas mandan sobre todo lo demás: **solo responde el doctor visitado**
 * (5543) y **las respuestas individuales son privadas** (5547). La primera se
 * comprueba contra el destinatario congelado en el envío; la segunda es la razón
 * de que este servicio no exponga ningún método que devuelva respuestas — solo
 * indicadores agregados.
 */
@Injectable()
export class VisitSurveysService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param repo - Repositorio de encuestas.
   * @param access - Comprobaciones de vinculación y estado.
   * @param audit - Cadena WORM de auditoría.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly repo: SurveysRepository,
    private readonly access: PharmaLabAccessService,
    private readonly audit: AuditTrailService,
  ) {}

  /**
   * UC-17-27: configura una encuesta posterior a la visita.
   *
   * @param pharmaLabId - Laboratorio.
   * @param dto - Datos validados de la operación.
   * @param actor - Usuario autenticado que ejecuta la operación.
   * @returns Identificador de la encuesta creada.
   */
  async createSurvey(
    pharmaLabId: string,
    dto: CreateVisitSurveyDto,
    actor: AuthenticatedUser,
  ): Promise<CreatedResourceDto> {
    return this.em.transactional(async (tx) => {
      const lab = await this.access.requireActiveLab(tx, pharmaLabId);
      const survey = this.repo.createSurvey(tx, {
        pharmaLabId,
        title: dto.title,
        medicalVisitorId: dto.medicalVisitorId,
        pharmaProductId: dto.pharmaProductId,
        campaignCode: dto.campaignCode,
        specialtyConceptId: dto.specialtyConceptId,
        validFrom: dto.validFrom,
        validTo: dto.validTo,
        sendDelayHours: dto.sendDelayHours ?? 24,
        reminderCount: dto.reminderCount ?? 0,
        statusConceptId: PHL.SURVEY_ACTIVE,
        actorUserId: actor.id,
      });
      await tx.flush();

      dto.questions.forEach((question, index) => {
        this.repo.createQuestion(tx, {
          visitSurveyId: survey.id,
          position: index + 1,
          prompt: question.prompt,
          answerTypeConceptId: question.answerTypeConceptId,
          isRequired: question.isRequired ?? false,
          options: question.options,
          actorUserId: actor.id,
        });
      });
      await tx.flush();

      await this.audit.record(tx, actor, {
        action: 'VISIT_SURVEY_CREATED',
        entity: 'visit_surveys',
        entityId: survey.id,
        tenantId: lab.tenantId,
      });
      return { id: survey.id };
    });
  }

  /**
   * Cierra una encuesta para que deje de emitirse.
   *
   * @param pharmaLabId - Laboratorio.
   * @param surveyId - Encuesta.
   * @param actor - Usuario autenticado que ejecuta la operación.
   * @returns Identificador y estado resultante.
   */
  async closeSurvey(
    pharmaLabId: string,
    surveyId: string,
    actor: AuthenticatedUser,
  ): Promise<TransitionResultDto> {
    return this.em.transactional(async (tx) => {
      await this.access.requireLab(tx, pharmaLabId);
      const survey = await this.requireSurvey(tx, pharmaLabId, surveyId);
      if (survey.statusConceptId === PHL.SURVEY_CLOSED) {
        throw new ConflictException('La encuesta ya está cerrada', {
          surveyId,
        });
      }
      survey.statusConceptId = PHL.SURVEY_CLOSED;
      touch(survey, actor.id);
      await tx.flush();

      await this.audit.record(tx, actor, {
        action: 'VISIT_SURVEY_CLOSED',
        entity: 'visit_surveys',
        entityId: survey.id,
      });
      return { id: survey.id, statusConceptId: survey.statusConceptId };
    });
  }

  /**
   * Lista las encuestas del laboratorio.
   *
   * @param pharmaLabId - Laboratorio.
   * @returns Encuestas de la más reciente a la más antigua.
   */
  async listSurveys(pharmaLabId: string): Promise<VisitSurveys[]> {
    await this.access.requireLab(this.em, pharmaLabId);
    return this.repo.listSurveys(this.em, pharmaLabId);
  }

  /**
   * Lista las encuestas que el doctor autenticado tiene pendientes.
   *
   * @param actor - Doctor autenticado.
   * @returns Envíos pendientes.
   */
  listPendingForDoctor(
    actor: AuthenticatedUser,
  ): Promise<VisitSurveyResponses[]> {
    return this.repo.listPendingResponses(this.em, actor.id);
  }

  /**
   * Lee el cuestionario de un envío para que el doctor pueda responderlo.
   *
   * @param responseId - Envío.
   * @param actor - Doctor autenticado.
   * @returns Encuesta y preguntas.
   * @throws ResourceNotFoundException si el envío no es del doctor.
   */
  async getQuestionnaire(
    responseId: string,
    actor: AuthenticatedUser,
  ): Promise<{
    /** El envío. */
    response: VisitSurveyResponses;
    /** La encuesta. */
    survey: VisitSurveys;
    /** Preguntas en orden. */
    questions: VisitSurveyQuestions[];
  }> {
    const response = await this.repo.findResponse(this.em, responseId);
    if (!response || response.doctorUserId !== actor.id) {
      throw new ResourceNotFoundException('Encuesta no encontrada', {
        responseId,
      });
    }
    const survey = await this.repo.findSurvey(this.em, response.visitSurveyId);
    if (!survey) {
      throw new ResourceNotFoundException('Encuesta no encontrada', {
        responseId,
      });
    }
    return {
      response,
      survey,
      questions: await this.repo.listQuestions(this.em, survey.id),
    };
  }

  /**
   * UC-17-28: el doctor visitado responde la encuesta.
   *
   * @param responseId - Envío.
   * @param dto - Datos validados de la operación.
   * @param actor - Doctor autenticado.
   * @returns Identificador y estado resultante.
   * @throws ResourceNotFoundException si el envío no es del doctor.
   * @throws ConflictException si ya la respondió.
   * @throws PreconditionFailedException si falta alguna respuesta obligatoria.
   */
  async submitResponse(
    responseId: string,
    dto: SubmitSurveyResponseDto,
    actor: AuthenticatedUser,
  ): Promise<TransitionResultDto> {
    return this.em.transactional(async (tx) => {
      const response = await this.repo.findResponse(tx, responseId);
      if (!response || response.doctorUserId !== actor.id) {
        throw new ResourceNotFoundException('Encuesta no encontrada', {
          responseId,
        });
      }
      if (response.statusConceptId === PHL.RESPONSE_SUBMITTED) {
        throw new ConflictException('La encuesta ya fue respondida', {
          responseId,
        });
      }

      const questions = await this.repo.listQuestions(
        tx,
        response.visitSurveyId,
      );
      const byId = new Map(
        questions.map((question) => [question.id, question]),
      );
      const answered = new Set(
        dto.answers.map((answer) => answer.visitSurveyQuestionId),
      );
      const missing = questions.filter(
        (question) => question.isRequired && !answered.has(question.id),
      );
      if (missing.length > 0) {
        throw new PreconditionFailedException(
          'Faltan respuestas obligatorias',
          { questionIds: missing.map((question) => question.id) },
        );
      }
      const foreign = dto.answers.filter(
        (answer) => !byId.has(answer.visitSurveyQuestionId),
      );
      if (foreign.length > 0) {
        throw new PreconditionFailedException(
          'Alguna respuesta no corresponde a una pregunta de esta encuesta',
          {},
        );
      }

      for (const answer of dto.answers) {
        this.repo.createAnswer(tx, {
          visitSurveyResponseId: response.id,
          visitSurveyQuestionId: answer.visitSurveyQuestionId,
          numericValue: answer.numericValue,
          booleanValue: answer.booleanValue,
          textValue: answer.textValue,
          actorUserId: actor.id,
        });
      }
      response.statusConceptId = PHL.RESPONSE_SUBMITTED;
      response.submittedAt = new Date();
      touch(response, actor.id);
      await tx.flush();

      await this.audit.record(tx, actor, {
        action: 'VISIT_SURVEY_ANSWERED',
        entity: 'visit_survey_responses',
        entityId: response.id,
      });
      return { id: response.id, statusConceptId: response.statusConceptId };
    });
  }

  /**
   * Resultados agregados de una encuesta (spec 5544-5546).
   *
   * Devuelve conteos y promedios. No hay ningún camino en esta clase que
   * devuelva una respuesta individual a la organización.
   *
   * @param pharmaLabId - Laboratorio.
   * @param surveyId - Encuesta.
   * @returns Indicadores agregados por pregunta.
   */
  async getResults(
    pharmaLabId: string,
    surveyId: string,
  ): Promise<SurveyResults> {
    await this.access.requireLab(this.em, pharmaLabId);
    const survey = await this.requireSurvey(this.em, pharmaLabId, surveyId);
    const questions = await this.repo.listQuestions(this.em, survey.id);
    const submitted = await this.repo.listSubmittedResponses(
      this.em,
      survey.id,
    );
    const answers = await this.repo.listAnswers(
      this.em,
      submitted.map((response) => response.id),
    );

    const indicators = questions.map((question) => {
      const own = answers.filter(
        (answer) => answer.visitSurveyQuestionId === question.id,
      );
      const numeric = own
        .map((answer) => answer.numericValue)
        .filter((value): value is number => typeof value === 'number');
      const booleans = own
        .map((answer) => answer.booleanValue)
        .filter((value): value is boolean => typeof value === 'boolean');
      return {
        visitSurveyQuestionId: question.id,
        prompt: question.prompt,
        answered: own.length,
        average:
          numeric.length > 0
            ? Math.round(
                (numeric.reduce((total, value) => total + value, 0) /
                  numeric.length) *
                  100,
              ) / 100
            : null,
        affirmative:
          booleans.length > 0 ? booleans.filter(Boolean).length : null,
      };
    });

    return {
      visitSurveyId: survey.id,
      title: survey.title,
      issued: await this.repo.countResponses(this.em, survey.id),
      submitted: submitted.length,
      indicators,
    };
  }

  private async requireSurvey(
    tx: EntityManager,
    pharmaLabId: string,
    surveyId: string,
  ): Promise<VisitSurveys> {
    const survey = await this.repo.findSurvey(tx, surveyId);
    if (!survey || survey.pharmaLabId !== pharmaLabId) {
      throw new ResourceNotFoundException(
        'Encuesta no encontrada en el laboratorio',
        { pharmaLabId, surveyId },
      );
    }
    return survey;
  }
}
