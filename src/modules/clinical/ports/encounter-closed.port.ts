/**
 * Puerto de «la consulta clínica terminó».
 *
 * Cuando se cierra un encuentro (o termina su teleconsulta), la agenda tiene
 * algo que hacer con ese hecho: completar el turno que el encuentro atendía, lo
 * que a su vez emite la encuesta de satisfacción al paciente. Qué hace y cómo es
 * asunto de `scheduling`; la historia clínica sólo declara **que** pasó.
 *
 * Regla del puerto: **no lanza**. Se invoca cuando terminó la transacción del
 * cierre: confirmada si la petición no tiene una propia; con `RLS_ENFORCE=true`
 * la petición entera es una transacción, y el adaptador trabaja en un
 * savepoint de ella. Un fallo del otro contexto no deshace el cierre ni lo
 * convierte en un error para quien lo hizo: el adaptador descarta su savepoint,
 * registra el fallo y devuelve. Tiene que ser idempotente: cerrar el encuentro
 * y, después, terminar la teleconsulta del mismo turno lo invocan dos veces.
 */

import type { AuthenticatedUser } from '../../../common';

/** El encuentro que terminó, con la cita clínica que atendía. */
export interface ClosedEncounterRef {
  /** Encuentro cerrado. */
  encounterId: string;
  /** Cita clínica del encuentro (`clinical.appointments.id`), si la tiene. */
  appointmentId?: string;
}

/** Receptor del fin de una consulta clínica. */
export interface EncounterClosedPort {
  /**
   * Avisa que la consulta terminó (ya confirmado en la base).
   *
   * @param encounter - El encuentro y su cita clínica.
   * @param actor - Quien la cerró.
   */
  onEncounterClosed(
    encounter: ClosedEncounterRef,
    actor: AuthenticatedUser,
  ): Promise<void>;
}

/** Token de inyección del receptor del fin de una consulta clínica. */
export const ENCOUNTER_CLOSED_PORT = Symbol('ENCOUNTER_CLOSED_PORT');
