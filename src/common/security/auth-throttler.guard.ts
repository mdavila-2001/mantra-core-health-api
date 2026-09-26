import { createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import {
  loadRefreshCookieEnv,
  readRefreshCookie,
} from '../auth/refresh-cookie';

/** Rutas de sesión cuyo cubo de límite de tasa no es sólo la IP. */
const LOGIN_LIKE_PATHS = ['/iam/auth/login', '/iam/auth/forgot-password'];
const REFRESH_PATH = '/iam/auth/token/refresh';

/** Hash corto y estable: el identificador nunca queda en claro en Redis. */
function shortHash(value: string): string {
  return createHash('sha256').update(value).digest('hex').slice(0, 24);
}

/** Normaliza el identificador de cuenta (correo o documento) del cuerpo. */
function normalizedIdentifier(body: unknown): string | undefined {
  if (typeof body !== 'object' || body === null) return undefined;
  // `login` manda `email` o `nationalId`; `forgot-password`, `identifier`.
  const { email, nationalId, identifier } = body as Record<string, unknown>;
  const raw =
    [email, nationalId, identifier].find(
      (value): value is string =>
        typeof value === 'string' && value.trim() !== '',
    ) ?? '';
  const normalized = raw.trim().toLowerCase();
  return normalized === '' ? undefined : normalized;
}

/**
 * `ThrottlerGuard` global con el cubo adecuado para cada ruta de sesión (TX-19).
 *
 * Con la IP como único cubo, una clínica detrás de un NAT compartía el límite de
 * `login` entre todas sus cuentas. Aquí:
 *
 * - `login` y `forgot-password`: IP + identificador normalizado (con hash). Doce
 *   cuentas distintas desde la misma IP no se molestan entre sí, y la fuerza
 *   bruta sobre una cuenta sigue topada por el límite de la ruta.
 * - `token/refresh`: hash del refresh token presentado (cuerpo o cookie), o sea
 *   por sesión. Sin token cae a la IP.
 * - Todo lo demás: la IP, como el guard por defecto.
 *
 * El 429 lo emite el guard base: código `RATE_LIMITED` por el filtro global y
 * `Retry-After` en la respuesta.
 */
@Injectable()
export class AuthThrottlerGuard extends ThrottlerGuard {
  private readonly cookieName = loadRefreshCookieEnv().name;

  /** @inheritdoc */
  // La firma la fija `ThrottlerGuard`: `req` llega como `Record<string, any>`.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected override getTracker(req: Record<string, any>): Promise<string> {
    const ip = String(req.ip ?? 'unknown');
    if (req.method === 'POST') {
      const path = String(req.path ?? req.url ?? '').split('?')[0];
      if (LOGIN_LIKE_PATHS.some((suffix) => path.endsWith(suffix))) {
        const id = normalizedIdentifier(req.body);
        if (id) return Promise.resolve(`${ip}|${shortHash(id)}`);
      } else if (path.endsWith(REFRESH_PATH)) {
        const body = req.body as { refreshToken?: unknown } | undefined;
        const presented =
          (typeof body?.refreshToken === 'string' && body.refreshToken) ||
          readRefreshCookie(req as never, this.cookieName);
        if (presented) return Promise.resolve(`rt|${shortHash(presented)}`);
      }
    }
    return Promise.resolve(ip);
  }
}
