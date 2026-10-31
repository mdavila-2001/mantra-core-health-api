/** Hechos de una asignación de rol de un doctor para saber si rige hoy. */
export interface RoleAssignmentValidityInput {
  /** ¿Está en estado activo? */
  readonly active: boolean;
  /** Inicio de vigencia (fecha). */
  readonly validFrom?: Date | string | null;
  /** Fin de vigencia (fecha, inclusive). */
  readonly validTo?: Date | string | null;
}

/** Día `YYYY-MM-DD` de una fecha o texto. */
function dayOf(value: Date | string): string {
  return typeof value === 'string'
    ? value.slice(0, 10)
    : value.toISOString().slice(0, 10);
}

/**
 * ¿La asignación de rol rige hoy? Un doctor dado de baja, vencido o que todavía
 * no empieza no es «doctor de la organización» para la política de apoyo: ni lo
 * alcanzan sus permisos «todos los doctores» ni se responde en su nombre.
 *
 * @param input - Estado y fechas de la asignación.
 * @param now - Instante de la decisión.
 * @returns `true` si rige.
 */
export function isRoleAssignmentCurrent(
  input: RoleAssignmentValidityInput,
  now: Date,
): boolean {
  if (!input.active) return false;
  const today = dayOf(now);
  if (input.validFrom && dayOf(input.validFrom) > today) return false;
  if (input.validTo && dayOf(input.validTo) < today) return false;
  return true;
}
