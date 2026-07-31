import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PinoLogger } from 'nestjs-pino';
import { SystemApiClient } from '../../system-api-client.service';
import { runTick } from '../../run-tick.util';

const RETRY_INTERVAL_MS = 15_000;

/** Refleja `PendingRetryItemDto`. */
interface PendingRetryItem {
  id: string;
  nextAttemptNumber: number;
  exhausted: boolean;
}

/** Refleja `PendingRetryResponseDto`. */
interface PendingRetryResponse {
  messages: PendingRetryItem[];
}

/**
 * Fase 5 (`PLAN-CORRECCION-WORKERS-2026-07-28.md`) · UC-12-07/08: descubre
 * mensajes `FAILED` (`GET /integrations/messages/pending-retry`, añadido
 * junto con este worker) y decide, por cada uno, entre programar un nuevo
 * intento con backoff (`:retry`) o enviarlo a dead-letter (`:dead-letter`).
 *
 * La decisión (`exhausted`) la calcula el propio endpoint de descubrimiento
 * con el mismo `MAX_ATTEMPTS` que usa `retry` — el worker no necesita (ni
 * debe) adivinarlo a partir del cuerpo de un eventual error 422.
 */
@Injectable()
export class MessageRetryJob {
  constructor(
    private readonly api: SystemApiClient,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(MessageRetryJob.name);
  }

  @Interval(RETRY_INTERVAL_MS)
  async tick(): Promise<void> {
    await runTick(
      this.logger,
      'worker.integrations.message-retry',
      async () => {
        const pending = await this.api.get<PendingRetryResponse>(
          '/integrations/messages/pending-retry',
        );

        for (const message of pending.messages) {
          await runTick(
            this.logger,
            'worker.integrations.message-retry',
            async () => {
              if (message.exhausted) {
                await this.api.post(
                  `/integrations/messages/${message.id}:dead-letter`,
                  {},
                );
                this.logger.warn(
                  {
                    operation: 'worker.integrations.message-retry',
                    messageId: message.id,
                    attemptNumber: message.nextAttemptNumber,
                  },
                  'Message dead-lettered: retries exhausted',
                );
              } else {
                await this.api.post(
                  `/integrations/messages/${message.id}:retry`,
                  {},
                );
              }
            },
          );
        }
      },
    );
  }
}
