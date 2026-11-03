import { jest } from '@jest/globals';
import type { MikroORM } from '@mikro-orm/postgresql';
import type { PinoLogger } from 'nestjs-pino';
import {
  ErrorSink,
  HttpSink,
  OperationResolver,
  SlowRequestSink,
  SqlSink,
  createInstanceIdentity,
  type ObservabilityEnv,
} from '../../../observability/capture';
import type { ObservabilityWriteRepository } from '../infrastructure/observability-write.repository';
import {
  ObservabilityFlushService,
  type ObservabilitySinks,
} from './observability-flush.service';

const ENV: ObservabilityEnv = {
  enabled: true,
  flushSeconds: 30,
  slowRequestMs: 2000,
  actorHashSecret: 's'.repeat(32),
};

function setup() {
  const identity = createInstanceIdentity({ NODE_ENV: 'test' });
  const resolver = new OperationResolver();
  const http = new HttpSink(resolver);
  http.setEnabled(true);
  const errors = new ErrorSink(resolver, identity.id);
  errors.configure({ enabled: true, actorHashSecret: ENV.actorHashSecret });
  const sql = new SqlSink(resolver);
  sql.setEnabled(true);
  const slow = new SlowRequestSink(resolver, identity.id);
  const sinks: ObservabilitySinks = { http, errors, sql, slow, identity };

  const tx = {};
  const orm = {
    em: {
      fork: () => ({
        transactional: async (fn: (t: unknown) => Promise<unknown>) => fn(tx),
      }),
    },
  } as unknown as MikroORM;

  const repository = {
    upsertInstance: jest.fn(async () => undefined),
    insertHttpRows: jest.fn(
      async (_tx: unknown, _id: string, rows: unknown[]) => rows.length,
    ),
    persistErrors: jest.fn(async () => ({
      groups: 0,
      eventsInserted: 0,
      eventsDuplicated: 0,
    })),
    upsertSqlStatements: jest.fn(async () => 0),
    insertSqlRows: jest.fn(
      async (_tx: unknown, _id: string, rows: unknown[]) => rows.length,
    ),
    insertSlowSamples: jest.fn(
      async (_tx: unknown, rows: unknown[]) => rows.length,
    ),
  };
  const logger = {
    setContext: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  } as unknown as PinoLogger;
  const service = new ObservabilityFlushService(
    orm,
    repository as unknown as ObservabilityWriteRepository,
    ENV,
    logger,
    sinks,
  );
  return { service, repository, sinks };
}

const at = new Date('2026-10-31T10:00:10.000Z');
const sample = (status: number) => ({
  method: 'GET',
  route: '/a',
  status,
  durationMs: 5,
  at,
});

describe('ObservabilityFlushService', () => {
  it('vuelca el lote completo con la instancia en la misma transacción', async () => {
    const { service, repository, sinks } = setup();
    sinks.http.record(sample(200));
    sinks.http.record(sample(404));
    await expect(service.flush()).resolves.toBe(2);
    expect(repository.upsertInstance).toHaveBeenCalledWith(
      expect.anything(),
      sinks.identity,
      'running',
      expect.any(Date),
    );
    expect(repository.insertHttpRows).toHaveBeenCalledTimes(1);
    expect(service.status.lastFlushAt).toBeInstanceOf(Date);
  });

  it('si la base falla, reintenta UNA vez el mismo lote con las mismas claves', async () => {
    const { service, repository, sinks } = setup();
    sinks.http.record(sample(200));
    repository.insertHttpRows.mockRejectedValueOnce(new Error('db caída'));

    await service.flush(); // falla → queda para reintento
    expect(service.droppedFlushes).toBe(0);
    await service.flush(); // reintenta el mismo lote

    const first = repository.insertHttpRows.mock.calls[0][2] as {
      flushSeq: number;
    }[];
    const second = repository.insertHttpRows.mock.calls[1][2] as {
      flushSeq: number;
    }[];
    expect(second).toEqual(first);
    expect(second[0].flushSeq).toBe(1);
    expect(service.droppedFlushes).toBe(0);
  });

  it('tras dos fallos descarta el lote y cuenta droppedFlushes; nunca lanza', async () => {
    const { service, repository, sinks } = setup();
    sinks.http.record(sample(200));
    repository.insertHttpRows.mockRejectedValue(new Error('db caída'));
    await expect(service.flush()).resolves.toBe(0);
    await expect(service.flush()).resolves.toBe(0);
    expect(service.droppedFlushes).toBe(1);
    expect(service.status.lastFailureType).toBe('Error');
    expect(service.status.lastFailureAt).toBeInstanceOf(Date);
  });

  it('sin datos sólo refresca el latido de la instancia', async () => {
    const { service, repository } = setup();
    await expect(service.flush()).resolves.toBe(0);
    expect(repository.upsertInstance).toHaveBeenCalledTimes(1);
    expect(repository.insertHttpRows).not.toHaveBeenCalled();
  });

  it('dos flush simultáneos no se solapan', async () => {
    const { service, repository, sinks } = setup();
    let concurrent = 0;
    let maxConcurrent = 0;
    repository.insertHttpRows.mockImplementation(
      async (_tx: unknown, _id: string, rows: unknown[]) => {
        concurrent += 1;
        maxConcurrent = Math.max(maxConcurrent, concurrent);
        await new Promise((r) => setTimeout(r, 10));
        concurrent -= 1;
        return rows.length;
      },
    );
    sinks.http.record(sample(200));
    const a = service.flush();
    sinks.http.record(sample(500));
    const b = service.flush();
    await Promise.all([a, b]);
    expect(maxConcurrent).toBe(1);
  });

  it('el apagado vuelca y marca la instancia como detenida', async () => {
    const { service, repository, sinks } = setup();
    sinks.http.record(sample(200));
    await service.onApplicationShutdown();
    expect(repository.insertHttpRows).toHaveBeenCalledTimes(1);
    expect(repository.upsertInstance).toHaveBeenLastCalledWith(
      expect.anything(),
      sinks.identity,
      'stopped',
      expect.any(Date),
    );
  });
});
