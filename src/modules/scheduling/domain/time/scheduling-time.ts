/**
 * Conversión entre la hora de pared de una sede y el instante UTC que se guarda.
 *
 * Las reglas de una plantilla declaran horas **locales**: «los lunes de 08:00 a
 * 12:00» significa las ocho de la mañana en la sede, no en UTC. Interpretarlas
 * como UTC publicaba los cupos corridos tantas horas como el desplazamiento de
 * la zona: una agenda de La Paz (UTC−4) ofrecía turnos de 04:00 a 08:00 hora
 * local, de madrugada.
 *
 * Se resuelve con `Intl`, que en Node trae la base de datos IANA completa, en
 * vez de sumar un desplazamiento fijo: un número fijo se rompe el día que la
 * sede tiene horario de verano, y varias de las zonas donde opera el producto
 * lo tienen.
 */

/** Un día del calendario **local** de la sede, sin hora. */
export interface LocalDay {
  /** Año del calendario local. */
  year: number;
  /** Mes del calendario local, 1–12. */
  month: number;
  /** Día del mes del calendario local. */
  day: number;
}

/** Milisegundos de un día; sólo para recorrer el calendario, nunca para sumar fechas. */
const HALF_DAY_MS = 12 * 60 * 60 * 1000;

/**
 * Desplazamiento de la zona respecto de UTC **en ese instante**, en milisegundos.
 *
 * Se calcula formateando el instante en la zona y volviendo a leerlo como si
 * fuera UTC: la diferencia entre ambos es el desplazamiento vigente, con horario
 * de verano incluido si corresponde.
 *
 * @param instant - Momento a evaluar.
 * @param zone - Identificador IANA, p. ej. `America/La_Paz`.
 */
function offsetMs(instant: Date, zone: string): number {
  const format = new Intl.DateTimeFormat('en-US', {
    timeZone: zone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const parts: Record<string, string> = {};
  for (const part of format.formatToParts(instant)) {
    parts[part.type] = part.value;
  }

  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    // `hour12: false` puede devolver 24 para la medianoche según la plataforma.
    Number(parts.hour) % 24,
    Number(parts.minute),
    Number(parts.second),
  );

  return asUtc - instant.getTime();
}

/**
 * Traduce el día local de un instante.
 *
 * @param instant - Momento a evaluar.
 * @param zone - Identificador IANA.
 */
export function localDayOf(instant: Date, zone: string): LocalDay {
  const offset = offsetMs(instant, zone);
  const local = new Date(instant.getTime() + offset);
  return {
    year: local.getUTCFullYear(),
    month: local.getUTCMonth() + 1,
    day: local.getUTCDate(),
  };
}

/**
 * Día de la semana de una fecha del calendario, 0 = domingo.
 *
 * No depende de la zona: una vez que se sabe qué día del calendario es, su día
 * de la semana es el mismo en cualquier parte.
 *
 * @param day - Fecha del calendario local.
 */
export function dayOfWeek(day: LocalDay): number {
  return new Date(Date.UTC(day.year, day.month - 1, day.day)).getUTCDay();
}

/**
 * Convierte una hora de pared local en el instante UTC correspondiente.
 *
 * Hace dos pasadas a propósito. La primera supone que la hora local es UTC y
 * corrige con el desplazamiento de ese momento; pero en los días en que la zona
 * cambia de horario, el desplazamiento del instante corregido puede no ser el
 * mismo que el del supuesto, así que se vuelve a medir sobre el resultado. Sin
 * la segunda pasada, los cupos de esos dos días del año salen con una hora de
 * corrimiento.
 *
 * @param day - Fecha del calendario local.
 * @param timeText - Hora de pared `HH:MM` o `HH:MM:SS`.
 * @param zone - Identificador IANA.
 */
export function localTimeToUtc(
  day: LocalDay,
  timeText: string,
  zone: string,
): Date {
  const [hours, minutes, seconds] = timeText.split(':').map(Number);
  const assumed = Date.UTC(
    day.year,
    day.month - 1,
    day.day,
    hours,
    minutes,
    seconds ?? 0,
  );

  const first = assumed - offsetMs(new Date(assumed), zone);
  const second = assumed - offsetMs(new Date(first), zone);
  return new Date(second);
}

/**
 * Enumera los días del calendario **local** que caen en el día de semana pedido.
 *
 * Recorre la ventana en pasos de doce horas —suficiente para no saltarse ningún
 * día del calendario, incluso donde la zona se corre una hora— y la ensancha un
 * día por lado: un día local puede empezar antes de `desde` o terminar después
 * de `hasta` y aun así tener cupos dentro de la ventana.
 *
 * @param from - Inicio de la ventana, en UTC.
 * @param to - Fin de la ventana, en UTC.
 * @param weekday - Día de la semana de la regla, 0 = domingo.
 * @param zone - Identificador IANA.
 */
export function matchingLocalDays(
  from: Date,
  to: Date,
  weekday: number,
  zone: string,
): LocalDay[] {
  const days: LocalDay[] = [];
  const seen = new Set<string>();

  const start = from.getTime() - 2 * HALF_DAY_MS;
  const end = to.getTime() + 2 * HALF_DAY_MS;

  for (let t = start; t <= end; t += HALF_DAY_MS) {
    const day = localDayOf(new Date(t), zone);
    const key = `${day.year}-${day.month}-${day.day}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (dayOfWeek(day) === weekday) days.push(day);
  }

  return days;
}

/**
 * Límite inferior de una ventana cuando sólo se buscan cupos **reservables**.
 *
 * Un hueco de ayer existe y se puede consultar, pero no se puede pedir: cuando
 * la consulta dice «sólo disponibles», la ventana empieza como muy pronto
 * ahora. Sin este corte, «disponible» significaba únicamente «le queda
 * capacidad», y la agenda ofrecía turnos vencidos que la reserva después
 * aceptaba (A-02/A-03 de la auditoría).
 *
 * No hace falta convertir zonas: `start_at` es `timestamptz`, o sea un instante
 * absoluto, y comparar dos instantes da el mismo resultado en cualquier huso.
 * La zona de la sede importa al **generar** los cupos —eso es {@link
 * localTimeToUtc}—, no al preguntar si uno ya pasó.
 *
 * @param from - Inicio pedido por quien consulta.
 * @param now - Instante actual.
 * @returns El más tardío de los dos.
 */
export function bookableStart(from: Date, now: Date): Date {
  return now.getTime() > from.getTime() ? now : from;
}
