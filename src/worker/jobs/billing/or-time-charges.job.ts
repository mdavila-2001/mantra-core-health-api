import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PinoLogger } from 'nestjs-pino';
import { SystemApiClient } from '../../system-api-client.service';
import { runTick } from '../../run-tick.util';

const OR_TIME_INTERVAL_MS = 300_000;

/** Refleja la respuesta de `POST /internal/billing/or-time-charges/run`. */
interface OrTimeRunResult {
  cases: number;
  created: number;
  tariffMissing: number;
  notChargeable: number;
  failed: number;
}

/**
 * F5e · devengo programado del uso de quirófano por tiempo.
 *
 * Cada 5 minutos le pide a la API que devengue los casos que pasaron a
 * `CASE_COMPLETED`. Es idempotente (`ORTIME:<caso>`): reintentar no duplica.
 */
@Injectable()
export class OrTimeChargesJob {
  constructor(
    private readonly api: SystemApiClient,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(OrTimeChargesJob.name);
  }

  @Interval(OR_TIME_INTERVAL_MS)
  async tick(): Promise<void> {
    await runTick(this.logger, 'worker.billing.or-time-charges', async () => {
      const result = await this.api.post<OrTimeRunResult>(
        '/internal/billing/or-time-charges/run',
        {},
      );
      if (result.created === 0 && result.failed === 0) return;
      this.logger.info(
        {
          operation: 'worker.billing.or-time-charges',
          cases: result.cases,
          created: result.created,
          tariffMissing: result.tariffMissing,
          notChargeable: result.notChargeable,
          failed: result.failed,
        },
        'Tiempo de quirófano devengado',
      );
    });
  }
}
