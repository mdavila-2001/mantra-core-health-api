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
  /** Cabecera `If-None-Match`, si el cliente manda una. */
  ifNoneMatch?: string | string[];
  /** Cuerpo que devuelve el manejador. */
  body?: unknown;
  /** `@Header(...)` que el propio manejador ya declaró (B.3). */
  headers?: readonly { name: string; value: string }[];
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
  const context = {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({
      getRequest: () => ({
        method: opciones.method ?? 'GET',
        path: opciones.path ?? '/public/search',
        headers,
      }),
      getResponse: () => res,
    }),
  };
  const next = {
    handle: () => of(opciones.body ?? { items: [], nextCursor: null }),
  };

  const interceptor = new PublicCacheInterceptor(reflector as any);
  return {
    res,
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
});
