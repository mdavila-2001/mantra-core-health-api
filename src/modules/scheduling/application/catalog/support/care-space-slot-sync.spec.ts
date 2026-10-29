import { jest } from '@jest/globals';
import { CONCEPTS } from '../../../../../common';
import { DUNIT } from '../../../../diagnostic_units/diagnostic_units.concepts';
import { PRAC } from '../../../../practice/practice.concepts';
import { CareSpaceBlockListenerRegistry } from '../../../../practice/services/care-space-block-listeners';
import { OPEN_ENDED_BLOCK_END } from '../../../domain/catalog/care-space-agenda';
import { SCHED } from '../../../domain/scheduling.concepts';
import {
  AVAILABILITY_EXCEPTION_CREATED_EVENT,
  AVAILABILITY_EXCEPTION_ENDED_EVENT,
  CARE_SPACE_BLOCK_EXCEPTION_REASON,
  CareSpaceBlockAgendaListener,
  CareSpaceSlotSync,
} from './care-space-slot-sync';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const TENANT = '11111111-1111-4111-8111-111111111111';
const SPACE = '22222222-2222-4222-8222-222222222222';
const NOW = new Date('2026-11-02T12:00:00.000Z');
const actor = { userId: 'u1', now: NOW };

function build(rowsBySql: (sql: string) => unknown[] = () => []) {
  const outbox = {
    publishDomainEvent: mockFn().mockResolvedValue({ duplicate: false }),
  };
  const tx = {
    execute: mockFn(async (sql: string) => rowsBySql(sql)),
    insert: mockFn().mockResolvedValue(undefined),
  };
  const sync = new CareSpaceSlotSync(outbox as any);
  return { sync, tx, outbox };
}

describe('CareSpaceSlotSync.closeCovered / reopenUncovered', () => {
  it('cierra los cupos libres, intactos y futuros del espacio como «cerrados por la fuente», saltando los bloqueados por otra transacción', async () => {
    const d = build(() => [{ id: 's1' }, { id: 's2' }]);
    const closed = await d.sync.closeCovered(
      d.tx as any,
      TENANT,
      { careSpaceId: SPACE },
      actor,
    );
    expect(closed).toEqual(['s1', 's2']);
    const [sql, params] = d.tx.execute.mock.calls[0];
    expect(sql).toContain('update scheduling.bookable_slots');
    expect(sql).toContain('remaining_capacity = bs.capacity');
    expect(sql).toContain('for update of bs skip locked');
    expect(sql).toContain('practice.care_space_blocks');
    expect(params).toEqual(
      expect.arrayContaining([
        SCHED.SLOT_SOURCE_CLOSED,
        CONCEPTS.SLOT_OPEN,
        TENANT,
        SPACE,
      ]),
    );
    // Los tres espacios que pueden cubrir un cupo: el del recurso, el de la plantilla y el del equipo.
    expect(params.filter((p: unknown) => p === SPACE)).toHaveLength(3);
  });

  it('reabre sólo los cerrados por la fuente que ya no están cubiertos, y sólo los futuros', async () => {
    const d = build(() => [{ id: 's1' }]);
    await d.sync.reopenUncovered(
      d.tx as any,
      TENANT,
      { equipmentId: 'eq-1' },
      actor,
    );
    const [sql, params] = d.tx.execute.mock.calls[0];
    expect(sql).toContain('not (');
    expect(sql).toContain('bs.start_at > ?');
    expect(params[0]).toBe(CONCEPTS.SLOT_OPEN);
    expect(params).toContain(SCHED.SLOT_SOURCE_CLOSED);
    expect(params).toContain('eq-1');
  });

  it('el equipo fuera de servicio cubre al cupo aunque no haya bloqueo, y la ausencia de equipo no hace que «nunca se reabra»', async () => {
    const d = build();
    await d.sync.closeCovered(
      d.tx as any,
      TENANT,
      { careSpaceId: SPACE },
      actor,
    );
    const sql: string = d.tx.execute.mock.calls[0][0];
    expect(sql).toContain(
      'coalesce(eq.operational_status_concept_id in (?, ?), false)',
    );
    expect(d.tx.execute.mock.calls[0][1]).toEqual(
      expect.arrayContaining([
        DUNIT.EQUIPMENT_MAINTENANCE,
        DUNIT.EQUIPMENT_OUT_OF_SERVICE,
      ]),
    );
  });

  it('un alcance vacío de recursos no toca nada', async () => {
    const d = build();
    await d.sync.closeCovered(d.tx as any, TENANT, { resourceIds: [] }, actor);
    expect(d.tx.execute.mock.calls[0][0]).toContain('and false');
  });
});

describe('CareSpaceSlotSync.coveredSlotIds', () => {
  it('sin cupos no consulta', async () => {
    const d = build();
    expect(await d.sync.coveredSlotIds(d.tx as any, [])).toEqual(new Set());
    expect(d.tx.execute).not.toHaveBeenCalled();
  });
  it('devuelve los cubiertos', async () => {
    const d = build(() => [{ id: 's2' }]);
    expect(await d.sync.coveredSlotIds(d.tx as any, ['s1', 's2'])).toEqual(
      new Set(['s2']),
    );
  });
});

describe('CareSpaceSlotSync.createSourceExceptions', () => {
  const input = {
    tenantId: TENANT,
    source: 'CARE_SPACE_BLOCK' as const,
    sourceRefId: 'blk-1',
    resourceIds: ['r1', 'r2'],
    startAt: NOW,
    endAt: null,
    reason: CARE_SPACE_BLOCK_EXCEPTION_REASON,
    actorUserId: 'u1',
    closedSlots: 3,
  };

  it('crea una excepción de solo lectura por recurso, con tenant, origen, sin fin y el evento con sourceKind', async () => {
    const d = build();
    const created = await d.sync.createSourceExceptions(d.tx as any, input);
    expect(created).toEqual(['r1', 'r2']);
    expect(d.tx.insert).toHaveBeenCalledTimes(2);
    expect(d.tx.insert.mock.calls[0][1]).toMatchObject({
      tenantId: TENANT,
      resourceId: 'r1',
      sourceKindConceptId: SCHED.EXC_SRC_CARE_SPACE_BLOCK,
      sourceRefId: 'blk-1',
      isAvailable: false,
      endAt: OPEN_ENDED_BLOCK_END,
      reason: 'Bloqueo del consultorio',
    });
    expect(d.outbox.publishDomainEvent).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        eventType: AVAILABILITY_EXCEPTION_CREATED_EVENT,
        payloadJson: expect.objectContaining({
          sourceKind: 'CARE_SPACE_BLOCK',
          sourceRefId: 'blk-1',
          blockedSlots: 3,
        }),
      }),
    );
  });

  it('es idempotente: la excepción que ya existe no se duplica', async () => {
    const d = build((sql) =>
      sql.includes('availability_exceptions') ? [{ id: 'ya' }] : [],
    );
    expect(await d.sync.createSourceExceptions(d.tx as any, input)).toEqual([]);
    expect(d.tx.insert).not.toHaveBeenCalled();
  });

  it('con fecha estimada de fin, la excepción termina ahí', async () => {
    const d = build();
    const end = new Date('2026-11-05T12:00:00.000Z');
    await d.sync.createSourceExceptions(d.tx as any, {
      ...input,
      endAt: end,
      resourceIds: ['r1'],
    });
    expect(d.tx.insert.mock.calls[0][1].endAt).toEqual(end);
  });
});

describe('CareSpaceSlotSync.endSourceExceptions', () => {
  it('acorta las que ya habían empezado y borra las que nunca llegaron a regir', async () => {
    const rows = [
      {
        id: 'e1',
        resource_id: 'r1',
        start_at: new Date('2026-11-01T00:00:00Z'),
      },
      {
        id: 'e2',
        resource_id: 'r2',
        start_at: new Date('2026-11-09T00:00:00Z'),
      },
    ];
    const d = build((sql) =>
      sql.startsWith('select id, resource_id') ? rows : [],
    );
    const n = await d.sync.endSourceExceptions(d.tx as any, {
      tenantId: TENANT,
      source: 'CARE_SPACE_BLOCK',
      sourceRefId: 'blk-1',
      endedAt: NOW,
      actorUserId: 'u1',
    });
    expect(n).toBe(2);
    const sqls = d.tx.execute.mock.calls.map((c: any[]) => c[0] as string);
    expect(sqls.some((q) => q.includes('set end_at = ?'))).toBe(true);
    expect(
      sqls.some((q) =>
        q.startsWith('delete from scheduling.availability_exceptions'),
      ),
    ).toBe(true);
    const events = d.outbox.publishDomainEvent.mock.calls.map(
      (c: any[]) => c[1],
    );
    expect(events.map((e: any) => e.eventType)).toEqual([
      AVAILABILITY_EXCEPTION_ENDED_EVENT,
      AVAILABILITY_EXCEPTION_ENDED_EVENT,
    ]);
    expect(events.map((e: any) => e.payloadJson.removed)).toEqual([
      false,
      true,
    ]);
  });

  it('una fuente cancelada (endedAt null) borra todas', async () => {
    const d = build((sql) =>
      sql.startsWith('select id, resource_id')
        ? [
            {
              id: 'e1',
              resource_id: 'r1',
              start_at: new Date('2026-11-01T00:00:00Z'),
            },
          ]
        : [],
    );
    await d.sync.endSourceExceptions(d.tx as any, {
      tenantId: TENANT,
      source: 'EQUIPMENT_STATUS',
      sourceRefId: 'eq-1',
      endedAt: null,
      actorUserId: null,
    });
    expect(
      d.tx.execute.mock.calls.some((c: any[]) =>
        String(c[0]).startsWith(
          'delete from scheduling.availability_exceptions',
        ),
      ),
    ).toBe(true);
  });
});

describe('CareSpaceSlotSync.unavailableWindows', () => {
  it('un bloqueo abierto del espacio vale hasta que alguien lo termine', async () => {
    const d = build((sql) =>
      sql.includes('care_space_blocks')
        ? [{ starts_at: new Date('2026-11-03T00:00:00Z') }]
        : [],
    );
    const windows = await d.sync.unavailableWindows(d.tx as any, TENANT, {
      careSpaceIds: [SPACE, null, SPACE],
      from: NOW,
      to: new Date('2026-12-01T00:00:00Z'),
    });
    expect(windows).toEqual([
      { start: new Date('2026-11-03T00:00:00Z'), end: OPEN_ENDED_BLOCK_END },
    ]);
  });

  it('un espacio que ya no está activo cierra toda la ventana', async () => {
    const d = build((sql) =>
      sql.includes('status_concept_id <> ?') ? [{ id: SPACE }] : [],
    );
    const windows = await d.sync.unavailableWindows(d.tx as any, TENANT, {
      careSpaceIds: [SPACE],
      from: NOW,
      to: new Date('2026-12-01T00:00:00Z'),
    });
    expect(windows).toEqual([{ start: NOW, end: OPEN_ENDED_BLOCK_END }]);
    const inactive = d.tx.execute.mock.calls.find((c: any[]) =>
      String(c[0]).includes('status_concept_id <> ?'),
    );
    expect(inactive[1]).toEqual([TENANT, SPACE, PRAC.SPACE_ACTIVE]);
  });

  it('un equipo en mantenimiento cierra toda la ventana y aporta su sala', async () => {
    const d = build((sql) =>
      sql.includes('from diagnostic_units.diagnostic_equipment')
        ? [
            {
              care_space_id: SPACE,
              operational_status_concept_id: DUNIT.EQUIPMENT_MAINTENANCE,
            },
          ]
        : [],
    );
    const windows = await d.sync.unavailableWindows(d.tx as any, TENANT, {
      careSpaceIds: [],
      equipmentId: 'eq-1',
      from: NOW,
      to: new Date('2026-12-01T00:00:00Z'),
    });
    expect(windows).toContainEqual({ start: NOW, end: OPEN_ENDED_BLOCK_END });
    // La sala del equipo se consulta también por bloqueos.
    expect(
      d.tx.execute.mock.calls.some((c: any[]) =>
        String(c[0]).includes('care_space_blocks'),
      ),
    ).toBe(true);
  });

  it('sin espacios ni equipo no consulta nada', async () => {
    const d = build();
    expect(
      await d.sync.unavailableWindows(d.tx as any, TENANT, {
        careSpaceIds: [null, undefined],
        from: NOW,
        to: NOW,
      }),
    ).toEqual([]);
    expect(d.tx.execute).not.toHaveBeenCalled();
  });
});

describe('CareSpaceBlockAgendaListener', () => {
  const block = (over: Record<string, unknown> = {}): any => ({
    id: 'blk-1',
    tenantId: TENANT,
    careSpaceId: SPACE,
    startsAt: NOW,
    expectedEndAt: null,
    endedAt: null,
    ...over,
  });
  const ctx = { tenantId: TENANT, actorUserId: 'u1', now: NOW };

  it('se anota en el registro de practice al arrancar', () => {
    const registry = new CareSpaceBlockListenerRegistry();
    const spy = jest.spyOn(registry, 'register');
    const listener = new CareSpaceBlockAgendaListener({} as any, registry);
    listener.onModuleInit();
    expect(spy).toHaveBeenCalledWith('scheduling', listener);
  });

  it('al crearse el bloqueo cierra los cupos y crea la excepción en cada recurso afectado, en ese orden', async () => {
    const sync = {
      closeCovered: mockFn().mockResolvedValue(['s1', 's2']),
      affectedResourceIds: mockFn().mockResolvedValue(['r1']),
      createSourceExceptions: mockFn().mockResolvedValue(['r1']),
    };
    const listener = new CareSpaceBlockAgendaListener(
      sync as any,
      new CareSpaceBlockListenerRegistry(),
    );
    await listener.afterCreated({} as any, block(), {} as any, ctx);
    expect(sync.closeCovered).toHaveBeenCalledWith(
      {},
      TENANT,
      { careSpaceId: SPACE },
      { userId: 'u1', now: NOW },
    );
    expect(sync.createSourceExceptions).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        source: 'CARE_SPACE_BLOCK',
        sourceRefId: 'blk-1',
        resourceIds: ['r1'],
        // El texto no lleva el motivo del bloqueo (puede ser clínico).
        reason: 'Bloqueo del consultorio',
        closedSlots: 2,
      }),
    );
  });

  it('al terminar acorta la excepción hasta el fin real y reabre; al cancelar, la borra', async () => {
    const sync = {
      endSourceExceptions: mockFn().mockResolvedValue(1),
      reopenUncovered: mockFn().mockResolvedValue([]),
    };
    const listener = new CareSpaceBlockAgendaListener(
      sync as any,
      new CareSpaceBlockListenerRegistry(),
    );
    const endedAt = new Date('2026-11-02T11:00:00.000Z');
    await listener.afterClosed(
      {} as any,
      block({ endedAt }),
      {} as any,
      'ENDED',
      ctx,
    );
    expect(sync.endSourceExceptions.mock.calls[0][1]).toMatchObject({
      endedAt,
    });
    await listener.afterClosed({} as any, block(), {} as any, 'CANCELLED', ctx);
    expect(sync.endSourceExceptions.mock.calls[1][1]).toMatchObject({
      endedAt: null,
    });
    expect(sync.reopenUncovered).toHaveBeenCalledTimes(2);
  });
});
