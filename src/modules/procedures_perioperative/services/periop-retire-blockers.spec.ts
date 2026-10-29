import { jest } from '@jest/globals';
import { CONCEPTS } from '../../../common';
import { RetireBlockerRegistry } from '../../practice/services/retire-blockers';
import { PERIOP } from '../procedures_perioperative.concepts';
import {
  PERIOP_RETIRE_BLOCKERS,
  PeriopRetireBlockersInitializer,
} from './periop-retire-blockers';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

function context(rows: { id: string }[]) {
  const execute = mockFn().mockResolvedValue(rows);
  return {
    execute,
    ctx: {
      tx: { execute } as any,
      tenantId: 'tenant-1',
      rootId: 'root-1',
      now: new Date('2030-01-07T12:00:00Z'),
      subtreeCte: 'with recursive sub as (select 1)',
    },
  };
}

describe('bloqueos de clausura de quirófanos (INV-11)', () => {
  it('se registran en el registro de practice sin editar su servicio', () => {
    const registry = new RetireBlockerRegistry();
    new PeriopRetireBlockersInitializer(registry).onModuleInit();
    expect(registry.all().map((p) => p.kind)).toEqual([
      'FUTURE_OR_CASE',
      'FUTURE_OR_BLOCK',
    ]);
  });

  it('casos vivos con ventana reservada vigente bloquean, con ejemplos y próxima acción', async () => {
    const { ctx, execute } = context([{ id: 'c1' }, { id: 'c2' }]);
    const blocker = await PERIOP_RETIRE_BLOCKERS[0].collect(ctx);

    expect(blocker).toMatchObject({
      kind: 'FUTURE_OR_CASE',
      count: 2,
      sampleIds: ['c1', 'c2'],
    });
    expect(blocker?.nextAction).toMatch(/Reubicar o cancelar/);
    const [sql, params] = execute.mock.calls[0];
    expect(sql).toContain(
      'coalesce(pc.reserved_end_at, pc.scheduled_end_at) > ?',
    );
    expect(params).toEqual([
      'root-1',
      CONCEPTS.CASE_SCHEDULED,
      CONCEPTS.CASE_READY_FOR_SURGERY,
      CONCEPTS.SURGICAL_CASE_IN_PROGRESS,
      ctx.now,
    ]);
  });

  it('bloques activos que no terminaron bloquean, acotados al tenant', async () => {
    const { ctx, execute } = context([{ id: 'b1' }]);
    const blocker = await PERIOP_RETIRE_BLOCKERS[1].collect(ctx);
    expect(blocker).toMatchObject({ kind: 'FUTURE_OR_BLOCK', count: 1 });
    expect(execute.mock.calls[0][1]).toEqual([
      'root-1',
      'tenant-1',
      PERIOP.ORB_ACTIVE,
      ctx.now,
    ]);
  });

  it('sin filas no hay bloqueo', async () => {
    const { ctx } = context([]);
    await expect(PERIOP_RETIRE_BLOCKERS[0].collect(ctx)).resolves.toBeNull();
    await expect(PERIOP_RETIRE_BLOCKERS[1].collect(ctx)).resolves.toBeNull();
  });
});
