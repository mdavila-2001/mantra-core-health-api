import { MockProviderClient } from '../../mock-provider-client.service';
import type {
  NotificationProviderAdapter,
  PendingNotificationRequest,
  ProviderDeliveryOutcome,
} from './notification-delivery.job';

/** Refleja `SendNotificationResponseDto` de `mock-provider-server`. */
interface MockSendResponse {
  id: string;
  outcome: 'SENT' | 'FAILED';
  providerMessageRef?: string;
  errorCode?: string;
  errorText?: string;
}

/**
 * Adapter real (contra un doble de prueba): llama `mock-provider-server` en
 * vez de fallar con `PROVIDER_NOT_CONFIGURED`. `channelId` viaja tal cual —
 * el emulador no necesita resolverlo a un tipo de canal real, sólo lo usa
 * para variar la referencia que devuelve.
 */
export function createMockNotificationProviderAdapter(
  client: MockProviderClient,
): NotificationProviderAdapter {
  return async (
    request: PendingNotificationRequest,
  ): Promise<ProviderDeliveryOutcome> => {
    const response = await client.post<MockSendResponse>('/notifications/send', {
      channel: request.channelId,
      to: request.recipientAddress ?? request.recipientUserId ?? 'unknown',
      body: JSON.stringify(request.payloadJson ?? {}),
      metadata: { notificationRequestId: request.id },
    });

    return {
      outcome: response.outcome,
      providerMessageRef: response.providerMessageRef,
      errorCode: response.errorCode,
      errorText: response.errorText,
    };
  };
}
