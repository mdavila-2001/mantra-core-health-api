import { addDays, localDate, localMidnight } from './zoned-time';

/**
 * Regla de medianoche del día-cama (CONTRATO-F2-F5 F5e, decisión D7 del cliente;
 * `procesos/11`). Las funciones de este archivo son puras: reciben la ocupación
 * (`encounter_locations` de una cama censable) y los períodos de categoría de
 * cada cama, y devuelven qué días-cama se devengan. El servicio se ocupa de leer
 * la base, de las tarifas y de escribir; acá sólo se decide **qué noches**.
 *
 * Supuestos sobre los casos que el contrato deja abiertos (anotados en la
 * descripción del PR y en `DESVIOS-M-F5-fin`):
 *
 * - Una medianoche *M* se devenga si `inicio < M < fin`. El proceso 11 escribe
 *   `inicio ≤ M`; con la igualdad, quien llega exactamente a las 00:00 pagaría el
 *   día anterior, en el que no estuvo. Egresar a las 00:00 tampoco cobra esa
 *   medianoche.
 * - Ingreso y egreso el mismo día (ninguna medianoche en toda la estancia): un día
 *   mínimo, marcado `minimumStay`, si la práctica lo permite (`billing.bed_day_min_one`).
 *   Sólo cuando la estancia terminó: quien sigue internado puede cruzar la noche.
 * - Un permiso de salida con cama retenida y el traslado a quirófano con cama
 *   retenida no cortan el período de la cama: devengan las medianoches.
 * - Una cama sin categoría vigente en *M* no devenga por defecto: se informa.
 */

/** Un período de ocupación de una cama censable por un encuentro. */
export interface OccupancyPeriod {
  /** Fila de `encounter_locations`. */
  readonly id: string;
  /** Cama. */
  readonly careSpaceId: string;
  /** Desde cuándo ocupa. */
  readonly start: Date;
  /** Hasta cuándo; `null` mientras siga ocupada. */
  readonly end: Date | null;
}

/** Un período de categoría de una cama (`practice.care_space_category_periods`). */
export interface CategoryPeriod {
  /** Cama. */
  readonly careSpaceId: string;
  /** Categoría que rige en el período. */
  readonly categoryConceptId: string;
  /** Desde (incluido). */
  readonly validFrom: Date;
  /** Hasta (excluido); `null` si sigue vigente. */
  readonly validTo: Date | null;
}

/** Un día-cama a devengar. */
export interface BedNight {
  /** Fecha de servicio `YYYY-MM-DD` (el día que termina en la medianoche). */
  readonly serviceDate: string;
  /** Medianoche que lo origina; `null` en el día mínimo (no hay medianoche). */
  readonly midnight: Date | null;
  /** Período de ocupación de origen. */
  readonly occupancyId: string;
  /** Cama que se ocupaba. */
  readonly careSpaceId: string;
  /** Categoría de esa cama en la medianoche. */
  readonly categoryConceptId: string;
  /** Es el día mínimo de una estancia sin medianoche. */
  readonly minimumStay: boolean;
}

/** Una noche que no se pudo clasificar: la cama no tenía categoría vigente. */
export interface UncategorizedNight {
  /** Fecha de servicio. */
  readonly serviceDate: string;
  /** Cama sin categoría. */
  readonly careSpaceId: string;
}

/** Resultado de calcular las noches de un encuentro. */
export interface BedNightsResult {
  /** Días-cama a devengar, ordenados por fecha de servicio. */
  readonly nights: readonly BedNight[];
  /** Noches que no se devengan por falta de categoría (error de configuración). */
  readonly uncategorized: readonly UncategorizedNight[];
}

/** Entrada de {@link computeBedNights}. */
export interface BedNightsInput {
  /** Períodos de ocupación de camas censables del encuentro. */
  readonly periods: readonly OccupancyPeriod[];
  /** Períodos de categoría de las camas de `periods`. */
  readonly categories: readonly CategoryPeriod[];
  /** Zona horaria de la sede. */
  readonly timeZone: string;
  /**
   * Tope de lo que ya ocurrió: sólo se devengan las medianoches `M <= cap`
   * (ahora, o el cierre del día pedido si es anterior).
   */
  readonly cap: Date;
  /** `billing.bed_day_min_one`: cobrar un día mínimo si no hay medianoche. */
  readonly minimumOneDay: boolean;
}

/**
 * Categoría de una cama en un instante.
 *
 * @param categories - Períodos de categoría.
 * @param careSpaceId - Cama.
 * @param at - Instante.
 * @returns La categoría vigente, o `null` si ninguna rige en ese instante.
 */
export function categoryAt(
  categories: readonly CategoryPeriod[],
  careSpaceId: string,
  at: Date,
): string | null {
  const found = categories.find(
    (period) =>
      period.careSpaceId === careSpaceId &&
      period.validFrom.getTime() <= at.getTime() &&
      (period.validTo === null || at.getTime() < period.validTo.getTime()),
  );
  return found?.categoryConceptId ?? null;
}

/**
 * Días-cama de un encuentro según la regla de medianoche.
 *
 * Por cada medianoche local *M* con `inicio < M < fin` (y `M <= cap`) de un
 * período de cama censable se devenga **un** día-cama con
 * `serviceDate = fecha(M) − 1`, con la categoría que la cama ocupada en *M*
 * tenía en *M*. El día del egreso no se cobra. Dos períodos que cubrieran la misma
 * medianoche (dato inconsistente que la base impide) devengan una sola vez.
 *
 * @param input - Ocupación, categorías, zona y tope.
 * @returns Las noches a devengar y las que quedaron sin categoría.
 */
export function computeBedNights(input: BedNightsInput): BedNightsResult {
  const { periods, categories, timeZone, cap } = input;
  const ordered = [...periods].sort(
    (a, b) => a.start.getTime() - b.start.getTime(),
  );
  const nights = new Map<string, BedNight>();
  const uncategorized: UncategorizedNight[] = [];
  let anyMidnight = false;

  for (const period of ordered) {
    const horizon =
      period.end !== null && period.end.getTime() < cap.getTime()
        ? period.end
        : cap;
    const firstDay = addDays(localDate(period.start, timeZone), 1);
    const lastDay = localDate(horizon, timeZone);
    for (let day = firstDay; day <= lastDay; day = addDays(day, 1)) {
      const midnight = localMidnight(day, timeZone);
      if (midnight.getTime() <= period.start.getTime()) continue;
      if (period.end !== null && midnight.getTime() >= period.end.getTime())
        continue;
      if (midnight.getTime() > cap.getTime()) continue;
      anyMidnight = true;
      const serviceDate = addDays(day, -1);
      if (nights.has(serviceDate)) continue;
      const category = categoryAt(categories, period.careSpaceId, midnight);
      if (category === null) {
        uncategorized.push({ serviceDate, careSpaceId: period.careSpaceId });
        continue;
      }
      nights.set(serviceDate, {
        serviceDate,
        midnight,
        occupancyId: period.id,
        careSpaceId: period.careSpaceId,
        categoryConceptId: category,
        minimumStay: false,
      });
    }
  }

  if (!anyMidnight && input.minimumOneDay && ordered.length > 0) {
    const first = ordered[0];
    const finished = ordered.every(
      (period) => period.end !== null && period.end.getTime() <= cap.getTime(),
    );
    if (finished) {
      const serviceDate = localDate(first.start, timeZone);
      const category = categoryAt(categories, first.careSpaceId, first.start);
      if (category === null) {
        uncategorized.push({ serviceDate, careSpaceId: first.careSpaceId });
      } else {
        nights.set(serviceDate, {
          serviceDate,
          midnight: null,
          occupancyId: first.id,
          careSpaceId: first.careSpaceId,
          categoryConceptId: category,
          minimumStay: true,
        });
      }
    }
  }

  return {
    nights: [...nights.values()].sort((a, b) =>
      a.serviceDate.localeCompare(b.serviceDate),
    ),
    uncategorized,
  };
}

/** Clave de idempotencia del día-cama de un encuentro (`BEDDAY:<encuentro>:<fecha>`). */
export function bedDayKey(
  encounterId: string,
  serviceDate: string,
  revision = 1,
): string {
  const base = `BEDDAY:${encounterId}:${serviceDate}`;
  return revision > 1 ? `${base}:r${revision}` : base;
}

/** Clave de idempotencia del cargo de quirófano de un caso (`ORTIME:<caso>`). */
export function orTimeKey(caseId: string, revision = 1): string {
  const base = `ORTIME:${caseId}`;
  return revision > 1 ? `${base}:r${revision}` : base;
}
