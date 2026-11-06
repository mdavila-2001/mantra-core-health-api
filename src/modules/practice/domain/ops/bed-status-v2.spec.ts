import {
  assignabilityViolations,
  isAssignable,
  v2CodeOf,
  type OperationalAxes,
} from './bed-status-v2';
import {
  availabilityFromBlocks,
  judgeBlockRequest,
  judgeIsolationCapability,
} from './availability-rules';
import {
  effectiveCleaningType,
  hygieneAfter,
  judgeCleaningTransition,
  judgeInspection,
  judgeManualCleaningType,
} from './cleaning-rules';

const FREE: OperationalAxes = {
  lifecycle: 'ACTIVE',
  inValidity: true,
  availability: 'SPACE_OP_AVAILABLE',
  hygiene: 'HYG_INSPECTED',
  isolation: 'ISO_NONE',
  occupancy: 'OCC_FREE',
  terminalCleaningRequired: false,
};
const NO_INSPECTION = { inspectionRequired: false };
const WITH_INSPECTION = { inspectionRequired: true };

describe('bed-status-v2 (§F2.2, primera regla que aplica)', () => {
  it.each<[string, Partial<OperationalAxes>, string]>([
    ['1 bloqueada', { availability: 'SPACE_OP_BLOCKED_CLINICAL' }, 'C'],
    ['1 mantenimiento', { availability: 'SPACE_OP_MAINTENANCE' }, 'C'],
    ['1 cerrada', { availability: 'SPACE_OP_CLOSED' }, 'C'],
    ['1 ciclo no activo', { lifecycle: 'SUSPENDED' }, 'C'],
    [
      '1 gana a contaminada',
      { availability: 'SPACE_OP_CLOSED', hygiene: 'HYG_CONTAMINATED' },
      'C',
    ],
    ['2 contaminada', { hygiene: 'HYG_CONTAMINATED' }, 'K'],
    [
      '2 gana a aislamiento',
      { hygiene: 'HYG_CONTAMINATED', isolation: 'ISO_CONTACT' },
      'K',
    ],
    ['3 aislamiento', { isolation: 'ISO_DROPLET' }, 'I'],
    [
      '3 gana a ocupada',
      { isolation: 'ISO_AIRBORNE', occupancy: 'OCC_OCCUPIED' },
      'I',
    ],
    ['4 ocupada', { occupancy: 'OCC_OCCUPIED' }, 'O'],
    [
      '4 gana a sucia',
      { occupancy: 'OCC_OCCUPIED', hygiene: 'HYG_DIRTY' },
      'O',
    ],
    ['5 reservada', { occupancy: 'OCC_RESERVED' }, 'R'],
    ['6 sucia', { hygiene: 'HYG_DIRTY' }, 'H'],
    ['6 en limpieza', { hygiene: 'HYG_CLEANING' }, 'H'],
    ['6 terminal pendiente', { terminalCleaningRequired: true }, 'H'],
    ['7 inspeccionada', {}, 'U'],
    ['7 limpia sin inspección exigida', { hygiene: 'HYG_CLEAN' }, 'U'],
  ])('%s → %s', (_name, patch, expected) => {
    expect(v2CodeOf({ ...FREE, ...patch }, NO_INSPECTION)).toBe(expected);
  });

  it('6 limpia con inspección exigida → H', () => {
    expect(v2CodeOf({ ...FREE, hygiene: 'HYG_CLEAN' }, WITH_INSPECTION)).toBe(
      'H',
    );
  });

  it('asignable: inspeccionada y libre; limpia sólo sin inspección exigida', () => {
    expect(isAssignable(FREE, WITH_INSPECTION)).toBe(true);
    expect(isAssignable({ ...FREE, hygiene: 'HYG_CLEAN' }, NO_INSPECTION)).toBe(
      true,
    );
    expect(
      isAssignable({ ...FREE, hygiene: 'HYG_CLEAN' }, WITH_INSPECTION),
    ).toBe(false);
  });

  it('no asignable (fail-closed): cada eje que falla se informa', () => {
    expect(
      assignabilityViolations(
        {
          ...FREE,
          inValidity: false,
          availability: 'SPACE_OP_MAINTENANCE',
          occupancy: 'OCC_RESERVED',
          terminalCleaningRequired: true,
        },
        NO_INSPECTION,
      ),
    ).toEqual(['LIFECYCLE', 'AVAILABILITY', 'OCCUPANCY', 'HYGIENE']);
  });
});

describe('reglas de bloqueo (§F2.3 availability)', () => {
  const base = {
    lifecycle: 'ACTIVE' as const,
    occupancy: 'OCC_FREE' as const,
  };

  it('mantenimiento con motivo y fecha estimada → ok', () => {
    expect(
      judgeBlockRequest({
        ...base,
        action: 'start-maintenance',
        reasonCode: 'BLOCK_RSN_PREVENTIVE_MAINTENANCE',
        expectedEndAt: new Date(Date.now() + 3_600_000),
      }),
    ).toEqual({ ok: true, kind: 'BLOCK_MAINTENANCE' });
  });

  it.each<[string, Record<string, unknown>, string]>([
    ['sin motivo', { action: 'block' }, 'BLOCK_REASON_REQUIRED'],
    [
      'OTHER sin texto',
      { action: 'block', reasonCode: 'BLOCK_RSN_OTHER' },
      'BLOCK_REASON_TEXT_REQUIRED',
    ],
    [
      'mantenimiento sin fecha',
      {
        action: 'start-maintenance',
        reasonCode: 'BLOCK_RSN_PREVENTIVE_MAINTENANCE',
      },
      'BLOCK_EXPECTED_END_REQUIRED',
    ],
    [
      'motivo de otro tipo',
      { action: 'block', reasonCode: 'BLOCK_RSN_PREVENTIVE_MAINTENANCE' },
      'BLOCK_REASON_KIND_MISMATCH',
    ],
    [
      'kind inválido',
      {
        action: 'block',
        kindCode: 'BLOCK_CLOSURE',
        reasonCode: 'BLOCK_RSN_OTHER',
        reasonText: 'x',
      },
      'BLOCK_REASON_KIND_MISMATCH',
    ],
  ])('%s → %s', (_n, input, reason) => {
    expect(judgeBlockRequest({ ...base, ...(input as any) })).toMatchObject({
      ok: false,
      reason,
    });
  });

  it('ocupada → SPACE_OCCUPIED; no activa → SPACE_NOT_ACTIVE', () => {
    const req = {
      action: 'block' as const,
      reasonCode: 'BLOCK_RSN_STAFF_SHORTAGE',
    };
    expect(
      judgeBlockRequest({ ...base, ...req, occupancy: 'OCC_RESERVED' }),
    ).toMatchObject({ reason: 'SPACE_OCCUPIED' });
    expect(
      judgeBlockRequest({ ...base, ...req, lifecycle: 'PLANNED' }),
    ).toMatchObject({ reason: 'SPACE_NOT_ACTIVE' });
  });

  it('disponibilidad derivada por precedencia', () => {
    expect(availabilityFromBlocks([])).toBe('SPACE_OP_AVAILABLE');
    expect(
      availabilityFromBlocks(['BLOCK_CLINICAL', 'BLOCK_MAINTENANCE']),
    ).toBe('SPACE_OP_MAINTENANCE');
    expect(availabilityFromBlocks(['BLOCK_ADMIN', 'BLOCK_CLOSURE'])).toBe(
      'SPACE_OP_CLOSED',
    );
  });

  it('aislamiento aéreo sin AIIR validado → faltantes; con todo → ok', () => {
    const now = new Date('2026-10-31T12:00:00Z');
    expect(
      judgeIsolationCapability(
        'ISO_AIRBORNE',
        {
          functionCode: 'SPACE_FN_BED_STANDARD',
          pressureCode: null,
          hvacValidatedOn: null,
        },
        365,
        now,
      ),
    ).toEqual({
      ok: false,
      reason: 'ISOLATION_ROOM_NOT_CAPABLE',
      details: { missing: ['AIIR', 'NEGATIVE_PRESSURE', 'HVAC_VALIDATION'] },
    });
    expect(
      judgeIsolationCapability(
        'ISO_AIRBORNE',
        {
          functionCode: 'SPACE_FN_ISOLATION_AIIR',
          pressureCode: 'PRESSURE_NEGATIVE',
          hvacValidatedOn: new Date('2026-06-01'),
        },
        365,
        now,
      ),
    ).toEqual({ ok: true });
    expect(
      judgeIsolationCapability(
        'ISO_CONTACT',
        { functionCode: null, pressureCode: null, hvacValidatedOn: null },
        365,
        now,
      ),
    ).toEqual({ ok: true });
  });
});

describe('máquina de limpieza (§F2.2)', () => {
  it('PENDING → start → IN_PROGRESS → finish → DONE → inspect → INSPECTED', () => {
    expect(judgeCleaningTransition('CLN_PENDING', 'start')).toEqual({
      ok: true,
      to: 'CLN_IN_PROGRESS',
    });
    expect(judgeCleaningTransition('CLN_IN_PROGRESS', 'finish')).toEqual({
      ok: true,
      to: 'CLN_DONE',
    });
    expect(judgeCleaningTransition('CLN_DONE', 'inspect')).toEqual({
      ok: true,
      to: 'CLN_INSPECTED',
    });
    expect(judgeCleaningTransition('CLN_DONE', 'inspect', true)).toEqual({
      ok: true,
      to: 'CLN_REJECTED',
    });
    expect(hygieneAfter('start')).toBe('HYG_CLEANING');
    expect(hygieneAfter('finish')).toBe('HYG_CLEAN');
    expect(hygieneAfter('inspect')).toBe('HYG_INSPECTED');
    expect(hygieneAfter('inspect', true)).toBe('HYG_DIRTY');
  });

  it('transición inválida → 409 con from/to', () => {
    expect(judgeCleaningTransition('CLN_PENDING', 'finish')).toEqual({
      ok: false,
      reason: 'CLEANING_ORDER_INVALID_TRANSITION',
      details: { from: 'CLN_PENDING', to: 'CLN_DONE', action: 'finish' },
    });
    expect(judgeCleaningTransition('CLN_INSPECTED', 'cancel')).toMatchObject({
      ok: false,
    });
  });

  it('inspección: quien terminó no inspecciona; FAIL exige motivo; terminal exige supervisor', () => {
    const base = {
      inspectorUserId: 'u2',
      finishedByUserId: 'u1',
      failed: false,
      terminal: false,
      inspectorIsSupervisor: false,
    };
    expect(judgeInspection(base)).toEqual({ ok: true });
    expect(judgeInspection({ ...base, inspectorUserId: 'u1' })).toMatchObject({
      reason: 'INSPECTION_BY_CLEANER_NOT_ALLOWED',
    });
    expect(judgeInspection({ ...base, failed: true })).toMatchObject({
      reason: 'INSPECTION_REASON_REQUIRED',
    });
    expect(judgeInspection({ ...base, terminal: true })).toMatchObject({
      reason: 'TERMINAL_INSPECTION_REQUIRES_SUPERVISOR',
    });
    expect(
      judgeInspection({ ...base, terminal: true, inspectorIsSupervisor: true }),
    ).toEqual({ ok: true });
  });

  it('con bandera terminal sólo vale TERMINAL', () => {
    expect(judgeManualCleaningType('CLEAN_ROUTINE', true)).toMatchObject({
      reason: 'TERMINAL_CLEANING_REQUIRED',
    });
    expect(judgeManualCleaningType('CLEAN_TERMINAL', true)).toEqual({
      ok: true,
    });
    expect(effectiveCleaningType('CLEAN_DISCHARGE', true)).toBe(
      'CLEAN_TERMINAL',
    );
    expect(effectiveCleaningType('CLEAN_DISCHARGE', false)).toBe(
      'CLEAN_DISCHARGE',
    );
  });
});
