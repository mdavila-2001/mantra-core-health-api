import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PinoLogger } from 'nestjs-pino';
import { CONCEPTS } from '../../../common';
import { SystemApiClient } from '../../system-api-client.service';
import { runTick } from '../../run-tick.util';

const RELAY_INTERVAL_MS = 5_000;

/** Refleja `RelayedMessageDto` (`modules/messaging/dto`) tal como viaja por HTTP. */
interface RelayedMessage {
  domainEventId: string;
  statusConceptId: string;
}

/** Refleja `OutboxRelayResponseDto`. */
interface OutboxRelayResponse {
  claimed: number;
  published: number;
  exhausted: number;
  messages: RelayedMessage[];
}

/** Refleja `DispatchEventResponseDto` (solo lo que este job necesita). */
interface DispatchEventResponse {
  domainEventId: string;
  matched: number;
}

/**
 * Fase 1 (P0) · UC-35-02/03: cierra el "Bucle del worker" que el README de
 * `messaging` documenta como pendiente.
 *
 * Cada tick: (1) reclama y publica un lote del outbox (`runRelay`, que ya
 * hace el `SKIP LOCKED` internamente — no hace falta una consulta de
 * descubrimiento aparte); (2) para cada mensaje que quedó `OUTBOX_PUBLISHED`
 * en esta misma pasada, reparte el evento a sus suscriptores (`dispatchEvent`)
 * usando el `domainEventId` que `runRelay` ya devolvió.
 */
@Injectable()
export class OutboxRelayJob {
  constructor(
    private readonly api: SystemApiClient,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(OutboxRelayJob.name);
  }

  @Interval(RELAY_INTERVAL_MS)
  async tick(): Promise<void> {
    await runTick(this.logger, 'worker.messaging.outbox-relay', async () => {
      const workerId = this.api.workerId('outbox-relay');
      const result = await this.api.post<OutboxRelayResponse>(
        '/internal/outbox/relay/run',
        { workerId },
      );

      if (result.claimed === 0) return;

      this.logger.info(
        {
          operation: 'worker.messaging.outbox-relay',
          claimed: result.claimed,
          published: result.published,
          exhausted: result.exhausted,
        },
        'Outbox relay batch processed',
      );

      const published = result.messages.filter(
        (message) => message.statusConceptId === CONCEPTS.OUTBOX_PUBLISHED,
      );

      for (const message of published) {
        await runTick(
          this.logger,
          'worker.messaging.event-dispatch',
          async () => {
            const dispatched = await this.api.post<DispatchEventResponse>(
              `/internal/events/${message.domainEventId}/dispatch`,
              { enqueueJobs: true },
            );
            if (dispatched.matched > 0) {
              this.logger.info(
                {
                  operation: 'worker.messaging.event-dispatch',
                  domainEventId: message.domainEventId,
                  matched: dispatched.matched,
                },
                'Domain event dispatched to subscribers',
              );
            }
          },
        );
      }
    });
  }
}
