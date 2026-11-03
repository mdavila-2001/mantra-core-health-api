import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { SEED } from '../../common/constants/concepts';
import { HttpSliAggregator } from './http-sli.aggregator';
import {
  HTTP_SLI_CODE,
  HTTP_SLI_SERVICE_ID,
  HTTP_SLI_SOURCE_VERSION,
  HttpSliFlushService,
} from './http-sli-flush.service';

const AT = new Date('2026-10-17T10:15:20.000Z');

function build(env = { enabled: true, flushSeconds: 60 }) {
  const aggregator = new HttpSliAggregator();
  const tx = {
    execute: jest.fn(async (_sql: string, _params?: unknown[]) => undefined),
  };
  const transactional = jest.fn(async (cb: (em: typeof tx) => Promise<void>) =>
    cb(tx),
  );
  const orm = { em: { fork: () => ({ transactional }) } };
  const repository = {
    insertPoints: jest.fn(
      (_em: unknown, _table: string, _rows: Record<string, unknown>[]) => 0,
    ),
  };
  const logger = {
    setContext: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  };
  const service = new HttpSliFlushService(
    orm as never,
    repository as never,
    aggregator,
    env,
    logger as never,
  );
  return { service, aggregator, transactional, repository, logger, tx };
}

function record(aggregator: HttpSliAggregator, routes: string[]) {
  for (const route of routes) {
    aggregator.record({
      method: 'GET',
      route,
      status: 200,
      durationMs: 12,
      at: AT,
    });
  }
}

describe('HttpSliFlushService', () => {
  const originalRls = process.env.RLS_ENFORCE;

  afterEach(() => {
    if (originalRls === undefined) delete process.env.RLS_ENFORCE;
    else process.env.RLS_ENFORCE = originalRls;
    jest.useRealTimers();
  });

  it('vuelca tres grupos en una transacción, con las columnas del contrato', async () => {
    const { service, aggregator, transactional, repository, logger } = build();
    record(aggregator, ['/a', '/b', '/c']);

    const persisted = await service.flush();

    expect(persisted).toBe(3);
    expect(transactional).toHaveBeenCalledTimes(1);
    expect(repository.insertPoints).toHaveBeenCalledTimes(1);
    const [, table, rows] = repository.insertPoints.mock.calls[0];
    expect(table).toBe('service_sli_series');
    expect(rows).toHaveLength(3);
    expect(rows[0]).toMatchObject({
      tenantId: SEED.tenantId,
      serviceId: HTTP_SLI_SERVICE_ID,
      sliCode: HTTP_SLI_CODE,
      sourceVersion: HTTP_SLI_SOURCE_VERSION,
      qualityState: 'received',
      seriesId: 'http|GET|/a',
      numerator: 1,
      denominator: 1,
      value: 1,
    });
    expect(rows[0].time).toEqual(new Date('2026-10-17T10:15:00.000Z'));
    // Un mismo lote comparte `ingestion_id`.
    expect(new Set(rows.map((r) => r.ingestionId)).size).toBe(1);
    expect(logger.info).toHaveBeenCalledWith(
      { operation: 'http_sli.flush', rows: 3 },
      expect.any(String),
    );
  });

  it('sin nada pendiente no abre ninguna transacción', async () => {
    const { service, transactional } = build();

    expect(await service.flush()).toBe(0);
    expect(transactional).not.toHaveBeenCalled();
  });

  it('con la base caída no lanza, y reintenta ese lote UNA vez en el ciclo siguiente', async () => {
    const { service, aggregator, transactional, logger } = build();
    record(aggregator, ['/a']);
    transactional.mockRejectedValueOnce(new Error('db caída'));

    await expect(service.flush()).resolves.toBe(0);
    expect(service.droppedFlushes).toBe(0);

    // Ciclo siguiente: se reintenta lo viejo y se vuelca lo nuevo.
    record(aggregator, ['/b']);
    const persisted = await service.flush();

    expect(persisted).toBe(2);
    expect(transactional).toHaveBeenCalledTimes(3);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        operation: 'http_sli.flush',
        error: 'db caída',
      }),
      expect.any(String),
    );
  });

  it('si el reintento también falla, descarta el lote viejo y cuenta el descarte, sin perder lo nuevo', async () => {
    const { service, aggregator, transactional, repository } = build();
    record(aggregator, ['/vieja']);
    transactional.mockRejectedValueOnce(new Error('caída 1'));
    await service.flush();

    record(aggregator, ['/nueva']);
    transactional.mockRejectedValueOnce(new Error('caída 2'));
    const persisted = await service.flush();

    // El lote viejo se descartó; el nuevo sí entró.
    expect(service.droppedFlushes).toBe(1);
    expect(persisted).toBe(1);
    const lastRows = repository.insertPoints.mock.calls.at(-1)?.[2] ?? [];
    expect(lastRows.map((r) => r.seriesId)).toEqual(['http|GET|/nueva']);
  });

  it('un lote nuevo que falla no se mezcla con el reintento: se reintenta aparte', async () => {
    const { service, aggregator, transactional } = build();
    record(aggregator, ['/a']);
    transactional.mockRejectedValueOnce(new Error('caída'));
    await service.flush();

    record(aggregator, ['/b']);
    transactional.mockResolvedValueOnce(undefined as never); // el reintento de /a entra
    transactional.mockRejectedValueOnce(new Error('caída de nuevo')); // /b falla por primera vez
    const persisted = await service.flush();

    expect(persisted).toBe(1);
    expect(service.droppedFlushes).toBe(0);
  });

  it('con RLS_ENFORCE=true fija el tenant dentro de la transacción', async () => {
    process.env.RLS_ENFORCE = 'true';
    const { service, aggregator, tx } = build();
    record(aggregator, ['/a']);

    await service.flush();

    expect(tx.execute).toHaveBeenCalledWith(
      "select set_config('app.current_tenant_id', ?, true)",
      [SEED.tenantId],
    );
  });

  it('sin RLS_ENFORCE no toca el contexto de la transacción', async () => {
    delete process.env.RLS_ENFORCE;
    const { service, aggregator, tx } = build();
    record(aggregator, ['/a']);

    await service.flush();

    expect(tx.execute).not.toHaveBeenCalled();
  });

  describe('ciclo de vida', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    it('apagado: no programa ningún temporizador', () => {
      const { service, aggregator, transactional } = build({
        enabled: false,
        flushSeconds: 60,
      });
      record(aggregator, ['/a']);

      service.onModuleInit();
      jest.advanceTimersByTime(10 * 60_000);

      expect(transactional).not.toHaveBeenCalled();
    });

    it('encendido: vuelca cada flushSeconds', async () => {
      const { service, aggregator, transactional } = build({
        enabled: true,
        flushSeconds: 30,
      });
      record(aggregator, ['/a']);

      service.onModuleInit();
      await jest.advanceTimersByTimeAsync(30_000);

      expect(transactional).toHaveBeenCalledTimes(1);
      await service.onApplicationShutdown();
    });

    it('al apagar la API vuelca lo pendiente y detiene el temporizador', async () => {
      const { service, aggregator, transactional } = build();
      service.onModuleInit();
      record(aggregator, ['/a']);

      await service.onApplicationShutdown();
      await jest.advanceTimersByTimeAsync(5 * 60_000);

      expect(transactional).toHaveBeenCalledTimes(1);
    });

    it('apagado + shutdown: no vuelca nada', async () => {
      const { service, aggregator, transactional } = build({
        enabled: false,
        flushSeconds: 60,
      });
      record(aggregator, ['/a']);

      await service.onApplicationShutdown();

      expect(transactional).not.toHaveBeenCalled();
    });
  });
});
