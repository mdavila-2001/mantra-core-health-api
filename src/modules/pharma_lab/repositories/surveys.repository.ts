import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { createdBy } from '../../../common';
import {
  VisitSurveyAnswers,
  VisitSurveyQuestions,
  VisitSurveyResponses,
  VisitSurveys,
} from '../entities';
import { PHL } from '../pharma_lab.concepts';

/** Acceso a datos de las encuestas posteriores a la visita. */
@Injectable()
export class SurveysRepository {
  /**
   * Obtiene una encuesta.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de la encuesta.
   * @returns La encuesta, o `null` si no existe.
   */
  findSurvey(em: EntityManager, id: string): Promise<VisitSurveys | null> {
    return em.findOne(VisitSurveys, { id });
  }

  /**
   * Lista las encuestas de un laboratorio.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param pharmaLabId - Laboratorio.
   * @returns Encuestas de la más reciente a la más antigua.
   */
  listSurveys(em: EntityManager, pharmaLabId: string): Promise<VisitSurveys[]> {
    return em.find(
      VisitSurveys,
      { pharmaLabId },
      { orderBy: { createdAt: 'desc' } },
    );
  }

  /**
   * Busca la encuesta vigente que corresponde a una visita concreta.
   *
   * El acotamiento por visitador, producto, campaña o especialidad es opcional:
   * una encuesta sin acotar aplica a todas las visitas del laboratorio.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param pharmaLabId - Laboratorio.
   * @param medicalVisitorId - Visitador de la visita.
   * @param on - Fecha de la visita, en formato `YYYY-MM-DD`.
   * @returns La encuesta aplicable, o `null` si no hay ninguna vigente.
   */
  findApplicableSurvey(
    em: EntityManager,
    pharmaLabId: string,
    medicalVisitorId: string,
    on: string,
  ): Promise<VisitSurveys | null> {
    return em.findOne(
      VisitSurveys,
      {
        pharmaLabId,
        statusConceptId: PHL.SURVEY_ACTIVE,
        validFrom: { $lte: on },
        $and: [
          { $or: [{ validTo: null }, { validTo: { $gte: on } }] },
          { $or: [{ medicalVisitorId: null }, { medicalVisitorId }] },
        ],
      },
      { orderBy: { validFrom: 'desc' } },
    );
  }

  /**
   * Crea una encuesta.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Datos de la nueva fila.
   * @returns La entidad creada, aún sin `flush`.
   */
  createSurvey(em: EntityManager, data: Record<string, unknown>): VisitSurveys {
    return em.create(
      VisitSurveys,
      { ...data, ...createdBy(data.actorUserId as string) },
      { partial: true },
    );
  }

  /**
   * Crea una pregunta.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Datos de la nueva fila.
   * @returns La entidad creada, aún sin `flush`.
   */
  createQuestion(
    em: EntityManager,
    data: Record<string, unknown>,
  ): VisitSurveyQuestions {
    return em.create(
      VisitSurveyQuestions,
      {
        createdAt: new Date(),
        createdByUserId: data.actorUserId as string | undefined,
        ...data,
      },
      { partial: true },
    );
  }

  /**
   * Lista las preguntas de una encuesta.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param visitSurveyId - Encuesta.
   * @returns Preguntas en orden de presentación.
   */
  listQuestions(
    em: EntityManager,
    visitSurveyId: string,
  ): Promise<VisitSurveyQuestions[]> {
    return em.find(
      VisitSurveyQuestions,
      { visitSurveyId },
      { orderBy: { position: 'asc' } },
    );
  }

  /**
   * Obtiene un envío de encuesta.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador del envío.
   * @returns El envío, o `null` si no existe.
   */
  findResponse(
    em: EntityManager,
    id: string,
  ): Promise<VisitSurveyResponses | null> {
    return em.findOne(VisitSurveyResponses, { id });
  }

  /**
   * Obtiene el envío emitido para una visita.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param visitRecordId - Registro de visita.
   * @returns El envío, o `null` si esa visita no generó encuesta.
   */
  findResponseByRecord(
    em: EntityManager,
    visitRecordId: string,
  ): Promise<VisitSurveyResponses | null> {
    return em.findOne(VisitSurveyResponses, { visitRecordId });
  }

  /**
   * Lista los envíos pendientes de un doctor.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param doctorUserId - Doctor.
   * @returns Envíos que el doctor todavía no respondió.
   */
  listPendingResponses(
    em: EntityManager,
    doctorUserId: string,
  ): Promise<VisitSurveyResponses[]> {
    return em.find(
      VisitSurveyResponses,
      { doctorUserId, statusConceptId: PHL.RESPONSE_PENDING },
      { orderBy: { issuedAt: 'desc' } },
    );
  }

  /**
   * Crea un envío de encuesta.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Datos de la nueva fila.
   * @returns La entidad creada, aún sin `flush`.
   */
  createResponse(
    em: EntityManager,
    data: Record<string, unknown>,
  ): VisitSurveyResponses {
    return em.create(
      VisitSurveyResponses,
      { ...data, ...createdBy(data.actorUserId as string) },
      { partial: true },
    );
  }

  /**
   * Crea una respuesta individual.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Datos de la nueva fila.
   * @returns La entidad creada, aún sin `flush`.
   */
  createAnswer(
    em: EntityManager,
    data: Record<string, unknown>,
  ): VisitSurveyAnswers {
    return em.create(
      VisitSurveyAnswers,
      {
        createdAt: new Date(),
        createdByUserId: data.actorUserId as string | undefined,
        ...data,
      },
      { partial: true },
    );
  }

  /**
   * Lista los envíos respondidos de una encuesta, para calcular agregados.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param visitSurveyId - Encuesta.
   * @returns Envíos con respuesta.
   */
  listSubmittedResponses(
    em: EntityManager,
    visitSurveyId: string,
  ): Promise<VisitSurveyResponses[]> {
    return em.find(VisitSurveyResponses, {
      visitSurveyId,
      statusConceptId: PHL.RESPONSE_SUBMITTED,
    });
  }

  /**
   * Cuenta los envíos emitidos de una encuesta.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param visitSurveyId - Encuesta.
   * @returns Número de envíos.
   */
  countResponses(em: EntityManager, visitSurveyId: string): Promise<number> {
    return em.count(VisitSurveyResponses, { visitSurveyId });
  }

  /**
   * Lista las respuestas de un conjunto de envíos.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param responseIds - Envíos.
   * @returns Respuestas individuales de esos envíos.
   */
  listAnswers(
    em: EntityManager,
    responseIds: readonly string[],
  ): Promise<VisitSurveyAnswers[]> {
    if (responseIds.length === 0) return Promise.resolve([]);
    return em.find(VisitSurveyAnswers, {
      visitSurveyResponseId: { $in: [...responseIds] },
    });
  }
}
