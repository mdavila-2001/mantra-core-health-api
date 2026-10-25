import { SystemErrorReason } from './system-error-reasons';

/**
 * Un secreto cifrado no se pudo descifrar.
 *
 * Cubre tres causas que desde fuera son indistinguibles a propósito: formato
 * roto, dato corrupto/manipulado y clave de cifrado distinta de la que lo
 * produjo. El mensaje es fijo y no contiene el secreto, el texto cifrado ni
 * el error original de `node:crypto`; el filtro global lo trata como un 500
 * `INTERNAL` que conserva `reason` (ver `EXPOSABLE_5XX_REASONS`).
 */
export class SecretCipherError extends Error {
  /** Sub-código estable que el filtro serializa en la respuesta 500. */
  readonly reason = SystemErrorReason.SECRET_CIPHER_INVALID;

  constructor(message = 'Formato de secreto cifrado inválido') {
    super(message);
    this.name = 'SecretCipherError';
  }
}
