import { CONCEPTS } from '../../../common';
import type {
  NotificationProviderAdapter,
  PendingNotificationRequest,
  ProviderDeliveryOutcome,
} from './notification-delivery.job';

/** Código de error con el que queda registrada la entrega suprimida. */
export const RECIPIENT_DOMAIN_NOT_ALLOWED = 'RECIPIENT_DOMAIN_NOT_ALLOWED';

/**
 * Convierte el valor crudo de `EMAIL_ALLOWED_RECIPIENT_DOMAINS` (lista
 * separada por comas) en dominios normalizados: sin espacios, sin `@` inicial
 * y en minúsculas. Vacío o ausente = guarda apagada (comportamiento de hoy).
 */
export function parseAllowedRecipientDomains(
  raw: string | undefined,
): string[] {
  return (raw ?? '')
    .split(',')
    .map((domain) => domain.trim().replace(/^@/, '').toLowerCase())
    .filter((domain) => domain.length > 0);
}

/**
 * Dominios de cada destinatario del campo `to`. Un campo con varias
 * direcciones (`a@x, b@y`) se evalúa entero: basta una fuera de la lista para
 * suprimir el envío completo. `undefined` marca una dirección sin dominio.
 */
function recipientDomains(address: string): Array<string | undefined> {
  return address
    .split(/[,;]/)
    .filter((part) => part.trim().length > 0)
    .map((part) => {
      const at = part.lastIndexOf('@');
      if (at === -1) return undefined;
      const domain = part
        .slice(at + 1)
        .replace(/[>\s]/g, '')
        .toLowerCase();
      return domain.length > 0 ? domain : undefined;
    });
}

function isEmailRequest(request: PendingNotificationRequest): boolean {
  if (request.channelTypeConceptId) {
    return request.channelTypeConceptId === CONCEPTS.CHANNEL_TYPE_EMAIL;
  }
  // Backend anterior al carril P1: no informa el tipo; se infiere por la dirección.
  return (request.recipientAddress ?? '').includes('@');
}

/**
 * Decorador del `providerAdapter`: con una lista de dominios permitida, el
 * canal EMAIL solo llega al proveedor si TODOS los destinatarios pertenecen a
 * ella (dominio exacto, sin distinguir mayúsculas; los subdominios no se
 * heredan). El resto no llama al proveedor: devuelve `FAILED` con
 * `RECIPIENT_DOMAIN_NOT_ALLOWED`, que el backend registra como entrega fallida
 * y deja la solicitud en `NOTIF_FAILED`, estado que ya no admite reintentos.
 * Con la lista vacía devuelve el adapter intacto.
 *
 * `onSuppressed` recibe solo dominios, nunca la dirección completa.
 */
export function withEmailRecipientDomainGuard(
  inner: NotificationProviderAdapter,
  allowedDomains: readonly string[],
  onSuppressed: (
    request: PendingNotificationRequest,
    domains: string[],
  ) => void,
): NotificationProviderAdapter {
  if (allowedDomains.length === 0) return inner;
  const allowed = new Set(allowedDomains);

  return async (
    request: PendingNotificationRequest,
  ): Promise<ProviderDeliveryOutcome> => {
    const address = request.recipientAddress;
    if (!isEmailRequest(request) || !address) return inner(request);

    const domains = recipientDomains(address);
    const permitted =
      domains.length > 0 &&
      domains.every((domain) => domain !== undefined && allowed.has(domain));
    if (permitted) return inner(request);

    const shown = domains.map((domain) => domain ?? '(sin dominio)');
    onSuppressed(request, shown);
    return {
      outcome: 'FAILED',
      errorCode: RECIPIENT_DOMAIN_NOT_ALLOWED,
      errorText:
        `Envío suprimido: el dominio del destinatario (${shown.join(', ')}) ` +
        `no está en EMAIL_ALLOWED_RECIPIENT_DOMAINS.`,
    };
  };
}
