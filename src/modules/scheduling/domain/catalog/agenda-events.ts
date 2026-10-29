/**
 * Nombres de los hechos que la agenda por espacio publica en el outbox
 * (`asyncapi/asyncapi.yaml`, `asyncapi/fragments/f5agenda.yaml`).
 */

/** Se ató (o soltó) el horario de una plantilla a un espacio. */
export const TEMPLATE_CARE_SPACE_SET_EVENT =
  'scheduling.template.care_space_set';

/** `scheduling.availability_exception.created` (con `sourceKind`). */
export const AVAILABILITY_EXCEPTION_CREATED_EVENT =
  'scheduling.availability_exception.created';

/** `scheduling.availability_exception.ended`: la fuente volvió y la excepción se acortó o se quitó. */
export const AVAILABILITY_EXCEPTION_ENDED_EVENT =
  'scheduling.availability_exception.ended';

/** Se ligó un recurso a un espacio. */
export const RESOURCE_LINKED_TO_SPACE_EVENT =
  'scheduling.resource.linked_to_space';

/** Se ligó un recurso agendable a un equipo de diagnóstico. */
export const RESOURCE_LINKED_TO_EQUIPMENT_EVENT =
  'scheduling.resource.linked_to_equipment';

/** Texto de la excepción creada por un bloqueo del espacio (sin el motivo clínico). */
export const CARE_SPACE_BLOCK_EXCEPTION_REASON = 'Bloqueo del consultorio';

/** Texto de la excepción creada por el estado del equipo. */
export const EQUIPMENT_STATUS_EXCEPTION_REASON = 'Equipo fuera de servicio';
