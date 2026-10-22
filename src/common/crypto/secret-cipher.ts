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
 * Deriva una clave AES de 32 bytes a partir de `MFA_ENCRYPTION_KEY` y una sal.
 *
 * La sal es aleatoria y distinta por cada secreto cifrado (va junto al resto en
 * la salida de `encryptSecret`, no es secreta): antes era un literal fijo
 * (`alovida.mfa.totp.v1`) compartido por todos los secretos MFA de la base, así
 * que un único ataque de fuerza bruta offline contra la passphrase los rompía
 * a todos a la vez. Con sal por registro, ese ataque sólo rompe el secreto que
 * atacó.
 *
 * Regla de seguridad (idéntica a `loadAuthEnv`): en producción la passphrase es
 * obligatoria y no puede ser el default de desarrollo; de lo contrario se aborta
 * en lugar de cifrar secretos MFA con una clave pública conocida del repositorio.
 */
function deriveKey(salt: Buffer): Buffer {
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
 * `base64(salt).base64(iv).base64(tag).base64(ciphertext)`. Cada llamada usa
 * una sal e IV aleatorios distintos, por lo que dos cifrados del mismo secreto
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
 * Lanza si el formato es inválido o si la etiqueta de autenticación no cuadra
 * (secreto manipulado o clave incorrecta).
 */
export function decryptSecret(enc: string): string {
  const parts = enc.split('.');
  if (parts.length !== 4) {
    throw new Error('Formato de secreto cifrado inválido');
  }
  const [saltB64, ivB64, tagB64, dataB64] = parts;
  const salt = Buffer.from(saltB64, 'base64');
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
