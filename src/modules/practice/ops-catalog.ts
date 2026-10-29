import {
  ConceptFamily,
  FORMS,
  type ConceptEntry,
} from './infrastructure-catalog';
import type {
  AvailabilityCode,
  HygieneCode,
  IsolationCode,
  OccupancyCode,
} from './domain/bed-status-v2';

/**
 * Familias de conceptos de la operación de espacios (CONTRATO-F2-F5 §F2.2):
 * ejes de estado, bloqueos, órdenes de limpieza y orígenes del evento A20.
 *
 * Igual que `infrastructure-catalog.ts`, la API **acepta** el código completo o el
 * corto (`CLN_TRG_DISCHARGE` o `DISCHARGE`) y **emite** siempre el completo.
 */

/** Disponibilidad (`care_spaces.operational_status_concept_id`). */
export const AVAILABILITY = new ConceptFamily('SPACE_OP_', [
  'SPACE_OP_AVAILABLE',
  'SPACE_OP_BLOCKED_CLINICAL',
  'SPACE_OP_BLOCKED_ADMIN',
  'SPACE_OP_MAINTENANCE',
  'SPACE_OP_CLOSED',
]);

/** Higiene. */
export const HYGIENE = new ConceptFamily('HYG_', [
  'HYG_CLEAN',
  'HYG_DIRTY',
  'HYG_CLEANING',
  'HYG_INSPECTED',
  'HYG_CONTAMINATED',
]);

/** Aislamiento. */
export const ISOLATION = new ConceptFamily('ISO_', [
  'ISO_NONE',
  'ISO_CONTACT',
  'ISO_DROPLET',
  'ISO_AIRBORNE',
  'ISO_PROTECTIVE',
]);

/** Ocupación (derivada, sólo lectura). */
export const OCCUPANCY = new ConceptFamily('OCC_', [
  'OCC_FREE',
  'OCC_RESERVED',
  'OCC_OCCUPIED',
]);

/** Ejes del evento de estado. */
export const AXES = new ConceptFamily('AXIS_', [
  'AXIS_AVAILABILITY',
  'AXIS_HYGIENE',
  'AXIS_ISOLATION',
  'AXIS_OCCUPANCY',
]);

/** Origen del cambio de estado. */
export const STATUS_SOURCES = new ConceptFamily('SRC_', [
  'SRC_MANUAL',
  'SRC_ADT',
  'SRC_CLEANING',
  'SRC_BLOCK',
  'SRC_ROOM_EVENT',
  'SRC_SYSTEM',
]);

/** Tipo de bloqueo. */
export const BLOCK_KINDS = new ConceptFamily('BLOCK_', [
  'BLOCK_CLINICAL',
  'BLOCK_ADMIN',
  'BLOCK_MAINTENANCE',
  'BLOCK_CLOSURE',
]);

/** Motivos de bloqueo. */
export const BLOCK_REASONS = new ConceptFamily('BLOCK_RSN_', [
  'BLOCK_RSN_STAFF_SHORTAGE',
  'BLOCK_RSN_ISOLATION_COHORT',
  'BLOCK_RSN_PATIENT_CONDITION',
  'BLOCK_RSN_EQUIPMENT_FAILURE',
  'BLOCK_RSN_PREVENTIVE_MAINTENANCE',
  'BLOCK_RSN_INFRASTRUCTURE',
  'BLOCK_RSN_PEST_CONTROL',
  'BLOCK_RSN_ADMIN_DECISION',
  'BLOCK_RSN_OTHER',
]);

/** Tipo de bloqueo, por clave corta. */
export type BlockKindCode =
  'BLOCK_CLINICAL' | 'BLOCK_ADMIN' | 'BLOCK_MAINTENANCE' | 'BLOCK_CLOSURE';

/**
 * A qué tipos de bloqueo aplica cada motivo (perfil en TS; el catálogo lo expone).
 * Lectura de `procesos/04` §Flujo B: lo clínico lo pone enfermería, lo
 * administrativo la administración y el mantenimiento exige ese tipo.
 * `BLOCK_RSN_OTHER` sirve a todos y exige texto.
 */
export const BLOCK_REASON_KINDS: Readonly<
  Record<string, readonly BlockKindCode[]>
> = {
  BLOCK_RSN_STAFF_SHORTAGE: ['BLOCK_CLINICAL', 'BLOCK_ADMIN'],
  BLOCK_RSN_ISOLATION_COHORT: ['BLOCK_CLINICAL'],
  BLOCK_RSN_PATIENT_CONDITION: ['BLOCK_CLINICAL'],
  BLOCK_RSN_EQUIPMENT_FAILURE: ['BLOCK_CLINICAL', 'BLOCK_MAINTENANCE'],
  BLOCK_RSN_PREVENTIVE_MAINTENANCE: ['BLOCK_MAINTENANCE'],
  BLOCK_RSN_INFRASTRUCTURE: [
    'BLOCK_ADMIN',
    'BLOCK_MAINTENANCE',
    'BLOCK_CLOSURE',
  ],
  BLOCK_RSN_PEST_CONTROL: ['BLOCK_ADMIN', 'BLOCK_MAINTENANCE', 'BLOCK_CLOSURE'],
  BLOCK_RSN_ADMIN_DECISION: ['BLOCK_ADMIN', 'BLOCK_CLOSURE'],
  BLOCK_RSN_OTHER: [
    'BLOCK_CLINICAL',
    'BLOCK_ADMIN',
    'BLOCK_MAINTENANCE',
    'BLOCK_CLOSURE',
  ],
};

/** Disponibilidad a la que lleva cada tipo de bloqueo. */
export const KIND_TO_AVAILABILITY: Readonly<
  Record<BlockKindCode, AvailabilityCode>
> = {
  BLOCK_CLINICAL: 'SPACE_OP_BLOCKED_CLINICAL',
  BLOCK_ADMIN: 'SPACE_OP_BLOCKED_ADMIN',
  BLOCK_MAINTENANCE: 'SPACE_OP_MAINTENANCE',
  BLOCK_CLOSURE: 'SPACE_OP_CLOSED',
};

/** Tipo de limpieza. */
export const CLEANING_TYPES = new ConceptFamily('CLEAN_', [
  'CLEAN_ROUTINE',
  'CLEAN_DISCHARGE',
  'CLEAN_TERMINAL',
  'CLEAN_OR_TURNOVER',
  'CLEAN_SPOT',
]);

/** Disparador de la orden de limpieza. */
export const CLEANING_TRIGGERS = new ConceptFamily('CLN_TRG_', [
  'CLN_TRG_DISCHARGE',
  'CLN_TRG_TRANSFER',
  'CLN_TRG_MANUAL',
  'CLN_TRG_ISOLATION_END',
  'CLN_TRG_CONTAMINATION',
  'CLN_TRG_MAINTENANCE_END',
  'CLN_TRG_OR_TURNOVER',
  'CLN_TRG_INSPECTION_FAILED',
]);

/** Prioridad de la orden de limpieza. */
export const CLEANING_PRIORITIES = new ConceptFamily('CLN_PRIO_', [
  'CLN_PRIO_ROUTINE',
  'CLN_PRIO_URGENT',
  'CLN_PRIO_STAT',
]);

/** Orden de atención en la cola: lo inmediato primero. */
export const PRIORITY_RANK: Readonly<Record<string, number>> = {
  CLN_PRIO_STAT: 0,
  CLN_PRIO_URGENT: 1,
  CLN_PRIO_ROUTINE: 2,
};

/** Estado de la orden de limpieza. */
export const CLEANING_STATUSES = new ConceptFamily('CLN_', [
  'CLN_PENDING',
  'CLN_IN_PROGRESS',
  'CLN_DONE',
  'CLN_INSPECTED',
  'CLN_REJECTED',
  'CLN_CANCELLED',
]);

/** Resultado de la inspección. */
export const INSPECTION_RESULTS = new ConceptFamily('CLN_INSPECT_', [
  'CLN_INSPECT_PASS',
  'CLN_INSPECT_FAIL',
]);

/** Estados en los que una orden cuenta como abierta (`ux_cleaning_orders_one_open_per_space`). */
export const OPEN_CLEANING_STATUS_CODES = [
  'CLN_PENDING',
  'CLN_IN_PROGRESS',
  'CLN_DONE',
] as const;

/**
 * Transiciones válidas de la orden de limpieza: acción → de qué estados parte y a
 * cuál llega. `inspect` llega a `CLN_INSPECTED` (PASS) o `CLN_REJECTED` (FAIL).
 */
export const CLEANING_TRANSITIONS = {
  start: { from: ['CLN_PENDING'], to: 'CLN_IN_PROGRESS' },
  finish: { from: ['CLN_IN_PROGRESS'], to: 'CLN_DONE' },
  inspectPass: { from: ['CLN_DONE'], to: 'CLN_INSPECTED' },
  inspectFail: { from: ['CLN_DONE'], to: 'CLN_REJECTED' },
  cancel: { from: ['CLN_PENDING', 'CLN_IN_PROGRESS'], to: 'CLN_CANCELLED' },
} as const;

/** Acción de transición de la orden de limpieza. */
export type CleaningTransitionAction = keyof typeof CLEANING_TRANSITIONS;

/** Id de un concepto de una familia por su código completo (lanza si no existe). */
export function conceptIdOf(family: ConceptFamily, code: string): string {
  const entry = family.byInput(code);
  if (!entry) throw new Error(`Concepto desconocido: ${code}`);
  return entry.id;
}

/** Código completo de un concepto de una familia por su id; `fallback` si es nulo. */
export function codeOf<T extends string>(
  family: ConceptFamily,
  id: string | null | undefined,
  fallback: T,
): T {
  return (family.byConceptId(id)?.code as T | undefined) ?? fallback;
}

/** Lectura tipada de los cuatro ejes a partir de los ids de la fila. */
export interface AxisIds {
  readonly operationalStatusConceptId?: string | null;
  readonly hygieneStatusConceptId?: string | null;
  readonly isolationConceptId?: string | null;
}

/** Los ejes manuales de una fila; un eje sin escribir vale su valor por omisión. */
export function axisCodes(ids: AxisIds): {
  availability: AvailabilityCode;
  hygiene: HygieneCode;
  isolation: IsolationCode;
} {
  return {
    availability: codeOf(
      AVAILABILITY,
      ids.operationalStatusConceptId,
      'SPACE_OP_AVAILABLE',
    ),
    hygiene: codeOf(HYGIENE, ids.hygieneStatusConceptId, 'HYG_CLEAN'),
    isolation: codeOf(ISOLATION, ids.isolationConceptId, 'ISO_NONE'),
  };
}

/** Código de ocupación por su id; libre si no hay. */
export function occupancyCode(id: string | null | undefined): OccupancyCode {
  return codeOf(OCCUPANCY, id, 'OCC_FREE');
}

/**
 * Formas que son contenedores de la estructura (sede, edificio, ala, piso, sala,
 * pasillo, virtual): no tienen estado operativo propio. Un espacio sin forma
 * (alta anterior a F1) sí lo tiene.
 */
const STRUCTURAL_FORMS: readonly string[] = [
  'LOC_FORM_SITE',
  'LOC_FORM_BUILDING',
  'LOC_FORM_WING',
  'LOC_FORM_LEVEL',
  'LOC_FORM_WARD',
  'LOC_FORM_CORRIDOR',
  'LOC_FORM_VIRTUAL',
];

/** ¿Tiene estado operativo este espacio? (`procesos/04`, precondición 2). */
export function hasOperationalState(
  formConceptId: string | null | undefined,
): boolean {
  const form: ConceptEntry | undefined = FORMS.byConceptId(formConceptId);
  return !form || !STRUCTURAL_FORMS.includes(form.code);
}
