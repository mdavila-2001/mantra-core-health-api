import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PinoLogger } from 'nestjs-pino';
import { SystemApiClient } from '../../system-api-client.service';
import { runTick } from '../../run-tick.util';

const BLOCKS_TICK_INTERVAL_MS = 60_000;

/** Refleja `BlocksTickResultDto`. */
interface BlocksTickResult {
  applied: number;
  overdue: number;
}

/**
 * F2 (CONTRATO-F2-F5 §F2.3): aplica los bloqueos de espacio programados cuyo
 * inicio llegó y avisa los vencidos. El endpoint es idempotente.
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
    await runTick(this.logger, 'worker.practice.blocks-tick', async () => {
      const result = await this.api.post<BlocksTickResult>(
        '/internal/practice/blocks-tick',
        {},
      );
      if (result.applied === 0 && result.overdue === 0) return;
      this.logger.info(
        { operation: 'worker.practice.blocks-tick', ...result },
        'Applied scheduled care space blocks',
      );
    });
  }
}
