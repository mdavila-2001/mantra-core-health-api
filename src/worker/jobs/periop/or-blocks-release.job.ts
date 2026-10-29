import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PinoLogger } from 'nestjs-pino';
import { SystemApiClient } from '../../system-api-client.service';
import { runTick } from '../../run-tick.util';

const OR_BLOCKS_RELEASE_INTERVAL_MS = 5 * 60_000;

/** Refleja `ReleaseTickResult` de `PeriopBlocksService`. */
interface ReleaseTickResult {
  released: number;
  blockIds: string[];
}

/**
 * F4: libera los bloques de quirófano cuyo plazo de liberación llegó y que no tienen casos
 * ligados (`POST /internal/periop/or-blocks-release-tick`). El endpoint es idempotente: un
 * tick repetido no encuentra nada que liberar.
 */
@Injectable()
export class OrBlocksReleaseJob {
  constructor(
    private readonly api: SystemApiClient,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(OrBlocksReleaseJob.name);
  }

  @Interval(OR_BLOCKS_RELEASE_INTERVAL_MS)
  async tick(): Promise<void> {
    await runTick(this.logger, 'worker.periop.or-blocks-release', async () => {
      const result = await this.api.post<ReleaseTickResult>(
        '/internal/periop/or-blocks-release-tick',
        {},
      );
      if (result.released === 0) return;
      this.logger.info(
        {
          operation: 'worker.periop.or-blocks-release',
          released: result.released,
        },
        'Released unused operating room blocks',
      );
    });
  }
}
