import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PinoLogger } from 'nestjs-pino';
import { SystemApiClient } from '../../system-api-client.service';
import { runTick } from '../../run-tick.util';

const INTERVAL_MS = 3_600_000;

/** Refleja `RequestExpiryResult`. */
interface RequestExpiryResult {
  expiredRequests: number;
}

/**
 * Vence las solicitudes de vínculo de apoyo pendientes pasados los 15 días.
 */
@Injectable()
export class SupportRequestsExpiryJob {
  constructor(
    private readonly api: SystemApiClient,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(SupportRequestsExpiryJob.name);
  }

  @Interval(INTERVAL_MS)
  async tick(): Promise<void> {
    await runTick(
      this.logger,
      'worker.delegated_access.support-requests-expiry',
      async () => {
        const result = await this.api.post<RequestExpiryResult>(
          '/delegated-access/support/expire-requests',
        );
        if (result.expiredRequests === 0) return;

        this.logger.info(
          {
            operation: 'worker.delegated_access.support-requests-expiry',
            expiredRequests: result.expiredRequests,
          },
          'Expired support engagement requests',
        );
      },
    );
  }
}
