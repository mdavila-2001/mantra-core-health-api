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

/**
 * Describe el contrato estructural de create execution data.
 */
export interface CreateExecutionData {
  /**
   * Identificador asociado a report definition.
   */
  reportDefinitionId: string;
  /**
   * Identificador asociado a report version.
   */
  reportVersionId?: string;
  /**
   * Identificador asociado a schedule.
   */
  scheduleId?: string;
  /**
   * Identificador asociado a tenant.
   */
  tenantId?: string;
  /**
   * Identificador asociado a trigger concept.
   */
  triggerConceptId: string;
  /**
   * Identificador asociado a requested by user.
   */
  requestedByUserId?: string;
  /**
   * Valor de parameters json mantenido por la instancia.
   */
  parametersJson?: unknown;
  /**
   * Identificador asociado a output format concept.
   */
  outputFormatConceptId?: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create schedule data.
 */
export interface CreateScheduleData {
  /**
   * Identificador asociado a report definition.
   */
  reportDefinitionId: string;
  /**
   * Identificador asociado a tenant.
   */
  tenantId?: string;
  /**
   * Valor de name mantenido por la instancia.
   */
  name: string;
  /**
   * Valor de cron expression mantenido por la instancia.
   */
  cronExpression: string;
  /**
   * Valor de time zone mantenido por la instancia.
   */
  timeZone?: string;
  /**
   * Valor de parameters json mantenido por la instancia.
   */
  parametersJson?: unknown;
  /**
   * Identificador asociado a output format concept.
   */
  outputFormatConceptId: string;
  /**
   * Valor de next run at mantenido por la instancia.
   */
  nextRunAt: Date;
  /**
   * Identificador asociado a state concept.
   */
  stateConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Acceso a la parte de ejecución de `reporting.*`: corridas, snapshots,
 * programaciones, distribuciones y suscripciones.
 */
@Injectable()
export class ReportingRunsRepository {
  // --- Ejecuciones (UC-39-04, UC-39-05, UC-39-11) ---

  /**
   * Crea create execution.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create execution conforme al contrato `ReportExecutions`.
   */
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

  /**
   * Obtiene find execution by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find execution by id conforme al contrato `Promise<ReportExecutions | null>`.
   */
  findExecutionById(
    em: EntityManager,
    id: string,
  ): Promise<ReportExecutions | null> {
    return em.findOne(ReportExecutions, { id });
  }

  /**
   * Obtiene find execution for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find execution for update conforme al contrato `Promise<ReportExecutions | null>`.
   */
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

  /**
   * Crea create snapshot.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create snapshot conforme al contrato `ReportSnapshots`.
   */
  createSnapshot(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a report execution.
       */
      reportExecutionId: string;
      /**
       * Valor de storage uri mantenido por la instancia.
       */
      storageUri: string;
      /**
       * Valor de content hash mantenido por la instancia.
       */
      contentHash?: string;
      /**
       * Valor de row count mantenido por la instancia.
       */
      rowCount?: string;
      /**
       * Valor de size bytes mantenido por la instancia.
       */
      sizeBytes?: string;
      /**
       * Valor de expires at mantenido por la instancia.
       */
      expiresAt?: Date;
      /**
       * Identificador asociado a actor user.
       */
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

  /**
   * Obtiene find snapshot by execution.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param reportExecutionId - Identificador de report execution.
   * @returns Resultado de find snapshot by execution conforme al contrato `Promise<ReportSnapshots | null>`.
   */
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

  /**
   * Crea create schedule.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create schedule conforme al contrato `ReportSchedules`.
   */
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

  /**
   * Obtiene find schedule by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find schedule by id conforme al contrato `Promise<ReportSchedules | null>`.
   */
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

  /**
   * Crea create distribution.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create distribution conforme al contrato `ReportDistributions`.
   */
  createDistribution(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a schedule.
       */
      scheduleId?: string;
      /**
       * Identificador asociado a report execution.
       */
      reportExecutionId: string;
      /**
       * Identificador asociado a recipient type concept.
       */
      recipientTypeConceptId: string;
      /**
       * Identificador asociado a recipient user.
       */
      recipientUserId?: string;
      /**
       * Valor de recipient address mantenido por la instancia.
       */
      recipientAddress?: string;
      /**
       * Identificador asociado a channel.
       */
      channelId: string;
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
      /**
       * Identificador asociado a actor user.
       */
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

  /**
   * Obtiene find distributions by execution for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param reportExecutionId - Identificador de report execution.
   * @returns Resultado de find distributions by execution for update conforme al contrato `Promise<ReportDistributions[]>`.
   */
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

  /**
   * Crea create subscription.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create subscription conforme al contrato `ReportSubscriptions`.
   */
  createSubscription(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a report schedule.
       */
      reportScheduleId: string;
      /**
       * Identificador asociado a subscriber user.
       */
      subscriberUserId: string;
      /**
       * Identificador asociado a channel.
       */
      channelId: string;
      /**
       * Identificador asociado a actor user.
       */
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
