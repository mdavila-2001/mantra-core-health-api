/**
 * Sub-códigos de negocio estables para los errores de dominio de `scheduling`.
 *
 * Van como tercer argumento de `DomainException` (y subclases) además del
 * `code` genérico de la clase (404/409/422/...): mientras el `code` dice la
 * forma HTTP del error, `reason` dice CUÁL de las muchas situaciones de negocio
 * que comparten esa forma ocurrió. El front y cualquier integrador pueden
 * discriminar sobre esto sin parsear el mensaje en español.
 */
export enum SchedulingErrorReason {
  // Motivo de texto libre (corrección #14): cancelar, rechazar, reprogramar.
  REASON_REQUIRED = 'REASON_REQUIRED',
  REASON_PLACEHOLDER = 'REASON_PLACEHOLDER',

  // Ventanas de tiempo (from/to) exigidas por distintas lecturas y mutaciones.
  AGENDA_WINDOW_REQUIRED = 'AGENDA_WINDOW_REQUIRED',
  AGENDA_WINDOW_INVALID = 'AGENDA_WINDOW_INVALID',
  AGENDA_WINDOW_INVERTED = 'AGENDA_WINDOW_INVERTED',
  AGENDA_WINDOW_TOO_WIDE = 'AGENDA_WINDOW_TOO_WIDE',

  // Reglas de confirmación.
  CONFIRMATION_RULE_NOT_FOUND = 'CONFIRMATION_RULE_NOT_FOUND',

  // Políticas de reserva.
  POLICY_CODE_ALREADY_EXISTS = 'POLICY_CODE_ALREADY_EXISTS',

  // Plantillas y sus franjas.
  TEMPLATE_RULE_TIME_INVERTED = 'TEMPLATE_RULE_TIME_INVERTED',
  TEMPLATE_RULE_SLOT_TOO_LONG = 'TEMPLATE_RULE_SLOT_TOO_LONG',
  TEMPLATE_RULE_OVERLAP_SELF = 'TEMPLATE_RULE_OVERLAP_SELF',
  TEMPLATE_RULE_OVERLAP_OTHER_AGENDA = 'TEMPLATE_RULE_OVERLAP_OTHER_AGENDA',
  /**
   * Agenda por espacio (F5d). La función del espacio no admite horario propio (consultorio,
   * sala de procedimientos y sala de imagen sí).
   */
  TEMPLATE_CARE_SPACE_INVALID_FUNCTION = 'TEMPLATE_CARE_SPACE_INVALID_FUNCTION',
  /** El espacio no es de la sede/práctica del recurso, o no es el espacio al que el recurso ya está atado. */
  TEMPLATE_CARE_SPACE_SITE_MISMATCH = 'TEMPLATE_CARE_SPACE_SITE_MISMATCH',
  /** Otra plantilla vigente ocupa el mismo consultorio a la misma hora (la base no puede expresarlo). */
  TEMPLATE_RULE_OVERLAP_CARE_SPACE = 'TEMPLATE_RULE_OVERLAP_CARE_SPACE',
  TEMPLATE_NOT_FOUND = 'TEMPLATE_NOT_FOUND',
  TEMPLATE_RESOURCE_NOT_FOUND = 'TEMPLATE_RESOURCE_NOT_FOUND',
  TEMPLATE_HAS_ACTIVE_BOOKINGS = 'TEMPLATE_HAS_ACTIVE_BOOKINGS',
  /**
   * Cita por TELECONSULTA fuera de una franja con la telemedicina habilitada
   * (v4.2.61). Por defecto ninguna franja la tiene: la activa el profesional.
   */
  TELEMEDICINE_NOT_ENABLED = 'TELEMEDICINE_NOT_ENABLED',

  // Recursos agendables.
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  /**
   * Recurso inexistente o de otra organización: se responde igual para los dos
   * (404 uniforme) porque distinguirlos confirmaría que el UUID existe.
   */
  RESOURCE_NOT_AVAILABLE = 'SCHEDULING_RESOURCE_NOT_AVAILABLE',

  // Cupos (slots) de una agenda.
  SLOT_NOT_FOUND = 'SLOT_NOT_FOUND',
  SLOTS_NOT_FOUND_FOR_RESOURCE = 'SLOTS_NOT_FOUND_FOR_RESOURCE',
  SLOTS_HAVE_ACTIVE_BOOKINGS = 'SLOTS_HAVE_ACTIVE_BOOKINGS',
  SLOT_BLOCKED = 'SLOT_BLOCKED',
  SLOT_NO_CAPACITY = 'SLOT_NO_CAPACITY',
  SHIFT_WINDOW_INVERTED = 'SHIFT_WINDOW_INVERTED',
  SHIFT_MINUTES_ZERO = 'SHIFT_MINUTES_ZERO',

  // Excepciones de disponibilidad (bloqueos/aperturas puntuales).
  EXCEPTION_REASON_REQUIRED = 'EXCEPTION_REASON_REQUIRED',
  EXCEPTION_WINDOW_INVERTED = 'EXCEPTION_WINDOW_INVERTED',
  EXCEPTION_NOT_FOUND = 'EXCEPTION_NOT_FOUND',
  PRACTITIONER_HAS_CONFIRMED_APPOINTMENT = 'PRACTITIONER_HAS_CONFIRMED_APPOINTMENT',

  // Vínculo profesional-organización.
  AFFILIATION_NOT_ACTIVE = 'AFFILIATION_NOT_ACTIVE',

  // Turnos (appointment bookings) y su ciclo de vida.
  APPOINTMENT_SLOT_PAST = 'APPOINTMENT_SLOT_PAST',
  APPOINTMENT_MIN_NOTICE_NOT_MET = 'APPOINTMENT_MIN_NOTICE_NOT_MET',
  PATIENT_MAX_ACTIVE_BOOKINGS = 'PATIENT_MAX_ACTIVE_BOOKINGS',
  HOLD_NOT_FOUND = 'HOLD_NOT_FOUND',
  HOLD_ALREADY_CONSUMED = 'HOLD_ALREADY_CONSUMED',
  HOLD_EXPIRED = 'HOLD_EXPIRED',
  PATIENT_ALREADY_BOOKED_OVERLAPPING = 'PATIENT_ALREADY_BOOKED_OVERLAPPING',
  PATIENT_NOT_FOUND = 'PATIENT_NOT_FOUND',
  BOOKING_NOT_FOUND = 'BOOKING_NOT_FOUND',
  BOOKING_NOT_ACTIVE_FOR_RESCHEDULE = 'BOOKING_NOT_ACTIVE_FOR_RESCHEDULE',
  RESCHEDULE_SAME_SLOT = 'RESCHEDULE_SAME_SLOT',
  TARGET_SLOT_NOT_FOUND = 'TARGET_SLOT_NOT_FOUND',
  TARGET_SLOT_NO_CAPACITY = 'TARGET_SLOT_NO_CAPACITY',
  BOOKING_ALREADY_CANCELLED = 'BOOKING_ALREADY_CANCELLED',
  CANCELLATION_WINDOW_NOT_MET = 'CANCELLATION_WINDOW_NOT_MET',
  PAYMENT_STATE_NOT_APPLICABLE = 'PAYMENT_STATE_NOT_APPLICABLE',
  PROPOSED_SLOT_SAME_AS_CURRENT = 'PROPOSED_SLOT_SAME_AS_CURRENT',
  PROPOSED_SLOT_NOT_FOUND = 'PROPOSED_SLOT_NOT_FOUND',
  PROPOSED_SLOT_NO_CAPACITY = 'PROPOSED_SLOT_NO_CAPACITY',
  BOOKING_NOT_PENDING = 'BOOKING_NOT_PENDING',
  INVALID_STATE_TRANSITION = 'INVALID_STATE_TRANSITION',
  SEARCH_FILTER_REQUIRED = 'SEARCH_FILTER_REQUIRED',

  // Demoras (avisos de retraso del profesional).
  DELAY_WINDOW_INVERTED = 'DELAY_WINDOW_INVERTED',
  DELAY_TOO_LONG = 'DELAY_TOO_LONG',

  // Tiempo del profesional cruzando todas sus agendas (REGLA MADRE AG-1).
  PRACTITIONER_NOT_AVAILABLE = 'PRACTITIONER_NOT_AVAILABLE',

  // Agenda por espacio y por equipo (F5a/F5d).
  /** La cita ya tiene consultorio y el pedido declara otro. */
  APPOINTMENT_CARE_SPACE_MISMATCH = 'APPOINTMENT_CARE_SPACE_MISMATCH',
  /** Dos citas en el mismo consultorio y horario: la API lo detecta antes, la base es la red. */
  CARE_SPACE_DOUBLE_BOOKED = 'CARE_SPACE_DOUBLE_BOOKED',
  /** La excepción la creó un bloqueo o el estado de un equipo: sólo se cambia en su origen. */
  EXCEPTION_SOURCE_READ_ONLY = 'EXCEPTION_SOURCE_READ_ONLY',
  /** El cupo dejó de ofrecerse porque su espacio o su equipo está fuera de servicio. */
  SLOT_SOURCE_CLOSED = 'SLOT_SOURCE_CLOSED',
  /** El tipo de recurso no corresponde a la tabla que referencia (p. ej. una sala que apunta a un perfil). */
  RESOURCE_REF_TYPE_MISMATCH = 'RESOURCE_REF_TYPE_MISMATCH',
  /** El perfil/equipo/sede referenciado no existe en la organización (404 uniforme). */
  RESOURCE_REF_NOT_FOUND = 'RESOURCE_REF_NOT_FOUND',
  /** El equipo no está ubicado en una sala: no hay a qué agenda atarlo. */
  EQUIPMENT_NOT_LOCATED = 'EQUIPMENT_NOT_LOCATED',
  /** Ya hay un recurso agendable activo para ese equipo. */
  RESOURCE_ALREADY_EXISTS_FOR_EQUIPMENT = 'RESOURCE_ALREADY_EXISTS_FOR_EQUIPMENT',

  // Recurso agendable ligado a un espacio de infraestructura (R0, F4).
  SPACE_NOT_FOUND = 'SPACE_NOT_FOUND',
  SPACE_NOT_SCHEDULABLE = 'SPACE_NOT_SCHEDULABLE',
  SPACE_NOT_ACTIVE = 'SPACE_NOT_ACTIVE',
  SPACE_RESOURCE_MUST_BE_ROOM = 'SPACE_RESOURCE_MUST_BE_ROOM',
  RESOURCE_REF_TYPE_NOT_ALLOWED = 'RESOURCE_REF_TYPE_NOT_ALLOWED',
  RESOURCE_ALREADY_EXISTS_FOR_SPACE = 'RESOURCE_ALREADY_EXISTS_FOR_SPACE',
}
