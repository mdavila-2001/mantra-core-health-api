import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PinoLogger } from 'nestjs-pino';
import { SystemApiClient } from '../../system-api-client.service';
import { runTick } from '../../run-tick.util';

const BLOCKS_TICK_INTERVAL_MS = 60_000;

/** Refleja `BlocksTickResult`. */
interface BlocksTickResult {
  applied: number;
  deferred: number;
  overdue: number;
}

/**
 * F2 de infraestructura hospitalaria: aplica los bloqueos de espacios programados
 * cuya hora llegó y avisa de los que pasaron su fecha estimada de fin
 * (`POST /internal/practice/blocks-tick`). El endpoint es idempotente y se autocontiene:
 * no hace falta una consulta de descubrimiento aparte.
 */
@Injectable()
export class CareSpaceBlocksTickJob {
  constructor(
    private readonly api: SystemApiClient,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CareSpaceBlocksTickJob.name);
  }

  @Interval(BLOCKS_TICK_INTERVAL_MS)
  async tick(): Promise<void> {
    await runTick(
      this.logger,
      'worker.practice.care-space-blocks-tick',
      async () => {
        const result = await this.api.post<BlocksTickResult>(
          '/internal/practice/blocks-tick',
        );
        if (result.applied + result.deferred + result.overdue === 0) return;

        this.logger.info(
          {
            operation: 'worker.practice.care-space-blocks-tick',
            applied: result.applied,
            deferred: result.deferred,
            overdue: result.overdue,
          },
          'Applied scheduled care-space blocks and flagged overdue ones',
        );
      },
    );
  }
}
