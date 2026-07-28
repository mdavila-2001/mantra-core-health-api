import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  HealthChecks,
  HealthCheckRuns,
  HealthIncidents,
  IncidentResponders,
  IncidentTimelineEvents,
  IncidentCommunications,
  Postmortems,
  PostmortemActionItems,
} from '../entities';
import { createdBy } from '../../../common';

/**
 * Describe el contrato estructural de create health run data.
 */
export interface CreateHealthRunData {
  /**
   * Identificador asociado a health check.
   */
  healthCheckId: string;
  /**
   * Identificador asociado a service component.
   */
  serviceComponentId: string;
  /**
   * Identificador asociado a deployment.
   */
  deploymentId?: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Valor de latency ms mantenido por la instancia.
   */
  latencyMs?: number;
  /**
   * Valor de http status mantenido por la instancia.
   */
  httpStatus?: number;
  /**
   * Valor de observed value mantenido por la instancia.
   */
  observedValue?: string;
  /**
   * Valor de message mantenido por la instancia.
   */
  message?: string;
  /**
   * Identificador asociado a run source concept.
   */
  runSourceConceptId: string;
  /**
   * Valor de started at mantenido por la instancia.
   */
  startedAt?: Date;
  /**
   * Valor de finished at mantenido por la instancia.
   */
  finishedAt?: Date;
  /**
   * Identificador asociado a recorded by user.
   */
  recordedByUserId?: string;
}

/**
 * Describe el contrato estructural de create incident data.
 */
export interface CreateIncidentData {
  /**
   * Identificador asociado a tenant.
   */
  tenantId?: string;
  /**
   * Identificador asociado a service component.
   */
  serviceComponentId: string;
  /**
   * Identificador asociado a health check.
   */
  healthCheckId?: string;
  /**
   * Valor de incident number mantenido por la instancia.
   */
  incidentNumber: string;
  /**
   * Identificador asociado a severity concept.
   */
  severityConceptId: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Valor de title mantenido por la instancia.
   */
  title: string;
  /**
   * Identificador asociado a detected by run.
   */
  detectedByRunId?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Acceso a la parte de observabilidad de `platform_ops.*`: health checks y sus
 * corridas, incidentes con su timeline, respondientes y comunicaciones, y los
 * postmortems con sus acciones.
 */
@Injectable()
export class OpsIncidentsRepository {
  // --- Health checks (UC-46-06) ---

  /**
   * Obtiene find health check by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find health check by id conforme al contrato `Promise<HealthChecks | null>`.
   */
  findHealthCheckById(
    em: EntityManager,
    id: string,
  ): Promise<HealthChecks | null> {
    return em.findOne(HealthChecks, { id });
  }

  /** Log append-only: la corrida se inserta, y una lectura errónea se corrige con otra. */
  createHealthRun(
    em: EntityManager,
    data: CreateHealthRunData,
  ): HealthCheckRuns {
    return em.create(
      HealthCheckRuns,
      {
        healthCheckId: data.healthCheckId,
        serviceComponentId: data.serviceComponentId,
        deploymentId: data.deploymentId,
        statusConceptId: data.statusConceptId,
        latencyMs: data.latencyMs,
        httpStatus: data.httpStatus,
        observedValue: data.observedValue,
        message: data.message,
        runSourceConceptId: data.runSourceConceptId,
        startedAt: data.startedAt,
        finishedAt: data.finishedAt,
        recordedAt: new Date(),
        recordedByUserId: data.recordedByUserId,
      },
      { partial: true },
    );
  }

  /**
   * Últimas corridas del check, de la más reciente a la más antigua. El servicio
   * cuenta desde el principio cuántos fallos consecutivos lleva.
   */
  findRecentRuns(
    em: EntityManager,
    healthCheckId: string,
    limit: number,
  ): Promise<HealthCheckRuns[]> {
    return em.find(
      HealthCheckRuns,
      { healthCheckId },
      { orderBy: { recordedAt: 'DESC' }, limit },
    );
  }

  // --- Incidentes (UC-46-06, 07) ---

  /**
   * Crea create incident.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create incident conforme al contrato `HealthIncidents`.
   */
  createIncident(em: EntityManager, data: CreateIncidentData): HealthIncidents {
    return em.create(
      HealthIncidents,
      {
        tenantId: data.tenantId,
        serviceComponentId: data.serviceComponentId,
        healthCheckId: data.healthCheckId,
        incidentNumber: data.incidentNumber,
        severityConceptId: data.severityConceptId,
        statusConceptId: data.statusConceptId,
        title: data.title,
        detectedByRunId: data.detectedByRunId,
        openedAt: new Date(),
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find incident by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find incident by id conforme al contrato `Promise<HealthIncidents | null>`.
   */
  findIncidentById(
    em: EntityManager,
    id: string,
  ): Promise<HealthIncidents | null> {
    return em.findOne(HealthIncidents, { id });
  }

  /**
   * Obtiene find incident for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find incident for update conforme al contrato `Promise<HealthIncidents | null>`.
   */
  findIncidentForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<HealthIncidents | null> {
    return em.findOne(
      HealthIncidents,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /**
   * Incidente vivo del check, bloqueado. Es lo que evita abrir un segundo
   * incidente por el mismo fallo que sigue sin resolverse.
   */
  findOpenIncidentByCheckForUpdate(
    em: EntityManager,
    healthCheckId: string,
    resolvedStateConceptId: string,
  ): Promise<HealthIncidents | null> {
    return em.findOne(
      HealthIncidents,
      { healthCheckId, statusConceptId: { $ne: resolvedStateConceptId } },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /**
   * Ejecuta la operación count incidents.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Identificador de tenant.
   * @returns Resultado de count incidents conforme al contrato `Promise<number>`.
   */
  countIncidents(em: EntityManager, tenantId?: string): Promise<number> {
    return em.count(HealthIncidents, { tenantId });
  }

  // --- Respondientes, timeline y comunicaciones (UC-46-07) ---

  /**
   * Crea create responder.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create responder conforme al contrato `IncidentResponders`.
   */
  createResponder(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a health incident.
       */
      healthIncidentId: string;
      /**
       * Identificador asociado a user.
       */
      userId: string;
      /**
       * Identificador asociado a responder role concept.
       */
      responderRoleConceptId: string;
      /**
       * Valor de acknowledged at mantenido por la instancia.
       */
      acknowledgedAt?: Date;
    },
  ): IncidentResponders {
    return em.create(
      IncidentResponders,
      {
        healthIncidentId: data.healthIncidentId,
        userId: data.userId,
        responderRoleConceptId: data.responderRoleConceptId,
        joinedAt: new Date(),
        acknowledgedAt: data.acknowledgedAt,
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find responder.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param healthIncidentId - Identificador de health incident.
   * @param userId - Identificador de user.
   * @param responderRoleConceptId - Identificador de responder role concept.
   * @returns Resultado de find responder conforme al contrato `Promise<IncidentResponders | null>`.
   */
  findResponder(
    em: EntityManager,
    healthIncidentId: string,
    userId: string,
    responderRoleConceptId: string,
  ): Promise<IncidentResponders | null> {
    return em.findOne(IncidentResponders, {
      healthIncidentId,
      userId,
      responderRoleConceptId,
    });
  }

  /** Timeline append-only: la historia del incidente no se reescribe. */
  createTimelineEvent(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a health incident.
       */
      healthIncidentId: string;
      /**
       * Identificador asociado a event type concept.
       */
      eventTypeConceptId: string;
      /**
       * Identificador asociado a actor user.
       */
      actorUserId?: string;
      /**
       * Valor de summary mantenido por la instancia.
       */
      summary: string;
      /**
       * Valor de details json mantenido por la instancia.
       */
      detailsJson?: unknown;
      /**
       * Valor de source reference mantenido por la instancia.
       */
      sourceReference?: string;
    },
  ): IncidentTimelineEvents {
    return em.create(
      IncidentTimelineEvents,
      {
        healthIncidentId: data.healthIncidentId,
        occurredAt: new Date(),
        eventTypeConceptId: data.eventTypeConceptId,
        actorUserId: data.actorUserId,
        summary: data.summary,
        detailsJson: data.detailsJson,
        sourceReference: data.sourceReference,
      },
      { partial: true },
    );
  }

  /** Comunicaciones append-only: lo publicado queda publicado. */
  createCommunication(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a health incident.
       */
      healthIncidentId: string;
      /**
       * Identificador asociado a communication type concept.
       */
      communicationTypeConceptId: string;
      /**
       * Identificador asociado a audience concept.
       */
      audienceConceptId: string;
      /**
       * Valor de message text mantenido por la instancia.
       */
      messageText: string;
      /**
       * Valor de channel reference mantenido por la instancia.
       */
      channelReference?: string;
      /**
       * Identificador asociado a published by user.
       */
      publishedByUserId?: string;
    },
  ): IncidentCommunications {
    return em.create(
      IncidentCommunications,
      {
        healthIncidentId: data.healthIncidentId,
        communicationTypeConceptId: data.communicationTypeConceptId,
        audienceConceptId: data.audienceConceptId,
        messageText: data.messageText,
        channelReference: data.channelReference,
        publishedAt: new Date(),
        publishedByUserId: data.publishedByUserId,
      },
      { partial: true },
    );
  }

  // --- Postmortem (UC-46-08) ---

  /**
   * Crea create postmortem.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create postmortem conforme al contrato `Postmortems`.
   */
  createPostmortem(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a health incident.
       */
      healthIncidentId: string;
      /**
       * Valor de title mantenido por la instancia.
       */
      title: string;
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
      /**
       * Valor de impact summary mantenido por la instancia.
       */
      impactSummary?: string;
      /**
       * Valor de detection summary mantenido por la instancia.
       */
      detectionSummary?: string;
      /**
       * Valor de response summary mantenido por la instancia.
       */
      responseSummary?: string;
      /**
       * Valor de root cause summary mantenido por la instancia.
       */
      rootCauseSummary?: string;
      /**
       * Valor de contributing factors json mantenido por la instancia.
       */
      contributingFactorsJson?: unknown;
      /**
       * Valor de lessons learned mantenido por la instancia.
       */
      lessonsLearned?: string;
      /**
       * Identificador asociado a owner user.
       */
      ownerUserId: string;
      /**
       * Identificador asociado a actor user.
       */
      actorUserId?: string;
    },
  ): Postmortems {
    return em.create(
      Postmortems,
      {
        healthIncidentId: data.healthIncidentId,
        title: data.title,
        statusConceptId: data.statusConceptId,
        impactSummary: data.impactSummary,
        detectionSummary: data.detectionSummary,
        responseSummary: data.responseSummary,
        rootCauseSummary: data.rootCauseSummary,
        contributingFactorsJson: data.contributingFactorsJson,
        lessonsLearned: data.lessonsLearned,
        ownerUserId: data.ownerUserId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /** Un postmortem por incidente: dos versiones de lo ocurrido no se reconcilian. */
  findPostmortemByIncident(
    em: EntityManager,
    healthIncidentId: string,
  ): Promise<Postmortems | null> {
    return em.findOne(Postmortems, { healthIncidentId });
  }

  /**
   * Crea create action item.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create action item conforme al contrato `PostmortemActionItems`.
   */
  createActionItem(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a postmortem.
       */
      postmortemId: string;
      /**
       * Valor de action code mantenido por la instancia.
       */
      actionCode: string;
      /**
       * Valor de description mantenido por la instancia.
       */
      description: string;
      /**
       * Identificador asociado a action type concept.
       */
      actionTypeConceptId: string;
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
      /**
       * Identificador asociado a owner user.
       */
      ownerUserId: string;
      /**
       * Valor de due at mantenido por la instancia.
       */
      dueAt?: Date;
      /**
       * Identificador asociado a actor user.
       */
      actorUserId?: string;
    },
  ): PostmortemActionItems {
    return em.create(
      PostmortemActionItems,
      {
        postmortemId: data.postmortemId,
        actionCode: data.actionCode,
        description: data.description,
        actionTypeConceptId: data.actionTypeConceptId,
        statusConceptId: data.statusConceptId,
        ownerUserId: data.ownerUserId,
        dueAt: data.dueAt,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
