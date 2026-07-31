import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PinoLogger } from 'nestjs-pino';
import { SystemApiClient } from '../../system-api-client.service';
import { runTick } from '../../run-tick.util';

const EXPIRE_SWEEP_INTERVAL_MS = 300_000;
/**
 * El endpoint no acepta `limit`; el servicio cae a un default fijo de 100 por
 * llamada. Sin repetir la llamada dentro del mismo tick, un lote de más de
 * 100 casos vencidos en la ventana de 300s deja backlog creciente sin que
 * nada lo note (`expiredCount>0` sólo se registra como info). Tope de
 * iteraciones por tick para no monopolizar el proceso si el backlog es
 * enorme — el resto se limpia en el próximo tick.
 */
const MAX_SWEEPS_PER_TICK = 20;

/** Refleja `ExpireSweepResponseDto`. */
interface ExpireSweepResponse {
  expiredCount: number;
  caseIds: string[];
}

/**
 * Fase 3 · UC-27-12: expira por lote los casos de verificación de identidad
 * vencidos. Operación de lote autocontenida — no hace falta descubrimiento
 * aparte.
 */
@Injectable()
export class ExpireSweepJob {
  constructor(
    private readonly api: SystemApiClient,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ExpireSweepJob.name);
  }

  @Interval(EXPIRE_SWEEP_INTERVAL_MS)
  async tick(): Promise<void> {
    await runTick(
      this.logger,
      'worker.identity_assurance.expire-sweep',
      async () => {
        let totalExpired = 0;
        for (let i = 0; i < MAX_SWEEPS_PER_TICK; i++) {
          const result = await this.api.post<ExpireSweepResponse>(
            '/identity/verification-cases:expire-sweep',
          );
          totalExpired += result.expiredCount;
          if (result.expiredCount === 0) break;
        }

        if (totalExpired > 0) {
          this.logger.info(
            {
              operation: 'worker.identity_assurance.expire-sweep',
              expiredCount: totalExpired,
            },
            'Expired identity verification cases',
          );
        }
      },
    );
  }
}
