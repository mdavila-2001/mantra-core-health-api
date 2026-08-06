import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import {
  loadRefreshCookieConfig,
  readCookie,
  type RefreshCookieConfig,
} from './refresh-cookie';

/**
 * Copia el refresh token de la cookie al cuerpo, antes de la validación.
 *
 * El `ValidationPipe` corre después de los middlewares y antes del controlador,
 * así que si la cookie se leyera en el controlador el DTO ya habría rechazado
 * la petición por falta de `refreshToken`. Rellenar el cuerpo aquí permite que
 * `RefreshTokenDto` siga exigiendo el campo y, con el flag apagado, el
 * comportamiento quede **exactamente** como estaba: sin cookie no se toca nada.
 *
 * El cuerpo tiene prioridad sobre la cookie: durante la migración el frontend
 * puede seguir mandándolo, y una cookie vieja no debe pisar el token que el
 * cliente acaba de recibir.
 */
@Injectable()
export class RefreshCookieMiddleware implements NestMiddleware {
  private readonly config: RefreshCookieConfig;

  /** Inicializa la instancia leyendo la configuración una sola vez. */
  constructor() {
    this.config = loadRefreshCookieConfig();
  }

  /**
   * Ejecuta el middleware.
   *
   * @param req - Petición entrante.
   * @param _res - Respuesta saliente, sin usar.
   * @param next - Continuación de la cadena.
   */
  use(req: Request, _res: Response, next: NextFunction): void {
    if (!this.config.enabled) return next();

    const body = req.body as Record<string, unknown> | undefined;
    if (body && typeof body.refreshToken === 'string' && body.refreshToken) {
      return next();
    }

    const fromCookie = readCookie(req, this.config.name);
    if (fromCookie) {
      req.body = { ...(body ?? {}), refreshToken: fromCookie };
    }
    next();
  }
}
