/**
 * El motivo con el que se cancela una solicitud desplazada.
 *
 * Queda en el historial y es lo que el paciente lee: una cita que desaparece
 * sin explicación se siente como un plantón, y acá la explicación existe —otro
 * médico le dijo que sí primero—.
 */
export const DISPLACED_REASON =
  'Se canceló automáticamente: le confirmaron otra cita a la misma hora.';

/**
 * Antelación de los recordatorios que se programan al aceptar (P8).
 *
 * Víspera y dos horas antes: la primera sirve para reorganizar el día, la
 * segunda para salir a tiempo. Son las dos que el registro del cliente nombra.
 */
export const DEFAULT_REMINDER_OFFSETS: readonly number[] = [24 * 60, 2 * 60];

export const DEFAULT_HOLD_TTL_SECONDS = 300;
export const DEFAULT_WORKER_BATCH = 100;

/**
 * CAN-APT-001: ventana de cancelación por defecto (24h) cuando la reserva no tiene
 * snapshot (citas antiguas) o la política no definía una ventana específica.
 */
export const DEFAULT_CANCELLATION_WINDOW_MINUTES = 24 * 60;
