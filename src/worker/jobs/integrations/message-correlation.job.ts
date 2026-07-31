import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PinoLogger } from 'nestjs-pino';
import { SystemApiClient } from '../../system-api-client.service';
import { runTick } from '../../run-tick.util';

const CORRELATION_INTERVAL_MS = 10_000;

/** Refleja `PendingCorrelationItemDto`. */
interface PendingCorrelationItem {
  id: string;
}

/** Refleja `PendingCorrelationResponseDto`. */
interface PendingCorrelationResponse {
  messages: PendingCorrelationItem[];
}

/**
 * Fase 5 (`PLAN-CORRECCION-WORKERS-2026-07-28.md`) · UC-12-10: descubre
 * mensajes entrantes `RECEIVED` (`GET /integrations/messages/pending-correlation`,
 * añadido junto con este worker) y los correlaciona con su saliente.
 */
@Injectable()
export class MessageCorrelationJob {
  constructor(
    private readonly api: SystemApiClient,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(MessageCorrelationJob.name);
  }

  @Interval(CORRELATION_INTERVAL_MS)
  async tick(): Promise<void> {
    await runTick(
      this.logger,
      'worker.integrations.message-correlation',
      async () => {
        const pending = await this.api.get<PendingCorrelationResponse>(
          '/integrations/messages/pending-correlation',
        );

        for (const message of pending.messages) {
          await runTick(
            this.logger,
            'worker.integrations.message-correlation',
            () =>
              this.api.post(
                `/integrations/messages/${message.id}:correlate`,
                {},
              ),
          );
        }
      },
    );
  }
}
