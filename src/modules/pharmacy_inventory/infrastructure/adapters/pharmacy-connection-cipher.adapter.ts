import { Injectable } from '@nestjs/common';
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'node:crypto';
import type { PharmacyConnectionCipherPort } from '../../application/ports/external-pharmacy-catalog.port';

/** Prefijo versionado: no empieza por `env:`, así que el resolvedor de secretos de webhooks lo rechaza. */
const PREFIX = 'enc:v1:';

/**
 * Cifra la clave de la conexión de cada farmacia con AES-256-GCM y una llave
 * propia (`PHARMACY_CONNECTION_SECRET_KEY`), como `AudioValueCipherService`.
 * No reutiliza `MFA_ENCRYPTION_KEY`: rotar una no rompe la otra.
 *
 * Sin la llave, la API arranca igual; `isConfigured()` da `false` y el caso
 * de uso responde que falta configurar el cifrado. Si la llave se pierde, hay
 * que volver a cargar las claves de las conexiones.
 *
 * Formato guardado en `provider_credentials.secret_ref`:
 * `enc:v1:<iv>.<tag>.<texto cifrado>`, en base64url.
 */
@Injectable()
export class PharmacyConnectionCipher implements PharmacyConnectionCipherPort {
  private readonly key: Buffer | null;

  /** Lee la llave una vez, al construir (las pruebas fijan `process.env` antes). */
  constructor() {
    const secret = (process.env.PHARMACY_CONNECTION_SECRET_KEY ?? '').trim();
    this.key =
      secret === ''
        ? null
        : createHash('sha256').update(secret, 'utf8').digest();
  }

  isConfigured(): boolean {
    return this.key !== null;
  }

  encrypt(plain: string): string {
    const key = this.requireKey();
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const sealed = Buffer.concat([
      cipher.update(plain, 'utf8'),
      cipher.final(),
    ]);
    return (
      PREFIX +
      [
        iv.toString('base64url'),
        cipher.getAuthTag().toString('base64url'),
        sealed.toString('base64url'),
      ].join('.')
    );
  }

  decrypt(sealed: string): string {
    const key = this.requireKey();
    if (!sealed.startsWith(PREFIX)) {
      throw new Error('Clave de conexión con un formato desconocido');
    }
    const [iv, tag, data] = sealed.slice(PREFIX.length).split('.');
    if (!iv || !tag || !data) {
      throw new Error('Clave de conexión con un formato desconocido');
    }
    const decipher = createDecipheriv(
      'aes-256-gcm',
      key,
      Buffer.from(iv, 'base64url'),
    );
    decipher.setAuthTag(Buffer.from(tag, 'base64url'));
    return Buffer.concat([
      decipher.update(Buffer.from(data, 'base64url')),
      decipher.final(),
    ]).toString('utf8');
  }

  private requireKey(): Buffer {
    if (this.key === null) {
      throw new Error('PHARMACY_CONNECTION_SECRET_KEY no está configurada');
    }
    return this.key;
  }
}
