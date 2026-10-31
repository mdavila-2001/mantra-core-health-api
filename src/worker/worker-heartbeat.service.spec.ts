import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import type { PinoLogger } from 'nestjs-pino';
import type { SystemApiClient } from './system-api-client.service';
import { workerHealth } from './worker-health.registry';
import {
  HEARTBEAT_PATH,
  WorkerHeartbeatService,
} from './worker-heartbeat.service';

function build(intervalMs = 15_000) {
  const post = jest.fn<
    (path: string, body: unknown, opts: unknown) => Promise<unknown>
  >(async () => ({ accepted: true }));
  const logger = { setContext: jest.fn(), warn: jest.fn(), info: jest.fn() };
  const service = new WorkerHeartbeatService(
    'messaging',
    { heartbeatIntervalMs: intervalMs },
    { post } as unknown as SystemApiClient,
    logger as unknown as PinoLogger,
  );
  return { service, post, logger };
}

describe('WorkerHeartbeatService', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    workerHealth.setStatus('running');
  });
  afterEach(() => {
    jest.useRealTimers();
    workerHealth.setStatus('starting');
  });

  it('correcto: manda instanceId worker-<dominio> y type worker, idempotente y SIN ninguna hora', async () => {
    const { service, post } = build();
    expect(await service.beat()).toBe(true);
    expect(post).toHaveBeenCalledWith(
      HEARTBEAT_PATH,
      { instanceId: 'worker-messaging', type: 'worker' },
      { idempotent: true },
    );
    const body = post.mock.calls[0][1] as Record<string, unknown>;
    expect(Object.keys(body).sort()).toEqual(['instanceId', 'type']);
  });

  it('el primer latido sale al terminar el arranque y luego cada intervalo (15 s)', async () => {
    const { service, post } = build(15_000);
    service.onApplicationBootstrap();
    await jest.advanceTimersByTimeAsync(0);
    expect(post).toHaveBeenCalledTimes(1);
    await jest.advanceTimersByTimeAsync(14_999);
    expect(post).toHaveBeenCalledTimes(1);
    await jest.advanceTimersByTimeAsync(1);
    expect(post).toHaveBeenCalledTimes(2);
    await jest.advanceTimersByTimeAsync(15_000);
    expect(post).toHaveBeenCalledTimes(3);
    service.beforeApplicationShutdown();
    await jest.advanceTimersByTimeAsync(60_000);
    expect(post).toHaveBeenCalledTimes(3);
  });

  it('el temporizador no retiene el proceso (unref)', () => {
    const { service } = build();
    const unref = jest.spyOn(global, 'setInterval');
    service.onApplicationBootstrap();
    const timer = unref.mock.results[0].value as NodeJS.Timeout;
    expect(timer.hasRef()).toBe(false);
    service.beforeApplicationShutdown();
    unref.mockRestore();
  });

  it.each(['starting', 'draining', 'stopped'] as const)(
    'límite: no declara vida con el proceso en estado %s',
    async (status) => {
      workerHealth.setStatus(status);
      const { service, post } = build();
      expect(await service.beat()).toBe(false);
      expect(post).not.toHaveBeenCalled();
    },
  );

  it('inválido: si la API falla, beat no lanza, devuelve false y avisa UNA vez por racha', async () => {
    const { service, post, logger } = build();
    post.mockRejectedValue(new Error('http://api:3000 token=abc ECONNREFUSED'));
    expect(await service.beat()).toBe(false);
    expect(await service.beat()).toBe(false);
    expect(logger.warn).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(logger.warn.mock.calls)).not.toMatch(
      /token=abc|api:3000/,
    );

    post.mockResolvedValue({ accepted: true });
    expect(await service.beat()).toBe(true);
    expect(logger.info).toHaveBeenCalledTimes(1);
  });

  it('inválido: un fallo del latido en el intervalo no se convierte en rechazo no manejado', async () => {
    const { service, post } = build(1000);
    post.mockRejectedValue(new Error('boom'));
    service.onApplicationBootstrap();
    await jest.advanceTimersByTimeAsync(3_500);
    expect(post.mock.calls.length).toBeGreaterThanOrEqual(3);
    service.beforeApplicationShutdown();
  });

  it('límite: no solapa envíos si uno sigue en vuelo', async () => {
    const { service, post } = build();
    let release: () => void = () => undefined;
    post.mockImplementationOnce(
      () => new Promise((resolve) => (release = () => resolve({}))),
    );
    const first = service.beat();
    expect(await service.beat()).toBe(false);
    release();
    expect(await first).toBe(true);
    expect(post).toHaveBeenCalledTimes(1);
  });
});
