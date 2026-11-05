import { createHash } from 'node:crypto';

/** Prefijo versionado: permite cambiar la derivación sin chocar con claves viejas. */
const KEY_PREFIX = 'mantra-pi-v1-';

/** Lo que identifica el cobro de negocio; nada de esto es dato de salud. */
export interface GatewayIdempotencyInput {
  /** Tenant propietario del cobro. */
  tenantId: string;
  /** Tipo del recurso que se cobra (`payment_debt`, `order`…), si lo hay. */
  sourceRefType?: string | null;
  /** Id de la deuda u orden que se cobra, si lo hay. */
  sourceRefId?: string | null;
  /** Factura que se cobra, si no hay referencia de origen. */
  invoiceId?: string | null;
  /** `idempotencyKey` local de la intención: identifica el intento de negocio. */
  localIdempotencyKey: string;
}

/**
 * `Idempotency-Key` para `POST /v1/payment_intents`.
 *
 * Determinista: sale de campos que ya están **persistidos** en la intención
 * (tenant, deuda u orden y clave local), no de un azar ni de la hora, así que un
 * reintento tras un corte, tras reiniciar el proceso o desde otra réplica manda
 * exactamente la misma clave y la pasarela devuelve el cobro original en vez de
 * crear un segundo. Es un hash para que quepa en los 255 caracteres del
 * contrato sea cual sea la longitud de los ids, y para no filtrar ninguno.
 *
 * @returns `mantra-pi-v1-` + SHA-256 hexadecimal (77 caracteres).
 */
export function deriveGatewayIdempotencyKey(
  input: GatewayIdempotencyInput,
): string {
  const order = input.sourceRefId ?? input.invoiceId ?? '';
  // JSON y no una unión con separador: `localIdempotencyKey` es texto libre y un
  // `|` suyo movería la frontera entre campos.
  const canonical = JSON.stringify([
    input.tenantId,
    input.sourceRefType ?? '',
    order,
    input.localIdempotencyKey,
  ]);
  return `${KEY_PREFIX}${createHash('sha256').update(canonical, 'utf8').digest('hex')}`;
}
