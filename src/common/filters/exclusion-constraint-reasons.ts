/**
 * Restricción `EXCLUDE` → `reason` del contrato (CONTRATO-F2-F5 §0.2).
 *
 * La API pre-valida cada solape y responde con su propio `reason`; la base es
 * la red de seguridad para la carrera entre dos peticiones concurrentes. Cuando
 * la red salta (`23P01`), el filtro global traduce con este mapa en vez de
 * devolver un genérico, así el cliente ramifica igual en los dos caminos.
 *
 * Todas son 409: el pedido es válido, choca con el estado actual. Una
 * restricción que no está acá (p. ej. `ex_appointments_practitioner_time`)
 * sigue con la respuesta genérica de siempre.
 */
export interface ExclusionReason {
  /** `reason` del contrato. */
  readonly reason: string;
  /** Mensaje para la persona (de usted). */
  readonly message: string;
}

export const EXCLUSION_CONSTRAINT_REASONS: Readonly<
  Record<string, ExclusionReason>
> = {
  // F2 · bloqueos de un espacio.
  ex_care_space_blocks_time: {
    reason: 'BLOCK_OVERLAP',
    message: 'El espacio ya tiene un bloqueo en ese período',
  },
  // F3 · una cama, un paciente; un encuentro, una cama.
  ex_encounter_locations_bed_occupancy: {
    reason: 'BED_DOUBLE_OCCUPANCY',
    message: 'La cama ya está ocupada o reservada en ese período',
  },
  ex_encounter_locations_encounter_single_bed: {
    reason: 'ENCOUNTER_ALREADY_HAS_BED',
    message: 'El encuentro ya tiene una cama en ese período',
  },
  // F4 · quirófanos.
  ex_procedure_cases_operating_room_time: {
    reason: 'OPERATING_ROOM_SLOT_CONFLICT',
    message: 'El quirófano ya está reservado en esa ventana',
  },
  ex_operating_room_blocks_time: {
    reason: 'OR_BLOCK_OVERLAP',
    message: 'El quirófano ya tiene un bloque asignado en ese período',
  },
  // F5d · agenda por espacio.
  ex_appointments_care_space_time: {
    reason: 'CARE_SPACE_DOUBLE_BOOKED',
    message: 'El consultorio ya tiene una cita en ese horario',
  },
  // F5e · facturación.
  ex_space_tariffs_validity: {
    reason: 'TARIFF_OVERLAP',
    message: 'Ya hay una tarifa vigente para ese espacio o categoría',
  },
  ex_care_space_category_periods_validity: {
    reason: 'CATEGORY_PERIOD_OVERLAP',
    message: 'La cama ya tiene una categoría vigente en ese período',
  },
  // F5g · jefe de unidad único.
  ex_org_user_assignments_unit_head: {
    reason: 'UNIT_HEAD_ALREADY_ASSIGNED',
    message: 'La unidad ya tiene un jefe vigente',
  },
};

/**
 * Traducción de una restricción, o `undefined` si no está en el mapa.
 *
 * @param constraint - Nombre que reporta PostgreSQL.
 */
export function exclusionReasonOf(
  constraint: string | undefined,
): ExclusionReason | undefined {
  return constraint ? EXCLUSION_CONSTRAINT_REASONS[constraint] : undefined;
}
