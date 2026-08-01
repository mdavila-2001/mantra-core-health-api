import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PinoLogger } from 'nestjs-pino';
import { SystemApiClient } from '../../system-api-client.service';
import { runTick } from '../../run-tick.util';

const EXPIRY_INTERVAL_MS = 300_000;
const RELEASE_LIMIT = 50;

/** Refleja `ExpiredReleaseSummaryDto`. */
export interface ExpiredReleaseSummary {
  requestId: string;
  expiresAt: string;
}

/** Refleja `PendingExpiredReleasesResponseDto`. */
interface PendingExpiredReleasesResponse {
  releases: ExpiredReleaseSummary[];
}

/** Refleja `RevokeReleaseResponseDto`. */
interface RevokeReleaseResponse {
  id: string;
  status: string;
  alreadyClosed: boolean;
}

/**
 * UC-63-12: cierra por vencimiento los releases de investigación cuyo
 * manifiesto ya caducó. El README del módulo lo deja explícito: "el endpoint
 * existe y es idempotente; quien lo llama en bucle es el worker".
 */
@Injectable()
export class ReleaseExpiryJob {
  constructor(
    private readonly api: SystemApiClient,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ReleaseExpiryJob.name);
  }

  @Interval(EXPIRY_INTERVAL_MS)
  async tick(): Promise<void> {
    await runTick(this.logger, 'worker.lakehouse.release-expiry', async () => {
      const pending = await this.api.get<PendingExpiredReleasesResponse>(
        '/research/dataset-releases/expired',
        { limit: RELEASE_LIMIT },
      );

      for (const release of pending.releases) {
        await runTick(this.logger, 'worker.lakehouse.release-expiry', () =>
          this.revokeOne(release),
        );
      }
    });
  }

  private async revokeOne(release: ExpiredReleaseSummary): Promise<void> {
    const response = await this.api.post<RevokeReleaseResponse>(
      `/research/dataset-releases/${release.requestId}/revoke`,
      { expired: true },
    );

    if (!response.alreadyClosed) {
      this.logger.info(
        {
          operation: 'worker.lakehouse.release-expiry',
          requestId: release.requestId,
          expiresAt: release.expiresAt,
        },
        'Research dataset release expired and closed',
      );
    }
  }
}
