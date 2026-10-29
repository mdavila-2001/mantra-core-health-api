import { jest } from '@jest/globals';
import {
  RETIRE_SAMPLE_SIZE,
  RetireBlockerRegistry,
  SUBTREE_CTE,
} from '../../practice/services/retire-blockers';
import { CLIN } from '../clinical.concepts';
import {
  BED_OCCUPANCY_BLOCKER,
  ClinicalRetireBlockersInitializer,
} from './adt-retire-blockers';

const run = (rows: { id: string }[]) => {
  const execute: any = (jest.fn as any)().mockResolvedValue(rows);
  const context = {
    tx: { execute },
    tenantId: 't',
    rootId: 'root',
    now: new Date(),
    subtreeCte: SUBTREE_CTE,
  } as any;
  return { execute, result: BED_OCCUPANCY_BLOCKER.collect(context) };
};

describe('bloqueo de clausura por ocupación de cama', () => {
  it('sin ocupantes ni reservas no bloquea', async () => {
    const { result } = run([]);
    await expect(result).resolves.toBeNull();
  });

  it('cuenta los encuentros, da muestras acotadas y la próxima acción', async () => {
    const rows = Array.from({ length: 8 }, (_, i) => ({ id: `enc-${i}` }));
    const { result, execute } = run(rows);
    await expect(result).resolves.toEqual({
      kind: 'ACTIVE_BED_OCCUPANCY',
      count: 8,
      sampleIds: rows.slice(0, RETIRE_SAMPLE_SIZE).map((r) => r.id),
      nextAction: expect.stringContaining('egreso'),
    });
    // mira el subárbol y tanto la ocupación activa como la reserva
    const [sql, params] = execute.mock.calls[0];
    expect(sql).toContain('with recursive sub');
    expect(params).toEqual([
      'root',
      CLIN.LOCATION_ACTIVE,
      CLIN.LOCATION_RESERVED,
    ]);
  });

  it('se registra en el registro de practice sin editar su servicio', () => {
    const registry = new RetireBlockerRegistry();
    new ClinicalRetireBlockersInitializer(registry).onModuleInit();
    expect(registry.all().map((p) => p.kind)).toEqual(['ACTIVE_BED_OCCUPANCY']);
  });
});
