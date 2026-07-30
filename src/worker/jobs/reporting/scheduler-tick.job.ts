import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PinoLogger } from 'nestjs-pino';
import { SystemApiClient } from '../../system-api-client.service';
import { runTick } from '../../run-tick.util';

const TICK_INTERVAL_MS = 60_000;

/** Refleja `SchedulerTickResponseDto` (`modules/reporting/dto`). */
interface SchedulerTickResponse {
  scanned: number;
  queued: number;
  skipped: number;
  executionIds: string[];
}

/**
 * Fase 2 (P0) · UC-39-07: cierra el "tick" del planificador de reportes que
 * `reporting/README.md` da por sentado pero que nada disparaba.
 *
 * `schedulerTick` (`POST /reporting/scheduler/tick`) ya hace el
 * `SKIP LOCKED` internamente y deja las ejecuciones vencidas en
 * `report_executions` con estado `queued` — no hay una consulta de
 * descubrimiento aparte que hacer.
 *
 * A diferencia de `OutboxRelayJob`, este tick **no encadena** la distribución
 * (`POST /executions/:id/distributions`, UC-39-08): esa llamada exige una
 * ejecución que ya terminó con éxito (`EXECUTION_SUCCEEDED`), y
 * `schedulerTick` sólo encola (`EXECUTION_QUEUED`). La transición a
 * `succeeded` la hace el motor que corre el reporte y llama
 * `POST /executions/:id/snapshot` — el propio README de `reporting` lo deja
 * explícitamente pendiente ("Ejecución real de la consulta ... el worker que
 * lo hace llamará a `POST /executions/:id/snapshot`"), y ese motor no existe
 * todavía en este backend. Encadenar la distribución aquí sería fingir que la
 * corrida ya se ejecutó cuando en realidad sigue en cola.
 */
@Injectable()
export class SchedulerTickJob {
  constructor(
    private readonly api: SystemApiClient,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(SchedulerTickJob.name);
  }

  @Interval(TICK_INTERVAL_MS)
  async tick(): Promise<void> {
    await runTick(this.logger, 'worker.reporting.scheduler-tick', async () => {
      const result = await this.api.post<SchedulerTickResponse>(
        '/reporting/scheduler/tick',
        {},
      );

      if (result.scanned === 0) return;

      this.logger.info(
        {
          operation: 'worker.reporting.scheduler-tick',
          scanned: result.scanned,
          queued: result.queued,
          skipped: result.skipped,
        },
        'Reporting scheduler tick processed',
      );
    });
  }
}
