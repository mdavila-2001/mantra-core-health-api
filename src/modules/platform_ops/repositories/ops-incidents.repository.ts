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

export interface CreateHealthRunData {
  healthCheckId: string;
  serviceComponentId: string;
  deploymentId?: string;
  statusConceptId: string;
  latencyMs?: number;
  httpStatus?: number;
  observedValue?: string;
  message?: string;
  runSourceConceptId: string;
  startedAt?: Date;
  finishedAt?: Date;
  recordedByUserId?: string;
}

export interface CreateIncidentData {
  tenantId?: string;
  serviceComponentId: string;
  healthCheckId?: string;
  incidentNumber: string;
  severityConceptId: string;
  statusConceptId: string;
  title: string;
  detectedByRunId?: string;
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

  findIncidentById(
    em: EntityManager,
    id: string,
  ): Promise<HealthIncidents | null> {
    return em.findOne(HealthIncidents, { id });
  }

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

  countIncidents(em: EntityManager, tenantId?: string): Promise<number> {
    return em.count(HealthIncidents, { tenantId });
  }

  // --- Respondientes, timeline y comunicaciones (UC-46-07) ---

  createResponder(
    em: EntityManager,
    data: {
      healthIncidentId: string;
      userId: string;
      responderRoleConceptId: string;
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
      healthIncidentId: string;
      eventTypeConceptId: string;
      actorUserId?: string;
      summary: string;
      detailsJson?: unknown;
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
      healthIncidentId: string;
      communicationTypeConceptId: string;
      audienceConceptId: string;
      messageText: string;
      channelReference?: string;
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

  createPostmortem(
    em: EntityManager,
    data: {
      healthIncidentId: string;
      title: string;
      statusConceptId: string;
      impactSummary?: string;
      detectionSummary?: string;
      responseSummary?: string;
      rootCauseSummary?: string;
      contributingFactorsJson?: unknown;
      lessonsLearned?: string;
      ownerUserId: string;
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

  createActionItem(
    em: EntityManager,
    data: {
      postmortemId: string;
      actionCode: string;
      description: string;
      actionTypeConceptId: string;
      statusConceptId: string;
      ownerUserId: string;
      dueAt?: Date;
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
