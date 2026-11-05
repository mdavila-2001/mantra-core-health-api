import type { LifecycleState } from '../structure/lifecycle';
import type {
  AvailabilityCode,
  HygieneCode,
  IsolationCode,
  OccupancyCode,
} from './ops-catalog';

/** HL7 v2 tabla 0116 (+ `R` local, `urn:mantra:bed-status`). */
export type V2BedStatus = 'C' | 'H' | 'I' | 'K' | 'O' | 'U' | 'R';

/** Los ejes de un espacio que deciden su estado resumido. */
export interface OperationalAxes {
  readonly lifecycle: LifecycleState;
  /** `valid_from <= now < valid_to` (NULL = abierto). */
  readonly inValidity: boolean;
  readonly availability: AvailabilityCode;
  readonly hygiene: HygieneCode;
  readonly isolation: IsolationCode;
  readonly occupancy: OccupancyCode;
  readonly terminalCleaningRequired: boolean;
}

/** Configuración del establecimiento que cambia el resumen. */
export interface OpsSettings {
  /** `infra.inspection_required`: una cama `HYG_CLEAN` no es asignable sin inspección. */
  readonly inspectionRequired: boolean;
}

/**
 * Estado resumido v2-0116 / FHIR `Location.operationalStatus` (CONTRATO-F2-F5
 * §F2.2): **la primera regla que aplica** de las siete.
 *
 * @param axes - Ejes del espacio.
 * @param settings - Configuración del establecimiento.
 */
export function v2CodeOf(
  axes: OperationalAxes,
  settings: OpsSettings,
): V2BedStatus {
  if (axes.availability !== 'SPACE_OP_AVAILABLE' || axes.lifecycle !== 'ACTIVE')
    return 'C';
  if (axes.hygiene === 'HYG_CONTAMINATED') return 'K';
  if (axes.isolation !== 'ISO_NONE') return 'I';
  if (axes.occupancy === 'OCC_OCCUPIED') return 'O';
  if (axes.occupancy === 'OCC_RESERVED') return 'R';
  if (
    axes.hygiene === 'HYG_DIRTY' ||
    axes.hygiene === 'HYG_CLEANING' ||
    (axes.hygiene === 'HYG_CLEAN' && settings.inspectionRequired) ||
    axes.terminalCleaningRequired
  )
    return 'H';
  return 'U';
}

/** Por qué un espacio no es asignable (vacío = asignable). */
export type NotAssignableReason =
  'LIFECYCLE' | 'AVAILABILITY' | 'OCCUPANCY' | 'HYGIENE';

/**
 * Asignable (lo consume F3): ciclo ACTIVE ∧ vigente ∧ disponibilidad
 * AVAILABLE ∧ ocupación FREE ∧ higiene INSPECTED (o CLEAN si no se exige
 * inspección) ∧ sin limpieza terminal pendiente.
 *
 * @param axes - Ejes del espacio.
 * @param settings - Configuración del establecimiento.
 * @returns Las reglas que fallan; `[]` si es asignable.
 */
export function assignabilityViolations(
  axes: OperationalAxes,
  settings: OpsSettings,
): NotAssignableReason[] {
  const out: NotAssignableReason[] = [];
  if (axes.lifecycle !== 'ACTIVE' || !axes.inValidity) out.push('LIFECYCLE');
  if (axes.availability !== 'SPACE_OP_AVAILABLE') out.push('AVAILABILITY');
  if (axes.occupancy !== 'OCC_FREE') out.push('OCCUPANCY');
  const cleanEnough =
    axes.hygiene === 'HYG_INSPECTED' ||
    (axes.hygiene === 'HYG_CLEAN' && !settings.inspectionRequired);
  if (!cleanEnough || axes.terminalCleaningRequired) out.push('HYGIENE');
  return out;
}

/**
 * `true` si el espacio es asignable.
 *
 * @param axes - Ejes del espacio.
 * @param settings - Configuración del establecimiento.
 */
export function isAssignable(
  axes: OperationalAxes,
  settings: OpsSettings,
): boolean {
  return assignabilityViolations(axes, settings).length === 0;
}
