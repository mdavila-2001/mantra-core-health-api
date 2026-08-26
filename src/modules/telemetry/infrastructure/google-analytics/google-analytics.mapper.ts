import { AxiosError } from 'axios';
import { createHash } from 'node:crypto';
import type {
  WebAnalyticsConsent,
  WebAnalyticsEvent,
  WebAnalyticsHit,
  WebAnalyticsParamValue,
} from '../../domain/web-analytics.port';
import {
  WebAnalyticsInvalidRequestError,
  WebAnalyticsNetworkError,
  WebAnalyticsRateLimitedError,
  WebAnalyticsTimeoutError,
  WebAnalyticsUnauthorizedError,
  WebAnalyticsUnavailableError,
  type WebAnalyticsError,
} from '../../domain/web-analytics.errors';

/**
 * Traducción pura entre el puerto de analítica web y el Measurement Protocol de
 * Google Analytics 4. Sin red, sin NestJS y sin reloj propio: todo entra por
 * parámetro para que las reglas del vendor —que son casi todas numéricas— se
 * puedan probar de forma determinista.
 *
 * Aquí vive el conocimiento incómodo de GA4: cuántos eventos caben en una
 * petición, qué nombres están reservados, cuánto puede medir un valor y cuánto
 * puede envejecer un evento antes de que Google lo tire **sin decirlo**. Ese
 * último caso es el que justifica el mapper: el proveedor responde `204 No
 * Content` tanto si contó el evento como si lo descartó, así que lo que no
 * validemos aquí no lo valida nadie.
 */

/** Eventos por petición admitidos por el Measurement Protocol. */
export const GA4_MAX_EVENTS_PER_REQUEST = 25;
/** Longitud máxima del nombre de evento. */
export const GA4_MAX_EVENT_NAME_LENGTH = 40;
/** Parámetros por evento admitidos. */
export const GA4_MAX_PARAMS_PER_EVENT = 25;
/** Longitud máxima del nombre de un parámetro. */
export const GA4_MAX_PARAM_NAME_LENGTH = 40;
/** Longitud máxima del valor de un parámetro (propiedad estándar). */
export const GA4_MAX_PARAM_VALUE_LENGTH = 100;
/** Antigüedad máxima aceptada; más allá, GA4 descarta el evento en silencio. */
export const GA4_MAX_EVENT_AGE_MS = 72 * 60 * 60 * 1000;
/** Tamaño máximo del cuerpo JSON de una petición. */
export const GA4_MAX_PAYLOAD_BYTES = 130_000;

/**
 * Nombres que GA4 se reserva para sí. Enviarlos no da error: el evento se
 * ignora o contamina un informe estándar, que es peor que un rechazo.
 */
export const GA4_RESERVED_EVENT_NAMES: ReadonlySet<string> = new Set([
  'ad_activeview',
  'ad_click',
  'ad_exposure',
  'ad_impression',
  'ad_query',
  'ad_reward',
  'adunit_exposure',
  'app_clear_data',
  'app_exception',
  'app_install',
  'app_remove',
  'app_update',
  'app_upgrade',
  'dynamic_link_app_open',
  'dynamic_link_app_update',
  'dynamic_link_first_open',
  'error',
  'first_open',
  'first_visit',
  'in_app_purchase',
  'notification_dismiss',
  'notification_foreground',
  'notification_open',
  'notification_receive',
  'os_update',
  'session_start',
  'user_engagement',
]);

/** Prefijos de parámetro reservados por Google. */
const RESERVED_PARAM_PREFIXES = ['_', 'firebase_', 'ga_', 'google_', 'gtag.'];

/** Prefijo con el que se rescata un nombre de evento reservado o inválido. */
const SAFE_NAME_PREFIX = 'evt_';

/** Un evento tal como lo espera el Measurement Protocol. */
export interface Ga4Event {
  /**
   * Nombre normalizado del evento.
   */
  name: string;
  /**
   * Parámetros ya saneados y acotados.
   */
  params: Record<string, string | number>;
}

/** Cuerpo de una petición al Measurement Protocol. */
export interface Ga4Payload {
  /**
   * Identificador pseudónimo del navegador/visitante.
   */
  client_id: string;
  /**
   * Marca temporal de la petición, en microsegundos.
   */
  timestamp_micros: number;
  /**
   * Consentimiento declarado para uso publicitario de los datos.
   */
  consent: {
    /**
     * Uso publicitario de los datos del usuario.
     */
    ad_user_data: 'GRANTED' | 'DENIED';
    /**
     * Personalización publicitaria.
     */
    ad_personalization: 'GRANTED' | 'DENIED';
  };
  /**
   * Eventos de la petición (como máximo `GA4_MAX_EVENTS_PER_REQUEST`).
   */
  events: Ga4Event[];
}

/** Ajustes del mapeo que dependen de la configuración, no del evento. */
export interface Ga4MappingOptions {
  /**
   * Sal con la que se deriva el `client_id`; nunca sale del proceso.
   */
  subjectSalt: string;
  /**
   * Consentimiento por defecto cuando el envío no declara el suyo.
   */
  defaultConsent: WebAnalyticsConsent;
  /**
   * Holgura con la que dos eventos comparten petición (y `timestamp_micros`).
   */
  batchToleranceMs: number;
  /**
   * Momento de referencia para juzgar la antigüedad. Inyectable para pruebas.
   */
  now: Date;
}

/** Resultado del mapeo: lo que se envía y lo que se quedó por el camino. */
export interface Ga4MappingResult {
  /**
   * Peticiones listas para enviar, en orden cronológico.
   */
  payloads: Ga4Payload[];
  /**
   * Eventos descartados por antigüedad o por no caber en ninguna petición.
   */
  dropped: number;
}

/**
 * Deriva el `client_id` que verá Google a partir de una clave interna.
 *
 * GA4 lo usa como clave de usuario/navegador, así que tiene que ser **estable**
 * (si cambia, un mismo visitante aparece como varios) y **no reversible** (si es
 * el uuid interno, el proveedor puede cruzar sus datos con los nuestros). Un
 * SHA-256 con sal cumple ambas, y el formato `dígitos.dígitos` es el que GA4
 * genera por su cuenta, de modo que ninguna herramienta del ecosistema se
 * extraña al leerlo.
 *
 * @param key - Clave interna pseudónima (sujeto o sesión).
 * @param salt - Sal del despliegue.
 * @returns Identificador con la forma `1234567890.1234567890`.
 */
export function deriveClientId(key: string, salt: string): string {
  const digest = createHash('sha256').update(`${salt}:${key}`).digest('hex');
  const left = BigInt(`0x${digest.slice(0, 16)}`) % 10_000_000_000n;
  const right = BigInt(`0x${digest.slice(16, 32)}`) % 10_000_000_000n;
  return `${left}.${right}`;
}

/**
 * Deriva un `session_id` numérico estable a partir de la clave de sesión.
 *
 * @param key - Clave interna de sesión o journey.
 * @param salt - Sal del despliegue.
 * @returns Entero positivo estable para la misma clave.
 */
export function deriveSessionId(key: string, salt: string): number {
  const digest = createHash('sha256')
    .update(`${salt}:session:${key}`)
    .digest('hex');
  return Number(BigInt(`0x${digest.slice(0, 12)}`) % 10_000_000_000n);
}

/**
 * Normaliza un nombre de evento a las reglas de GA4.
 *
 * Rescata en vez de rechazar: un nombre reservado o con caracteres inválidos se
 * prefija y se limpia, porque perder el evento por su nombre sería peor que
 * verlo con un nombre ligeramente distinto en el informe.
 *
 * @param name - Nombre funcional del evento.
 * @returns Nombre admisible por GA4, o `null` si no queda nada utilizable.
 */
export function sanitizeEventName(name: string): string | null {
  const cleaned = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/gu, '_')
    .replace(/_{2,}/gu, '_')
    .replace(/^_+|_+$/gu, '');
  if (!cleaned) return null;
  const prefixed = /^[a-z]/u.test(cleaned)
    ? cleaned
    : SAFE_NAME_PREFIX + cleaned;
  const safe = GA4_RESERVED_EVENT_NAMES.has(prefixed)
    ? SAFE_NAME_PREFIX + prefixed
    : prefixed;
  return safe.slice(0, GA4_MAX_EVENT_NAME_LENGTH);
}

/**
 * Sanea las propiedades de un evento: nombres válidos, valores acotados y
 * ningún prefijo reservado.
 *
 * @param params - Propiedades ya minimizadas por el dominio.
 * @returns Propiedades admisibles por GA4, como mucho `GA4_MAX_PARAMS_PER_EVENT`.
 */
export function sanitizeParams(
  params: Record<string, WebAnalyticsParamValue> | undefined,
): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  if (!params) return out;
  for (const [rawKey, rawValue] of Object.entries(params)) {
    if (rawValue === undefined || rawValue === null) continue;
    if (Object.keys(out).length >= GA4_MAX_PARAMS_PER_EVENT) break;
    const key = rawKey
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]/gu, '_')
      .slice(0, GA4_MAX_PARAM_NAME_LENGTH);
    if (!key) continue;
    // El prefijo se juzga sobre el nombre normalizado y **antes** de limpiarlo:
    // recortar el guion bajo inicial de `_private` no lo haría admisible, sólo
    // lo colaría con otro nombre y arriesgaría pisar un `private` legítimo.
    if (RESERVED_PARAM_PREFIXES.some((prefix) => key.startsWith(prefix)))
      continue;
    const value = normalizeParamValue(rawValue);
    if (value === undefined) continue;
    out[key] = value;
  }
  return out;
}

/** Lleva un valor de propiedad al dominio que GA4 acepta (string o número). */
function normalizeParamValue(
  value: Exclude<WebAnalyticsParamValue, undefined>,
): string | number | undefined {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  const text = value.trim();
  return text ? text.slice(0, GA4_MAX_PARAM_VALUE_LENGTH) : undefined;
}

/**
 * Traduce un envío del puerto a las peticiones concretas del Measurement
 * Protocol.
 *
 * Tres reglas del vendor deciden el troceado, y ninguna es negociable: como
 * mucho 25 eventos por petición, un único `timestamp_micros` **por petición**
 * (no por evento) y un cuerpo por debajo de 130 kB. De la segunda sale el
 * agrupado por proximidad temporal: los eventos se ordenan y se agrupan
 * mientras quepan en la holgura configurada, de modo que la marca de la
 * petición nunca miente más de esa holgura sobre ninguno de sus eventos.
 *
 * @param hit - Envío del puerto, ya minimizado.
 * @param options - Ajustes de configuración y reloj de referencia.
 * @returns Peticiones a enviar y cuántos eventos se descartaron.
 */
export function toMeasurementProtocolPayloads(
  hit: WebAnalyticsHit,
  options: Ga4MappingOptions,
): Ga4MappingResult {
  const identityKey = hit.identity.subjectKey ?? hit.identity.sessionKey;
  if (!identityKey) return { payloads: [], dropped: hit.events.length };

  const clientId = deriveClientId(identityKey, options.subjectSalt);
  const sessionId = hit.identity.sessionKey
    ? deriveSessionId(hit.identity.sessionKey, options.subjectSalt)
    : undefined;
  const consent = hit.consent ?? options.defaultConsent;
  const nowMs = options.now.getTime();

  let dropped = 0;
  const prepared: { at: number; event: Ga4Event }[] = [];
  for (const event of hit.events) {
    const name = sanitizeEventName(event.name);
    const at = (event.occurredAt ?? options.now).getTime();
    if (!name || !Number.isFinite(at) || nowMs - at > GA4_MAX_EVENT_AGE_MS) {
      dropped += 1;
      continue;
    }
    prepared.push({
      at: Math.min(at, nowMs),
      event: { name, params: withDefaultParams(event, sessionId) },
    });
  }
  prepared.sort((a, b) => a.at - b.at);

  const payloads: Ga4Payload[] = [];
  let batch: { at: number; event: Ga4Event }[] = [];
  /**
   * Ejecuta la operación flush.
   */
  const flush = (): void => {
    if (!batch.length) return;
    const built = buildPayloads(batch, { clientId, consent });
    payloads.push(...built.payloads);
    dropped += built.dropped;
    batch = [];
  };
  for (const item of prepared) {
    const exceedsWindow =
      batch.length > 0 && item.at - batch[0].at > options.batchToleranceMs;
    if (batch.length >= GA4_MAX_EVENTS_PER_REQUEST || exceedsWindow) flush();
    batch.push(item);
  }
  flush();

  return { payloads, dropped };
}

/**
 * Añade las propiedades que GA4 necesita para que el evento cuente como
 * actividad real: sin `engagement_time_msec` el usuario aparece pero la sesión
 * no se registra como interactiva, y sin `session_id` los informes de sesión
 * quedan vacíos aunque los eventos lleguen.
 */
function withDefaultParams(
  event: WebAnalyticsEvent,
  sessionId: number | undefined,
): Record<string, string | number> {
  const params = sanitizeParams(event.params);
  if (sessionId !== undefined && params.session_id === undefined) {
    params.session_id = sessionId;
  }
  if (params.engagement_time_msec === undefined) {
    params.engagement_time_msec = 1;
  }
  return params;
}

/**
 * Materializa un grupo de eventos en una o varias peticiones respetando el
 * límite de tamaño. Si un solo evento ya no cabe, se descarta: partirlo no lo
 * haría más pequeño.
 */
function buildPayloads(
  batch: { at: number; event: Ga4Event }[],
  identity: {
    /**
     * Identificador pseudónimo del visitante.
     */
    clientId: string;
    /**
     * Consentimiento declarado para el envío.
     */
    consent: WebAnalyticsConsent;
  },
): Ga4MappingResult {
  const payload: Ga4Payload = {
    client_id: identity.clientId,
    timestamp_micros: batch[0].at * 1000,
    consent: {
      ad_user_data: identity.consent.adUserData ? 'GRANTED' : 'DENIED',
      ad_personalization: identity.consent.adPersonalization
        ? 'GRANTED'
        : 'DENIED',
    },
    events: batch.map((item) => item.event),
  };
  if (
    Buffer.byteLength(JSON.stringify(payload), 'utf8') <= GA4_MAX_PAYLOAD_BYTES
  ) {
    return { payloads: [payload], dropped: 0 };
  }
  if (batch.length === 1) return { payloads: [], dropped: 1 };
  const half = Math.ceil(batch.length / 2);
  const left = buildPayloads(batch.slice(0, half), identity);
  const right = buildPayloads(batch.slice(half), identity);
  return {
    payloads: [...left.payloads, ...right.payloads],
    dropped: left.dropped + right.dropped,
  };
}

/**
 * Traduce el fallo de una llamada a GA4 al error de dominio correspondiente.
 *
 * @param error - Error tal como lo lanzó axios.
 * @returns Error de dominio con código estable y transitoriedad decidida.
 */
export function mapGoogleAnalyticsError(error: unknown): WebAnalyticsError {
  if (!(error instanceof AxiosError)) {
    return new WebAnalyticsNetworkError('Google Analytics network error');
  }
  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return new WebAnalyticsTimeoutError('Google Analytics request timed out');
  }
  const status = error.response?.status;
  if (!status) {
    return new WebAnalyticsNetworkError('Google Analytics network error');
  }
  if (status === 429) {
    return new WebAnalyticsRateLimitedError(
      'Google Analytics rate limited',
      retryAfterMs(error.response?.headers?.['retry-after']),
    );
  }
  if (status === 401 || status === 403) {
    return new WebAnalyticsUnauthorizedError(
      'Google Analytics credentials rejected',
    );
  }
  if (status >= 500) {
    return new WebAnalyticsUnavailableError(
      `Google Analytics unavailable (${status})`,
    );
  }
  return new WebAnalyticsInvalidRequestError(
    `Google Analytics rejected the request (${status})`,
  );
}

/** Convierte la cabecera `Retry-After` en milisegundos, si es interpretable. */
function retryAfterMs(value: unknown): number | undefined {
  if (typeof value !== 'string') return undefined;
  const seconds = Number(value);
  return Number.isFinite(seconds) && seconds >= 0 ? seconds * 1000 : undefined;
}
