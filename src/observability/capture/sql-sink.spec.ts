import { OperationResolver } from './operation-resolver';
import {
  MAX_SQL_HASHES_PER_MINUTE,
  SQL_OVERFLOW_HASH,
  SqlSink,
  isSelfSql,
  primaryTableOf,
} from './sql-sink';
import { createRequestContext, runWithRequestContext } from './request-context';

const AT = new Date('2026-10-31T10:00:10.000Z');

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
  const sink = new SqlSink(resolver);
  sink.setEnabled(true);
  return sink;
}

const select = (id: string) =>
  `select "s0".* from "platform_ops"."service_level_objectives" as "s0" where "s0"."id" = '${id}'`;

describe('SqlSink', () => {
  it('apagado no captura', () => {
    const sink = new SqlSink();
    sink.record(select('a'), 5, { slow: false });
    expect(sink.drain()).toEqual({ series: [], statements: [] });
  });

  it('dos ejecuciones con literales distintos comparten huella y el SQL guardado no lleva parámetros', () => {
    const sink = newSink();
    sink.record(
      select('11111111-1111-4111-8111-111111111111'),
      3,
      { slow: false },
      AT,
    );
    sink.record(
      select('22222222-2222-4222-8222-222222222222'),
      9,
      { slow: true },
      AT,
    );
    const { series, statements } = sink.drain();
    expect(series).toHaveLength(1);
    expect(series[0]).toMatchObject({
      executions: 2,
      sumMs: 12,
      maxMs: 9,
      slowCount: 1,
      failedCount: 0,
      operationKey: 'UNKNOWN',
    });
    expect(statements).toHaveLength(1);
    expect(statements[0].normalizedSql).toContain('where "s0"."id" = ?');
    expect(JSON.stringify({ series, statements })).not.toContain('11111111');
    expect(statements[0]).toMatchObject({
      statementClass: 'select',
      primaryTable: 'platform_ops.service_level_objectives',
      slowEver: true,
    });
  });

  it('atribuye la consulta a la operación de la petición en curso', () => {
    const sink = newSink();
    const ctx = createRequestContext(
      { method: 'GET', baseUrl: '', route: { path: '/admin/ops/slos' } },
      0n,
    );
    runWithRequestContext(ctx, () => {
      sink.record(select('a'), 4, { slow: true }, AT);
    });
    const [row] = sink.drain().series;
    expect(row).toMatchObject({
      operationKey: 'OpsConsoleController_slos',
      moduleCode: 'ops_console',
      slowCount: 1,
    });
    // La petición recuerda la huella y cuenta la consulta lenta.
    expect(ctx.sqlCount).toBe(1);
    expect(ctx.slowSqlCount).toBe(1);
    expect([...ctx.sql.keys()]).toEqual([row.queryHash]);
  });

  it('histograma acumulado de 10 cortes + inf; fallidas y filas', () => {
    const sink = newSink();
    for (const ms of [0, 0.5, 3, 40, 9000]) {
      sink.record(select('a'), ms, { slow: false, rows: 2 }, AT);
    }
    sink.record(select('a'), 2, { slow: false, failed: true }, AT);
    const [row] = sink.drain().series;
    expect(row.buckets).toEqual([2, 4, 4, 4, 5, 5, 5, 5, 5, 5, 6]);
    expect(row.buckets).toHaveLength(11);
    expect(row.executions).toBe(6);
    expect(row.failedCount).toBe(1);
    expect(row.rowsSum).toBe(10);
  });

  it('flush_seq por minuto como en HttpSink', () => {
    const sink = newSink();
    sink.record(select('a'), 1, { slow: false }, AT);
    expect(sink.drain().series[0].flushSeq).toBe(1);
    sink.record(select('a'), 1, { slow: false }, AT);
    expect(sink.drain().series[0].flushSeq).toBe(2);
  });

  it('no mide su propio SQL (observability.*) ni el contexto de RLS', () => {
    const sink = newSink();
    sink.record(
      'insert into observability.error_events (id) values (1)',
      1,
      { slow: false },
      AT,
    );
    sink.record(
      'select "o".* from "observability"."instances" as "o"',
      1,
      { slow: false },
      AT,
    );
    sink.record(
      "select set_config('app.system_context', 'true', true)",
      1,
      { slow: false },
      AT,
    );
    expect(sink.drain()).toEqual({ series: [], statements: [] });
    expect(isSelfSql('select 1 from iam.users')).toBe(false);
  });

  it(`acota la cardinalidad: la huella ${MAX_SQL_HASHES_PER_MINUTE + 1} cae en ${SQL_OVERFLOW_HASH}`, () => {
    const sink = newSink();
    for (let i = 0; i < MAX_SQL_HASHES_PER_MINUTE + 5; i += 1) {
      sink.record(`select col_${i} from t`, 1, { slow: false }, AT);
    }
    const { series } = sink.drain();
    expect(series.some((r) => r.queryHash === SQL_OVERFLOW_HASH)).toBe(true);
    expect(series.reduce((n, r) => n + r.executions, 0)).toBe(
      MAX_SQL_HASHES_PER_MINUTE + 5,
    );
  });

  it('primaryTableOf es conservador', () => {
    expect(primaryTableOf('select * from "iam"."users" where id = ?')).toBe(
      'iam.users',
    );
    expect(primaryTableOf('insert into audit.audit_log (a) values (?)')).toBe(
      'audit.audit_log',
    );
    expect(primaryTableOf('update clinical.encounters set a = ?')).toBe(
      'clinical.encounters',
    );
    expect(primaryTableOf('select 1')).toBeNull();
    expect(primaryTableOf('select * from users')).toBeNull();
  });

  it('record nunca lanza', () => {
    const sink = newSink();
    expect(() =>
      sink.record(undefined as never, Number.NaN, { slow: false }),
    ).not.toThrow();
  });
});
