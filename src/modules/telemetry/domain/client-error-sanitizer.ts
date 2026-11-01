import { createHash } from 'node:crypto';
import { redactDriverMessage } from '../../../orm/observability/sql-redaction';
import { redactShareTokenInUrl } from '../../../logging/share-token-redaction';
import { isAnonymousSafeRouteTemplate } from './event-property-policy';

/** Topes de longitud: coinciden con las columnas de `telemetry.client_error_events`. */
export const CLIENT_ERROR_LIMITS = {
  message: 500,
  errorType: 120,
  route: 300,
  apiCode: 60,
  requestId: 80,
  supportCode: 40,
  appVersion: 40,
  buildId: 40,
  httpMethod: 8,
} as const;

const EMAIL = /[^\s@]+@[^\s@]+\.[^\s@]+/gu;
const JWT = /\beyJ[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]*/gu;
const BEARER = /\bBearer\s+\S+/giu;
const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/giu;
const LONG_DIGITS = /\d{4,}/gu;
const LONG_HEX = /\b[0-9a-f]{24,}\b/giu;
const URL_QUERY = /(https?:\/\/[^\s?#]+|\/[^\s?#]*)[?#]\S*/gu;
const STACK_LINE = /\n\s+at\s.*/gu;

/**
 * Deja un mensaje de error del cliente sin datos personales ni stack: se queda
 * con la primera línea, quita query strings, correos, tokens, identificadores y
 * corridas de dígitos, y lo topa a 500 caracteres. Reutiliza la redacción del
 * driver y de tokens de enlace ya existentes.
 */
export function sanitizeClientMessage(
  raw: string | undefined | null,
): string | null {
  if (raw === undefined || raw === null) return null;
  let text = String(raw).replace(STACK_LINE, '');
  text = text.split(/\r?\n/u)[0] ?? '';
  text = redactShareTokenInUrl(text);
  text = redactDriverMessage(text)
    .replace(BEARER, 'Bearer [token]')
    .replace(JWT, '[token]')
    .replace(EMAIL, '[correo]')
    .replace(URL_QUERY, '$1')
    .replace(UUID, ':uuid')
    .replace(LONG_HEX, ':hex')
    .replace(LONG_DIGITS, ':n')
    .replace(/\s+/gu, ' ')
    .trim();
  return text.slice(0, CLIENT_ERROR_LIMITS.message) || null;
}

/** Tipo de error (`TypeError`, `HttpErrorResponse`): sólo identificador seguro. */
export function sanitizeErrorType(raw: string): string {
  const cleaned = raw
    .replace(/[^A-Za-z0-9_.$:-]/gu, '')
    .slice(0, CLIENT_ERROR_LIMITS.errorType);
  return cleaned || 'Error';
}

/**
 * Plantilla de ruta del cliente: pasa sólo si cumple la MISMA lista cerrada que
 * la ruta anónima (`isAnonymousSafeRouteTemplate`). Si no, se descarta (`null`):
 * el error se guarda sin ruta antes que con una que pueda llevar un dato.
 */
export function safeRouteOrNull(raw: string | undefined | null): string | null {
  const route = raw?.trim();
  return route && isAnonymousSafeRouteTemplate(route) ? route : null;
}

/** Plantilla de la ruta de API: mismas reglas, pero sin exigir la forma de ruta web. */
export function safeApiRouteOrNull(
  raw: string | undefined | null,
): string | null {
  const route = raw?.split(/[?#]/u)[0]?.trim();
  if (
    !route ||
    route.length > CLIENT_ERROR_LIMITS.route ||
    !route.startsWith('/')
  ) {
    return null;
  }
  if (/[^A-Za-z0-9/:._~-]/u.test(route)) return null;
  if (/\d{4,}|[^\s@]+@[^\s@]+/u.test(route)) return null;
  return route;
}

/** Identificador corto (request id, código de soporte): sólo caracteres seguros. */
export function safeToken(
  raw: string | undefined | null,
  max: number,
): string | null {
  const value = raw?.trim();
  if (!value || value.length > max || /[^A-Za-z0-9._:-]/u.test(value))
    return null;
  return value;
}

/**
 * Huella estable: `sha256(clase | tipo | mensaje saneado | ruta)` en hex, 16
 * caracteres. La calcula el servidor; una huella elegida por el cliente no
 * participa (no se podría sembrar un grupo ajeno).
 */
export function clientErrorFingerprint(parts: {
  errorClass: string;
  errorType: string;
  message: string | null;
  route: string | null;
}): string {
  return createHash('sha256')
    .update(
      [
        parts.errorClass,
        parts.errorType,
        parts.message ?? '',
        parts.route ?? '',
      ].join('\u0001'),
    )
    .digest('hex')
    .slice(0, 16);
}
