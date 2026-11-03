import { createHash, randomBytes } from 'node:crypto';

/**
 * Token del enlace compartido de una receta (S-6).
 *
 * El token en claro es la credencial: quien lo tiene abre el enlace. Por eso
 * se guarda solo su SHA-256 (`shared_access_links.token_hash`, único) y el
 * claro se devuelve una sola vez, al crearlo. Un volcado de la base no deja
 * abrir ninguna receta.
 */

/** Bytes aleatorios del token: 32, que en base64url son 43 caracteres. */
export const SHARE_TOKEN_BYTES = 32;

/** Forma exacta de un token emitido: 43 caracteres del alfabeto base64url. */
const SHARE_TOKEN_SHAPE = /^[A-Za-z0-9_-]{43}$/;

/** Un token recién emitido y el hash que se persiste. */
export interface IssuedShareToken {
  /** Token en claro: viaja una vez en la respuesta y nunca se guarda. */
  readonly token: string;
  /** SHA-256 del token en hexadecimal: lo único que llega a la base. */
  readonly tokenHash: string;
}

/**
 * Hash del token tal como se guarda en `token_hash`.
 *
 * @param token - Token en claro.
 * @returns SHA-256 en hexadecimal (64 caracteres).
 */
export function hashShareToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

/**
 * Emite un token nuevo con su hash.
 *
 * @returns El token en claro y su `tokenHash`.
 */
export function issueShareToken(): IssuedShareToken {
  const token = randomBytes(SHARE_TOKEN_BYTES).toString('base64url');
  return { token, tokenHash: hashShareToken(token) };
}

/**
 * Si un texto tiene la forma de un token emitido. Lo que no la tiene se
 * responde como un token desconocido, sin consultar la base.
 *
 * @param token - Texto recibido en la ruta.
 * @returns `true` si son 43 caracteres base64url.
 */
export function isWellFormedShareToken(token: string): boolean {
  return SHARE_TOKEN_SHAPE.test(token);
}
