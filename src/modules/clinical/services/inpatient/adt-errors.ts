import {
  ConflictException,
  PreconditionFailedException,
  type DomainException,
} from '../../../../common';

/** `reason` de F3 que el contrato fija como 409; el resto es 422. */
const CONFLICTS = new Set([
  'PATIENT_ALREADY_ADMITTED',
  'BED_NOT_ASSIGNABLE',
  'BED_DOUBLE_OCCUPANCY',
  'ENCOUNTER_ALREADY_HAS_BED',
  'ENCOUNTER_HAS_NO_BED',
  'SWAP_REQUIRES_TWO_OCCUPIED_BEDS',
  'SWAP_SAME_ENCOUNTER',
  'ENCOUNTER_NOT_IN_PROGRESS',
  'PREVIOUS_BED_NO_LONGER_AVAILABLE',
  'ADT_CANCEL_WINDOW_EXPIRED',
  'LOCATION_NOT_CANCELLABLE',
  'CENSUS_ALREADY_CLOSED',
  'CENSUS_NOT_CLOSED',
]);

/** Mensajes para la persona. */
const MESSAGES: Record<string, string> = {
  PATIENT_ALREADY_ADMITTED: 'El paciente ya tiene una internación en curso',
  BED_NOT_ASSIGNABLE: 'La cama no se puede asignar',
  BED_DOUBLE_OCCUPANCY: 'La cama ya está ocupada o reservada en ese período',
  ENCOUNTER_ALREADY_HAS_BED: 'El encuentro ya tiene cama: use el traslado',
  ENCOUNTER_HAS_NO_BED: 'El encuentro no tiene cama asignada',
  SWAP_REQUIRES_TWO_OCCUPIED_BEDS: 'El intercambio requiere dos camas ocupadas',
  SWAP_SAME_ENCOUNTER: 'No se puede intercambiar un encuentro consigo mismo',
  ENCOUNTER_NOT_IN_PROGRESS: 'El encuentro no está en curso',
  PREVIOUS_BED_NO_LONGER_AVAILABLE: 'La cama anterior ya no está libre',
  ADT_CANCEL_WINDOW_EXPIRED: 'Pasó la ventana para anular el movimiento',
  LOCATION_NOT_CANCELLABLE: 'Esa ubicación no se puede anular',
  CENSUS_ALREADY_CLOSED: 'El censo de ese día ya está cerrado',
  CENSUS_NOT_CLOSED: 'El censo de ese día todavía no está cerrado',
  BED_COMPATIBILITY_OVERRIDE_REQUIRED:
    'La cama no es compatible: requiere forzar con justificación',
  OVERRIDE_JUSTIFICATION_TOO_SHORT:
    'La justificación debe tener al menos 20 caracteres',
  OVERRIDE_RULE_NOT_OVERRIDABLE: 'Esa regla no se puede forzar',
  SPACE_NOT_A_BED: 'El espacio no es una cama',
  BED_ASSIGNMENT_REQUIRES_ADT:
    'Las camas se ocupan por internación (ADT), no por check-in',
  TRANSFER_TO_SAME_BED: 'El destino es la cama actual',
  OCCURRED_AT_IN_FUTURE: 'La fecha del movimiento no puede ser futura',
  OCCURRED_AT_BEFORE_CURRENT_START:
    'La fecha es anterior al inicio de la ubicación actual',
  DISCHARGE_DISPOSITION_REQUIRED: 'Indique el destino del egreso',
  CENSUS_DATE_NOT_ENDED: 'El día todavía no terminó',
  ADJUSTMENT_REASON_REQUIRED: 'Indique el motivo del ajuste',
  ADJUSTMENT_FIELD_INVALID: 'Esa columna del censo no se puede ajustar',
  INDICATOR_RANGE_TOO_LONG: 'El rango no puede superar 366 días',
};

/**
 * Excepción del `reason` de F3 con el código HTTP del contrato.
 *
 * @param reason - `reason`.
 * @param details - Detalle.
 */
export function adtError(
  reason: string,
  details: Record<string, unknown> = {},
): DomainException {
  const message = MESSAGES[reason] ?? 'Regla de internación no cumplida';
  return CONFLICTS.has(reason)
    ? new ConflictException(message, details, reason)
    : new PreconditionFailedException(message, details, reason);
}
