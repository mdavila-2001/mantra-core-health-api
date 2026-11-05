import { PRAC } from '../../practice.concepts';

/**
 * Catálogo operativo de F2 (CONTRATO-F2-F5 §F2.2): códigos de los tres ejes
 * manuales, la ocupación derivada, los tipos y motivos de bloqueo y las
 * órdenes de limpieza, con su concepto. Puro: sólo constantes y búsquedas.
 */

/** Eje disponibilidad (`care_spaces.operational_status_concept_id`). */
export const AVAILABILITY = {
  SPACE_OP_AVAILABLE: PRAC.SPACE_OP_AVAILABLE,
  SPACE_OP_BLOCKED_CLINICAL: PRAC.SPACE_OP_BLOCKED_CLINICAL,
  SPACE_OP_BLOCKED_ADMIN: PRAC.SPACE_OP_BLOCKED_ADMIN,
  SPACE_OP_MAINTENANCE: PRAC.SPACE_OP_MAINTENANCE,
  SPACE_OP_CLOSED: PRAC.SPACE_OP_CLOSED,
} as const;
export type AvailabilityCode = keyof typeof AVAILABILITY;

/** Eje higiene. */
export const HYGIENE = {
  HYG_CLEAN: PRAC.HYG_CLEAN,
  HYG_DIRTY: PRAC.HYG_DIRTY,
  HYG_CLEANING: PRAC.HYG_CLEANING,
  HYG_INSPECTED: PRAC.HYG_INSPECTED,
  HYG_CONTAMINATED: PRAC.HYG_CONTAMINATED,
} as const;
export type HygieneCode = keyof typeof HYGIENE;

/** Eje aislamiento. */
export const ISOLATION = {
  ISO_NONE: PRAC.ISO_NONE,
  ISO_CONTACT: PRAC.ISO_CONTACT,
  ISO_DROPLET: PRAC.ISO_DROPLET,
  ISO_AIRBORNE: PRAC.ISO_AIRBORNE,
  ISO_PROTECTIVE: PRAC.ISO_PROTECTIVE,
} as const;
export type IsolationCode = keyof typeof ISOLATION;

/** Ocupación (derivada de `clinical.encounter_locations`). */
export const OCCUPANCY = {
  OCC_FREE: PRAC.OCC_FREE,
  OCC_RESERVED: PRAC.OCC_RESERVED,
  OCC_OCCUPIED: PRAC.OCC_OCCUPIED,
} as const;
export type OccupancyCode = keyof typeof OCCUPANCY;

/** Tipos de bloqueo. */
export const BLOCK_KIND = {
  BLOCK_CLINICAL: PRAC.BLOCK_CLINICAL,
  BLOCK_ADMIN: PRAC.BLOCK_ADMIN,
  BLOCK_MAINTENANCE: PRAC.BLOCK_MAINTENANCE,
  BLOCK_CLOSURE: PRAC.BLOCK_CLOSURE,
} as const;
export type BlockKindCode = keyof typeof BLOCK_KIND;

/** Disponibilidad que produce un bloqueo vigente de cada tipo. */
export const AVAILABILITY_FOR_KIND: Record<BlockKindCode, AvailabilityCode> = {
  BLOCK_CLINICAL: 'SPACE_OP_BLOCKED_CLINICAL',
  BLOCK_ADMIN: 'SPACE_OP_BLOCKED_ADMIN',
  BLOCK_MAINTENANCE: 'SPACE_OP_MAINTENANCE',
  BLOCK_CLOSURE: 'SPACE_OP_CLOSED',
};

/** Precedencia cuando hay varios bloqueos vigentes (el más fuerte manda). */
export const KIND_PRECEDENCE: readonly BlockKindCode[] = [
  'BLOCK_CLOSURE',
  'BLOCK_MAINTENANCE',
  'BLOCK_ADMIN',
  'BLOCK_CLINICAL',
];

/**
 * Motivos de bloqueo y a qué tipos aplican (perfil del motivo, expuesto por
 * el catálogo). `BLOCK_RSN_OTHER` aplica a todos y exige texto.
 */
export const BLOCK_REASONS: Record<
  string,
  { id: string; kinds: readonly BlockKindCode[] }
> = {
  BLOCK_RSN_STAFF_SHORTAGE: {
    id: PRAC.BLOCK_RSN_STAFF_SHORTAGE,
    kinds: ['BLOCK_CLINICAL', 'BLOCK_ADMIN'],
  },
  BLOCK_RSN_ISOLATION_COHORT: {
    id: PRAC.BLOCK_RSN_ISOLATION_COHORT,
    kinds: ['BLOCK_CLINICAL'],
  },
  BLOCK_RSN_PATIENT_CONDITION: {
    id: PRAC.BLOCK_RSN_PATIENT_CONDITION,
    kinds: ['BLOCK_CLINICAL'],
  },
  BLOCK_RSN_EQUIPMENT_FAILURE: {
    id: PRAC.BLOCK_RSN_EQUIPMENT_FAILURE,
    kinds: ['BLOCK_CLINICAL', 'BLOCK_ADMIN', 'BLOCK_MAINTENANCE'],
  },
  BLOCK_RSN_PREVENTIVE_MAINTENANCE: {
    id: PRAC.BLOCK_RSN_PREVENTIVE_MAINTENANCE,
    kinds: ['BLOCK_MAINTENANCE'],
  },
  BLOCK_RSN_INFRASTRUCTURE: {
    id: PRAC.BLOCK_RSN_INFRASTRUCTURE,
    kinds: ['BLOCK_ADMIN', 'BLOCK_MAINTENANCE', 'BLOCK_CLOSURE'],
  },
  BLOCK_RSN_PEST_CONTROL: {
    id: PRAC.BLOCK_RSN_PEST_CONTROL,
    kinds: ['BLOCK_ADMIN', 'BLOCK_MAINTENANCE', 'BLOCK_CLOSURE'],
  },
  BLOCK_RSN_ADMIN_DECISION: {
    id: PRAC.BLOCK_RSN_ADMIN_DECISION,
    kinds: ['BLOCK_ADMIN', 'BLOCK_CLOSURE'],
  },
  BLOCK_RSN_OTHER: {
    id: PRAC.BLOCK_RSN_OTHER,
    kinds: [
      'BLOCK_CLINICAL',
      'BLOCK_ADMIN',
      'BLOCK_MAINTENANCE',
      'BLOCK_CLOSURE',
    ],
  },
};

/** Eje del evento A20. */
export const AXIS = {
  AVAILABILITY: PRAC.AXIS_AVAILABILITY,
  HYGIENE: PRAC.AXIS_HYGIENE,
  ISOLATION: PRAC.AXIS_ISOLATION,
  OCCUPANCY: PRAC.AXIS_OCCUPANCY,
} as const;
export type AxisCode = keyof typeof AXIS;

/** Fuente del evento A20. */
export const SOURCE = {
  MANUAL: PRAC.SRC_MANUAL,
  ADT: PRAC.SRC_ADT,
  CLEANING: PRAC.SRC_CLEANING,
  BLOCK: PRAC.SRC_BLOCK,
  ROOM_EVENT: PRAC.SRC_ROOM_EVENT,
  SYSTEM: PRAC.SRC_SYSTEM,
} as const;
export type SourceCode = keyof typeof SOURCE;

/** Tipos de orden de limpieza. */
export const CLEANING_TYPE = {
  CLEAN_ROUTINE: PRAC.CLEAN_ROUTINE,
  CLEAN_DISCHARGE: PRAC.CLEAN_DISCHARGE,
  CLEAN_TERMINAL: PRAC.CLEAN_TERMINAL,
  CLEAN_OR_TURNOVER: PRAC.CLEAN_OR_TURNOVER,
  CLEAN_SPOT: PRAC.CLEAN_SPOT,
} as const;
export type CleaningTypeCode = keyof typeof CLEANING_TYPE;

/** Disparadores de orden de limpieza. */
export const CLEANING_TRIGGER = {
  CLN_TRG_DISCHARGE: PRAC.CLN_TRG_DISCHARGE,
  CLN_TRG_TRANSFER: PRAC.CLN_TRG_TRANSFER,
  CLN_TRG_MANUAL: PRAC.CLN_TRG_MANUAL,
  CLN_TRG_ISOLATION_END: PRAC.CLN_TRG_ISOLATION_END,
  CLN_TRG_CONTAMINATION: PRAC.CLN_TRG_CONTAMINATION,
  CLN_TRG_MAINTENANCE_END: PRAC.CLN_TRG_MAINTENANCE_END,
  CLN_TRG_OR_TURNOVER: PRAC.CLN_TRG_OR_TURNOVER,
  CLN_TRG_INSPECTION_FAILED: PRAC.CLN_TRG_INSPECTION_FAILED,
} as const;
export type CleaningTriggerCode = keyof typeof CLEANING_TRIGGER;

/** Prioridades. */
export const CLEANING_PRIORITY = {
  CLN_PRIO_ROUTINE: PRAC.CLN_PRIO_ROUTINE,
  CLN_PRIO_URGENT: PRAC.CLN_PRIO_URGENT,
  CLN_PRIO_STAT: PRAC.CLN_PRIO_STAT,
} as const;
export type CleaningPriorityCode = keyof typeof CLEANING_PRIORITY;

/** Estados de la orden. */
export const CLEANING_STATUS = {
  CLN_PENDING: PRAC.CLN_PENDING,
  CLN_IN_PROGRESS: PRAC.CLN_IN_PROGRESS,
  CLN_DONE: PRAC.CLN_DONE,
  CLN_INSPECTED: PRAC.CLN_INSPECTED,
  CLN_REJECTED: PRAC.CLN_REJECTED,
  CLN_CANCELLED: PRAC.CLN_CANCELLED,
} as const;
export type CleaningStatusCode = keyof typeof CLEANING_STATUS;

/** Estados que cuentan como «orden abierta» (índice único del modelo). */
export const OPEN_CLEANING_STATUSES: readonly CleaningStatusCode[] = [
  'CLN_PENDING',
  'CLN_IN_PROGRESS',
  'CLN_DONE',
];

/** Disparador → tipo por defecto de la orden. */
export const DEFAULT_TYPE_FOR_TRIGGER: Record<
  CleaningTriggerCode,
  CleaningTypeCode
> = {
  CLN_TRG_DISCHARGE: 'CLEAN_DISCHARGE',
  CLN_TRG_TRANSFER: 'CLEAN_DISCHARGE',
  CLN_TRG_MANUAL: 'CLEAN_ROUTINE',
  CLN_TRG_ISOLATION_END: 'CLEAN_TERMINAL',
  CLN_TRG_CONTAMINATION: 'CLEAN_TERMINAL',
  CLN_TRG_MAINTENANCE_END: 'CLEAN_ROUTINE',
  CLN_TRG_OR_TURNOVER: 'CLEAN_OR_TURNOVER',
  CLN_TRG_INSPECTION_FAILED: 'CLEAN_ROUTINE',
};

/**
 * Código de un concepto dentro de una tabla `{CODIGO: uuid}`.
 *
 * @param table - Tabla de códigos.
 * @param id - Concepto.
 * @returns El código, o `undefined` si el concepto no es de la tabla.
 */
export function codeFor<T extends Record<string, string>>(
  table: T,
  id: string | null | undefined,
): keyof T | undefined {
  if (!id) return undefined;
  return (Object.keys(table) as (keyof T)[]).find((k) => table[k] === id);
}

/**
 * `true` si `code` es una clave de la tabla.
 *
 * @param table - Tabla de códigos.
 * @param code - Código recibido.
 */
export function isCodeOf<T extends Record<string, string>>(
  table: T,
  code: unknown,
): code is keyof T {
  return typeof code === 'string' && Object.hasOwn(table, code);
}

/** Display de un concepto de practice (lo resuelve quien llama). */
export type DisplayOf = (id: string) => string;

/**
 * Grupos del catálogo de operación (`GET /practice/infrastructure-catalog`,
 * §F2.3): ejes, motivos con sus tipos, limpieza y el mapa v2.
 *
 * @param displayOf - Texto de cada concepto.
 */
export function opsCatalogGroups(displayOf: DisplayOf) {
  const list = (table: Record<string, string>) =>
    Object.entries(table).map(([code, id]) => ({
      code,
      display: displayOf(id),
    }));
  return {
    availability: list(AVAILABILITY),
    hygiene: list(HYGIENE),
    isolation: list(ISOLATION),
    occupancy: list(OCCUPANCY),
    blockReasons: Object.entries(BLOCK_REASONS).map(([code, r]) => ({
      code,
      display: displayOf(r.id),
      kinds: [...r.kinds],
    })),
    cleaningTypes: list(CLEANING_TYPE),
    cleaningPriorities: list(CLEANING_PRIORITY),
    v2Map: [
      {
        order: 1,
        condition: 'availability != SPACE_OP_AVAILABLE or lifecycle != ACTIVE',
        v2Code: 'C',
      },
      { order: 2, condition: 'hygiene = HYG_CONTAMINATED', v2Code: 'K' },
      { order: 3, condition: 'isolation != ISO_NONE', v2Code: 'I' },
      { order: 4, condition: 'occupancy = OCC_OCCUPIED', v2Code: 'O' },
      { order: 5, condition: 'occupancy = OCC_RESERVED', v2Code: 'R' },
      {
        order: 6,
        condition:
          'hygiene in (HYG_DIRTY, HYG_CLEANING), or HYG_CLEAN with infra.inspection_required, or terminal_cleaning_required',
        v2Code: 'H',
      },
      { order: 7, condition: 'otherwise', v2Code: 'U' },
    ],
  };
}
