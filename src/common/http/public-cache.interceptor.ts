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
import { map, of, tap, type Observable } from 'rxjs';
import { IS_PUBLIC_KEY } from '../auth/public.decorator';
import { PublicCacheStore } from './public-cache.store';

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
 *
 * ## MCH-028 — la revalidación ya no ejecuta el handler
 *
 * Hasta acá el `ETag` se calculaba **después** de `next.handle()`: un 304
 * ahorraba los bytes de la respuesta, pero la consulta cara —la que arma la
 * página— ya había corrido igual, que es justo lo que el párrafo anterior
 * promete evitar. Ahora `PublicCacheStore` guarda la representación (`ETag` +
 * cuerpo + `Cache-Control`) la primera vez que se calcula, con la misma
 * vigencia que el `max-age` ya anunciado. Mientras esa entrada siga vigente,
 * ni una relectura con `If-None-Match` que coincide ni una sin cabecera
 * llegan a `next.handle()`: la primera contesta 304, la segunda sirve el
 * cuerpo cacheado. Ninguna de las dos es más vieja que lo que el propio
 * `Cache-Control` ya le prometió al cliente.
 */
@Injectable()
export class PublicCacheInterceptor implements NestInterceptor {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param reflector - Lee la marca `@Public()` del manejador.
   * @param store - Caché de representaciones ya calculadas (MCH-028).
   */
  constructor(
    private readonly reflector: Reflector,
    private readonly store: PublicCacheStore,
  ) {}

  /**
   * Envuelve la respuesta para agregarle validación y caché.
   *
   * @param context - Contexto de ejecución de Nest.
   * @param next - Continuación de la cadena.
   * @returns El cuerpo, o vacío si el cliente ya lo tenía.
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();

    // Cualquier escritura puede volver obsoleta una representación pública ya
    // cacheada (ver la nota de `PublicCacheStore.clear` sobre por qué es todo
    // o nada). No se filtra por `@Public()` acá: una escritura autenticada
    // —publicar un post, por ejemplo— es exactamente la que tiene que tirar
    // abajo el feed público que la muestra.
    if (req.method !== 'GET') {
      return next.handle().pipe(tap(() => this.store.clear()));
    }

    const esPublico = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!esPublico) return next.handle();

    // B.3 — un handler que ya declaró su propio `Cache-Control` (el verify
    // de receta usa `no-store`: invalidar tiene que verse de inmediato) sabe
    // más de su propia frescura que esta heurística genérica de "página
    // pública que cambia poco". Sin este freno, el `public, max-age=60,
    // stale-while-revalidate=300` de acá pisaría el `no-store` del handler y
    // una receta invalidada seguiría viéndose "ISSUED" hasta un minuto
    // después. Estas respuestas tampoco se cachean en `PublicCacheStore`.
    if (this.declaraSuPropioCacheControl(context)) return next.handle();

    const res = http.getResponse<Response>();
    const clave = req.originalUrl ?? req.url;

    // MCH-028 — si ya hay una representación vigente, ni siquiera se llama a
    // `next.handle()`: eso es todo el controlador, el servicio y la consulta
    // que arma el cuerpo. Una relectura con el `ETag` correcto contesta 304 y
    // una sin cabecera (o con una vieja) recibe el mismo cuerpo que ya se le
    // sirvió al primer cliente, dentro de la misma ventana que el propio
    // `Cache-Control` ya prometía.
    const cacheado = this.store.get(clave);
    if (cacheado) {
      res.setHeader('ETag', cacheado.etag);
      res.setHeader('Cache-Control', cacheado.cacheControl);

      const pedido = req.headers['if-none-match'];
      if (pedido && this.coincide(pedido, cacheado.etag)) {
        res.status(304);
        return of(undefined);
      }
      return of(cacheado.body);
    }

    return next.handle().pipe(
      map((body: unknown) => {
        if (body === undefined || body === null) return body;

        const etag = `W/"${createHash('sha1')
          .update(JSON.stringify(body))
          .digest('base64url')}"`;
        const maxAge = this.maxAgeFor(req.path);
        const cacheControl = `public, max-age=${maxAge}, stale-while-revalidate=${STALE_WHILE_REVALIDATE}`;

        res.setHeader('ETag', etag);
        res.setHeader('Cache-Control', cacheControl);
        this.store.set(clave, { etag, body, cacheControl }, maxAge * 1000);

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
