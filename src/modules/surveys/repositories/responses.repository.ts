import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { SurveyResponses, SurveyAnswers } from '../entities';
import { createdBy } from '../../../common';

/** Alta de la cabecera de una respuesta. */
export interface CreateResponseData {
  /**
   * Identificador asociado a survey invitation.
   */
  surveyInvitationId: string;
  /**
   * Identificador asociado a survey version.
   */
  surveyVersionId: string;
  /**
   * Identificador asociado a tenant.
   */
  tenantId: string;
  /**
   * Identificador asociado a patient profile.
   */
  patientProfileId: string;
  /**
   * Valor de submitted at mantenido por la instancia.
   */
  submittedAt: Date;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Alta de una respuesta a una pregunta concreta. */
export interface CreateAnswerData {
  /**
   * Identificador asociado a survey response.
   */
  surveyResponseId: string;
  /**
   * Identificador asociado a survey question.
   */
  surveyQuestionId: string;
  /**
   * Valor de value text mantenido por la instancia.
   */
  valueText?: string;
  /**
   * Valor de value number mantenido por la instancia.
   */
  valueNumber?: number;
  /**
   * Valor de value boolean mantenido por la instancia.
   */
  valueBoolean?: boolean;
  /**
   * Valor de value choices mantenido por la instancia.
   */
  valueChoices?: string[];
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `surveys.survey_responses` y `surveys.survey_answers`. */
@Injectable()
export class ResponsesRepository {
  /**
   * Obtiene la respuesta de una invitación.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param surveyInvitationId - Identificador de la invitación.
   * @returns Resultado conforme al contrato `Promise<SurveyResponses | null>`.
   */
  findByInvitation(
    em: EntityManager,
    surveyInvitationId: string,
  ): Promise<SurveyResponses | null> {
    return em.findOne(SurveyResponses, { surveyInvitationId });
  }

  /**
   * Lista las respuestas de las invitaciones indicadas.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param invitationIds - Identificadores de invitación.
   * @returns Resultado conforme al contrato `Promise<SurveyResponses[]>`.
   */
  listByInvitations(
    em: EntityManager,
    invitationIds: string[],
  ): Promise<SurveyResponses[]> {
    if (invitationIds.length === 0) return Promise.resolve([]);
    return em.find(
      SurveyResponses,
      { surveyInvitationId: { $in: invitationIds } },
      { orderBy: { submittedAt: 'desc' } },
    );
  }

  /**
   * Lista las respuestas a preguntas de las cabeceras indicadas.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param responseIds - Identificadores de cabecera de respuesta.
   * @returns Resultado conforme al contrato `Promise<SurveyAnswers[]>`.
   */
  listAnswers(
    em: EntityManager,
    responseIds: string[],
  ): Promise<SurveyAnswers[]> {
    if (responseIds.length === 0) return Promise.resolve([]);
    return em.find(SurveyAnswers, {
      surveyResponseId: { $in: responseIds },
    });
  }

  /**
   * Crea la cabecera de respuesta.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Datos del alta.
   * @returns Resultado conforme al contrato `SurveyResponses`.
   */
  createResponse(em: EntityManager, data: CreateResponseData): SurveyResponses {
    const { actorUserId, ...rest } = data;
    return em.create(
      SurveyResponses,
      { ...rest, ...createdBy(actorUserId) },
      { partial: true },
    );
  }

  /**
   * Crea una respuesta a una pregunta.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Datos del alta.
   * @returns Resultado conforme al contrato `SurveyAnswers`.
   */
  createAnswer(em: EntityManager, data: CreateAnswerData): SurveyAnswers {
    const { actorUserId, ...rest } = data;
    return em.create(
      SurveyAnswers,
      { ...rest, ...createdBy(actorUserId) },
      { partial: true },
    );
  }
}
