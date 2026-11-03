import { describe, expect, it } from '@jest/globals';
import {
  evaluateCompatibility,
  judgePlacement,
  type CompatibilityInput,
} from './bed-compatibility';
import {
  computeCensus,
  computeIndicators,
  localDayWindow,
  stayDays,
  type CensusCounts,
} from './census';

const base: CompatibilityInput = {
  bedViolations: [],
  reserve: false,
  bedFunction: 'SPACE_FN_BED_STANDARD',
  airborneCapable: false,
  sexRestriction: 'SEX_ANY',
  ageGroup: 'AGE_ANY',
  patientSex: 'M',
  patientBirthDate: new Date('1980-01-01'),
  isolation: 'ISO_NONE',
  organism: null,
  levelOfCare: 'LOC_CARE_GENERAL',
  roommates: [],
  now: new Date('2026-10-31T12:00:00Z'),
};

describe('compatibilidad paciente ↔ cama (§F3.2)', () => {
  it('cama asignable y paciente compatible → sin violaciones', () => {
    expect(evaluateCompatibility(base)).toEqual([]);
    expect(judgePlacement([])).toEqual({ ok: true, forced: [] });
  });

  it('bloqueantes: ocupación de F2 y aéreo sin AIIR → 409 sin opción de forzar', () => {
    const v = evaluateCompatibility({
      ...base,
      bedViolations: ['OCCUPANCY'],
      isolation: 'ISO_AIRBORNE',
    });
    expect(v.map((x) => x.rule)).toEqual(['OCCUPANCY', 'ISOLATION_AIRBORNE']);
    expect(
      judgePlacement(v, {
        justification: 'x'.repeat(30),
        ruleCodes: ['ISOLATION_AIRBORNE'],
      }),
    ).toMatchObject({
      ok: false,
      reason: 'BED_NOT_ASSIGNABLE',
    });
  });

  it('reserva tolera la higiene pendiente', () => {
    expect(
      evaluateCompatibility({
        ...base,
        bedViolations: ['HYGIENE'],
        reserve: true,
      }),
    ).toEqual([]);
  });

  it('SEX: varón a habitación femenina → forzable; sin override 422, con override corto 422, válido ok', () => {
    const v = evaluateCompatibility({ ...base, sexRestriction: 'SEX_FEMALE' });
    expect(v).toEqual([
      { rule: 'SEX', severity: 'OVERRIDABLE', detail: 'Habitación SEX_FEMALE' },
    ]);
    expect(judgePlacement(v)).toMatchObject({
      reason: 'BED_COMPATIBILITY_OVERRIDE_REQUIRED',
    });
    expect(
      judgePlacement(v, { justification: 'corta', ruleCodes: ['SEX'] }),
    ).toMatchObject({
      reason: 'OVERRIDE_JUSTIFICATION_TOO_SHORT',
    });
    expect(
      judgePlacement(v, {
        justification: 'Única cama disponible en la unidad',
        ruleCodes: ['SEX'],
      }),
    ).toEqual({
      ok: true,
      forced: ['SEX'],
    });
  });

  it('AGE, LEVEL_OF_CARE e ISOLATION_COHORT son forzables', () => {
    const v = evaluateCompatibility({
      ...base,
      ageGroup: 'AGE_PEDIATRIC',
      levelOfCare: 'LOC_CARE_ICU',
      isolation: 'ISO_CONTACT',
      roommates: [{ sex: 'M', isolation: 'ISO_NONE', organism: null }],
    });
    expect(v.map((x) => [x.rule, x.severity])).toEqual([
      ['AGE', 'OVERRIDABLE'],
      ['ISOLATION_COHORT', 'OVERRIDABLE'],
      ['LEVEL_OF_CARE', 'OVERRIDABLE'],
    ]);
  });
});

describe('censo y fórmulas OPS (§F3.3)', () => {
  const w = {
    dayStart: new Date('2026-10-27T04:00:00Z'),
    cutoff: new Date('2026-10-28T04:00:00Z'),
  };

  it('patient_days = presentes al corte + estancias del día; egresos con días de estancia', () => {
    const c = computeCensus(
      [
        {
          encounterId: 'a',
          start: new Date('2026-10-25T10:00:00Z'),
          end: null,
          startKind: 'ADMIT',
          endKind: null,
          admittedAt: new Date('2026-10-25T10:00:00Z'),
        },
        {
          encounterId: 'b',
          start: new Date('2026-10-27T08:00:00Z'),
          end: new Date('2026-10-27T20:00:00Z'),
          startKind: 'ADMIT',
          endKind: 'DISCHARGE',
          admittedAt: new Date('2026-10-27T08:00:00Z'),
        },
        {
          encounterId: 'c',
          start: new Date('2026-10-20T08:00:00Z'),
          end: new Date('2026-10-27T15:00:00Z'),
          startKind: 'ADMIT',
          endKind: 'DEATH',
          admittedAt: new Date('2026-10-20T08:00:00Z'),
        },
      ],
      w,
      { censable: 10, available: 9 },
      -240,
    );
    expect(c).toMatchObject({
      patientsAtCutoff: 1,
      sameDayStays: 1,
      patientDays: 2,
      admissions: 1,
      discharges: 2,
      deaths: 1,
      dischargeStayDays: 1 + 7,
      bedsBlocked: 1,
    });
  });

  it('indicadores de 7 días con valores conocidos coinciden al decimal', () => {
    const day = (
      patientDays: number,
      discharges: number,
      stay: number,
    ): CensusCounts => ({
      bedsCensable: 10,
      bedsAvailable: 10,
      bedsBlocked: 0,
      patientsAtCutoff: patientDays,
      admissions: discharges,
      discharges,
      deaths: 0,
      transfersIn: 0,
      transfersOut: 0,
      sameDayStays: 0,
      patientDays,
      dischargeStayDays: stay,
    });
    const r = computeIndicators(
      [
        day(8, 2, 8),
        day(8, 2, 8),
        day(8, 2, 8),
        day(8, 2, 8),
        day(8, 2, 8),
        day(8, 2, 8),
        day(8, 2, 8),
      ],
      7,
    );
    expect(r.bedDaysAvailable).toBe(70);
    expect(r.patientDays).toBe(56);
    expect(r.occupancyPct).toBeCloseTo(80, 6);
    expect(r.alos).toBeCloseTo(4, 6);
    expect(r.avgBeds).toBeCloseTo(10, 6);
    expect(r.bedTurnover).toBeCloseTo(1.4, 6);
    expect(r.turnoverInterval).toBeCloseTo(1, 6);
    expect(r.crossCheck.occupancyFromAlos).toBeCloseTo(80, 6);
    expect(r.crossCheck.deltaPct).toBeCloseTo(0, 6);
  });

  it('días de estancia mínimo 1 y ventana local de La Paz (UTC−4)', () => {
    expect(
      stayDays(
        new Date('2026-10-27T10:00:00Z'),
        new Date('2026-10-27T18:00:00Z'),
      ),
    ).toBe(1);
    expect(localDayWindow('2026-10-27', 'America/La_Paz')).toEqual(w);
  });
});
