import { randomUUID } from 'node:crypto';
import type { PaymentsGatewayConfig } from './payments-gateway.env';

/**
 * Marca de despacho: la reserva de una intención que está por crear su cobro en
 * la pasarela.
 *
 * Sin ella, el único rastro de «hay un cobro en vuelo» era el `gateway_intent_ref`
 * (`pi_…`), que sólo se escribe DESPUÉS de la respuesta de la pasarela: durante
 * toda la llamada HTTP —y para siempre si la llamada termina ambigua (504) o el
 * proceso muere antes de asociar— dos intenciones sobre la misma deuda se veían
 * una a la otra como «sin cobro» y cada una abría el suyo (N2 y N4 de la
 * re-revisión). La marca se escribe en `gateway_intent_ref`, la misma columna, en
 * la transacción de la compuerta y se confirma ANTES de llamar: es la reserva que
 * ve cualquier otra transacción, sin tocar el esquema y sin sostener ni una
 * conexión ni un bloqueo durante la llamada HTTP.
 *
 * Formato `dispatching:<epoch-ms>:<uuid>`. La fecha va dentro de la marca (y no se
 * deduce de `updated_at`, que cualquier escritura posterior refresca) porque de
 * ella depende la única decisión peligrosa: si todavía se puede reenviar con la
 * misma `Idempotency-Key`. Una marca no es un `pi_…`: el receptor de webhooks sólo
 * acepta referencias con la forma `pi_[a-z0-9]{10,40}`, así que ningún evento
 * resuelve a una intención por su marca. `associate` la reemplaza por el `pi_…`.
 *
 * **Una marca nunca vence como permiso para cobrar.** Un resultado ambiguo no
 * prueba que la pasarela no ejecutó la operación (regla 11): mientras la intención
 * no tenga su `pi_…`, la marca bloquea a las OTRAS intenciones de la deuda sea cual
 * sea su antigüedad. Pasado el plazo (`dispatchLeaseMs`) sólo cambia de clase:
 * deja de ser «en vuelo» y pasa a «requiere conciliación» (log, contador y
 * consulta). La salida es repetir la creación con la MISMA clave
 * (`reconcileGatewayDispatch`), dentro de lo que dura la clave en la pasarela.
 */
export const DISPATCH_MARK_PREFIX = 'dispatching:';

/** Plazo mínimo para que una reserva sin `pi_` pase a «requiere conciliación» (15 minutos). */
export const MIN_DISPATCH_LEASE_MS = 15 * 60_000;

/**
 * Cuánto retiene la pasarela una `Idempotency-Key` (24 h, `common.yaml`). Pasado ese
 * plazo, repetir la misma clave puede crear un SEGUNDO cobro.
 */
export const GATEWAY_IDEMPOTENCY_RETENTION_MS = 24 * 3_600_000;

/**
 * Antigüedad máxima de una marca para reenviar con la misma clave: una hora menos
 * que la retención de la pasarela, de margen para los relojes y la demora entre la
 * marca y el primer envío. Más vieja —o con una fecha ilegible— no se reenvía.
 */
export const MAX_RESEND_AGE_MS = GATEWAY_IDEMPOTENCY_RETENTION_MS - 3_600_000;

/** Tope del backoff entre reintentos del cliente (ver `PaymentsGatewayClient.send`). */
const CLIENT_MAX_DELAY_MS = 5_000;

/** Deriva de reloj tolerada entre réplicas al leer la fecha de una marca. */
const MAX_CLOCK_SKEW_MS = 5 * 60_000;

const MARK_PATTERN = /^dispatching:(\d{10,16}):[0-9a-f-]{36}$/u;

/** Valor nuevo de marca, fechado en `nowMs`. */
export function newDispatchMark(nowMs: number = Date.now()): string {
  return `${DISPATCH_MARK_PREFIX}${nowMs}:${randomUUID()}`;
}

/** `true` si el valor es una marca de despacho y no un `pi_…` de la pasarela. */
export function isDispatchMark(ref: string | null | undefined): boolean {
  return typeof ref === 'string' && ref.startsWith(DISPATCH_MARK_PREFIX);
}

/** Fecha (epoch en ms) escrita dentro de la marca, o `undefined` si es ilegible. */
export function dispatchMarkStamp(
  ref: string | null | undefined,
): number | undefined {
  if (!isDispatchMark(ref)) return undefined;
  const match = MARK_PATTERN.exec(ref as string);
  if (!match) return undefined;
  const stamp = Number(match[1]);
  return Number.isSafeInteger(stamp) ? stamp : undefined;
}

/**
 * Antigüedad de una marca en milisegundos, o `undefined` si la fecha no se puede
 * leer (marca con otro formato o fecha en el futuro lejano). Quien decide con ella
 * trata lo ilegible como «no se sabe» y nunca como «reciente».
 */
export function dispatchMarkAgeMs(
  ref: string | null | undefined,
  nowMs: number,
): number | undefined {
  const stamp = dispatchMarkStamp(ref);
  if (stamp === undefined) return undefined;
  // Una fecha más allá de la deriva de reloj razonable es ilegible, no «reciente».
  if (stamp - nowMs > MAX_CLOCK_SKEW_MS) return undefined;
  return Math.max(0, nowMs - stamp);
}

/**
 * Cuánto tarda una reserva sin `pi_` en pasar de «en vuelo» a «requiere
 * conciliación».
 *
 * Una reserva sólo está legítimamente en vuelo mientras dura la llamada:
 * `maxAttempts` intentos de `timeoutMs` más las esperas entre ellos. El plazo es
 * como mínimo 15 minutos y nunca menos de cuatro veces ese peor caso.
 */
export function dispatchLeaseMs(
  config: Pick<PaymentsGatewayConfig, 'timeoutMs' | 'maxAttempts'>,
): number {
  const worstCaseMs =
    config.maxAttempts * config.timeoutMs +
    (config.maxAttempts - 1) * CLIENT_MAX_DELAY_MS;
  return Math.max(MIN_DISPATCH_LEASE_MS, 4 * worstCaseMs);
}

/**
 * ¿Se puede reenviar la creación con la misma `Idempotency-Key`? Sólo si la marca
 * tiene fecha legible y es más joven que `MAX_RESEND_AGE_MS`: pasado ese plazo la
 * pasarela pudo haber olvidado la clave y repetirla podría crear un segundo cobro,
 * así que no se reenvía y se pide conciliación manual. Ante la duda, no.
 */
export function canResendWithSameKey(
  ref: string | null | undefined,
  nowMs: number,
): boolean {
  const age = dispatchMarkAgeMs(ref, nowMs);
  return age !== undefined && age < MAX_RESEND_AGE_MS;
}

/** Lo que hace falta de una intención para decidir cómo bloquea a otra. */
export interface InFlightCandidate {
  /** Referencia del cobro o marca de despacho. */
  gatewayIntentRef?: string | null;
}

/**
 * Cómo cuenta, para el cobro de OTRA intención de la misma deuda, una intención
 * que apunta a la deuda y no está terminada:
 *
 * - `none`: sin referencia; no hay cobro ni reserva.
 * - `in_flight`: un `pi_…` real, o una marca reciente (la llamada puede seguir en
 *   curso).
 * - `reconciliation_required`: una marca más vieja que el plazo, o con una fecha
 *   ilegible. **Bloquea igual que `in_flight`**: la ambigüedad no prueba que la
 *   pasarela no creó el cobro. Sólo se distingue para dejar constancia.
 */
export type InFlightClass = 'none' | 'in_flight' | 'reconciliation_required';

export function classifyInFlight(
  candidate: InFlightCandidate,
  nowMs: number,
  leaseMs: number,
): InFlightClass {
  if (!candidate.gatewayIntentRef) return 'none';
  if (!isDispatchMark(candidate.gatewayIntentRef)) return 'in_flight';
  const age = dispatchMarkAgeMs(candidate.gatewayIntentRef, nowMs);
  return age !== undefined && age < leaseMs
    ? 'in_flight'
    : 'reconciliation_required';
}
