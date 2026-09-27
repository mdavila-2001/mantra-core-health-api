import { jest } from '@jest/globals';

// Loose-typed mock factory: runtime 'jest' pero sin los tipos estrictos Mock<never>.
/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { firstValueFrom, defer, Subject, type Observable } from 'rxjs';
import { DomainException } from '../errors/domain.exception';
import { ErrorCode } from '../errors/error-codes';
import {
  canonicalJson,
  IDEMPOTENT_REPLAYED_HEADER,
  IdempotencyInterceptor,
} from './idempotency.interceptor';
import { IdempotencyStore } from './idempotency.store';

/** Opciones de un pedido simulado. */
interface Pedido {
  /** Cabecera `Idempotency-Key`; ausente si no se pasa. */
  clave?: string;
  /** Cuerpo del pedido. */
  body?: unknown;
  /** Usuario autenticado. */
  userId?: string;
  /** Tenant resuelto por el guard. */
  tenantId?: string;
  /** Ruta pedida. */
  url?: string;
  /** Si el manejador lleva `@Idempotent()`. */
  marcado?: boolean;
  /** Status que Nest ya fijó en la respuesta antes del interceptor. */
  status?: number;
}

/**
 * Arma un banco de pruebas con un store en memoria compartido entre pedidos y
 * un manejador que cuenta cuántas veces se ejecutó de verdad.
 *
 * @returns El ejecutor de pedidos y el contador del manejador.
 */
function banco(store = new IdempotencyStore()) {
  let ejecuciones = 0;
  const reflector = { getAllAndOverride: mockFn() };
  const interceptor = new IdempotencyInterceptor(reflector as any, store);

  /**
   * Ejecuta un pedido contra el interceptor.
   *
   * @returns Cuerpo devuelto, status y cabeceras de la respuesta.
   */
  const pedir = async (
    p: Pedido,
    handler?: () => Observable<unknown>,
  ): Promise<{
    body: unknown;
    status: number;
    cabeceras: Record<string, string>;
  }> => {
    reflector.getAllAndOverride.mockReturnValue(p.marcado ?? true);
    const headers: Record<string, string> = {};
    if (p.clave !== undefined) headers['idempotency-key'] = p.clave;
    const req = {
      method: 'POST',
      originalUrl: p.url ?? '/scheduling/appointments/walk-in',
      url: p.url ?? '/scheduling/appointments/walk-in',
      headers,
      query: {},
      body: p.body ?? { patient: 'Ana', slot: 'A1' },
      user: { id: p.userId ?? 'user-1', roles: [] },
      resolvedTenantId: p.tenantId ?? 'tenant-1',
    };
    const cabeceras: Record<string, string> = {};
    // Nest fija el status del `@HttpCode` antes de los interceptores.
    const res = {
      statusCode: p.status ?? 201,
      setHeader: (n: string, v: string) => {
        cabeceras[n] = v;
      },
      status(code: number) {
        this.statusCode = code;
        return this;
      },
    };
    const context = {
      getType: () => 'http',
      getHandler: () => undefined,
      getClass: () => undefined,
      switchToHttp: () => ({ getRequest: () => req, getResponse: () => res }),
    };
    const next = {
      handle:
        handler ??
        (() =>
          defer(() => {
            ejecuciones += 1;
            return Promise.resolve({ id: `cita-${ejecuciones}` });
          })),
    };
    const body = await firstValueFrom(
      interceptor.intercept(context as any, next as any),
    );
    return { body, status: res.statusCode, cabeceras };
  };

  return { pedir, ejecuciones: () => ejecuciones };
}

/** Captura la excepción de dominio de una promesa que debe fallar. */
async function fallo(promesa: Promise<unknown>): Promise<DomainException> {
  try {
    await promesa;
  } catch (err) {
    if (err instanceof DomainException) return err;
    throw err;
  }
  throw new Error('se esperaba un error y la petición salió bien');
}

describe('IdempotencyInterceptor', () => {
  // Nivel correcto: el caso que justifica todo esto —el doble clic o el
  // reintento tras un timeout— no crea una segunda cita.
  it('misma clave y mismo cuerpo: devuelve la misma respuesta sin re-ejecutar', async () => {
    const { pedir, ejecuciones } = banco();

    const primera = await pedir({ clave: 'k-1' });
    const segunda = await pedir({ clave: 'k-1' });

    expect(ejecuciones()).toBe(1);
    expect(segunda.body).toEqual(primera.body);
    expect(segunda.status).toBe(201);
    expect(segunda.cabeceras[IDEMPOTENT_REPLAYED_HEADER]).toBe('true');
    expect(primera.cabeceras[IDEMPOTENT_REPLAYED_HEADER]).toBeUndefined();
  });

  it('el orden de las claves del cuerpo no cambia la huella', async () => {
    const { pedir, ejecuciones } = banco();

    await pedir({ clave: 'k-1', body: { a: 1, b: { c: 2, d: 3 } } });
    await pedir({ clave: 'k-1', body: { b: { d: 3, c: 2 }, a: 1 } });

    expect(ejecuciones()).toBe(1);
  });

  it('la repetición lleva el status guardado, no el que traiga el pedido nuevo', async () => {
    const { pedir } = banco();
    await pedir({ clave: 'k-1', status: 202 });

    const repetida = await pedir({ clave: 'k-1', status: 201 });

    expect(repetida.status).toBe(202);
  });

  // Nivel inválido: la clave reciclada con otros datos es un error del
  // cliente, con código estable, y no ejecuta nada.
  it('misma clave con otro cuerpo: 422 IDEMPOTENCY_KEY_REUSED', async () => {
    const { pedir, ejecuciones } = banco();
    await pedir({ clave: 'k-1', body: { patient: 'Ana' } });

    const err = await fallo(pedir({ clave: 'k-1', body: { patient: 'Luis' } }));

    expect(err.getStatus()).toBe(422);
    expect(err.code).toBe(ErrorCode.IDEMPOTENCY_KEY_REUSED);
    expect(ejecuciones()).toBe(1);
  });

  it('clave con formato inválido: 400 VALIDATION_FAILED', async () => {
    const { pedir, ejecuciones } = banco();

    const err = await fallo(pedir({ clave: 'con espacios' }));

    expect(err.getStatus()).toBe(400);
    expect(err.code).toBe(ErrorCode.VALIDATION_FAILED);
    expect(ejecuciones()).toBe(0);

    const largo = await fallo(pedir({ clave: 'x'.repeat(256) }));
    expect(largo.getStatus()).toBe(400);
  });

  // Nivel límite: sin cabecera (o sin `@Idempotent()`), el comportamiento de
  // siempre —cada pedido ejecuta—.
  it('sin cabecera: pasa directo y cada pedido ejecuta', async () => {
    const { pedir, ejecuciones } = banco();

    await pedir({});
    await pedir({});

    expect(ejecuciones()).toBe(2);
  });

  it('manejador sin @Idempotent(): ignora la cabecera', async () => {
    const { pedir, ejecuciones } = banco();

    await pedir({ clave: 'k-1', marcado: false });
    await pedir({ clave: 'k-1', marcado: false });

    expect(ejecuciones()).toBe(2);
  });

  it('la misma clave de otro usuario, tenant o ruta es otra operación', async () => {
    const { pedir, ejecuciones } = banco();

    await pedir({ clave: 'k-1' });
    await pedir({ clave: 'k-1', userId: 'user-2' });
    await pedir({ clave: 'k-1', tenantId: 'tenant-2' });
    await pedir({ clave: 'k-1', url: '/insurance-claims/c-1/adjudications' });

    expect(ejecuciones()).toBe(4);
  });

  it('en curso con la misma clave: 409 reintentable con Retry-After', async () => {
    const { pedir } = banco();
    const pendiente = new Subject<unknown>();

    const primera = pedir({ clave: 'k-1' }, () => pendiente.asObservable());
    // Deja que la primera tome la reserva antes de lanzar la segunda.
    await new Promise((r) => setImmediate(r));

    const err = await fallo(pedir({ clave: 'k-1' }));
    expect(err.getStatus()).toBe(409);
    expect(err.code).toBe(ErrorCode.IDEMPOTENCY_REQUEST_IN_PROGRESS);

    pendiente.next({ id: 'cita-lenta' });
    pendiente.complete();
    await expect(primera).resolves.toMatchObject({
      body: { id: 'cita-lenta' },
    });

    // Terminada la primera, el reintento con la misma clave ya recibe su respuesta.
    const reintento = await pedir({ clave: 'k-1' });
    expect(reintento.body).toEqual({ id: 'cita-lenta' });
  });

  it('si la operación falla, suelta la clave y el reintento ejecuta', async () => {
    const { pedir, ejecuciones } = banco();
    let primera = true;
    const handler = () =>
      defer(() => {
        if (primera) {
          primera = false;
          return Promise.reject(new Error('dependencia caída'));
        }
        return Promise.resolve({ id: 'cita-2' });
      });

    await expect(pedir({ clave: 'k-1' }, handler)).rejects.toThrow(
      'dependencia caída',
    );
    const reintento = await pedir({ clave: 'k-1' }, handler);

    expect(reintento.body).toEqual({ id: 'cita-2' });
    expect(ejecuciones()).toBe(0);
  });
});

describe('IdempotencyStore sobre Redis', () => {
  /** Redis falso con SET NX / GET / DEL sobre un mapa. */
  function redisFalso() {
    const datos = new Map<string, string>();
    return {
      datos,
      set: mockFn((k: string, v: string, ..._resto: unknown[]) => {
        if (_resto.includes('NX') && datos.has(k)) return Promise.resolve(null);
        datos.set(k, v);
        return Promise.resolve('OK');
      }),
      get: mockFn((k: string) => Promise.resolve(datos.get(k) ?? null)),
      del: mockFn((k: string) => Promise.resolve(datos.delete(k) ? 1 : 0)),
    };
  }

  it('la reserva usa SET NX con vencimiento y la segunda ve la primera', async () => {
    const redis = redisFalso();
    const store = new IdempotencyStore(redis as any);

    const a = await store.acquire('x', 'h1', 1000);
    const b = await store.acquire('x', 'h1', 1000);

    expect(a).toEqual({ acquired: true });
    expect(b).toEqual({
      acquired: false,
      existing: { state: 'IN_PROGRESS', fingerprint: 'h1' },
    });
    expect(redis.set).toHaveBeenCalledWith(
      'idem:x',
      expect.any(String),
      'PX',
      1000,
      'NX',
    );
  });

  it('si Redis falla, se degrada a memoria en vez de rechazar', async () => {
    const roto = {
      set: mockFn(() => Promise.reject(new Error('ECONNREFUSED'))),
      get: mockFn(() => Promise.reject(new Error('ECONNREFUSED'))),
      del: mockFn(() => Promise.reject(new Error('ECONNREFUSED'))),
    };
    const store = new IdempotencyStore(roto as any);

    await expect(store.acquire('x', 'h1', 1000)).resolves.toEqual({
      acquired: true,
    });
    await expect(store.acquire('x', 'h1', 1000)).resolves.toMatchObject({
      acquired: false,
    });
  });
});

describe('canonicalJson', () => {
  it('ordena claves anidadas y respeta el orden de los arreglos', () => {
    expect(canonicalJson({ b: 1, a: [{ d: 1, c: 2 }] })).toBe(
      '{"a":[{"c":2,"d":1}],"b":1}',
    );
  });
});
