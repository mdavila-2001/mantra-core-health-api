import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PinoLogger } from 'nestjs-pino';
import { SystemApiClient } from '../../system-api-client.service';
import { runTick } from '../../run-tick.util';

/** Cada hora: la purga es de baja prioridad y cada corrida está acotada por lotes. */
const RETENTION_PURGE_INTERVAL_MS = 3_600_000;

/** Refleja `RetentionResult` (sólo lo que este job registra). */
interface PurgeResponse {
  totalEvents: number;
  totalProperties: number;
  totalClientErrors: number;
  purposes: Array<{ purposeCode: string; more: boolean }>;
  withoutRetention: string[];
}

/**
 * Retención de telemetría (hallazgo 1 de la revisión F0): llama a
 * `POST /telemetry/retention/purge` (rol `SYSTEM`), que borra en lotes los
 * eventos vencidos según la retención de cada propósito. No hace descubrimiento
 * propio: el endpoint es idempotente y acotado.
 */
@Injectable()
export class RetentionPurgeJob {
  constructor(
    private readonly api: SystemApiClient,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(RetentionPurgeJob.name);
  }

  @Interval(RETENTION_PURGE_INTERVAL_MS)
  async tick(): Promise<void> {
    await runTick(this.logger, 'worker.telemetry.retention-purge', async () => {
      const result = await this.api.post<PurgeResponse>(
        '/telemetry/retention/purge',
        {},
      );
      if (result.totalEvents + result.totalClientErrors === 0) return;
      this.logger.info(
        {
          operation: 'worker.telemetry.retention-purge',
          events: result.totalEvents,
          properties: result.totalProperties,
          clientErrors: result.totalClientErrors,
          pending: result.purposes
            .filter((p) => p.more)
            .map((p) => p.purposeCode),
        },
        'Telemetry retention purge removed expired rows',
      );
    });
  }
}
