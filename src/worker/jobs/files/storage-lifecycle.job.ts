import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PinoLogger } from 'nestjs-pino';
import { runTick } from '../../run-tick.util';
import { SystemApiClient } from '../../system-api-client.service';

/** Recovery uses durable security phases, never generic queue redrive/TTL. */
@Injectable()
export class StorageLifecycleJob {
  constructor(
    private readonly api: SystemApiClient,
    private readonly logger: PinoLogger,
  ) {}
  @Interval(300_000)
  async tick(): Promise<void> {
    await runTick(
      this.logger,
      'worker.files.storage-lifecycle-recovery',
      async () => {
        const result = await this.api.post<{
          inspected: number;
          quarantined: number;
        }>('/internal/storage-lifecycle/recover', {}, { idempotent: true });
        this.logger.info(
          { operation: 'storage.lifecycle.recovery', ...result },
          'Storage reservations reconciled without I/O',
        );
        const review = await this.api.post<{
          inspected: number;
          denied: number;
          boundary: number;
        }>(
          '/internal/identity/evidence/storage-purge-review',
          {},
          { idempotent: true },
        );
        this.logger.info(
          { operation: 'storage.lifecycle.purge-review', ...review },
          'Physical purge remains gate-blocked',
        );
      },
    );
  }
}
