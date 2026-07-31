import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PinoLogger } from 'nestjs-pino';
import { SystemApiClient } from '../../system-api-client.service';
import { runTick } from '../../run-tick.util';

const DELIVERY_INTERVAL_MS = 5_000;

/** Refleja `PendingNotificationRequestDto`. */
export interface PendingNotificationRequest {
  id: string;
  channelId: string;
  statusConceptId: string;
  payloadJson?: unknown;
  recipientAddress?: string;
  recipientUserId?: string;
}

/** Lo que el adapter de proveedor decide tras intentar el envío real. */
export interface ProviderDeliveryOutcome {
  outcome: 'SENT' | 'FAILED';
  providerMessageRef?: string;
  errorCode?: string;
  errorText?: string;
}

/**
 * Punto de extensión: quien llama al proveedor real (SendGrid, Twilio, el que
 * sea). El README de `messaging` lo deja explícito como pendiente: "la
 * llamada al proveedor la hace el worker fuera de esta transacción... elegir
 * el proveedor por `rate_limit_per_min` y rotar por prioridad vive en el
 * worker". Ninguna credencial de proveedor existe todavía en este repo, así
 * que el adapter por defecto **falla en vez de fingir éxito** — visible en
 * `notification_deliveries` como `FAILED` con un motivo claro, no una entrega
 * silenciosamente inventada.
 */
export type NotificationProviderAdapter = (
  request: PendingNotificationRequest,
) => Promise<ProviderDeliveryOutcome>;

export const defaultProviderAdapter: NotificationProviderAdapter = async (
  request,
) => ({
  outcome: 'FAILED',
  errorCode: 'PROVIDER_NOT_CONFIGURED',
  errorText:
    `Ningún NotificationProviderAdapter real está conectado para el canal ` +
    `${request.channelId}. Implementarlo en notification-delivery.job.ts.`,
});

/** Refleja `DeliverNotificationResponseDto` (solo lo que este job usa). */
interface DeliverNotificationResponse {
  deliveryId: string;
  requestStatusConceptId: string;
}

/**
 * Fase 1 (P0) · UC-35-11: descubre solicitudes listas
 * (`GET /internal/notifications/pending`, añadido junto con este worker) y
 * registra el intento de entrega contra el proveedor real que decida
 * `providerAdapter`.
 */
@Injectable()
export class NotificationDeliveryJob {
  /** Mutable a propósito: permite inyectar un adapter real sin tocar el DI. */
  providerAdapter: NotificationProviderAdapter = defaultProviderAdapter;

  constructor(
    private readonly api: SystemApiClient,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(NotificationDeliveryJob.name);
  }

  @Interval(DELIVERY_INTERVAL_MS)
  async tick(): Promise<void> {
    await runTick(
      this.logger,
      'worker.messaging.notification-delivery',
      async () => {
        const pending = await this.api.get<{
          requests: PendingNotificationRequest[];
        }>('/internal/notifications/pending');

        for (const request of pending.requests) {
          await runTick(
            this.logger,
            'worker.messaging.notification-delivery',
            () => this.deliverOne(request),
          );
        }
      },
    );
  }

  private async deliverOne(request: PendingNotificationRequest): Promise<void> {
    const result = await this.providerAdapter(request);

    const response = await this.api.post<DeliverNotificationResponse>(
      `/internal/notifications/${request.id}/deliver`,
      {
        outcome: result.outcome,
        providerMessageRef: result.providerMessageRef,
        errorCode: result.errorCode,
        errorText: result.errorText,
      },
    );

    if (result.outcome === 'FAILED') {
      this.logger.warn(
        {
          operation: 'worker.messaging.notification-delivery',
          requestId: request.id,
          errorCode: result.errorCode,
        },
        'Notification delivery attempt failed',
      );
    } else {
      this.logger.info(
        {
          operation: 'worker.messaging.notification-delivery',
          requestId: request.id,
          deliveryId: response.deliveryId,
        },
        'Notification delivered',
      );
    }
  }
}
