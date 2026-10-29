import { jest } from '@jest/globals';
import { CONCEPTS, PreconditionFailedException } from '../../../common';
import { runWithTenant } from '../../../common/tenant/tenant-context';
import { PRAC } from '../../practice/practice.concepts';
import { OpsErrorReason } from '../../practice/practice-ops.error-reasons';
import { ProceduresPerioperativeErrorReason as Reason } from '../procedures_perioperative.error-reasons';
import { PeriopOperatingRoomService } from './periop-operating-room.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
const TENANT = '11111111-1111-4111-8111-111111111111';
const SITE = '33333333-3333-4333-8333-333333333333';
const ROOM = '44444444-4444-4444-4444-444444444444';
const window = {
  start: new Date('2030-01-07T11:45:00Z'),
  end: new Date('2030-01-07T14:20:00Z'),
};

function room(over: Record<string, unknown> = {}): any {
  return {
    space: {
      id: ROOM,
      practiceSiteId: SITE,
      spaceTypeConceptId: PRAC.SPACE_FN_OPERATING_ROOM,
      statusConceptId: PRAC.SPACE_ACTIVE,
      validFrom: undefined,
      validTo: undefined,
      prepMinutes: 15,
      cleanupMinutes: 20,
      ...over,
    },
    site: { id: SITE },
  };
}

function build(loaded: unknown = room()) {
  const tx = { findOne: mockFn().mockResolvedValue({ id: 'res-1' }) };
  const access = { loadRoom: mockFn().mockResolvedValue(loaded) };
  const ops = { assertBookable: mockFn().mockResolvedValue(undefined) };
  const service = new PeriopOperatingRoomService(access as any, ops as any);
  const book = (input: Record<string, unknown> = {}) =>
    runWithTenant(TENANT, () =>
      service.resolveForBooking(
        tx as any,
        {
          operatingRoomId: ROOM,
          practiceSiteId: SITE,
          window,
          ...input,
        } as any,
      ),
    );
  return { service, tx, access, ops, book };
}

describe('PeriopOperatingRoomService · validaciones 1 a 5 de scheduleCase', () => {
  it('camino feliz: devuelve la sala y el recurso agendable, y pide assertBookable por la ventana reservada', async () => {
    const d = build();
    const res = await d.book();
    expect(res.resourceId).toBe('res-1');
    expect(d.ops.assertBookable).toHaveBeenCalledWith(d.tx, ROOM, window);
    expect(d.tx.findOne).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        careSpaceId: ROOM,
        tenantId: TENANT,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
      }),
    );
  });

  it('la ventana puede calcularse con las cifras del espacio', async () => {
    const d = build();
    const seen: unknown[] = [];
    await d.book({
      window: (space: any) => {
        seen.push(space.prepMinutes);
        return window;
      },
    });
    expect(seen).toEqual([15]);
  });

  it('1 · un espacio que no existe en el tenant → 404', async () => {
    const d = build(null);
    await expect(d.book()).rejects.toMatchObject({
      status: 404,
      reason: Reason.OPERATING_ROOM_NOT_FOUND,
    });
    expect(d.ops.assertBookable).not.toHaveBeenCalled();
  });

  it('2 · otra sede → 422 OPERATING_ROOM_SITE_MISMATCH', async () => {
    const d = build();
    await expect(
      d.book({ practiceSiteId: '99999999-9999-4999-8999-999999999999' }),
    ).rejects.toMatchObject({
      status: 422,
      reason: Reason.OPERATING_ROOM_SITE_MISMATCH,
    });
  });

  it('3 · un consultorio no es un quirófano → 422 OPERATING_ROOM_INVALID_FUNCTION', async () => {
    const d = build(
      room({ spaceTypeConceptId: PRAC.SPACE_FN_CONSULTING_ROOM }),
    );
    await expect(d.book()).rejects.toMatchObject({
      status: 422,
      reason: Reason.OPERATING_ROOM_INVALID_FUNCTION,
    });
  });

  it.each([
    ['suspendido', { statusConceptId: PRAC.SPACE_SUSPENDED }],
    [
      'fuera de vigencia (vence antes del fin de la ventana)',
      { validTo: new Date('2030-01-07T13:00:00Z') },
    ],
    ['aún no vigente', { validFrom: new Date('2030-02-01T00:00:00Z') }],
  ])(
    '4 · un quirófano %s → 422 OPERATING_ROOM_NOT_AVAILABLE',
    async (_name, over) => {
      const d = build(room(over));
      await expect(d.book()).rejects.toMatchObject({
        status: 422,
        reason: Reason.OPERATING_ROOM_NOT_AVAILABLE,
        details: { cause: 'LIFECYCLE' },
      });
      expect(d.ops.assertBookable).not.toHaveBeenCalled();
    },
  );

  it('4 · la sala en mantenimiento (assertBookable del puerto) → 422 OPERATING_ROOM_NOT_AVAILABLE con details.block', async () => {
    const d = build();
    d.ops.assertBookable.mockRejectedValue(
      new PreconditionFailedException(
        'no',
        {
          reason: 'BLOCK',
          blockId: 'blk',
          blockKind: 'BLOCK_MAINTENANCE',
          blockStartsAt: '2030-01-07T10:00:00.000Z',
          blockExpectedEndAt: null,
        },
        OpsErrorReason.SPACE_NOT_BOOKABLE,
      ),
    );
    await expect(d.book()).rejects.toMatchObject({
      status: 422,
      reason: Reason.OPERATING_ROOM_NOT_AVAILABLE,
      details: {
        cause: 'BLOCKED',
        block: {
          id: 'blk',
          kind: 'BLOCK_MAINTENANCE',
          startsAt: '2030-01-07T10:00:00.000Z',
          expectedEndAt: null,
        },
      },
    });
  });

  it('4 · un error del puerto que no es de reservabilidad se propaga tal cual', async () => {
    const d = build();
    d.ops.assertBookable.mockRejectedValue(new Error('base caída'));
    await expect(d.book()).rejects.toThrow('base caída');
  });

  it('5 · sin recurso agendable activo → 422 OPERATING_ROOM_WITHOUT_RESOURCE', async () => {
    const d = build();
    d.tx.findOne.mockResolvedValue(null);
    await expect(d.book()).rejects.toMatchObject({
      status: 422,
      reason: Reason.OPERATING_ROOM_WITHOUT_RESOURCE,
    });
  });

  it('para bloques, los mismos errores salen como OR_BLOCK_INVALID_ROOM', async () => {
    const otraSede = build();
    await expect(
      runWithTenant(TENANT, () =>
        otraSede.service.resolveRoom(
          otraSede.tx as any,
          ROOM,
          'otra-sede',
          'BLOCK',
        ),
      ),
    ).rejects.toMatchObject({
      reason: Reason.OR_BLOCK_INVALID_ROOM,
      details: { cause: 'SITE_MISMATCH' },
    });
    const consultorio = build(
      room({ spaceTypeConceptId: PRAC.SPACE_FN_CONSULTING_ROOM }),
    );
    await expect(
      runWithTenant(TENANT, () =>
        consultorio.service.resolveRoom(
          consultorio.tx as any,
          ROOM,
          SITE,
          'BLOCK',
        ),
      ),
    ).rejects.toMatchObject({
      reason: Reason.OR_BLOCK_INVALID_ROOM,
      details: { cause: 'INVALID_FUNCTION' },
    });
  });
});
