import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PinoLogger } from 'nestjs-pino';
import { SystemApiClient } from '../../system-api-client.service';
import { runTick } from '../../run-tick.util';

const DISPATCH_REMINDERS_INTERVAL_MS = 60_000;
const BATCH_LIMIT = 200;

/** Refleja `WorkerBatchResultDto`. */
interface WorkerBatchResult {
  processed: number;
  detail: string;
}

/**
 * Fase 3 · UC-41-14: marca como enviados los recordatorios cuya hora ya
 * llegó. La entrega real la hace `messaging` (35); este job solo mueve el
 * estado, como documenta `SchedulingWaitlistService.dispatchReminders`.
 */
@Injectable()
export class DispatchRemindersJob {
  constructor(
    private readonly api: SystemApiClient,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(DispatchRemindersJob.name);
  }

  @Interval(DISPATCH_REMINDERS_INTERVAL_MS)
  async tick(): Promise<void> {
    await runTick(
      this.logger,
      'worker.scheduling.dispatch-reminders',
      async () => {
        const result = await this.api.post<WorkerBatchResult>(
          '/scheduling/internal/dispatch-reminders',
          { limit: BATCH_LIMIT },
        );
        if (result.processed === 0) return;

        this.logger.info(
          {
            operation: 'worker.scheduling.dispatch-reminders',
            processed: result.processed,
          },
          'Dispatched due reminders',
        );
      },
    );
  }
}
