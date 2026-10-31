import { HttpSink, exactStatus } from './http-sink';
import { OperationResolver } from './operation-resolver';

const T0 = new Date('2026-10-31T10:00:10.000Z');
const T0_NEXT_MINUTE = new Date('2026-10-31T10:01:05.000Z');

function sample(
  status: number,
  route = '/admin/ops/slos',
  at = T0,
  durationMs = 12,
  method = 'GET',
) {
  return { method, route, status, durationMs, at };
}

function newSink() {
  const resolver = new OperationResolver();
  resolver.setRouteLookup((method, template) =>
    method === 'GET' && template === '/admin/ops/slos'
      ? { operationId: 'OpsConsoleController_slos' }
      : null,
  );
  resolver.setCatalog([
    {
      operationKey: 'OpsConsoleController_slos',
      httpMethod: 'GET',
      routeTemplate: '/admin/ops/slos',
      moduleCode: 'ops_console',
    },
  ]);
  const sink = new HttpSink(resolver);
  sink.setEnabled(true);
  return sink;
}

describe('HttpSink', () => {
  it('apagado no captura nada', () => {
    const sink = new HttpSink();
    sink.record(sample(200));
    expect(sink.pendingGroups).toBe(0);
    expect(sink.drain()).toEqual([]);
  });

  it('cuenta exacto por (método, plantilla, código): 404 y 422 son filas distintas', () => {
    const sink = newSink();
    for (let i = 0; i < 37; i += 1) sink.record(sample(200));
    for (let i = 0; i < 11; i += 1) sink.record(sample(422));
    for (let i = 0; i < 7; i += 1) sink.record(sample(404, 'UNMATCHED'));
    const rows = sink.drain();
    const by = (status: number, route: string) =>
      rows.find((r) => r.httpStatus === status && r.routeTemplate === route);
    expect(by(200, '/admin/ops/slos')?.requests).toBe(37);
    expect(by(422, '/admin/ops/slos')?.requests).toBe(11);
    expect(by(404, 'UNMATCHED')?.requests).toBe(7);
    expect(rows.reduce((n, r) => n + r.requests, 0)).toBe(55);
  });

  it('resuelve operation_key y module_code al drenar; sin catálogo, UNKNOWN', () => {
    const sink = newSink();
    sink.record(sample(200));
    sink.record(sample(200, '/otra/ruta'));
    sink.record(sample(404, 'UNMATCHED'));
    const rows = sink.drain();
    const known = rows.find((r) => r.routeTemplate === '/admin/ops/slos');
    expect(known).toMatchObject({
      operationKey: 'OpsConsoleController_slos',
      moduleCode: 'ops_console',
    });
    expect(rows.find((r) => r.routeTemplate === '/otra/ruta')).toMatchObject({
      operationKey: null,
      moduleCode: 'UNKNOWN',
    });
    expect(rows.find((r) => r.routeTemplate === 'UNMATCHED')).toMatchObject({
      operationKey: null,
      moduleCode: 'UNKNOWN',
    });
  });

  it('el histograma es acumulado y `requests` es el cubo +Inf', () => {
    const sink = newSink();
    for (const ms of [3, 7, 30, 20000]) sink.record(sample(200, '/a', T0, ms));
    const [row] = sink.drain();
    expect(row.requests).toBe(4);
    // le5, le10, le25, le50, le100 … le10000
    expect(row.buckets).toEqual([1, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3]);
    expect(row.maxMs).toBe(20000);
    expect(row.sumMs).toBe(3 + 7 + 30 + 20000);
  });

  it('flush_seq: el mismo minuto vuelca con 1, 2, 3…; otro minuto empieza en 1', () => {
    const sink = newSink();
    sink.record(sample(200));
    expect(sink.drain().map((r) => r.flushSeq)).toEqual([1]);
    sink.record(sample(200));
    sink.record(sample(500));
    expect(sink.drain().map((r) => r.flushSeq)).toEqual([2, 2]);
    sink.record(sample(200, '/admin/ops/slos', T0_NEXT_MINUTE));
    expect(sink.drain().map((r) => r.flushSeq)).toEqual([1]);
  });

  it('un volcado vacío no consume flush_seq', () => {
    const sink = newSink();
    expect(sink.drain()).toEqual([]);
    sink.record(sample(200));
    expect(sink.drain()[0].flushSeq).toBe(1);
  });

  it('las claves de un lote son únicas (PK de la tabla)', () => {
    const sink = newSink();
    for (const status of [200, 200, 404, 422, 404]) sink.record(sample(status));
    const keys = sink
      .drain()
      .map((r) =>
        [
          r.time.toISOString(),
          r.flushSeq,
          r.httpMethod,
          r.routeTemplate,
          r.httpStatus,
        ].join('|'),
      );
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('pliega una ruta con UUID a UNMATCHED y acota la cardinalidad', () => {
    const sink = newSink();
    sink.record(sample(200, '/patients/0b9f6a1e-1111-4222-8333-444455556666'));
    for (let i = 0; i < 2100; i += 1) sink.record(sample(200, `/r${i}`));
    const rows = sink.drain();
    expect(rows.some((r) => r.routeTemplate.includes('0b9f6a1e'))).toBe(false);
    expect(rows.some((r) => r.routeTemplate === '__overflow__')).toBe(true);
    expect(rows.reduce((n, r) => n + r.requests, 0)).toBe(2101);
  });

  it('un método desconocido no crea series nuevas', () => {
    const sink = newSink();
    sink.record(sample(200, '/a', T0, 1, 'BREW'));
    expect(sink.drain()[0].httpMethod).toBe('OTHER');
  });

  it('exactStatus: fuera de 100–599 cuenta como 0', () => {
    expect(exactStatus(404)).toBe(404);
    expect(exactStatus(99)).toBe(0);
    expect(exactStatus(600)).toBe(0);
    expect(exactStatus(Number.NaN)).toBe(0);
  });

  it('record nunca lanza', () => {
    const sink = newSink();
    expect(() =>
      sink.record({
        method: undefined as never,
        route: undefined as never,
        status: 200,
        durationMs: 1,
        at: undefined as never,
      }),
    ).not.toThrow();
  });
});
