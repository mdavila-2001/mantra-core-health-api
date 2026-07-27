import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  ReportExecutions,
  ReportSnapshots,
  ReportSchedules,
  ReportDistributions,
  ReportSubscriptions,
} from '../entities';
import { createdBy } from '../../../common';

export interface CreateExecutionData {
  reportDefinitionId: string;
  reportVersionId?: string;
  scheduleId?: string;
  tenantId?: string;
  triggerConceptId: string;
  requestedByUserId?: string;
  parametersJson?: unknown;
  outputFormatConceptId?: string;
  statusConceptId: string;
  actorUserId?: string;
}

export interface CreateScheduleData {
  reportDefinitionId: string;
  tenantId?: string;
  name: string;
  cronExpression: string;
  timeZone?: string;
  parametersJson?: unknown;
  outputFormatConceptId: string;
  nextRunAt: Date;
  stateConceptId: string;
  actorUserId?: string;
}

/**
 * Acceso a la parte de ejecución de `reporting.*`: corridas, snapshots,
 * programaciones, distribuciones y suscripciones.
 */
@Injectable()
export class ReportingRunsRepository {
  // --- Ejecuciones (UC-39-04, UC-39-05, UC-39-11) ---

  createExecution(
    em: EntityManager,
    data: CreateExecutionData,
  ): ReportExecutions {
    return em.create(
      ReportExecutions,
      {
        reportDefinitionId: data.reportDefinitionId,
        reportVersionId: data.reportVersionId,
        scheduleId: data.scheduleId,
        tenantId: data.tenantId,
        triggerConceptId: data.triggerConceptId,
        requestedByUserId: data.requestedByUserId,
        parametersJson: data.parametersJson,
        outputFormatConceptId: data.outputFormatConceptId,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  findExecutionById(
    em: EntityManager,
    id: string,
  ): Promise<ReportExecutions | null> {
    return em.findOne(ReportExecutions, { id });
  }

  findExecutionForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<ReportExecutions | null> {
    return em.findOne(
      ReportExecutions,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  // --- Snapshots (UC-39-05) ---

  createSnapshot(
    em: EntityManager,
    data: {
      reportExecutionId: string;
      storageUri: string;
      contentHash?: string;
      rowCount?: string;
      sizeBytes?: string;
      expiresAt?: Date;
      actorUserId?: string;
    },
  ): ReportSnapshots {
    return em.create(
      ReportSnapshots,
      {
        reportExecutionId: data.reportExecutionId,
        storageUri: data.storageUri,
        contentHash: data.contentHash,
        rowCount: data.rowCount,
        sizeBytes: data.sizeBytes,
        expiresAt: data.expiresAt,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  findSnapshotByExecution(
    em: EntityManager,
    reportExecutionId: string,
  ): Promise<ReportSnapshots | null> {
    return em.findOne(ReportSnapshots, { reportExecutionId });
  }

  /** Snapshot con el mismo contenido: permite reaprovechar el artefacto ya guardado. */
  findSnapshotByHash(
    em: EntityManager,
    contentHash: string,
  ): Promise<ReportSnapshots | null> {
    return em.findOne(ReportSnapshots, { contentHash });
  }

  // --- Programaciones (UC-39-06, UC-39-07, UC-39-12) ---

  createSchedule(em: EntityManager, data: CreateScheduleData): ReportSchedules {
    return em.create(
      ReportSchedules,
      {
        reportDefinitionId: data.reportDefinitionId,
        tenantId: data.tenantId,
        name: data.name,
        cronExpression: data.cronExpression,
        timeZone: data.timeZone,
        parametersJson: data.parametersJson,
        outputFormatConceptId: data.outputFormatConceptId,
        isEnabled: true,
        nextRunAt: data.nextRunAt,
        stateConceptId: data.stateConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  findScheduleById(
    em: EntityManager,
    id: string,
  ): Promise<ReportSchedules | null> {
    return em.findOne(ReportSchedules, { id });
  }

  /**
   * Programaciones vencidas, tomadas con `FOR UPDATE SKIP LOCKED`: varios ticks
   * del cron pueden solaparse, y saltar lo que otro ya tiene tomado es lo que
   * da un disparo por ventana y no dos.
   */
  findDueSchedules(
    em: EntityManager,
    now: Date,
    activeStateConceptId: string,
    limit: number,
  ): Promise<ReportSchedules[]> {
    return em.find(
      ReportSchedules,
      {
        isEnabled: true,
        stateConceptId: activeStateConceptId,
        nextRunAt: { $ne: null, $lte: now },
      },
      {
        limit,
        orderBy: { nextRunAt: 'ASC' },
        lockMode: LockMode.PESSIMISTIC_PARTIAL_WRITE,
      },
    );
  }

  /** Programaciones de la definición, bloqueadas: deprecarla las suspende todas. */
  findSchedulesByDefinitionForUpdate(
    em: EntityManager,
    reportDefinitionId: string,
  ): Promise<ReportSchedules[]> {
    return em.find(
      ReportSchedules,
      { reportDefinitionId },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  // --- Distribuciones y suscripciones (UC-39-08, UC-39-09) ---

  createDistribution(
    em: EntityManager,
    data: {
      scheduleId?: string;
      reportExecutionId: string;
      recipientTypeConceptId: string;
      recipientUserId?: string;
      recipientAddress?: string;
      channelId: string;
      statusConceptId: string;
      actorUserId?: string;
    },
  ): ReportDistributions {
    return em.create(
      ReportDistributions,
      {
        scheduleId: data.scheduleId,
        reportExecutionId: data.reportExecutionId,
        recipientTypeConceptId: data.recipientTypeConceptId,
        recipientUserId: data.recipientUserId,
        recipientAddress: data.recipientAddress,
        channelId: data.channelId,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /** Distribuciones ya creadas para la corrida: una fila por destinatario. */
  findDistributionsByExecution(
    em: EntityManager,
    reportExecutionId: string,
  ): Promise<ReportDistributions[]> {
    return em.find(ReportDistributions, { reportExecutionId });
  }

  findDistributionsByExecutionForUpdate(
    em: EntityManager,
    reportExecutionId: string,
  ): Promise<ReportDistributions[]> {
    return em.find(
      ReportDistributions,
      { reportExecutionId },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  createSubscription(
    em: EntityManager,
    data: {
      reportScheduleId: string;
      subscriberUserId: string;
      channelId: string;
      actorUserId?: string;
    },
  ): ReportSubscriptions {
    return em.create(
      ReportSubscriptions,
      {
        reportScheduleId: data.reportScheduleId,
        subscriberUserId: data.subscriberUserId,
        channelId: data.channelId,
        isActive: true,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /** Suscripción previa del mismo usuario y canal: suscribirse es un upsert. */
  findSubscription(
    em: EntityManager,
    reportScheduleId: string,
    subscriberUserId: string,
    channelId: string,
  ): Promise<ReportSubscriptions | null> {
    return em.findOne(ReportSubscriptions, {
      reportScheduleId,
      subscriberUserId,
      channelId,
    });
  }

  /** Suscriptores activos de la programación: son los destinatarios del envío. */
  findActiveSubscriptions(
    em: EntityManager,
    reportScheduleId: string,
  ): Promise<ReportSubscriptions[]> {
    return em.find(ReportSubscriptions, { reportScheduleId, isActive: true });
  }
}
