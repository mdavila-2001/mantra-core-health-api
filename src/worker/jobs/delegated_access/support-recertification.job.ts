import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PinoLogger } from 'nestjs-pino';
import { SystemApiClient } from '../../system-api-client.service';
import { runTick } from '../../run-tick.util';

const INTERVAL_MS = 3_600_000;

/** Refleja `RecertificationSweepResult`. */
interface RecertificationSweepResult {
  suspendedEngagements: number;
}

/**
 * Suspende los vínculos de apoyo que pasaron 15 días de su recertificación sin confirmar.
 */
@Injectable()
export class SupportRecertificationJob {
  constructor(
    private readonly api: SystemApiClient,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(SupportRecertificationJob.name);
  }

  @Interval(INTERVAL_MS)
  async tick(): Promise<void> {
    await runTick(
      this.logger,
      'worker.delegated_access.support-recertification',
      async () => {
        const result = await this.api.post<RecertificationSweepResult>(
          '/delegated-access/support/recertification-sweep',
        );
        if (result.suspendedEngagements === 0) return;

        this.logger.info(
          {
            operation: 'worker.delegated_access.support-recertification',
            suspendedEngagements: result.suspendedEngagements,
          },
          'Suspended support engagements without recertification',
        );
      },
    );
  }
}
