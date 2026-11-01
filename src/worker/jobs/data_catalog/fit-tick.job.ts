import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PinoLogger } from 'nestjs-pino';
import { SystemApiClient } from '../../system-api-client.service';
import { runTick } from '../../run-tick.util';

/**
 * Cada cuánto corre la sonda de ajuste de la catalogación. Es lo que tarda en volverse
 * «atrasado» un resultado dividido entre tres (`FIT_STALE_AFTER_MS` en la API): el tick tiene
 * tres oportunidades de renovarlo antes de que la consola lo marque.
 */
const FIT_TICK_INTERVAL_MS = 5 * 60 * 1000;

interface FitRunResponse {
  runId: string;
  status: 'EN_CURSO' | 'COMPLETADA' | 'FALLIDA';
  created: boolean;
  verdict?: 'AJUSTADA' | 'CON_AVISOS' | 'DESAJUSTADA' | 'SIN_DATOS';
  failedChecks?: number;
  blindSpots?: number;
  errorCode?: string | null;
}

/**
 * Reloj de la sonda de ajuste del catálogo (módulo 67). Igual que `CatalogScanTickJob`, el worker
 * sólo aporta el «cuándo»: la API corre las comprobaciones y guarda el resultado.
 *
 * **No hay un mecanismo de liveness paralelo.** El tick pasa por `runTick`, que alimenta el
 * registro de salud del proceso (`workerHealth`): su última ejecución, su resultado y sus fallos
 * consecutivos salen en `/status` del worker `data_catalog` y en lo que el latido de ese worker
 * publique hacia «Instancias». Para que la sonda de la sonda se vea, un fallo de la sonda **tiene
 * que fallar el tick**: por eso el endpoint espera el desenlace y este job lanza si la corrida
 * quedó `FALLIDA`. Un catálogo desajustado, en cambio, NO es un tick fallido: es el hallazgo que
 * la sonda existe para dar, y sólo se registra.
 */
@Injectable()
export class CatalogFitTickJob {
  constructor(
    private readonly api: SystemApiClient,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CatalogFitTickJob.name);
  }

  @Interval(FIT_TICK_INTERVAL_MS)
  async tick(): Promise<void> {
    await runTick(this.logger, 'worker.data_catalog.fit-tick', async () => {
      const result = await this.api.post<FitRunResponse>(
        '/internal/catalog/fit/run',
        {},
      );
      const log = {
        operation: 'worker.data_catalog.fit-tick',
        runId: result.runId,
        status: result.status,
        verdict: result.verdict,
        failedChecks: result.failedChecks,
        blindSpots: result.blindSpots,
      };
      if (result.status === 'FALLIDA')
        // lanzar deja constancia en workerHealth (consecutiveFailures) y en la traza
        throw new Error(
          `La sonda de ajuste del catálogo falló (${result.errorCode ?? 'UNKNOWN'})`,
        );
      if (result.verdict === 'DESAJUSTADA')
        this.logger.warn(log, 'El catálogo está desajustado de la realidad');
      else this.logger.info(log, 'Sonda de ajuste del catálogo corrida');
    });
  }
}
