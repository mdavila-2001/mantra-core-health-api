import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PinoLogger } from 'nestjs-pino';
import { SystemApiClient } from '../../system-api-client.service';
import { runTick } from '../../run-tick.util';

const SLA_SCAN_INTERVAL_MS = 60_000;

/** Refleja `ScanSlaResponseDto` (sólo lo que este job registra). */
interface ScanSlaResponse {
  scanned: number;
  breached: number;
  escalated: number;
  eventIds: string[];
}

/**
 * Fase 5 (`PLAN-CORRECCION-WORKERS-2026-07-28.md`) · UC-37-11: barre los
 * compromisos de hito vencidos.
 *
 * A diferencia de `POST /tracking/shipments/{id}/dispatch` (UC-37-03, humano:
 * exige transportista o mensajero asignado — ver README del módulo y el
 * informe de Fase 5), este endpoint ya nació con `@Roles('SYSTEM')` y hace su
 * propio descubrimiento con `SKIP LOCKED`
 * (`TrackingRepository.findOpenSubjectsForScan`,
 * `LockMode.PESSIMISTIC_PARTIAL_WRITE`) en una sola llamada — no hace falta
 * una consulta de descubrimiento aparte, igual que `outbox-relay.job.ts`.
 */
@Injectable()
export class SlaScanJob {
  constructor(
    private readonly api: SystemApiClient,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(SlaScanJob.name);
  }

  @Interval(SLA_SCAN_INTERVAL_MS)
  async tick(): Promise<void> {
    await runTick(this.logger, 'worker.tracking.sla-scan', async () => {
      const result = await this.api.post<ScanSlaResponse>(
        '/tracking/sla/scan',
        {},
      );

      if (result.breached === 0) return;

      this.logger.warn(
        {
          operation: 'worker.tracking.sla-scan',
          scanned: result.scanned,
          breached: result.breached,
          escalated: result.escalated,
        },
        'SLA breaches detected',
      );
    });
  }
}
