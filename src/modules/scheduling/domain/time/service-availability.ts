/**
 * Motor de disponibilidad de los servicios con duración dinámica (v4.2.40).
 *
 * ## Por qué es una función pura
 *
 * Una consulta sale de una grilla pre-generada (`bookable_slots`). Un servicio no:
 * dura entre `min` y `max` minutos según el médico, y pre-generar cupos para cada
 * duración posible multiplicaría la grilla y la haría mentir apenas alguien reserva
 * algo distinto. Acá se **calcula en lectura** qué tiempo queda libre y dónde cabe
 * un turno; el cupo del servicio nace recién al retener.
 *
 * Todo lo que toca la base (qué franjas admiten servicios, qué compromisos hay) lo
 * junta el servicio y entra acá como intervalos ya resueltos a UTC. Así las reglas
 * de «dónde cabe» se prueban sin `EntityManager`.
 *
 * ## Qué ocupa un turno de servicio
 *
 * `[inicio − preparación, inicio + duración + limpieza]`. La **duración** es el
 * máximo declarado por el médico: se reserva el techo para que dos pacientes nunca
 * se pisen, y si la atención termina antes el sobrante se libera al completarla.
 * Preparación y limpieza son aire del profesional: el paciente no las ve ni las
 * reserva, pero ningún otro turno puede ocuparlas.
 */

/** Un rato de tiempo, medido en instantes UTC. */
export interface Interval {
  readonly startAt: Date;
  readonly endAt: Date;
}

/** Un intervalo con identidad, para decidir sobre él (p. ej. un cupo de consulta). */
export interface IntervalWithId extends Interval {
  readonly id: string;
}

const MS_PER_MINUTE = 60_000;

/** Tope de horarios que se ofrecen por consulta: una pantalla, no un volcado. */
export const MAX_OFFERED_TIMES = 200;

/** Cada cuántos minutos se ofrece un inicio cuando nadie declaró otro paso. */
export const START_STEP_MINUTES = 15;

/**
 * Une los intervalos que se tocan o se pisan, ordenados por inicio.
 *
 * Dos intervalos que se tocan en un punto (uno termina cuando empieza el otro) se
 * funden: para restar tiempo ocupado da igual y evita fragmentos de largo cero.
 */
export function mergeIntervals(intervals: readonly Interval[]): Interval[] {
  const sorted = [...intervals]
    .filter((i) => i.endAt.getTime() > i.startAt.getTime())
    .sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
  const merged: Interval[] = [];
  for (const actual of sorted) {
    const last = merged[merged.length - 1];
    if (last && actual.startAt.getTime() <= last.endAt.getTime()) {
      if (actual.endAt.getTime() > last.endAt.getTime()) {
        merged[merged.length - 1] = {
          startAt: last.startAt,
          endAt: actual.endAt,
        };
      }
      continue;
    }
    merged.push({ startAt: actual.startAt, endAt: actual.endAt });
  }
  return merged;
}

/**
 * Lo que queda de las `franjas` al quitarles lo `ocupado`.
 *
 * @returns Intervalos libres, ordenados y sin solaparse.
 */
export function subtractIntervals(
  bands: readonly Interval[],
  busy: readonly Interval[],
): Interval[] {
  const blocks = mergeIntervals(busy);
  const freeOnes: Interval[] = [];
  for (const band of mergeIntervals(bands)) {
    let cursor = band.startAt.getTime();
    const end = band.endAt.getTime();
    for (const block of blocks) {
      const from = block.startAt.getTime();
      const to = block.endAt.getTime();
      if (to <= cursor) continue;
      if (from >= end) break;
      if (from > cursor) {
        freeOnes.push({ startAt: new Date(cursor), endAt: new Date(from) });
      }
      cursor = Math.max(cursor, to);
      if (cursor >= end) break;
    }
    if (cursor < end) {
      freeOnes.push({ startAt: new Date(cursor), endAt: new Date(end) });
    }
  }
  return freeOnes;
}

/** Lo que hace falta saber de una oferta para encontrarle lugar. */
export interface ServiceDuration {
  /** Lo que se reserva y compromete: el techo declarado por el profesional. */
  readonly maxDurationMinutes: number;
  /** Lo mínimo que puede tardar; sólo informa al paciente («30–45 min»). */
  readonly minDurationMinutes: number;
  readonly prepMinutes?: number;
  readonly cleanupMinutes?: number;
}

/** Un inicio posible para el servicio. */
export interface ServiceTime {
  /** Cuándo empieza la atención. */
  readonly startAt: Date;
  /** Hasta cuándo se reserva: `startAt + máximo`. */
  readonly endAtMax: Date;
  /** Cuándo podría terminar como pronto: `startAt + mínimo`. */
  readonly endAtMin: Date;
  /** Todo lo que el turno ocupa, con preparación y limpieza. */
  readonly occupiesFrom: Date;
  readonly occupiesTo: Date;
}

export interface TimesInput {
  /** Franjas que admiten servicios, ya en UTC. */
  readonly bands: readonly Interval[];
  /** Citas confirmadas, retenciones activas, tiempo ocupado y ausencias. */
  readonly busy: readonly Interval[];
  readonly service: ServiceDuration;
  /** Primer instante ofrecible: ahora más el aviso mínimo de la política. */
  readonly notBefore: Date;
  /** Último instante ofrecible: ahora más los días de anticipación. */
  readonly notAfter: Date;
  /** Cada cuántos minutos se ofrece un inicio dentro de un hueco. */
  readonly stepMinutes?: number;
  readonly limit?: number;
}

/**
 * Los inicios donde cabe el servicio.
 *
 * En cada hueco libre el primer inicio es **justo después del compromiso anterior**
 * (más la preparación) y de ahí se avanza de `stepMinutes` en `stepMinutes`. Anclar
 * al hueco en vez de a la hora del reloj es lo que evita los huecos muertos: si un
 * paciente termina a las 10:07, el siguiente servicio puede empezar a las 10:07 y no
 * recién a las 10:15.
 *
 * @throws RangeError con una duración, un paso o un colchón que no tiene sentido.
 */
export function proposeServiceTimes(input: TimesInput): ServiceTime[] {
  const { service: service } = input;
  const prep = service.prepMinutes ?? 0;
  const cleanup = service.cleanupMinutes ?? 0;
  const step = input.stepMinutes ?? START_STEP_MINUTES;
  const limit = input.limit ?? MAX_OFFERED_TIMES;
  validate(service, prep, cleanup, step);

  const occupiesMs =
    (prep + service.maxDurationMinutes + cleanup) * MS_PER_MINUTE;
  const freeOnes = subtractIntervals(input.bands, input.busy);
  const times: ServiceTime[] = [];

  for (const gap of freeOnes) {
    for (
      let occupiesFrom = gap.startAt.getTime();
      occupiesFrom + occupiesMs <= gap.endAt.getTime();
      occupiesFrom += step * MS_PER_MINUTE
    ) {
      const start = occupiesFrom + prep * MS_PER_MINUTE;
      if (start < input.notBefore.getTime()) continue;
      if (start > input.notAfter.getTime()) break;
      times.push(
        assemble(start, occupiesFrom, occupiesFrom + occupiesMs, service),
      );
      if (times.length >= limit) return times;
    }
  }
  return times;
}

/**
 * Si el turno de un servicio cabe en ese inicio, ahora mismo.
 *
 * Es la comprobación que repite el servidor al retener: el cliente pudo haber leído
 * los horarios hace minutos, y es la **única** que cuenta, porque corre bajo el
 * candado del profesional.
 */
export function serviceFits(
  bands: readonly Interval[],
  busy: readonly Interval[],
  service: ServiceDuration,
  startAt: Date,
): boolean {
  const prep = service.prepMinutes ?? 0;
  const cleanup = service.cleanupMinutes ?? 0;
  validate(service, prep, cleanup, START_STEP_MINUTES);
  const from = startAt.getTime() - prep * MS_PER_MINUTE;
  const to =
    startAt.getTime() + (service.maxDurationMinutes + cleanup) * MS_PER_MINUTE;
  return subtractIntervals(bands, busy).some(
    (free) => free.startAt.getTime() <= from && free.endAt.getTime() >= to,
  );
}

/**
 * Qué cupos de consulta retraídos se pueden volver a ofrecer.
 *
 * Un cupo retraído vuelve sólo si **ya no choca con nada**: reabrir el que sigue
 * pisando otro servicio dejaría ofrecer un horario que no existe. Se llama al
 * vencer una retención, al cancelar y al terminar antes.
 *
 * @param retracted - Cupos de consulta en estado retraído.
 * @param busy - Lo que sigue comprometido, con preparación y limpieza ya contadas.
 * @returns Los ids que pueden reabrirse.
 */
export function slotsThatCanReopen(
  retracted: readonly IntervalWithId[],
  busy: readonly Interval[],
): string[] {
  const blocks = mergeIntervals(busy);
  return retracted
    .filter(
      (slot) =>
        !blocks.some(
          (b) =>
            b.startAt.getTime() < slot.endAt.getTime() &&
            b.endAt.getTime() > slot.startAt.getTime(),
        ),
    )
    .map((slot) => slot.id);
}

/** El tramo que ocupa un turno ya acordado, con sus colchones. */
export function busySpan(
  startAt: Date,
  endAtMax: Date,
  service: Pick<ServiceDuration, 'prepMinutes' | 'cleanupMinutes'>,
): Interval {
  return {
    startAt: new Date(
      startAt.getTime() - (service.prepMinutes ?? 0) * MS_PER_MINUTE,
    ),
    endAt: new Date(
      endAtMax.getTime() + (service.cleanupMinutes ?? 0) * MS_PER_MINUTE,
    ),
  };
}

function assemble(
  start: number,
  occupiesFrom: number,
  occupiesTo: number,
  service: ServiceDuration,
): ServiceTime {
  return {
    startAt: new Date(start),
    endAtMax: new Date(start + service.maxDurationMinutes * MS_PER_MINUTE),
    endAtMin: new Date(start + service.minDurationMinutes * MS_PER_MINUTE),
    occupiesFrom: new Date(occupiesFrom),
    occupiesTo: new Date(occupiesTo),
  };
}

function validate(
  service: ServiceDuration,
  prep: number,
  cleanup: number,
  step: number,
): void {
  const { minDurationMinutes: min, maxDurationMinutes: max } = service;
  if (
    !Number.isInteger(min) ||
    !Number.isInteger(max) ||
    min <= 0 ||
    max < min
  ) {
    throw new RangeError(
      `Duración inválida: mínimo ${min} y máximo ${max} (0 < mín ≤ máx)`,
    );
  }
  if (prep < 0 || cleanup < 0) {
    throw new RangeError(
      'La preparación y la limpieza no pueden ser negativas',
    );
  }
  if (!Number.isInteger(step) || step <= 0) {
    throw new RangeError(
      `El paso de inicios debe ser un entero positivo: ${step}`,
    );
  }
}
