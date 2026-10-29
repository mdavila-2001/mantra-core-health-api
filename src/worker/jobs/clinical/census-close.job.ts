import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PinoLogger } from 'nestjs-pino';
import { SystemApiClient } from '../../system-api-client.service';
import { runTick } from '../../run-tick.util';

const CENSUS_CLOSE_INTERVAL_MS = 900_000;

/** Refleja la respuesta de `POST /internal/clinical/census-close-tick`. */
interface CensusCloseTickResult {
  sites: number;
  daysClosed: number;
  unitsClosed: number;
  failed: number;
}

/**
 * F3 · cierre programado del censo diario (CONTRATO-F2-F5 F3.3).
 *
 * Cada 15 minutos le pide a la API que cierre los días vencidos de todas las
 * sedes con camas censables. El endpoint recorre los últimos días terminados de
 * cada sede y cierra los que falten, así que el job es idempotente: repetirlo, o
 * perder un tick, no deja un día sin cerrar ni cierra uno dos veces.
 */
@Injectable()
export class CensusCloseJob {
  constructor(
    private readonly api: SystemApiClient,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CensusCloseJob.name);
  }

  @Interval(CENSUS_CLOSE_INTERVAL_MS)
  async tick(): Promise<void> {
    await runTick(this.logger, 'worker.clinical.census-close', async () => {
      const result = await this.api.post<CensusCloseTickResult>(
        '/internal/clinical/census-close-tick',
      );
      if (result.daysClosed === 0 && result.failed === 0) return;
      this.logger.info(
        {
          operation: 'worker.clinical.census-close',
          sites: result.sites,
          daysClosed: result.daysClosed,
          unitsClosed: result.unitsClosed,
          failed: result.failed,
        },
        'Censos diarios cerrados',
      );
    });
  }
}
