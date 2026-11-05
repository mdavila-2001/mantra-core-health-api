import { BlockList, isIP } from 'node:net';
import { PaymentsErrorReason } from '../payments.error-reasons';

/** Lo mínimo que la política necesita de `provider_callback_endpoints`. */
export interface CallbackEndpointRecord {
  /** Ruta pública registrada (`/payments/callbacks/:callbackPath`). */
  readonly callbackPath: string;
  /** Concepto de estado del endpoint. */
  readonly stateConceptId: string;
  /** Redes de origen permitidas (JSON); vacío o ausente = sin restricción. */
  readonly allowedSourceCidrsJson?: unknown;
  /** Ventana de repetición en segundos; ausente = sin ventana. */
  readonly replayWindowSeconds?: number | null;
}

/** Hechos del callback recibido que la política contrasta con el endpoint. */
export interface CallbackContext {
  /** Ruta por la que llegó el callback. */
  readonly callbackPath: string;
  /** IP de origen resuelta por el servidor (nunca una cabecera del cuerpo). */
  readonly sourceIp?: string;
  /** `timestamp` firmado del callback, si el proveedor lo envió. */
  readonly timestamp?: string;
  /** Instante de evaluación. */
  readonly now: Date;
  /** Concepto que significa "endpoint activo". */
  readonly activeStateConceptId: string;
}

/** Resultado de contrastar un callback con los endpoints de su conexión. */
export type CallbackEndpointDecision =
  | { readonly allowed: true; readonly enforced: boolean }
  | {
      readonly allowed: false;
      readonly reason:
        | PaymentsErrorReason.GATEWAY_CALLBACK_ENDPOINT_NOT_ALLOWED
        | PaymentsErrorReason.GATEWAY_CALLBACK_SOURCE_NOT_ALLOWED
        | PaymentsErrorReason.GATEWAY_CALLBACK_OUTSIDE_REPLAY_WINDOW;
    };

/** `::ffff:1.2.3.4` es la IPv4 `1.2.3.4` vista desde un socket dual-stack. */
function normalizeIp(ip: string): string {
  return ip.replace(/^::ffff:/i, '');
}

/**
 * Si `ip` cae dentro de alguna de las redes. Fail-closed: una entrada que no es
 * una IP o un CIDR válido hace que la lista entera se considere inválida.
 */
function ipInCidrs(ip: string | undefined, cidrs: unknown): boolean {
  if (!ip || !Array.isArray(cidrs)) return false;
  const address = normalizeIp(ip);
  const family = isIP(address);
  if (family === 0) return false;

  const list = new BlockList();
  for (const entry of cidrs) {
    if (typeof entry !== 'string') return false;
    const [network, prefixText] = entry.trim().split('/');
    const networkFamily = isIP(network);
    if (networkFamily === 0) return false;
    const type = networkFamily === 4 ? 'ipv4' : 'ipv6';
    if (prefixText === undefined) {
      list.addAddress(network, type);
      continue;
    }
    const prefix = Number(prefixText);
    const max = networkFamily === 4 ? 32 : 128;
    if (!/^\d{1,3}$/.test(prefixText) || prefix < 0 || prefix > max)
      return false;
    list.addSubnet(network, prefix, type);
  }
  return list.check(address, family === 4 ? 'ipv4' : 'ipv6');
}

/**
 * Contrasta un callback ya autenticado (firma válida) con la configuración de
 * endpoint de su conexión.
 *
 * - Sin endpoints registrados para la conexión no hay configuración que
 *   aplicar: se mantiene el comportamiento previo (`enforced: false`). La
 *   verificación se activa por conexión, cuando sus endpoints existen y el
 *   proveedor ya acordó el contrato de bytes firmados.
 * - Con endpoints registrados, la ruta debe ser la de uno ACTIVO de la misma
 *   conexión. Los endpoints recibidos ya vienen filtrados por conexión.
 * - Si el endpoint declara redes, la IP de origen debe estar en alguna.
 * - Si declara ventana, el `timestamp` (firmado) debe existir y caer dentro de
 *   ella; un callback sin timestamp no puede demostrar su antigüedad.
 *
 * @param endpoints - Endpoints de la conexión de la transacción.
 * @param context - Hechos del callback recibido.
 * @returns La decisión y, si se rechaza, el motivo estable.
 */
export function evaluateCallbackEndpoint(
  endpoints: readonly CallbackEndpointRecord[],
  context: CallbackContext,
): CallbackEndpointDecision {
  if (endpoints.length === 0) return { allowed: true, enforced: false };

  const endpoint = endpoints.find(
    (candidate) =>
      candidate.callbackPath === context.callbackPath &&
      candidate.stateConceptId === context.activeStateConceptId,
  );
  if (!endpoint) {
    return {
      allowed: false,
      reason: PaymentsErrorReason.GATEWAY_CALLBACK_ENDPOINT_NOT_ALLOWED,
    };
  }

  const cidrs = endpoint.allowedSourceCidrsJson;
  const restrictsSource =
    cidrs !== null &&
    cidrs !== undefined &&
    !(Array.isArray(cidrs) && cidrs.length === 0);
  if (restrictsSource && !ipInCidrs(context.sourceIp, cidrs)) {
    return {
      allowed: false,
      reason: PaymentsErrorReason.GATEWAY_CALLBACK_SOURCE_NOT_ALLOWED,
    };
  }

  const windowSeconds = endpoint.replayWindowSeconds;
  if (windowSeconds && windowSeconds > 0) {
    const sentAt = context.timestamp ? Date.parse(context.timestamp) : NaN;
    if (
      !Number.isFinite(sentAt) ||
      Math.abs(context.now.getTime() - sentAt) > windowSeconds * 1000
    ) {
      return {
        allowed: false,
        reason: PaymentsErrorReason.GATEWAY_CALLBACK_OUTSIDE_REPLAY_WINDOW,
      };
    }
  }

  return { allowed: true, enforced: true };
}
