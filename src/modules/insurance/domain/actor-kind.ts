/**
 * Roles del personal que opera el cobro y las disputas como prestador.
 *
 * Quien tiene alguno de estos roles actúa como prestador aunque además tenga el
 * rol de paciente (una administradora que también se atiende en la clínica).
 */
const PROVIDER_SIDE_ROLES: ReadonlySet<string> = new Set([
  'BILLING',
  'FINANCE',
  'BILLING_OPERATOR',
  'SECURITY_ADMIN',
  'SUPERADMIN',
]);

/**
 * Si el actor entra por la ruta compartida de disputas **como paciente**.
 *
 * La ruta `POST /insurance-claims/:id/disputes` la usan dos actores distintos:
 * el prestador (apelación) y el paciente (objeción al cobro, carril 16,
 * REQ-16-032). El despacho es por **quién es el actor**, nunca por lo que diga
 * el cuerpo (`initiatedBy`): un cliente no puede elegir en qué rama entra.
 *
 * Es paciente sólo si tiene el rol `PATIENT` y ninguno de prestador/plataforma.
 * Ante la duda gana el prestador, que además pasa por el alcance de su
 * organización.
 *
 * @param roles - Roles del token.
 * @returns `true` si debe tratarse como paciente.
 */
export function isPatientOnlyActor(
  roles: readonly string[] | undefined,
): boolean {
  const held = roles ?? [];
  return (
    held.includes('PATIENT') &&
    !held.some((role) => PROVIDER_SIDE_ROLES.has(role))
  );
}
