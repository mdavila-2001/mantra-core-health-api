import type { AuthenticatedUser } from '../../../common';
import type { PatientSearchScope } from '../repositories/patient-profiles.repository';

/**
 * Roles que atienden y, por eso, pueden buscar a la persona que tienen enfrente
 * — incluso para darla de alta si nunca la atendieron (P-07-10).
 */
export const ROLES_QUE_ATIENDEN = ['CLINICIAN', 'PRACTITIONER'] as const;

/** Roles que administran el padrón completo de personas. */
export const ROLES_QUE_ADMINISTRAN = ['SECURITY_ADMIN', 'SUPERADMIN'] as const;

/**
 * Hasta dónde llega la búsqueda de pacientes de quien pregunta (UC-05-13).
 *
 * ## P-07-10 (2026-09-02) — revierte el alcance por actividad del mismo día
 *
 * La primera versión de esta política (misma fecha, horas antes) acotaba a
 * quien atiende a **la gente con actividad en su organización**: una reserva
 * de agenda o una relación asistencial. Marcelo la revirtió el mismo día con
 * un argumento que la propia regla no contemplaba: **la búsqueda no es sólo
 * para consultar a quien ya se atendió, es para REGISTRAR a quien nunca se
 * atendió** — y si el alcance queda acotado a la actividad, un profesional no
 * puede encontrar (para dar de alta, para invitar, para vincular) a nadie que
 * todavía no tiene ni una reserva ni una relación con su organización. Un
 * padrón acotado por actividad es exactamente lo que le impide cumplir el
 * caso de uso que motivó abrirlo.
 *
 * Por eso `CLINICIAN`/`PRACTITIONER` pasan a ver el **mismo padrón sin
 * acotar** que `SECURITY_ADMIN`/`SUPERADMIN`. La lectura del expediente
 * clínico —a diferencia de encontrar a alguien en una lista— sigue cerrada
 * por su propia puerta (`ClinicalReadService.assertPuedeLeerHistoria`: turno
 * confirmado hoy o relación aceptada vigente), así que encontrar a una
 * persona en esta búsqueda no abre su historia.
 *
 * ## La condición que reemplaza al acotamiento: al menos un criterio
 *
 * Sin acotar por actividad, un rol clínico que pidiera la página sin ningún
 * criterio recibiría la primera página del padrón entero — no es buscar, es
 * enumerar. `SECURITY_ADMIN`/`SUPERADMIN` siguen listando libremente (es su
 * pantalla de administración del padrón, con ese propósito); a
 * `CLINICIAN`/`PRACTITIONER` se les exige `q` o `nationalId` para poder
 * preguntar — la regla vive en `ProfilesPatientsService.searchPatients`
 * (servicio, no acá ni en el repositorio) porque es sobre **quién puede
 * disparar la consulta**, no sobre cómo se arma el `WHERE`.
 *
 * @param _actor - Usuario autenticado que pregunta; sin uso hoy — los cuatro
 *   roles que llegan acá (`@Roles` del controlador: `SECURITY_ADMIN`,
 *   `SUPERADMIN`, `CLINICIAN`, `PRACTITIONER`) ven el mismo padrón. Se
 *   conserva el parámetro porque la diferencia entre ellos no es CUÁNTO ven
 *   —eso resuelve esta función—, es si necesitan aportar un criterio para
 *   preguntar, y eso lo exige {@link requiereCriterioDeBusqueda} en el
 *   servicio.
 * @returns El alcance con el que hay que resolver la consulta.
 */
export function resolvePatientSearchScope(
  _actor: AuthenticatedUser,
): PatientSearchScope {
  return { kind: 'unrestricted' };
}

/**
 * Si el actor necesita aportar al menos un criterio para buscar (P-07-10).
 *
 * `SECURITY_ADMIN`/`SUPERADMIN` administran el padrón y pueden listarlo sin
 * criterio, como siempre. Un rol clínico —que ahora ve el mismo padrón sin
 * acotar por actividad— sin esta exigencia podría pedir la primera página
 * entera sin preguntar nada: es enumeración del padrón, no búsqueda.
 *
 * @param actor - Usuario autenticado que pregunta.
 * @returns `true` si el actor debe aportar `q` o `nationalId`.
 */
export function requiereCriterioDeBusqueda(actor: AuthenticatedUser): boolean {
  return !actor.roles.some((rol) =>
    (ROLES_QUE_ADMINISTRAN as readonly string[]).includes(rol),
  );
}
