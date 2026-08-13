import type { Request, Response } from 'express';

/**
 * Nombre de la cookie del refresh token.
 *
 * El prefijo `__Host-` no se usa a propósito: el navegador sólo lo acepta con
 * `Path=/`, y aquí la cookie va acotada a la ruta de refresco, que es una
 * protección más útil —la cookie no viaja en ninguna otra petición— que la
 * garantía de origen que aporta el prefijo.
 */
export const REFRESH_COOKIE_NAME = 'redesa_refresh';

/**
 * Ruta a la que se acota la cookie. Coincide con el único endpoint que la
 * consume, de modo que no se envía en el resto del API ni en los recursos
 * estáticos.
 */
export const REFRESH_COOKIE_PATH = '/iam/auth/token/refresh';

/** Configuración efectiva de la entrega del refresh token. */
export interface RefreshCookieEnv {
  /**
   * Si el refresh token se entrega como cookie httpOnly en vez de en el cuerpo.
   */
  enabled: boolean;
  /**
   * Si la cookie lleva el atributo `Secure` (sólo viaja por HTTPS).
   */
  secure: boolean;
  /**
   * Vida de la cookie en días; se alinea con `JWT_REFRESH_TTL_DAYS`.
   */
  ttlDays: number;
}

/**
 * Lee de `process.env` cómo se entrega el refresh token.
 *
 * **Apagado por defecto.** Hoy el refresh token viaja en el cuerpo y el front lo
 * guarda en `localStorage`: una superficie de XSS aceptada de forma consciente y
 * temporal, previa a producción. Encender esta variable cambia el contrato del
 * cliente —deja de recibir `refreshToken` en la respuesta— así que el cambio
 * tiene que ser una decisión coordinada con el front y no un efecto colateral de
 * desplegar una versión nueva.
 *
 * `Secure` sigue a `NODE_ENV` salvo que se declare explícitamente: en producción
 * una cookie de sesión sin `Secure` viaja en claro si algo degrada la conexión a
 * HTTP, y en desarrollo local (http://localhost) el navegador la descartaría.
 *
 * @param source - Origen de variables; `process.env` salvo en pruebas.
 * @returns Configuración efectiva de la cookie.
 */
export function loadRefreshCookieEnv(
  source: NodeJS.ProcessEnv = process.env,
): RefreshCookieEnv {
  const explicitSecure = source.AUTH_REFRESH_COOKIE_SECURE;
  return {
    enabled: source.AUTH_REFRESH_COOKIE_ENABLED === 'true',
    secure:
      explicitSecure === undefined || explicitSecure === ''
        ? source.NODE_ENV === 'production'
        : explicitSecure === 'true',
    ttlDays: Number(source.JWT_REFRESH_TTL_DAYS ?? 30),
  };
}

/**
 * Escribe la cookie del refresh token en la respuesta.
 *
 * `sameSite: 'strict'` es el punto del ejercicio: con la cookie acotada a la
 * ruta de refresco y sin envío entre sitios, un tercero no puede provocar una
 * rotación de sesión desde otra pestaña. Exige que front y API compartan sitio
 * (mismo dominio registrable); si acabaran en dominios distintos habrá que
 * bajar a `lax` o `none`, y eso es una decisión de despliegue, no de código.
 *
 * @param res - Respuesta de Express en curso.
 * @param refreshToken - Token en crudo a entregar.
 * @param env - Configuración de la cookie.
 */
export function setRefreshCookie(
  res: Response,
  refreshToken: string,
  env: RefreshCookieEnv,
): void {
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    sameSite: 'strict',
    secure: env.secure,
    path: REFRESH_COOKIE_PATH,
    maxAge: env.ttlDays * 24 * 60 * 60 * 1000,
  });
}

/**
 * Borra la cookie del refresh token.
 *
 * Los atributos tienen que coincidir con los del alta —en particular `path`—;
 * si no, el navegador crea una cookie distinta y deja viva la original.
 *
 * @param res - Respuesta de Express en curso.
 * @param env - Configuración de la cookie.
 */
export function clearRefreshCookie(res: Response, env: RefreshCookieEnv): void {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'strict',
    secure: env.secure,
    path: REFRESH_COOKIE_PATH,
  });
}

/**
 * Lee el refresh token de la cabecera `Cookie` de la petición.
 *
 * Se parsea a mano en vez de montar `cookie-parser`: la aplicación no usa
 * cookies en ninguna otra parte, y añadir un middleware global para leer un
 * único valor en un único endpoint tiene más superficie que este parseo.
 *
 * @param req - Petición de Express en curso.
 * @returns El token, o `undefined` si la cookie no viene.
 */
export function readRefreshCookie(req: Request): string | undefined {
  const header = req.headers.cookie;
  if (!header) return undefined;

  for (const part of header.split(';')) {
    const separator = part.indexOf('=');
    if (separator === -1) continue;
    const name = part.slice(0, separator).trim();
    if (name !== REFRESH_COOKIE_NAME) continue;
    const value = part.slice(separator + 1).trim();
    // Una cookie presente pero vacía es lo que deja un `clearCookie` en algunos
    // navegadores: tratarla como ausente evita mandar la cadena vacía al
    // servicio, que la rechazaría con un error menos claro.
    return value.length > 0 ? decodeURIComponent(value) : undefined;
  }
  return undefined;
}
