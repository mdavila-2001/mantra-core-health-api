import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PinoLogger } from 'nestjs-pino';
import { SystemApiClient } from '../../system-api-client.service';
import { runTick } from '../../run-tick.util';

const BED_DAY_INTERVAL_MS = 900_000;

/** Refleja la respuesta de `POST /internal/billing/bed-day-charges/run`. */
interface BedDayRunResult {
  encounters: number;
  created: number;
  tariffMissing: number;
  repriced: number;
  voidedStale: number;
  categoryMissing: number;
  conflicts: number;
  failed: number;
}

/**
 * F5e · devengo programado del día-cama (CONTRATO-F2-F5 F5e).
 *
 * Cada 15 minutos le pide a la API que devengue las medianoches ya cumplidas de los
 * pacientes internados y los días mínimos de quienes egresaron. El endpoint es
 * idempotente (clave `BEDDAY:<encuentro>:<fecha>`), así que repetirlo, perder un
 * tick o solaparlo con el de otro worker no duplica ni omite cargos: tras el cierre
 * del censo (`clinical.census_day.closed`) y tras un egreso, el siguiente tick los recoge.
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
      const result = await this.api.post<BedDayRunResult>(
        '/internal/billing/bed-day-charges/run',
        {},
      );
      if (
        result.created === 0 &&
        result.repriced === 0 &&
        result.voidedStale === 0 &&
        result.conflicts === 0 &&
        result.failed === 0
      )
        return;
      this.logger.info(
        {
          operation: 'worker.billing.bed-day-charges',
          encounters: result.encounters,
          created: result.created,
          tariffMissing: result.tariffMissing,
          repriced: result.repriced,
          voidedStale: result.voidedStale,
          categoryMissing: result.categoryMissing,
          conflicts: result.conflicts,
          failed: result.failed,
        },
        'Días-cama devengados',
      );
    });
  }
}
