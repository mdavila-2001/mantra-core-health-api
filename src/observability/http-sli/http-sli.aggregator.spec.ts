import { describe, it, expect } from '@jest/globals';
import {
  HttpSliAggregator,
  LATENCY_BUCKET_KEYS,
  MAX_KEYS_PER_MINUTE,
  OVERFLOW_ROUTE,
  UNMATCHED_ROUTE,
  type HttpSample,
} from './http-sli.aggregator';

const T0 = new Date('2026-10-17T10:15:20.000Z');

function sample(overrides: Partial<HttpSample> = {}): HttpSample {
  return {
    method: 'GET',
    route: '/x',
    status: 200,
    durationMs: 10,
    at: T0,
    ...overrides,
  };
}

describe('HttpSliAggregator', () => {
  it('agrupa las peticiones del mismo minuto, método y plantilla en UNA fila', () => {
    const aggregator = new HttpSliAggregator();
    aggregator.record(sample({ status: 200, durationMs: 12 }));
    aggregator.record(sample({ status: 500, durationMs: 900 }));

    const [point, ...rest] = aggregator.drain();

    expect(rest).toEqual([]);
    expect(point.seriesId).toBe('http|GET|/x');
    expect(point.time.toISOString()).toBe('2026-10-17T10:15:00.000Z');
    expect(point.numerator).toBe(1);
    expect(point.denominator).toBe(2);
    expect(point.value).toBe(0.5);
    expect(point.dimensions.codes).toEqual({ '2xx': 1, '5xx': 1 });
    expect(point.dimensions.latency.sumMs).toBe(912);
    expect(point.dimensions.latency.maxMs).toBe(900);
    // Acumulado: 12 ms entra desde `le25`; 900 ms desde `le1000`.
    expect(point.dimensions.latency.buckets).toMatchObject({
      le5: 0,
      le10: 0,
      le25: 1,
      le500: 1,
      le1000: 2,
      inf: 2,
    });
  });

  it('separa minutos, métodos y plantillas, y las entrega ordenadas', () => {
    const aggregator = new HttpSliAggregator();
    aggregator.record(sample({ at: new Date('2026-10-17T10:16:01.000Z') }));
    aggregator.record(sample());
    aggregator.record(sample({ method: 'POST' }));
    aggregator.record(sample({ route: '/a' }));

    const ids = aggregator
      .drain()
      .map((p) => `${p.time.toISOString()} ${p.seriesId}`);

    expect(ids).toEqual([
      '2026-10-17T10:15:00.000Z http|GET|/a',
      '2026-10-17T10:15:00.000Z http|GET|/x',
      '2026-10-17T10:15:00.000Z http|POST|/x',
      '2026-10-17T10:16:00.000Z http|GET|/x',
    ]);
  });

  it('cuenta 2xx y 3xx como éxito; 4xx y 5xx no', () => {
    const aggregator = new HttpSliAggregator();
    for (const status of [200, 204, 302, 401, 404, 500]) {
      aggregator.record(sample({ status }));
    }

    const [point] = aggregator.drain();

    expect(point.numerator).toBe(3);
    expect(point.denominator).toBe(6);
    expect(point.dimensions.codes).toEqual({
      '2xx': 2,
      '3xx': 1,
      '4xx': 2,
      '5xx': 1,
    });
  });

  it('un estado fuera de 200–599 va a `other` y no suma como éxito', () => {
    const aggregator = new HttpSliAggregator();
    aggregator.record(sample({ status: 101 }));
    aggregator.record(sample({ status: 700 }));
    aggregator.record(sample({ status: Number.NaN }));

    const [point] = aggregator.drain();

    expect(point.numerator).toBe(0);
    expect(point.dimensions.codes).toEqual({ other: 3 });
  });

  it('el borde exacto de un corte pertenece a ese corte (≤), no al siguiente', () => {
    const aggregator = new HttpSliAggregator();
    aggregator.record(sample({ route: '/exacto', durationMs: 5 }));
    aggregator.record(sample({ route: '/apenas-mas', durationMs: 5.0001 }));
    aggregator.record(sample({ route: '/ultimo', durationMs: 10000 }));
    aggregator.record(sample({ route: '/mas-lento', durationMs: 10001 }));

    const byRoute = Object.fromEntries(
      aggregator
        .drain()
        .map((p) => [p.dimensions.route, p.dimensions.latency.buckets]),
    );

    expect(byRoute['/exacto'].le5).toBe(1);
    expect(byRoute['/apenas-mas'].le5).toBe(0);
    expect(byRoute['/apenas-mas'].le10).toBe(1);
    expect(byRoute['/ultimo'].le10000).toBe(1);
    expect(byRoute['/mas-lento'].le10000).toBe(0);
    expect(byRoute['/mas-lento'].inf).toBe(1);
  });

  it('emite todas las claves del histograma, acumuladas y no decrecientes', () => {
    const aggregator = new HttpSliAggregator();
    aggregator.record(sample({ durationMs: 30 }));
    aggregator.record(sample({ durationMs: 700 }));

    const [point] = aggregator.drain();
    const values = LATENCY_BUCKET_KEYS.map(
      (key) => point.dimensions.latency.buckets[key],
    );

    expect(Object.keys(point.dimensions.latency.buckets)).toEqual([
      ...LATENCY_BUCKET_KEYS,
    ]);
    expect(values).toEqual([...values].sort((a, b) => a - b));
    expect(values[values.length - 1]).toBe(2);
  });

  it('conserva UNMATCHED y pliega a UNMATCHED lo que parece una URL real (PHI)', () => {
    const aggregator = new HttpSliAggregator();
    aggregator.record(sample({ route: UNMATCHED_ROUTE, status: 404 }));
    aggregator.record(
      sample({ route: '/patients/550e8400-e29b-41d4-a716-446655440000' }),
    );
    aggregator.record(sample({ route: '/lookup/12345678' }));
    aggregator.record(sample({ route: `/${'a'.repeat(250)}` }));
    aggregator.record(sample({ route: '' }));
    // Lo que Express entrega para una ruta inexistente cuando un middleware
    // atrapa todo (medido contra la API real: `/{*all}`).
    aggregator.record(sample({ route: '/{*all}', status: 404 }));
    aggregator.record(sample({ route: '*', status: 404 }));

    const points = aggregator.drain();

    expect(points).toHaveLength(1);
    expect(points[0].dimensions.route).toBe(UNMATCHED_ROUTE);
    expect(points[0].denominator).toBe(7);
    expect(JSON.stringify(points)).not.toMatch(/550e8400|12345678/);
  });

  it('normaliza el método y manda los desconocidos a OTHER', () => {
    const aggregator = new HttpSliAggregator();
    aggregator.record(sample({ method: 'get' }));
    aggregator.record(sample({ method: 'PROPFIND' }));
    aggregator.record(sample({ method: 'brew' }));

    const ids = aggregator.drain().map((p) => p.seriesId);

    expect(ids).toEqual(['http|GET|/x', 'http|OTHER|/x']);
  });

  it('pasado el tope de claves por minuto, lo nuevo cae en __overflow__ y lo conocido no', () => {
    const aggregator = new HttpSliAggregator();
    for (let i = 0; i < MAX_KEYS_PER_MINUTE; i += 1) {
      aggregator.record(sample({ route: `/r${i}` }));
    }
    aggregator.record(sample({ route: '/nueva' }));
    aggregator.record(sample({ route: '/otra-nueva' }));
    aggregator.record(sample({ route: '/r0' }));

    const points = aggregator.drain();
    const overflow = points.find((p) => p.dimensions.route === OVERFLOW_ROUTE);
    const known = points.find((p) => p.dimensions.route === '/r0');

    expect(points).toHaveLength(MAX_KEYS_PER_MINUTE + 1);
    expect(overflow?.denominator).toBe(2);
    expect(known?.denominator).toBe(2);
    expect(points.some((p) => p.dimensions.route === '/nueva')).toBe(false);
  });

  it('el tope es por minuto: otro minuto empieza de cero', () => {
    const aggregator = new HttpSliAggregator();
    for (let i = 0; i < MAX_KEYS_PER_MINUTE; i += 1) {
      aggregator.record(sample({ route: `/r${i}` }));
    }
    aggregator.record(
      sample({ route: '/nueva', at: new Date('2026-10-17T10:16:00.000Z') }),
    );

    const nueva = aggregator
      .drain()
      .find((p) => p.dimensions.route === '/nueva');

    expect(nueva).toBeDefined();
  });

  it('una duración inválida cuenta como 0 y no lanza', () => {
    const aggregator = new HttpSliAggregator();

    expect(() => {
      aggregator.record(sample({ durationMs: Number.NaN }));
      aggregator.record(sample({ durationMs: -5 }));
      aggregator.record(sample({ durationMs: Number.POSITIVE_INFINITY }));
    }).not.toThrow();

    const [point] = aggregator.drain();

    expect(point.dimensions.latency.sumMs).toBe(0);
    expect(point.dimensions.latency.buckets.le5).toBe(3);
  });

  it('drain vacía: el segundo volcado del mismo minuto produce filas disjuntas', () => {
    const aggregator = new HttpSliAggregator();
    aggregator.record(sample());
    const first = aggregator.drain();
    const second = aggregator.drain();
    aggregator.record(sample());
    const third = aggregator.drain();

    expect(first).toHaveLength(1);
    expect(second).toEqual([]);
    expect(aggregator.pendingGroups).toBe(0);
    expect(third).toHaveLength(1);
    // Suman 2 entre las dos filas, no 3: nada se cuenta dos veces.
    expect(first[0].denominator + third[0].denominator).toBe(2);
  });
});
