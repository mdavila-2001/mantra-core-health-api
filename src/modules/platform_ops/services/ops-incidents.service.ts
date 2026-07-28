import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import {
  OpsIncidentsRepository,
  OpsImprovementsRepository,
} from '../repositories';
import type { HealthIncidents } from '../entities';
import {
  RecordHealthRunDto,
  HealthRunResponseDto,
  UpdateIncidentDto,
  IncidentResponseDto,
  OpenPostmortemDto,
  PostmortemResponseDto,
  type HealthRunStatus,
  type HealthRunSource,
  type IncidentTransition,
  type ResponderRole,
  type CommunicationType,
  type CommunicationAudience,
  type ActionType,
  type ImprovementPriority,
} from '../dto';

const RUN_STATUS_CONCEPT: Readonly<Record<HealthRunStatus, string>> = {
  PASS: CONCEPTS.HC_RUN_PASS,
  WARN: CONCEPTS.HC_RUN_WARN,
  FAIL: CONCEPTS.HC_RUN_FAIL,
  TIMEOUT: CONCEPTS.HC_RUN_TIMEOUT,
  ERROR: CONCEPTS.HC_RUN_ERROR,
};

const RUN_SOURCE_CONCEPT: Readonly<Record<HealthRunSource, string>> = {
  SCHEDULER: CONCEPTS.HC_SOURCE_SCHEDULER,
  PROBE: CONCEPTS.HC_SOURCE_PROBE,
  MANUAL: CONCEPTS.HC_SOURCE_MANUAL,
};

/**
 * Desenlaces que cuentan como fallo para derivar un incidente. `WARN` no está:
 * un aviso no es una caída, y tratarlo como tal llenaría la guardia de ruido.
 */
const FAILING_RUN_CONCEPTS: readonly string[] = [
  CONCEPTS.HC_RUN_FAIL,
  CONCEPTS.HC_RUN_TIMEOUT,
  CONCEPTS.HC_RUN_ERROR,
];

const RESPONDER_ROLE_CONCEPT: Readonly<Record<ResponderRole, string>> = {
  COMMANDER: CONCEPTS.RESPONDER_COMMANDER,
  OPERATIONS: CONCEPTS.RESPONDER_OPERATIONS,
  COMMUNICATIONS: CONCEPTS.RESPONDER_COMMUNICATIONS,
  SCRIBE: CONCEPTS.RESPONDER_SCRIBE,
};

const COMMUNICATION_TYPE_CONCEPT: Readonly<Record<CommunicationType, string>> =
  {
    STATUS_UPDATE: CONCEPTS.COMM_TYPE_STATUS_UPDATE,
    ESCALATION: CONCEPTS.COMM_TYPE_ESCALATION,
    RESOLUTION: CONCEPTS.COMM_TYPE_RESOLUTION,
  };

const COMMUNICATION_AUDIENCE_CONCEPT: Readonly<
  Record<CommunicationAudience, string>
> = {
  INTERNAL: CONCEPTS.COMM_AUDIENCE_INTERNAL,
  CUSTOMERS: CONCEPTS.COMM_AUDIENCE_CUSTOMERS,
  REGULATORS: CONCEPTS.COMM_AUDIENCE_REGULATORS,
};

const ACTION_TYPE_CONCEPT: Readonly<Record<ActionType, string>> = {
  PREVENTIVE: CONCEPTS.ACTION_TYPE_PREVENTIVE,
  CORRECTIVE: CONCEPTS.ACTION_TYPE_CORRECTIVE,
  DETECTIVE: CONCEPTS.ACTION_TYPE_DETECTIVE,
  PROCESS: CONCEPTS.ACTION_TYPE_PROCESS,
};

export const IMPROVEMENT_PRIORITY_CONCEPT: Readonly<
  Record<ImprovementPriority, string>
> = {
  LOW: CONCEPTS.IMPROVEMENT_PRIORITY_LOW,
  MEDIUM: CONCEPTS.IMPROVEMENT_PRIORITY_MEDIUM,
  HIGH: CONCEPTS.IMPROVEMENT_PRIORITY_HIGH,
};

/** Desde qué estados se admite cada transición del incidente. */
const INCIDENT_TRANSITIONS: Readonly<
  Record<
    Exclude<IncidentTransition, 'UPDATE'>,
    {
      /**
       * Valor de from mantenido por la instancia.
       */
      from: readonly string[]; /**
       * Valor de to mantenido por la instancia.
       */
      to: string; /**
       * Valor de event mantenido por la instancia.
       */
      event: string;
    }
  >
> = {
  ACKNOWLEDGE: {
    from: [CONCEPTS.INCIDENT_OPEN],
    to: CONCEPTS.INCIDENT_ACKNOWLEDGED,
    event: CONCEPTS.TIMELINE_ACKNOWLEDGED,
  },
  MITIGATE: {
    from: [CONCEPTS.INCIDENT_OPEN, CONCEPTS.INCIDENT_ACKNOWLEDGED],
    to: CONCEPTS.INCIDENT_MITIGATED,
    event: CONCEPTS.TIMELINE_MITIGATED,
  },
  RESOLVE: {
    from: [CONCEPTS.INCIDENT_ACKNOWLEDGED, CONCEPTS.INCIDENT_MITIGATED],
    to: CONCEPTS.INCIDENT_RESOLVED,
    event: CONCEPTS.TIMELINE_RESOLVED,
  },
};

/**
 * Observabilidad: corridas de health check con derivación de incidente, ciclo de
 * vida del incidente y postmortem (UC-46-06 … 08).
 */
@Injectable()
export class OpsIncidentsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param incidentsRepo - Valor de incidents repo requerido por la operación.
   * @param improvementsRepo - Valor de improvements repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly incidentsRepo: OpsIncidentsRepository,
    private readonly improvementsRepo: OpsImprovementsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(OpsIncidentsService.name);
  }

  /**
   * UC-46-06: registrar la corrida y, si acumula fallos consecutivos hasta el
   * umbral, abrir el incidente. Un solo incidente por caída: mientras siga vivo,
   * las corridas siguientes se suman a él en lugar de duplicarlo.
   */
  async recordHealthRun(
    healthCheckId: string,
    dto: RecordHealthRunDto,
    actor: AuthenticatedUser,
  ): Promise<HealthRunResponseDto> {
    this.logger.info(
      { operation: 'ops.health-check.run', healthCheckId, status: dto.status },
      'Recording health check run',
    );

    return this.em.transactional(async (tx) => {
      const check = await this.incidentsRepo.findHealthCheckById(
        tx,
        healthCheckId,
      );
      if (!check) {
        throw new ResourceNotFoundException('Health check no encontrado', {
          healthCheckId,
        });
      }
      if (check.stateConceptId !== CONCEPTS.STATE_ACTIVE) {
        throw new PreconditionFailedException(
          'El health check no está activo',
          { healthCheckId },
        );
      }
      if (check.isEnabled === false) {
        throw new PreconditionFailedException(
          'El health check está deshabilitado',
          {
            healthCheckId,
          },
        );
      }

      const statusConceptId = RUN_STATUS_CONCEPT[dto.status];
      // Un umbral sin declarar significa que cada fallo cuenta por sí solo.
      const threshold = check.unhealthyThreshold ?? 1;

      const previous = await this.incidentsRepo.findRecentRuns(
        tx,
        healthCheckId,
        threshold,
      );
      const consecutiveFailures = FAILING_RUN_CONCEPTS.includes(statusConceptId)
        ? this.leadingFailures(previous.map((run) => run.statusConceptId)) + 1
        : 0;

      const run = this.incidentsRepo.createHealthRun(tx, {
        healthCheckId,
        serviceComponentId: check.serviceComponentId,
        deploymentId: dto.deploymentId,
        statusConceptId,
        latencyMs: dto.latencyMs,
        httpStatus: dto.httpStatus,
        observedValue: dto.observedValue,
        message: dto.message,
        runSourceConceptId: RUN_SOURCE_CONCEPT[dto.source],
        startedAt: dto.startedAt ? new Date(dto.startedAt) : undefined,
        finishedAt: dto.finishedAt ? new Date(dto.finishedAt) : undefined,
        recordedByUserId: actor.id,
      });

      if (consecutiveFailures < threshold) {
        return {
          id: run.id,
          statusConceptId,
          consecutiveFailures,
          incidentOpened: false,
        };
      }

      const live = await this.incidentsRepo.findOpenIncidentByCheckForUpdate(
        tx,
        healthCheckId,
        CONCEPTS.INCIDENT_RESOLVED,
      );
      if (live) {
        this.incidentsRepo.createTimelineEvent(tx, {
          healthIncidentId: live.id,
          eventTypeConceptId: CONCEPTS.TIMELINE_NOTE,
          actorUserId: actor.id,
          summary: `Nueva corrida fallida del check ${check.code}`,
          sourceReference: run.id,
        });

        return {
          id: run.id,
          statusConceptId,
          consecutiveFailures,
          healthIncidentId: live.id,
          incidentOpened: false,
        };
      }

      const incidentNumber = await this.nextIncidentNumber(tx, check.tenantId);
      const incident = this.incidentsRepo.createIncident(tx, {
        tenantId: check.tenantId,
        serviceComponentId: check.serviceComponentId,
        healthCheckId,
        incidentNumber,
        severityConceptId:
          check.severityConceptId ?? CONCEPTS.INCIDENT_SEV_MEDIUM,
        statusConceptId: CONCEPTS.INCIDENT_OPEN,
        title: `${check.name}: ${consecutiveFailures} fallos consecutivos`,
        detectedByRunId: run.id,
        actorUserId: actor.id,
      });

      this.incidentsRepo.createTimelineEvent(tx, {
        healthIncidentId: incident.id,
        eventTypeConceptId: CONCEPTS.TIMELINE_DETECTED,
        actorUserId: actor.id,
        summary: `Detectado por ${consecutiveFailures} fallos consecutivos del check ${check.code}`,
        sourceReference: run.id,
      });

      this.logger.warn(
        {
          operation: 'ops.incident.open',
          healthCheckId,
          incidentNumber,
          consecutiveFailures,
        },
        'Incident opened from health check runs',
      );

      return {
        id: run.id,
        statusConceptId,
        consecutiveFailures,
        healthIncidentId: incident.id,
        incidentOpened: true,
      };
    });
  }

  /**
   * UC-46-07: mover el incidente, sumar respondientes y publicar comunicaciones.
   * El timeline y las comunicaciones son append-only: son la reconstrucción de
   * lo que pasó, y reescribirlas la haría inservible.
   */
  async updateIncident(
    incidentId: string,
    dto: UpdateIncidentDto,
    actor: AuthenticatedUser,
  ): Promise<IncidentResponseDto> {
    this.logger.info(
      {
        operation: 'ops.incident.update',
        incidentId,
        transition: dto.transition,
      },
      'Updating incident',
    );

    return this.em.transactional(async (tx) => {
      const incident = await this.incidentsRepo.findIncidentForUpdate(
        tx,
        incidentId,
      );
      if (!incident) {
        throw new ResourceNotFoundException('Incidente no encontrado', {
          incidentId,
        });
      }
      if (incident.statusConceptId === CONCEPTS.INCIDENT_RESOLVED) {
        throw new PreconditionFailedException('El incidente ya está resuelto', {
          incidentId,
        });
      }

      const timelineEventIds: string[] = [];
      if (dto.transition !== 'UPDATE') {
        timelineEventIds.push(this.applyTransition(tx, incident, dto, actor));
      } else if (dto.summary) {
        timelineEventIds.push(
          this.incidentsRepo.createTimelineEvent(tx, {
            healthIncidentId: incidentId,
            eventTypeConceptId: CONCEPTS.TIMELINE_NOTE,
            actorUserId: actor.id,
            summary: dto.summary,
          }).id,
        );
      }

      const addedResponderIds: string[] = [];
      for (const responder of dto.responders ?? []) {
        const roleConceptId = RESPONDER_ROLE_CONCEPT[responder.role];
        const existing = await this.incidentsRepo.findResponder(
          tx,
          incidentId,
          responder.userId,
          roleConceptId,
        );
        if (existing) {
          // Sumarse dos veces con el mismo rol no añade nada; acusar recibo, sí.
          if (responder.acknowledged && !existing.acknowledgedAt) {
            existing.acknowledgedAt = new Date();
          }
          continue;
        }

        const created = this.incidentsRepo.createResponder(tx, {
          healthIncidentId: incidentId,
          userId: responder.userId,
          responderRoleConceptId: roleConceptId,
          acknowledgedAt: responder.acknowledged ? new Date() : undefined,
        });
        addedResponderIds.push(created.id);
        timelineEventIds.push(
          this.incidentsRepo.createTimelineEvent(tx, {
            healthIncidentId: incidentId,
            eventTypeConceptId: CONCEPTS.TIMELINE_RESPONDER_JOINED,
            actorUserId: actor.id,
            summary: `Se suma un respondiente con rol ${responder.role}`,
          }).id,
        );
      }

      const communicationIds: string[] = [];
      for (const communication of dto.communications ?? []) {
        const created = this.incidentsRepo.createCommunication(tx, {
          healthIncidentId: incidentId,
          communicationTypeConceptId:
            COMMUNICATION_TYPE_CONCEPT[communication.type],
          audienceConceptId:
            COMMUNICATION_AUDIENCE_CONCEPT[communication.audience],
          messageText: communication.messageText,
          channelReference: communication.channelReference,
          publishedByUserId: actor.id,
        });
        communicationIds.push(created.id);
        timelineEventIds.push(
          this.incidentsRepo.createTimelineEvent(tx, {
            healthIncidentId: incidentId,
            eventTypeConceptId: CONCEPTS.TIMELINE_COMMUNICATION,
            actorUserId: actor.id,
            summary: `Comunicación ${communication.type} a ${communication.audience}`,
          }).id,
        );
      }

      touch(incident, actor.id);

      return {
        id: incidentId,
        statusConceptId: incident.statusConceptId,
        addedResponderIds,
        communicationIds,
        timelineEventIds,
      };
    });
  }

  /**
   * UC-46-08: abrir el postmortem del incidente resuelto. Sin acciones no sirve
   * de nada: cada una entra además al backlog de mejoras para que su
   * seguimiento no dependa de que alguien recuerde el postmortem.
   */
  async openPostmortem(
    incidentId: string,
    dto: OpenPostmortemDto,
    actor: AuthenticatedUser,
  ): Promise<PostmortemResponseDto> {
    this.logger.info(
      {
        operation: 'ops.postmortem.open',
        incidentId,
        actions: dto.actionItems.length,
      },
      'Opening postmortem',
    );

    this.assertUniqueActionCodes(dto, incidentId);

    return this.em.transactional(async (tx) => {
      const incident = await this.incidentsRepo.findIncidentForUpdate(
        tx,
        incidentId,
      );
      if (!incident) {
        throw new ResourceNotFoundException('Incidente no encontrado', {
          incidentId,
        });
      }
      // Un postmortem sobre un incidente vivo describiría algo que aún cambia.
      if (incident.statusConceptId !== CONCEPTS.INCIDENT_RESOLVED) {
        throw new PreconditionFailedException(
          'El incidente todavía no está resuelto',
          {
            incidentId,
          },
        );
      }

      const previous = await this.incidentsRepo.findPostmortemByIncident(
        tx,
        incidentId,
      );
      if (previous) {
        throw new ConflictException('El incidente ya tiene postmortem', {
          incidentId,
          postmortemId: previous.id,
        });
      }

      const postmortem = this.incidentsRepo.createPostmortem(tx, {
        healthIncidentId: incidentId,
        title: dto.title,
        statusConceptId: CONCEPTS.POSTMORTEM_DRAFT,
        impactSummary: dto.impactSummary,
        detectionSummary: dto.detectionSummary,
        responseSummary: dto.responseSummary,
        rootCauseSummary: dto.rootCauseSummary ?? incident.rootCauseText,
        contributingFactorsJson: dto.contributingFactorsJson,
        lessonsLearned: dto.lessonsLearned,
        ownerUserId: dto.ownerUserId,
        actorUserId: actor.id,
      });

      const actionItemIds: string[] = [];
      const improvementItemIds: string[] = [];
      for (const action of dto.actionItems) {
        const dueAt = action.dueAt ? new Date(action.dueAt) : undefined;
        const item = this.incidentsRepo.createActionItem(tx, {
          postmortemId: postmortem.id,
          actionCode: action.actionCode,
          description: action.description,
          actionTypeConceptId: ACTION_TYPE_CONCEPT[action.actionType],
          statusConceptId: CONCEPTS.ACTION_ITEM_OPEN,
          ownerUserId: action.ownerUserId,
          dueAt,
          actorUserId: actor.id,
        });
        actionItemIds.push(item.id);

        const improvement = this.improvementsRepo.createImprovementItem(tx, {
          tenantId: incident.tenantId,
          serviceComponentId: incident.serviceComponentId,
          postmortemActionItemId: item.id,
          sourceTypeConceptId: CONCEPTS.IMPROVEMENT_SOURCE_POSTMORTEM,
          title: `${action.actionCode}: ${action.description}`.slice(0, 300),
          priorityConceptId:
            IMPROVEMENT_PRIORITY_CONCEPT[action.priority ?? 'MEDIUM'],
          statusConceptId: CONCEPTS.IMPROVEMENT_OPEN,
          ownerUserId: action.ownerUserId,
          dueAt,
          actorUserId: actor.id,
        });
        improvementItemIds.push(improvement.id);
      }

      return {
        id: postmortem.id,
        statusConceptId: CONCEPTS.POSTMORTEM_DRAFT,
        actionItemIds,
        improvementItemIds,
      };
    });
  }

  // --- Apoyo ---

  /** Fallos consecutivos contando desde la corrida más reciente hacia atrás. */
  private leadingFailures(statusesNewestFirst: string[]): number {
    let count = 0;
    for (const status of statusesNewestFirst) {
      if (!FAILING_RUN_CONCEPTS.includes(status)) break;
      count += 1;
    }
    return count;
  }

  /**
   * Ejecuta la operación apply transition.
   *
   * @param tx - Contexto de persistencia o transacción activa.
   * @param incident - Valor de incident requerido por la operación.
   * @param dto - Datos validados de la operación.
   * @param actor - Usuario autenticado que ejecuta la operación.
   * @returns Resultado de apply transition conforme al contrato `string`.
   * @throws Error de dominio cuando no se cumplen las precondiciones de la operación.
   */
  private applyTransition(
    tx: EntityManager,
    incident: HealthIncidents,
    dto: UpdateIncidentDto,
    actor: AuthenticatedUser,
  ): string {
    const transition =
      INCIDENT_TRANSITIONS[
        dto.transition as Exclude<IncidentTransition, 'UPDATE'>
      ];
    if (!transition.from.includes(incident.statusConceptId)) {
      throw new PreconditionFailedException(
        'La transición no es válida desde el estado actual',
        {
          incidentId: incident.id,
          transition: dto.transition,
        },
      );
    }

    if (dto.transition === 'RESOLVE') {
      const rootCause = dto.rootCauseText ?? incident.rootCauseText;
      const resolution = dto.resolutionText ?? incident.resolutionText;
      // Resolver sin causa ni resolución cierra el incidente sin dejar nada
      // que aprender, que es justo lo que el postmortem necesita después.
      if (!rootCause || !resolution) {
        throw new PreconditionFailedException(
          'Resolver exige causa raíz y descripción de la resolución',
          { incidentId: incident.id },
        );
      }
      incident.rootCauseText = rootCause;
      incident.resolutionText = resolution;
      incident.resolvedAt = new Date();
    }
    if (dto.transition === 'ACKNOWLEDGE') {
      incident.acknowledgedAt = new Date();
    }
    if (dto.rootCauseText) incident.rootCauseText = dto.rootCauseText;
    if (dto.resolutionText) incident.resolutionText = dto.resolutionText;

    incident.statusConceptId = transition.to;

    return this.incidentsRepo.createTimelineEvent(tx, {
      healthIncidentId: incident.id,
      eventTypeConceptId: transition.event,
      actorUserId: actor.id,
      summary: dto.summary ?? `Incidente ${dto.transition.toLowerCase()}`,
    }).id;
  }

  /**
   * Valida assert unique action codes.
   *
   * @param dto - Datos validados de la operación.
   * @param incidentId - Identificador de incident.
   * @throws Error de dominio cuando no se cumplen las precondiciones de la operación.
   */
  private assertUniqueActionCodes(
    dto: OpenPostmortemDto,
    incidentId: string,
  ): void {
    const seen = new Set<string>();
    for (const action of dto.actionItems) {
      if (seen.has(action.actionCode)) {
        throw new PreconditionFailedException(
          'El código de acción está repetido',
          {
            incidentId,
            actionCode: action.actionCode,
          },
        );
      }
      seen.add(action.actionCode);
    }
  }

  /**
   * Ejecuta la operación next incident number.
   *
   * @param tx - Contexto de persistencia o transacción activa.
   * @param tenantId - Identificador de tenant.
   * @returns Resultado de next incident number conforme al contrato `Promise<string>`.
   */
  private async nextIncidentNumber(
    tx: EntityManager,
    tenantId?: string,
  ): Promise<string> {
    const count = await this.incidentsRepo.countIncidents(tx, tenantId);
    return `INC-${String(count + 1).padStart(6, '0')}`;
  }
}
