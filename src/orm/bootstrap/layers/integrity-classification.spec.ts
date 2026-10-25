import { jest } from '@jest/globals';
import type { DdlLayerContext } from '../ddl-layer.contract';
import { foreignKeysLayer } from './06-foreign-keys.layer';
import { indexesLayer } from './05-indexes.layer';

/** Contexto sin base: no hay nada creado y `execute` falla según el predicado. */
function context(failWhen: (sql: string) => boolean) {
  const execute = jest.fn(async (sql: string) => {
    if (failWhen(sql)) throw new Error('violates constraint (sintético)');
  });
  const ctx = {
    mode: 'safe',
    logger: { log: jest.fn(), warn: jest.fn(), error: jest.fn() },
    execute,
    query: jest.fn(async () => []),
  } as unknown as DdlLayerContext;
  return { ctx, execute };
}

describe('clasificación de incidencias del bootstrap (ORMN-01)', () => {
  it('base vacía y todo aplicable: sin incidencias ni bloqueantes', async () => {
    const { ctx } = context(() => false);
    const fks = await foreignKeysLayer.apply(ctx);
    const idx = await indexesLayer.apply(ctx);
    expect(fks.failures).toHaveLength(0);
    expect(fks.blocking).toHaveLength(0);
    expect(idx.failures).toHaveLength(0);
    expect(idx.blocking).toHaveLength(0);
  });

  it('una FK que no se puede crear es bloqueante', async () => {
    const { ctx } = context((sql) => sql.includes('FOREIGN KEY'));
    const result = await foreignKeysLayer.apply(ctx);
    expect(result.failures.length).toBeGreaterThan(0);
    expect(result.blocking).toEqual(result.failures);
  });

  it('un índice único que falla es bloqueante; uno de rendimiento sólo degrada', async () => {
    const { ctx } = context((sql) => sql.includes('UNIQUE INDEX'));
    const unique = await indexesLayer.apply(ctx);
    expect(unique.blocking?.length).toBeGreaterThan(0);
    expect(unique.failures).toEqual(unique.blocking);

    const { ctx: perfCtx } = context(
      (sql) => !sql.includes('UNIQUE INDEX') && sql.includes('CREATE INDEX'),
    );
    const perf = await indexesLayer.apply(perfCtx);
    expect(perf.failures.length).toBeGreaterThan(0);
    expect(perf.blocking).toHaveLength(0);
  });

  it('los lotes de únicos y de rendimiento no se mezclan', async () => {
    const { ctx, execute } = context(() => false);
    await indexesLayer.apply(ctx);
    for (const [sql] of execute.mock.calls) {
      const statements = sql.split(';\n');
      const unique = statements.filter((s) => s.startsWith('CREATE UNIQUE'));
      expect(unique.length === 0 || unique.length === statements.length).toBe(
        true,
      );
    }
  });
});
