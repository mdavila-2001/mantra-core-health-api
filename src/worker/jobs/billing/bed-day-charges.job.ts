import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PinoLogger } from 'nestjs-pino';
import { SystemApiClient } from '../../system-api-client.service';
import { runTick } from '../../run-tick.util';

const BED_DAY_INTERVAL_MS = 60 * 60_000;

/** Respuesta del tick de censo. */
interface BlocksTickResult {
  bedDays: number;
  orTime: number;
}

/**
 * F5e (CONTRATO-F2-F5 §F5e): devenga los días-cama (regla de medianoche) y
 * el uso de quirófano por tiempo pendiente. El endpoint es idempotente por
 * `BEDDAY:<encuentro>:<fecha>` / `ORTIME:<caso>`.
 */
@Injectable()
export class BedDayChargesJob {
  constructor(
    private readonly api: SystemApiClient,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(BedDayChargesJob.name);
  }

  @Interval(BED_DAY_INTERVAL_MS)
  async tick(): Promise<void> {
    await runTick(this.logger, 'worker.billing.bed-day-charges', async () => {
      const result = await this.api.post<BlocksTickResult>(
        '/internal/billing/bed-day-charges/run',
        {},
      );
      if (result.bedDays === 0 && result.orTime === 0) return;
      this.logger.info(
        { operation: 'worker.billing.bed-day-charges', ...result },
        'Captured bed-day and OR time charges',
      );
    });
  }
}
