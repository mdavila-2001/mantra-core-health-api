import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { CronTime } from 'cron';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { HealthContextRepository } from '../repositories';
import type { CountryContextSchedules } from '../entities';
import {
  CreateAgentDto,
  AgentResponseDto,
  CreateSourceDto,
  SourceResponseDto,
  CreateScheduleDto,
  ScheduleResponseDto,
  RunDueSchedulesDto,
  RunDueSchedulesResponseDto,
  DueScheduleRunResultDto,
  StartCollectionRunDto,
  CollectionRunResponseDto,
  RecordObservationDto,
  ObservationResponseDto,
  FinishCollectionRunDto,
  FinishRunResponseDto,
  type CollectionTrigger,
  type ObservationStatus,
  type RunOutcome,
} from '../dto';

const TRIGGER_CONCEPT: Readonly<Record<CollectionTrigger, string>> = {
  SCHEDULED: CONCEPTS.HCTX_TRIGGER_SCHEDULED,
  MANUAL: CONCEPTS.HCTX_TRIGGER_MANUAL,
};

const OBSERVATION_STATUS_CONCEPT: Readonly<Record<ObservationStatus, string>> =
  {
    ACCEPTED: CONCEPTS.HCTX_OBS_ACCEPTED,
    REJECTED: CONCEPTS.HCTX_OBS_REJECTED,
  };

const RUN_OUTCOME_CONCEPT: Readonly<Record<RunOutcome, string>> = {
  SUCCEEDED: CONCEPTS.HCTX_RUN_SUCCEEDED,
  PARTIAL: CONCEPTS.HCTX_RUN_PARTIAL,
  FAILED: CONCEPTS.HCTX_RUN_FAILED,
};

/** Cron de cinco campos: minuto, hora, día del mes, mes y día de la semana. */
const CRON_FIELDS = 5;
const DEFAULT_DUE_SCHEDULES_BATCH = 20;
/**
 * `timezone_concept_id` es opcional y hoy no hay catálogo que traduzca un
 * concepto a una zona IANA — se asume UTC hasta que exista esa resolución,
 * igual que `automation`/`qa_lab` con sus disparadores de calendario.
 */
const DEFAULT_SCHEDULE_TIMEZONE = 'UTC';

/**
 * Recolección de contexto: agentes, fuentes, programaciones, corridas y
 * observaciones inmutables (UC-44-01 … 03, 05, 06, 10).
 *
 * Todo lo que entra aquí es **agregado de país**: el módulo no recibe ni guarda
 * datos de paciente, y la confianza de la fuente es lo que gobierna qué se
 * acepta.
 */
@Injectable()
export class ContextCollectionService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param contextRepo - Valor de context repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly contextRepo: HealthContextRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ContextCollectionService.name);
  }

  /** UC-44-01: registrar el agente recolector. */
  async createAgent(
    dto: CreateAgentDto,
    actor: AuthenticatedUser,
  ): Promise<AgentResponseDto> {
    this.logger.info(
      { operation: 'health-context.agent.create', code: dto.code },
      'Registering context agent',
    );

    return this.em.transactional(async (tx) => {
      const duplicate = await this.contextRepo.findAgentByCode(tx, dto.code);
      if (duplicate) {
        throw new ConflictException('Ya existe un agente con ese código', {
          code: dto.code,
        });
      }

      const agent = this.contextRepo.createAgent(tx, {
        code: dto.code,
        name: dto.name,
        agentTypeConceptId: dto.agentTypeConceptId,
        providerId: dto.providerId,
        implementationRef: dto.implementationRef,
        ownerTenantId: dto.ownerTenantId,
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        actorUserId: actor.id,
      });

      return {
        id: agent.id,
        code: dto.code,
        statusConceptId: CONCEPTS.STATE_ACTIVE,
      };
    });
  }

  /** UC-44-02: registrar la fuente con su licencia y su nivel de confianza. */
  async createSource(
    dto: CreateSourceDto,
    actor: AuthenticatedUser,
  ): Promise<SourceResponseDto> {
    this.logger.info(
      { operation: 'health-context.source.create', code: dto.code },
      'Registering health context source',
    );

    return this.em.transactional(async (tx) => {
      const duplicate = await this.contextRepo.findSourceByCode(tx, dto.code);
      if (duplicate) {
        throw new ConflictException('Ya existe una fuente con ese código', {
          code: dto.code,
        });
      }

      const source = this.contextRepo.createSource(tx, {
        code: dto.code,
        name: dto.name,
        sourceTypeConceptId: dto.sourceTypeConceptId,
        ownerName: dto.ownerName,
        canonicalUrl: dto.canonicalUrl,
        countryConceptId: dto.countryConceptId,
        licenseText: dto.licenseText,
        trustTierConceptId: dto.trustTierConceptId,
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        actorUserId: actor.id,
      });

      return {
        id: source.id,
        code: dto.code,
        statusConceptId: CONCEPTS.STATE_ACTIVE,
      };
    });
  }

  /** UC-44-03: programar la recolección de un país con su agente. */
  async createSchedule(
    dto: CreateScheduleDto,
    actor: AuthenticatedUser,
  ): Promise<ScheduleResponseDto> {
    this.logger.info(
      { operation: 'health-context.schedule.create', agentId: dto.agentId },
      'Scheduling country context collection',
    );

    this.assertCronExpression(dto.scheduleExpression);

    return this.em.transactional(async (tx) => {
      const agent = await this.contextRepo.findAgentById(tx, dto.agentId);
      if (!agent) {
        throw new ResourceNotFoundException('Agente no encontrado', {
          agentId: dto.agentId,
        });
      }
      if (agent.statusConceptId !== CONCEPTS.STATE_ACTIVE) {
        throw new PreconditionFailedException('El agente no está activo', {
          agentId: dto.agentId,
        });
      }

      const nextRunAt = dto.nextRunAt ? new Date(dto.nextRunAt) : undefined;
      const schedule = this.contextRepo.createSchedule(tx, {
        countryConceptId: dto.countryConceptId,
        agentId: dto.agentId,
        scheduleExpression: dto.scheduleExpression,
        timezoneConceptId: dto.timezoneConceptId,
        lookbackDays: dto.lookbackDays,
        freshnessTtlSeconds: dto.freshnessTtlSeconds,
        nextRunAt,
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        actorUserId: actor.id,
      });

      return {
        id: schedule.id,
        agentId: dto.agentId,
        nextRunAt: nextRunAt?.toISOString(),
        statusConceptId: CONCEPTS.STATE_ACTIVE,
      };
    });
  }

  /**
   * Tick de recolección (Fase 2 del plan de corrección de workers): cierra
   * el "Pendiente" del README ("resolución de la expresión cron... pertenece
   * al planificador, fuera de la [API]") — antes de este método nada
   * evaluaba si una programación estaba vencida ni la disparaba.
   *
   * Reclama el lote con `SKIP LOCKED` y, para cada programación, encola la
   * corrida (misma idempotencia que `startCollectionRun`: `schedule:<id>:<marca
   * vencida>`) y avanza `next_run_at` siempre — haya o no corrida — para que
   * una marca que no pudo dispararse no deje al tick reintentando el mismo
   * instante para siempre.
   */
  async runDueSchedules(
    dto: RunDueSchedulesDto,
    actor: AuthenticatedUser,
  ): Promise<RunDueSchedulesResponseDto> {
    const now = new Date();
    const limit = dto.limit ?? DEFAULT_DUE_SCHEDULES_BATCH;

    this.logger.info(
      { operation: 'health-context.schedule.run-due', limit },
      'Evaluating due country context schedules',
    );

    return this.em.transactional(async (tx) => {
      const due = await this.contextRepo.claimDueSchedules(
        tx,
        now,
        CONCEPTS.STATE_ACTIVE,
        limit,
      );

      const results: DueScheduleRunResultDto[] = [];
      let queued = 0;

      for (const schedule of due) {
        const result = await this.runDueSchedule(tx, schedule, now, actor);
        if (result.runId) queued += 1;
        results.push(result);
      }

      if (due.length > 0) {
        this.logger.info(
          {
            operation: 'health-context.schedule.run-due',
            claimed: due.length,
            queued,
            skipped: due.length - queued,
          },
          'Due country context schedules evaluated',
        );
      }

      return { claimed: due.length, queued, results };
    });
  }

  /** Evalúa una única programación vencida: encola la corrida y avanza la marca. */
  private async runDueSchedule(
    tx: EntityManager,
    schedule: CountryContextSchedules,
    now: Date,
    actor: AuthenticatedUser,
  ): Promise<DueScheduleRunResultDto> {
    const dueAt = schedule.nextRunAt ?? now;
    let runId: string | undefined;
    let skippedReason: string | undefined;

    const agent = await this.contextRepo.findAgentById(tx, schedule.agentId);
    if (!agent || agent.statusConceptId !== CONCEPTS.STATE_ACTIVE) {
      skippedReason = 'AGENT_NOT_ACTIVE';
    } else {
      const idempotencyKey = `schedule:${schedule.id}:${dueAt.toISOString()}`;
      const existing = await this.contextRepo.findRunByIdempotencyKey(
        tx,
        idempotencyKey,
      );
      if (existing) {
        runId = existing.id;
      } else {
        const run = this.contextRepo.createCollectionRun(tx, {
          scheduleId: schedule.id,
          agentId: schedule.agentId,
          countryConceptId: schedule.countryConceptId,
          idempotencyKey,
          triggerConceptId: TRIGGER_CONCEPT.SCHEDULED,
          statusConceptId: CONCEPTS.HCTX_RUN_RUNNING,
          recordedByUserId: actor.id,
        });
        runId = run.id;
      }
    }

    // `scheduleExpression` es NOT NULL en el esquema (a diferencia de
    // `qa_lab.test_schedules.cronExpression`, que sí admite nulo): toda fila
    // que pasó por `createSchedule` (la única forma de crearla) trae una
    // expresión válida, así que `computeNextRunAt` siempre devuelve una marca.
    schedule.nextRunAt = this.computeNextRunAt(schedule, dueAt);
    touch(schedule, actor.id);

    if (skippedReason) {
      this.logger.warn(
        {
          operation: 'health-context.schedule.run-due',
          scheduleId: schedule.id,
          reason: skippedReason,
        },
        'Scheduled context collection skipped',
      );
    }

    return {
      scheduleId: schedule.id,
      runId,
      nextRunAt: schedule.nextRunAt?.toISOString(),
      skippedReason,
    };
  }

  /** Próxima marca del cron a partir de la marca vencida. */
  private computeNextRunAt(
    schedule: CountryContextSchedules,
    from: Date,
  ): Date | undefined {
    if (!schedule.scheduleExpression) return undefined;
    const timezone = DEFAULT_SCHEDULE_TIMEZONE;
    const cronTime = new CronTime(schedule.scheduleExpression, timezone);
    // `getNextDateFrom` sin segundo argumento deriva la zona de `from` (la del
    // proceso, si `from` es un `Date` nativo) en vez de la zona con la que se
    // construyó `CronTime` — hay que pasarla explícita también aquí.
    return cronTime.getNextDateFrom(from, timezone).toJSDate();
  }

  /**
   * UC-44-05: arrancar la corrida. Es idempotente por clave: el scheduler
   * reintenta, y dos corridas de la misma marca duplicarían las observaciones.
   */
  async startCollectionRun(
    dto: StartCollectionRunDto,
    actor: AuthenticatedUser,
  ): Promise<CollectionRunResponseDto> {
    this.logger.info(
      {
        operation: 'health-context.run.start',
        trigger: dto.trigger,
        scheduleId: dto.scheduleId,
      },
      'Starting context collection run',
    );

    return this.em.transactional(async (tx) => {
      const existing = await this.contextRepo.findRunByIdempotencyKey(
        tx,
        dto.idempotencyKey,
      );
      if (existing) {
        return {
          id: existing.id,
          statusConceptId: existing.statusConceptId,
          duplicate: true,
        };
      }

      let agentId = dto.agentId;
      let countryConceptId = dto.countryConceptId;

      if (dto.scheduleId) {
        const schedule = await this.contextRepo.findScheduleForUpdate(
          tx,
          dto.scheduleId,
        );
        if (!schedule) {
          throw new ResourceNotFoundException('Programación no encontrada', {
            scheduleId: dto.scheduleId,
          });
        }
        if (schedule.statusConceptId !== CONCEPTS.STATE_ACTIVE) {
          throw new PreconditionFailedException(
            'La programación no está activa',
            {
              scheduleId: dto.scheduleId,
            },
          );
        }

        agentId ??= schedule.agentId;
        countryConceptId ??= schedule.countryConceptId;

        // Adelantar `next_run_at` en el mismo arranque evita que el scheduler
        // vuelva a encolar la misma marca mientras la corrida sigue viva.
        if (dto.nextRunAt) {
          schedule.nextRunAt = new Date(dto.nextRunAt);
          touch(schedule, actor.id);
        }
      }

      // Una corrida manual sin programación tiene que decir a quién y a qué país
      // pertenece; deducirlo sería inventarlo.
      if (!agentId || !countryConceptId) {
        throw new PreconditionFailedException(
          'La corrida necesita agente y país, o una programación de la que salgan',
          { idempotencyKey: dto.idempotencyKey },
        );
      }

      const agent = await this.contextRepo.findAgentById(tx, agentId);
      if (!agent) {
        throw new ResourceNotFoundException('Agente no encontrado', {
          agentId,
        });
      }
      if (agent.statusConceptId !== CONCEPTS.STATE_ACTIVE) {
        throw new PreconditionFailedException('El agente no está activo', {
          agentId,
        });
      }

      const run = this.contextRepo.createCollectionRun(tx, {
        scheduleId: dto.scheduleId,
        agentId,
        countryConceptId,
        idempotencyKey: dto.idempotencyKey,
        triggerConceptId: TRIGGER_CONCEPT[dto.trigger],
        statusConceptId: CONCEPTS.HCTX_RUN_RUNNING,
        recordedByUserId: actor.id,
      });

      return {
        id: run.id,
        statusConceptId: CONCEPTS.HCTX_RUN_RUNNING,
        duplicate: false,
      };
    });
  }

  /**
   * UC-44-06: registrar una observación de fuente. Es inmutable y se deduplica
   * por hash dentro de la corrida: el mismo documento leído dos veces no cuenta
   * dos veces.
   */
  async recordObservation(
    runId: string,
    dto: RecordObservationDto,
    actor: AuthenticatedUser,
  ): Promise<ObservationResponseDto> {
    this.logger.info(
      {
        operation: 'health-context.observation.record',
        runId,
        sourceId: dto.sourceId,
      },
      'Recording context source observation',
    );

    return this.em.transactional(async (tx) => {
      const run = await this.contextRepo.findRunForUpdate(tx, runId);
      if (!run) {
        throw new ResourceNotFoundException('Corrida no encontrada', { runId });
      }
      if (run.statusConceptId !== CONCEPTS.HCTX_RUN_RUNNING) {
        throw new PreconditionFailedException(
          'La corrida ya no está en curso',
          { runId },
        );
      }

      const source = await this.contextRepo.findSourceById(tx, dto.sourceId);
      if (!source) {
        throw new ResourceNotFoundException('Fuente no encontrada', {
          sourceId: dto.sourceId,
        });
      }
      if (source.statusConceptId !== CONCEPTS.STATE_ACTIVE) {
        throw new PreconditionFailedException('La fuente no está activa', {
          sourceId: dto.sourceId,
        });
      }

      const duplicate = await this.contextRepo.findObservationByHash(
        tx,
        runId,
        dto.contentHash,
      );
      if (duplicate) {
        return {
          id: duplicate.id,
          statusConceptId: duplicate.statusConceptId,
          duplicate: true,
        };
      }

      const statusConceptId = OBSERVATION_STATUS_CONCEPT[dto.status];
      const observation = this.contextRepo.createObservation(tx, {
        collectionRunId: runId,
        sourceId: dto.sourceId,
        countryConceptId: run.countryConceptId,
        sourceLocator: dto.sourceLocator,
        publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : undefined,
        retrievedAt: dto.retrievedAt ? new Date(dto.retrievedAt) : undefined,
        mediaType: dto.mediaType,
        rawPayloadFileId: dto.rawPayloadFileId,
        extractedPayloadJson: dto.extractedPayloadJson,
        contentHash: dto.contentHash,
        statusConceptId,
        recordedByUserId: actor.id,
      });

      // Los contadores del run se llevan al vuelo y se concilian al cerrarlo
      // (UC-44-10): así el progreso es visible sin esperar al final.
      run.observationsRead = this.increment(run.observationsRead);
      if (dto.status === 'ACCEPTED') {
        run.observationsAccepted = this.increment(run.observationsAccepted);
      } else {
        run.observationsRejected = this.increment(run.observationsRejected);
        this.logger.warn(
          {
            operation: 'health-context.observation.record',
            runId,
            sourceId: dto.sourceId,
          },
          'Context source observation rejected',
        );
      }

      return { id: observation.id, statusConceptId, duplicate: false };
    });
  }

  /**
   * UC-44-10: cerrar la corrida conciliando los contadores contra la tabla de
   * observaciones. Los llevados al vuelo pueden haberse quedado cortos si algo
   * falló a medias; los de cierre son los que quedan en el histórico.
   */
  async finishCollectionRun(
    runId: string,
    dto: FinishCollectionRunDto,
    actor: AuthenticatedUser,
  ): Promise<FinishRunResponseDto> {
    this.logger.info(
      { operation: 'health-context.run.finish', runId, outcome: dto.outcome },
      'Finishing context collection run',
    );

    if (dto.outcome === 'FAILED' && !dto.errorSummary) {
      throw new PreconditionFailedException(
        'Una corrida fallida debe declarar qué salió mal',
        {
          runId,
        },
      );
    }

    return this.em.transactional(async (tx) => {
      const run = await this.contextRepo.findRunForUpdate(tx, runId);
      if (!run) {
        throw new ResourceNotFoundException('Corrida no encontrada', { runId });
      }
      // La corrida es un log: se cierra una vez y no se reabre.
      if (run.statusConceptId !== CONCEPTS.HCTX_RUN_RUNNING) {
        throw new ConflictException('La corrida ya está cerrada', { runId });
      }

      const observations = await this.contextRepo.findObservationsByRun(
        tx,
        runId,
      );
      const accepted = observations.filter(
        (observation) =>
          observation.statusConceptId === CONCEPTS.HCTX_OBS_ACCEPTED,
      ).length;
      const rejected = observations.length - accepted;
      const sourceCount = new Set(
        observations.map((observation) => observation.sourceId),
      ).size;

      run.statusConceptId = RUN_OUTCOME_CONCEPT[dto.outcome];
      run.finishedAt = new Date();
      run.observationsRead = String(observations.length);
      run.observationsAccepted = String(accepted);
      run.observationsRejected = String(rejected);
      run.sourceCount = sourceCount;
      run.continuationCursorJson = dto.continuationCursorJson;
      run.errorSummary = dto.errorSummary;

      if (dto.outcome !== 'FAILED' && run.scheduleId) {
        const schedule = await this.contextRepo.findScheduleForUpdate(
          tx,
          run.scheduleId,
        );
        if (schedule) {
          schedule.lastSuccessAt = new Date();
          touch(schedule, actor.id);
        }
      }
      if (dto.outcome === 'FAILED') {
        this.logger.warn(
          {
            operation: 'health-context.run.finish',
            runId,
            errorSummary: dto.errorSummary,
          },
          'Context collection run failed',
        );
      }

      return {
        id: runId,
        statusConceptId: run.statusConceptId,
        observationsRead: String(observations.length),
        observationsAccepted: String(accepted),
        observationsRejected: String(rejected),
        sourceCount,
      };
    });
  }

  // --- Apoyo ---

  /**
   * Los contadores de la corrida son `bigint` y viajan como cadena: se suman con
   * `BigInt` para que una recolección larga no pierda precisión.
   */
  private increment(value: string | undefined): string {
    return (BigInt(value ?? '0') + 1n).toString();
  }

  /**
   * Comprobación de forma del cron, no de semántica: cinco campos separados por
   * espacios. Interpretarlo es del scheduler, pero una expresión que no tiene
   * ni la forma correcta no llegaría nunca a ejecutarse y conviene rechazarla
   * al programar, no la primera noche que no corrió.
   */
  private assertCronExpression(expression: string): void {
    const fields = expression.trim().split(/\s+/);
    if (fields.length !== CRON_FIELDS) {
      throw new PreconditionFailedException(
        'La expresión de programación debe tener cinco campos',
        { scheduleExpression: expression },
      );
    }
  }
}
