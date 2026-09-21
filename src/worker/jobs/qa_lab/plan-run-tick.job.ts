import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PinoLogger } from 'nestjs-pino';
import { SystemApiClient } from '../../system-api-client.service';
import { runTick } from '../../run-tick.util';

/** Un plan aceptado no debería esperar más que esto para empezar. */
const PLAN_TICK_INTERVAL_MS = 5_000;

interface RunNextPlanResponse {
  claimed: number;
  planId?: string;
  status?: string;
  fenced?: boolean;
  reason?: string;
}

/**
 * Reloj del runner de QA en el servidor (módulo 68): pide a la API que
 * reclame y ejecute el siguiente plan. El estado vive en la base; si este
 * proceso muere a mitad de un plan, el siguiente reclamo lo cierra como
 * INFRA_ERROR/WORKER_LOST en vez de repetir peticiones que pudieron mutar.
 */
@Injectable()
export class QaPlanRunTickJob {
  constructor(
    private readonly api: SystemApiClient,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(QaPlanRunTickJob.name);
  }

  @Interval(PLAN_TICK_INTERVAL_MS)
  async tick(): Promise<void> {
    await runTick(this.logger, 'worker.qa_lab.plan-run-tick', async () => {
      const result = await this.api.post<RunNextPlanResponse>(
        '/internal/qa/plans/run-next',
        {},
      );
      if (result.claimed === 0) return;
      const log = {
        operation: 'worker.qa_lab.plan-run-tick',
        planId: result.planId,
        status: result.status,
        reason: result.reason,
      };
      if (result.fenced) {
        this.logger.warn(log, 'QA plan lease lost to another worker');
      } else {
        this.logger.info(log, 'QA plan processed');
      }
    });
  }
}
