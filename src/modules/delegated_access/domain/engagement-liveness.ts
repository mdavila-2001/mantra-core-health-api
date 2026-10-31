/** Días de gracia tras la fecha de recertificación antes de cortar el acceso. */
export const RECERTIFICATION_GRACE_DAYS = 15;

const DAY_MS = 24 * 3600 * 1000;

/** Hechos que deciden si un vínculo de apoyo rige en este momento. */
export interface EngagementLivenessInput {
  /** Estado del vínculo: ¿activo? */
  readonly assignmentActive: boolean;
  /** Inicio de vigencia del vínculo. */
  readonly validFrom?: Date;
  /** Fin de vigencia del vínculo. */
  readonly validTo?: Date;
  /** ¿La membresía que lo ancla está activa? */
  readonly membershipActive: boolean;
  /** Fin de la membresía, si lo tiene. */
  readonly membershipEndDate?: Date;
  /** Fecha en que toca recertificar. */
  readonly nextRecertificationAt?: Date;
}

/**
 * ¿El vínculo rige ahora? Exige vínculo activo y vigente, membresía activa y no
 * terminada, y recertificación al día (con la gracia). La política decide con
 * esto y no espera al barrido del worker: un vínculo cuya recertificación venció
 * deja de valer en el momento, aunque nadie lo haya suspendido todavía.
 *
 * @param input - Hechos del vínculo y de su membresía.
 * @param now - Instante de la decisión.
 * @returns `true` si el vínculo rige.
 */
export function isEngagementLive(
  input: EngagementLivenessInput,
  now: Date,
): boolean {
  if (!input.assignmentActive || !input.membershipActive) return false;
  if (input.validFrom && input.validFrom.getTime() > now.getTime())
    return false;
  if (input.validTo && input.validTo.getTime() <= now.getTime()) return false;
  if (
    input.membershipEndDate &&
    input.membershipEndDate.getTime() <= now.getTime()
  ) {
    return false;
  }
  if (input.nextRecertificationAt) {
    const cutoff =
      input.nextRecertificationAt.getTime() +
      RECERTIFICATION_GRACE_DAYS * DAY_MS;
    if (cutoff < now.getTime()) return false;
  }
  return true;
}
