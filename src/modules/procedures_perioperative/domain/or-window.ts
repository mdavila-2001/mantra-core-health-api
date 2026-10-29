/**
 * Reglas puras del quirófano (INV-38): la ventana reservada y a quién pertenece un bloque.
 * Sin base ni Nest: se prueban solas y las usan los servicios.
 */

const MINUTE_MS = 60_000;

/** Ventana `[start, end)`. */
export interface Interval {
  readonly start: Date;
  readonly end: Date;
}

/**
 * Ventana que reserva una cirugía: `[inicio − preparación, fin + limpieza)`.
 *
 * Es la misma cuenta que hace el trigger `trg_procedure_cases_reserved_window`; la API la
 * calcula para validar **antes** de escribir, y la base es la red (el cliente no puede fijar
 * `reserved_*`: el trigger los sobreescribe siempre).
 *
 * @param start - Inicio programado.
 * @param end - Fin programado.
 * @param prepMinutes - Preparación (nulo ⇒ 0).
 * @param cleanupMinutes - Limpieza (nulo ⇒ 0).
 * @returns La ventana reservada.
 */
export function reservedWindow(
  start: Date,
  end: Date,
  prepMinutes?: number | null,
  cleanupMinutes?: number | null,
): Interval {
  return {
    start: new Date(start.getTime() - (prepMinutes ?? 0) * MINUTE_MS),
    end: new Date(end.getTime() + (cleanupMinutes ?? 0) * MINUTE_MS),
  };
}

/** ¿Se solapan `[a.start, a.end)` y `[b.start, b.end)`? Extremo común no es solape. */
export function overlaps(a: Interval, b: Interval): boolean {
  return a.start < b.end && b.start < a.end;
}

/** Dueño de un bloque, tal como lo guarda la tabla. */
export interface BlockOwnerRef {
  /** `SERVICE` o `SURGEON`. */
  readonly kind: 'SERVICE' | 'SURGEON';
  /** Unidad clínica del servicio. */
  readonly clinicalUnitId?: string | null;
  /** Especialidad del servicio. */
  readonly surgicalSpecialtyConceptId?: string | null;
  /** Cirujano dueño. */
  readonly surgeonProfileId?: string | null;
  /** Especialidad de la unidad (para un bloque de servicio que sólo nombra la unidad). */
  readonly unitSpecialtyConceptId?: string | null;
}

/** Lo que de un caso importa para saber si cae en «su» bloque. */
export interface CaseOwnerRef {
  /** Cirujano principal. */
  readonly primarySurgeonProfileId?: string | null;
  /** Especialidad quirúrgica del caso. */
  readonly surgicalSpecialtyConceptId?: string | null;
}

/**
 * ¿Pertenece el bloque al dueño del caso?
 *
 * - Bloque de **cirujano**: el cirujano principal del caso es el dueño.
 * - Bloque de **servicio**: la especialidad del caso es la del bloque o, si el bloque sólo
 *   nombra una unidad, la de esa unidad. Un caso sin especialidad nunca es «propio» de un
 *   bloque de servicio (fail-closed): no se puede probar que le corresponde.
 *
 * @param block - Dueño del bloque.
 * @param c - Dueño del caso.
 * @returns `true` si el caso cae legítimamente en el bloque.
 */
export function isOwnBlock(block: BlockOwnerRef, c: CaseOwnerRef): boolean {
  if (block.kind === 'SURGEON') {
    return (
      !!block.surgeonProfileId &&
      block.surgeonProfileId === c.primarySurgeonProfileId
    );
  }
  const blockSpecialty =
    block.surgicalSpecialtyConceptId ?? block.unitSpecialtyConceptId;
  return (
    !!blockSpecialty && blockSpecialty === (c.surgicalSpecialtyConceptId ?? '')
  );
}

/** Une intervalos solapados o contiguos. Entrada sin ordenar; salida ordenada. */
export function mergeIntervals(intervals: readonly Interval[]): Interval[] {
  const sorted = [...intervals]
    .filter((i) => i.end > i.start)
    .sort((a, b) => a.start.getTime() - b.start.getTime());
  const merged: Interval[] = [];
  for (const interval of sorted) {
    const last = merged[merged.length - 1];
    if (last && interval.start <= last.end) {
      if (interval.end > last.end) {
        merged[merged.length - 1] = { start: last.start, end: interval.end };
      }
    } else {
      merged.push({ start: interval.start, end: interval.end });
    }
  }
  return merged;
}

/** Minutos de un intervalo, acotado a `within` si se pasa. */
export function minutesOf(interval: Interval, within?: Interval): number {
  const start = within
    ? Math.max(interval.start.getTime(), within.start.getTime())
    : interval.start.getTime();
  const end = within
    ? Math.min(interval.end.getTime(), within.end.getTime())
    : interval.end.getTime();
  return Math.max(0, (end - start) / MINUTE_MS);
}

/** Suma de minutos de una lista de intervalos ya disjuntos. */
export function totalMinutes(intervals: readonly Interval[]): number {
  return intervals.reduce((sum, i) => sum + minutesOf(i), 0);
}

/** Mediana (p50) de una lista de números; `null` si está vacía. */
export function median(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}
