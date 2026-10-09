/**
 * Cómo nombra un recurso a la tabla de perfiles profesionales.
 *
 * **Son dos porque el sistema dice las dos cosas.** El DTO de agenda ejemplifica
 * `health_practitioner_profiles` —el nombre real de la tabla— y los recursos
 * sembrados traen `practitioner_profiles`. Aceptar sólo uno dejaría la cita
 * clínica sin profesional contra la mitad de los datos, y en silencio.
 *
 * El fallo es benigno: si ninguno coincide, la cita queda sin profesional, que
 * es lo correcto para una sala o un equipo.
 */
export const PRACTITIONER_PROFILE_TABLES: readonly string[] = [
  'practitioner_profiles',
  'health_practitioner_profiles',
];
