import { describe, expect, it } from '@jest/globals';
import { LATENCY_BUCKET_KEYS } from '../../../observability/http-sli/http-sli.aggregator';
import {
  describeNotMeasured,
  mergeLatency,
  quantileFromBuckets,
  summarizeLatency,
  type CumulativeBuckets,
} from './latency-buckets';

/** Histograma acumulado a partir de cuántas observaciones caen en cada corte. */
function cumulative(
  perBucket: Partial<Record<string, number>>,
): CumulativeBuckets {
  let running = 0;
  return Object.fromEntries(
    LATENCY_BUCKET_KEYS.map((key) => {
      running += perBucket[key] ?? 0;
      return [key, running];
    }),
  );
}

describe('quantileFromBuckets', () => {
  it('sin observaciones no hay percentil', () => {
    expect(quantileFromBuckets(cumulative({}), 0.95)).toEqual({
      value: null,
      approximate: false,
    });
  });

  it('95 en ≤100 ms y 5 en ≤250 ms: el p95 es 100', () => {
    const buckets = cumulative({ le100: 95, le250: 5 });

    expect(quantileFromBuckets(buckets, 0.95)).toEqual({
      value: 100,
      approximate: false,
    });
  });

  it('interpola linealmente dentro del corte', () => {
    // 100 observaciones, todas entre 100 y 250 ms: el p50 es la mitad del corte.
    const buckets = cumulative({ le250: 100 });

    expect(quantileFromBuckets(buckets, 0.5).value).toBe(100 + 150 * 0.5);
  });

  it('el primer corte interpola desde cero', () => {
    expect(quantileFromBuckets(cumulative({ le5: 10 }), 0.5).value).toBe(2.5);
  });

  it('si todo cae en inf devuelve el último corte finito, marcado como aproximado', () => {
    expect(quantileFromBuckets(cumulative({ inf: 8 }), 0.95)).toEqual({
      value: 10000,
      approximate: true,
    });
  });

  it('un percentil que no llega a inf no es aproximado aunque haya lentos', () => {
    const buckets = cumulative({ le10: 99, inf: 1 });

    expect(quantileFromBuckets(buckets, 0.5).approximate).toBe(false);
    expect(quantileFromBuckets(buckets, 0.999).approximate).toBe(true);
  });

  it('q = 0 y q = 1 están definidos', () => {
    const buckets = cumulative({ le100: 10 });

    expect(quantileFromBuckets(buckets, 0).value).toBe(50);
    expect(quantileFromBuckets(buckets, 1).value).toBe(100);
  });

  it.each([-0.1, 1.1, Number.NaN])(
    'un q inválido (%s) no da un número',
    (q) => {
      expect(quantileFromBuckets(cumulative({ le10: 5 }), q).value).toBeNull();
    },
  );
});

describe('mergeLatency', () => {
  it('suma los acumulados clave a clave y toma el máximo', () => {
    const a = { sumMs: 12, maxMs: 12, buckets: cumulative({ le25: 1 }) };
    const b = { sumMs: 900, maxMs: 900, buckets: cumulative({ le1000: 1 }) };

    const merged = mergeLatency([a, b]);

    expect(merged.count).toBe(2);
    expect(merged.sumMs).toBe(912);
    expect(merged.maxMs).toBe(900);
    expect(merged.buckets.le25).toBe(1);
    expect(merged.buckets.le1000).toBe(2);
    expect(merged.buckets.inf).toBe(2);
  });

  it('una fila sin latency, nula o malformada cuenta como vacía y no rompe', () => {
    const merged = mergeLatency([
      null,
      undefined,
      {},
      {
        buckets: { le5: 'x' as unknown as number },
        sumMs: -3,
        maxMs: Number.NaN,
      },
      { sumMs: 4, maxMs: 4, buckets: cumulative({ le5: 1 }) },
    ]);

    expect(merged.count).toBe(1);
    expect(merged.sumMs).toBe(4);
  });

  it('sin filas devuelve un histograma vacío con todas las claves', () => {
    const merged = mergeLatency([]);

    expect(merged.count).toBe(0);
    expect(Object.keys(merged.buckets)).toEqual([...LATENCY_BUCKET_KEYS]);
  });
});

describe('summarizeLatency', () => {
  it('sin observaciones, todo es null', () => {
    expect(summarizeLatency(mergeLatency([]))).toEqual({
      avg: null,
      p50: null,
      p95: null,
      max: null,
      approximate: false,
    });
  });

  it('calcula promedio, percentiles y máximo', () => {
    const summary = summarizeLatency(
      mergeLatency([
        {
          sumMs: 1000,
          maxMs: 240,
          buckets: cumulative({ le100: 95, le250: 5 }),
        },
      ]),
    );

    expect(summary.avg).toBe(10);
    expect(summary.p95).toBe(100);
    expect(summary.max).toBe(240);
    expect(summary.approximate).toBe(false);
  });

  it('marca approximate si algún percentil cae en inf', () => {
    const summary = summarizeLatency(
      mergeLatency([
        { sumMs: 99999, maxMs: 30000, buckets: cumulative({ inf: 3 }) },
      ]),
    );

    expect(summary.approximate).toBe(true);
    expect(summary.p95).toBe(10000);
  });
});

describe('describeNotMeasured', () => {
  it('encendida lista las limitaciones fijas, cada una con su razón', () => {
    const items = describeNotMeasured(true);

    expect(items.map((i) => i.metric)).toEqual([
      'rejectedBeforeApi',
      'lastMinuteNotFlushed',
      'healthchecksExcluded',
      'workersNotHttp',
      'unmatchedAggregated',
      'percentilesEstimated',
    ]);
    expect(items.every((i) => i.reason.length > 20)).toBe(true);
  });

  it('apagada dice sólo eso', () => {
    expect(describeNotMeasured(false).map((i) => i.metric)).toEqual([
      'disabled',
    ]);
  });
});
