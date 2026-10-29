import { jest } from '@jest/globals';
import { CONCEPTS } from '../../../common';
import { runWithTenant } from '../../../common/tenant/tenant-context';
import { PERIOP } from '../procedures_perioperative.concepts';
import { ProceduresPerioperativeErrorReason as Reason } from '../procedures_perioperative.error-reasons';
import {
  MAX_BLOCK_INSTANCES,
  PeriopBlocksService,
} from './periop-blocks.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
const TENANT = '11111111-1111-4111-8111-111111111111';
const SITE = '33333333-3333-4333-8333-333333333333';
const ROOM = '44444444-4444-4444-4444-444444444444';
const UNIT = '55555555-5555-4555-8555-555555555555';
const SURGEON = '66666666-6666-4666-8666-666666666666';
const TRAUMA = '77777777-7777-4777-8777-777777777777';
const actor = {
  id: 'user-1',
  roles: ['PERIOP_ADMIN'],
  practitionerProfileId: undefined,
} as any;

const FUTURE = '2030-01-07'; // lunes 2030-01-07 en La Paz (UTC−4)
const iso = (date: string, hhmm: string) => `${date}T${hhmm}:00-04:00`;

function block(over: Record<string, unknown> = {}): any {
  return {
    id: 'blk-1',
    tenantId: TENANT,
    operatingRoomId: ROOM,
    ownerKindConceptId: PERIOP.ORB_OWNER_SERVICE,
    surgicalSpecialtyConceptId: TRAUMA,
    startsAt: new Date('2030-01-07T12:00:00Z'),
    endsAt: new Date('2030-01-07T18:00:00Z'),
    releaseAt: new Date('2030-01-04T12:00:00Z'),
    statusConceptId: PERIOP.ORB_ACTIVE,
    updatedAt: new Date(),
    ...over,
  };
}

function build() {
  const tx = {
    flush: mockFn(),
    findOne: mockFn().mockResolvedValue(null),
    find: mockFn().mockResolvedValue([]),
    execute: mockFn().mockResolvedValue([{ profile_id: SURGEON }]),
  };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const created: any[] = [];
  const repo = {
    createSeries: mockFn((_tx: unknown, d: any) => ({ id: 'series-1', ...d })),
    createBlock: mockFn((_tx: unknown, d: any) => {
      const b = {
        id: `blk-${created.length + 1}`,
        ...d,
        updatedAt: new Date(),
      };
      created.push(b);
      return b;
    }),
    findOverlapping: mockFn().mockResolvedValue([]),
    findBlockForUpdate: mockFn(),
    findSeriesForUpdate: mockFn(),
    findLiveCasesInBlock: mockFn().mockResolvedValue([]),
    findReleasable: mockFn().mockResolvedValue([]),
    findSeriesInstances: mockFn().mockResolvedValue([]),
    list: mockFn().mockResolvedValue([]),
  };
  const casesRepo = {
    createUtilizationEvent: mockFn(),
    findCasesOfBlocks: mockFn().mockResolvedValue([]),
    findCasesInWindow: mockFn().mockResolvedValue([]),
  };
  const site = {
    id: SITE,
    timeZone: 'America/La_Paz',
    practiceId: 'practice-1',
  };
  const space = { id: ROOM, practiceSiteId: SITE };
  const rooms = { resolveRoom: mockFn().mockResolvedValue({ space, site }) };
  const access = {
    loadSite: mockFn().mockResolvedValue(site),
    loadRoom: mockFn().mockResolvedValue({ space, site }),
    assertCan: mockFn().mockResolvedValue(undefined),
    can: mockFn().mockResolvedValue(true),
  };
  const outbox = { publishDomainEvent: mockFn().mockResolvedValue({}) };
  const history = { append: mockFn().mockResolvedValue(undefined) };
  const logger = { setContext: mockFn(), info: mockFn() };
  const service = new PeriopBlocksService(
    em as any,
    repo as any,
    casesRepo as any,
    rooms as any,
    access as any,
    outbox as any,
    history as any,
    logger as any,
  );
  const inTenant = <T>(fn: () => T): T => runWithTenant(TENANT, fn);
  return {
    service,
    tx,
    repo,
    casesRepo,
    rooms,
    access,
    outbox,
    history,
    created,
    inTenant,
    site,
  };
}

const dto = (over: Record<string, unknown> = {}): any => ({
  operatingRoomId: ROOM,
  ownerKind: 'SERVICE',
  surgicalSpecialtyConceptId: TRAUMA,
  startsAt: iso(FUTURE, '08:00'),
  endsAt: iso(FUTURE, '14:00'),
  ...over,
});

describe('PeriopBlocksService.createBlocks', () => {
  it('un bloque suelto: sin serie, con liberación de 72 h por omisión, historia y un evento', async () => {
    const d = build();
    const res = await d.inTenant(() =>
      d.service.createBlocks(SITE, dto(), actor, 'req-1'),
    );

    expect(res.seriesId).toBeUndefined();
    expect(res.blocks).toHaveLength(1);
    expect(d.repo.createSeries).not.toHaveBeenCalled();
    const [, data] = d.repo.createBlock.mock.calls[0];
    expect(data.startsAt).toEqual(new Date('2030-01-07T12:00:00Z'));
    expect(data.endsAt).toEqual(new Date('2030-01-07T18:00:00Z'));
    expect(data.releaseAt).toEqual(new Date('2030-01-04T12:00:00Z')); // 72 h antes
    expect(data.statusConceptId).toBe(PERIOP.ORB_ACTIVE);
    expect(d.history.append).toHaveBeenCalledWith(
      d.tx,
      'operating_room_blocks',
      expect.any(String),
      expect.objectContaining({ firstRevision: true, tenantId: TENANT }),
    );
    expect(d.outbox.publishDomainEvent).toHaveBeenCalledTimes(1);
    expect(d.outbox.publishDomainEvent.mock.calls[0][1]).toMatchObject({
      eventType: 'periop.or_block.created',
      tenantId: TENANT,
    });
  });

  it('autoriza como jefe de quirófano ANTES de validar la sala y escribe nada si no puede', async () => {
    const d = build();
    d.access.assertCan.mockRejectedValue(
      Object.assign(new Error('403'), { status: 403 }),
    );
    await expect(
      d.inTenant(() => d.service.createBlocks(SITE, dto(), actor)),
    ).rejects.toMatchObject({ status: 403 });
    expect(d.access.assertCan).toHaveBeenCalledWith(
      d.tx,
      actor,
      'OR_BLOCK_MANAGE',
      expect.anything(),
    );
    expect(d.rooms.resolveRoom).not.toHaveBeenCalled();
    expect(d.repo.createBlock).not.toHaveBeenCalled();
  });

  it('una sede de otro tenant o un quirófano inexistente → 404 sin escribir', async () => {
    const d = build();
    d.access.loadSite.mockResolvedValue(null);
    await expect(
      d.inTenant(() => d.service.createBlocks(SITE, dto(), actor)),
    ).rejects.toMatchObject({ status: 404 });
    d.access.loadSite.mockResolvedValue(d.site);
    d.access.loadRoom.mockResolvedValue(null);
    await expect(
      d.inTenant(() => d.service.createBlocks(SITE, dto(), actor)),
    ).rejects.toMatchObject({ status: 404 });
    expect(d.repo.createBlock).not.toHaveBeenCalled();
  });

  it('la serie semanal: lunes y miércoles durante tres semanas en hora de La Paz, 0 = domingo', async () => {
    const d = build();
    const res = await d.inTenant(() =>
      d.service.createBlocks(
        SITE,
        dto({ recurrence: { weekdays: [1, 3], until: '2030-01-21' } }),
        actor,
      ),
    );
    expect(res.seriesId).toBe('series-1');
    // lun 7, mié 9, lun 14, mié 16, lun 21
    expect(d.created.map((b) => b.startsAt.toISOString())).toEqual([
      '2030-01-07T12:00:00.000Z',
      '2030-01-09T12:00:00.000Z',
      '2030-01-14T12:00:00.000Z',
      '2030-01-16T12:00:00.000Z',
      '2030-01-21T12:00:00.000Z',
    ]);
    const [, series] = d.repo.createSeries.mock.calls[0];
    expect(series).toMatchObject({
      weekdays: [1, 3],
      startTime: '08:00:00',
      endTime: '14:00:00',
      releaseHours: 72,
    });
    expect(d.created.every((b) => b.seriesId === 'series-1')).toBe(true);
    expect(d.outbox.publishDomainEvent).toHaveBeenCalledTimes(1);
  });

  it('el domingo es el 0', async () => {
    const d = build();
    await d.inTenant(() =>
      d.service.createBlocks(
        SITE,
        dto({
          startsAt: iso('2030-01-06', '08:00'),
          endsAt: iso('2030-01-06', '10:00'),
          recurrence: { weekdays: [0], until: '2030-01-13' },
        }),
        actor,
      ),
    );
    expect(d.created.map((b) => b.startsAt.toISOString())).toEqual([
      '2030-01-06T12:00:00.000Z',
      '2030-01-13T12:00:00.000Z',
    ]);
  });

  it(`más de ${MAX_BLOCK_INSTANCES} instancias → 422 OR_BLOCK_TOO_MANY_INSTANCES`, async () => {
    const d = build();
    await expect(
      d.inTenant(() =>
        d.service.createBlocks(
          SITE,
          dto({
            recurrence: {
              weekdays: [0, 1, 2, 3, 4, 5, 6],
              until: '2031-12-31',
            },
          }),
          actor,
        ),
      ),
    ).rejects.toMatchObject({
      status: 422,
      reason: Reason.OR_BLOCK_TOO_MANY_INSTANCES,
    });
    expect(d.repo.createBlock).not.toHaveBeenCalled();
  });

  it('exactamente el máximo sí se acepta', async () => {
    const d = build();
    // 400 días seguidos desde el 2030-01-07.
    await d.inTenant(() =>
      d.service.createBlocks(
        SITE,
        dto({
          recurrence: { weekdays: [0, 1, 2, 3, 4, 5, 6], until: '2031-02-10' },
        }),
        actor,
      ),
    );
    expect(d.created).toHaveLength(400);
  });

  it('un bloque que empieza en el pasado → 422 OR_BLOCK_IN_PAST', async () => {
    const d = build();
    await expect(
      d.inTenant(() =>
        d.service.createBlocks(
          SITE,
          dto({
            startsAt: iso('2020-01-06', '08:00'),
            endsAt: iso('2020-01-06', '14:00'),
          }),
          actor,
        ),
      ),
    ).rejects.toMatchObject({ status: 422, reason: Reason.OR_BLOCK_IN_PAST });
  });

  it('fin antes del inicio o franja que cruza la medianoche en una serie → 422 OR_BLOCK_WINDOW_INVALID', async () => {
    const d = build();
    await expect(
      d.inTenant(() =>
        d.service.createBlocks(
          SITE,
          dto({ endsAt: iso(FUTURE, '07:00') }),
          actor,
        ),
      ),
    ).rejects.toMatchObject({ reason: Reason.OR_BLOCK_WINDOW_INVALID });
    await expect(
      d.inTenant(() =>
        d.service.createBlocks(
          SITE,
          dto({
            endsAt: iso('2030-01-08', '02:00'),
            recurrence: { weekdays: [1], until: '2030-02-04' },
          }),
          actor,
        ),
      ),
    ).rejects.toMatchObject({ reason: Reason.OR_BLOCK_WINDOW_INVALID });
  });

  it('el dueño es obligatorio: servicio sin unidad ni especialidad, cirujano sin perfil → 422 OR_BLOCK_OWNER_REQUIRED', async () => {
    const d = build();
    await expect(
      d.inTenant(() =>
        d.service.createBlocks(
          SITE,
          dto({ surgicalSpecialtyConceptId: undefined }),
          actor,
        ),
      ),
    ).rejects.toMatchObject({
      status: 422,
      reason: Reason.OR_BLOCK_OWNER_REQUIRED,
    });
    await expect(
      d.inTenant(() =>
        d.service.createBlocks(SITE, dto({ ownerKind: 'SURGEON' }), actor),
      ),
    ).rejects.toMatchObject({ reason: Reason.OR_BLOCK_OWNER_REQUIRED });
  });

  it('un cirujano que no existe o una unidad de otro tenant → 422 OR_BLOCK_OWNER_REQUIRED', async () => {
    const d = build();
    d.tx.execute.mockResolvedValue([]);
    await expect(
      d.inTenant(() =>
        d.service.createBlocks(
          SITE,
          dto({ ownerKind: 'SURGEON', surgeonProfileId: SURGEON }),
          actor,
        ),
      ),
    ).rejects.toMatchObject({
      reason: Reason.OR_BLOCK_OWNER_REQUIRED,
      details: { cause: 'NOT_FOUND' },
    });
    await expect(
      d.inTenant(() =>
        d.service.createBlocks(SITE, dto({ clinicalUnitId: UNIT }), actor),
      ),
    ).rejects.toMatchObject({
      reason: Reason.OR_BLOCK_OWNER_REQUIRED,
      details: { field: 'clinicalUnitId' },
    });
  });

  it('un bloque activo solapado → 409 OR_BLOCK_OVERLAP con el bloque en conflicto', async () => {
    const d = build();
    d.repo.findOverlapping.mockResolvedValue([block()]);
    await expect(
      d.inTenant(() => d.service.createBlocks(SITE, dto(), actor)),
    ).rejects.toMatchObject({
      status: 409,
      reason: Reason.OR_BLOCK_OVERLAP,
      details: { blockId: 'blk-1' },
    });
    expect(d.repo.createBlock).not.toHaveBeenCalled();
  });

  it('la regla de liberación sale de infra.or_block_release_hours cuando existe', async () => {
    const d = build();
    d.tx.findOne.mockResolvedValue({ valueJson: 24 });
    await d.inTenant(() => d.service.createBlocks(SITE, dto(), actor));
    expect(d.repo.createBlock.mock.calls[0][1].releaseAt).toEqual(
      new Date('2030-01-06T12:00:00Z'),
    );
  });
});

describe('PeriopBlocksService.release / cancel / releaseTick', () => {
  it('liberar: estado RELEASED, minutos devueltos, historia, evento de sala y outbox', async () => {
    const d = build();
    const b = block();
    d.repo.findBlockForUpdate.mockResolvedValue(b);
    const res = await d.inTenant(() =>
      d.service.release('blk-1', 'Sin casos esta semana', actor, 'req-1'),
    );

    expect(b.statusConceptId).toBe(PERIOP.ORB_RELEASED);
    expect(b.releasedByUserId).toBe('user-1');
    expect(b.releasedMinutes).toBe(360);
    expect(res.status).toBe('RELEASED');
    expect(d.casesRepo.createUtilizationEvent).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        eventTypeConceptId: CONCEPTS.OR_EVENT_SLOT_RELEASED,
        operatingRoomBlockId: 'blk-1',
        tenantId: TENANT,
      }),
    );
    expect(d.outbox.publishDomainEvent.mock.calls[0][1]).toMatchObject({
      eventType: 'periop.or_block.released',
      payloadJson: expect.objectContaining({
        automatic: false,
        releasedMinutes: 360,
      }),
    });
  });

  it('un bloque de otro tenant responde 404 y no se toca', async () => {
    const d = build();
    d.repo.findBlockForUpdate.mockResolvedValue(null);
    await expect(
      d.inTenant(() => d.service.release('x', 'motivo', actor)),
    ).rejects.toMatchObject({
      status: 404,
      reason: Reason.OR_BLOCK_NOT_FOUND,
    });
    expect(d.repo.findBlockForUpdate).toHaveBeenCalledWith(d.tx, 'x', TENANT);
  });

  it('un bloque ya liberado → 409 OR_BLOCK_NOT_ACTIVE; con casos ligados → 422 OR_BLOCK_HAS_CASES con la lista', async () => {
    const d = build();
    d.repo.findBlockForUpdate.mockResolvedValue(
      block({ statusConceptId: PERIOP.ORB_RELEASED }),
    );
    await expect(
      d.inTenant(() => d.service.release('blk-1', 'motivo', actor)),
    ).rejects.toMatchObject({
      status: 409,
      reason: Reason.OR_BLOCK_NOT_ACTIVE,
    });
    d.repo.findBlockForUpdate.mockResolvedValue(block());
    d.repo.findLiveCasesInBlock.mockResolvedValue([{ id: 'case-1' }]);
    await expect(
      d.inTenant(() => d.service.release('blk-1', 'motivo', actor)),
    ).rejects.toMatchObject({
      status: 422,
      reason: Reason.OR_BLOCK_HAS_CASES,
      details: { caseIds: ['case-1'] },
    });
  });

  it('un bloque que ya terminó no se libera (OR_BLOCK_IN_PAST)', async () => {
    const d = build();
    d.repo.findBlockForUpdate.mockResolvedValue(
      block({
        startsAt: new Date('2020-01-06T12:00:00Z'),
        endsAt: new Date('2020-01-06T18:00:00Z'),
      }),
    );
    await expect(
      d.inTenant(() => d.service.release('blk-1', 'motivo', actor)),
    ).rejects.toMatchObject({
      reason: Reason.OR_BLOCK_IN_PAST,
    });
  });

  it('sin permiso de jefe de quirófano, el cirujano dueño de SU bloque sí puede liberarlo; en uno ajeno no', async () => {
    const d = build();
    d.access.can.mockResolvedValue(false);
    d.access.assertCan.mockRejectedValue(
      Object.assign(new Error('403'), { status: 403 }),
    );
    const surgeon = {
      id: 'u2',
      roles: ['SURGEON'],
      practitionerProfileId: SURGEON,
    } as any;
    const suyo = block({
      ownerKindConceptId: PERIOP.ORB_OWNER_SURGEON,
      surgeonProfileId: SURGEON,
    });
    d.repo.findBlockForUpdate.mockResolvedValue(suyo);
    await expect(
      d.inTenant(() => d.service.release('blk-1', 'no opero', surgeon)),
    ).resolves.toMatchObject({ status: 'RELEASED' });

    d.repo.findBlockForUpdate.mockResolvedValue(
      block({
        ownerKindConceptId: PERIOP.ORB_OWNER_SURGEON,
        surgeonProfileId: 'otro',
      }),
    );
    await expect(
      d.inTenant(() => d.service.release('blk-1', 'quiero', surgeon)),
    ).rejects.toMatchObject({ status: 403 });
    // Cancelar es de gestión: el cirujano dueño tampoco.
    d.repo.findBlockForUpdate.mockResolvedValue(suyo);
    await expect(
      d.inTenant(() => d.service.cancel('blk-1', 'quiero', surgeon)),
    ).rejects.toMatchObject({ status: 403 });
  });

  it('cancelar deja el bloque CANCELLED con su evento', async () => {
    const d = build();
    const b = block();
    d.repo.findBlockForUpdate.mockResolvedValue(b);
    await d.inTenant(() =>
      d.service.cancel('blk-1', 'Cambio de agenda', actor),
    );
    expect(b.statusConceptId).toBe(PERIOP.ORB_CANCELLED);
    expect(d.outbox.publishDomainEvent.mock.calls[0][1].eventType).toBe(
      'periop.or_block.cancelled',
    );
  });

  it('el tick libera los vencidos sin casos (automático: sin usuario) y deja los que tienen casos', async () => {
    const d = build();
    const libre = block({ id: 'libre' });
    const ocupado = block({ id: 'ocupado' });
    d.repo.findReleasable.mockResolvedValue([libre, ocupado]);
    d.repo.findLiveCasesInBlock.mockImplementation(
      async (_tx: unknown, id: string) =>
        id === 'ocupado' ? [{ id: 'case-1' }] : [],
    );
    const now = new Date('2030-01-04T13:00:00Z');
    const res = await d.service.releaseTick(now);

    expect(res).toEqual({ released: 1, blockIds: ['libre'] });
    expect(libre.statusConceptId).toBe(PERIOP.ORB_RELEASED);
    expect(libre.releasedByUserId).toBeUndefined();
    expect(libre.releasedAt).toEqual(now);
    expect(ocupado.statusConceptId).toBe(PERIOP.ORB_ACTIVE);
    expect(
      d.outbox.publishDomainEvent.mock.calls[0][1].payloadJson,
    ).toMatchObject({ automatic: true });
  });
});

describe('PeriopBlocksService.resolveOwnership · validación 6', () => {
  const window = {
    start: new Date('2030-01-07T12:00:00Z'),
    end: new Date('2030-01-07T14:00:00Z'),
  };
  const base = {
    operatingRoomId: ROOM,
    window,
    scheduled: window,
    primarySurgeonProfileId: SURGEON,
    elective: true,
  };

  it('sin bloques no hay dueño ni conflicto', async () => {
    const d = build();
    const res = await d.inTenant(() =>
      d.service.resolveOwnership(d.tx as any, base),
    );
    expect(res).toEqual({ blockId: undefined, overriddenBlockIds: [] });
  });

  it('un bloque de otro servicio y caso electivo → 409 OR_BLOCK_OWNED_BY_OTHER con bloque y dueño', async () => {
    const d = build();
    d.repo.findOverlapping.mockResolvedValue([
      block({ surgicalSpecialtyConceptId: TRAUMA }),
    ]);
    await expect(
      d.inTenant(() =>
        d.service.resolveOwnership(d.tx as any, {
          ...base,
          surgicalSpecialtyConceptId: 'cardio',
        }),
      ),
    ).rejects.toMatchObject({
      status: 409,
      reason: Reason.OR_BLOCK_OWNED_BY_OTHER,
      details: {
        blockId: 'blk-1',
        owner: { kind: 'SERVICE', surgicalSpecialtyConceptId: TRAUMA },
      },
    });
  });

  it('una urgencia puede pisar el bloque ajeno: no se liga pero queda constancia', async () => {
    const d = build();
    d.repo.findOverlapping.mockResolvedValue([block()]);
    const res = await d.inTenant(() =>
      d.service.resolveOwnership(d.tx as any, {
        ...base,
        elective: false,
        surgicalSpecialtyConceptId: 'cardio',
      }),
    );
    expect(res).toEqual({ blockId: undefined, overriddenBlockIds: ['blk-1'] });
  });

  it('el caso del propio servicio se liga al bloque', async () => {
    const d = build();
    d.repo.findOverlapping.mockResolvedValue([block()]);
    const res = await d.inTenant(() =>
      d.service.resolveOwnership(d.tx as any, {
        ...base,
        surgicalSpecialtyConceptId: TRAUMA,
      }),
    );
    expect(res.blockId).toBe('blk-1');
  });

  it('bloque de cirujano: su cirujano se liga, otro choca', async () => {
    const d = build();
    d.repo.findOverlapping.mockResolvedValue([
      block({
        ownerKindConceptId: PERIOP.ORB_OWNER_SURGEON,
        surgeonProfileId: SURGEON,
      }),
    ]);
    await expect(
      d.inTenant(() => d.service.resolveOwnership(d.tx as any, base)),
    ).resolves.toMatchObject({ blockId: 'blk-1' });
    await expect(
      d.inTenant(() =>
        d.service.resolveOwnership(d.tx as any, {
          ...base,
          primarySurgeonProfileId: 'otro',
        }),
      ),
    ).rejects.toMatchObject({ reason: Reason.OR_BLOCK_OWNED_BY_OTHER });
  });

  it('un bloque de servicio que sólo nombra la unidad toma la especialidad de la unidad', async () => {
    const d = build();
    d.repo.findOverlapping.mockResolvedValue([
      block({ surgicalSpecialtyConceptId: undefined, clinicalUnitId: UNIT }),
    ]);
    d.tx.findOne.mockResolvedValue({ specialtyConceptId: TRAUMA });
    const res = await d.inTenant(() =>
      d.service.resolveOwnership(d.tx as any, {
        ...base,
        surgicalSpecialtyConceptId: TRAUMA,
      }),
    );
    expect(res.blockId).toBe('blk-1');
  });

  it('sólo mira bloques ACTIVOS del tenant: la consulta lo pide', async () => {
    const d = build();
    await d.inTenant(() => d.service.resolveOwnership(d.tx as any, base));
    expect(d.repo.findOverlapping).toHaveBeenCalledWith(
      d.tx,
      TENANT,
      ROOM,
      window.start,
      window.end,
      PERIOP.ORB_ACTIVE,
    );
  });
});
