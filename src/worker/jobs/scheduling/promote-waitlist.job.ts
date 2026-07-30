import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PinoLogger } from 'nestjs-pino';
import { SystemApiClient } from '../../system-api-client.service';
import { runTick } from '../../run-tick.util';

const PROMOTE_WAITLIST_INTERVAL_MS = 30_000;
const CANDIDATE_LIMIT = 50;

/** Refleja `WaitlistCandidateSlotsResponseDto`. */
interface WaitlistCandidateSlotsResponse {
  slotIds: string[];
}

/** Refleja `WorkerBatchResultDto`. */
interface WorkerBatchResult {
  processed: number;
  detail: string;
}

/**
 * Fase 3 · UC-41-12: promueve candidatos de la lista de espera a un slot con
 * cupo. A diferencia del resto de barridos de este dominio, `promote-waitlist`
 * exige un `slotId` puntual y su resultado no trae ids, así que este job
 * primero descubre los slots candidatos (`GET .../waitlist-candidates`,
 * añadido junto con este worker porque no existía) y luego promueve cada uno.
 */
@Injectable()
export class PromoteWaitlistJob {
  constructor(
    private readonly api: SystemApiClient,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PromoteWaitlistJob.name);
  }

  @Interval(PROMOTE_WAITLIST_INTERVAL_MS)
  async tick(): Promise<void> {
    await runTick(
      this.logger,
      'worker.scheduling.promote-waitlist',
      async () => {
        const candidates = await this.api.get<WaitlistCandidateSlotsResponse>(
          '/scheduling/internal/waitlist-candidates',
          { limit: CANDIDATE_LIMIT },
        );

        for (const slotId of candidates.slotIds) {
          await runTick(this.logger, 'worker.scheduling.promote-waitlist', () =>
            this.promoteSlot(slotId),
          );
        }
      },
    );
  }

  private async promoteSlot(slotId: string): Promise<void> {
    const result = await this.api.post<WorkerBatchResult>(
      `/scheduling/internal/promote-waitlist/${slotId}`,
      {},
    );
    if (result.processed === 0) return;

    this.logger.info(
      {
        operation: 'worker.scheduling.promote-waitlist',
        slotId,
        processed: result.processed,
      },
      'Promoted waitlist candidates for slot',
    );
  }
}
