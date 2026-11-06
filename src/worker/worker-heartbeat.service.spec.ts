import { jest } from '@jest/globals';
import { HttpException } from '@nestjs/common';
import type { PinoLogger } from 'nestjs-pino';
import type { SystemApiClient } from './system-api-client.service';
import { workerHealth } from './worker-health.registry';
import {
  HEARTBEAT_MAX_REASONS,
  HEARTBEAT_MAX_REASON_LENGTH,
  HEARTBEAT_PATH,
  WorkerHeartbeatService,
  buildHeartbeatBody,
} from './worker-heartbeat.service';

function build(post = jest.fn<SystemApiClient['post']>()) {
  const logger = {
    setContext: jest.fn(),
    warn: jest.fn(),
  };
  const service = new WorkerHeartbeatService(
    { post } as unknown as SystemApiClient,
    logger as unknown as PinoLogger,
    { heartbeatIntervalMs: 15_000 } as never,
  );
  return { service, post, logger };
}

describe('WorkerHeartbeatService', () => {
  beforeEach(() => {
    workerHealth.reset();
    workerHealth.configure('messaging', 10_000);
  });

  afterEach(() => {
    workerHealth.reset();
    jest.useRealTimers();
  });

  it('emite el latido a la ruta de ingesta, idempotente, con el cuerpo del registro', async () => {
    workerHealth.setStatus('running');
    const { service, post } = build();
    post.mockResolvedValue({ instanceId: 'worker-messaging' });

    await expect(service.beat()).resolves.toBe(true);

    expect(post).toHaveBeenCalledTimes(1);
    const [path, body, options] = post.mock.calls[0];
    expect(path).toBe(HEARTBEAT_PATH);
    expect(options).toEqual({ idempotent: true });
    expect(body).toMatchObject({
      instanceId: 'worker-messaging',
      pid: process.pid,
      status: 'running',
      liveness: { healthy: true, reasons: [] },
      readiness: { healthy: true, reasons: [] },
      stuckTicks: 0,
      openCircuits: [],
    });
    expect(Object.keys(body as object).sort()).toEqual(
      [
        'instanceId',
        'liveness',
        'openCircuits',
        'pid',
        'readiness',
        'sentAt',
        'startedAt',
        'status',
        'stuckTicks',
      ].sort(),
    );
  });

  it('no emite mientras el worker sigue en `starting`', async () => {
    const { service, post } = build();
    await expect(service.beat()).resolves.toBe(false);
    expect(post).not.toHaveBeenCalled();
  });

  it('sí emite en `draining`, para que el apagado se vea como tal y no como silencio', async () => {
    workerHealth.setStatus('draining');
    const { service, post } = build();
    post.mockResolvedValue(undefined);
    await service.beat();
    expect(post).toHaveBeenCalledTimes(1);
    expect(post.mock.calls[0][1]).toMatchObject({ status: 'draining' });
  });

  it('un latido que falla no propaga: se registra la clase y el estado, sin el cuerpo', async () => {
    workerHealth.setStatus('running');
    const { service, post, logger } = build();
    post.mockRejectedValue(
      new HttpException({ body: { secreto: 'no debe salir' } }, 503),
    );

    await expect(service.beat()).resolves.toBe(false);

    expect(logger.warn).toHaveBeenCalledTimes(1);
    const [fields] = logger.warn.mock.calls[0] as [Record<string, unknown>];
    expect(fields).toEqual({ errorType: 'HttpException', status: 503 });
    expect(JSON.stringify(logger.warn.mock.calls)).not.toContain('secreto');
  });

  it('arranca el primer latido tras el bootstrap y luego uno por intervalo, con temporizadores unref', async () => {
    jest.useFakeTimers();
    workerHealth.setStatus('running');
    const { service, post } = build();
    post.mockResolvedValue(undefined);
    const setIntervalSpy = jest.spyOn(global, 'setInterval');

    service.onApplicationBootstrap();
    expect(post).not.toHaveBeenCalled();

    await jest.advanceTimersByTimeAsync(0);
    expect(post).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(15_000);
    expect(post).toHaveBeenCalledTimes(2);

    const [, intervalMs] = setIntervalSpy.mock.calls[0];
    expect(intervalMs).toBe(15_000);
    const timer = setIntervalSpy.mock.results[0].value as NodeJS.Timeout;
    expect(timer.hasRef()).toBe(false);

    service.onApplicationShutdown();
    await jest.advanceTimersByTimeAsync(60_000);
    expect(post).toHaveBeenCalledTimes(2);
  });
});

describe('buildHeartbeatBody', () => {
  it('acota las razones a 10 elementos de 200 caracteres y lista los circuitos abiertos', () => {
    const reasons = Array.from({ length: 12 }, (_, i) =>
      `razón ${i} `.padEnd(250, 'x'),
    );
    const body = buildHeartbeatBody(
      {
        worker: 'billing',
        pid: 7,
        status: 'running',
        uptimeMs: 1,
        startedAt: '2026-10-30T12:00:00.000Z',
        ticks: [],
        circuits: [
          {
            operation: 'system-api',
            state: 'open',
          } as never,
          { operation: 'otro', state: 'closed' } as never,
        ],
        providerCapabilities: [],
        memory: { rssBytes: 0, heapUsedBytes: 0, heapTotalBytes: 0 },
        liveness: { healthy: false, reasons },
        readiness: { healthy: false, reasons: ['circuito abierto'] },
      },
      new Date('2026-10-30T12:05:15.000Z'),
    );

    expect(body.instanceId).toBe('worker-billing');
    expect(body.sentAt).toBe('2026-10-30T12:05:15.000Z');
    expect(body.liveness.reasons).toHaveLength(HEARTBEAT_MAX_REASONS);
    for (const reason of body.liveness.reasons) {
      expect(reason.length).toBeLessThanOrEqual(HEARTBEAT_MAX_REASON_LENGTH);
    }
    expect(body.stuckTicks).toBe(12);
    expect(body.openCircuits).toEqual(['system-api']);
  });
});
