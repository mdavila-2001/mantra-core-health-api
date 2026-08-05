import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PinoLogger } from 'nestjs-pino';
import { SystemApiClient } from '../../system-api-client.service';
import { runTick } from '../../run-tick.util';

const SCHEDULE_TICK_INTERVAL_MS = 15_000;
const BATCH_SIZE = 20;

/** Refleja `DueScheduleRunResultDto` (`modules/qa_lab/dto`) tal como viaja por HTTP. */
interface DueScheduleRunResult {
  scheduleId: string;
  runId?: string;
  runNumber?: string;
  nextRunAt?: string;
  skippedReason?: string;
}

/** Refleja `RunDueSchedulesResponseDto`. */
interface RunDueSchedulesResponse {
  claimed: number;
  queued: number;
  skipped: number;
  results: DueScheduleRunResult[];
}

/**
 * Fase 2 (P0) del plan de corrección de workers: cierra el "Disparo
 * programado" que `qa_lab/README.md` documenta como pendiente
 * ("`test_schedules` guarda cron y `next_run_at`; el tick que las dispara...").
 *
 * A diferencia de `notification-delivery` (descubrir + accionar cada ítem por
 * separado), aquí el lote es autocontenido: `POST /internal/qa/schedules/run-due`
 * ya reclama las programaciones vencidas con `SKIP LOCKED`, decide si la suite
 * y el entorno siguen aptos, encola la corrida y avanza `next_run_at` en una
 * sola transacción — igual que `OutboxRelayJob`, no hay nada más que
 * orquestar desde el worker.
 */
@Injectable()
export class QaScheduleTickJob {
  constructor(
    private readonly api: SystemApiClient,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(QaScheduleTickJob.name);
  }

  @Interval(SCHEDULE_TICK_INTERVAL_MS)
  async tick(): Promise<void> {
    await runTick(this.logger, 'worker.qa_lab.schedule-tick', async () => {
      const result = await this.api.post<RunDueSchedulesResponse>(
        '/internal/qa/schedules/run-due',
        { limit: BATCH_SIZE },
      );

      if (result.claimed === 0) return;

      this.logger.info(
        {
          operation: 'worker.qa_lab.schedule-tick',
          claimed: result.claimed,
          queued: result.queued,
          skipped: result.skipped,
        },
        'Due test schedules evaluated',
      );

      for (const skipped of result.results.filter((r) => r.skippedReason)) {
        this.logger.warn(
          {
            operation: 'worker.qa_lab.schedule-tick',
            scheduleId: skipped.scheduleId,
            reason: skipped.skippedReason,
          },
          'Scheduled test run skipped',
        );
      }
    });
  }
}
