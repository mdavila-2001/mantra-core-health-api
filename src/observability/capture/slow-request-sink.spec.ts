import { OperationResolver } from './operation-resolver';
import {
  createRequestContext,
  noteSqlInRequest,
  runWithRequestContext,
} from './request-context';
import { MAX_SAMPLES_PER_MINUTE, SlowRequestSink } from './slow-request-sink';

const AT = new Date('2026-10-31T10:00:10.000Z');
const INSTANCE = '11111111-1111-4111-8111-111111111111';

function setup(random = () => 0.99) {
  const sink = new SlowRequestSink(new OperationResolver(), INSTANCE, random);
  sink.configure({ enabled: true, slowRequestMs: 2000 });
  return sink;
}

function ctx(id: unknown = 'req-1') {
  // `null` = sin identificador (pino aún no lo asignó).
  return createRequestContext(
    { method: 'GET', baseUrl: '', route: { path: '/a' }, id },
    0n,
  );
}

describe('SlowRequestSink', () => {
  it('no guarda una petición rápida y correcta', () => {
    const sink = setup();
    sink.consider(ctx(), { status: 200, durationMs: 30, at: AT });
    expect(sink.drain()).toEqual([]);
  });

  it.each([
    ['error', { status: 500, durationMs: 5 }],
    ['slow', { status: 200, durationMs: 2000 }],
  ])('guarda por %s', (because, result) => {
    const sink = setup();
    sink.consider(ctx(), { ...result, at: AT });
    expect(sink.drain()).toMatchObject([
      {
        sampledBecause: because,
        requestId: 'req-1',
        routeTemplate: '/a',
        instanceId: INSTANCE,
      },
    ]);
  });

  it('una consulta por encima de ORM_SLOW_QUERY_MS marca la petición como lenta', () => {
    const sink = setup();
    const c = ctx();
    c.slowSqlCount = 1;
    sink.consider(c, { status: 200, durationMs: 10, at: AT });
    expect(sink.drain()[0].sampledBecause).toBe('slow');
  });

  it('el 1 % aleatorio', () => {
    const sink = setup(() => 0.005);
    sink.consider(ctx(), { status: 200, durationMs: 10, at: AT });
    expect(sink.drain()[0].sampledBecause).toBe('random');
  });

  it('lleva el SQL de la petición: top 5 por tiempo, con huellas y sin texto', () => {
    const sink = setup();
    const c = ctx();
    runWithRequestContext(c, () => {
      for (let i = 0; i < 8; i += 1)
        noteSqlInRequest(`hash${i}`.padEnd(12, '0'), i + 1);
      noteSqlInRequest('hash7'.padEnd(12, '0'), 1);
    });
    sink.consider(c, { status: 200, durationMs: 3000, at: AT });
    const [row] = sink.drain();
    expect(row.sqlCount).toBe(9);
    expect(row.sqlTotalMs).toBe(37);
    expect(row.sqlTop).toHaveLength(5);
    expect(row.sqlTop[0]).toEqual({
      queryHash: 'hash70000000',
      executions: 2,
      sumMs: 9,
    });
  });

  it('sin requestId no hay muestra; requestId numérico se vuelve texto', () => {
    const sink = setup();
    sink.consider(ctx(null), { status: 500, durationMs: 1, at: AT });
    sink.consider(ctx(42), { status: 500, durationMs: 1, at: AT });
    expect(sink.drain().map((r) => r.requestId)).toEqual(['42']);
  });

  it('tope de muestras por minuto', () => {
    const sink = setup();
    for (let i = 0; i < MAX_SAMPLES_PER_MINUTE + 3; i += 1) {
      sink.consider(ctx(`r${i}`), { status: 500, durationMs: 1, at: AT });
    }
    expect(sink.drain()).toHaveLength(MAX_SAMPLES_PER_MINUTE);
    expect(sink.overCapSamples).toBe(3);
  });

  it('apagado no guarda', () => {
    const sink = new SlowRequestSink(new OperationResolver(), INSTANCE);
    sink.consider(ctx(), { status: 500, durationMs: 1, at: AT });
    expect(sink.drain()).toEqual([]);
  });
});
