import { jest } from '@jest/globals';
import { HttpException } from '@nestjs/common';
import { AxiosError, type AxiosRequestConfig } from 'axios';
import { of, throwError } from 'rxjs';
import type { PinoLogger } from 'nestjs-pino';
import type { HttpService } from '@nestjs/axios';
import type { TokenService } from '../common';
import { CircuitOpenError } from '../common';
import { SystemApiClient } from './system-api-client.service';
import { runWithTickContext } from './tick-context';
import type { WorkerEnv } from './worker.env';

const ENV: WorkerEnv = {
  apiBaseUrl: 'http://api',
  httpTimeoutMs: 30_000,
  healthPort: 0,
  tickTimeoutMs: 300_000,
  stuckTickMs: 600_000,
  drainTimeoutMs: 20_000,
  shutdownTimeoutMs: 30_000,
  // Reintentos y backoff mínimos: la lógica del reintento ya está cubierta en
  // `retry.spec.ts`; aquí sólo interesa QUÉ verbos lo activan.
  httpRetryAttempts: 3,
  httpMaxConcurrent: 4,
  messagingQueueCodes: [],
  tsCompressionOlderThan: '7 days',
  tsRollupRefreshWindowHours: 2,
  tsRetentionPolicies: {},
  mockProviderBaseUrl: '',
  mockProviderApiKey: '',
  googleOAuthClientId: '',
  googleOAuthClientSecret: '',
  googleOAuthRefreshToken: '',
  googleSenderEmail: '',
};

/** Error de axios con status, como el que produce una respuesta de error real. */
function axiosFailure(status: number): AxiosError {
  const error = new AxiosError('fallo');
  error.response = {
    status,
    statusText: '',
    headers: {},
    config: {} as never,
    data: { message: 'boom' },
  };
  return error;
}

function build(overrides: Partial<WorkerEnv> = {}) {
  const calls: AxiosRequestConfig[] = [];
  // Las funciones simuladas se devuelven sueltas, además de dentro del objeto
  // tipado: aserciones como `expect(get)` sobre el tipo de la clase
  // desanclarían el método de su receptor.
  const get = jest.fn((_path: string, config: AxiosRequestConfig) => {
    calls.push(config);
    return of({ data: { ok: true } });
  });
  const post = jest.fn(
    (_path: string, _body: unknown, config: AxiosRequestConfig) => {
      calls.push(config);
      return of({ data: { ok: true } });
    },
  );
  const http = { get, post } as unknown as HttpService;

  const tokenService = {
    signAccessToken: jest.fn(() => 'token-firmado'),
  } as unknown as TokenService;

  const warn = jest.fn();
  const logger = {
    setContext: jest.fn(),
    info: jest.fn(),
    warn,
    error: jest.fn(),
  } as unknown as PinoLogger;

  const client = new SystemApiClient(http, tokenService, logger, {
    ...ENV,
    ...overrides,
  });

  return { client, get, post, calls, warn };
}

/** Ejecuta `fn` como si estuviera dentro de un tick, con su plazo y su señal. */
function inTick<T>(fn: () => Promise<T>, deadlineInMs = 60_000): Promise<T> {
  const controller = new AbortController();
  return runWithTickContext(
    {
      operation: 'worker.demo.tick',
      executionId: 'exec-1',
      signal: controller.signal,
      deadlineAt: Date.now() + deadlineInMs,
    },
    fn,
  );
}

describe('SystemApiClient · autenticación y correlación', () => {
  it('firma un token SYSTEM nuevo en cada llamada', async () => {
    const { client, calls } = build();

    await client.get('/internal/x');

    expect(calls[0].headers?.Authorization).toBe('Bearer token-firmado');
  });

  it('propaga el identificador de ejecución del tick como x-request-id', async () => {
    // Sin él, pino numera la petición por su cuenta en el servidor y las dos
    // mitades del mismo trabajo quedan sin hilo común en el agregador de logs.
    const { client, calls } = build();

    await inTick(() => client.get('/internal/x'));

    expect(calls[0].headers?.['x-request-id']).toBe('exec-1');
    expect(calls[0].headers?.['x-worker-operation']).toBe('worker.demo.tick');
  });

  it('fuera de un tick no inventa cabeceras de correlación', async () => {
    const { client, calls } = build();

    await client.get('/internal/x');

    expect(calls[0].headers?.['x-request-id']).toBeUndefined();
  });
});

describe('SystemApiClient · plazos', () => {
  it('usa el plazo configurado fuera de un tick', async () => {
    const { client, calls } = build();

    await client.get('/internal/x');

    expect(calls[0].timeout).toBe(30_000);
  });

  it('recorta el plazo al presupuesto que le queda al tick', async () => {
    // Sin el recorte, la última llamada de un tick a punto de vencer pediría
    // sus 30 s completos: el tick abortaría igual, pero dejando el socket
    // ocupado para nada.
    const { client, calls } = build();

    await inTick(() => client.get('/internal/x'), 2_000);

    expect(calls[0].timeout).toBeLessThanOrEqual(2_000);
    expect(calls[0].timeout).toBeGreaterThan(0);
  });

  it('pasa la señal del tick a axios, para que el aborto sea real', async () => {
    const { client, calls } = build();

    await inTick(() => client.get('/internal/x'));

    expect(calls[0].signal).toBeInstanceOf(AbortSignal);
  });
});

describe('SystemApiClient · reintentos', () => {
  it('reintenta un GET ante un fallo transitorio', async () => {
    const { client, get, post } = build();
    get
      .mockReturnValueOnce(throwError(() => axiosFailure(503)))
      .mockReturnValueOnce(of({ data: { ok: true } }));

    await expect(client.get('/internal/x')).resolves.toEqual({ ok: true });
    expect(get).toHaveBeenCalledTimes(2);
  });

  it('NO reintenta un GET ante un fallo permanente', async () => {
    const { client, get, post } = build();
    get.mockReturnValue(throwError(() => axiosFailure(404)));

    await expect(client.get('/internal/x')).rejects.toBeInstanceOf(
      HttpException,
    );
    expect(get).toHaveBeenCalledTimes(1);
  });

  it('NO reintenta un POST por defecto: un timeout no dice si se ejecutó', async () => {
    // Los endpoints `/internal/*` reclaman filas, publican eventos y despachan
    // mensajes. Reintentar a ciegas duplicaría envíos y cobros.
    const { client, get, post } = build();
    post.mockReturnValue(throwError(() => axiosFailure(503)));

    await expect(client.post('/internal/x')).rejects.toBeInstanceOf(
      HttpException,
    );
    expect(post).toHaveBeenCalledTimes(1);
  });

  it('reintenta un POST sólo cuando el llamador declara que es idempotente', async () => {
    const { client, get, post } = build();
    post
      .mockReturnValueOnce(throwError(() => axiosFailure(503)))
      .mockReturnValueOnce(of({ data: { ok: true } }));

    await expect(
      client.post('/internal/x', {}, { idempotent: true }),
    ).resolves.toEqual({ ok: true });
    expect(post).toHaveBeenCalledTimes(2);
  });
});

describe('SystemApiClient · cortacircuitos', () => {
  it('deja de llamar tras fallos repetidos y rechaza sin coste', async () => {
    const { client, get, post } = build({ httpRetryAttempts: 1 });
    post.mockReturnValue(throwError(() => axiosFailure(503)));

    for (let i = 0; i < 12; i += 1) {
      await client.post('/internal/x').catch(() => undefined);
    }

    expect(client.circuitSnapshot().state).toBe('open');

    const callsBefore = post.mock.calls.length;
    await client.post('/internal/x').catch(() => undefined);
    expect(post.mock.calls.length).toBe(callsBefore);
  });

  it('el rechazo del circuito conserva su código estable en vez de volverse un 500 opaco', async () => {
    const { client, get, post } = build({ httpRetryAttempts: 1 });
    post.mockReturnValue(throwError(() => axiosFailure(503)));

    for (let i = 0; i < 12; i += 1) {
      await client.post('/internal/x').catch(() => undefined);
    }

    await expect(client.post('/internal/x')).rejects.toBeInstanceOf(
      CircuitOpenError,
    );
  });

  it('un error de negocio no abre el circuito', async () => {
    // Un 404 o un 422 son respuestas correctas de una API sana: abrir por ellos
    // dejaría al worker sin llamar a algo que funciona.
    const { client, get, post } = build({ httpRetryAttempts: 1 });
    post.mockReturnValue(throwError(() => axiosFailure(422)));

    for (let i = 0; i < 12; i += 1) {
      await client.post('/internal/x').catch(() => undefined);
    }

    expect(client.circuitSnapshot().state).toBe('closed');
  });

  it('registra cada transición de estado del circuito', async () => {
    const { client, post, warn } = build({ httpRetryAttempts: 1 });
    post.mockReturnValue(throwError(() => axiosFailure(503)));

    for (let i = 0; i < 12; i += 1) {
      await client.post('/internal/x').catch(() => undefined);
    }

    expect(warn).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'open' }),
      expect.stringContaining('Cortacircuitos'),
    );
  });
});

describe('SystemApiClient · aplanado del error', () => {
  it('conserva el status y el cuerpo de la respuesta de error', async () => {
    const { client, get, post } = build();
    get.mockReturnValue(throwError(() => axiosFailure(409)));

    await expect(client.get('/internal/x')).rejects.toMatchObject({
      status: 409,
    });
  });

  it('marca si el fallo era transitorio: decide si el job puede reintentar', async () => {
    const { client, get, post } = build({ httpRetryAttempts: 1 });
    get.mockReturnValue(throwError(() => axiosFailure(503)));

    const error = await client.get('/internal/x').catch((e: unknown) => e);

    expect((error as HttpException).getResponse()).toMatchObject({
      transient: true,
    });
  });

  it('workerId identifica al proceso de forma estable', () => {
    const { client } = build();
    expect(client.workerId('outbox-relay')).toMatch(
      new RegExp(`^outbox-relay:${process.pid}:[0-9a-f]{8}$`),
    );
  });
});
