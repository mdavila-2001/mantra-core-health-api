import {
  CENSUS_NUMERIC_FIELDS,
  censusContentHash,
  computeCensus,
  localDate,
  stayDays,
  type CensusBed,
  type CensusEncounter,
  type CensusInput,
  type CensusLocation,
} from './census-calculation';

const TZ = 'America/La_Paz'; // UTC-4 todo el año
const UNIT = 'unit-A';
const OTHER_UNIT = 'unit-B';
// Día D = 2026-10-28 en La Paz: 04:00Z del 28 al 04:00Z del 29.
const DAY_START = new Date('2026-10-28T04:00:00Z');
const CUTOFF = new Date('2026-10-29T04:00:00Z');
const at = (hhmmLocal: string, day = '28'): Date =>
  new Date(`2026-10-${day}T${hhmmLocal}:00-04:00`);

const bed = (id: string, over: Partial<CensusBed> = {}): CensusBed => ({
  id,
  unitId: UNIT,
  censable: true,
  inForceAtCutoff: true,
  availableAtCutoff: true,
  categoryConceptId: 'cat-1',
  ...over,
});
const loc = (id: string, over: Partial<CensusLocation>): CensusLocation => ({
  id,
  encounterId: `enc-${id}`,
  patientProfileId: `pat-${id}`,
  careSpaceId: 'b1',
  periodStart: at('08:00'),
  periodEnd: null,
  movement: 'ADT_ADMIT',
  endReason: null,
  previousLocationId: null,
  bedCategoryConceptId: null,
  ...over,
});
const enc = (id: string, startAt: Date, dischargeDisposition: string | null = null): CensusEncounter => ({
  id,
  startAt,
  dischargeDisposition,
});

const run = (over: Partial<CensusInput>) =>
  computeCensus({
    unitId: UNIT,
    dayStart: DAY_START,
    cutoff: CUTOFF,
    timeZone: TZ,
    beds: [],
    locations: [],
    encounters: [],
    ...over,
  });

describe('computeCensus', () => {
  it('camas: censables vigentes, disponibles y bloqueadas (disponibles + bloqueadas = censables)', () => {
    const { counts } = run({
      beds: [
        bed('b1'),
        bed('b2'),
        bed('b3', { availableAtCutoff: false }),
        bed('b4', { censable: false }), // no censable
        bed('b5', { inForceAtCutoff: false }), // no vigente en el corte
        bed('b6', { unitId: OTHER_UNIT }), // de otra unidad
      ],
    });
    expect(counts.beds_censable).toBe(3);
    expect(counts.beds_available).toBe(2);
    expect(counts.beds_blocked).toBe(1);
    expect(counts.beds_available + counts.beds_blocked).toBe(counts.beds_censable);
  });

  it('un paciente que ingresó y sigue está presente en el corte y cuenta como ingreso', () => {
    const l = loc('1', { careSpaceId: 'b1' });
    const { counts, entries } = run({
      beds: [bed('b1')],
      locations: [l],
      encounters: [enc(l.encounterId, l.periodStart)],
    });
    expect(counts).toMatchObject({ patients_at_cutoff: 1, admissions: 1, discharges: 0, same_day_stays: 0, patient_days: 1 });
    expect(entries.map((e) => e.movement).sort()).toEqual(['ADMITTED', 'PRESENT']);
  });

  it('una estancia que empieza y termina el mismo día es una estancia del día (cuenta 1 día-paciente)', () => {
    const l = loc('2', { periodStart: at('09:00'), periodEnd: at('17:00'), endReason: 'ADT_END_DISCHARGE' });
    const { counts, entries } = run({
      beds: [bed('b1')],
      locations: [l],
      encounters: [enc(l.encounterId, l.periodStart, 'DISP_HOME')],
    });
    expect(counts).toMatchObject({
      patients_at_cutoff: 0,
      admissions: 1,
      discharges: 1,
      same_day_stays: 1,
      patient_days: 1,
      discharge_stay_days: 1, // mismo día = 1 (mínimo)
      deaths: 0,
    });
    expect(entries.map((e) => e.movement).sort()).toEqual(['ADMITTED', 'DISCHARGED', 'SAME_DAY']);
  });

  it('un egreso de un paciente que venía de antes no suma día-paciente ese día y sus días de estancia son fecha de egreso − fecha de ingreso', () => {
    const l = loc('3', {
      periodStart: at('10:00', '25'),
      periodEnd: at('11:30'),
      endReason: 'ADT_END_DISCHARGE',
      movement: 'ADT_ADMIT',
    });
    const { counts } = run({
      beds: [bed('b1')],
      locations: [l],
      encounters: [enc(l.encounterId, l.periodStart, 'DISP_HOME')],
    });
    expect(counts).toMatchObject({
      patients_at_cutoff: 0,
      same_day_stays: 0,
      patient_days: 0,
      admissions: 0,
      discharges: 1,
      discharge_stay_days: 3, // 25 → 28
    });
  });

  it('un fallecimiento cuenta como egreso y como defunción', () => {
    const l = loc('4', { periodStart: at('00:30', '26'), periodEnd: at('03:00'), endReason: 'ADT_END_DISCHARGE' });
    const { counts } = run({
      beds: [bed('b1')],
      locations: [l],
      encounters: [enc(l.encounterId, l.periodStart, 'DISP_DEATH')],
    });
    expect(counts).toMatchObject({ discharges: 1, deaths: 1, discharge_stay_days: 2 });
  });

  it('el traslado dentro de la unidad no es egreso, ni entrada ni salida de la unidad, y el paciente cuenta una vez', () => {
    const first = loc('5a', {
      encounterId: 'enc-5',
      careSpaceId: 'b1',
      periodStart: at('08:00'),
      periodEnd: at('14:00'),
      endReason: 'ADT_END_TRANSFER_OUT',
    });
    const second = loc('5b', {
      encounterId: 'enc-5',
      careSpaceId: 'b2',
      periodStart: at('14:00'),
      movement: 'ADT_TRANSFER',
      previousLocationId: '5a',
    });
    const { counts } = run({
      beds: [bed('b1'), bed('b2')],
      locations: [first, second],
      encounters: [enc('enc-5', first.periodStart)],
    });
    expect(counts).toMatchObject({
      patients_at_cutoff: 1,
      same_day_stays: 0, // sigue en el corte
      patient_days: 1,
      transfers_in: 0,
      transfers_out: 0,
      discharges: 0,
      admissions: 1,
    });
  });

  it('el traslado entre unidades es salida de una y entrada de la otra', () => {
    const first = loc('6a', {
      encounterId: 'enc-6',
      careSpaceId: 'b1',
      periodStart: at('08:00', '27'),
      periodEnd: at('15:00'),
      endReason: 'ADT_END_TRANSFER_OUT',
    });
    const second = loc('6b', {
      encounterId: 'enc-6',
      careSpaceId: 'b9',
      periodStart: at('15:00'),
      movement: 'ADT_TRANSFER',
      previousLocationId: '6a',
    });
    const beds = [bed('b1'), bed('b9', { unitId: OTHER_UNIT })];
    const input = { beds, locations: [first, second], encounters: [enc('enc-6', first.periodStart)] };
    const a = run(input);
    expect(a.counts).toMatchObject({ transfers_out: 1, transfers_in: 0, patients_at_cutoff: 0, patient_days: 0 });
    const b = run({ ...input, unitId: OTHER_UNIT });
    expect(b.counts).toMatchObject({ transfers_in: 1, transfers_out: 0, patients_at_cutoff: 1, patient_days: 1 });
  });

  it('una camilla no censable no entra en el censo', () => {
    const l = loc('7', {});
    const { counts } = run({
      beds: [bed('b1', { censable: false })],
      locations: [l],
      encounters: [enc(l.encounterId, l.periodStart)],
    });
    expect(counts.patients_at_cutoff).toBe(0);
    expect(counts.patient_days).toBe(0);
  });

  it('las entradas salen en orden estable (misma entrada ⇒ misma huella)', () => {
    const l1 = loc('8a', { careSpaceId: 'b1' });
    const l2 = loc('8b', { careSpaceId: 'b2', periodStart: at('09:00') });
    const base = { beds: [bed('b1'), bed('b2')], encounters: [enc(l1.encounterId, l1.periodStart), enc(l2.encounterId, l2.periodStart)] };
    const a = run({ ...base, locations: [l1, l2] });
    const b = run({ ...base, locations: [l2, l1] });
    expect(a.entries).toEqual(b.entries);
    expect(censusContentHash(a.counts, a.entries)).toBe(censusContentHash(b.counts, b.entries));
    expect(censusContentHash(a.counts, a.entries)).toMatch(/^[0-9a-f]{64}$/);
    // y cambia si cambia un número
    expect(censusContentHash({ ...a.counts, admissions: 99 }, a.entries)).not.toBe(
      censusContentHash(a.counts, a.entries),
    );
  });

  it('conoce las doce columnas numéricas del contrato', () => {
    expect(CENSUS_NUMERIC_FIELDS).toHaveLength(12);
    expect(run({}).counts).toEqual(Object.fromEntries(CENSUS_NUMERIC_FIELDS.map((f) => [f, 0])));
  });
});

describe('stayDays / localDate', () => {
  it('cuenta días calendario de la sede, mínimo 1', () => {
    expect(stayDays(at('08:00'), at('17:00'), TZ)).toBe(1);
    expect(stayDays(at('23:30', '25'), at('00:30', '26'), TZ)).toBe(1);
    expect(stayDays(at('10:00', '25'), at('11:00', '28'), TZ)).toBe(3);
  });

  it('usa la zona de la sede y no UTC', () => {
    // 01:00Z del 29 es todavía el 28 en La Paz.
    expect(localDate(new Date('2026-10-29T01:00:00Z'), TZ)).toBe('2026-10-28');
    expect(localDate(new Date('2026-10-29T01:00:00Z'), 'UTC')).toBe('2026-10-29');
    expect(stayDays(new Date('2026-10-28T03:00:00Z'), new Date('2026-10-29T05:00:00Z'), TZ)).toBe(2);
  });
});
