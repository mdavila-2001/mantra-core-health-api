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
export interface DiaLocal {
  /** Año del calendario local. */
  year: number;
  /** Mes del calendario local, 1–12. */
  month: number;
  /** Día del mes del calendario local. */
  day: number;
}

/** Milisegundos de un día; sólo para recorrer el calendario, nunca para sumar fechas. */
const MEDIO_DIA_MS = 12 * 60 * 60 * 1000;

/**
 * Desplazamiento de la zona respecto de UTC **en ese instante**, en milisegundos.
 *
 * Se calcula formateando el instante en la zona y volviendo a leerlo como si
 * fuera UTC: la diferencia entre ambos es el desplazamiento vigente, con horario
 * de verano incluido si corresponde.
 *
 * @param instante - Momento a evaluar.
 * @param zona - Identificador IANA, p. ej. `America/La_Paz`.
 */
function desplazamientoMs(instante: Date, zona: string): number {
  const formato = new Intl.DateTimeFormat('en-US', {
    timeZone: zona,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const partes: Record<string, string> = {};
  for (const parte of formato.formatToParts(instante)) {
    partes[parte.type] = parte.value;
  }

  const comoUtc = Date.UTC(
    Number(partes.year),
    Number(partes.month) - 1,
    Number(partes.day),
    // `hour12: false` puede devolver 24 para la medianoche según la plataforma.
    Number(partes.hour) % 24,
    Number(partes.minute),
    Number(partes.second),
  );

  return comoUtc - instante.getTime();
}

/**
 * Traduce el día local de un instante.
 *
 * @param instante - Momento a evaluar.
 * @param zona - Identificador IANA.
 */
export function diaLocalDe(instante: Date, zona: string): DiaLocal {
  const desplazamiento = desplazamientoMs(instante, zona);
  const local = new Date(instante.getTime() + desplazamiento);
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
 * @param dia - Fecha del calendario local.
 */
export function diaDeLaSemana(dia: DiaLocal): number {
  return new Date(Date.UTC(dia.year, dia.month - 1, dia.day)).getUTCDay();
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
 * @param dia - Fecha del calendario local.
 * @param hora - Hora de pared `HH:MM` o `HH:MM:SS`.
 * @param zona - Identificador IANA.
 */
export function horaLocalAUtc(dia: DiaLocal, hora: string, zona: string): Date {
  const [horas, minutos, segundos] = hora.split(':').map(Number);
  const supuesto = Date.UTC(
    dia.year,
    dia.month - 1,
    dia.day,
    horas,
    minutos,
    segundos ?? 0,
  );

  const primera = supuesto - desplazamientoMs(new Date(supuesto), zona);
  const segunda = supuesto - desplazamientoMs(new Date(primera), zona);
  return new Date(segunda);
}

/**
 * Enumera los días del calendario **local** que caen en el día de semana pedido.
 *
 * Recorre la ventana en pasos de doce horas —suficiente para no saltarse ningún
 * día del calendario, incluso donde la zona se corre una hora— y la ensancha un
 * día por lado: un día local puede empezar antes de `desde` o terminar después
 * de `hasta` y aun así tener cupos dentro de la ventana.
 *
 * @param desde - Inicio de la ventana, en UTC.
 * @param hasta - Fin de la ventana, en UTC.
 * @param diaSemana - Día de la semana de la regla, 0 = domingo.
 * @param zona - Identificador IANA.
 */
export function diasLocalesQueCoinciden(
  desde: Date,
  hasta: Date,
  diaSemana: number,
  zona: string,
): DiaLocal[] {
  const dias: DiaLocal[] = [];
  const vistos = new Set<string>();

  const inicio = desde.getTime() - 2 * MEDIO_DIA_MS;
  const fin = hasta.getTime() + 2 * MEDIO_DIA_MS;

  for (let t = inicio; t <= fin; t += MEDIO_DIA_MS) {
    const dia = diaLocalDe(new Date(t), zona);
    const clave = `${dia.year}-${dia.month}-${dia.day}`;
    if (vistos.has(clave)) continue;
    vistos.add(clave);
    if (diaDeLaSemana(dia) === diaSemana) dias.push(dia);
  }

  return dias;
}
