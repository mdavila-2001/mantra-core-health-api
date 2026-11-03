import { jest } from '@jest/globals';

// Loose-typed mock factory: runtime 'jest' pero sin los tipos estrictos Mock<never>.
/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { firstValueFrom, of } from 'rxjs';
import { HEADERS_METADATA } from '@nestjs/common/constants';
import { PublicCacheInterceptor } from './public-cache.interceptor';
import { PublicCacheStore } from './public-cache.store';

/**
 * Arma el interceptor con una petición y una respuesta controladas.
 *
 * @returns El interceptor, la respuesta falsa y el ejecutor del caso.
 */
function build(options: {
  /** Si el manejador está marcado `@Public()`. */
  publico: boolean;
  /** Método HTTP de la petición. */
  method?: string;
  /** Ruta pedida. */
  path?: string;
  /** Query string incluida en la clave de caché; por defecto ninguna. */
  originalUrl?: string;
  /** Cabecera `If-None-Match`, si el cliente manda una. */
  ifNoneMatch?: string | string[];
  /** Cuerpo que devuelve el manejador. */
  body?: unknown;
  /** `@Header(...)` que el propio manejador ya declaró (B.3). */
  headers?: readonly { name: string; value: string }[];
  /** Store compartido entre pedidos, para probar caché/invalidación (MCH-028). */
  store?: PublicCacheStore;
}) {
  const headers: Record<string, unknown> = {};
  if (options.ifNoneMatch !== undefined)
    headers['if-none-match'] = options.ifNoneMatch;

  const res = {
    setHeader: mockFn(),
    status: mockFn(),
    cabeceras: {} as Record<string, string>,
  };
  res.setHeader = mockFn((name: string, value: string) => {
    res.cabeceras[name] = value;
  });

  const reflector = {
    getAllAndOverride: mockFn((key: unknown) =>
      key === HEADERS_METADATA ? (options.headers ?? []) : options.publico,
    ),
  };
  const path = options.path ?? '/public/search';
  const context = {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({
      getRequest: () => ({
        method: options.method ?? 'GET',
        path,
        originalUrl: options.originalUrl ?? path,
        headers,
      }),
      getResponse: () => res,
    }),
  };
  const handleFn = mockFn(() =>
    of(options.body ?? { items: [], nextCursor: null }),
  );
  const next = { handle: handleFn };

  const store = options.store ?? new PublicCacheStore();
  const interceptor = new PublicCacheInterceptor(reflector as any, store);
  return {
    res,
    store,
    /** Cuántas veces se llegó a invocar `next.handle()` — la cadena entera. */
    llamadasAlHandler: () => handleFn.mock.calls.length,
    ejecutar: () =>
      firstValueFrom(interceptor.intercept(context as any, next as any)),
  };
}

describe('PublicCacheInterceptor', () => {
  it('pone ETag y Cache-Control en una lectura pública', async () => {
    const d = build({ publico: true });

    await d.ejecutar();

    expect(d.res.cabeceras['ETag']).toMatch(/^W\/"/);
    expect(d.res.cabeceras['Cache-Control']).toContain('public');
    expect(d.res.cabeceras['Cache-Control']).toContain('max-age=60');
  });

  // Lo importante no es la velocidad sino que un proxy no pueda servirle a
  // alguien la página de otro.
  it('no toca una respuesta con sesión', async () => {
    const d = build({ publico: false });

    await d.ejecutar();

    expect(d.res.cabeceras['Cache-Control']).toBeUndefined();
    expect(d.res.cabeceras['ETag']).toBeUndefined();
  });

  it('la ficha pública se cachea más que la búsqueda', async () => {
    const d = build({ publico: true, path: '/p/dra-quispe' });

    await d.ejecutar();

    expect(d.res.cabeceras['Cache-Control']).toContain('max-age=300');
  });

  it('el mismo cuerpo da el mismo ETag', async () => {
    const a = build({ publico: true, body: { items: [1, 2] } });
    const b = build({ publico: true, body: { items: [1, 2] } });

    await a.ejecutar();
    await b.ejecutar();

    expect(a.res.cabeceras['ETag']).toBe(b.res.cabeceras['ETag']);
  });

  it('un cuerpo distinto da un ETag distinto', async () => {
    const a = build({ publico: true, body: { items: [1] } });
    const b = build({ publico: true, body: { items: [2] } });

    await a.ejecutar();
    await b.ejecutar();

    expect(a.res.cabeceras['ETag']).not.toBe(b.res.cabeceras['ETag']);
  });

  it('devuelve 304 cuando el cliente ya tiene esa versión', async () => {
    const first = build({ publico: true, body: { items: [7] } });
    await first.ejecutar();
    const etag = first.res.cabeceras['ETag'];

    const second = build({
      publico: true,
      body: { items: [7] },
      ifNoneMatch: etag,
    });
    const body = await second.ejecutar();

    expect(second.res.status).toHaveBeenCalledWith(304);
    expect(body).toBeUndefined();
  });

  // La regresión que motiva `coincide()`: cualquier navegador que ya vio dos
  // versiones manda las dos separadas por coma, y comparar con `===` contra el
  // encabezado entero no encontraría ninguna.
  it('reconoce su ETag entre varios separados por coma', async () => {
    const first = build({ publico: true, body: { items: [7] } });
    await first.ejecutar();
    const etag = first.res.cabeceras['ETag'];

    const second = build({
      publico: true,
      body: { items: [7] },
      ifNoneMatch: `W/"otro-viejo", ${etag}, W/"otro-mas"`,
    });
    await second.ejecutar();

    expect(second.res.status).toHaveBeenCalledWith(304);
  });

  it('un ETag que no coincide sirve el cuerpo entero', async () => {
    const d = build({
      publico: true,
      body: { items: [7] },
      ifNoneMatch: 'W/"de-otra-version"',
    });

    const body = await d.ejecutar();

    expect(d.res.status).not.toHaveBeenCalled();
    expect(body).toEqual({ items: [7] });
  });

  it('un POST público no se cachea', async () => {
    const d = build({ publico: true, method: 'POST' });

    await d.ejecutar();

    expect(d.res.cabeceras['Cache-Control']).toBeUndefined();
  });

  // B.3: el verify de receta declara su propio `no-store` porque invalidar
  // tiene que verse de inmediato. Sin este freno, el `public, max-age=60`
  // genérico lo pisaría y una receta recién anulada seguiría viéndose
  // "ISSUED" hasta un minuto después.
  it('respeta el Cache-Control que el handler ya declaró con @Header', async () => {
    const d = build({
      publico: true,
      headers: [{ name: 'Cache-Control', value: 'no-store' }],
    });

    await d.ejecutar();

    expect(d.res.cabeceras['Cache-Control']).toBeUndefined();
    expect(d.res.cabeceras['ETag']).toBeUndefined();
  });

  it('un Cache-Control declarado con otra capitalización también cuenta', async () => {
    const d = build({
      publico: true,
      headers: [{ name: 'cache-control', value: 'no-store' }],
    });

    await d.ejecutar();

    expect(d.res.cabeceras['Cache-Control']).toBeUndefined();
  });

  // MCH-028: hasta acá el ETag se calculaba después de next.handle(), así que
  // un 304 ahorraba bytes pero no la consulta. Estos casos prueban por conteo
  // de llamadas —no por inspección de cabeceras— que la revalidación ya ni
  // siquiera llega al handler.
  describe('MCH-028 · revalidación antes del handler', () => {
    it('una relectura con el mismo ETag no vuelve a llamar a next.handle()', async () => {
      const store = new PublicCacheStore();
      const first = build({ publico: true, body: { items: [7] }, store });
      await first.ejecutar();
      expect(first.llamadasAlHandler()).toBe(1);
      const etag = first.res.cabeceras['ETag'];

      const second = build({
        publico: true,
        body: { items: [7] },
        ifNoneMatch: etag,
        store,
      });
      const body = await second.ejecutar();

      expect(second.llamadasAlHandler()).toBe(0);
      expect(second.res.status).toHaveBeenCalledWith(304);
      expect(body).toBeUndefined();
      // Las cabeceras se repiten desde la caché, no se pierden por saltar el handler.
      expect(second.res.cabeceras['ETag']).toBe(etag);
      expect(second.res.cabeceras['Cache-Control']).toContain('public');
    });

    it('una relectura sin If-None-Match también evita next.handle(): sirve el cuerpo cacheado', async () => {
      const store = new PublicCacheStore();
      const first = build({ publico: true, body: { items: [9] }, store });
      await first.ejecutar();

      const second = build({ publico: true, body: { items: [9] }, store });
      const body = await second.ejecutar();

      expect(second.llamadasAlHandler()).toBe(0);
      expect(second.res.status).not.toHaveBeenCalled();
      expect(body).toEqual({ items: [9] });
    });

    it('una escritura limpia el caché: la siguiente lectura vuelve a llamar al handler', async () => {
      const store = new PublicCacheStore();
      const first = build({ publico: true, body: { items: [1] }, store });
      await first.ejecutar();

      // Una escritura, aunque no sea `@Public()`: publicar un post es lo que
      // vuelve obsoleto el feed que se acaba de cachear.
      const write = build({
        publico: false,
        method: 'POST',
        store,
      });
      await write.ejecutar();
      expect(store.size).toBe(0);

      const third = build({ publico: true, body: { items: [1, 2] }, store });
      const body = await third.ejecutar();

      expect(third.llamadasAlHandler()).toBe(1);
      expect(body).toEqual({ items: [1, 2] });
    });

    it('claves distintas (rutas o query distintas) no se pisan entre sí', async () => {
      const store = new PublicCacheStore();
      const search = build({
        publico: true,
        path: '/public/search',
        originalUrl: '/public/search?q=a',
        body: { items: ['a'] },
        store,
      });
      await search.ejecutar();

      const otherSearch = build({
        publico: true,
        path: '/public/search',
        originalUrl: '/public/search?q=b',
        body: { items: ['b'] },
        store,
      });
      const body = await otherSearch.ejecutar();

      // Es una clave nueva: no hay entrada cacheada todavía, así que sí llama
      // al handler y no arrastra el resultado de la otra búsqueda.
      expect(otherSearch.llamadasAlHandler()).toBe(1);
      expect(body).toEqual({ items: ['b'] });
    });

    it('un handler con Cache-Control propio nunca se cachea (respeta no-store)', async () => {
      const store = new PublicCacheStore();
      const first = build({
        publico: true,
        headers: [{ name: 'Cache-Control', value: 'no-store' }],
        store,
      });
      await first.ejecutar();
      expect(store.size).toBe(0);

      const second = build({
        publico: true,
        headers: [{ name: 'Cache-Control', value: 'no-store' }],
        store,
      });
      await second.ejecutar();

      // Sin caché de por medio, cada pedido vuelve a llamar al handler.
      expect(second.llamadasAlHandler()).toBe(1);
    });
  });
});
