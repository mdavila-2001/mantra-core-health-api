import { jest } from '@jest/globals';
import { CONCEPTS } from '../../../../common';
import { CLIN } from '../../../clinical/clinical.concepts';
import { RetireBlockerRegistry } from '../../../practice/services/retire-blockers';
import {
  AGENDA_RETIRE_BLOCKERS,
  AgendaRetireBlockersInitializer,
} from './practice-retire-blockers.adapter';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
const NOW = new Date('2026-11-02T12:00:00Z');
const TENANT = 't1';

function context(rows: Record<string, unknown>[] = []) {
  const execute = mockFn().mockResolvedValue(rows);
  return {
    execute,
    ctx: {
      tx: { execute } as any,
      tenantId: TENANT,
      rootId: 'root',
      now: NOW,
      subtreeCte: 'with recursive sub as (select 1)',
    },
  };
}

describe('bloqueos de clausura de la agenda', () => {
  const [bookings, schedules] = AGENDA_RETIRE_BLOCKERS;

  it('son FUTURE_BOOKING y PUBLISHED_SCHEDULE', () => {
    expect(AGENDA_RETIRE_BLOCKERS.map((b) => b.kind)).toEqual([
      'FUTURE_BOOKING',
      'PUBLISHED_SCHEDULE',
    ]);
  });

  it('sin citas futuras no hay bloqueo', async () => {
    const { ctx } = context([]);
    expect(await bookings.collect(ctx)).toBeNull();
  });

  it('las citas pendientes, reservadas o en curso del subárbol bloquean, con ejemplos y próxima acción', async () => {
    const { ctx, execute } = context([{ id: 'a1' }, { id: 'a2' }]);
    const res = await bookings.collect(ctx);
    expect(res).toEqual({
      kind: 'FUTURE_BOOKING',
      count: 2,
      sampleIds: ['a1', 'a2'],
      nextAction: expect.stringMatching(/Reprogramar o cancelar/),
    });
    const [sql, params] = execute.mock.calls[0];
    expect(sql).toContain('clinical.appointments');
    // Sigue viendo las reservas anteriores a F5d, que el bloqueo de practice miraba.
    expect(sql).toContain('scheduling.availability_slots');
    expect(params).toEqual([
      'root',
      TENANT,
      CLIN.APPOINTMENT_PENDING,
      CLIN.APPOINTMENT_BOOKED,
      CLIN.APPOINTMENT_CHECKED_IN,
      NOW,
      NOW,
    ]);
  });

  it('las plantillas publicadas del espacio bloquean (las retiradas no)', async () => {
    const { ctx, execute } = context([{ id: 'tpl-1' }]);
    const res = await schedules.collect(ctx);
    expect(res).toMatchObject({
      kind: 'PUBLISHED_SCHEDULE',
      count: 1,
      sampleIds: ['tpl-1'],
    });
    expect(execute.mock.calls[0][1]).toEqual([
      'root',
      TENANT,
      CONCEPTS.TEMPLATE_PUBLISHED,
    ]);
  });

  it('trunca los ejemplos pero cuenta todos', async () => {
    const rows = Array.from({ length: 9 }, (_, i) => ({ id: `a${i}` }));
    const { ctx } = context(rows);
    const res = await bookings.collect(ctx);
    expect(res?.count).toBe(9);
    expect(res?.sampleIds).toHaveLength(5);
  });

  it('el inicializador los registra en el registro de practice, reemplazando el FUTURE_BOOKING anterior', () => {
    const registry = new RetireBlockerRegistry();
    registry.register({ kind: 'FUTURE_BOOKING', collect: async () => null });
    new AgendaRetireBlockersInitializer(registry).onModuleInit();
    const kinds = registry.all().map((p) => p.kind);
    expect(kinds.filter((k) => k === 'FUTURE_BOOKING')).toHaveLength(1);
    expect(kinds).toContain('PUBLISHED_SCHEDULE');
    expect(registry.all().find((p) => p.kind === 'FUTURE_BOOKING')).toBe(
      bookings,
    );
  });
});
