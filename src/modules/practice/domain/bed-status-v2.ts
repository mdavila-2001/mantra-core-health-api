/**
 * Mapeo de los ejes operativos de un espacio a HL7 v2-0116 / FHIR
 * `Location.operationalStatus` (CONTRATO-F2-F5 §F2.2) y la regla de «asignable».
 *
 * Es una función **pura**: no lee la base ni el reloj. Recibe los ejes ya
 * resueltos a códigos y devuelve la proyección; la fuente de verdad son los ejes
 * (`procesos/04`: «el estado v2 es una proyección»).
 */

/** Códigos de la tabla HL7 v2-0116 más la extensión local `R` (`urn:mantra:bed-status`). */
export type V2BedStatus = 'C' | 'H' | 'I' | 'K' | 'O' | 'U' | 'R';

/** Códigos que admite la restricción `v2_0116_code` de los eventos A20. */
export const V2_BED_STATUS_CODES: readonly V2BedStatus[] = [
  'C',
  'H',
  'I',
  'K',
  'O',
  'U',
  'R',
];

/** Sistema de códigos de la extensión local. */
export const V2_LOCAL_CODE_SYSTEM = 'urn:mantra:bed-status';

/** Disponibilidad, por código de concepto. */
export type AvailabilityCode =
  | 'SPACE_OP_AVAILABLE'
  | 'SPACE_OP_BLOCKED_CLINICAL'
  | 'SPACE_OP_BLOCKED_ADMIN'
  | 'SPACE_OP_MAINTENANCE'
  | 'SPACE_OP_CLOSED';

/** Higiene, por código de concepto. */
export type HygieneCode =
  | 'HYG_CLEAN'
  | 'HYG_DIRTY'
  | 'HYG_CLEANING'
  | 'HYG_INSPECTED'
  | 'HYG_CONTAMINATED';

/** Aislamiento, por código de concepto. */
export type IsolationCode =
  | 'ISO_NONE'
  | 'ISO_CONTACT'
  | 'ISO_DROPLET'
  | 'ISO_AIRBORNE'
  | 'ISO_PROTECTIVE';

/** Ocupación (derivada), por código de concepto. */
export type OccupancyCode = 'OCC_FREE' | 'OCC_RESERVED' | 'OCC_OCCUPIED';

/** Los ejes que alimentan el mapeo. */
export interface OperationalAxes {
  /** ¿El ciclo de vida del espacio es `SPACE_ACTIVE` y está vigente? */
  readonly lifecycleActive: boolean;
  /** Disponibilidad. */
  readonly availability: AvailabilityCode;
  /** Higiene. */
  readonly hygiene: HygieneCode;
  /** Aislamiento. */
  readonly isolation: IsolationCode;
  /** Ocupación derivada. */
  readonly occupancy: OccupancyCode;
  /** Limpieza terminal pendiente (tras contaminación o aislamiento). */
  readonly terminalCleaningRequired: boolean;
}

/** Configuración que cambia el resultado (`practice_settings`, claves `infra.*`). */
export interface BedStatusOptions {
  /** `infra.inspection_required`: una cama limpia sin inspeccionar no es asignable. */
  readonly inspectionRequired: boolean;
}

/**
 * Resumen v2-0116 del espacio. Gana la primera regla que aplica:
 *
 * 1. no disponible (bloqueada, mantenimiento, cerrada) o ciclo de vida ≠ ACTIVE → `C`;
 * 2. higiene contaminada → `K`;
 * 3. aislamiento ≠ ninguno → `I`;
 * 4. ocupada → `O`;
 * 5. reservada → `R` (extensión local);
 * 6. higiene sucia o en limpieza, o limpia con inspección obligatoria, o limpieza
 *    terminal pendiente → `H`;
 * 7. el resto → `U`.
 *
 * @param axes - Ejes resueltos.
 * @param options - Configuración del establecimiento.
 * @returns El código v2-0116.
 */
export function bedStatusV2(
  axes: OperationalAxes,
  options: BedStatusOptions,
): V2BedStatus {
  if (!axes.lifecycleActive || axes.availability !== 'SPACE_OP_AVAILABLE')
    return 'C';
  if (axes.hygiene === 'HYG_CONTAMINATED') return 'K';
  if (axes.isolation !== 'ISO_NONE') return 'I';
  if (axes.occupancy === 'OCC_OCCUPIED') return 'O';
  if (axes.occupancy === 'OCC_RESERVED') return 'R';
  if (
    axes.hygiene === 'HYG_DIRTY' ||
    axes.hygiene === 'HYG_CLEANING' ||
    (axes.hygiene === 'HYG_CLEAN' && options.inspectionRequired) ||
    axes.terminalCleaningRequired
  )
    return 'H';
  return 'U';
}

/**
 * ¿Se puede asignar un paciente a esta cama? (lo consume F3).
 *
 * Ciclo ACTIVE y vigente ∧ disponibilidad `AVAILABLE` ∧ ocupación libre ∧ higiene
 * inspeccionada (o limpia si la inspección no es obligatoria) ∧ sin limpieza
 * terminal pendiente. El aislamiento **no** la impide: la compatibilidad
 * (cohorte, aéreo sólo en AIIR) es una regla de F3.
 *
 * @param axes - Ejes resueltos.
 * @param options - Configuración del establecimiento.
 * @returns `true` si es asignable.
 */
export function isAssignable(
  axes: OperationalAxes,
  options: BedStatusOptions,
): boolean {
  if (!axes.lifecycleActive) return false;
  if (axes.availability !== 'SPACE_OP_AVAILABLE') return false;
  if (axes.occupancy !== 'OCC_FREE') return false;
  if (axes.terminalCleaningRequired) return false;
  return (
    axes.hygiene === 'HYG_INSPECTED' ||
    (axes.hygiene === 'HYG_CLEAN' && !options.inspectionRequired)
  );
}

/** Texto para personas de cada código v2 (el catálogo lo expone en `v2Map`). */
export const V2_BED_STATUS_LABELS: Readonly<Record<V2BedStatus, string>> = {
  C: 'Cerrada o no disponible',
  H: 'Pendiente de limpieza',
  I: 'Aislada',
  K: 'Contaminada',
  O: 'Ocupada',
  U: 'Libre y lista',
  R: 'Reservada',
};

/** Regla del contrato que produce cada código, para el catálogo (`v2Map`). */
export const V2_BED_STATUS_RULES: readonly {
  /** Posición de la regla en la tabla del contrato. */
  readonly rule: number;
  /** Código resultante. */
  readonly code: V2BedStatus;
  /** Condición, en palabras. */
  readonly when: string;
}[] = [
  {
    rule: 1,
    code: 'C',
    when: 'disponibilidad distinta de disponible, o ciclo de vida distinto de activo',
  },
  { rule: 2, code: 'K', when: 'higiene contaminada' },
  { rule: 3, code: 'I', when: 'aislamiento distinto de ninguno' },
  { rule: 4, code: 'O', when: 'ocupada' },
  { rule: 5, code: 'R', when: 'reservada (extensión local)' },
  {
    rule: 6,
    code: 'H',
    when: 'sucia o en limpieza, limpia sin inspeccionar (si es obligatoria) o limpieza terminal pendiente',
  },
  { rule: 7, code: 'U', when: 'el resto' },
];
