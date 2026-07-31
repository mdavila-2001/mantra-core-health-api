import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PinoLogger } from 'nestjs-pino';
import { SystemApiClient } from '../../system-api-client.service';
import { runTick } from '../../run-tick.util';

const TICK_INTERVAL_MS = 30_000;

/** Refleja `RunDueSchedulesResponseDto` (`modules/health_context/dto`). */
interface RunDueSchedulesResponse {
  claimed: number;
  queued: number;
  results: Array<{ scheduleId: string; runId?: string }>;
}

/**
 * Fase 2 (`PLAN-CORRECCION-WORKERS-2026-07-28.md`): cierra el disparo
 * programado de recolección de contexto de país que `health_context/README.md`
 * documenta como pendiente ("resolución de la expresión cron... pertenece al
 * planificador, fuera de la [API]"). Antes de este job, nada evaluaba
 * `country_context_schedules.next_run_at`.
 */
@Injectable()
export class HealthContextScheduleTickJob {
  constructor(
    private readonly api: SystemApiClient,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(HealthContextScheduleTickJob.name);
  }

  @Interval(TICK_INTERVAL_MS)
  async tick(): Promise<void> {
    await runTick(
      this.logger,
      'worker.health-context.schedule-tick',
      async () => {
        const result = await this.api.post<RunDueSchedulesResponse>(
          '/health-context/internal/schedules/run-due',
          {},
        );

        if (result.claimed === 0) return;

        this.logger.info(
          {
            operation: 'worker.health-context.schedule-tick',
            claimed: result.claimed,
            queued: result.queued,
          },
          'Due country context schedules evaluated',
        );
      },
    );
  }
}
