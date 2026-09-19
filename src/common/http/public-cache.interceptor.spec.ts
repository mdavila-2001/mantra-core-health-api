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
function build(opciones: {
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
  if (opciones.ifNoneMatch !== undefined)
    headers['if-none-match'] = opciones.ifNoneMatch;

  const res = {
    setHeader: mockFn(),
    status: mockFn(),
    cabeceras: {} as Record<string, string>,
  };
  res.setHeader = mockFn((nombre: string, valor: string) => {
    res.cabeceras[nombre] = valor;
  });

  const reflector = {
    getAllAndOverride: mockFn((clave: unknown) =>
      clave === HEADERS_METADATA ? (opciones.headers ?? []) : opciones.publico,
    ),
  };
  const path = opciones.path ?? '/public/search';
  const context = {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({
      getRequest: () => ({
        method: opciones.method ?? 'GET',
        path,
        originalUrl: opciones.originalUrl ?? path,
        headers,
      }),
      getResponse: () => res,
    }),
  };
  const handleFn = mockFn(() => of(opciones.body ?? { items: [], nextCursor: null }));
  const next = { handle: handleFn };

  const store = opciones.store ?? new PublicCacheStore();
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
    const primero = build({ publico: true, body: { items: [7] } });
    await primero.ejecutar();
    const etag = primero.res.cabeceras['ETag'];

    const segundo = build({
      publico: true,
      body: { items: [7] },
      ifNoneMatch: etag,
    });
    const cuerpo = await segundo.ejecutar();

    expect(segundo.res.status).toHaveBeenCalledWith(304);
    expect(cuerpo).toBeUndefined();
  });

  // La regresión que motiva `coincide()`: cualquier navegador que ya vio dos
  // versiones manda las dos separadas por coma, y comparar con `===` contra el
  // encabezado entero no encontraría ninguna.
  it('reconoce su ETag entre varios separados por coma', async () => {
    const primero = build({ publico: true, body: { items: [7] } });
    await primero.ejecutar();
    const etag = primero.res.cabeceras['ETag'];

    const segundo = build({
      publico: true,
      body: { items: [7] },
      ifNoneMatch: `W/"otro-viejo", ${etag}, W/"otro-mas"`,
    });
    await segundo.ejecutar();

    expect(segundo.res.status).toHaveBeenCalledWith(304);
  });

  it('un ETag que no coincide sirve el cuerpo entero', async () => {
    const d = build({
      publico: true,
      body: { items: [7] },
      ifNoneMatch: 'W/"de-otra-version"',
    });

    const cuerpo = await d.ejecutar();

    expect(d.res.status).not.toHaveBeenCalled();
    expect(cuerpo).toEqual({ items: [7] });
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
      const primero = build({ publico: true, body: { items: [7] }, store });
      await primero.ejecutar();
      expect(primero.llamadasAlHandler()).toBe(1);
      const etag = primero.res.cabeceras['ETag'];

      const segundo = build({
        publico: true,
        body: { items: [7] },
        ifNoneMatch: etag,
        store,
      });
      const cuerpo = await segundo.ejecutar();

      expect(segundo.llamadasAlHandler()).toBe(0);
      expect(segundo.res.status).toHaveBeenCalledWith(304);
      expect(cuerpo).toBeUndefined();
      // Las cabeceras se repiten desde la caché, no se pierden por saltar el handler.
      expect(segundo.res.cabeceras['ETag']).toBe(etag);
      expect(segundo.res.cabeceras['Cache-Control']).toContain('public');
    });

    it('una relectura sin If-None-Match también evita next.handle(): sirve el cuerpo cacheado', async () => {
      const store = new PublicCacheStore();
      const primero = build({ publico: true, body: { items: [9] }, store });
      await primero.ejecutar();

      const segundo = build({ publico: true, body: { items: [9] }, store });
      const cuerpo = await segundo.ejecutar();

      expect(segundo.llamadasAlHandler()).toBe(0);
      expect(segundo.res.status).not.toHaveBeenCalled();
      expect(cuerpo).toEqual({ items: [9] });
    });

    it('una escritura limpia el caché: la siguiente lectura vuelve a llamar al handler', async () => {
      const store = new PublicCacheStore();
      const primero = build({ publico: true, body: { items: [1] }, store });
      await primero.ejecutar();

      // Una escritura, aunque no sea `@Public()`: publicar un post es lo que
      // vuelve obsoleto el feed que se acaba de cachear.
      const escritura = build({
        publico: false,
        method: 'POST',
        store,
      });
      await escritura.ejecutar();
      expect(store.size).toBe(0);

      const tercero = build({ publico: true, body: { items: [1, 2] }, store });
      const cuerpo = await tercero.ejecutar();

      expect(tercero.llamadasAlHandler()).toBe(1);
      expect(cuerpo).toEqual({ items: [1, 2] });
    });

    it('claves distintas (rutas o query distintas) no se pisan entre sí', async () => {
      const store = new PublicCacheStore();
      const busqueda = build({
        publico: true,
        path: '/public/search',
        originalUrl: '/public/search?q=a',
        body: { items: ['a'] },
        store,
      });
      await busqueda.ejecutar();

      const otraBusqueda = build({
        publico: true,
        path: '/public/search',
        originalUrl: '/public/search?q=b',
        body: { items: ['b'] },
        store,
      });
      const cuerpo = await otraBusqueda.ejecutar();

      // Es una clave nueva: no hay entrada cacheada todavía, así que sí llama
      // al handler y no arrastra el resultado de la otra búsqueda.
      expect(otraBusqueda.llamadasAlHandler()).toBe(1);
      expect(cuerpo).toEqual({ items: ['b'] });
    });

    it('un handler con Cache-Control propio nunca se cachea (respeta no-store)', async () => {
      const store = new PublicCacheStore();
      const primero = build({
        publico: true,
        headers: [{ name: 'Cache-Control', value: 'no-store' }],
        store,
      });
      await primero.ejecutar();
      expect(store.size).toBe(0);

      const segundo = build({
        publico: true,
        headers: [{ name: 'Cache-Control', value: 'no-store' }],
        store,
      });
      await segundo.ejecutar();

      // Sin caché de por medio, cada pedido vuelve a llamar al handler.
      expect(segundo.llamadasAlHandler()).toBe(1);
    });
  });
});
