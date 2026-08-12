import {
  createCipheriv,
  createDecipheriv,
  createHash,
  hkdfSync,
  randomBytes,
} from 'node:crypto';
import { AudioDomainError, AUDIO_ERROR } from '../domain/audio.errors';
import type { AudioTtsConfig } from '../config/audio-tts.env';

/**
 * Cifrado del texto renderizado en reposo.
 *
 * Se implementa aquí en vez de reutilizar `common/crypto/secret-cipher.ts` por
 * dos requisitos que aquel no cubre y que aquí no son opcionales:
 *
 *   1. **Dato autenticado adicional (AAD).** El criptograma se liga a su
 *      `asset_key`. Mover el texto cifrado de un asset a otro —por un UPDATE mal
 *      escrito o por una manipulación directa de la tabla— hace que el descifrado
 *      falle en vez de entregar el texto de otra persona a la voz de marca.
 *   2. **Anillo de claves con rotación.** El `keyId` viaja en el propio valor, de
 *      modo que rotar la clave no obliga a re-cifrar la tabla entera antes del
 *      despliegue: lo nuevo se cifra con la clave activa y lo antiguo sigue
 *      siendo legible mientras su clave permanezca en el anillo.
 *
 * Formato v2: `v2.<keyId>.<iv>.<tag>.<ciphertext>` (base64url).
 * Formato v1 (solo lectura): `v1.<iv>.<tag>.<ciphertext>`, derivación por hash
 * simple y sin AAD. Se conserva únicamente para poder leer datos escritos por la
 * versión desacoplada del worker antes de esta integración.
 */

const KDF_SALT = Buffer.from('audio-tts.kdf.v2', 'utf8');
const KDF_INFO = 'audio-tts:rendered-text';
const MIN_SECRET_LENGTH = 32;
/** En `test` se admite un secreto corto para no manejar material real en pruebas. */
const MIN_SECRET_LENGTH_TEST = 16;

export interface AudioDataKey {
  id: string;
  secret: string;
}

/**
 * Deriva la clave AES con HKDF-SHA256 incluyendo el `keyId` en el `info`.
 *
 * Que el `keyId` participe en la derivación no es decorativo: dos entradas del
 * anillo con el mismo secreto pero distinto identificador producen claves
 * distintas, así que un identificador reutilizado por error no descifra en
 * silencio material de la entrada anterior.
 */
function deriveV2(secret: string, keyId: string): Buffer {
  const info = Buffer.from(`${KDF_INFO}|${keyId}`, 'utf8');
  return Buffer.from(
    hkdfSync('sha256', Buffer.from(secret, 'utf8'), KDF_SALT, info, 32),
  );
}

/** Derivación del formato v1: hash simple, sin sal. Solo para leer datos antiguos. */
function deriveLegacyV1(secret: string): Buffer {
  return createHash('sha256').update(secret, 'utf8').digest();
}

export class AudioValueCipher {
  private readonly keys = new Map<string, string>();

  constructor(
    private readonly active: AudioDataKey,
    previous: readonly AudioDataKey[] = [],
    private readonly allowShortSecret = false,
  ) {
    this.assertSecret(active.secret);
    this.keys.set(active.id, active.secret);
    for (const key of previous) {
      this.assertSecret(key.secret);
      this.keys.set(key.id, key.secret);
    }
  }

  /**
   * @param aad dato autenticado adicional; debe ser el `assetKey` del asset
   *            propietario del texto.
   */
  encrypt(plaintext: string, aad: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv(
      'aes-256-gcm',
      deriveV2(this.active.secret, this.active.id),
      iv,
    );
    cipher.setAAD(Buffer.from(aad, 'utf8'));
    const ciphertext = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    return [
      'v2',
      this.active.id,
      iv.toString('base64url'),
      cipher.getAuthTag().toString('base64url'),
      ciphertext.toString('base64url'),
    ].join('.');
  }

  decrypt(value: string, aad: string): string {
    const parts = value.split('.');
    if (parts[0] === 'v2') return this.decryptV2(parts, aad);
    if (parts[0] === 'v1') return this.decryptV1(parts);
    throw new AudioDomainError(
      'Formato de texto cifrado no reconocido',
      AUDIO_ERROR.cipherFormat,
    );
  }

  /** `true` cuando el valor no está cifrado con la clave activa y conviene re-cifrarlo. */
  needsRewrap(value: string): boolean {
    const parts = value.split('.');
    return parts[0] !== 'v2' || parts[1] !== this.active.id;
  }

  private decryptV2(parts: readonly string[], aad: string): string {
    const [, keyId, iv, tag, ciphertext] = parts;
    if (!keyId || !iv || !tag || !ciphertext) {
      throw new AudioDomainError(
        'Formato de texto cifrado inválido',
        AUDIO_ERROR.cipherFormat,
      );
    }
    const secret = this.keys.get(keyId);
    if (!secret) {
      throw new AudioDomainError(
        `Clave de datos desconocida: ${keyId}. Añádala a AUDIO_TTS_DATA_KEYS_PREVIOUS.`,
        AUDIO_ERROR.cipherKeyUnknown,
      );
    }
    return this.open(deriveV2(secret, keyId), iv, tag, ciphertext, aad);
  }

  private decryptV1(parts: readonly string[]): string {
    const [, iv, tag, ciphertext] = parts;
    if (!iv || !tag || !ciphertext) {
      throw new AudioDomainError(
        'Formato de texto cifrado inválido',
        AUDIO_ERROR.cipherFormat,
      );
    }
    return this.open(deriveLegacyV1(this.active.secret), iv, tag, ciphertext);
  }

  private open(
    key: Buffer,
    iv: string,
    tag: string,
    ciphertext: string,
    aad?: string,
  ): string {
    try {
      const decipher = createDecipheriv(
        'aes-256-gcm',
        key,
        Buffer.from(iv, 'base64url'),
      );
      if (aad !== undefined) decipher.setAAD(Buffer.from(aad, 'utf8'));
      decipher.setAuthTag(Buffer.from(tag, 'base64url'));
      return Buffer.concat([
        decipher.update(Buffer.from(ciphertext, 'base64url')),
        decipher.final(),
      ]).toString('utf8');
    } catch {
      // El error original no se propaga: sus mensajes distinguen entre "tag
      // inválido" y "clave incorrecta", que es justo la información con la que se
      // ataca un cifrado.
      throw new AudioDomainError(
        'No fue posible descifrar el texto del asset',
        AUDIO_ERROR.cipherAuthFailed,
      );
    }
  }

  private assertSecret(secret: string): void {
    const minimum = this.allowShortSecret
      ? MIN_SECRET_LENGTH_TEST
      : MIN_SECRET_LENGTH;
    if (secret.length < minimum) {
      throw new AudioDomainError(
        `AUDIO_TTS_DATA_KEY debe tener al menos ${minimum} caracteres`,
        AUDIO_ERROR.cipherKeyTooShort,
      );
    }
  }
}

/** Parsea `id:secreto[,id:secreto]` en claves anteriores del anillo. */
export function parsePreviousAudioKeys(raw: string): AudioDataKey[] {
  if (!raw.trim()) return [];
  return raw
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const separator = entry.indexOf(':');
      if (separator <= 0) {
        throw new AudioDomainError(
          'AUDIO_TTS_DATA_KEYS_PREVIOUS debe usar el formato id:secreto[,id:secreto]',
          AUDIO_ERROR.cipherKeyringInvalid,
        );
      }
      return {
        id: entry.slice(0, separator),
        secret: entry.slice(separator + 1),
      };
    });
}

/** Construye el anillo de claves a partir de la configuración validada. */
export function buildAudioCipher(config: AudioTtsConfig): AudioValueCipher {
  return new AudioValueCipher(
    { id: config.dataKeyId, secret: config.dataKey },
    parsePreviousAudioKeys(config.dataKeysPrevious),
    config.nodeEnv === 'test',
  );
}
