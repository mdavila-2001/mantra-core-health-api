import { HttpException } from '@nestjs/common';
import { GoogleEmailClient } from '../../google-email-client.service';
import type {
  NotificationProviderAdapter,
  PendingNotificationRequest,
  ProviderDeliveryOutcome,
} from './notification-delivery.job';

/** Forma que `payloadJson` puede traer para el canal EMAIL; todo opcional, con fallback. */
interface EmailPayload {
  subject?: string;
  bodyText?: string;
  bodyHtml?: string;
}

/**
 * Adapter real: envía por Gmail API (OAuth2) en vez de fallar con
 * `PROVIDER_NOT_CONFIGURED`. `payloadJson` es de forma libre (contrato del
 * job); si no trae `subject`/`bodyText`/`bodyHtml`, usa un asunto genérico y
 * el payload entero serializado como cuerpo — igual de conservador que el
 * adapter mock de `mock-notification-provider.adapter.ts`.
 */
export function createGoogleEmailProviderAdapter(
  client: GoogleEmailClient,
): NotificationProviderAdapter {
  return async (
    request: PendingNotificationRequest,
  ): Promise<ProviderDeliveryOutcome> => {
    const to = request.recipientAddress;
    if (!to) {
      return {
        outcome: 'FAILED',
        errorCode: 'MISSING_RECIPIENT_ADDRESS',
        errorText: `La solicitud ${request.id} no trae recipientAddress; el adapter de Gmail necesita un email de destino.`,
      };
    }

    const payload = (request.payloadJson ?? {}) as EmailPayload;
    const subject = payload.subject ?? 'Notificación';
    const bodyText =
      payload.bodyText ??
      (payload.bodyHtml
        ? undefined
        : JSON.stringify(request.payloadJson ?? {}));

    try {
      const result = await client.sendEmail({
        to,
        subject,
        bodyText,
        bodyHtml: payload.bodyHtml,
      });
      return { outcome: 'SENT', providerMessageRef: result.messageId };
    } catch (error) {
      const errorCode =
        error instanceof HttpException
          ? `GMAIL_HTTP_${error.getStatus()}`
          : 'GMAIL_SEND_FAILED';
      return {
        outcome: 'FAILED',
        errorCode,
        errorText: error instanceof Error ? error.message : String(error),
      };
    }
  };
}
