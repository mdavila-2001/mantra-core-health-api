import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Firma y verificación HMAC-SHA256 compartida para webhooks salientes y
 * entrantes.
 *
 * El mismo secreto firma el cuerpo del despacho saliente y verifica la firma del
 * webhook entrante, de modo que emisor y receptor comparten una única fuente de
 * verdad criptográfica. La verificación usa comparación en tiempo constante
 * (`timingSafeEqual`) para no filtrar información por el tiempo de respuesta.
 */

/** Passphrase de desarrollo para derivar secretos de webhook. NUNCA en producción real. */
const INSECURE_DEV_WEBHOOK_KEY = 'dev-only-insecure-webhook-key-change-me';

/**
 * Serializa un valor a su forma canónica para firmar/verificar. Ambos extremos
 * deben serializar igual: se firma exactamente esta cadena, no el objeto.
 */
export function canonicalJson(value: unknown): string {
  return typeof value === 'string' ? value : JSON.stringify(value ?? {});
}

/** Calcula la firma HMAC-SHA256 (hex) del cuerpo con el secreto dado. */
export function signPayload(secret: string, rawBody: string): string {
  return createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex');
}

/**
 * Verifica que `provided` sea la firma HMAC-SHA256 de `rawBody` bajo `secret`.
 *
 * Fail-closed: sin firma o con formato inválido devuelve `false`. Acepta el
 * prefijo de algoritmo estilo `sha256=<hex>` que usan varios proveedores. La
 * comparación es en tiempo constante sobre los bytes de la firma.
 */
export function verifySignature(
  secret: string,
  rawBody: string,
  provided: string | undefined | null,
): boolean {
  if (!provided) return false;

  // Normaliza un posible prefijo de algoritmo ("sha256=...").
  const providedHex = provided.includes('=')
    ? (provided.split('=').pop() ?? '')
    : provided;
  if (!/^[0-9a-fA-F]+$/.test(providedHex)) return false;

  const expected = Buffer.from(signPayload(secret, rawBody), 'hex');
  const actual = Buffer.from(providedHex, 'hex');
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}

/**
 * Deriva un secreto determinista para una conexión/proveedor.
 *
 * // TODO secreto por conexión: derivación puente mientras el esquema no tenga
 * una columna de secreto por conexión/proveedor. En producción debe sustituirse
 * por el secreto real almacenado y rotado por conexión, servido desde el gestor
 * de secretos (misma raíz `WEBHOOK_SIGNING_KEY`).
 */
export function deriveWebhookSecret(namespace: string, id: string): string {
  const rootKey = process.env.WEBHOOK_SIGNING_KEY ?? INSECURE_DEV_WEBHOOK_KEY;
  return createHmac('sha256', rootKey)
    .update(`${namespace}:${id}`)
    .digest('hex');
}
