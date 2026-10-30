/**
 * Cifrado del texto renderizado: la PII validada de un audio nunca queda en
 * claro en PostgreSQL. `decrypt` lanza si el payload no es de este cifrado.
 */
export interface AudioValueCipherPort {
  encrypt(plainText: string): string;
  decrypt(payload: string): string;
}

export const AUDIO_VALUE_CIPHER_PORT = Symbol('AUDIO_VALUE_CIPHER_PORT');
