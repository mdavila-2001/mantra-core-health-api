import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PinoLogger } from 'nestjs-pino';
import { SystemApiClient } from '../../system-api-client.service';
import { runTick } from '../../run-tick.util';

const DISPATCH_INTERVAL_MS = 5_000;

/** Refleja `PendingDispatchItemDto`. */
interface PendingDispatchItem {
  id: string;
}

/** Refleja `PendingDispatchResponseDto`. */
interface PendingDispatchResponse {
  messages: PendingDispatchItem[];
}

/** Refleja `DispatchResultDto` (sólo lo que este job necesita). */
interface DispatchResult {
  id: string;
  isSuccess: boolean;
}

/**
 * Fase 5 (`PLAN-CORRECCION-WORKERS-2026-07-28.md`) · UC-12-06: descubre
 * mensajes salientes `QUEUED` (`GET /integrations/messages/pending-dispatch`,
 * añadido junto con este worker) y los despacha.
 *
 * A diferencia de `notification-delivery.job.ts`, aquí no hace falta un
 * adapter de proveedor inyectable: `IntegrationsMessagingService.dispatch`
 * hace la llamada HTTP real (firmada) contra el proveedor dentro de la propia
 * API — el worker sólo necesita decirle *qué* `messageId` despachar.
 */
@Injectable()
export class MessageDispatchJob {
  constructor(
    private readonly api: SystemApiClient,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(MessageDispatchJob.name);
  }

  @Interval(DISPATCH_INTERVAL_MS)
  async tick(): Promise<void> {
    await runTick(
      this.logger,
      'worker.integrations.message-dispatch',
      async () => {
        const pending = await this.api.get<PendingDispatchResponse>(
          '/integrations/messages/pending-dispatch',
        );

        for (const message of pending.messages) {
          await runTick(
            this.logger,
            'worker.integrations.message-dispatch',
            async () => {
              const result = await this.api.post<DispatchResult>(
                `/integrations/messages/${message.id}:dispatch`,
                {},
              );
              if (!result.isSuccess) {
                this.logger.warn(
                  {
                    operation: 'worker.integrations.message-dispatch',
                    messageId: message.id,
                  },
                  'Message dispatch failed',
                );
              }
            },
          );
        }
      },
    );
  }
}
