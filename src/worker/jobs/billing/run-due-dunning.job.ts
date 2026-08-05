import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PinoLogger } from 'nestjs-pino';
import { SystemApiClient } from '../../system-api-client.service';
import { runTick } from '../../run-tick.util';

const RUN_DUE_DUNNING_INTERVAL_MS = 3_600_000;

/** Refleja `RunDueDunningResponseDto` (`modules/billing/dto`). */
interface RunDueDunningResponse {
  tenantsProcessed: number;
  results: Array<{ tenantId: string; itemCount: number; skipped: boolean }>;
}

/**
 * Fase 4 (`PLAN-CORRECCION-WORKERS-2026-07-28.md`) · UC-17-10: dispara la
 * morosidad automática diaria por tenant. Cablea
 * `POST /billing/internal/dunning-runs/run-due` (añadido junto con este
 * worker: sin él, `dunning-runs:execute` solo podía dispararse a mano con una
 * lista de facturas ya elegida). No cubre `kpi-snapshots:compute`
 * deliberadamente — ese endpoint registra un valor de KPI YA calculado
 * (DSO/AR-aging/posición de caja); este repo no tiene la fórmula financiera
 * real, e inventar un número ahí sería peor que dejarlo sin automatizar.
 */
@Injectable()
export class RunDueDunningJob {
  constructor(
    private readonly api: SystemApiClient,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(RunDueDunningJob.name);
  }

  @Interval(RUN_DUE_DUNNING_INTERVAL_MS)
  async tick(): Promise<void> {
    await runTick(this.logger, 'worker.billing.run-due-dunning', async () => {
      const result = await this.api.post<RunDueDunningResponse>(
        '/billing/internal/dunning-runs/run-due',
        {},
      );

      if (result.tenantsProcessed === 0) return;

      this.logger.info(
        {
          operation: 'worker.billing.run-due-dunning',
          tenantsProcessed: result.tenantsProcessed,
          runsOpened: result.results.filter((r) => !r.skipped).length,
        },
        'Automatic dunning evaluated',
      );
    });
  }
}
