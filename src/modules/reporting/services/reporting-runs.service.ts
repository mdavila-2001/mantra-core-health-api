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
  ReportingDefinitionsRepository,
  ReportingRunsRepository,
} from '../repositories';
import { OUTPUT_FORMAT_CONCEPT } from './reporting-definitions.service';
import {
  CreateExecutionDto,
  ExecutionResponseDto,
  MaterializeSnapshotDto,
  SnapshotResponseDto,
  CreateScheduleDto,
  ScheduleResponseDto,
  SchedulerTickDto,
  SchedulerTickResponseDto,
  DispatchDistributionDto,
  DispatchResponseDto,
  SubscribeDto,
  SubscriptionResponseDto,
  RetryExecutionDto,
  RetryExecutionResponseDto,
} from '../dto';

const DEFAULT_TICK_BATCH = 50;
const DEFAULT_INTERVAL_MINUTES = 1440;

/**
 * Ejecución de reportes: corridas, snapshots, programaciones, distribución,
 * suscripciones y reintentos (UC-39-04 … 09, UC-39-11).
 */
@Injectable()
export class ReportingRunsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param runsRepo - Valor de runs repo requerido por la operación.
   * @param definitionsRepo - Valor de definitions repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly runsRepo: ReportingRunsRepository,
    private readonly definitionsRepo: ReportingDefinitionsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ReportingRunsService.name);
  }

  /**
   * UC-39-04: encolar una corrida bajo demanda. Se ejecuta contra la versión
   * vigente, y los parámetros obligatorios se validan antes de encolar: fallar
   * en el worker por un parámetro ausente es tarde.
   */
  async createExecution(
    definitionId: string,
    dto: CreateExecutionDto,
    actor: AuthenticatedUser,
  ): Promise<ExecutionResponseDto> {
    this.logger.info(
      { operation: 'reporting.execution.create', definitionId },
      'Queueing report execution',
    );

    return this.em.transactional(async (tx) => {
      const definition = await this.definitionsRepo.findDefinitionById(
        tx,
        definitionId,
      );
      if (!definition) {
        throw new ResourceNotFoundException('Definición no encontrada', {
          definitionId,
        });
      }
      if (definition.stateConceptId !== CONCEPTS.REPORT_STATE_ACTIVE) {
        throw new PreconditionFailedException('La definición no está activa', {
          definitionId,
          stateConceptId: definition.stateConceptId,
        });
      }

      const version = await this.definitionsRepo.findActiveVersion(
        tx,
        definitionId,
        definition.currentVersion,
      );
      if (!version) {
        throw new PreconditionFailedException(
          'La definición no tiene versión publicada',
          {
            definitionId,
          },
        );
      }

      const parameters = await this.definitionsRepo.findParametersByDefinition(
        tx,
        definitionId,
      );
      const values = this.resolveParameters(
        parameters,
        dto.parametersJson ?? {},
        definitionId,
      );

      const outputFormatConceptId = dto.outputFormat
        ? OUTPUT_FORMAT_CONCEPT[dto.outputFormat]
        : (definition.defaultOutputFormatConceptId ?? CONCEPTS.OUTPUT_CSV);

      const execution = this.runsRepo.createExecution(tx, {
        reportDefinitionId: definitionId,
        reportVersionId: version.id,
        tenantId: dto.tenantId ?? definition.tenantId,
        triggerConceptId: CONCEPTS.TRIGGER_ON_DEMAND,
        requestedByUserId: actor.id,
        parametersJson: values,
        outputFormatConceptId,
        statusConceptId: CONCEPTS.EXECUTION_QUEUED,
        actorUserId: actor.id,
      });

      return {
        id: execution.id,
        reportVersionId: version.id,
        statusConceptId: CONCEPTS.EXECUTION_QUEUED,
        outputFormatConceptId,
      };
    });
  }

  /**
   * UC-39-05: registrar el artefacto materializado y cerrar la corrida. El hash
   * del contenido permite reconocer que el resultado es idéntico a otro ya
   * guardado, algo habitual en reportes programados sobre datos que no cambian.
   */
  async materializeSnapshot(
    executionId: string,
    dto: MaterializeSnapshotDto,
    actor: AuthenticatedUser,
  ): Promise<SnapshotResponseDto> {
    this.logger.info(
      { operation: 'reporting.snapshot.materialize', executionId },
      'Materializing report snapshot',
    );

    return this.em.transactional(async (tx) => {
      const execution = await this.runsRepo.findExecutionForUpdate(
        tx,
        executionId,
      );
      if (!execution) {
        throw new ResourceNotFoundException('Ejecución no encontrada', {
          executionId,
        });
      }
      if (execution.statusConceptId === CONCEPTS.EXECUTION_SUCCEEDED) {
        throw new ConflictException('La ejecución ya está materializada', {
          executionId,
        });
      }
      if (execution.statusConceptId === CONCEPTS.EXECUTION_FAILED) {
        throw new PreconditionFailedException(
          'Una ejecución fallida se reintenta antes de materializar',
          { executionId },
        );
      }

      const existingForExecution = await this.runsRepo.findSnapshotByExecution(
        tx,
        executionId,
      );
      if (existingForExecution) {
        throw new ConflictException('La ejecución ya tiene snapshot', {
          executionId,
          snapshotId: existingForExecution.id,
        });
      }

      let contentDeduplicated = false;
      if (dto.contentHash) {
        const twin = await this.runsRepo.findSnapshotByHash(
          tx,
          dto.contentHash,
        );
        contentDeduplicated = twin !== null;
      }

      const expiresAt = dto.retentionDays
        ? new Date(Date.now() + dto.retentionDays * 24 * 60 * 60 * 1000)
        : undefined;

      const snapshot = this.runsRepo.createSnapshot(tx, {
        reportExecutionId: executionId,
        storageUri: dto.storageUri,
        contentHash: dto.contentHash,
        rowCount: dto.rowCount !== undefined ? String(dto.rowCount) : undefined,
        sizeBytes:
          dto.sizeBytes !== undefined ? String(dto.sizeBytes) : undefined,
        expiresAt,
        actorUserId: actor.id,
      });

      execution.statusConceptId = CONCEPTS.EXECUTION_SUCCEEDED;
      execution.finishedAt = new Date();
      execution.outputFileId = dto.outputFileId;
      execution.rowCount =
        dto.rowCount !== undefined ? String(dto.rowCount) : undefined;
      execution.errorText = undefined;
      touch(execution, actor.id);

      return {
        id: snapshot.id,
        reportExecutionId: executionId,
        executionStatusConceptId: CONCEPTS.EXECUTION_SUCCEEDED,
        expiresAt: expiresAt?.toISOString(),
        contentDeduplicated,
      };
    });
  }

  /** UC-39-06: programar la distribución periódica del reporte. */
  async createSchedule(
    definitionId: string,
    dto: CreateScheduleDto,
    actor: AuthenticatedUser,
  ): Promise<ScheduleResponseDto> {
    this.logger.info(
      {
        operation: 'reporting.schedule.create',
        definitionId,
        cron: dto.cronExpression,
      },
      'Creating report schedule',
    );

    const nextRunAt = new Date(dto.firstRunAt);

    return this.em.transactional(async (tx) => {
      const definition = await this.definitionsRepo.findDefinitionById(
        tx,
        definitionId,
      );
      if (!definition) {
        throw new ResourceNotFoundException('Definición no encontrada', {
          definitionId,
        });
      }
      // Programar un reporte que aún no tiene versión publicada dejaría un
      // disparo que fallaría en cada ventana.
      if (definition.stateConceptId !== CONCEPTS.REPORT_STATE_ACTIVE) {
        throw new PreconditionFailedException('La definición no está activa', {
          definitionId,
          stateConceptId: definition.stateConceptId,
        });
      }

      const parameters = await this.definitionsRepo.findParametersByDefinition(
        tx,
        definitionId,
      );
      const values = this.resolveParameters(
        parameters,
        dto.parametersJson ?? {},
        definitionId,
      );

      const schedule = this.runsRepo.createSchedule(tx, {
        reportDefinitionId: definitionId,
        tenantId: dto.tenantId ?? definition.tenantId,
        name: dto.name,
        cronExpression: dto.cronExpression,
        timeZone: dto.timeZone ?? 'UTC',
        parametersJson: values,
        outputFormatConceptId: OUTPUT_FORMAT_CONCEPT[dto.outputFormat],
        nextRunAt,
        stateConceptId: CONCEPTS.SCHEDULE_STATE_ACTIVE,
        actorUserId: actor.id,
      });

      return {
        id: schedule.id,
        name: dto.name,
        nextRunAt: nextRunAt.toISOString(),
        stateConceptId: CONCEPTS.SCHEDULE_STATE_ACTIVE,
      };
    });
  }

  /**
   * UC-39-07: disparar las programaciones vencidas. Se toman con SKIP LOCKED,
   * que es lo que da un disparo por ventana aunque varios ticks se solapen.
   */
  async schedulerTick(
    dto: SchedulerTickDto,
    actor: AuthenticatedUser,
  ): Promise<SchedulerTickResponseDto> {
    this.logger.info(
      { operation: 'reporting.scheduler.tick' },
      'Running scheduler tick',
    );

    const now = new Date();
    const intervalMinutes = dto.intervalMinutes ?? DEFAULT_INTERVAL_MINUTES;

    return this.em.transactional(async (tx) => {
      const due = await this.runsRepo.findDueSchedules(
        tx,
        now,
        CONCEPTS.SCHEDULE_STATE_ACTIVE,
        dto.batchSize ?? DEFAULT_TICK_BATCH,
      );

      const executionIds: string[] = [];
      let skipped = 0;

      for (const schedule of due) {
        const definition = await this.definitionsRepo.findDefinitionById(
          tx,
          schedule.reportDefinitionId,
        );
        const version = definition
          ? await this.definitionsRepo.findActiveVersion(
              tx,
              definition.id,
              definition.currentVersion,
            )
          : null;

        // Una programación cuya definición ya no está activa se salta y su
        // ventana avanza igual: reintentarla en cada tick sería un bucle.
        if (
          !definition ||
          definition.stateConceptId !== CONCEPTS.REPORT_STATE_ACTIVE ||
          !version
        ) {
          skipped += 1;
        } else {
          const execution = this.runsRepo.createExecution(tx, {
            reportDefinitionId: definition.id,
            reportVersionId: version.id,
            scheduleId: schedule.id,
            tenantId: schedule.tenantId,
            triggerConceptId: CONCEPTS.TRIGGER_SCHEDULED,
            parametersJson: schedule.parametersJson,
            outputFormatConceptId: schedule.outputFormatConceptId,
            statusConceptId: CONCEPTS.EXECUTION_QUEUED,
            actorUserId: actor.id,
          });
          executionIds.push(execution.id);
        }

        schedule.lastRunAt = now;
        schedule.nextRunAt = new Date(now.getTime() + intervalMinutes * 60_000);
        touch(schedule, actor.id);
      }

      return {
        scanned: due.length,
        queued: executionIds.length,
        skipped,
        executionIds,
      };
    });
  }

  /**
   * UC-39-08: crear una fila de distribución por destinatario. El envío real lo
   * hace messaging; aquí sólo se deja la intención, y una fila por destinatario
   * es lo que hace que reintentar no reenvíe dos veces.
   */
  async dispatchDistributions(
    executionId: string,
    dto: DispatchDistributionDto,
    actor: AuthenticatedUser,
  ): Promise<DispatchResponseDto> {
    this.logger.info(
      { operation: 'reporting.distribution.dispatch', executionId },
      'Dispatching report distributions',
    );

    return this.em.transactional(async (tx) => {
      const execution = await this.runsRepo.findExecutionById(tx, executionId);
      if (!execution) {
        throw new ResourceNotFoundException('Ejecución no encontrada', {
          executionId,
        });
      }
      // Distribuir algo que no terminó bien enviaría un reporte vacío o a medias.
      if (execution.statusConceptId !== CONCEPTS.EXECUTION_SUCCEEDED) {
        throw new PreconditionFailedException(
          'Sólo se distribuye una ejecución que terminó con éxito',
          { executionId, statusConceptId: execution.statusConceptId },
        );
      }

      const existing = await this.runsRepo.findDistributionsByExecution(
        tx,
        executionId,
      );
      const seen = new Set(
        existing.map(
          (d) => `${d.recipientUserId ?? d.recipientAddress}:${d.channelId}`,
        ),
      );

      const distributionIds: string[] = [];
      let skipped = 0;

      const targets: Array<{
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
      }> = [];

      if (execution.scheduleId) {
        const subscriptions = await this.runsRepo.findActiveSubscriptions(
          tx,
          execution.scheduleId,
        );
        for (const subscription of subscriptions) {
          targets.push({
            recipientTypeConceptId: CONCEPTS.RECIPIENT_USER,
            recipientUserId: subscription.subscriberUserId,
            channelId: subscription.channelId,
          });
        }
      }

      for (const recipient of dto.recipients ?? []) {
        if (recipient.recipientType === 'USER' && !recipient.recipientUserId) {
          throw new PreconditionFailedException(
            'Un destinatario USER necesita su identificador',
            {
              executionId,
            },
          );
        }
        if (
          recipient.recipientType === 'ADDRESS' &&
          !recipient.recipientAddress
        ) {
          throw new PreconditionFailedException(
            'Un destinatario ADDRESS necesita su dirección',
            {
              executionId,
            },
          );
        }
        targets.push({
          recipientTypeConceptId:
            recipient.recipientType === 'USER'
              ? CONCEPTS.RECIPIENT_USER
              : CONCEPTS.RECIPIENT_ADDRESS,
          recipientUserId: recipient.recipientUserId,
          recipientAddress: recipient.recipientAddress,
          channelId: recipient.channelId,
        });
      }

      for (const target of targets) {
        const key = `${target.recipientUserId ?? target.recipientAddress}:${target.channelId}`;
        if (seen.has(key)) {
          skipped += 1;
          continue;
        }
        const distribution = this.runsRepo.createDistribution(tx, {
          scheduleId: execution.scheduleId,
          reportExecutionId: executionId,
          recipientTypeConceptId: target.recipientTypeConceptId,
          recipientUserId: target.recipientUserId,
          recipientAddress: target.recipientAddress,
          channelId: target.channelId,
          statusConceptId: CONCEPTS.DISTRIBUTION_PENDING,
          actorUserId: actor.id,
        });
        seen.add(key);
        distributionIds.push(distribution.id);
      }

      return {
        reportExecutionId: executionId,
        created: distributionIds.length,
        skipped,
        distributionIds,
      };
    });
  }

  /** UC-39-09: suscribirse a una programación. Reactiva si ya existía. */
  async subscribe(
    scheduleId: string,
    dto: SubscribeDto,
    actor: AuthenticatedUser,
  ): Promise<SubscriptionResponseDto> {
    this.logger.info(
      { operation: 'reporting.subscription.create', scheduleId },
      'Subscribing to report schedule',
    );

    return this.em.transactional(async (tx) => {
      const schedule = await this.runsRepo.findScheduleById(tx, scheduleId);
      if (!schedule) {
        throw new ResourceNotFoundException('Programación no encontrada', {
          scheduleId,
        });
      }
      if (schedule.stateConceptId !== CONCEPTS.SCHEDULE_STATE_ACTIVE) {
        throw new PreconditionFailedException(
          'La programación no está activa',
          { scheduleId },
        );
      }

      const existing = await this.runsRepo.findSubscription(
        tx,
        scheduleId,
        actor.id,
        dto.channelId,
      );
      if (existing) {
        // Volver a suscribirse tras darse de baja es reactivar, no duplicar.
        const reactivated = !existing.isActive;
        existing.isActive = true;
        touch(existing, actor.id);
        return {
          id: existing.id,
          reportScheduleId: scheduleId,
          isActive: true,
          reactivated,
        };
      }

      const subscription = this.runsRepo.createSubscription(tx, {
        reportScheduleId: scheduleId,
        subscriberUserId: actor.id,
        channelId: dto.channelId,
        actorUserId: actor.id,
      });

      return {
        id: subscription.id,
        reportScheduleId: scheduleId,
        isActive: true,
        reactivated: false,
      };
    });
  }

  /**
   * UC-39-11: devolver una corrida fallida a la cola. El error se limpia y las
   * marcas de tiempo se reinician: la corrida vuelve a estar sin empezar.
   */
  async retryExecution(
    executionId: string,
    dto: RetryExecutionDto,
    actor: AuthenticatedUser,
  ): Promise<RetryExecutionResponseDto> {
    this.logger.info(
      { operation: 'reporting.execution.retry', executionId },
      'Retrying failed execution',
    );

    return this.em.transactional(async (tx) => {
      const execution = await this.runsRepo.findExecutionForUpdate(
        tx,
        executionId,
      );
      if (!execution) {
        throw new ResourceNotFoundException('Ejecución no encontrada', {
          executionId,
        });
      }
      if (execution.statusConceptId !== CONCEPTS.EXECUTION_FAILED) {
        throw new PreconditionFailedException(
          'Sólo se reintenta una ejecución fallida',
          {
            executionId,
            statusConceptId: execution.statusConceptId,
          },
        );
      }

      const definition = await this.definitionsRepo.findDefinitionById(
        tx,
        execution.reportDefinitionId,
      );
      if (definition?.stateConceptId === CONCEPTS.REPORT_DEPRECATED) {
        throw new PreconditionFailedException(
          'La definición está deprecada: no se reintenta su corrida',
          { executionId },
        );
      }

      execution.statusConceptId = CONCEPTS.EXECUTION_QUEUED;
      execution.triggerConceptId = CONCEPTS.TRIGGER_RETRY;
      execution.errorText = undefined;
      execution.startedAt = undefined;
      execution.finishedAt = undefined;
      touch(execution, actor.id);

      let distributionsRequeued = 0;
      if (dto.requeueDistributions) {
        const distributions =
          await this.runsRepo.findDistributionsByExecutionForUpdate(
            tx,
            executionId,
          );
        for (const distribution of distributions) {
          if (distribution.statusConceptId === CONCEPTS.DISTRIBUTION_PENDING)
            continue;
          distribution.statusConceptId = CONCEPTS.DISTRIBUTION_PENDING;
          distribution.sentAt = undefined;
          touch(distribution, actor.id);
          distributionsRequeued += 1;
        }
      }

      return {
        id: executionId,
        statusConceptId: CONCEPTS.EXECUTION_QUEUED,
        distributionsRequeued,
      };
    });
  }

  // --- Apoyo ---

  /**
   * Comprueba los parámetros obligatorios y rellena los que traen valor por
   * defecto. Lo que no está declarado se descarta: ejecutar con un parámetro
   * que la definición no reconoce sería aceptar entrada arbitraria.
   */
  private resolveParameters(
    declared: Array<{
      /**
       * Valor de code mantenido por la instancia.
       */
      code: string;
      /**
       * Valor de required mantenido por la instancia.
       */
      required?: boolean;
      /**
       * Valor de default value json mantenido por la instancia.
       */
      defaultValueJson?: unknown;
    }>,
    received: Record<string, unknown>,
    definitionId: string,
  ): Record<string, unknown> {
    const values: Record<string, unknown> = {};
    const missing: string[] = [];

    for (const parameter of declared) {
      const given = received[parameter.code];
      if (given !== undefined && given !== null) {
        values[parameter.code] = given;
        continue;
      }
      if (
        parameter.defaultValueJson !== undefined &&
        parameter.defaultValueJson !== null
      ) {
        values[parameter.code] = parameter.defaultValueJson;
        continue;
      }
      if (parameter.required) missing.push(parameter.code);
    }

    if (missing.length > 0) {
      throw new PreconditionFailedException(
        'Faltan parámetros obligatorios del reporte',
        {
          definitionId,
          missing,
        },
      );
    }

    return values;
  }
}
