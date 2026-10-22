import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { isExcludedPath } from '../instrumentations';
import { HttpSliAggregator, UNMATCHED_ROUTE } from './http-sli.aggregator';

/**
 * Middleware que mide cada petición HTTP terminada (H1.1 del portal de
 * superadministración).
 *
 * Se registra con `app.use` justo después de `helmet()`, **antes** de las rutas,
 * y no como interceptor de Nest: un interceptor no ve lo que se rechaza antes
 * de llegar al handler (cuerpo inválido, ruta inexistente) y esos son
 * justamente los 4xx que el superadmin quiere contar.
 *
 * ## Qué lee y qué no
 *
 * Sólo cuatro datos: el verbo, la **plantilla** de la ruta que Express ya
 * resolvió (`/patients/:id`), el código de estado y cuánto tardó. No lee la
 * dirección completa, ni los parámetros de consulta, ni el cuerpo, ni las
 * cabeceras, ni al usuario: una métrica operativa no puede ser un registro de
 * quién consultó a qué paciente (regla 90.2 de la casa). Si Express no encontró
 * ninguna ruta, la petición se agrupa bajo `UNMATCHED`, nunca con su dirección.
 *
 * ## Qué no mide
 *
 * Las sondas de salud y la documentación (`EXCLUDED_HTTP_PATHS`), los
 * preflight `OPTIONS`, y las peticiones que el cliente aborta antes de recibir
 * respuesta (no hay estado final que contar). Medir nunca debe tumbar una
 * petición: todo error de medición se traga.
 */

/** Dependencias inyectables para las pruebas; en producción, las del proceso. */
export interface HttpSliMiddlewareOptions {
  readonly now?: () => Date;
  readonly hrtime?: () => bigint;
}

/** Plantilla de la ruta que Express resolvió, o `UNMATCHED`. */
export function routeTemplateOf(req: Request): string {
  // `req.route` es `any` en los tipos de Express; se estrecha antes de leerlo.
  const route = req.route as { path?: unknown } | undefined;
  const path = route?.path;
  if (typeof path !== 'string') return UNMATCHED_ROUTE;
  return `${req.baseUrl ?? ''}${path}`;
}

/**
 * Crea el middleware sobre un agregador.
 *
 * @param aggregator - Donde se anota cada petición.
 * @param options - Reloj y cronómetro, para las pruebas.
 */
export function createHttpSliMiddleware(
  aggregator: HttpSliAggregator,
  options: HttpSliMiddlewareOptions = {},
): RequestHandler {
  const now = options.now ?? (() => new Date());
  const hrtime = options.hrtime ?? (() => process.hrtime.bigint());

  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.method === 'OPTIONS' || isExcludedPath(req.path)) {
      next();
      return;
    }

    const startedAt = hrtime();
    res.once('finish', () => {
      try {
        aggregator.record({
          method: req.method,
          route: routeTemplateOf(req),
          status: res.statusCode,
          durationMs: Number(hrtime() - startedAt) / 1e6,
          at: now(),
        });
      } catch {
        // Medir no puede romper una respuesta que ya salió.
      }
    });
    next();
  };
}
