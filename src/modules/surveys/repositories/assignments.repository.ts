import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { SurveyAssignments } from '../entities';
import { createdBy } from '../../../common';

/** Alta de una asignación de encuesta a la cosa evaluada. */
export interface CreateAssignmentData {
  /**
   * Identificador asociado a survey version.
   */
  surveyVersionId: string;
  /**
   * Identificador asociado a tenant.
   */
  tenantId: string;
  /**
   * Identificador asociado a target type concept.
   */
  targetTypeConceptId: string;
  /**
   * Identificador asociado a target.
   */
  targetId: string;
  /**
   * Valor de active mantenido por la instancia.
   */
  active: boolean;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `surveys.survey_assignments`. */
@Injectable()
export class AssignmentsRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de la asignación.
   * @returns Resultado conforme al contrato `Promise<SurveyAssignments | null>`.
   */
  findById(em: EntityManager, id: string): Promise<SurveyAssignments | null> {
    return em.findOne(SurveyAssignments, { id });
  }

  /**
   * Busca una asignación activa idéntica, para no duplicarla.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param surveyVersionId - Identificador de la versión.
   * @param targetTypeConceptId - Tipo de la cosa evaluada.
   * @param targetId - Identificador de la cosa evaluada.
   * @returns Resultado conforme al contrato `Promise<SurveyAssignments | null>`.
   */
  findActiveDuplicate(
    em: EntityManager,
    surveyVersionId: string,
    targetTypeConceptId: string,
    targetId: string,
  ): Promise<SurveyAssignments | null> {
    return em.findOne(SurveyAssignments, {
      surveyVersionId,
      targetTypeConceptId,
      targetId,
      active: true,
    });
  }

  /**
   * Lista las asignaciones activas cuyo destino esté entre los indicados.
   *
   * Recibe la lista de destinos candidatos —la reserva, su servicio, su tipo de
   * atención— y devuelve las que apliquen en una sola consulta, en vez de una
   * por tipo de destino.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Identificador de la organización.
   * @param targetIds - Identificadores candidatos de la cosa evaluada.
   * @returns Resultado conforme al contrato `Promise<SurveyAssignments[]>`.
   */
  listActiveByTargets(
    em: EntityManager,
    tenantId: string,
    targetIds: string[],
  ): Promise<SurveyAssignments[]> {
    if (targetIds.length === 0) return Promise.resolve([]);
    return em.find(SurveyAssignments, {
      tenantId,
      active: true,
      targetId: { $in: targetIds },
    });
  }

  /**
   * Lista las asignaciones de una versión.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param surveyVersionId - Identificador de la versión.
   * @returns Resultado conforme al contrato `Promise<SurveyAssignments[]>`.
   */
  listByVersion(
    em: EntityManager,
    surveyVersionId: string,
  ): Promise<SurveyAssignments[]> {
    return em.find(SurveyAssignments, { surveyVersionId });
  }

  /**
   * Crea la asignación.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Datos del alta.
   * @returns Resultado conforme al contrato `SurveyAssignments`.
   */
  create(em: EntityManager, data: CreateAssignmentData): SurveyAssignments {
    const { actorUserId, ...rest } = data;
    return em.create(
      SurveyAssignments,
      { ...rest, ...createdBy(actorUserId) },
      { partial: true },
    );
  }
}
