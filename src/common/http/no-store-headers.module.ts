import {
  Module,
  RequestMethod,
  type MiddlewareConsumer,
  type NestModule,
} from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

/**
 * Pone `Cache-Control: no-store` y `Pragma: no-cache` a toda respuesta antes de
 * que corra el resto de la cadena (F3 de la revisión de seguridad del front).
 *
 * ## Por qué
 *
 * Las respuestas autenticadas llevan datos de personas (agenda, bandeja de
 * mensajes, búsqueda de pacientes, explain/simulate, exportaciones,
 * aprobaciones, gobierno, `me/*`). Sin `Cache-Control`, el navegador puede
 * guardar el cuerpo en su caché de disco y, en un equipo compartido de un
 * hospital, sobrevive al cierre de sesión de la SPA. `helmet()` no la fija.
 *
 * ## Por qué un middleware y no un interceptor
 *
 * Corre antes de los guards, así que también cubre el 401/403 de un guard, el
 * 404 de una ruta que no existe y cualquier error del handler: ninguna salida
 * depende de que el controlador se acuerde de poner la cabecera.
 *
 * ## Lo que NO pisa
 *
 * Esto es solo el valor por omisión; cualquiera que escriba después gana:
 *
 * - `@Header('Cache-Control', …)` y `res.setHeader(…)` de un handler (las
 *   descargas con `private, no-store`, el audio con `private, max-age`);
 * - `PublicCacheInterceptor`, que en un `GET` `@Public()` fija
 *   `public, max-age=…` + `ETag` (y contesta 304): las fichas públicas
 *   conservan su caché pública. Un `@Public()` que no cachea (login, por
 *   ejemplo) queda con `no-store`, que es lo que se quiere para un token.
 *
 * `Pragma: no-cache` es para clientes HTTP/1.0 y solo tiene sentido junto a un
 * `no-store`: justo antes de enviar las cabeceras se retira si la directiva
 * final dejó de ser `no-store` (una ficha pública con `public, max-age` no
 * puede salir diciendo a la vez «no-cache»).
 *
 * @param _req - Petición (no se lee).
 * @param res - Respuesta a la que se le fija la directiva por omisión.
 * @param next - Continúa la cadena.
 */
export function noStoreByDefault(
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Pragma', 'no-cache');

  const writeHead = res.writeHead.bind(res) as (...args: unknown[]) => Response;
  res.writeHead = ((...args: unknown[]): Response => {
    const directive = res.getHeader('Cache-Control');
    if (!String(directive ?? '').includes('no-store')) {
      res.removeHeader('Pragma');
    }
    return writeHead(...args);
  }) as Response['writeHead'];
  next();
}

/** Registra {@link noStoreByDefault} para todas las rutas (cualquier verbo). */
@Module({})
export class NoStoreHeadersModule implements NestModule {
  /**
   * Aplica el middleware a toda ruta de la app.
   *
   * @param consumer - Registro de middlewares de Nest.
   */
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(noStoreByDefault)
      .forRoutes({ path: '{*path}', method: RequestMethod.ALL });
  }
}
