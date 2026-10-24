import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from 'node:crypto';

/**
 * Cifrado simétrico reversible para secretos TOTP (UC-01-03).
 *
 * A diferencia de una contraseña —que se hashea con Argon2 y nunca se recupera—,
 * el secreto TOTP debe recuperarse en claro cada vez que se verifica un código,
 * por lo que se cifra con AES-256-GCM (confidencialidad + integridad autenticada)
 * en lugar de hashearse.
 *
 * Formato de salida (compacto y transportable en una columna `text`):
 *   base64(salt).base64(iv).base64(authTag).base64(ciphertext)
 *
 * Compatibilidad: los secretos ya guardados tienen el formato anterior, de tres
 * partes (`iv.tag.ciphertext`) y derivados con la sal fija `KEY_SALT`.
 * `decryptSecret` los sigue leyendo; sólo lo que se cifra de ahora en adelante
 * usa sal propia. No hace falta migrar la base ni reenrolar a nadie en MFA.
 */

/** Algoritmo fijado: AES-256 en modo GCM (12 bytes de IV, 16 bytes de tag). */
const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12;
const KEY_BYTES = 32;
const SALT_BYTES = 16;

/**
 * Passphrase de desarrollo. Solo apta para pruebas y arranque local sin `.env`.
 * NUNCA debe usarse en producción: `deriveKey` aborta si detecta este valor (o su
 * ausencia) cuando `NODE_ENV==='production'`. Sigue el mismo criterio que
 * `INSECURE_DEV_SECRET` en `common/auth/auth.env.ts`.
 */
const INSECURE_DEV_KEY = 'dev-only-insecure-mfa-key-change-me';

/**
 * Sal fija del formato anterior. **Sólo para descifrar** lo que ya está en la
 * base: se mantiene porque cambiarla dejaría ilegibles esos secretos. Lo nuevo
 * ya no la usa (cada secreto lleva su propia sal aleatoria).
 */
const KEY_SALT = 'alovida.mfa.totp.v1';

/**
 * Deriva una clave AES de 32 bytes a partir de `MFA_ENCRYPTION_KEY` y una sal.
 *
 * Con sal propia por secreto, un ataque de fuerza bruta offline contra la
 * passphrase sólo rompe el secreto atacado y no todos los secretos MFA de la
 * base a la vez, como ocurría con una sal fija compartida.
 *
 * Regla de seguridad (idéntica a `loadAuthEnv`): en producción la passphrase es
 * obligatoria y no puede ser el default de desarrollo; de lo contrario se aborta
 * en lugar de cifrar secretos MFA con una clave pública conocida del repositorio.
 */
function deriveKey(salt: Buffer | string): Buffer {
  const isProduction = process.env.NODE_ENV === 'production';
  const passphrase = process.env.MFA_ENCRYPTION_KEY;

  if (isProduction && (!passphrase || passphrase === INSECURE_DEV_KEY)) {
    throw new Error(
      'MFA_ENCRYPTION_KEY es obligatoria en producción y no puede ser la clave ' +
        'de desarrollo. Configúrela desde el gestor de secretos (>= 32 caracteres).',
    );
  }

  return scryptSync(passphrase ?? INSECURE_DEV_KEY, salt, KEY_BYTES);
}

/**
 * Cifra un secreto en claro y devuelve
 * `base64(salt).base64(iv).base64(tag).base64(ciphertext)`. Cada llamada usa una
 * sal y un IV aleatorios distintos, por lo que dos cifrados del mismo secreto
 * producen salidas diferentes y requieren un ataque de fuerza bruta propio.
 */
export function encryptSecret(plain: string): string {
  const salt = randomBytes(SALT_BYTES);
  const key = deriveKey(salt);
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plain, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [
    salt.toString('base64'),
    iv.toString('base64'),
    tag.toString('base64'),
    ciphertext.toString('base64'),
  ].join('.');
}

/**
 * Descifra un valor producido por `encryptSecret` y devuelve el secreto en claro.
 * Acepta el formato actual (4 partes, sal propia) y el anterior (3 partes, sal
 * fija). Lanza si el formato es inválido o si la etiqueta de autenticación no cuadra
 * (secreto manipulado o clave incorrecta).
 */
export function decryptSecret(enc: string): string {
  const parts = enc.split('.');
  if (parts.length !== 3 && parts.length !== 4) {
    throw new Error('Formato de secreto cifrado inválido');
  }
  // 4 partes: la sal va primero. 3 partes: formato anterior, sal fija.
  const [salt, ivB64, tagB64, dataB64] =
    parts.length === 4
      ? [Buffer.from(parts[0], 'base64'), parts[1], parts[2], parts[3]]
      : [KEY_SALT, parts[0], parts[1], parts[2]];
  const key = deriveKey(salt);
  const iv = Buffer.from(ivB64, 'base64');
  const tag = Buffer.from(tagB64, 'base64');
  const ciphertext = Buffer.from(dataB64, 'base64');

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString('utf8');
}
