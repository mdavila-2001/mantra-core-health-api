import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PinoLogger } from 'nestjs-pino';
import { SystemApiClient } from '../../system-api-client.service';
import { runTick } from '../../run-tick.util';

const EXPIRE_RESERVATIONS_INTERVAL_MS = 60_000;

/** Refleja `ExpireReservationsResponseDto`. */
interface ExpireReservationsResponse {
  expiredCount: number;
}

/**
 * Fase 3 · UC-25-05: libera las reservas de inventario vencidas. Es una
 * operación de lote autocontenida — no hace falta descubrimiento aparte.
 *
 * Nota: `internal/inventory-sync/:batchId/reconcile` (UC-25-12) queda fuera
 * de este worker deliberadamente. Deriva su `batchId` de
 * `POST internal/inventory-sync-batches`, que hoy sólo lo invoca este mismo
 * controller como bootstrap manual — no existe ningún productor real (feed
 * ERP externo) en el repositorio. Cablear un cron que reconcilie "el último
 * batch" o "todos los RECEIVED" simularía un feed que no existe; cuando el
 * conector ERP real exista y produzca batches, éste es el lugar para añadir
 * ese job.
 */
@Injectable()
export class ExpireReservationsJob {
  constructor(
    private readonly api: SystemApiClient,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ExpireReservationsJob.name);
  }

  @Interval(EXPIRE_RESERVATIONS_INTERVAL_MS)
  async tick(): Promise<void> {
    await runTick(
      this.logger,
      'worker.pharmacy_inventory.expire-reservations',
      async () => {
        const result = await this.api.post<ExpireReservationsResponse>(
          '/internal/reservations/expire',
        );
        if (result.expiredCount === 0) return;

        this.logger.info(
          {
            operation: 'worker.pharmacy_inventory.expire-reservations',
            expiredCount: result.expiredCount,
          },
          'Expired pharmacy inventory reservations',
        );
      },
    );
  }
}
