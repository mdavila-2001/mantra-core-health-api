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
 * Una marca nunca es un `pi_…`: el receptor de webhooks sólo acepta referencias
 * con la forma `pi_[a-z0-9]{10,40}`, así que ningún evento puede resolver a una
 * intención por su marca. `associate` la reemplaza por el `pi_…` real.
 */
export const DISPATCH_MARK_PREFIX = 'dispatching:';

/** Plazo mínimo de una reserva antes de considerarla abandonada (15 minutos). */
export const MIN_DISPATCH_LEASE_MS = 15 * 60_000;

/** Tope del backoff entre reintentos del cliente (ver `PaymentsGatewayClient.send`). */
const CLIENT_MAX_DELAY_MS = 5_000;

/**
 * Valor nuevo de marca. Lleva un identificador único sólo para que dos
 * reservas sucesivas de la misma intención sean distinguibles en el log.
 */
export function newDispatchMark(): string {
  return `${DISPATCH_MARK_PREFIX}${randomUUID()}`;
}

/** `true` si el valor es una marca de despacho y no un `pi_…` de la pasarela. */
export function isDispatchMark(ref: string | null | undefined): boolean {
  return typeof ref === 'string' && ref.startsWith(DISPATCH_MARK_PREFIX);
}

/**
 * Cuánto vive una reserva antes de dejar de bloquear a las demás intenciones de
 * la deuda.
 *
 * Una reserva sólo puede estar legítimamente «en vuelo» mientras dura la llamada:
 * `maxAttempts` intentos de `timeoutMs` más las esperas entre ellos. El plazo es
 * como mínimo 15 minutos y nunca menos de cuatro veces ese peor caso, para que
 * una reserva viva jamás se confunda con una abandonada. Pasado el plazo la
 * reserva deja de bloquear a las OTRAS intenciones (la deuda no queda bloqueada
 * para siempre por un proceso que murió); la intención dueña de la marca
 * conserva su camino de salida —repetir la operación con la misma clave— y la
 * marca no se borra: sigue siendo el rastro de un cobro que pudo crearse.
 */
export function dispatchLeaseMs(
  config: Pick<PaymentsGatewayConfig, 'timeoutMs' | 'maxAttempts'>,
): number {
  const worstCaseMs =
    config.maxAttempts * config.timeoutMs +
    (config.maxAttempts - 1) * CLIENT_MAX_DELAY_MS;
  return Math.max(MIN_DISPATCH_LEASE_MS, 4 * worstCaseMs);
}

/** Lo que hace falta de una intención para decidir si su cobro bloquea a otra. */
export interface InFlightCandidate {
  /** Referencia del cobro o marca de despacho. */
  gatewayIntentRef?: string | null;
  /** Última escritura de la fila (la reserva se fecha con ella). */
  updatedAt?: Date | null;
}

/**
 * ¿Esta intención, que apunta a la deuda y no está terminada, bloquea el cobro de
 * otra? Un `pi_…` real bloquea siempre; una marca bloquea mientras es reciente
 * (`updatedAt` dentro del plazo) y **ante la duda bloquea**: sin fecha legible
 * no se desbloquea.
 */
export function blocksOtherCharges(
  candidate: InFlightCandidate,
  nowMs: number,
  leaseMs: number,
): boolean {
  if (!candidate.gatewayIntentRef) return false;
  if (!isDispatchMark(candidate.gatewayIntentRef)) return true;
  const stamp = candidate.updatedAt?.getTime();
  if (stamp === undefined || Number.isNaN(stamp)) return true;
  return nowMs - stamp < leaseMs;
}
