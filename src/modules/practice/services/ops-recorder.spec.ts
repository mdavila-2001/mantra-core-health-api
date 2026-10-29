import { PRAC } from '../practice.concepts';
import { OpsRecorder, type OpsContext } from './ops-recorder';
import { NOW, TENANT, fn, makeRow } from './ops.testing';

const ctx: OpsContext = {
  tenantId: TENANT,
  actorUserId: 'nurse-1',
  requestId: 'req-1',
  source: 'SRC_MANUAL',
  action: 'TEST',
  actingRoles: ['NURSE'],
  now: NOW,
};

function build(updated: { id: string }[] = [{ id: 'space-1' }]) {
  const tx = {
    execute: fn().mockResolvedValue(updated),
    insert: fn().mockResolvedValue(undefined),
    findOne: fn().mockResolvedValue({
      id: 'space-1',
      code: 'CAMA-1',
      isolationOrganismText: 'MRSA',
    }),
  };
  const state = {
    stateOf: fn().mockResolvedValue({ v2Code: 'I' }),
  };
  const events = { publish: fn().mockResolvedValue(true) };
  const historyRepo = { append: fn().mockResolvedValue(undefined) };
  return {
    tx,
    state,
    events,
    historyRepo,
    recorder: new OpsRecorder(state as any, events as any, historyRepo as any),
  };
}

describe('OpsRecorder.applyChange', () => {
  it('escribe los ejes con compare-and-set sobre ops_version, sin tocar row_version, y deja el evento A20', async () => {
    const d = build();
    const res = await d.recorder.applyChange(
      d.tx as any,
      makeRow(),
      {
        isolation: {
          to: 'ISO_CONTACT',
          organismText: 'MRSA',
          reasonText: 'Colonización por MRSA',
        },
      },
      ctx,
    );
    const [sql, params] = d.tx.execute.mock.calls[0];
    expect(sql).toMatch(/update practice\.care_spaces/);
    expect(sql).toMatch(
      /where id = \? and tenant_id = \? and ops_version = \?/,
    );
    expect(sql).not.toMatch(/row_version/);
    expect(params.slice(-3)).toEqual(['space-1', TENANT, 3]);
    expect(params).toContain(4);
    expect(res.row.opsVersion).toBe(4);
    expect(res.events).toHaveLength(1);
    expect(d.tx.insert).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        v20116Code: 'I',
        recordedByUserId: 'nurse-1',
        requestId: 'req-1',
        toConceptId: PRAC.ISO_CONTACT,
        fromConceptId: PRAC.ISO_NONE,
        // la tabla guarda el motivo para quien puede leerlo; la lectura lo filtra
        reasonText: 'Colonización por MRSA',
      }),
    );
  });

  it('el outbox no lleva el texto clínico del aislamiento y la historia genérica no guarda el organismo', async () => {
    const d = build();
    await d.recorder.applyChange(
      d.tx as any,
      makeRow(),
      {
        isolation: {
          to: 'ISO_AIRBORNE',
          organismText: 'M. tuberculosis',
          reasonText: 'Tuberculosis pulmonar',
        },
      },
      ctx,
    );
    const publicado = d.events.publish.mock.calls[0][1];
    expect(publicado.payload).toMatchObject({
      axis: 'AXIS_ISOLATION',
      to: 'ISO_AIRBORNE',
      reasonText: null,
      v2Code: 'I',
      actingRoles: ['NURSE'],
    });
    expect(JSON.stringify(publicado)).not.toMatch(/tuberculosis/i);
    const snapshot = d.historyRepo.append.mock.calls[0][3].dataSnapshot;
    expect(JSON.stringify(snapshot)).not.toContain('MRSA');
    expect(snapshot.opsAction).toBe('TEST');
  });

  it('el texto no clínico (higiene) sí viaja en el outbox', async () => {
    const d = build();
    await d.recorder.applyChange(
      d.tx as any,
      makeRow(),
      { hygiene: { to: 'HYG_DIRTY', reasonText: 'Derrame' } },
      ctx,
    );
    expect(d.events.publish.mock.calls[0][1].payload.reasonText).toBe(
      'Derrame',
    );
  });

  it('una versión operativa que cambió entre la lectura y la escritura es 412 y no deja eventos', async () => {
    const d = build([]);
    await expect(
      d.recorder.applyChange(
        d.tx as any,
        makeRow(),
        { hygiene: { to: 'HYG_DIRTY' } },
        ctx,
      ),
    ).rejects.toMatchObject({ status: 412, reason: 'OPS_VERSION_MISMATCH' });
    expect(d.tx.insert).not.toHaveBeenCalled();
    expect(d.events.publish).not.toHaveBeenCalled();
  });

  it('sin cambios reales no escribe, no sube la versión y no emite eventos', async () => {
    const d = build();
    const res = await d.recorder.applyChange(
      d.tx as any,
      makeRow(),
      {
        hygiene: { to: 'HYG_INSPECTED' },
        availability: {
          to: 'SPACE_OP_AVAILABLE',
          reasonConceptId: null,
          expectedUntil: null,
          reasonText: null,
        },
        isolation: { to: 'ISO_NONE', organismText: null },
        terminalCleaningRequired: false,
      },
      ctx,
    );
    expect(d.tx.execute).not.toHaveBeenCalled();
    expect(res.events).toHaveLength(0);
    expect(res.row.opsVersion).toBe(3);
  });

  it('varios ejes en una operación suben ops_version una sola vez y dejan un evento por eje', async () => {
    const d = build();
    const res = await d.recorder.applyChange(
      d.tx as any,
      makeRow({ operationalStatusConceptId: PRAC.SPACE_OP_MAINTENANCE }),
      {
        availability: {
          to: 'SPACE_OP_AVAILABLE',
          reasonConceptId: null,
          expectedUntil: null,
          reasonText: null,
        },
        hygiene: { to: 'HYG_DIRTY' },
      },
      ctx,
    );
    expect(res.events.map((e) => e.axis)).toEqual([
      'AXIS_AVAILABILITY',
      'AXIS_HYGIENE',
    ]);
    expect(res.row.opsVersion).toBe(4);
    expect(d.tx.execute).toHaveBeenCalledTimes(1);
  });
});

describe('OpsRecorder.recordOccupancy', () => {
  it('deja el evento del eje de ocupación con el resumen resultante y sube la versión operativa', async () => {
    const d = build();
    d.state.stateOf.mockResolvedValue({ v2Code: 'O' });
    const ev = await d.recorder.recordOccupancy(
      d.tx as any,
      makeRow(),
      'OCC_FREE',
      'OCC_OCCUPIED',
      { ...ctx, source: 'SRC_ADT' },
    );
    expect(ev).toMatchObject({
      axis: 'AXIS_OCCUPANCY',
      from: 'OCC_FREE',
      to: 'OCC_OCCUPIED',
      v2Code: 'O',
    });
    expect(d.state.stateOf).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({ opsVersion: 4 }),
      NOW,
      'OCC_OCCUPIED',
    );
    expect(d.tx.execute.mock.calls[0][0]).not.toMatch(/row_version/);
  });

  it('sin cambio de ocupación no escribe nada', async () => {
    const d = build();
    expect(
      await d.recorder.recordOccupancy(
        d.tx as any,
        makeRow(),
        'OCC_FREE',
        'OCC_FREE',
        ctx,
      ),
    ).toBeNull();
    expect(d.tx.execute).not.toHaveBeenCalled();
  });
});
