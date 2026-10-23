import { describe, expect, it, jest } from '@jest/globals';
import { DomainException } from '../../common';
import type { RouteIndexService } from '../../observability/route-index/route-index.service';
import { OpsTrafficService, parseSeriesId } from './ops-traffic.service';
import type { OpsTrafficRepository } from './ops-traffic.repository';

const NOW = new Date('2026-10-17T15:00:00Z');

type Repo = Pick<
  OpsTrafficRepository,
  'readWindow' | 'readEndpoints' | 'readActiveUsers'
>;

function build(repo: Partial<Repo> = {}, known: Record<string, string> = {}) {
  const fake: Repo = {
    readWindow: jest.fn(async () => ({
      totals: {
        requests: 100,
        succeeded: 90,
        client_4xx: 8,
        server_5xx: 2,
        sum_ms: 5000,
        max_ms: 900,
        last_time: new Date('2026-10-17T14:59:00Z'),
      },
      // 100 peticiones: 60 ≤ 25 ms, 95 ≤ 100 ms, todas ≤ 1000 ms.
      buckets: [
        { key: 'le25', n: 60 },
        { key: 'le100', n: 95 },
        { key: 'le1000', n: 100 },
        { key: 'inf', n: 100 },
      ],
      series: [
        {
          bucket: new Date('2026-10-17T14:00:00Z'),
          requests: 100,
          failed_4xx: 8,
          failed_5xx: 2,
        },
      ],
      seriesBuckets: [
        { bucket: new Date('2026-10-17T14:00:00Z'), key: 'le100', n: 100 },
        { bucket: new Date('2026-10-17T14:00:00Z'), key: 'inf', n: 100 },
      ],
    })),
    readEndpoints: jest.fn(async () => ({ endpoints: [], buckets: [] })),
    readActiveUsers: jest.fn(async () => ({
      sessions_now: 4,
      users_now: 3,
      users_window: 5,
    })),
    ...repo,
  };
  const routes = {
    lookup: (method: string, route: string) => {
      const operationId = known[`${method} ${route}`];
      return operationId ? { operationId } : undefined;
    },
  } as unknown as RouteIndexService;
  return new OpsTrafficService(fake as OpsTrafficRepository, routes);
}

describe('parseSeriesId', () => {
  it('separa método y plantilla, y tolera una barra vertical en la ruta', () => {
    expect(parseSeriesId('http|GET|/patients/:id')).toEqual({
      method: 'GET',
      route: '/patients/:id',
    });
    expect(parseSeriesId('http|GET|/a|b')).toEqual({
      method: 'GET',
      route: '/a|b',
    });
  });

  it('rechaza lo que no es una serie de http', () => {
    expect(parseSeriesId('otro|GET|/x')).toBeNull();
    expect(parseSeriesId('http|GET')).toBeNull();
    expect(parseSeriesId('')).toBeNull();
  });
});

describe('OpsTrafficService.traffic', () => {
  it('devuelve los agregados medidos y la razón de lo que no mide', async () => {
    const out = await build().traffic({ to: NOW.toISOString() });
    expect(out.measured.requests).toBe(100);
    expect(out.measured.succeeded).toBe(90);
    expect(out.measured.failed).toEqual({ client4xx: 8, server5xx: 2 });
    expect(out.measured.successRatio).toBe(0.9);
    expect(out.measured.latencyMs.avg).toBe(50);
    expect(out.measured.latencyMs.max).toBe(900);
    expect(out.measured.latencyMs.method).toBe('histogram-estimate');
    expect(out.measured.activeUsers).toMatchObject({
      sessionsActiveNow: 4,
      usersActiveNow: 3,
      usersActiveInWindow: 5,
    });
    expect(out.measured.lastDataAt).toBe('2026-10-17T14:59:00.000Z');
    expect(out.window.timezone).toBe('UTC');
    expect(out.notMeasured.length).toBeGreaterThan(0);
    expect(out.series).toHaveLength(1);
    expect(out.series[0]).toMatchObject({
      bucket: '2026-10-17T14:00:00.000Z',
      requests: 100,
      failed4xx: 8,
      failed5xx: 2,
    });
  });

  it('sin datos devuelve ceros y nulos, no números inventados', async () => {
    const service = build({
      readWindow: jest.fn(async () => ({
        totals: undefined,
        buckets: [],
        series: [],
        seriesBuckets: [],
      })) as unknown as Repo['readWindow'],
    });
    const out = await service.traffic({});
    expect(out.measured.requests).toBe(0);
    expect(out.measured.successRatio).toBeNull();
    expect(out.measured.latencyMs.p95).toBeNull();
    expect(out.measured.lastDataAt).toBeNull();
    expect(out.series).toEqual([]);
  });

  it('una ventana inválida es 422 VALIDATION_FAILED con su razón', async () => {
    const attempt = build().traffic({
      from: '2026-10-18T00:00:00Z',
      to: '2026-10-17T00:00:00Z',
    });
    await expect(attempt).rejects.toBeInstanceOf(DomainException);
    await expect(attempt).rejects.toMatchObject({
      code: 'VALIDATION_FAILED',
    });
    await expect(attempt).rejects.toMatchObject({
      response: expect.objectContaining({}) as unknown,
    });
  });
});

describe('OpsTrafficService.endpoints', () => {
  const row = (
    series_id: string,
    requests: number,
    client_4xx = 0,
    server_5xx = 0,
  ) => ({
    series_id,
    requests,
    succeeded: requests - client_4xx - server_5xx,
    client_4xx,
    server_5xx,
    sum_ms: requests * 10,
    max_ms: 50,
    first_seen: new Date('2026-10-17T01:00:00Z'),
    last_seen: new Date('2026-10-17T14:00:00Z'),
  });

  const service = (limit?: number) =>
    build(
      {
        readEndpoints: jest.fn(async () => ({
          endpoints: [
            row('http|GET|/a', 10, 5),
            row('http|GET|/b', 30, 0, 1),
            row('http|POST|/b', 30),
            row('basura', 99),
          ],
          buckets: [
            { series_id: 'http|GET|/a', key: 'le25', n: 10 },
            { series_id: 'http|GET|/a', key: 'inf', n: 10 },
            { series_id: 'http|GET|/b', key: 'le1000', n: 30 },
            { series_id: 'http|GET|/b', key: 'inf', n: 30 },
          ],
        })),
      },
      { 'GET /b': 'B_get' },
    ).endpoints({ limit, to: NOW.toISOString() });

  it('ordena por peticiones con desempate estable y descarta lo que no es serie', async () => {
    const out = await service();
    expect(out.items.map((i) => `${i.method} ${i.route}`)).toEqual([
      'GET /b',
      'POST /b',
      'GET /a',
    ]);
    expect(out.truncated).toBe(false);
  });

  it('resuelve operationId desde el índice y deja null lo desconocido', async () => {
    const out = await service();
    expect(out.items[0].operationId).toBe('B_get');
    expect(out.items[1].operationId).toBeNull();
  });

  it('corta en el límite y lo declara', async () => {
    const out = await service(2);
    expect(out.items).toHaveLength(2);
    expect(out.truncated).toBe(true);
  });

  it('ordena por fallos cuando se pide', async () => {
    const out = await build({
      readEndpoints: jest.fn(async () => ({
        endpoints: [row('http|GET|/a', 10, 5), row('http|GET|/b', 30, 0, 1)],
        buckets: [],
      })),
    }).endpoints({ sort: 'failed', to: NOW.toISOString() });
    expect(out.items[0].route).toBe('/a');
  });
});
