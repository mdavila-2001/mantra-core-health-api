import { jest } from '@jest/globals';
import { Logger as NestLogger } from '@nestjs/common';
import { OrmLogger, isRawSqlLoggingAllowed } from './orm.logger';
import { QueryMetrics } from './query-metrics';
import {
  normalizeSql,
  redactDriverMessage,
  sqlShapeHash,
  statementClass,
} from './sql-redaction';

const MARKER = 'MARCADOR-SENSIBLE-9931';

describe('OrmLogger (ORMN-02)', () => {
  const saved = { ...process.env };
  let sink: unknown[];

  beforeEach(() => {
    sink = [];
    for (const level of ['warn', 'debug', 'log', 'error'] as const) {
      jest.spyOn(NestLogger.prototype, level).mockImplementation(((
        message: unknown,
      ) => {
        sink.push(message);
      }) as never);
    }
    delete process.env.ORM_LOG_SQL;
    process.env.NODE_ENV = 'test';
  });
  afterEach(() => {
    jest.restoreAllMocks();
    process.env = { ...saved };
  });

  const build = (slowMs = 200, debug = false) =>
    new OrmLogger(
      { debugMode: debug ? ['query'] : false } as never,
      slowMs,
      new QueryMetrics(),
    );
  const serialized = () => JSON.stringify(sink);

  it('SELECT lento sintético: clase, hash y duración presentes, sin SQL', () => {
    build().logQuery({
      query: `select * from iam.users where email = '${MARKER}@x.test'`,
      took: 350,
      results: 1,
    } as never);

    expect(sink).toHaveLength(1);
    expect(sink[0]).toMatchObject({
      msg: 'consulta lenta',
      tookMs: 350,
      statement: 'select',
      queryHash: expect.stringMatching(/^[0-9a-f]{12}$/),
    });
    expect(serialized()).not.toContain(MARKER);
    expect(sink[0]).not.toHaveProperty('query');
  });

  it('umbral exacto: una sola clasificación (lenta), no dos entradas', () => {
    build(200).logQuery({ query: 'select 1', took: 200 } as never);
    build(200).logQuery({ query: 'select 1', took: 199 } as never);
    expect(sink).toHaveLength(1);
    expect(sink[0]).toMatchObject({ msg: 'consulta lenta' });
  });

  it('debug no vuelca el SQL salvo ORM_LOG_SQL=true fuera de producción', () => {
    const sql = `insert into t (a) values ('${MARKER}')`;
    build(200, true).logQuery({ query: sql, took: 1 } as never);
    expect(serialized()).not.toContain(MARKER);

    sink.length = 0;
    process.env.ORM_LOG_SQL = 'true';
    build(200, true).logQuery({ query: sql, took: 1 } as never);
    expect(serialized()).toContain(MARKER);
  });

  it('ORM_LOG_SQL=true es ignorado en producción', () => {
    process.env.NODE_ENV = 'production';
    process.env.ORM_LOG_SQL = 'true';
    expect(isRawSqlLoggingAllowed()).toBe(false);
    build().logQuery({
      query: `select '${MARKER}'`,
      took: 999,
    } as never);
    expect(serialized()).not.toContain(MARKER);
  });

  it('warn/error del ORM con SQL, valores y DETAIL: el marcador no sale', () => {
    const logger = build();
    logger.error(
      'query',
      `insert into iam.users (email) values ('${MARKER}') - duplicate key\nDETAIL: Key (email)=(${MARKER}) already exists.`,
    );
    logger.warn('query', `update x set a = '${MARKER}'`);
    logger.error(
      'query',
      `duplicate key value violates unique constraint "uq" Key (email)=(${MARKER}) already exists`,
    );
    expect(sink).toHaveLength(3);
    expect(serialized()).not.toContain(MARKER);
  });
});

describe('sql-redaction (ORMN-02)', () => {
  it('statementClass clasifica por verbo', () => {
    expect(statementClass('  SELECT 1')).toBe('select');
    expect(statementClass('with a as (select 1) select * from a')).toBe(
      'select',
    );
    expect(statementClass('insert into t values (1)')).toBe('insert');
    expect(statementClass('alter table t add c int')).toBe('ddl');
    expect(statementClass('begin')).toBe('other');
  });

  it('el hash depende de la forma, no de los valores', () => {
    const a = sqlShapeHash(`select * from t where id = 'aaa' and n = 1`);
    const b = sqlShapeHash(`select * from t where id = 'bbb' and n = 22`);
    const c = sqlShapeHash(`select * from t where id = 'aaa'`);
    expect(a).toBe(b);
    expect(a).not.toBe(c);
    expect(normalizeSql(`where x in (1, 2, 3)`)).toBe('where x in (?)');
  });

  it('redactDriverMessage acota la longitud', () => {
    expect(redactDriverMessage('x'.repeat(1000)).length).toBeLessThanOrEqual(
      301,
    );
  });
});
