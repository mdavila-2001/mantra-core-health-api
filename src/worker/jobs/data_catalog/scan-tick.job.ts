import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PinoLogger } from 'nestjs-pino';
import { SystemApiClient } from '../../system-api-client.service';
import { runTick } from '../../run-tick.util';

/**
 * Cada cuánto se mira si hay un escaneo en cola. Un escaneo es raro y dura
 * segundos; lo que importa es que una corrida aceptada no espere minutos.
 */
const SCAN_TICK_INTERVAL_MS = 10_000;

interface RunNextResponse {
  claimed: number;
  scanId?: string;
  status?: string;
  fenced?: boolean;
}

/**
 * Reloj del catálogo de datos: pide a la API que reclame y ejecute la
 * siguiente corrida de escaneo. La API hace el trabajo y la base guarda el
 * estado; el worker sólo aporta el "cuándo", así que puede morir y reiniciarse
 * sin perder nada (el lease vencido deja que la próxima vuelta la retome).
 */
@Injectable()
export class CatalogScanTickJob {
  constructor(
    private readonly api: SystemApiClient,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CatalogScanTickJob.name);
  }

  @Interval(SCAN_TICK_INTERVAL_MS)
  async tick(): Promise<void> {
    await runTick(this.logger, 'worker.data_catalog.scan-tick', async () => {
      const result = await this.api.post<RunNextResponse>(
        '/internal/catalog/scans/run-next',
        {},
      );
      if (result.claimed === 0) return;

      const log = {
        operation: 'worker.data_catalog.scan-tick',
        scanId: result.scanId,
        status: result.status,
      };
      if (result.fenced) {
        this.logger.warn(log, 'Catalog scan lease lost to another worker');
      } else {
        this.logger.info(log, 'Catalog scan processed');
      }
    });
  }
}
