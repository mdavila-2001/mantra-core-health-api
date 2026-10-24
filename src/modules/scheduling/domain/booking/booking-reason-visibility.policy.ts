import type { AgendaActor } from './agenda-actors';

/**
 * MCH-030 — política de visibilidad del motivo de una cita, extraída de
 * `SchedulingBookingsService` (antes `puedeVerElMotivo`, método privado).
 *
 * Es una extracción literal, no una reescritura: la lógica y la firma son las
 * mismas, sólo cambió dónde vive. La motivación es la ficha MCH-030 (servicios
 * extensos): esta es una política pura —sin `EntityManager`, sin repositorio,
 * sin transacción— que antes sólo se podía ejercitar levantando el servicio
 * entero con sus quince dependencias inyectadas. Ahora se prueba con cuatro
 * argumentos.
 *
 * ## Qué decide
 *
 * Quién puede ver el motivo de consulta de una cita (`reasonText`) y, con la
 * misma compuerta, el nombre del paciente, la aseguradora y la solicitud de
 * seguro asociadas (ver los call-sites en `SchedulingBookingsService.aBookingItem`).
 * Es dato sensible que sólo dos partes necesitan: quien pidió el turno y quien
 * lo atiende.
 *
 * **No** es lo mismo que el motivo de CANCELACIÓN (`statusReason`), que sí es
 * visible para las dos partes: ahí el interés es saber por qué se cayó el
 * turno, y quien lo escribió sabía que el otro lado lo iba a leer.
 *
 * @param booking - La cita cuyo motivo se quiere mostrar u ocultar.
 * @param actor - Quién pide verla, o `undefined` si no hay sesión que evaluar.
 * @param agendaPractitioner - El profesional que atiende, si quien proyecta
 *   ya lo resolvió (la cita no lo guarda: cuelga del recurso).
 * @param representedPatients - Los pacientes que `actor` representa (B.1),
 *   resuelto una vez por quien proyecta la página, no por cita.
 * @returns `true` si `actor` es el titular, su representante, o el profesional
 *   que atiende.
 */
export function canSeeBookingReason(
  booking: { readonly patientProfileId: string },
  actor?: AgendaActor,
  agendaPractitioner?: string,
  representedPatients?: ReadonlySet<string>,
): boolean {
  if (!actor) return false;
  if (
    actor.patientProfileId !== undefined &&
    actor.patientProfileId === booking.patientProfileId
  ) {
    return true;
  }
  // Y quien lo representa (B.1): el motivo del turno de un hijo lo escribió
  // su madre al pedirlo. Ocultárselo le escondería lo que ella misma tipeó.
  // El conjunto lo aporta quien proyecta, que lo pidió una vez para toda la
  // página en vez de una consulta por fila.
  if (representedPatients?.has(booking.patientProfileId)) return true;
  // El profesional que atiende. La cita no lo guarda: cuelga del recurso
  // (`resource_ref_id`), así que lo aporta quien proyecta — que es el único
  // que sabe si ya lo tenía cargado o no vale la pena buscarlo.
  return (
    actor.practitionerProfileId !== undefined &&
    agendaPractitioner !== undefined &&
    actor.practitionerProfileId === agendaPractitioner
  );
}
