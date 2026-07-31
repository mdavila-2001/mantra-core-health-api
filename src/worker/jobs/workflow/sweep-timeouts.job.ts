import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PinoLogger } from 'nestjs-pino';
import { SystemApiClient } from '../../system-api-client.service';
import { runTick } from '../../run-tick.util';

const SWEEP_TIMEOUTS_INTERVAL_MS = 30_000;
const BATCH_SIZE = 100;

/** Refleja `SweepTimeoutsResponseDto`. */
interface SweepTimeoutsResponse {
  escalatedInstances: number;
  escalatedTasks: number;
  instanceIds: string[];
}

/**
 * Fase 3 · UC-32-10: escala las instancias de workflow con el plazo vencido.
 * Operación de lote autocontenida (`SKIP LOCKED` vive en el propio
 * endpoint) — no hace falta descubrimiento aparte. Escalar no cancela: el
 * propio endpoint lo documenta así.
 */
@Injectable()
export class SweepTimeoutsJob {
  constructor(
    private readonly api: SystemApiClient,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(SweepTimeoutsJob.name);
  }

  @Interval(SWEEP_TIMEOUTS_INTERVAL_MS)
  async tick(): Promise<void> {
    await runTick(this.logger, 'worker.workflow.sweep-timeouts', async () => {
      const result = await this.api.post<SweepTimeoutsResponse>(
        '/workflow/instances/sweep-timeouts',
        { batchSize: BATCH_SIZE },
      );
      if (result.escalatedInstances === 0) return;

      this.logger.info(
        {
          operation: 'worker.workflow.sweep-timeouts',
          escalatedInstances: result.escalatedInstances,
          escalatedTasks: result.escalatedTasks,
        },
        'Escalated timed-out workflow instances',
      );
    });
  }
}
