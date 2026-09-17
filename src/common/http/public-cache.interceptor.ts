import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { HEADERS_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import { createHash } from 'node:crypto';
import type { Request, Response } from 'express';
import { map, type Observable } from 'rxjs';
import { IS_PUBLIC_KEY } from '../auth/public.decorator';

/** La forma que deja `@Header(name, value)` en `HEADERS_METADATA`. */
interface DeclaredHeader {
  readonly name: string;
  readonly value: string | (() => string);
}

/** Cuánto vale una página de búsqueda antes de revalidar, en segundos. */
const SEARCH_MAX_AGE = 60;
/** Cuánto vale una ficha pública. Cambia menos que una búsqueda. */
const PROFILE_MAX_AGE = 300;
/** Margen en que se puede servir una copia vieja mientras se revalida. */
const STALE_WHILE_REVALIDATE = 300;

/**
 * Pone `ETag` y `Cache-Control` en las respuestas públicas, y contesta 304 (P3).
 *
 * ## Por qué es defensa y no sólo velocidad
 *
 * Las doce pantallas públicas no tienen token que atar a nadie, así que el
 * único freno real al raspado es el rate limit —y todo lo que no llegue a
 * ejecutarse ayuda—. Un `304` cuesta una comparación de hash en vez de una
 * consulta con `unaccent` sobre el directorio entero; un raspador que ignore el
 * `ETag` gasta su cuota igual, pero un cliente legítimo deja de competir por
 * ella.
 *
 * ## El ETag es débil, a propósito
 *
 * Se calcula sobre el cuerpo serializado, no sobre el `updatedAt` del recurso.
 * La ficha pública incluye publicaciones, promedios de reseñas y contadores que
 * cambian sin tocar la fila del perfil: un ETag derivado sólo de `updatedAt`
 * afirmaría «no cambió» sobre una página que sí cambió, y el cliente vería
 * datos viejos hasta que venciera el `max-age`. `W/` porque la respuesta es
 * equivalente byte a byte pero no se promete que lo sea entre versiones.
 *
 * ## Sólo toca lo que es `@Public()`
 *
 * Una respuesta con sesión nunca lleva `Cache-Control: public`: bastaría un
 * proxy intermedio para servirle a alguien la página de otro.
 */
@Injectable()
export class PublicCacheInterceptor implements NestInterceptor {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param reflector - Lee la marca `@Public()` del manejador.
   */
  constructor(private readonly reflector: Reflector) {}

  /**
   * Envuelve la respuesta para agregarle validación y caché.
   *
   * @param context - Contexto de ejecución de Nest.
   * @param next - Continuación de la cadena.
   * @returns El cuerpo, o vacío si el cliente ya lo tenía.
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const esPublico = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();

    // Sólo las lecturas: un POST público —si lo hubiera— no se cachea nunca.
    if (!esPublico || req.method !== 'GET') return next.handle();

    // B.3 — un handler que ya declaró su propio `Cache-Control` (el verify
    // de receta usa `no-store`: invalidar tiene que verse de inmediato) sabe
    // más de su propia frescura que esta heurística genérica de "página
    // pública que cambia poco". Sin este freno, el `public, max-age=60,
    // stale-while-revalidate=300` de acá pisaría el `no-store` del handler y
    // una receta invalidada seguiría viéndose "ISSUED" hasta un minuto
    // después.
    if (this.declaraSuPropioCacheControl(context)) return next.handle();

    const res = http.getResponse<Response>();

    return next.handle().pipe(
      map((body: unknown) => {
        if (body === undefined || body === null) return body;

        const etag = `W/"${createHash('sha1')
          .update(JSON.stringify(body))
          .digest('base64url')}"`;

        res.setHeader('ETag', etag);
        res.setHeader(
          'Cache-Control',
          `public, max-age=${this.maxAgeFor(req.path)}, stale-while-revalidate=${STALE_WHILE_REVALIDATE}`,
        );

        // `If-None-Match` puede traer varios ETags separados por coma, y `*`.
        // Compararlo con `===` contra el encabezado entero fallaría en cuanto
        // el cliente mandara más de uno, que es lo que hace cualquier navegador
        // que ya vio dos versiones de la página.
        const pedido = req.headers['if-none-match'];
        if (pedido && this.coincide(pedido, etag)) {
          res.status(304);
          return undefined;
        }
        return body;
      }),
    );
  }

  /**
   * ¿El propio handler ya declaró un `Cache-Control` con `@Header(...)`?
   *
   * Lee `HEADERS_METADATA` en vez de mirar la respuesta ya armada: en el
   * momento en que corre este interceptor el método del controlador todavía
   * no se ejecutó (estamos antes de `next.handle()`), así que un
   * `res.setHeader` hecho a mano dentro del handler todavía no existe. La
   * metadata de `@Header()`, en cambio, ya está fija desde que Nest armó las
   * rutas.
   */
  private declaraSuPropioCacheControl(context: ExecutionContext): boolean {
    const headers = this.reflector.getAllAndOverride<DeclaredHeader[]>(
      HEADERS_METADATA,
      [context.getHandler(), context.getClass()],
    );
    return (headers ?? []).some(
      (header) => header.name.toLowerCase() === 'cache-control',
    );
  }

  /** ¿Alguno de los ETags que el cliente declara es el que vamos a servir? */
  private coincide(cabecera: string | string[], etag: string): boolean {
    const crudos = Array.isArray(cabecera) ? cabecera : [cabecera];
    return crudos
      .flatMap((valor) => valor.split(','))
      .map((valor) => valor.trim())
      .some((valor) => valor === '*' || valor === etag);
  }

  /** Las fichas se cachean más que las búsquedas: cambian menos. */
  private maxAgeFor(path: string): number {
    return /^\/(?:p|o|f|l|s)\//.test(path) ? PROFILE_MAX_AGE : SEARCH_MAX_AGE;
  }
}
