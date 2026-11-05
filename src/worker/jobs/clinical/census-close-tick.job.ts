import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PinoLogger } from 'nestjs-pino';
import { SystemApiClient } from '../../system-api-client.service';
import { runTick } from '../../run-tick.util';

const CENSUS_TICK_INTERVAL_MS = 15 * 60_000;

/** Respuesta del tick de censo. */
interface BlocksTickResult {
  closed: number;
}

/**
 * F3 (CONTRATO-F2-F5 §F3.3): cierra los días de censo vencidos de cada sede
 * (ayer, hora local). El endpoint es idempotente por unidad.
 */
@Injectable()
export class CensusCloseTickJob {
  constructor(
    private readonly api: SystemApiClient,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CensusCloseTickJob.name);
  }

  @Interval(CENSUS_TICK_INTERVAL_MS)
  async tick(): Promise<void> {
    await runTick(
      this.logger,
      'worker.clinical.census-close-tick',
      async () => {
        const result = await this.api.post<BlocksTickResult>(
          '/internal/clinical/census-close-tick',
          {},
        );
        if (result.closed === 0) return;
        this.logger.info(
          { operation: 'worker.clinical.census-close-tick', ...result },
          'Closed due census days',
        );
      },
    );
  }
}
