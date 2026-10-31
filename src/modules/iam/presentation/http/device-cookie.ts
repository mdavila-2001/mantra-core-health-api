import type { Request, Response } from 'express';

/** Nombre de la cookie de dispositivo. */
export const DEVICE_COOKIE_NAME = 'redesa_device';

/** Ruta a la que se acota: solo el login la necesita. */
export const DEVICE_COOKIE_PATH = '/iam/auth/login';

/** Vida de la cookie: 400 días, el máximo que los navegadores respetan. */
const DEVICE_COOKIE_MAX_AGE_MS = 400 * 24 * 60 * 60 * 1000;

/** Configuración efectiva de la cookie de dispositivo. */
export interface DeviceCookieEnv {
  /** `AUTH_DEVICE_COOKIE_ENABLED=true`. Apagada por defecto. */
  readonly enabled: boolean;
  /** Atributo `Secure`: sigue a `NODE_ENV=production` salvo `AUTH_DEVICE_COOKIE_SECURE`. */
  readonly secure: boolean;
  /** Nombre de la cookie. */
  readonly name: string;
  /** Ruta de la cookie. */
  readonly path: string;
}

/**
 * Lee la configuración de la cookie de dispositivo.
 *
 * Apagada por defecto, como la del refresh token: Express la deja en el
 * navegador solo si front y API comparten sitio (o el front usa credenciales);
 * si no, el cliente no la devuelve nunca y cada inicio de sesión desde un equipo
 * ya conocido pasaría por «nuevo». Activarla es una decisión coordinada con el
 * despliegue del front. Mientras está apagada, la huella por `User-Agent` sigue
 * funcionando como hasta ahora, con las demás defensas (aviso fuera de banda y
 * «Fui yo» con segundo canal).
 *
 * @param source - Origen de variables; `process.env` salvo en pruebas.
 * @returns La configuración efectiva.
 */
export function loadDeviceCookieEnv(
  source: NodeJS.ProcessEnv = process.env,
): DeviceCookieEnv {
  const explicitSecure = source.AUTH_DEVICE_COOKIE_SECURE;
  return {
    enabled: source.AUTH_DEVICE_COOKIE_ENABLED === 'true',
    secure:
      explicitSecure === undefined || explicitSecure === ''
        ? source.NODE_ENV === 'production'
        : explicitSecure === 'true',
    name: source.AUTH_DEVICE_COOKIE_NAME || DEVICE_COOKIE_NAME,
    path: source.AUTH_DEVICE_COOKIE_PATH || DEVICE_COOKIE_PATH,
  };
}

/** Escribe la cookie de dispositivo: HttpOnly y SameSite estricta. */
export function setDeviceCookie(
  res: Response,
  value: string,
  env: DeviceCookieEnv,
): void {
  res.cookie(env.name, value, {
    httpOnly: true,
    sameSite: 'strict',
    secure: env.secure,
    path: env.path,
    maxAge: DEVICE_COOKIE_MAX_AGE_MS,
  });
}

/** Lee la cookie de dispositivo de la cabecera `Cookie` (sin `cookie-parser`). */
export function readDeviceCookieHeader(
  req: Request,
  name: string,
): string | undefined {
  const header = req.headers.cookie;
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const separator = part.indexOf('=');
    if (separator === -1) continue;
    if (part.slice(0, separator).trim() !== name) continue;
    const value = part.slice(separator + 1).trim();
    if (value.length === 0) return undefined;
    try {
      return decodeURIComponent(value);
    } catch {
      return undefined;
    }
  }
  return undefined;
}
