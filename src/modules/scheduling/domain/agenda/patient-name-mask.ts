/** Máscara que la política dejó para el nombre del paciente en un bloque de la agenda. */
export type PatientNameMask = 'PARTIAL' | 'REDACT' | 'HASH' | 'NULLIFY';

/**
 * Presentación del nombre del paciente de un bloque de la agenda según la máscara
 * que decidió la política (`visibleFields`): `PARTIAL` deja «Carmen O.» (primer
 * nombre e inicial del primer apellido), `REDACT` deja «Paciente», y `HASH` y
 * `NULLIFY` no dejan nombre (la agenda no muestra huellas). Función pura: la
 * decisión de QUÉ máscara aplica es de `delegated_access`; cómo se ve en la agenda
 * es de `scheduling`.
 *
 * @param name - Nombre completo original (nunca llega a la respuesta si se enmascara).
 * @param mask - Máscara decidida.
 * @returns El texto a mostrar, o `null` si el nombre no se muestra.
 */
export function maskPatientName(
  name: string,
  mask: PatientNameMask,
): string | null {
  switch (mask) {
    case 'PARTIAL': {
      const [first, second] = name.trim().split(/\s+/);
      if (!first) return null;
      return second ? `${first} ${second[0].toUpperCase()}.` : first;
    }
    case 'REDACT':
      return 'Paciente';
    default:
      return null;
  }
}
