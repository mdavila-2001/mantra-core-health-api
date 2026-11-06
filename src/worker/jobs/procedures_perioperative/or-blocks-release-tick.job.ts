import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PinoLogger } from 'nestjs-pino';
import { SystemApiClient } from '../../system-api-client.service';
import { runTick } from '../../run-tick.util';

const OR_BLOCKS_TICK_INTERVAL_MS = 15 * 60_000;

/** Respuesta del tick de censo. */
interface BlocksTickResult {
  released: number;
}

/**
 * F4 (CONTRATO-F2-F5 §F4.3): libera los bloques de quirófano cuyo
 * `release_at` llegó sin casos ligados. El endpoint es idempotente.
 */
@Injectable()
export class OrBlocksReleaseTickJob {
  constructor(
    private readonly api: SystemApiClient,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(OrBlocksReleaseTickJob.name);
  }

  @Interval(OR_BLOCKS_TICK_INTERVAL_MS)
  async tick(): Promise<void> {
    await runTick(
      this.logger,
      'worker.periop.or-blocks-release-tick',
      async () => {
        const result = await this.api.post<BlocksTickResult>(
          '/internal/periop/or-blocks-release-tick',
          {},
        );
        if (result.released === 0) return;
        this.logger.info(
          { operation: 'worker.periop.or-blocks-release-tick', ...result },
          'Released due operating room blocks',
        );
      },
    );
  }
}
