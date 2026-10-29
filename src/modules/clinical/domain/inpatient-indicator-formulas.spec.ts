import type { CensusCounts } from './census-calculation';
import {
  computeIndicators,
  percentile,
  turnaround,
  type TurnaroundSample,
} from './inpatient-indicator-formulas';

const day = (over: Partial<CensusCounts>): CensusCounts => ({
  beds_censable: 0,
  beds_available: 0,
  beds_blocked: 0,
  patients_at_cutoff: 0,
  admissions: 0,
  discharges: 0,
  deaths: 0,
  transfers_in: 0,
  transfers_out: 0,
  same_day_stays: 0,
  patient_days: 0,
  discharge_stay_days: 0,
  ...over,
});

/**
 * Fixture de 7 días con valores conocidos, calculado a mano:
 *
 *   10 camas censables; la cama 10 está bloqueada 2 días (días 3 y 4)
 *   ⇒ camas disponibles: 10,10,9,9,10,10,10 = 68 días-cama
 *   días-paciente: 6,7,7,8,8,7,7 = 50
 *   egresos por día: 1,0,2,1,1,0,1 = 6; ingresos 7
 *   días de estancia de los egresos: 4+0+(3+5)+2+6+0+4 = 24
 *
 *   ocupación = 50 / 68 × 100 = 73,5294…% → 73,53
 *   ALOS = 24 / 6 = 4
 *   camas promedio = 68 / 7 = 9,7142… → 9,71
 *   giro = 6 / 9,7142… = 0,6176… → 0,62
 *   intervalo de sustitución = (68 − 50) / 6 = 3
 *   ocupación por ALOS = 4 × 0,6176… / 7 × 100 = 35,29…% (los días de estancia de los
 *   egresos —24— no coinciden con los días-paciente —50— porque casi todos los internados
 *   cruzan el borde del período: la prueba cruzada sólo vale sin pacientes que lo crucen)
 */
const WEEK: CensusCounts[] = [
  day({
    beds_censable: 10,
    beds_available: 10,
    beds_blocked: 0,
    patient_days: 6,
    admissions: 1,
    discharges: 1,
    discharge_stay_days: 4,
  }),
  day({
    beds_censable: 10,
    beds_available: 10,
    beds_blocked: 0,
    patient_days: 7,
    admissions: 1,
  }),
  day({
    beds_censable: 10,
    beds_available: 9,
    beds_blocked: 1,
    patient_days: 7,
    admissions: 1,
    discharges: 2,
    discharge_stay_days: 8,
  }),
  day({
    beds_censable: 10,
    beds_available: 9,
    beds_blocked: 1,
    patient_days: 8,
    admissions: 2,
    discharges: 1,
    discharge_stay_days: 2,
  }),
  day({
    beds_censable: 10,
    beds_available: 10,
    beds_blocked: 0,
    patient_days: 8,
    admissions: 1,
    discharges: 1,
    discharge_stay_days: 6,
  }),
  day({
    beds_censable: 10,
    beds_available: 10,
    beds_blocked: 0,
    patient_days: 7,
  }),
  day({
    beds_censable: 10,
    beds_available: 10,
    beds_blocked: 0,
    patient_days: 7,
    admissions: 1,
    discharges: 1,
    discharge_stay_days: 4,
  }),
];

describe('computeIndicators', () => {
  it('coincide con el cálculo manual de un fixture de 7 días', () => {
    const r = computeIndicators(WEEK, 7, []);
    expect(r.bedDaysAvailable).toBe(68);
    expect(r.patientDays).toBe(50);
    expect(r.admissions).toBe(7);
    expect(r.discharges).toBe(6);
    expect(r.dischargeStayDays).toBe(24);
    expect(r.occupancyPct).toBe(73.53);
    expect(r.alos).toBe(4);
    expect(r.avgBeds).toBe(9.71);
    expect(r.bedTurnover).toBe(0.62);
    expect(r.turnoverInterval).toBe(3);
  });

  it('prueba cruzada: ocupación ≈ ALOS × giro ÷ días × 100 cuando los días-paciente son los días de estancia de los egresos', () => {
    // Sin pacientes que crucen los bordes: DP == Σ días de estancia de los egresos.
    const closed = [
      day({
        beds_available: 10,
        patient_days: 5,
        discharges: 1,
        discharge_stay_days: 8,
      }),
      day({ beds_available: 10, patient_days: 5 }),
      day({
        beds_available: 10,
        patient_days: 6,
        discharges: 2,
        discharge_stay_days: 12,
      }),
      day({ beds_available: 10, patient_days: 4 }),
    ];
    const r = computeIndicators(closed, 4, []);
    expect(r.occupancyPct).toBe(50); // 20 / 40
    expect(r.crossCheck.occupancyFromAlos).toBe(50);
    expect(r.crossCheck.deltaPct).toBe(0);
    // Sin ajustes y sin cruces, queda por debajo del 5 % que fija el contrato.
    expect(r.crossCheck.deltaPct!).toBeLessThan(5);
  });

  it('con pacientes que cruzan el borde la prueba cruzada lo delata en deltaPct', () => {
    const r = computeIndicators(WEEK, 7, []);
    expect(r.crossCheck.occupancyFromAlos).toBe(35.29);
    expect(r.crossCheck.deltaPct).toBe(52); // |35,29 − 73,53| / 73,53 = 52 %
  });

  it('los días faltantes no se inventan: bajan las camas promedio pero no la ocupación', () => {
    const r = computeIndicators(WEEK.slice(0, 3), 7, []);
    expect(r.bedDaysAvailable).toBe(29);
    expect(r.patientDays).toBe(20);
    expect(r.occupancyPct).toBe(68.97);
    expect(r.avgBeds).toBe(4.14);
  });

  it('sin egresos no hay estancia, giro ni intervalo (null, no 0 ni NaN)', () => {
    const r = computeIndicators(
      [day({ beds_available: 10, patient_days: 5 })],
      1,
      [],
    );
    expect(r.alos).toBeNull();
    expect(r.turnoverInterval).toBeNull();
    expect(r.bedTurnover).toBe(0);
    expect(r.crossCheck.occupancyFromAlos).toBeNull();
    expect(r.crossCheck.deltaPct).toBeNull();
  });

  it('sin camas disponibles no hay ocupación ni promedio', () => {
    const r = computeIndicators([], 7, []);
    expect(r.occupancyPct).toBeNull();
    expect(r.avgBeds).toBe(0);
    expect(r.bedTurnover).toBeNull();
  });
});

describe('percentile', () => {
  it('interpola como percentile_cont', () => {
    expect(percentile([10, 20, 30, 40], 0.5)).toBe(25);
    expect(percentile([10, 20, 30, 40], 0.9)).toBeCloseTo(37, 6);
    expect(percentile([5], 0.9)).toBe(5);
    expect(percentile([], 0.5)).toBeNull();
  });
});

describe('turnaround (rotación de cama)', () => {
  const t = (min: number): Date => new Date(Date.UTC(2026, 9, 28, 12, min, 0));
  const sample = (
    d: number,
    started: number | null,
    finished: number | null,
    inspected: number | null,
  ): TurnaroundSample => ({
    dischargedAt: t(d),
    requestedAt: t(d),
    startedAt: started === null ? null : t(started),
    finishedAt: finished === null ? null : t(finished),
    inspectedAt: inspected === null ? null : t(inspected),
  });

  it('del egreso a la inspección (o al fin de la limpieza si no hubo), con desglose', () => {
    const r = turnaround([
      sample(0, 10, 40, 50), // 50 min: espera 10, limpieza 30, inspección 10
      sample(0, 20, 50, null), // 50 min: sin inspección ⇒ disponible al terminar
      sample(0, 30, 90, 100), // 100 min: espera 30, limpieza 60, inspección 10
      sample(0, 5, null, null), // sin terminar: no cuenta
    ]);
    expect(r.samples).toBe(3);
    expect(r.p50).toBe(50);
    expect(r.p90).toBe(90);
    expect(r.waitToStart).toBe(20);
    expect(r.cleaning).toBe(40);
    expect(r.inspection).toBe(10);
  });

  it('sin muestras no hay números', () => {
    expect(turnaround([])).toMatchObject({ samples: 0, p50: null, p90: null });
  });
});
