import {
  createHmac,
  createPublicKey,
  timingSafeEqual,
  verify as edVerify,
  type KeyObject,
} from 'node:crypto';

/**
 * Verificación de webhooks Standard Webhooks v1 de la pasarela de pagos.
 *
 * Réplica mínima —sólo verificación— del algoritmo de `@pay/webhook-signature`
 * (repo `pasarelapago`, `contracts/packages/webhook-signature`). La API no puede
 * importar código de otro repositorio, así que la lógica vive acá como módulo
 * propio y `standard-webhook-signature.parity.spec.ts` la contrasta contra
 * vectores generados por la librería de referencia.
 *
 * - `v1`: HMAC-SHA256 con secreto `whsec_` + base64 de 24 a 64 bytes.
 * - `v1a`: Ed25519 con clave pública `whpk_` + base64 de 32 bytes.
 *
 * El contenido firmado es `${webhook-id}.${webhook-timestamp}.${cuerpo}`, con el
 * cuerpo **byte a byte** idéntico al recibido: por eso el receptor necesita los
 * bytes crudos y no el JSON ya interpretado.
 */

/** Cabecera con el id del evento (el mismo `id` del cuerpo; no cambia en los reintentos). */
export const WEBHOOK_HEADER_ID = 'webhook-id';
/** Cabecera con la marca de tiempo del envío, en segundos desde la época. */
export const WEBHOOK_HEADER_TIMESTAMP = 'webhook-timestamp';
/** Cabecera con las firmas (`v1,<base64>` / `v1a,<base64>`) separadas por espacio. */
export const WEBHOOK_HEADER_SIGNATURE = 'webhook-signature';

/** Ventana anti-replay por defecto: la misma que la librería de referencia. */
export const DEFAULT_WEBHOOK_TOLERANCE_SECONDS = 300;

const SECRET_PREFIX = 'whsec_';
const PUBLIC_KEY_PREFIX = 'whpk_';
const SPKI_ED25519_PREFIX = Buffer.from('302a300506032b6570032100', 'hex');

/** Por qué se rechazó un webhook; los mismos códigos que la librería de referencia. */
export type WebhookVerificationFailure =
  | 'missing_headers'
  | 'invalid_timestamp'
  | 'timestamp_outside_tolerance'
  | 'no_matching_signature';

/** La verificación falló; `reason` lo dice sin revelar nada de las claves. */
export class WebhookVerificationError extends Error {
  constructor(readonly reason: WebhookVerificationFailure) {
    super(`Webhook inválido: ${reason}`);
    this.name = 'WebhookVerificationError';
  }
}

/** Entrada de la verificación. */
export interface VerifyWebhookInput {
  /** Cabeceras de la petición (nombre en cualquier capitalización). */
  readonly headers: Readonly<Record<string, string | string[] | undefined>>;
  /** Cuerpo crudo, exactamente como llegó. */
  readonly payload: string | Buffer;
  /** Secretos simétricos `whsec_…` de confianza. */
  readonly secrets?: readonly string[];
  /** Claves públicas `whpk_…` de confianza: nunca se lee la clave del propio mensaje. */
  readonly publicKeys?: readonly string[];
  /** Tolerancia de la marca de tiempo, en segundos. */
  readonly toleranceSeconds?: number;
  /** Segundos desde la época; sólo para pruebas. */
  readonly now?: number;
}

/**
 * Decodifica un secreto `whsec_…`.
 *
 * @throws RangeError si no mide entre 24 y 64 bytes.
 */
export function decodeWebhookSecret(secret: string): Buffer {
  const raw = Buffer.from(
    secret.startsWith(SECRET_PREFIX)
      ? secret.slice(SECRET_PREFIX.length)
      : secret,
    'base64',
  );
  if (raw.length < 24 || raw.length > 64) {
    throw new RangeError('El secreto debe tener entre 24 y 64 bytes');
  }
  return raw;
}

/**
 * Convierte una clave pública `whpk_…` en un `KeyObject` de Ed25519.
 *
 * @throws RangeError si falta el prefijo o la clave no mide 32 bytes.
 */
export function decodeWebhookPublicKey(publicKey: string): KeyObject {
  if (!publicKey.startsWith(PUBLIC_KEY_PREFIX)) {
    throw new RangeError('Clave pública sin el prefijo whpk_');
  }
  const raw = Buffer.from(publicKey.slice(PUBLIC_KEY_PREFIX.length), 'base64');
  if (raw.length !== 32) {
    throw new RangeError('La clave pública Ed25519 debe tener 32 bytes');
  }
  return createPublicKey({
    key: Buffer.concat([SPKI_ED25519_PREFIX, raw]),
    format: 'der',
    type: 'spki',
  });
}

/** Contenido firmado: `${id}.${timestamp}.${payload}`. */
function signedContent(
  id: string,
  timestamp: string,
  payload: string | Buffer,
): Buffer {
  return Buffer.concat([
    Buffer.from(`${id}.${timestamp}.`),
    Buffer.from(payload),
  ]);
}

/** Lee una cabecera sin distinguir mayúsculas; con valores repetidos toma el primero. */
function header(
  headers: VerifyWebhookInput['headers'],
  name: string,
): string | undefined {
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === name) {
      return Array.isArray(value) ? value[0] : value;
    }
  }
  return undefined;
}

/** Igualdad en tiempo constante. */
function equalConstantTime(a: Buffer, b: Buffer): boolean {
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Verifica un webhook recibido.
 *
 * @throws WebhookVerificationError si falta una cabecera, la marca de tiempo es
 *   inválida o cae fuera de la tolerancia, o ninguna firma coincide con ninguno
 *   de los secretos o claves públicas de confianza.
 */
export function verifyStandardWebhook(input: VerifyWebhookInput): void {
  const id = header(input.headers, WEBHOOK_HEADER_ID);
  const rawTimestamp = header(input.headers, WEBHOOK_HEADER_TIMESTAMP);
  const signatureHeader = header(input.headers, WEBHOOK_HEADER_SIGNATURE);
  if (!id || !rawTimestamp || !signatureHeader) {
    throw new WebhookVerificationError('missing_headers');
  }
  if (!/^\d{1,12}$/u.test(rawTimestamp)) {
    throw new WebhookVerificationError('invalid_timestamp');
  }

  const now = input.now ?? Math.floor(Date.now() / 1000);
  const tolerance = input.toleranceSeconds ?? DEFAULT_WEBHOOK_TOLERANCE_SECONDS;
  if (Math.abs(now - Number(rawTimestamp)) > tolerance) {
    throw new WebhookVerificationError('timestamp_outside_tolerance');
  }

  const content = signedContent(id, rawTimestamp, input.payload);
  const expectedV1 = (input.secrets ?? []).map((secret) =>
    createHmac('sha256', decodeWebhookSecret(secret)).update(content).digest(),
  );
  const publicKeys = (input.publicKeys ?? []).map(decodeWebhookPublicKey);

  for (const candidate of signatureHeader.split(' ')) {
    const comma = candidate.indexOf(',');
    if (comma < 0) continue;
    const version = candidate.slice(0, comma);
    const signature = Buffer.from(candidate.slice(comma + 1), 'base64');
    if (
      version === 'v1' &&
      expectedV1.some((expected) => equalConstantTime(expected, signature))
    ) {
      return;
    }
    if (
      version === 'v1a' &&
      publicKeys.some((key) => edVerify(null, content, key, signature))
    ) {
      return;
    }
  }
  throw new WebhookVerificationError('no_matching_signature');
}
