import { runWithTenant } from '../../../common';
import { PRAC } from '../practice.concepts';
import { opsActorUserId } from './care-space-ops.port';
import { CareSpaceOpsPortService } from './care-space-ops-port.service';
import { NOW, TENANT, fn, makeRow } from './ops.testing';

function build(row = makeRow(), blocks: any[] = []) {
  const tx = { execute: fn().mockResolvedValue(blocks) };
  const state = {
    loadSpace: fn().mockResolvedValue(row),
    stateOf: fn().mockResolvedValue({
      careSpaceId: row.id,
      v2Code: 'U',
      assignable: true,
    }),
  };
  const recorder = { recordOccupancy: fn().mockResolvedValue(null) };
  const cleaning = {
    openOrder: fn().mockResolvedValue({ order: { id: 'order-1' } }),
  };
  const port = new CareSpaceOpsPortService(
    state as any,
    recorder as any,
    cleaning as any,
  );
  const inTenant = <T>(run: () => Promise<T>) => runWithTenant(TENANT, run);
  return { port, tx, state, recorder, cleaning, inTenant };
}

describe('CareSpaceOpsPortService (el contrato que usan F3 y F4)', () => {
  it('getOperationalState lee el estado del espacio del tenant', async () => {
    const d = build();
    const s = await d.inTenant(() =>
      d.port.getOperationalState(d.tx as any, 'space-1'),
    );
    expect(s).toMatchObject({ assignable: true });
    expect(d.state.loadSpace).toHaveBeenCalledWith(d.tx, TENANT, 'space-1');
  });

  it('un espacio de otro tenant es 404: sin tenant en el contexto no se llega a leer', async () => {
    const d = build();
    await expect(
      d.port.getOperationalState(d.tx as any, 'space-1'),
    ).rejects.toMatchObject({
      status: 422,
    });
  });

  it.each([
    ['DISCHARGE', 'CLEAN_DISCHARGE', 'CLN_TRG_DISCHARGE', 'SRC_ADT'],
    ['CLN_TRG_TRANSFER', 'CLEAN_DISCHARGE', 'CLN_TRG_TRANSFER', 'SRC_ADT'],
    [
      'OR_TURNOVER',
      'CLEAN_OR_TURNOVER',
      'CLN_TRG_OR_TURNOVER',
      'SRC_ROOM_EVENT',
    ],
    ['ISOLATION_END', 'CLEAN_TERMINAL', 'CLN_TRG_ISOLATION_END', 'SRC_ADT'],
    ['MANUAL', 'CLEAN_ROUTINE', 'CLN_TRG_MANUAL', 'SRC_ADT'],
  ])(
    'markDirtyFromSource(%s) abre una orden %s con el disparador %s y origen %s',
    async (trigger, type, code, source) => {
      const d = build();
      const res = await d.inTenant(() =>
        d.port.markDirtyFromSource(d.tx as any, 'space-1', {
          trigger: trigger as any,
          sourceRefId: 'ref-1',
          terminal: false,
          actor: { id: 'user-1' },
          requestId: 'req-1',
        }),
      );
      expect(res).toEqual({ cleaningOrderId: 'order-1' });
      expect(d.cleaning.openOrder.mock.calls[0][2]).toMatchObject({
        typeCode: type,
        triggerCode: code,
        priorityCode: 'CLN_PRIO_ROUTINE',
        sourceRefId: 'ref-1',
        terminal: false,
      });
      expect(d.cleaning.openOrder.mock.calls[0][3]).toMatchObject({
        actorUserId: 'user-1',
        requestId: 'req-1',
        source,
      });
    },
  );

  it('terminal y prioridad se pasan tal cual; el sistema (sin actor) queda sin usuario', async () => {
    const d = build();
    await d.inTenant(() =>
      d.port.markDirtyFromSource(d.tx as any, 'space-1', {
        trigger: 'DISCHARGE',
        terminal: true,
        priority: 'STAT',
        actor: null,
      }),
    );
    expect(d.cleaning.openOrder.mock.calls[0][2]).toMatchObject({
      terminal: true,
      priorityCode: 'CLN_PRIO_STAT',
    });
    expect(d.cleaning.openOrder.mock.calls[0][3].actorUserId).toBeNull();
  });

  it('un disparador desconocido es 422 y no abre nada', async () => {
    const d = build();
    await expect(
      d.inTenant(() =>
        d.port.markDirtyFromSource(d.tx as any, 'space-1', {
          trigger: 'NADA' as any,
          terminal: false,
        }),
      ),
    ).rejects.toMatchObject({ status: 422, reason: 'OPS_CODE_INVALID' });
    expect(d.cleaning.openOrder).not.toHaveBeenCalled();
  });

  it('recordOccupancyChange acepta el código corto o completo y registra el evento del origen ADT', async () => {
    const d = build();
    await d.inTenant(() =>
      d.port.recordOccupancyChange(d.tx as any, 'space-1', {
        from: 'FREE',
        to: 'OCC_OCCUPIED',
        sourceRefId: 'loc-1',
        actor: { userId: 'user-2' },
      }),
    );
    const [, , from, to, ctx] = d.recorder.recordOccupancy.mock.calls[0];
    expect([from, to]).toEqual(['OCC_FREE', 'OCC_OCCUPIED']);
    expect(ctx).toMatchObject({
      source: 'SRC_ADT',
      sourceRefId: 'loc-1',
      actorUserId: 'user-2',
    });
    await expect(
      d.inTenant(() =>
        d.port.recordOccupancyChange(d.tx as any, 'space-1', {
          from: 'X' as any,
          to: 'FREE',
        }),
      ),
    ).rejects.toMatchObject({ reason: 'OPS_CODE_INVALID' });
  });

  describe('assertBookable', () => {
    const ventana = {
      start: new Date(Date.now() + 86_400_000),
      end: new Date(Date.now() + 90_000_000),
    };
    const bloqueo = {
      id: 'b1',
      tenant_id: TENANT,
      care_space_id: 'space-1',
      kind_concept_id: PRAC.BLOCK_MAINTENANCE,
      reason_concept_id: PRAC.BLOCK_RSN_INFRASTRUCTURE,
      starts_at: NOW,
      expected_end_at: null,
      created_at: NOW,
      row_version: 1,
    };

    it('un espacio libre de bloqueos y activo se puede reservar', async () => {
      const d = build();
      await expect(
        d.inTenant(() =>
          d.port.assertBookable(d.tx as any, 'space-1', ventana),
        ),
      ).resolves.toBeUndefined();
    });

    it('un bloqueo que pisa la ventana es 422 SPACE_NOT_BOOKABLE con el bloqueo en details', async () => {
      const d = build(makeRow(), [bloqueo]);
      await expect(
        d.inTenant(() =>
          d.port.assertBookable(d.tx as any, 'space-1', ventana),
        ),
      ).rejects.toMatchObject({
        status: 422,
        reason: 'SPACE_NOT_BOOKABLE',
        details: {
          reason: 'BLOCK',
          blockId: 'b1',
          blockKind: 'BLOCK_MAINTENANCE',
        },
      });
      const [sql, params] = d.tx.execute.mock.calls[0];
      expect(sql).toMatch(/cancelled_at is null/);
      expect(sql).toMatch(/b\.starts_at < \?/);
      expect(params.slice(-2)).toEqual([ventana.end, ventana.start]);
    });

    it('un espacio que no está activo no se reserva', async () => {
      const d = build(makeRow({ statusConceptId: PRAC.SPACE_SUSPENDED }));
      await expect(
        d.inTenant(() =>
          d.port.assertBookable(d.tx as any, 'space-1', ventana),
        ),
      ).rejects.toMatchObject({
        details: { reason: 'LIFECYCLE' },
      });
    });

    it('un espacio cerrado antes del modelo (sin fila de bloqueo) no se reserva desde ahora', async () => {
      const d = build(
        makeRow({ operationalStatusConceptId: PRAC.SPACE_OP_CLOSED }),
      );
      await expect(
        d.inTenant(() =>
          d.port.assertBookable(d.tx as any, 'space-1', {
            start: new Date(Date.now() - 1000),
            end: ventana.end,
          }),
        ),
      ).rejects.toMatchObject({ details: { reason: 'AVAILABILITY' } });
    });
  });
});

describe('opsActorUserId', () => {
  it('resuelve el usuario de un AuthenticatedUser, de { userId } o del sistema', () => {
    expect(opsActorUserId({ id: 'a' })).toBe('a');
    expect(opsActorUserId({ userId: 'b' })).toBe('b');
    expect(opsActorUserId({ userId: null })).toBeNull();
    expect(opsActorUserId(null)).toBeNull();
    expect(opsActorUserId(undefined)).toBeNull();
  });
});
