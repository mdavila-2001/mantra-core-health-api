/**
 * MCH-022 · Rangos admitidos de los objetivos de continuidad (UC-11-09).
 *
 * RPO y RTO **no son comparables entre sí**: el RPO acota cuántos datos se
 * tolera perder y el RTO cuánto tiempo se tolera estar fuera de servicio. Una
 * organización puede aceptar perder una hora de datos y a la vez exigir estar
 * arriba en quince minutos (`RPO=3600`, `RTO=900`); eso es una política válida.
 * Por eso aquí cada objetivo se valida contra **su propio** rango y nunca
 * contra el otro.
 *
 * Las cotas de abajo son la regla de negocio acordada, escrita y con mensaje
 * propio, tal como pide la ficha. Si el negocio decide otras, se cambian acá y
 * no dentro del servicio.
 */

/**
 * Un año en segundos. Cota superior de ambos objetivos: por encima de esto el
 * valor ya no describe una política de continuidad, describe un error de carga
 * (típicamente milisegundos cargados como segundos).
 */
export const MAX_TARGET_SECONDS = 31_536_000;

/**
 * Rango admitido de cada objetivo, con el motivo de cada cota.
 *
 * - `rpoSeconds` admite **0**: es la política de «no perder ningún dato»,
 *   alcanzable con replicación síncrona, y hay que poder registrarla.
 * - `rtoSeconds` exige **al menos 1 segundo**: un objetivo de recuperación de
 *   cero segundos no es un objetivo exigente, es uno inalcanzable, y firmarlo
 *   sólo garantiza incumplirlo siempre.
 */
export const TARGETS_RANGE = {
  rpoSeconds: { min: 0, max: MAX_TARGET_SECONDS },
  rtoSeconds: { min: 1, max: MAX_TARGET_SECONDS },
} as const;

/** Nombre de cada objetivo tal como se nombra en los mensajes al operador. */
type TargetName = keyof typeof TARGETS_RANGE;

/** Objetivo fuera de rango, con el dato suficiente para corregir la carga. */
export interface OutOfRangeTarget {
  /** Campo del DTO que no cumple. */
  campo: TargetName;
  /** Valor recibido. */
  valor: unknown;
  /** Mensaje propio de esa cota, en castellano y dirigido al operador. */
  mensaje: string;
}

/**
 * Valida un objetivo contra su propio rango.
 *
 * @param campo - Objetivo a validar (`rpoSeconds` o `rtoSeconds`).
 * @param valor - Valor recibido del DTO.
 * @returns El incumplimiento, o `null` si el valor es admisible.
 */
export function validateTarget(
  campo: TargetName,
  valor: unknown,
): OutOfRangeTarget | null {
  const { min, max } = TARGETS_RANGE[campo];
  const label = campo === 'rpoSeconds' ? 'RPO' : 'RTO';

  if (typeof valor !== 'number' || !Number.isInteger(valor)) {
    return {
      campo,
      valor,
      mensaje: `El ${label} se expresa en segundos enteros`,
    };
  }
  if (valor < min) {
    return {
      campo,
      valor,
      mensaje:
        campo === 'rtoSeconds' && valor === 0
          ? 'Un RTO de cero segundos no es alcanzable: indique el tiempo de indisponibilidad que el negocio tolera'
          : `El ${label} no puede ser menor que ${min} segundos`,
    };
  }
  if (valor > max) {
    return {
      campo,
      valor,
      mensaje: `El ${label} no puede superar ${max} segundos (un año); revise si cargó milisegundos`,
    };
  }
  return null;
}

/**
 * Valida los dos objetivos de una política de forma independiente.
 *
 * @param targets - RPO y RTO tal como llegan del DTO.
 * @returns Los incumplimientos encontrados; vacío si la política es admisible.
 */
export function continuityValidateTargets(targets: {
  /** RPO objetivo en segundos. */
  rpoSeconds: unknown;
  /** RTO objetivo en segundos. */
  rtoSeconds: unknown;
}): OutOfRangeTarget[] {
  return (
    [
      validateTarget('rpoSeconds', targets.rpoSeconds),
      validateTarget('rtoSeconds', targets.rtoSeconds),
    ] as const
  ).filter((v): v is OutOfRangeTarget => v !== null);
}
