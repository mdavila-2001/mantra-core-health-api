/**
 * Clasificación de fallos en **transitorios** (merece reintentar) y
 * **permanentes** (reintentar sólo desperdicia capacidad y retrasa el error).
 *
 * Es la decisión más importante de todo el kernel y la que más daño hace si se
 * equivoca en el sentido permisivo: reintentar un `400 VALIDATION_FAILED` o un
 * `409 CONFLICT` no lo va a arreglar nunca —el cuerpo enviado es el mismo— y
 * multiplica por N la carga sobre una dependencia que ya respondió que no. Por
 * eso la lista de códigos reintentables es una **allowlist cerrada**, no una
 * denylist: un código desconocido se considera permanente.
 *
 * El caso 429 es distinto de los 5xx y por eso está aparte en
 * `retryAfterFromError`: el servidor dijo explícitamente cuánto esperar, y ese
 * valor gana sobre cualquier backoff calculado localmente.
 */

/**
 * Códigos de error de red de Node/libuv que describen un fallo de transporte,
 * no una respuesta del servidor. En todos ellos la petición pudo no haber
 * llegado siquiera, así que reintentar es correcto para operaciones idempotentes.
 */
const TRANSIENT_NETWORK_CODES: ReadonlySet<string> = new Set([
  'ECONNREFUSED', // nadie escucha todavía (arranque, reinicio del contenedor)
  'ECONNRESET', // el par cerró la conexión a mitad
  'ECONNABORTED', // axios marca así sus propios timeouts
  'ETIMEDOUT', // timeout de socket del sistema operativo
  'EPIPE', // se escribió en un socket ya cerrado
  'EHOSTUNREACH',
  'ENETUNREACH',
  'ENETDOWN',
  'EAI_AGAIN', // fallo temporal de resolución DNS
  'EPROTO',
  'ERR_CANCELED', // cancelación por deadline: la decide el llamador, no el fallo
]);

/**
 * Estados HTTP que se consideran transitorios.
 *
 * `408` (timeout de petición), `425` (too early), `429` (rate limit) y la
 * familia 5xx salvo `501 Not Implemented` —que es permanente por definición: la
 * ruta no existe y no va a aparecer— y `505`.
 */
const TRANSIENT_HTTP_STATUSES: ReadonlySet<number> = new Set([
  408, 425, 429, 500, 502, 503, 504, 507, 509, 598, 599,
]);

/** Forma mínima de un error de cliente HTTP, sin acoplarse a axios. */
interface HttpishError {
  code?: unknown;
  status?: unknown;
  statusCode?: unknown;
  response?: {
    status?: unknown;
    headers?: Record<string, unknown>;
  };
}

/** Lee el status HTTP de un error de axios/fetch/HttpException indistintamente. */
export function httpStatusOf(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null) return undefined;
  const candidate = error as HttpishError;
  const raw =
    typeof candidate.response?.status === 'number'
      ? candidate.response.status
      : typeof candidate.status === 'number'
        ? candidate.status
        : typeof candidate.statusCode === 'number'
          ? candidate.statusCode
          : undefined;
  return typeof raw === 'number' && raw >= 100 && raw < 600 ? raw : undefined;
}

/** Lee el código de error de red (`ECONNRESET`, …) si el error lo declara. */
export function networkCodeOf(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null) return undefined;
  const code = (error as HttpishError).code;
  return typeof code === 'string' ? code : undefined;
}

/**
 * Decide si un fallo merece reintentarse.
 *
 * Deliberadamente **no** consulta el método HTTP: la idempotencia de la
 * operación la conoce quien llama, no este clasificador, y darla por supuesta
 * aquí llevaría a reintentar un `POST` de cobro. `retry()` exige que el
 * llamador declare la política; esta función sólo responde "¿el fallo es del
 * tipo que se cura solo?".
 */
export function isTransientError(error: unknown): boolean {
  const networkCode = networkCodeOf(error);
  if (networkCode && TRANSIENT_NETWORK_CODES.has(networkCode)) return true;

  const status = httpStatusOf(error);
  if (status !== undefined) return TRANSIENT_HTTP_STATUSES.has(status);

  // Sin status ni código de red no hay evidencia de transitoriedad: un
  // `TypeError` en el propio código no mejora por reintentarlo.
  return false;
}

/**
 * Espera solicitada explícitamente por el servidor (`Retry-After`), en ms.
 *
 * Acepta las dos formas del RFC 9110: segundos enteros y fecha HTTP. Devuelve
 * `undefined` si la cabecera no está o no es interpretable — en ese caso manda
 * el backoff calculado, que siempre existe.
 */
export function retryAfterFromError(
  error: unknown,
  now: () => number = Date.now,
): number | undefined {
  if (typeof error !== 'object' || error === null) return undefined;
  const headers = (error as HttpishError).response?.headers;
  if (!headers) return undefined;

  const raw = headers['retry-after'] ?? headers['Retry-After'];
  if (typeof raw !== 'string' && typeof raw !== 'number') return undefined;

  const asSeconds = Number(raw);
  if (Number.isFinite(asSeconds)) {
    return asSeconds > 0 ? Math.round(asSeconds * 1000) : 0;
  }

  const asDate = Date.parse(String(raw));
  if (Number.isNaN(asDate)) return undefined;
  return Math.max(0, asDate - now());
}
