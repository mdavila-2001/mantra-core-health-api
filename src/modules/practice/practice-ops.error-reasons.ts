/**
 * Sub-códigos de negocio de la operación de espacios (F2 de infraestructura
 * hospitalaria, CONTRATO-F2-F5 §F2.3). Van en el 3er argumento (`reason`) de
 * `DomainException`; un cliente ramifica sobre ellos sin parsear `message`.
 */
export enum OpsErrorReason {
  // --- permisos (403) -------------------------------------------------------
  /** El actor ve el recurso pero ningún rol suyo permite la acción (`details.requiredRoles`). */
  INFRA_ACTION_NOT_ALLOWED = 'INFRA_ACTION_NOT_ALLOWED',
  /** Aislar en cohorte exige el aval del rol de control de infecciones. */
  ISOLATION_COHORT_REQUIRES_APPROVAL = 'ISOLATION_COHORT_REQUIRES_APPROVAL',
  /** La inspección de una limpieza terminal es de un supervisor. */
  TERMINAL_INSPECTION_REQUIRES_SUPERVISOR = 'TERMINAL_INSPECTION_REQUIRES_SUPERVISOR',

  // --- estado del espacio (422) ----------------------------------------------
  /** El espacio no está activo (o está fuera de su vigencia). */
  SPACE_NOT_ACTIVE = 'SPACE_NOT_ACTIVE',
  /** La función o la forma del espacio no tiene estado operativo (contenedor de la estructura). */
  SPACE_NOT_OPERABLE = 'SPACE_NOT_OPERABLE',
  /** Un bloqueo exige motivo. */
  BLOCK_REASON_REQUIRED = 'BLOCK_REASON_REQUIRED',
  /** El motivo `OTHER` exige texto. */
  BLOCK_REASON_TEXT_REQUIRED = 'BLOCK_REASON_TEXT_REQUIRED',
  /** El mantenimiento exige la fecha estimada de fin. */
  BLOCK_EXPECTED_END_REQUIRED = 'BLOCK_EXPECTED_END_REQUIRED',
  /** El motivo no corresponde al tipo de bloqueo. */
  BLOCK_REASON_KIND_MISMATCH = 'BLOCK_REASON_KIND_MISMATCH',
  /** La acción pedida no corresponde al bloqueo vigente (o falta el tipo). */
  AVAILABILITY_ACTION_INVALID = 'AVAILABILITY_ACTION_INVALID',
  /** Las fechas del bloqueo son incoherentes (fin antes del inicio, fin en el pasado). */
  BLOCK_PERIOD_INVALID = 'BLOCK_PERIOD_INVALID',
  /** El aislamiento pedido exige un local que el espacio no es (`details.missing`). */
  ISOLATION_ROOM_NOT_CAPABLE = 'ISOLATION_ROOM_NOT_CAPABLE',
  /** Aislar exige el motivo clínico. */
  ISOLATION_REASON_REQUIRED = 'ISOLATION_REASON_REQUIRED',
  /** La cohorte avalada exige el organismo. */
  ISOLATION_ORGANISM_REQUIRED = 'ISOLATION_ORGANISM_REQUIRED',
  /** Marcar sucia o contaminada exige el motivo. */
  HYGIENE_REASON_REQUIRED = 'HYGIENE_REASON_REQUIRED',
  /** Sobre una bandera de limpieza terminal sólo se pide una limpieza terminal. */
  TERMINAL_CLEANING_REQUIRED = 'TERMINAL_CLEANING_REQUIRED',
  /** Rechazar una inspección exige el motivo. */
  INSPECTION_REASON_REQUIRED = 'INSPECTION_REASON_REQUIRED',
  /** Quien terminó la limpieza no la inspecciona. */
  INSPECTION_BY_CLEANER_NOT_ALLOWED = 'INSPECTION_BY_CLEANER_NOT_ALLOWED',
  /** Cancelar una orden exige el motivo. */
  CLEANING_CANCEL_REASON_REQUIRED = 'CLEANING_CANCEL_REASON_REQUIRED',
  /** La cama no se puede reservar o programar en esa ventana (puerto `assertBookable`). */
  SPACE_NOT_BOOKABLE = 'SPACE_NOT_BOOKABLE',
  /** Un código de concepto no pertenece a la familia esperada. */
  OPS_CODE_INVALID = 'OPS_CODE_INVALID',

  // --- conflictos (409) -------------------------------------------------------
  /** No se bloquea ni se cierra una cama ocupada o reservada. */
  SPACE_OCCUPIED = 'SPACE_OCCUPIED',
  /** El espacio ya tiene un bloqueo en ese período (lo pone también la base). */
  BLOCK_OVERLAP = 'BLOCK_OVERLAP',
  /** Hay compromisos futuros en la ventana; `details.conflicts` los lista. */
  FUTURE_COMMITMENTS_CONFLICT = 'FUTURE_COMMITMENTS_CONFLICT',
  /** El bloqueo ya terminó o fue cancelado. */
  BLOCK_ALREADY_ENDED = 'BLOCK_ALREADY_ENDED',
  /** El espacio ya tiene una orden de limpieza abierta (`details.cleaningOrderId`). */
  CLEANING_ORDER_ALREADY_OPEN = 'CLEANING_ORDER_ALREADY_OPEN',
  /** La orden no admite esa transición (`details.from`, `details.to`). */
  CLEANING_ORDER_INVALID_TRANSITION = 'CLEANING_ORDER_INVALID_TRANSITION',

  // --- concurrencia (412) -------------------------------------------------------
  /** `If-Match-Ops` no coincide con la `ops_version` vigente. */
  OPS_VERSION_MISMATCH = 'OPS_VERSION_MISMATCH',
  /** Falta `If-Match-Ops` en una modificación operativa (428). */
  IF_MATCH_OPS_REQUIRED = 'IF_MATCH_OPS_REQUIRED',
}
