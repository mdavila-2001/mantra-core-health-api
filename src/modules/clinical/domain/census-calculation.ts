import { createHash } from 'node:crypto';

/** Movimiento de una entrada del censo (`CEN_*`, sin el prefijo). */
export type CensusMovement =
  | 'PRESENT'
  | 'ADMITTED'
  | 'DISCHARGED'
  | 'TRANSFER_IN'
  | 'TRANSFER_OUT'
  | 'SAME_DAY';

/** Las doce columnas numéricas del censo (y los únicos `field_code` ajustables). */
export const CENSUS_NUMERIC_FIELDS = [
  'beds_censable',
  'beds_available',
  'beds_blocked',
  'patients_at_cutoff',
  'admissions',
  'discharges',
  'deaths',
  'transfers_in',
  'transfers_out',
  'same_day_stays',
  'patient_days',
  'discharge_stay_days',
] as const;

/** Nombre de una columna numérica del censo. */
export type CensusField = (typeof CENSUS_NUMERIC_FIELDS)[number];

/** Recuentos de un día de censo de una unidad. */
export type CensusCounts = Record<CensusField, number>;

/** Una cama vista en el corte. */
export interface CensusBed {
  /** Id de la cama. */
  readonly id: string;
  /** Unidad a la que cuenta en el corte (préstamo > propietaria > unidad directa). */
  readonly unitId: string | null;
  /** `censable = true`. */
  readonly censable: boolean;
  /** Estaba vigente y activa en el corte. */
  readonly inForceAtCutoff: boolean;
  /** Sin bloqueo vigente en el corte. */
  readonly availableAtCutoff: boolean;
  /** Categoría de la cama (foto para la entrada). */
  readonly categoryConceptId: string | null;
}

/** Una ubicación de cama (estados `ACTIVE`/`COMPLETED`). */
export interface CensusLocation {
  /** Id de la ubicación. */
  readonly id: string;
  /** Encuentro. */
  readonly encounterId: string;
  /** Paciente. */
  readonly patientProfileId: string;
  /** Cama. */
  readonly careSpaceId: string;
  /** Inicio. */
  readonly periodStart: Date;
  /** Fin, o `null` si sigue abierta. */
  readonly periodEnd: Date | null;
  /** `ADT_ADMIT|ADT_TRANSFER|ADT_SWAP|ADT_RESERVE` o `null`. */
  readonly movement: string | null;
  /** `ADT_END_*` o `null`. */
  readonly endReason: string | null;
  /** Ubicación anterior (PV1-6). */
  readonly previousLocationId: string | null;
  /** Categoría de la cama al ocupar. */
  readonly bedCategoryConceptId: string | null;
}

/** Lo que el censo necesita del encuentro. */
export interface CensusEncounter {
  /** Id. */
  readonly id: string;
  /** Inicio de la internación. */
  readonly startAt: Date;
  /** `DISP_*` del egreso, o `null`. */
  readonly dischargeDisposition: string | null;
}

/** Una entrada de censo calculada. */
export interface CensusEntryDraft {
  /** Tipo de movimiento. */
  readonly movement: CensusMovement;
  /** Encuentro. */
  readonly encounterId: string;
  /** Paciente. */
  readonly patientProfileId: string;
  /** Cama. */
  readonly careSpaceId: string;
  /** Categoría de la cama. */
  readonly bedCategoryConceptId: string | null;
  /** Instante del movimiento. */
  readonly occurredAt: Date;
}

/** Entradas de {@link computeCensus}. */
export interface CensusInput {
  /** Unidad censada. */
  readonly unitId: string;
  /** 00:00 local del día. */
  readonly dayStart: Date;
  /** 00:00 local del día siguiente. */
  readonly cutoff: Date;
  /** Zona horaria IANA de la sede (para las fechas de estancia). */
  readonly timeZone: string;
  /** Camas de la sede conocidas en el corte. */
  readonly beds: readonly CensusBed[];
  /** Ubicaciones de cama de los encuentros que tocan el día. */
  readonly locations: readonly CensusLocation[];
  /** Encuentros de esas ubicaciones. */
  readonly encounters: readonly CensusEncounter[];
}

/** Resultado de {@link computeCensus}. */
export interface CensusResult {
  /** Recuentos. */
  readonly counts: CensusCounts;
  /** Entradas que sustentan los recuentos. */
  readonly entries: CensusEntryDraft[];
}

/** `YYYY-MM-DD` de un instante en la zona de la sede. */
export function localDate(instant: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(instant);
}

const dayNumber = (isoDay: string): number =>
  Date.UTC(
    Number(isoDay.slice(0, 4)),
    Number(isoDay.slice(5, 7)) - 1,
    Number(isoDay.slice(8, 10)),
  ) / 86_400_000;

/**
 * Días de estancia de un egreso: `fecha(egreso) − fecha(ingreso)` en días
 * calendario de la sede, mínimo 1 (`F3.3`, «Definiciones del censo»).
 *
 * @param admittedAt - Inicio de la internación.
 * @param dischargedAt - Egreso.
 * @param timeZone - Zona de la sede.
 */
export function stayDays(
  admittedAt: Date,
  dischargedAt: Date,
  timeZone: string,
): number {
  const days =
    dayNumber(localDate(dischargedAt, timeZone)) -
    dayNumber(localDate(admittedAt, timeZone));
  return Math.max(1, days);
}

const containsInstant = (
  location: Pick<CensusLocation, 'periodStart' | 'periodEnd'>,
  instant: Date,
): boolean =>
  location.periodStart.getTime() <= instant.getTime() &&
  (location.periodEnd === null ||
    location.periodEnd.getTime() > instant.getTime());

const inDay = (instant: Date | null, dayStart: Date, cutoff: Date): boolean =>
  instant !== null &&
  instant.getTime() >= dayStart.getTime() &&
  instant.getTime() < cutoff.getTime();

/**
 * Calcula el censo de una unidad para un día (CONTRATO-F2-F5 F3.3,
 * «Definiciones del censo»). Función pura: la misma entrada da siempre el mismo
 * resultado, que es lo que permite sellarlo con un hash.
 *
 * - `patients_at_cutoff`: ubicaciones cuyo rango contiene el corte.
 * - `same_day_stays`: encuentros que pasan por la unidad dentro del día, no
 *   estaban al inicio y no están en el corte.
 * - `patient_days = patients_at_cutoff + same_day_stays` (convención OPS).
 * - Los traslados entre camas de la misma unidad no cuentan como entrada ni
 *   salida de la unidad, ni como egreso.
 *
 * @param input - Camas, ubicaciones y encuentros del día.
 * @returns Recuentos y entradas.
 */
export function computeCensus(input: CensusInput): CensusResult {
  const { unitId, dayStart, cutoff, timeZone } = input;
  const bedById = new Map(input.beds.map((bed) => [bed.id, bed]));
  const encounterById = new Map(input.encounters.map((e) => [e.id, e]));
  const locationById = new Map(input.locations.map((l) => [l.id, l]));
  const nextOf = new Map<string, CensusLocation>();
  for (const location of input.locations) {
    if (location.previousLocationId)
      nextOf.set(location.previousLocationId, location);
  }

  const unitOf = (careSpaceId: string): string | null =>
    bedById.get(careSpaceId)?.unitId ?? null;
  const isCensusBed = (careSpaceId: string): boolean => {
    const bed = bedById.get(careSpaceId);
    return !!bed && bed.censable && bed.unitId === unitId;
  };

  const unitBeds = input.beds.filter(
    (bed) => bed.censable && bed.unitId === unitId && bed.inForceAtCutoff,
  );
  const counts = Object.fromEntries(
    CENSUS_NUMERIC_FIELDS.map((field) => [field, 0]),
  ) as CensusCounts;
  counts.beds_censable = unitBeds.length;
  counts.beds_available = unitBeds.filter((b) => b.availableAtCutoff).length;
  counts.beds_blocked = counts.beds_censable - counts.beds_available;

  const entries: CensusEntryDraft[] = [];
  const entry = (
    movement: CensusMovement,
    location: CensusLocation,
    occurredAt: Date,
  ): void => {
    entries.push({
      movement,
      encounterId: location.encounterId,
      patientProfileId: location.patientProfileId,
      careSpaceId: location.careSpaceId,
      bedCategoryConceptId:
        location.bedCategoryConceptId ??
        bedById.get(location.careSpaceId)?.categoryConceptId ??
        null,
      occurredAt,
    });
  };

  const here = input.locations.filter((l) => isCensusBed(l.careSpaceId));

  for (const location of here) {
    if (containsInstant(location, cutoff)) {
      counts.patients_at_cutoff += 1;
      entry('PRESENT', location, cutoff);
    }
    if (location.movement === 'ADT_ADMIT' && inDay(location.periodStart, dayStart, cutoff)) {
      counts.admissions += 1;
      entry('ADMITTED', location, location.periodStart);
    }
    if (
      location.endReason === 'ADT_END_DISCHARGE' &&
      inDay(location.periodEnd, dayStart, cutoff)
    ) {
      counts.discharges += 1;
      entry('DISCHARGED', location, location.periodEnd!);
      const encounter = encounterById.get(location.encounterId);
      if (encounter?.dischargeDisposition === 'DISP_DEATH') counts.deaths += 1;
      counts.discharge_stay_days += stayDays(
        encounter?.startAt ?? location.periodStart,
        location.periodEnd!,
        timeZone,
      );
    }
    const moved =
      location.movement === 'ADT_TRANSFER' || location.movement === 'ADT_SWAP';
    if (moved && inDay(location.periodStart, dayStart, cutoff)) {
      const previous = location.previousLocationId
        ? locationById.get(location.previousLocationId)
        : undefined;
      if (!previous || unitOf(previous.careSpaceId) !== unitId) {
        counts.transfers_in += 1;
        entry('TRANSFER_IN', location, location.periodStart);
      }
    }
    if (
      (location.endReason === 'ADT_END_TRANSFER_OUT' ||
        location.endReason === 'ADT_END_SWAP') &&
      inDay(location.periodEnd, dayStart, cutoff)
    ) {
      const next = nextOf.get(location.id);
      if (!next || unitOf(next.careSpaceId) !== unitId) {
        counts.transfers_out += 1;
        entry('TRANSFER_OUT', location, location.periodEnd!);
      }
    }
  }

  // Estancias del día: encuentros que pasan por la unidad dentro de D, no estaban
  // al inicio y no están en el corte.
  const byEncounter = new Map<string, CensusLocation[]>();
  for (const location of here) {
    const overlapsDay =
      location.periodStart.getTime() < cutoff.getTime() &&
      (location.periodEnd === null ||
        location.periodEnd.getTime() > dayStart.getTime());
    if (!overlapsDay) continue;
    const list = byEncounter.get(location.encounterId) ?? [];
    list.push(location);
    byEncounter.set(location.encounterId, list);
  }
  for (const stays of byEncounter.values()) {
    const atStart = stays.some((l) => containsInstant(l, dayStart));
    const atCutoff = stays.some((l) => containsInstant(l, cutoff));
    if (atStart || atCutoff) continue;
    counts.same_day_stays += 1;
    const ordered = [...stays].sort(
      (a, b) => a.periodStart.getTime() - b.periodStart.getTime(),
    );
    const last = ordered[ordered.length - 1];
    entry('SAME_DAY', last, last.periodEnd ?? last.periodStart);
  }

  counts.patient_days = counts.patients_at_cutoff + counts.same_day_stays;
  entries.sort(
    (a, b) =>
      a.movement.localeCompare(b.movement) ||
      a.encounterId.localeCompare(b.encounterId) ||
      a.occurredAt.getTime() - b.occurredAt.getTime(),
  );
  return { counts, entries };
}

/**
 * Huella del censo cerrado: SHA-256 del JSON canónico de los recuentos y las
 * entradas. Si alguien reescribe una entrada, la huella ya no coincide.
 *
 * @param counts - Recuentos.
 * @param entries - Entradas.
 * @returns Hexadecimal de 64 caracteres.
 */
export function censusContentHash(
  counts: CensusCounts,
  entries: readonly CensusEntryDraft[],
): string {
  const canonical = JSON.stringify({
    counts: CENSUS_NUMERIC_FIELDS.map((field) => [field, counts[field]]),
    entries: entries.map((e) => [
      e.movement,
      e.encounterId,
      e.patientProfileId,
      e.careSpaceId,
      e.bedCategoryConceptId,
      e.occurredAt.toISOString(),
    ]),
  });
  return createHash('sha256').update(canonical).digest('hex');
}
