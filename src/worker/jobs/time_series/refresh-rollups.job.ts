import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PinoLogger } from 'nestjs-pino';
import { SEED } from '../../../common';
import { ROLLUP_NAMES } from '../../../modules/time_series/constants';
import { SystemApiClient } from '../../system-api-client.service';
import { runTick } from '../../run-tick.util';
import { WORKER_ENV, type WorkerEnv } from '../../worker.tokens';

const REFRESH_TICK_MS = 900_000;
const MS_PER_HOUR = 3_600_000;

/** Refleja `RefreshRollupResponseDto`. */
interface RefreshRollupResponse {
  rollup: string;
  bucketsMaterialized: number;
}

/**
 * UC-58-07/08: rematerializa la ventana reciente de cada agregado continuo.
 * Rematerializar la misma ventana dos veces es idempotente (TimescaleDB
 * recalcula, no acumula), así que solaparse con el tick anterior no
 * duplica nada — a diferencia de compresión/retención no hace falta
 * paginar ni reintentar entre tablas.
 */
@Injectable()
export class RefreshRollupsJob {
  constructor(
    private readonly api: SystemApiClient,
    private readonly logger: PinoLogger,
    @Inject(WORKER_ENV) private readonly env: WorkerEnv,
  ) {
    this.logger.setContext(RefreshRollupsJob.name);
  }

  @Interval(REFRESH_TICK_MS)
  async tick(): Promise<void> {
    const now = new Date();
    const from = new Date(
      now.getTime() - this.env.tsRollupRefreshWindowHours * MS_PER_HOUR,
    );

    for (const name of ROLLUP_NAMES) {
      await runTick(this.logger, 'worker.time_series.refresh-rollups', () =>
        this.refreshOne(name, from, now),
      );
    }
  }

  private async refreshOne(name: string, from: Date, to: Date): Promise<void> {
    const response = await this.api.post<RefreshRollupResponse>(
      `/ts/admin/rollups/${name}/refresh`,
      {
        from: from.toISOString(),
        to: to.toISOString(),
        batchId: randomUUID(),
        tenantId: SEED.tenantId,
      },
    );

    this.logger.info(
      {
        operation: 'worker.time_series.refresh-rollups',
        rollup: name,
        bucketsMaterialized: response.bucketsMaterialized,
      },
      'Rollup window refreshed',
    );
  }
}
