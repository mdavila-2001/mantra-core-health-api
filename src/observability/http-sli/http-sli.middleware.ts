import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { isExcludedPath } from '../instrumentations';
import { HttpSliAggregator, UNMATCHED_ROUTE } from './http-sli.aggregator';
import type { HttpSink } from '../capture/http-sink';
import type { SlowRequestSink } from '../capture/slow-request-sink';
import { currentTraceContext } from '../trace-context.service';
import {
  createRequestContext,
  runWithRequestContext,
} from '../capture/request-context';

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
  /**
   * Sink de la captura persistida (módulo 70): código exacto, módulo y
   * operación. Si se da, el middleware abre además el contexto de petición
   * (ALS) que une SQL ↔ petición ↔ error.
   */
  readonly sink?: HttpSink;
  /** Muestras de peticiones lentas/erróneas (necesita el contexto de `sink`). */
  readonly slowSink?: SlowRequestSink;
  /**
   * Prefijos de ruta que **no** entran al sink (la ruta de pruebas del propio
   * portal, para que las cuentas de una carga conocida sean exactas).
   */
  readonly sinkExcludedPrefixes?: readonly string[];
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
  aggregator: HttpSliAggregator | null,
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
    const sink = options.sink;
    // `createRequestContext` sólo arma un objeto: no lanza.
    const context = sink ? createRequestContext(req, startedAt) : undefined;
    const sinkSkipped =
      sink === undefined ||
      (options.sinkExcludedPrefixes ?? []).some((prefix) =>
        req.path.startsWith(prefix),
      );
    res.once('finish', () => {
      const sample = {
        method: req.method,
        route: routeTemplateOf(req),
        status: res.statusCode,
        durationMs: Number(hrtime() - startedAt) / 1e6,
        at: now(),
      };
      try {
        aggregator?.record(sample);
      } catch {
        // Medir no puede romper una respuesta que ya salió.
      }
      try {
        if (!sinkSkipped) {
          sink?.record(sample);
          if (context) {
            options.slowSink?.consider(context, {
              status: sample.status,
              durationMs: sample.durationMs,
              at: sample.at,
              traceId: currentTraceContext().trace_id,
            });
          }
        }
      } catch {
        // Idem.
      }
    });
    if (context) {
      runWithRequestContext(context, next);
      return;
    }
    next();
  };
}
