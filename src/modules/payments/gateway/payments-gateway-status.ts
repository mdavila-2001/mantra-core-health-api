import { CONCEPTS } from '../../../common';
import type { GatewayPaymentIntentStatus } from './payments-gateway.types';

/**
 * Estado local de la intención que corresponde a cada estado de la pasarela.
 *
 * `expired` no tiene concepto propio en el módulo (`PI_PENDING`, `PI_PROCESSING`,
 * `PI_SUCCEEDED`, `PI_FAILED`, `PI_CANCELED`): se mapea a `PI_FAILED` —no se
 * cobró y nadie lo canceló— y la decisión queda registrada como ambigüedad a
 * confirmar con el dueño del módulo 42.
 */
export const LOCAL_INTENT_STATUS: Readonly<
  Record<GatewayPaymentIntentStatus, string>
> = {
  requires_action: CONCEPTS.PI_PENDING,
  processing: CONCEPTS.PI_PROCESSING,
  succeeded: CONCEPTS.PI_SUCCEEDED,
  failed: CONCEPTS.PI_FAILED,
  canceled: CONCEPTS.PI_CANCELED,
  expired: CONCEPTS.PI_FAILED,
};

/** Estados locales que ya no cambian por la pasarela (un cobro termina en uno solo). */
const LOCAL_TERMINAL: ReadonlySet<string> = new Set([
  CONCEPTS.PI_SUCCEEDED,
  CONCEPTS.PI_FAILED,
  CONCEPTS.PI_CANCELED,
]);

/** Avance del camino previo a un estado terminal. */
const LOCAL_PROGRESS: Readonly<Record<string, number>> = {
  [CONCEPTS.PI_PENDING]: 0,
  [CONCEPTS.PI_PROCESSING]: 1,
};

/** Qué significa un evento respecto del estado local ya conocido. */
export type GatewayEventDecision =
  'aplicar' | 'duplicado' | 'obsoleto' | 'contradiccion';

/**
 * Clasifica un evento verificado contra el estado local, en el mismo espíritu que
 * `decideCallback` del callback del proveedor (MCH-011): los webhooks se
 * reintentan y se reordenan, así que el efecto depende de **qué significa** el
 * evento y no de cuándo llegó.
 *
 * - `aplicar`: avance legítimo (pendiente → procesando → terminal).
 * - `duplicado`: el estado local ya es el que informa el evento.
 * - `obsoleto`: un hecho anterior que llegó tarde (`processing` después de
 *   `succeeded`). Se ignora sin retroceder.
 * - `contradiccion`: otro estado terminal distinto del ya conocido (`succeeded`
 *   sobre una intención `failed`, o al revés). Nunca se sobreescribe: queda
 *   para conciliación humana.
 *
 * @param current - Concepto de estado actual de la intención.
 * @param reported - Estado que informa la pasarela.
 */
export function decideGatewayEvent(
  current: string,
  reported: GatewayPaymentIntentStatus,
): GatewayEventDecision {
  const target = LOCAL_INTENT_STATUS[reported];
  if (current === target) return 'duplicado';
  if (LOCAL_TERMINAL.has(current)) {
    return LOCAL_TERMINAL.has(target) ? 'contradiccion' : 'obsoleto';
  }
  if (LOCAL_TERMINAL.has(target)) return 'aplicar';
  const from = LOCAL_PROGRESS[current];
  const to = LOCAL_PROGRESS[target];
  if (from === undefined || to === undefined) return 'contradiccion';
  return to > from ? 'aplicar' : 'obsoleto';
}

/** `true` si el estado de la pasarela es terminal. */
export function isTerminalGatewayStatus(
  status: GatewayPaymentIntentStatus,
): boolean {
  return LOCAL_TERMINAL.has(LOCAL_INTENT_STATUS[status]);
}
