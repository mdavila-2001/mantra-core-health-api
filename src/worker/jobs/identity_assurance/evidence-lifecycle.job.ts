import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PinoLogger } from 'nestjs-pino';
import { runTick } from '../../run-tick.util';
import { SystemApiClient } from '../../system-api-client.service';

@Injectable()
export class EvidenceLifecycleJob {
  private cursor?: string;
  constructor(
    private readonly api: SystemApiClient,
    private readonly logger: PinoLogger,
  ) {}
  @Interval(300_000)
  async tick(): Promise<void> {
    await runTick(
      this.logger,
      'worker.identity_assurance.evidence-lifecycle',
      async () => {
        const result = await this.api.post<{
          nextCursor?: string;
          scanned: number;
          denied: number;
          boundary: number;
        }>(
          '/internal/identity/evidence/lifecycle-scan',
          this.cursor ? { cursor: this.cursor } : {},
          { idempotent: true },
        );
        // Failed/ambiguous HTTP preserves the cursor; duplicate evaluation is idempotent.
        this.cursor = result.nextCursor;
        this.logger.info(
          {
            operation: 'identity.evidence.lifecycle',
            scanned: result.scanned,
            denied: result.denied,
            boundary: result.boundary,
          },
          'Evidence lifecycle evaluated; no destructive runtime permission',
        );
      },
    );
  }
}
