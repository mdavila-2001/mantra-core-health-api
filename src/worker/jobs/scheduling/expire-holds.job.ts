import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PinoLogger } from 'nestjs-pino';
import { SystemApiClient } from '../../system-api-client.service';
import { runTick } from '../../run-tick.util';

const EXPIRE_HOLDS_INTERVAL_MS = 30_000;
const BATCH_LIMIT = 100;

/** Refleja `WorkerBatchResultDto`. */
interface WorkerBatchResult {
  processed: number;
  detail: string;
}

/**
 * Fase 3 · UC-41-07: libera los holds de slot vencidos. Es una operación de
 * lote autocontenida (`SKIP LOCKED` vive en el propio endpoint) — no hace
 * falta una consulta de descubrimiento aparte.
 */
@Injectable()
export class ExpireHoldsJob {
  constructor(
    private readonly api: SystemApiClient,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ExpireHoldsJob.name);
  }

  @Interval(EXPIRE_HOLDS_INTERVAL_MS)
  async tick(): Promise<void> {
    await runTick(this.logger, 'worker.scheduling.expire-holds', async () => {
      const result = await this.api.post<WorkerBatchResult>(
        '/scheduling/internal/expire-holds',
        { limit: BATCH_LIMIT },
      );
      if (result.processed === 0) return;

      this.logger.info(
        {
          operation: 'worker.scheduling.expire-holds',
          processed: result.processed,
        },
        'Expired slot holds',
      );
    });
  }
}
