import type { Request, Response } from 'express';

/**
 * Entrega del refresh token como cookie `httpOnly`.
 *
 * Hoy el refresh token viaja en el cuerpo de la respuesta y el frontend lo
 * guarda en `localStorage`: cualquier XSS que ejecute script en el origen puede
 * leerlo y mantener la sesión indefinidamente. Una cookie `httpOnly` no es
 * legible desde JavaScript, así que el mismo XSS ya no puede exfiltrarla.
 *
 * Va detrás de una variable de entorno **apagada por defecto** porque activarlo
 * cambia el contrato: el frontend deja de recibir el token en el cuerpo y pasa
 * a depender de que el navegador mande la cookie (`credentials: 'include'`), lo
 * que además exige CORS con allowlist y `credentials`. Encenderlo sin coordinar
 * las dos partes deja al equipo sin sesión.
 */
export interface RefreshCookieConfig {
  /**
   * Si la entrega por cookie está activa.
   */
  enabled: boolean;
  /**
   * Nombre de la cookie.
   */
  name: string;
  /**
   * Ruta a la que se acota la cookie. Acotarla al endpoint de refresco es lo que
   * impide que el navegador la adjunte en cada petición a la API, reduciendo la
   * superficie a un único endpoint.
   */
  path: string;
  /**
   * Política `SameSite`.
   */
  sameSite: 'strict' | 'lax' | 'none';
  /**
   * Si la cookie exige HTTPS.
   */
  secure: boolean;
  /**
   * Vigencia en días, alineada con la del refresh token.
   */
  maxAgeDays: number;
}

const DEFAULT_NAME = 'mch_refresh';
const DEFAULT_PATH = '/iam/auth/token/refresh';

/**
 * Lee la configuración de la cookie de refresco desde el entorno.
 *
 * `secure` es `true` salvo que se pida lo contrario de forma explícita: el valor
 * por defecto de una bandera de seguridad no puede ser el inseguro. Se permite
 * apagarlo para el desarrollo local sobre `http://localhost`, donde el navegador
 * descartaría una cookie `Secure`.
 *
 * @param env - Entorno del que leer; por defecto `process.env`.
 * @returns Configuración efectiva de la cookie de refresco.
 */
export function loadRefreshCookieConfig(
  env: NodeJS.ProcessEnv = process.env,
): RefreshCookieConfig {
  const sameSiteRaw = (
    env.AUTH_REFRESH_COOKIE_SAMESITE ?? 'strict'
  ).toLowerCase();
  const sameSite: RefreshCookieConfig['sameSite'] =
    sameSiteRaw === 'lax' || sameSiteRaw === 'none' ? sameSiteRaw : 'strict';

  return {
    enabled: env.AUTH_REFRESH_COOKIE_ENABLED === 'true',
    name: env.AUTH_REFRESH_COOKIE_NAME ?? DEFAULT_NAME,
    path: env.AUTH_REFRESH_COOKIE_PATH ?? DEFAULT_PATH,
    sameSite,
    secure: env.AUTH_REFRESH_COOKIE_SECURE !== 'false',
    maxAgeDays: Number(env.JWT_REFRESH_TTL_DAYS ?? 30),
  };
}

/**
 * Extrae una cookie de la cabecera `Cookie` cruda.
 *
 * Se parsea a mano en vez de añadir `cookie-parser`: la dependencia registraría
 * un middleware global para leer una sola cookie en un solo endpoint, y el
 * repositorio acaba de quitar dependencias que nadie usaba.
 *
 * @param req - Petición de la que leer la cabecera.
 * @param name - Nombre de la cookie buscada.
 * @returns Valor de la cookie, o `undefined` si no viene.
 */
export function readCookie(req: Request, name: string): string | undefined {
  const header = req.headers?.cookie;
  if (!header) return undefined;

  for (const part of header.split(';')) {
    const separator = part.indexOf('=');
    if (separator === -1) continue;
    if (part.slice(0, separator).trim() !== name) continue;
    const raw = part.slice(separator + 1).trim();
    try {
      return decodeURIComponent(raw);
    } catch {
      // Una cookie con escapes mal formados no es una cookie válida: se ignora
      // en vez de reventar la petición con un `URIError`.
      return undefined;
    }
  }
  return undefined;
}

/**
 * Deja el refresh token en la cookie `httpOnly`.
 *
 * @param res - Respuesta sobre la que fijar la cookie.
 * @param token - Refresh token en crudo.
 * @param config - Configuración efectiva de la cookie.
 */
export function setRefreshCookie(
  res: Response,
  token: string,
  config: RefreshCookieConfig,
): void {
  res.cookie(config.name, token, {
    httpOnly: true,
    secure: config.secure,
    sameSite: config.sameSite,
    path: config.path,
    maxAge: config.maxAgeDays * 24 * 60 * 60 * 1000,
  });
}

/**
 * Borra la cookie de refresco.
 *
 * Los atributos deben coincidir con los del alta —el navegador identifica la
 * cookie por nombre, dominio y ruta—, o el borrado no surte efecto y la sesión
 * seguiría siendo renovable después de cerrarla.
 *
 * @param res - Respuesta sobre la que borrar la cookie.
 * @param config - Configuración efectiva de la cookie.
 */
export function clearRefreshCookie(
  res: Response,
  config: RefreshCookieConfig,
): void {
  res.clearCookie(config.name, {
    httpOnly: true,
    secure: config.secure,
    sameSite: config.sameSite,
    path: config.path,
  });
}
