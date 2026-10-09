import { DEFAULT_CANCELLATION_WINDOW_MINUTES } from './booking-defaults';

const MS_PER_MINUTE = 60_000;

/**
 * La ventana de cancelación de una reserva, en minutos.
 *
 * CAN-APT-001: sale del snapshot congelado de la reserva, NUNCA de la política
 * actual (que pudo cambiar tras la aceptación). Sin snapshot, o sin ventana en
 * él, rige la del módulo.
 */
export function cancellationWindowMinutes(
  snapshot: { cancellationWindowMinutes?: number } | undefined,
): number {
  return (
    snapshot?.cancellationWindowMinutes ?? DEFAULT_CANCELLATION_WINDOW_MINUTES
  );
}

/**
 * ¿Ya estamos dentro de la ventana previa al turno?
 *
 * CAN-TIME-001: el plazo se mide sobre instantes absolutos (`start_at` es
 * timestamptz en UTC), por lo que es independiente de la zona horaria; la tz
 * congelada del snapshot queda solo como dato de auditoría. Sin cupo no hay
 * plazo que medir.
 */
export function isWithinCancellationWindow(
  slotStartAt: Date | null | undefined,
  nowMs: number,
  windowMinutes: number,
): boolean {
  return (
    slotStartAt != null &&
    nowMs >= slotStartAt.getTime() - windowMinutes * MS_PER_MINUTE
  );
}

/**
 * ¿La cancelación genera cargo?
 *
 * Se cobra si es inasistencia o si la cancelación cae dentro de la ventana
 * (tardía). Una cancelación avisada a tiempo no genera cargo.
 */
export function isChargeableCancellation(
  isNoShow: boolean,
  withinWindow: boolean,
): boolean {
  return isNoShow || withinWindow;
}

/**
 * TJ-2 · ¿Se le niega al titular cancelar fuera de plazo?
 *
 * El paciente titular no cancela dentro de la ventana salvo que sea una
 * inasistencia; quien atiende, sí, siempre.
 */
export function blocksHolderCancellation(
  isHolderPatient: boolean,
  withinWindow: boolean,
  isNoShow: boolean,
): boolean {
  return isHolderPatient && withinWindow && !isNoShow;
}
