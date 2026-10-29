import {
  billableInterval,
  intervalMinutes,
  orTimeUnits,
  type OrCaseTimes,
} from './or-time-rules';

const d = (iso: string): Date => new Date(iso);
const none: OrCaseTimes = {
  patientInRoomAt: null,
  patientOutOfRoomAt: null,
  actualStartAt: null,
  actualEndAt: null,
};

describe('orTimeUnits', () => {
  it('95 minutos con unidad de 30 son 4 unidades (redondeo hacia arriba)', () => {
    expect(orTimeUnits(95, 30, null)).toBe(4);
  });
  it('2 h 10 min con fracción de 30 min facturan 2 h 30 min (5 unidades)', () => {
    expect(orTimeUnits(130, 30, null)).toBe(5);
  });
  it('un múltiplo exacto no suma una unidad de más', () => {
    expect(orTimeUnits(90, 30, null)).toBe(3);
    expect(orTimeUnits(90.00000000001, 30, null)).toBe(3);
  });
  it('un segundo de más sí pide otra unidad', () => {
    expect(orTimeUnits(90 + 1 / 60, 30, null)).toBe(4);
  });
  it('el mínimo de la tarifa manda cuando el caso es más corto', () => {
    expect(orTimeUnits(10, 30, 3)).toBe(3);
    expect(orTimeUnits(200, 30, 3)).toBe(7);
  });
  it('minutos o unidad no positivos son un error', () => {
    expect(() => orTimeUnits(0, 30, null)).toThrow(RangeError);
    expect(() => orTimeUnits(10, 0, null)).toThrow(RangeError);
  });
});

describe('billableInterval', () => {
  it('prefiere los hechos de sala (entrada y salida del paciente)', () => {
    const i = billableInterval({
      patientInRoomAt: d('2026-10-29T10:00:00Z'),
      patientOutOfRoomAt: d('2026-10-29T11:35:00Z'),
      actualStartAt: d('2026-10-29T10:10:00Z'),
      actualEndAt: d('2026-10-29T11:20:00Z'),
    });
    expect(i?.source).toBe('ROOM_EVENTS');
    expect(intervalMinutes(i!)).toBe(95);
  });
  it('sin hechos de sala completos cae a inicio y fin reales del caso', () => {
    const i = billableInterval({
      ...none,
      patientInRoomAt: d('2026-10-29T10:00:00Z'),
      actualStartAt: d('2026-10-29T10:10:00Z'),
      actualEndAt: d('2026-10-29T11:20:00Z'),
    });
    expect(i?.source).toBe('CASE_ACTUALS');
    expect(intervalMinutes(i!)).toBe(70);
  });
  it('sin ningún intervalo completo no hay nada que facturar', () => {
    expect(billableInterval(none)).toBeNull();
    expect(
      billableInterval({ ...none, actualStartAt: d('2026-10-29T10:00:00Z') }),
    ).toBeNull();
  });
});
