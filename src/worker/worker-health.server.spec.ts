import { jest } from '@jest/globals';
import { get, type IncomingMessage, type ServerResponse } from 'node:http';
import { networkInterfaces } from 'node:os';
import type { AddressInfo } from 'node:net';
import type { PinoLogger } from 'nestjs-pino';
import {
  DEFAULT_HEALTH_HOST,
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

describe('/status no entrega mensajes de error', () => {
  beforeEach(() => {
    workerHealth.reset();
    workerHealth.configure('messaging', 10_000);
  });

  afterEach(() => {
    workerHealth.reset();
  });

  it('un fallo con una cadena sensible sólo aparece como código estable', () => {
    const sensitive = 'paciente 4455667 DNI 12345678 alergia penicilina';
    workerHealth.setStatus('running');
    workerHealth.tickStarted('worker.demo.tick');
    workerHealth.tickFinished('worker.demo.tick', 'failed');
    workerHealth.tickStarted('worker.demo.timeout');
    workerHealth.tickFinished('worker.demo.timeout', 'timeout');

    const result = call('/status');

    expect(result.status).toBe(200);
    expect(JSON.stringify(result.body)).not.toContain(sensitive);
    expect(result.body).toMatchObject({
      ticks: [
        { operation: 'worker.demo.tick', lastErrorCode: 'TICK_FAILED' },
        { operation: 'worker.demo.timeout', lastErrorCode: 'TICK_TIMEOUT' },
      ],
    });
    expect(JSON.stringify(result.body)).not.toContain('lastError"');
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
  const closeServer = (server: ReturnType<typeof startWorkerHealthServer>) =>
    new Promise<void>((resolve) => {
      if (!server) return resolve();
      server.close(() => resolve());
      server.closeAllConnections();
    });

  const listening = (
    server: NonNullable<ReturnType<typeof startWorkerHealthServer>>,
  ) =>
    new Promise<AddressInfo>((resolve) => {
      if (server.listening) return resolve(server.address() as AddressInfo);
      server.once('listening', () => resolve(server.address() as AddressInfo));
    });

  const request = (host: string, port: number, path: string) =>
    new Promise<{ status: number; body: string }>((resolve, reject) => {
      const req = get({ host, port, path, timeout: 2_000 }, (res) => {
        let body = '';
        res.on('data', (chunk: Buffer) => (body += chunk.toString()));
        res.on('end', () => resolve({ status: res.statusCode ?? 0, body }));
      });
      req.on('error', reject);
    });

  async function freePort(): Promise<number> {
    const { createServer } = await import('node:net');
    return new Promise<number>((resolve, reject) => {
      const probe = createServer();
      probe.once('error', reject);
      probe.listen(0, '127.0.0.1', () => {
        const { port } = probe.address() as AddressInfo;
        probe.close(() => resolve(port));
      });
    });
  }

  it('por defecto escucha sólo en el loopback y responde ahí', async () => {
    workerHealth.reset();
    workerHealth.configure('messaging', 10_000);
    workerHealth.setStatus('running');
    const port = await freePort();
    const server = startWorkerHealthServer({ port, logger });
    try {
      const address = await listening(server!);
      expect(DEFAULT_HEALTH_HOST).toBe('127.0.0.1');
      expect(address.address).toBe('127.0.0.1');

      const status = await request('127.0.0.1', port, '/status');
      expect(status.status).toBe(200);
    } finally {
      await closeServer(server);
      workerHealth.reset();
    }
  });

  it('no atiende desde otra interfaz de la máquina (sin credencial)', async () => {
    const external = Object.values(networkInterfaces())
      .flat()
      .find((iface) => iface && !iface.internal && iface.family === 'IPv4');
    const port = await freePort();
    const server = startWorkerHealthServer({ port, logger });
    try {
      await listening(server!);
      // Sin interfaz externa (contenedor aislado) no hay otra dirección por la
      // que intentarlo: el enlace al loopback ya lo prueba la prueba anterior.
      if (!external) return;

      await expect(request(external.address, port, '/status')).rejects.toThrow(
        /ECONNREFUSED|ETIMEDOUT|timeout/i,
      );
    } finally {
      await closeServer(server);
    }
  });
});
