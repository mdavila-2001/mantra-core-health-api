import { createHmac } from 'node:crypto';
import * as Joi from 'joi';

/**
 * Clave de desarrollo del HMAC del documento de identidad del ingreso. Sólo
 * para local y pruebas: en producción el arranque falla sin una clave propia.
 */
const DEV_ONLY_KEY = 'dev-only-admission-id-hmac-key-change-me';

/**
 * `ADMISSION_ID_HMAC_KEY`: clave del HMAC-SHA256 con que se guarda el número
 * del documento de identidad en `clinical.patient_admission_footprints`
 * («Admisión crea el vínculo»). Vive fuera de la base: sin ella, la huella no
 * permite recuperar el número. Obligatoria (≥ 32) en producción.
 */
export const admissionIdentityEnvSchema = Joi.object({
  ADMISSION_ID_HMAC_KEY: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.string().min(32).invalid(DEV_ONLY_KEY).required(),
    otherwise: Joi.string().optional(),
  }),
}).unknown(true);

let warned = false;

/**
 * La clave del HMAC. En producción, sin clave o con la de desarrollo, lanza
 * (el esquema de arranque ya lo impide); fuera de producción usa la de
 * desarrollo y lo avisa una vez.
 *
 * @param warn - Cómo avisar (el logger del llamador).
 */
export function admissionIdHmacKey(warn?: (msg: string) => void): string {
  const key = process.env.ADMISSION_ID_HMAC_KEY;
  if (key && key !== DEV_ONLY_KEY) return key;
  if (process.env.NODE_ENV === 'production')
    throw new Error(
      'ADMISSION_ID_HMAC_KEY es obligatoria en producción (>= 32 caracteres, fuera de la base).',
    );
  if (!warned) {
    warned = true;
    warn?.(
      'ADMISSION_ID_HMAC_KEY no configurada: se usa una clave de DESARROLLO para el HMAC del documento de ingreso',
    );
  }
  return DEV_ONLY_KEY;
}

/** Número del documento normalizado: sin espacios, guiones ni puntos, en mayúsculas. */
export function normalizeDocumentNumber(raw: string): string {
  return raw.replace(/[\s.\-_/]/g, '').toUpperCase();
}

/**
 * Lo que se guarda del documento: tipo, últimos 4 y HMAC-SHA256 hex del número
 * normalizado. El número completo no sale de esta función.
 *
 * @param methodCode - `IDV_*`.
 * @param raw - Número tal como lo escribió admisión.
 * @param key - Clave del HMAC.
 */
export function protectDocument(
  methodCode: string,
  raw: string,
  key: string,
): { type: string; last4: string; hmac: string } {
  const normalized = normalizeDocumentNumber(raw);
  return {
    type: methodCode,
    last4: normalized.slice(-4),
    hmac: createHmac('sha256', key).update(normalized, 'utf8').digest('hex'),
  };
}
