import { jest } from '@jest/globals';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { PinoLogger } from 'nestjs-pino';
import {
  handleHealthRequest,
  startWorkerHealthServer,
} from './worker-health.server';
import { workerHealth } from './worker-health.registry';

function call(path: string, method = 'GET') {
  const written: { status?: number; body?: unknown } = {};
  const response = {
    writeHead: jest.fn((status: number) => {
      written.status = status;
    }),
    end: jest.fn((body?: string) => {
      written.body = body === undefined ? undefined : JSON.parse(body);
    }),
  } as unknown as ServerResponse<IncomingMessage>;

  handleHealthRequest({ url: path, method } as IncomingMessage, response);
  return written;
}

describe('sonda HTTP del worker', () => {
  beforeEach(() => {
    workerHealth.reset();
    workerHealth.configure('messaging', 10_000);
  });

  afterEach(() => {
    workerHealth.reset();
  });

  it('/health responde 200 cuando ningún tick está atascado', () => {
    workerHealth.setStatus('running');
    expect(call('/health')).toMatchObject({
      status: 200,
      body: { status: 'ok' },
    });
  });

  it('/liveness es un alias de /health', () => {
    workerHealth.setStatus('running');
    expect(call('/liveness').status).toBe(200);
  });

  it('/health responde 503 y dice QUÉ tick está atascado', async () => {
    // Es lo que convierte "el PID existe" en "el worker está haciendo su
    // trabajo" para el orquestador.
    workerHealth.setStatus('running');
    void workerHealth.mutex.runExclusive(
      'worker.messaging.outbox-relay',
      () => new Promise<void>(() => undefined),
    );
    // Umbral de 1 ms y una espera real: el atasco se define por tiempo
    // transcurrido, y sin dejar pasar tiempo no hay nada que detectar.
    workerHealth.configure('messaging', 1);
    await new Promise((resolve) => setTimeout(resolve, 5));

    const result = call('/health');

    expect(result.status).toBe(503);
    expect(JSON.stringify(result.body)).toContain(
      'worker.messaging.outbox-relay',
    );
  });

  it('/readiness responde 503 mientras el worker no ha arrancado', () => {
    expect(call('/readiness').status).toBe(503);
    workerHealth.setStatus('running');
    expect(call('/readiness').status).toBe(200);
  });

  it('/status devuelve el diagnóstico completo y siempre con 200', () => {
    workerHealth.setStatus('running');
    const result = call('/status');

    expect(result.status).toBe(200);
    expect(result.body).toMatchObject({
      worker: 'messaging',
      pid: process.pid,
    });
  });

  it('rechaza métodos distintos de GET', () => {
    expect(call('/health', 'POST').status).toBe(405);
  });

  it('una ruta desconocida es 404, no una respuesta inventada', () => {
    expect(call('/admin').status).toBe(404);
  });

  it('la ignora la cadena de consulta', () => {
    workerHealth.setStatus('running');
    expect(call('/health?verbose=1').status).toBe(200);
  });
});

describe('startWorkerHealthServer', () => {
  const info = jest.fn();
  const logger = {
    setContext: jest.fn(),
    info,
    warn: jest.fn(),
  } as unknown as PinoLogger;

  it('puerto 0 la deshabilita, y lo deja dicho en el log', () => {
    const server = startWorkerHealthServer({ port: 0, logger });

    expect(server).toBeUndefined();
    expect(info).toHaveBeenCalledWith(expect.stringContaining('deshabilitada'));
  });
});
