import { canonicalJson } from '../../common/crypto/webhook-signature';
import { resolveWebhookSecretRef } from '../../common/crypto/secret-ref';

/** Cabecera con la firma HMAC-SHA256 (hex, `sha256=` opcional) del webhook. */
export const CARRIER_SIGNATURE_HEADER = 'x-carrier-signature';

/** Cabecera con la marca de tiempo firmada (segundos desde la época o ISO-8601). */
export const CARRIER_TIMESTAMP_HEADER = 'x-carrier-timestamp';

/** Lo que el transportista presentó para autenticarse. */
export interface CarrierWebhookAuth {
  signature?: string;
  timestamp?: string;
}

/** Campos del cuerpo que forman parte de lo firmado. */
export interface CarrierSignedFields {
  trackingNumber: string;
  externalStatusCode: string;
  externalEventId: string;
  occurredAt?: string;
  locationText?: string;
}

/** Firma admitida: 64 dígitos hex, con prefijo `sha256=` opcional. */
const SIGNATURE_FORMAT = /^(?:sha256=)?([0-9a-f]{64})$/i;

/** Parte del código de transportista que cabe en el nombre de la variable. */
const CARRIER_ENV_CODE = /^[A-Z0-9_]{1,40}$/;

/**
 * Forma única de la firma (64 hex en minúsculas, sin prefijo).
 *
 * @param raw - Cabecera tal como llegó.
 * @returns La firma normalizada, o `null` si no tiene una forma admitida.
 */
export function normalizeCarrierSignature(
  raw: string | null | undefined,
): string | null {
  const match = raw ? SIGNATURE_FORMAT.exec(raw.trim()) : null;
  return match ? match[1].toLowerCase() : null;
}

/**
 * Secretos HMAC vigentes de un transportista, el más nuevo primero.
 *
 * El secreto de cada transportista vive en el entorno (que en despliegue
 * alimenta el gestor de secretos), nunca en la base ni derivado de una raíz
 * común: `WEBHOOK_SECRET_CARRIER_<CÓDIGO>`, con el código tal cual lo guarda el
 * catálogo, que sólo puede contener `A-Z`, `0-9` y `_` (hasta 40); otro formato no
 * autentica. Durante una rotación basta
 * declarar además `WEBHOOK_SECRET_CARRIER_<CÓDIGO>_PREV`: valen ambos hasta
 * retirar el anterior. Fail-closed: sin variable, o con un secreto de menos de
 * 32 caracteres, el transportista no puede autenticarse.
 *
 * @param carrierCode - Código del transportista tal como lo guarda el catálogo.
 * @param env - Entorno del que se leen los valores (inyectable en pruebas).
 * @returns Los secretos, o `null` si el transportista no tiene ninguno válido.
 */
export function carrierWebhookSecrets(
  carrierCode: string,
  env: NodeJS.ProcessEnv = process.env,
): string[] | null {
  // Inyectivo: ni plegado de mayúsculas ni reemplazo de caracteres, para que dos
  // códigos distintos nunca compartan variable (`a-b` y `a_b`, `dhl` y `DHL`).
  if (!CARRIER_ENV_CODE.test(carrierCode)) return null;

  const current = `WEBHOOK_SECRET_CARRIER_${carrierCode}`;
  const previous = `${current}_PREV`;
  const ref = env[previous]
    ? `env:${current},env:${previous}`
    : `env:${current}`;
  return resolveWebhookSecretRef(ref, env);
}

/**
 * Cadena que el transportista firma: un arreglo JSON, para que ningún valor
 * pueda desplazar la frontera de otro. Cubre la marca de tiempo (ventana
 * anti-replay) y todos los campos que deciden qué evento se registra, no sólo
 * un fragmento del cuerpo.
 *
 * @param timestamp - Valor de la cabecera de marca de tiempo, tal como llegó.
 * @param carrierCode - Código del transportista de la ruta.
 * @param fields - Campos del cuerpo.
 * @returns La cadena sobre la que se calcula el HMAC.
 */
export function carrierSignedString(
  timestamp: string,
  carrierCode: string,
  fields: CarrierSignedFields,
): string {
  return canonicalJson([
    timestamp,
    carrierCode,
    fields.trackingNumber,
    fields.externalStatusCode,
    fields.externalEventId,
    fields.occurredAt ?? null,
    fields.locationText ?? null,
  ]);
}
