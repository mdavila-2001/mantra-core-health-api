import { jest } from '@jest/globals';
import { PRAC } from '../practice.concepts';
import {
  CareSpaceBlocksService,
  isBlockApplied,
  toBlockView,
} from './care-space-blocks.service';
import type { BlockRow } from './ops-rows';
import { NOW, TENANT, fn, makeRow } from './ops.testing';

const bloque = (over: Partial<BlockRow> = {}): BlockRow => ({
  id: 'block-1',
  tenantId: TENANT,
  careSpaceId: 'space-1',
  kindConceptId: PRAC.BLOCK_MAINTENANCE,
  reasonConceptId: PRAC.BLOCK_RSN_PREVENTIVE_MAINTENANCE,
  reasonText: null,
  startsAt: new Date(NOW.getTime() - 3_600_000),
  expectedEndAt: new Date(NOW.getTime() + 3_600_000),
  endedAt: null,
  endedByUserId: null,
  endNote: null,
  cancelledAt: null,
  cancelReason: null,
  workOrderRef: null,
  createdAt: NOW,
  createdByUserId: 'u',
  rowVersion: 1,
  ...over,
});

describe('isBlockApplied · «aplicado» se deriva del estado del espacio', () => {
  it('rige si empezó, sigue abierto y el espacio figura con la disponibilidad de su tipo', () => {
    expect(isBlockApplied(bloque(), 'SPACE_OP_MAINTENANCE', NOW)).toBe(true);
  });
  it('no rige si el espacio sigue disponible, si es futuro, terminó o se canceló', () => {
    expect(isBlockApplied(bloque(), 'SPACE_OP_AVAILABLE', NOW)).toBe(false);
    expect(
      isBlockApplied(
        bloque({ startsAt: new Date(NOW.getTime() + 1000) }),
        'SPACE_OP_MAINTENANCE',
        NOW,
      ),
    ).toBe(false);
    expect(
      isBlockApplied(bloque({ endedAt: NOW }), 'SPACE_OP_MAINTENANCE', NOW),
    ).toBe(false);
    expect(
      isBlockApplied(bloque({ cancelledAt: NOW }), 'SPACE_OP_MAINTENANCE', NOW),
    ).toBe(false);
  });
  it('no rige si el espacio tiene otra disponibilidad que la de su tipo', () => {
    expect(isBlockApplied(bloque(), 'SPACE_OP_BLOCKED_ADMIN', NOW)).toBe(false);
  });
});

describe('toBlockView', () => {
  it('marca vencido el bloqueo abierto cuya fecha estimada pasó', () => {
    const v = toBlockView(
      bloque({ expectedEndAt: new Date(NOW.getTime() - 60_000) }),
      'SPACE_OP_MAINTENANCE',
      NOW,
    );
    expect(v).toMatchObject({ overdue: true, applied: true });
    expect(
      toBlockView(
        bloque({
          endedAt: NOW,
          expectedEndAt: new Date(NOW.getTime() - 60_000),
        }),
        'SPACE_OP_AVAILABLE',
        NOW,
      ).overdue,
    ).toBe(false);
  });
  it('oculta el texto del motivo «condición del paciente» a quien no es clínico', () => {
    const b = bloque({
      kindConceptId: PRAC.BLOCK_CLINICAL,
      reasonConceptId: PRAC.BLOCK_RSN_PATIENT_CONDITION,
      reasonText: 'Delirium agitado',
    });
    expect(
      toBlockView(b, 'SPACE_OP_BLOCKED_CLINICAL', NOW).reasonText,
    ).toBeNull();
    expect(
      toBlockView(b, 'SPACE_OP_BLOCKED_CLINICAL', NOW, true).reasonText,
    ).toBe('Delirium agitado');
    expect(
      toBlockView(
        bloque({ reasonText: 'Cambio de filtro' }),
        'SPACE_OP_MAINTENANCE',
        NOW,
      ).reasonText,
    ).toBe('Cambio de filtro');
  });
});

describe('CareSpaceBlocksService.create', () => {
  function build(
    over: { overlap?: any[]; occupied?: boolean; conflicts?: any[] } = {},
  ) {
    const tx = {
      execute: fn(async (sql: string) => {
        if (
          sql.includes('care_space_blocks') &&
          sql.includes('limit 1') &&
          sql.includes('cancelled_at is null') &&
          !sql.includes('b.id')
        )
          return over.overlap ?? [];
        if (sql.includes('b.id = ?'))
          return [
            {
              id: 'new',
              tenant_id: TENANT,
              care_space_id: 'space-1',
              kind_concept_id: PRAC.BLOCK_ADMIN,
              reason_concept_id: PRAC.BLOCK_RSN_ADMIN_DECISION,
              starts_at: NOW,
              created_at: NOW,
              row_version: 1,
            },
          ];
        return [];
      }),
      insert: fn().mockResolvedValue(undefined),
    };
    const state = {
      stateOf: fn().mockResolvedValue({
        occupancy: over.occupied ? 'OCC_OCCUPIED' : 'OCC_FREE',
      }),
    };
    const recorder = {
      applyChange: fn().mockResolvedValue({
        row: makeRow(),
        state: { v2Code: 'C' },
        events: [],
      }),
    };
    const events = { publish: fn().mockResolvedValue(true) };
    const historyRepo = { append: fn() };
    const service = new CareSpaceBlocksService(
      state as any,
      recorder as any,
      events as any,
      historyRepo as any,
      {} as any,
    );
    (jest.spyOn as any)(service, 'commitments').mockResolvedValue(
      over.conflicts ?? [],
    );
    return { service, tx, recorder, events };
  }

  const input = {
    kind: 'BLOCK_ADMIN' as const,
    reasonConceptId: PRAC.BLOCK_RSN_ADMIN_DECISION,
    reasonText: null,
    startsAt: NOW,
    expectedEndAt: null,
    workOrderRef: null,
    acknowledgeConflicts: false,
    checkCommitments: true,
  };
  const ctx = {
    tenantId: TENANT,
    actorUserId: 'u',
    source: 'SRC_MANUAL',
    action: 'X',
    now: NOW,
  } as any;

  it('un bloqueo que empieza ahora se aplica y publica block_started', async () => {
    const d = build();
    const res = await d.service.create(d.tx as any, makeRow(), input, ctx);
    expect(res.applied).toBe(true);
    expect(d.recorder.applyChange.mock.calls[0][2].availability.to).toBe(
      'SPACE_OP_BLOCKED_ADMIN',
    );
    expect(d.events.publish.mock.calls[0][1].type).toBe(
      'practice.care_space.block_started',
    );
  });

  it('uno programado en el futuro se guarda sin tocar el espacio ni publicar', async () => {
    const d = build();
    const res = await d.service.create(
      d.tx as any,
      makeRow(),
      { ...input, startsAt: new Date(NOW.getTime() + 86_400_000) },
      ctx,
    );
    expect(res.applied).toBe(false);
    expect(d.recorder.applyChange).not.toHaveBeenCalled();
    expect(d.events.publish).not.toHaveBeenCalled();
  });

  it('un bloqueo superpuesto es 409 BLOCK_OVERLAP; una cama ocupada, 409 SPACE_OCCUPIED; compromisos futuros, 409 con la lista', async () => {
    const solapado = build({ overlap: [{ id: 'otro' }] });
    await expect(
      solapado.service.create(solapado.tx as any, makeRow(), input, ctx),
    ).rejects.toMatchObject({ status: 409, reason: 'BLOCK_OVERLAP' });
    const ocupada = build({ occupied: true });
    await expect(
      ocupada.service.create(ocupada.tx as any, makeRow(), input, ctx),
    ).rejects.toMatchObject({
      reason: 'SPACE_OCCUPIED',
    });
    const conflictos = build({
      conflicts: [
        {
          kind: 'PROCEDURE_CASE',
          id: 'c1',
          startsAt: 'x',
          nextAction: 'Reprogramar',
        },
      ],
    });
    await expect(
      conflictos.service.create(conflictos.tx as any, makeRow(), input, ctx),
    ).rejects.toMatchObject({
      reason: 'FUTURE_COMMITMENTS_CONFLICT',
      details: { conflicts: [expect.objectContaining({ id: 'c1' })] },
    });
    expect(conflictos.tx.insert).not.toHaveBeenCalled();
    const reconocido = await conflictos.service.create(
      conflictos.tx as any,
      makeRow(),
      { ...input, acknowledgeConflicts: true },
      ctx,
    );
    expect(reconocido.conflicts).toHaveLength(1);
  });

  it('el outbox de block_started no lleva el texto del motivo «condición del paciente»', async () => {
    const d = build();
    const b = bloque({
      kindConceptId: PRAC.BLOCK_CLINICAL,
      reasonConceptId: PRAC.BLOCK_RSN_PATIENT_CONDITION,
      reasonText: 'Delirium agitado',
    });
    await d.service.applyToSpace(d.tx as any, makeRow(), b, ctx, NOW);
    expect(JSON.stringify(d.events.publish.mock.calls[0][1])).not.toContain(
      'Delirium',
    );
  });
});
