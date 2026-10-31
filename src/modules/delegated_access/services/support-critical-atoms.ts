import { PERMISSION_ATOM_BY_CODE, atomsOfAction } from '../domain';

/**
 * Átomos de sensibilidad CRÍTICA que da una lista de acciones (átomos o alias
 * heredados). Otorgarlos nunca se hace con una sola persona (`GRANT_CHANGE`).
 *
 * @param actions - Átomos o alias.
 * @returns Los átomos críticos, únicos y ordenados.
 */
export function criticalAtomsOf(actions: readonly string[]): string[] {
  return [
    ...new Set(
      actions
        .flatMap((a) => atomsOfAction(a).map((x) => x.atom))
        .filter(
          (atom) =>
            PERMISSION_ATOM_BY_CODE.get(atom)?.sensitivity === 'CRITICAL',
        ),
    ),
  ].sort();
}
