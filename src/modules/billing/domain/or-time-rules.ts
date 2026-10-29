/**
 * Uso de quirófano por tiempo (CONTRATO-F2-F5 F5e): minutos entre la entrada y la
 * salida del paciente de la sala, en unidades de la tarifa, redondeando **hacia
 * arriba**. Funciones puras.
 */

/** Tiempos que F4 deja del caso. */
export interface OrCaseTimes {
  /** `OR_EVENT_PATIENT_IN_ROOM`. */
  readonly patientInRoomAt: Date | null;
  /** `OR_EVENT_PATIENT_OUT_OF_ROOM`. */
  readonly patientOutOfRoomAt: Date | null;
  /** `procedure_cases.actual_start_at`. */
  readonly actualStartAt: Date | null;
  /** `procedure_cases.actual_end_at`. */
  readonly actualEndAt: Date | null;
}

/** Intervalo facturable de un caso. */
export interface BillableInterval {
  /** Desde. */
  readonly start: Date;
  /** Hasta. */
  readonly end: Date;
  /** De dónde salió: los hechos de sala, o el inicio y fin reales del caso. */
  readonly source: 'ROOM_EVENTS' | 'CASE_ACTUALS';
}

/**
 * Intervalo facturable: `PATIENT_OUT_OF_ROOM − PATIENT_IN_ROOM`; si falta alguno de
 * los dos hechos de sala, `actual_end_at − actual_start_at`.
 *
 * @param times - Tiempos del caso.
 * @returns El intervalo, o `null` si no hay ninguno completo.
 */
export function billableInterval(times: OrCaseTimes): BillableInterval | null {
  if (times.patientInRoomAt && times.patientOutOfRoomAt) {
    return {
      start: times.patientInRoomAt,
      end: times.patientOutOfRoomAt,
      source: 'ROOM_EVENTS',
    };
  }
  if (times.actualStartAt && times.actualEndAt) {
    return {
      start: times.actualStartAt,
      end: times.actualEndAt,
      source: 'CASE_ACTUALS',
    };
  }
  return null;
}

/** Minutos exactos (con fracción) de un intervalo. */
export function intervalMinutes(interval: BillableInterval): number {
  return (interval.end.getTime() - interval.start.getTime()) / 60_000;
}

/**
 * Unidades facturables: `max(minimum_units, ceil(minutos ÷ unit_minutes))`.
 *
 * @param minutes - Minutos del caso (> 0).
 * @param unitMinutes - Minutos de cada unidad de la tarifa (> 0).
 * @param minimumUnits - Unidades mínimas de la tarifa (por omisión, 1).
 * @throws RangeError si los minutos o la unidad no son positivos.
 */
export function orTimeUnits(
  minutes: number,
  unitMinutes: number,
  minimumUnits: number | null | undefined,
): number {
  if (!(minutes > 0) || !(unitMinutes > 0)) {
    throw new RangeError(
      'Los minutos y la unidad de la tarifa deben ser positivos',
    );
  }
  // Un error de punto flotante (95/30 = 3.1666…) nunca cruza un entero por sí solo;
  // el redondeo a 1e-9 evita que 90.00000000000001 minutos pidan una unidad de más.
  const exact = Math.round((minutes / unitMinutes) * 1e9) / 1e9;
  return Math.max(minimumUnits ?? 1, Math.ceil(exact));
}
