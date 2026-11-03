import { describe, expect, it, jest } from '@jest/globals';
import { PERIOP } from '../../procedures_perioperative.concepts';
import { OperatingRoomValidator } from './operating-room.validator';

const room = {
  practiceSiteId: 'site-1',
  functionCode: 'SPACE_FN_OPERATING_ROOM',
  prepMinutes: 15,
  cleanupMinutes: 20,
};

function build(
  opts: {
    state?: any;
    resource?: boolean;
    conflict?: any;
    blocks?: any[];
    bookable?: unknown;
  } = {},
) {
  const ops = {
    getOperationalState: jest.fn<any>().mockResolvedValue(opts.state ?? room),
    assertBookable: jest.fn<any>().mockImplementation(async () => {
      if (opts.bookable) throw opts.bookable;
    }),
  };
  const executed: unknown[][] = [];
  const tx = {
    execute: jest
      .fn<any>()
      .mockImplementation(async (sql: string, params: unknown[]) => {
        executed.push(params);
        if (sql.includes('schedulable_resources'))
          return opts.resource === false ? [] : [{ id: 'res-1' }];
        return opts.conflict ? [opts.conflict] : [];
      }),
    find: jest.fn<any>().mockResolvedValue(opts.blocks ?? []),
  };
  return { v: new OperatingRoomValidator(ops as any), tx, ops, executed };
}

const input = {
  operatingRoomId: 'or-1',
  practiceSiteId: 'site-1',
  start: new Date('2026-11-02T12:00:00Z'),
  end: new Date('2026-11-02T14:00:00Z'),
  caseType: 'ELECTIVE',
  specialtyConceptId: 'spec-trauma',
};

describe('OperatingRoomValidator (§F4.3, validaciones 1–7)', () => {
  it('permitido: ventana reservada = programada − prep / + limpieza; liga recurso', async () => {
    const d = build();
    const r = await d.v.validate(d.tx as any, input);
    expect(r).toMatchObject({
      schedulableResourceId: 'res-1',
      prepMinutes: 15,
      cleanupMinutes: 20,
      reservedStartAt: new Date('2026-11-02T11:45:00Z'),
      reservedEndAt: new Date('2026-11-02T14:20:00Z'),
    });
    expect(d.ops.assertBookable).toHaveBeenCalledWith(d.tx, 'or-1', {
      start: new Date('2026-11-02T11:45:00Z'),
      end: new Date('2026-11-02T14:20:00Z'),
    });
  });

  it('fail-closed por tenant: el puerto de F2 da 404 y no sigue', async () => {
    const d = build();
    d.ops.getOperationalState.mockRejectedValue(
      Object.assign(new Error('x'), { status: 404 }),
    );
    await expect(d.v.validate(d.tx as any, input)).rejects.toMatchObject({
      status: 404,
    });
    expect(d.tx.execute).not.toHaveBeenCalled();
  });

  it('otra sede 422; no quirófano 422; sin recurso 422; bloqueado 422', async () => {
    await expect(
      build({ state: { ...room, practiceSiteId: 'site-2' } }).v.validate(
        {} as any,
        input,
      ),
    ).rejects.toMatchObject({
      reason: 'OPERATING_ROOM_SITE_MISMATCH',
    });
    await expect(
      build({
        state: { ...room, functionCode: 'SPACE_FN_CONSULTING_ROOM' },
      }).v.validate({} as any, input),
    ).rejects.toMatchObject({ reason: 'OPERATING_ROOM_INVALID_FUNCTION' });
    const noRes = build({ resource: false });
    await expect(
      noRes.v.validate(noRes.tx as any, input),
    ).rejects.toMatchObject({ reason: 'OPERATING_ROOM_WITHOUT_RESOURCE' });
    const blocked = build({
      bookable: {
        reason: 'SPACE_NOT_BOOKABLE',
        details: { block: { id: 'b1' } },
      },
    });
    await expect(
      blocked.v.validate(blocked.tx as any, input),
    ).rejects.toMatchObject({
      reason: 'OPERATING_ROOM_NOT_AVAILABLE',
      details: { block: { id: 'b1' } },
    });
  });

  it('solape con la ventana reservada de otro caso → 409 con su ventana', async () => {
    const d = build({
      conflict: {
        id: 'case-A',
        reserved_start_at: '2026-11-02T09:45:00Z',
        reserved_end_at: '2026-11-02T12:20:00Z',
      },
    });
    await expect(d.v.validate(d.tx as any, input)).rejects.toMatchObject({
      status: 409,
      reason: 'OPERATING_ROOM_SLOT_CONFLICT',
      details: {
        conflictingCaseId: 'case-A',
        reservedEndAt: '2026-11-02T12:20:00.000Z',
      },
    });
  });

  it('bloque de otro servicio: electivo 409, urgencia pasa; bloque propio se liga', async () => {
    const otro = {
      id: 'blk-1',
      ownerKindConceptId: PERIOP.ORB_OWNER_SERVICE,
      surgicalSpecialtyConceptId: 'spec-cardio',
    };
    const d = build({ blocks: [otro] });
    await expect(d.v.validate(d.tx as any, input)).rejects.toMatchObject({
      reason: 'OR_BLOCK_OWNED_BY_OTHER',
    });
    await expect(
      d.v.validate(d.tx as any, { ...input, caseType: 'URGENT' }),
    ).resolves.toMatchObject({ operatingRoomBlockId: null });
    const propio = build({
      blocks: [{ ...otro, surgicalSpecialtyConceptId: 'spec-trauma' }],
    });
    await expect(
      propio.v.validate(propio.tx as any, input),
    ).resolves.toMatchObject({ operatingRoomBlockId: 'blk-1' });
  });
});
