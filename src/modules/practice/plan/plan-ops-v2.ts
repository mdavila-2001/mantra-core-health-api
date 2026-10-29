/**
 * Resumen v2-0116 y «asignable» de un espacio, según la tabla de CONTRATO-F2-F5
 * §F2.2 (primera regla que aplica).
 *
 * **Provisorio por diseño.** El contrato manda que el plano reutilice
 * `practice/domain/bed-status-v2.ts` de F2 y no reimplemente la regla. Mientras
 * esa función no esté en la rama, el adaptador por defecto del estado
 * operativo usa esta copia; al llegar F2 se reemplaza el adaptador entero por
 * el que lee el tablero (`PLAN_OPERATIONAL_STATE`) y este archivo se borra.
 */

/** Ejes ya resueltos a códigos de concepto. */
export interface OpsAxes {
  readonly lifecycleCode: string;
  readonly availabilityCode: string;
  readonly hygieneCode: string;
  readonly isolationCode: string;
  readonly occupancyCode: 'OCC_FREE' | 'OCC_RESERVED' | 'OCC_OCCUPIED';
  readonly terminalCleaningRequired: boolean;
  /** `infra.inspection_required` de la práctica (sin valor configurado: `false`). */
  readonly inspectionRequired: boolean;
}

/** Código v2-0116 resultante. */
export type V2Code = 'C' | 'H' | 'I' | 'K' | 'O' | 'U' | 'R';

/**
 * Resumen v2-0116 (primera regla que aplica).
 *
 * @param axes - Ejes del espacio.
 * @returns El código.
 */
export function deriveV2Code(axes: OpsAxes): V2Code {
  if (
    axes.availabilityCode !== 'SPACE_OP_AVAILABLE' ||
    axes.lifecycleCode !== 'SPACE_ACTIVE'
  )
    return 'C';
  if (axes.hygieneCode === 'HYG_CONTAMINATED') return 'K';
  if (axes.isolationCode !== 'ISO_NONE') return 'I';
  if (axes.occupancyCode === 'OCC_OCCUPIED') return 'O';
  if (axes.occupancyCode === 'OCC_RESERVED') return 'R';
  if (
    axes.hygieneCode === 'HYG_DIRTY' ||
    axes.hygieneCode === 'HYG_CLEANING' ||
    (axes.hygieneCode === 'HYG_CLEAN' && axes.inspectionRequired) ||
    axes.terminalCleaningRequired
  )
    return 'H';
  return 'U';
}

/**
 * ¿Se puede asignar? Activa ∧ disponible ∧ libre ∧ higiene inspeccionada (o
 * limpia si no se exige inspección) ∧ sin limpieza terminal pendiente.
 *
 * @param axes - Ejes del espacio.
 * @returns `true` si es asignable.
 */
export function deriveAssignable(axes: OpsAxes): boolean {
  if (axes.lifecycleCode !== 'SPACE_ACTIVE') return false;
  if (axes.availabilityCode !== 'SPACE_OP_AVAILABLE') return false;
  if (axes.occupancyCode !== 'OCC_FREE') return false;
  if (axes.terminalCleaningRequired) return false;
  if (axes.hygieneCode === 'HYG_INSPECTED') return true;
  return axes.hygieneCode === 'HYG_CLEAN' && !axes.inspectionRequired;
}
