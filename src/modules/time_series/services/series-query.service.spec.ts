import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { SeriesQueryService, intervalToSeconds } from './series-query.service';

const TENANT_ID = '11111111-1111-1111-1111-111111111111';

function build(rows: any[] = []) {
  const tx = { flush: mockFn() };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const timescaleRepo = {
    queryRawRange: mockFn(async () => rows),
    queryRollupRange: mockFn(async () => rows),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new SeriesQueryService(
    em as any,
    timescaleRepo as any,
    logger as any,
  );
  return { service, em, tx, timescaleRepo, logger };
}

const QUERY = {
  dataset: 'normalized_vital_series',
  tenantId: TENANT_ID,
  from: '2026-01-01T00:00:00.000Z',
  to: '2026-01-02T00:00:00.000Z',
  bucket: '5 minutes',
} as any;

describe('intervalToSeconds', () => {
  it('convierte las unidades admitidas', () => {
    expect(intervalToSeconds('30 seconds')).toBe(30);
    expect(intervalToSeconds('5 minutes')).toBe(300);
    expect(intervalToSeconds('1 hour')).toBe(3600);
    expect(intervalToSeconds('7 days')).toBe(604800);
    expect(intervalToSeconds('1 week')).toBe(604800);
  });

  it('acepta el singular', () => {
    expect(intervalToSeconds('1 day')).toBe(86400);
  });

  it('rechaza lo que no sabe leer', () => {
    expect(() => intervalToSeconds('every monday')).toThrow(/`<n> <unidad>`/);
    expect(() => intervalToSeconds('1 fortnight')).toThrow();
  });
});

describe('SeriesQueryService', () => {
  it('lee del crudo cuando el bucket es fino', async () => {
    const d = build();

    const result = await d.service.queryRange('serie-1', QUERY);

    expect(d.timescaleRepo.queryRawRange).toHaveBeenCalled();
    expect(d.timescaleRepo.queryRollupRange).not.toHaveBeenCalled();
    expect(result.source).toBe('raw');
  });

  it('lee del crudo si la serie no tiene agregado continuo, por ancho que sea el bucket', async () => {
    const d = build();

    const result = await d.service.queryRange('serie-1', {
      ...QUERY,
      bucket: '1 day',
    });

    expect(result.source).toBe('raw');
  });

  it('sirve desde el rollup horario cuando el bucket es múltiplo de una hora', async () => {
    const d = build();

    const result = await d.service.queryRange('serie-1', {
      ...QUERY,
      dataset: 'service_sli_series',
      bucket: '2 hours',
    });

    expect(d.timescaleRepo.queryRollupRange).toHaveBeenCalled();
    expect(result.source).toBe('continuous_sli_hourly');
  });

  it('sirve desde el rollup diario cuando el bucket es múltiplo de un día', async () => {
    const d = build();

    const result = await d.service.queryRange('serie-1', {
      ...QUERY,
      dataset: 'service_sli_series',
      bucket: '1 day',
    });

    expect(result.source).toBe('continuous_sli_daily');
  });

  it('no usa el rollup si el bucket no encaja con sus cubos', async () => {
    const d = build();

    const result = await d.service.queryRange('serie-1', {
      ...QUERY,
      dataset: 'service_sli_series',
      bucket: '90 minutes',
    });

    expect(result.source).toBe('raw');
  });

  it('recorta al tope y avisa de que hay más', async () => {
    const rows = Array.from({ length: 6 }, (_, i) => ({
      bucket: `2026-01-01T0${i}:00:00.000Z`,
      value: i,
      samples: '1',
    }));
    const d = build(rows);

    const result = await d.service.queryRange('serie-1', {
      ...QUERY,
      limit: 5,
    });

    expect(result.points).toHaveLength(5);
    expect(result.truncated).toBe(true);
  });

  it('pide una fila de más para saber si hay continuación', async () => {
    const d = build();

    await d.service.queryRange('serie-1', { ...QUERY, limit: 10 });

    expect(d.timescaleRepo.queryRawRange.mock.calls[0][4].limit).toBe(11);
  });

  it('recorta el límite pedido al máximo del módulo', async () => {
    const d = build();

    await d.service.queryRange('serie-1', { ...QUERY, limit: 100000 });

    expect(d.timescaleRepo.queryRawRange.mock.calls[0][4].limit).toBe(5001);
  });

  it('rechaza un rango invertido', async () => {
    const d = build();

    await expect(
      d.service.queryRange('serie-1', {
        ...QUERY,
        from: QUERY.to,
        to: QUERY.from,
      }),
    ).rejects.toThrow(/antes de terminar/);
  });

  it('rechaza promediar una serie que sólo registra ocurrencias', async () => {
    const d = build();

    await expect(
      d.service.queryRange('serie-1', {
        ...QUERY,
        dataset: 'application_tracking_series',
        agg: 'avg',
      }),
    ).rejects.toThrow(/sólo admite `count`/);
  });

  it('acepta contar esa misma serie', async () => {
    const d = build();

    await expect(
      d.service.queryRange('serie-1', {
        ...QUERY,
        dataset: 'application_tracking_series',
        agg: 'count',
      }),
    ).resolves.toBeDefined();
  });

  it('convierte los valores del motor a número', async () => {
    const d = build([
      {
        bucket: '2026-01-01T00:00:00.000Z',
        value: '72.5' as any,
        samples: '3',
      },
    ]);

    const result = await d.service.queryRange('serie-1', QUERY);

    expect(result.points[0]).toEqual({
      bucket: '2026-01-01T00:00:00.000Z',
      value: 72.5,
      samples: 3,
    });
  });

  it('conserva el nulo de un bucket sin datos', async () => {
    const d = build([
      { bucket: '2026-01-01T00:00:00.000Z', value: null, samples: '0' },
    ]);

    const result = await d.service.queryRange('serie-1', QUERY);

    expect(result.points[0].value).toBeNull();
  });
});
