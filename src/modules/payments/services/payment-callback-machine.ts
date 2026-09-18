import { createHash } from 'node:crypto';
import { CONCEPTS } from '../../../common';

/**
 * Máquina de estados del ciclo de vida de una transacción de gateway (MCH-011).
 *
 * `applyCallback` trataba como duplicado únicamente el evento cuyo estado
 * objetivo coincidía con el actual y **sobreescribía** en cualquier otro caso.
 * Un proveedor reintenta y reordena entregas legítimas, así que un AUTHORIZED
 * atrasado que llega después del CAPTURED hacía retroceder la transacción y la
 * intención: desconciliación y reversión aparente de un pago confirmado.
 *
 * Acá no se decide "qué estado escribir" sino **qué significa el evento**
 * respecto del estado ya conocido:
 *
 * - `aplicar`: avance legítimo del ciclo de vida.
 * - `duplicado`: reentrega del mismo hecho; no muta nada.
 * - `obsoleto`: entrega fuera de orden de un hecho anterior ya superado
 *   (CAPTURED → AUTHORIZED). Se ignora sin retroceder y sin error: el proveedor
 *   no debe reintentarlo eternamente.
 * - `contradiccion`: el proveedor afirma algo incompatible con un estado
 *   terminal (CAPTURED → FAILED, FAILED → CAPTURED). No se oculta con un
 *   overwrite: queda para conciliación humana.
 */

/** Qué hacer con un callback verificado, dado el estado actual. */
export type DecisionCallback =
  'aplicar' | 'duplicado' | 'obsoleto' | 'contradiccion';

/**
 * Avance del camino de éxito. Sólo ordena estos cuatro: FAILED y VOIDED no son
 * "más" ni "menos" que CAPTURED, son otra rama, y por eso su choque es una
 * contradicción y no una entrega atrasada.
 */
const ORDEN_CICLO: Readonly<Record<string, number>> = {
  [CONCEPTS.TXN_PROCESSING]: 0,
  [CONCEPTS.TXN_AUTHORIZED]: 1,
  [CONCEPTS.TXN_CAPTURED]: 2,
  [CONCEPTS.TXN_SETTLED]: 3,
};

/** Transiciones admitidas. Lo que no está acá no se escribe. */
const TRANSICIONES: Readonly<Record<string, readonly string[]>> = {
  [CONCEPTS.TXN_PROCESSING]: [
    CONCEPTS.TXN_AUTHORIZED,
    CONCEPTS.TXN_CAPTURED,
    CONCEPTS.TXN_FAILED,
  ],
  // Una autorización todavía puede capturarse o caducar/fallar.
  [CONCEPTS.TXN_AUTHORIZED]: [CONCEPTS.TXN_CAPTURED, CONCEPTS.TXN_FAILED],
  // Capturado sólo avanza a liquidado, y eso lo informa la conciliación, no
  // este callback.
  [CONCEPTS.TXN_CAPTURED]: [CONCEPTS.TXN_SETTLED],
  [CONCEPTS.TXN_SETTLED]: [],
  [CONCEPTS.TXN_FAILED]: [],
  [CONCEPTS.TXN_VOIDED]: [],
};

/**
 * Clasifica un callback ya verificado contra el estado actual de la transacción.
 *
 * @param actual - Estado local de la transacción.
 * @param objetivo - Estado que informa el proveedor.
 * @returns La decisión de la máquina de estados.
 */
export function decidirCallback(
  actual: string,
  objetivo: string,
): DecisionCallback {
  if (actual === objetivo) return 'duplicado';
  if (TRANSICIONES[actual]?.includes(objetivo)) return 'aplicar';

  const rangoActual = ORDEN_CICLO[actual];
  const rangoObjetivo = ORDEN_CICLO[objetivo];
  if (
    rangoActual !== undefined &&
    rangoObjetivo !== undefined &&
    rangoObjetivo < rangoActual
  ) {
    return 'obsoleto';
  }
  return 'contradiccion';
}

/**
 * Identificador determinista del hecho que informa el proveedor.
 *
 * El contrato de callback no trae un ID de evento del proveedor, así que se
 * deriva del contenido firmado: dos entregas idénticas producen la misma
 * referencia —y el índice único de `payment_webhook_events.gateway_event_ref`
 * las reconoce como el mismo hecho— mientras que un resultado distinto sobre la
 * misma transacción es otro evento. Pendiente: cuando el proveedor aporte su
 * propio ID de evento, esta derivación debe reemplazarse por él.
 *
 * @param partes - Campos firmados del callback.
 * @returns La referencia del evento, estable para el mismo contenido.
 */
export function referenciaEvento(partes: {
  /** Referencia de la transacción en el gateway. */
  gatewayTransactionRef: string;
  /** Resultado informado. */
  outcome: string;
  /** Código de autorización, si vino. */
  authorizationCode?: string;
}): string {
  const canonico = [
    partes.gatewayTransactionRef,
    partes.outcome,
    partes.authorizationCode ?? '',
  ].join('|');
  return `sha256:${createHash('sha256').update(canonico, 'utf8').digest('hex')}`;
}
