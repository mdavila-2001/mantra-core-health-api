import {
  BUILT_IN_RETIRE_BLOCKERS,
  PracticeRetireBlockersInitializer,
  RETIRE_SAMPLE_SIZE,
  RetireBlockerRegistry,
  SUBTREE_CTE,
} from './retire-blockers';
import { TENANT_A, mockFn } from './infrastructure.testing';

describe('registro de bloqueos de clausura', () => {
  it('registra por kind (el segundo reemplaza al primero) y conserva el orden de alta', () => {
    const registry = new RetireBlockerRegistry();
    registry.register({ kind: 'A', collect: async () => null });
    registry.register({ kind: 'B', collect: async () => null });
    const reemplazo = { kind: 'A', collect: async () => null };
    registry.register(reemplazo);
    expect(registry.all().map((p) => p.kind)).toEqual(['A', 'B']);
    expect(registry.all()[0]).toBe(reemplazo);
  });

  it('el inicializador de practice registra los siete bloqueos propios', () => {
    const registry = new RetireBlockerRegistry();
    new PracticeRetireBlockersInitializer(registry).onModuleInit();
    expect(registry.all().map((p) => p.kind)).toEqual([
      'ACTIVE_CHILDREN',
      'ACTIVE_ENCOUNTER',
      'FUTURE_PROCEDURE',
      'FUTURE_BOOKING',
      'SCHEDULABLE_RESOURCE',
      'INVENTORY_LOCATION',
      'EQUIPMENT',
    ]);
  });
});

describe('proveedores propios', () => {
  const context = (rows: Array<{ id: string }>) => {
    const execute = mockFn().mockResolvedValue(rows);
    return {
      execute,
      ctx: {
        tx: { execute } as any,
        tenantId: TENANT_A,
        rootId: 'root-1',
        now: new Date('2026-10-29T10:00:00Z'),
        subtreeCte: SUBTREE_CTE,
      },
    };
  };

  it.each(BUILT_IN_RETIRE_BLOCKERS.map((p) => [p.kind, p] as const))(
    '%s: sin filas no hay bloqueo',
    async (_kind, provider) => {
      const { ctx } = context([]);
      await expect(provider.collect(ctx)).resolves.toBeNull();
    },
  );

  it.each(BUILT_IN_RETIRE_BLOCKERS.map((p) => [p.kind, p] as const))(
    '%s: con filas devuelve count, ejemplos acotados y próxima acción',
    async (kind, provider) => {
      const rows = Array.from({ length: RETIRE_SAMPLE_SIZE + 3 }, (_v, i) => ({
        id: `id-${i}`,
      }));
      const { ctx, execute } = context(rows);
      const blocker = await provider.collect(ctx);
      expect(blocker).toMatchObject({
        kind,
        count: RETIRE_SAMPLE_SIZE + 3,
        nextAction: expect.any(String),
      });
      expect(blocker!.sampleIds).toHaveLength(RETIRE_SAMPLE_SIZE);
      // Todas las consultas anteponen el subárbol y le pasan la raíz como primer parámetro.
      const [sql, params] = execute.mock.calls[0];
      expect(sql.startsWith(SUBTREE_CTE)).toBe(true);
      expect(params[0]).toBe('root-1');
      expect(sql).not.toMatch(/delete|update |insert /i);
    },
  );

  it('la cirugía futura excluye las canceladas y completadas y mira la fecha de hoy', async () => {
    const { ctx, execute } = context([{ id: 'pc-1' }]);
    const provider = BUILT_IN_RETIRE_BLOCKERS.find(
      (p) => p.kind === 'FUTURE_PROCEDURE',
    )!;
    await provider.collect(ctx);
    const [sql, params] = execute.mock.calls[0];
    expect(sql).toContain('scheduled_start_at > ?');
    expect(sql).toContain('status_concept_id not in');
    expect(params).toContain(ctx.now);
  });
});
