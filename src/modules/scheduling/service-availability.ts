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
export interface Intervalo {
  readonly startAt: Date;
  readonly endAt: Date;
}

/** Un intervalo con identidad, para decidir sobre él (p. ej. un cupo de consulta). */
export interface IntervaloConId extends Intervalo {
  readonly id: string;
}

const MS_POR_MINUTO = 60_000;

/** Tope de horarios que se ofrecen por consulta: una pantalla, no un volcado. */
export const MAX_HORARIOS_OFRECIDOS = 200;

/** Cada cuántos minutos se ofrece un inicio cuando nadie declaró otro paso. */
export const PASO_DE_INICIOS_MINUTOS = 15;

/**
 * Une los intervalos que se tocan o se pisan, ordenados por inicio.
 *
 * Dos intervalos que se tocan en un punto (uno termina cuando empieza el otro) se
 * funden: para restar tiempo ocupado da igual y evita fragmentos de largo cero.
 */
export function unirIntervalos(intervalos: readonly Intervalo[]): Intervalo[] {
  const ordenados = [...intervalos]
    .filter((i) => i.endAt.getTime() > i.startAt.getTime())
    .sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
  const unidos: Intervalo[] = [];
  for (const actual of ordenados) {
    const ultimo = unidos[unidos.length - 1];
    if (ultimo && actual.startAt.getTime() <= ultimo.endAt.getTime()) {
      if (actual.endAt.getTime() > ultimo.endAt.getTime()) {
        unidos[unidos.length - 1] = {
          startAt: ultimo.startAt,
          endAt: actual.endAt,
        };
      }
      continue;
    }
    unidos.push({ startAt: actual.startAt, endAt: actual.endAt });
  }
  return unidos;
}

/**
 * Lo que queda de las `franjas` al quitarles lo `ocupado`.
 *
 * @returns Intervalos libres, ordenados y sin solaparse.
 */
export function restarIntervalos(
  franjas: readonly Intervalo[],
  ocupado: readonly Intervalo[],
): Intervalo[] {
  const bloqueos = unirIntervalos(ocupado);
  const libres: Intervalo[] = [];
  for (const franja of unirIntervalos(franjas)) {
    let cursor = franja.startAt.getTime();
    const fin = franja.endAt.getTime();
    for (const bloqueo of bloqueos) {
      const desde = bloqueo.startAt.getTime();
      const hasta = bloqueo.endAt.getTime();
      if (hasta <= cursor) continue;
      if (desde >= fin) break;
      if (desde > cursor) {
        libres.push({ startAt: new Date(cursor), endAt: new Date(desde) });
      }
      cursor = Math.max(cursor, hasta);
      if (cursor >= fin) break;
    }
    if (cursor < fin) {
      libres.push({ startAt: new Date(cursor), endAt: new Date(fin) });
    }
  }
  return libres;
}

/** Lo que hace falta saber de una oferta para encontrarle lugar. */
export interface DuracionDelServicio {
  /** Lo que se reserva y compromete: el techo declarado por el profesional. */
  readonly maxDurationMinutes: number;
  /** Lo mínimo que puede tardar; sólo informa al paciente («30–45 min»). */
  readonly minDurationMinutes: number;
  readonly prepMinutes?: number;
  readonly cleanupMinutes?: number;
}

/** Un inicio posible para el servicio. */
export interface HorarioDeServicio {
  /** Cuándo empieza la atención. */
  readonly startAt: Date;
  /** Hasta cuándo se reserva: `startAt + máximo`. */
  readonly endAtMax: Date;
  /** Cuándo podría terminar como pronto: `startAt + mínimo`. */
  readonly endAtMin: Date;
  /** Todo lo que el turno ocupa, con preparación y limpieza. */
  readonly ocupaDesde: Date;
  readonly ocupaHasta: Date;
}

export interface EntradaDeHorarios {
  /** Franjas que admiten servicios, ya en UTC. */
  readonly franjas: readonly Intervalo[];
  /** Citas confirmadas, retenciones activas, tiempo ocupado y ausencias. */
  readonly ocupado: readonly Intervalo[];
  readonly servicio: DuracionDelServicio;
  /** Primer instante ofrecible: ahora más el aviso mínimo de la política. */
  readonly noAntesDe: Date;
  /** Último instante ofrecible: ahora más los días de anticipación. */
  readonly noDespuesDe: Date;
  /** Cada cuántos minutos se ofrece un inicio dentro de un hueco. */
  readonly pasoMinutos?: number;
  readonly limite?: number;
}

/**
 * Los inicios donde cabe el servicio.
 *
 * En cada hueco libre el primer inicio es **justo después del compromiso anterior**
 * (más la preparación) y de ahí se avanza de `pasoMinutos` en `pasoMinutos`. Anclar
 * al hueco en vez de a la hora del reloj es lo que evita los huecos muertos: si un
 * paciente termina a las 10:07, el siguiente servicio puede empezar a las 10:07 y no
 * recién a las 10:15.
 *
 * @throws RangeError con una duración, un paso o un colchón que no tiene sentido.
 */
export function proponerHorariosDeServicio(
  entrada: EntradaDeHorarios,
): HorarioDeServicio[] {
  const { servicio } = entrada;
  const prep = servicio.prepMinutes ?? 0;
  const limpieza = servicio.cleanupMinutes ?? 0;
  const paso = entrada.pasoMinutos ?? PASO_DE_INICIOS_MINUTOS;
  const limite = entrada.limite ?? MAX_HORARIOS_OFRECIDOS;
  validar(servicio, prep, limpieza, paso);

  const ocupaMs =
    (prep + servicio.maxDurationMinutes + limpieza) * MS_POR_MINUTO;
  const libres = restarIntervalos(entrada.franjas, entrada.ocupado);
  const horarios: HorarioDeServicio[] = [];

  for (const hueco of libres) {
    for (
      let ocupaDesde = hueco.startAt.getTime();
      ocupaDesde + ocupaMs <= hueco.endAt.getTime();
      ocupaDesde += paso * MS_POR_MINUTO
    ) {
      const inicio = ocupaDesde + prep * MS_POR_MINUTO;
      if (inicio < entrada.noAntesDe.getTime()) continue;
      if (inicio > entrada.noDespuesDe.getTime()) break;
      horarios.push(armar(inicio, ocupaDesde, ocupaDesde + ocupaMs, servicio));
      if (horarios.length >= limite) return horarios;
    }
  }
  return horarios;
}

/**
 * Si el turno de un servicio cabe en ese inicio, ahora mismo.
 *
 * Es la comprobación que repite el servidor al retener: el cliente pudo haber leído
 * los horarios hace minutos, y es la **única** que cuenta, porque corre bajo el
 * candado del profesional.
 */
export function cabeElServicio(
  franjas: readonly Intervalo[],
  ocupado: readonly Intervalo[],
  servicio: DuracionDelServicio,
  startAt: Date,
): boolean {
  const prep = servicio.prepMinutes ?? 0;
  const limpieza = servicio.cleanupMinutes ?? 0;
  validar(servicio, prep, limpieza, PASO_DE_INICIOS_MINUTOS);
  const desde = startAt.getTime() - prep * MS_POR_MINUTO;
  const hasta =
    startAt.getTime() +
    (servicio.maxDurationMinutes + limpieza) * MS_POR_MINUTO;
  return restarIntervalos(franjas, ocupado).some(
    (libre) =>
      libre.startAt.getTime() <= desde && libre.endAt.getTime() >= hasta,
  );
}

/**
 * Qué cupos de consulta retraídos se pueden volver a ofrecer.
 *
 * Un cupo retraído vuelve sólo si **ya no choca con nada**: reabrir el que sigue
 * pisando otro servicio dejaría ofrecer un horario que no existe. Se llama al
 * vencer una retención, al cancelar y al terminar antes.
 *
 * @param retraidos - Cupos de consulta en estado retraído.
 * @param ocupado - Lo que sigue comprometido, con preparación y limpieza ya contadas.
 * @returns Los ids que pueden reabrirse.
 */
export function cuposQueSePuedenReabrir(
  retraidos: readonly IntervaloConId[],
  ocupado: readonly Intervalo[],
): string[] {
  const bloqueos = unirIntervalos(ocupado);
  return retraidos
    .filter(
      (cupo) =>
        !bloqueos.some(
          (b) =>
            b.startAt.getTime() < cupo.endAt.getTime() &&
            b.endAt.getTime() > cupo.startAt.getTime(),
        ),
    )
    .map((cupo) => cupo.id);
}

/** El tramo que ocupa un turno ya acordado, con sus colchones. */
export function tramoOcupado(
  startAt: Date,
  endAtMax: Date,
  servicio: Pick<DuracionDelServicio, 'prepMinutes' | 'cleanupMinutes'>,
): Intervalo {
  return {
    startAt: new Date(
      startAt.getTime() - (servicio.prepMinutes ?? 0) * MS_POR_MINUTO,
    ),
    endAt: new Date(
      endAtMax.getTime() + (servicio.cleanupMinutes ?? 0) * MS_POR_MINUTO,
    ),
  };
}

function armar(
  inicio: number,
  ocupaDesde: number,
  ocupaHasta: number,
  servicio: DuracionDelServicio,
): HorarioDeServicio {
  return {
    startAt: new Date(inicio),
    endAtMax: new Date(inicio + servicio.maxDurationMinutes * MS_POR_MINUTO),
    endAtMin: new Date(inicio + servicio.minDurationMinutes * MS_POR_MINUTO),
    ocupaDesde: new Date(ocupaDesde),
    ocupaHasta: new Date(ocupaHasta),
  };
}

function validar(
  servicio: DuracionDelServicio,
  prep: number,
  limpieza: number,
  paso: number,
): void {
  const { minDurationMinutes: min, maxDurationMinutes: max } = servicio;
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
  if (prep < 0 || limpieza < 0) {
    throw new RangeError(
      'La preparación y la limpieza no pueden ser negativas',
    );
  }
  if (!Number.isInteger(paso) || paso <= 0) {
    throw new RangeError(
      `El paso de inicios debe ser un entero positivo: ${paso}`,
    );
  }
}
