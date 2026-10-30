import { PRAC, PRACTICE_CONCEPT_SEEDS } from '../../practice.concepts';

/**
 * Catálogo de la infraestructura física (F1, contrato §2): formas, funciones,
 * perfiles de función, reglas padre→hijo, reglas de tipología y derivación de
 * capacidad.
 *
 * Todo esto son **datos**, no `if`: el código de las reglas
 * (`structure-rules.ts`) recorre estas tablas y no sabe que existe un
 * quirófano. Cambiar qué admite un Puesto de Salud es cambiar una fila acá (y
 * en la base, donde la siembra `PracticeInfrastructureSeedService`), no una
 * condición en un servicio.
 *
 * Archivo puro: sin Nest, sin MikroORM, sin entidades.
 */

/** Código de forma (`LOC_FORM_*`), el mismo que el concepto. */
export type FormCode =
  | 'LOC_FORM_SITE'
  | 'LOC_FORM_BUILDING'
  | 'LOC_FORM_WING'
  | 'LOC_FORM_LEVEL'
  | 'LOC_FORM_WARD'
  | 'LOC_FORM_AREA'
  | 'LOC_FORM_CORRIDOR'
  | 'LOC_FORM_ROOM'
  | 'LOC_FORM_BED'
  | 'LOC_FORM_VIRTUAL';

/** Forma → código FHIR R5 `Location.form` (`location-form`). */
export const FORM_FHIR_CODE: Readonly<Record<FormCode, string>> = {
  LOC_FORM_SITE: 'si',
  LOC_FORM_BUILDING: 'bu',
  LOC_FORM_WING: 'wi',
  LOC_FORM_LEVEL: 'lvl',
  LOC_FORM_WARD: 'wa',
  LOC_FORM_AREA: 'area',
  LOC_FORM_CORRIDOR: 'co',
  LOC_FORM_ROOM: 'ro',
  LOC_FORM_BED: 'bd',
  LOC_FORM_VIRTUAL: 'vi',
};

/** Las formas en el orden en que las lista el catálogo. */
export const FORM_CODES = Object.keys(FORM_FHIR_CODE) as FormCode[];

/** Banderas de comportamiento de una función (PLAN §2.1). */
export interface FunctionFlags {
  /** Se puede reservar en agenda (consultorio, quirófano, sala de imagen…). */
  readonly schedulable: boolean;
  /** Aloja pacientes internados (cuenta para ocupación). */
  readonly inpatient: boolean;
  /** Genera cargos por uso. */
  readonly billable: boolean;
  /** Admite más de un paciente o reserva a la vez. */
  readonly allowOverlap: boolean;
  /** Apto para aislamiento (AIIR / ambiente protegido). */
  readonly isolationCapable: boolean;
  /** Punto de stock (depósito, botiquín, farmacia). */
  readonly stockPoint: boolean;
  /** Aloja equipos (modalidades, monitores). */
  readonly hostsEquipment: boolean;
  /** Exige limpieza terminal al liberarse. */
  readonly requiresTerminalCleaning: boolean;
  /** Exige m² útiles declarados. */
  readonly requiresArea: boolean;
  /** Exige presión, renovaciones por hora y validación HVAC. */
  readonly requiresHvac: boolean;
}

/** Perfil de una función: formas en las que puede existir y banderas. */
export interface FunctionProfile extends FunctionFlags {
  /** Código de la función (concepto `SPACE_FN_*` o `SPACE_TYPE_ROOM`). */
  readonly code: string;
  /** Clave estable del perfil (`GENERIC` para `SPACE_TYPE_ROOM`). */
  readonly key: string;
  /** Formas permitidas para esta función. */
  readonly forms: readonly FormCode[];
}

const NO_FLAGS: FunctionFlags = {
  schedulable: false,
  inpatient: false,
  billable: false,
  allowOverlap: false,
  isolationCapable: false,
  stockPoint: false,
  hostsEquipment: false,
  requiresTerminalCleaning: false,
  requiresArea: false,
  requiresHvac: false,
};

/** Arma un perfil: las banderas no nombradas quedan en `false`. */
function profile(
  code: string,
  forms: readonly FormCode[],
  flags: Partial<FunctionFlags> = {},
  key = code.replace(/^SPACE_FN_/, ''),
): FunctionProfile {
  return { code, key, forms, ...NO_FLAGS, ...flags };
}

const ROOM: FormCode[] = ['LOC_FORM_ROOM'];
const ROOM_AREA: FormCode[] = ['LOC_FORM_ROOM', 'LOC_FORM_AREA'];
const BED: FormCode[] = ['LOC_FORM_BED'];

/**
 * Perfil de cada función (contrato §2, «Perfil de función»: constante TS
 * expuesta por el catálogo, no tabla).
 *
 * Las banderas `requiresHvac` siguen ASHRAE 170 / FGI 2022 (tabla de
 * parámetros de ventilación por tipo de local: quirófano, sala de partos,
 * AIIR, PE, esterilización); `requiresTerminalCleaning`, las guías de CDC
 * para limpieza de egreso. Los umbrales numéricos NO viven acá: son de F2.
 */
export const FUNCTION_PROFILES: readonly FunctionProfile[] = [
  profile(
    'SPACE_TYPE_ROOM',
    ['LOC_FORM_ROOM', 'LOC_FORM_AREA', 'LOC_FORM_VIRTUAL'],
    {},
    'GENERIC',
  ),
  profile('SPACE_FN_CONSULTING_ROOM', ROOM, {
    schedulable: true,
    billable: true,
    hostsEquipment: true,
    requiresArea: true,
  }),
  profile('SPACE_FN_INPATIENT_ROOM', ROOM, {
    inpatient: true,
    billable: true,
    requiresTerminalCleaning: true,
    requiresArea: true,
  }),
  profile('SPACE_FN_OPERATING_ROOM', ROOM, {
    schedulable: true,
    billable: true,
    hostsEquipment: true,
    requiresTerminalCleaning: true,
    requiresArea: true,
    requiresHvac: true,
  }),
  profile('SPACE_FN_PROCEDURE_ROOM', ROOM, {
    schedulable: true,
    billable: true,
    hostsEquipment: true,
    requiresTerminalCleaning: true,
    requiresArea: true,
  }),
  profile('SPACE_FN_DELIVERY_ROOM', ROOM, {
    schedulable: true,
    billable: true,
    hostsEquipment: true,
    requiresTerminalCleaning: true,
    requiresArea: true,
    requiresHvac: true,
  }),
  profile('SPACE_FN_RECOVERY_PACU', ROOM_AREA, {
    billable: true,
    allowOverlap: true,
    hostsEquipment: true,
    requiresArea: true,
  }),
  profile('SPACE_FN_ICU_BAY', ROOM_AREA, {
    inpatient: true,
    billable: true,
    hostsEquipment: true,
    requiresTerminalCleaning: true,
    requiresArea: true,
  }),
  profile('SPACE_FN_EMERGENCY_BOX', ROOM_AREA, {
    billable: true,
    hostsEquipment: true,
    requiresTerminalCleaning: true,
  }),
  profile('SPACE_FN_OBSERVATION', ROOM_AREA, {
    billable: true,
    allowOverlap: true,
  }),
  profile('SPACE_FN_ISOLATION_AIIR', ROOM, {
    inpatient: true,
    billable: true,
    isolationCapable: true,
    requiresTerminalCleaning: true,
    requiresArea: true,
    requiresHvac: true,
  }),
  profile('SPACE_FN_PROTECTIVE_ENV', ROOM, {
    inpatient: true,
    billable: true,
    isolationCapable: true,
    requiresTerminalCleaning: true,
    requiresArea: true,
    requiresHvac: true,
  }),
  profile('SPACE_FN_IMAGING_ROOM', ROOM, {
    schedulable: true,
    billable: true,
    hostsEquipment: true,
    requiresArea: true,
  }),
  profile('SPACE_FN_SAMPLE_COLLECTION', ROOM_AREA, {
    schedulable: true,
    allowOverlap: true,
  }),
  profile('SPACE_FN_LAB_AREA', ROOM_AREA, {
    hostsEquipment: true,
    stockPoint: true,
  }),
  profile('SPACE_FN_PHARMACY', ROOM_AREA, { stockPoint: true }),
  profile('SPACE_FN_STORAGE', ROOM_AREA, { stockPoint: true }),
  profile('SPACE_FN_STERILIZATION', ROOM_AREA, {
    hostsEquipment: true,
    requiresHvac: true,
  }),
  profile(
    'SPACE_FN_WAITING',
    ['LOC_FORM_ROOM', 'LOC_FORM_AREA', 'LOC_FORM_CORRIDOR'],
    { allowOverlap: true },
  ),
  profile('SPACE_FN_NURSE_STATION', ROOM_AREA, { stockPoint: true }),
  profile('SPACE_FN_OFFICE_ADMIN', ROOM),
  profile('SPACE_FN_BED_STANDARD', BED, {
    inpatient: true,
    billable: true,
    requiresTerminalCleaning: true,
  }),
  profile('SPACE_FN_BED_ICU', BED, {
    inpatient: true,
    billable: true,
    hostsEquipment: true,
    requiresTerminalCleaning: true,
  }),
  profile('SPACE_FN_CRIB', BED, {
    inpatient: true,
    billable: true,
    requiresTerminalCleaning: true,
  }),
  profile('SPACE_FN_STRETCHER', BED),
  profile('SPACE_FN_BUILDING_GENERIC', ['LOC_FORM_BUILDING']),
  profile('SPACE_FN_WING_GENERIC', ['LOC_FORM_WING']),
  profile('SPACE_FN_LEVEL_GENERIC', ['LOC_FORM_LEVEL']),
  profile('SPACE_FN_WARD_GENERIC', ['LOC_FORM_WARD']),
  profile('SPACE_FN_AREA_GENERIC', ['LOC_FORM_AREA', 'LOC_FORM_CORRIDOR']),
];

/** Perfil por código de función. */
export const FUNCTION_PROFILE_BY_CODE: ReadonlyMap<string, FunctionProfile> =
  new Map(FUNCTION_PROFILES.map((p) => [p.code, p]));

/** Una regla padre→hijo por código de forma. */
export interface ParentRule {
  readonly parent: FormCode;
  readonly child: FormCode;
}

/**
 * Reglas padre→hijo (contrato §2). La fuente de verdad en ejecución es la tabla
 * `practice.space_form_parent_rules`; esta lista es lo que la siembra escribe.
 * Referencias: FHIR R5 `Location.form` + IHE mCSD (jerarquía `partOf`).
 */
export const PARENT_RULE_SEED: readonly ParentRule[] = (
  [
    ['LOC_FORM_SITE', ['LOC_FORM_BUILDING', 'LOC_FORM_AREA']],
    [
      'LOC_FORM_BUILDING',
      ['LOC_FORM_WING', 'LOC_FORM_LEVEL', 'LOC_FORM_AREA', 'LOC_FORM_ROOM'],
    ],
    [
      'LOC_FORM_WING',
      ['LOC_FORM_LEVEL', 'LOC_FORM_WARD', 'LOC_FORM_AREA', 'LOC_FORM_ROOM'],
    ],
    [
      'LOC_FORM_LEVEL',
      ['LOC_FORM_WARD', 'LOC_FORM_AREA', 'LOC_FORM_ROOM', 'LOC_FORM_CORRIDOR'],
    ],
    ['LOC_FORM_WARD', ['LOC_FORM_ROOM', 'LOC_FORM_BED']],
    ['LOC_FORM_AREA', ['LOC_FORM_ROOM', 'LOC_FORM_BED', 'LOC_FORM_AREA']],
    ['LOC_FORM_ROOM', ['LOC_FORM_BED']],
    ['LOC_FORM_CORRIDOR', ['LOC_FORM_ROOM']],
  ] as const
).flatMap(([parent, children]) =>
  children.map((child): ParentRule => ({ parent, child })),
);

/**
 * Formas permitidas sin padre (raíz del árbol de la sede).
 *
 * Constante y no tabla: la PK compuesta de `space_form_parent_rules` no admite
 * un padre nulo (contrato, «Desvíos» del modelo).
 */
export const ROOT_FORMS: readonly FormCode[] = [
  'LOC_FORM_BUILDING',
  'LOC_FORM_AREA',
  'LOC_FORM_ROOM',
  'LOC_FORM_VIRTUAL',
];

/** Código de regla de tipología. */
export type TypologyRuleCode =
  'TYPO_ALLOWED' | 'TYPO_REQUIRED' | 'TYPO_FORBIDDEN';

/** Una regla de tipología por códigos. */
export interface TypologyRule {
  readonly typology: string;
  readonly function: string;
  readonly rule: TypologyRuleCode;
}

/**
 * Reglas de tipología (contrato §2). La fuente de verdad en ejecución es
 * `practice.facility_typology_rules`; esta lista es lo que la siembra escribe.
 *
 * Normas de origen (Bolivia, Ministerio de Salud y Deportes, serie de
 * documentos técnico-normativos): «Norma Nacional de Caracterización de
 * Establecimientos de Salud de Primer Nivel» (Puesto de Salud, Centro de
 * Salud ambulatorio/con internación/integral) y las de segundo y tercer nivel
 * (hospitales). El texto oficial NO se pudo leer en la sesión
 * (`minsalud.gob.bo` bloqueado, PLAN §7): las reglas siguen al contrato y
 * quedan como datos revisables, no como interpretación verificada.
 */
export const TYPOLOGY_RULE_SEED: readonly TypologyRule[] = [
  // Puesto de Salud (1.er nivel, caracterización de primer nivel): sin
  // cirugía, sin terapia intensiva, sin internación.
  ...[
    'SPACE_FN_OPERATING_ROOM',
    'SPACE_FN_ICU_BAY',
    'SPACE_FN_INPATIENT_ROOM',
    'SPACE_FN_BED_STANDARD',
    'SPACE_FN_BED_ICU',
  ].map((fn) => ({
    typology: 'TYPOLOGY_HEALTH_POST',
    function: fn,
    rule: 'TYPO_FORBIDDEN' as const,
  })),
  // Centro de Salud ambulatorio (1.er nivel): sin internación ni cirugía.
  ...[
    'SPACE_FN_INPATIENT_ROOM',
    'SPACE_FN_BED_STANDARD',
    'SPACE_FN_BED_ICU',
    'SPACE_FN_OPERATING_ROOM',
  ].map((fn) => ({
    typology: 'TYPOLOGY_HC_AMBULATORY',
    function: fn,
    rule: 'TYPO_FORBIDDEN' as const,
  })),
  // Hospital de 2.º y 3.er nivel (caracterización de segundo y tercer nivel):
  // emergencia, internación y quirófano obligatorios.
  ...['TYPOLOGY_HOSPITAL_L2', 'TYPOLOGY_HOSPITAL_L3'].flatMap((typology) =>
    [
      'SPACE_FN_EMERGENCY_BOX',
      'SPACE_FN_INPATIENT_ROOM',
      'SPACE_FN_OPERATING_ROOM',
    ].map((fn) => ({
      typology,
      function: fn,
      rule: 'TYPO_REQUIRED' as const,
    })),
  ),
];

/** Una línea de derivación de capacidad: qué espacios activos cuentan. */
export interface CapacityDerivation {
  readonly kindCode: string;
  readonly forms?: readonly FormCode[];
  readonly functions?: readonly string[];
  /** `true`/`false` filtra por `censable`; ausente, no filtra. */
  readonly censable?: boolean;
}

/**
 * Capacidad derivada (PLAN §2.1: «capacidad derivada, nunca escrita a mano»):
 * se cuentan los espacios ACTIVOS que cumplen cada línea.
 */
export const CAPACITY_DERIVATION: readonly CapacityDerivation[] = [
  { kindCode: 'CAP_BEDS_CENSABLE', forms: ['LOC_FORM_BED'], censable: true },
  {
    kindCode: 'CAP_BEDS_NON_CENSABLE',
    forms: ['LOC_FORM_BED'],
    censable: false,
  },
  { kindCode: 'CAP_CONSULTING_ROOMS', functions: ['SPACE_FN_CONSULTING_ROOM'] },
  { kindCode: 'CAP_OPERATING_ROOMS', functions: ['SPACE_FN_OPERATING_ROOM'] },
  { kindCode: 'CAP_DELIVERY_ROOMS', functions: ['SPACE_FN_DELIVERY_ROOM'] },
  { kindCode: 'CAP_EMERGENCY_BAYS', functions: ['SPACE_FN_EMERGENCY_BOX'] },
  { kindCode: 'CAP_ICU_BEDS', functions: ['SPACE_FN_BED_ICU'] },
];

/** Concepto como lo ve el cliente. */
export interface ConceptRef {
  readonly id: string;
  readonly code: string;
  readonly display: string;
}

const PREFIX = 'practice:';

/**
 * Conceptos de `practice` por id, para traducir columnas `*_concept_id` a
 * `{code, display}`. En los conceptos de F1 el nombre lógico es el código.
 */
export const PRACTICE_CONCEPT_BY_ID: ReadonlyMap<string, ConceptRef> = new Map(
  PRACTICE_CONCEPT_SEEDS.map((seed) => {
    const name = seed.key.slice(PREFIX.length) as keyof typeof PRAC;
    const ref: ConceptRef = {
      id: PRAC[name],
      code: seed.code,
      display: seed.display,
    };
    return [ref.id, ref];
  }),
);

/** Lo mismo, por código. */
export const PRACTICE_CONCEPT_BY_CODE: ReadonlyMap<string, ConceptRef> =
  new Map([...PRACTICE_CONCEPT_BY_ID.values()].map((c) => [c.code, c]));

/** Grupos de conceptos que el catálogo expone, por prefijo de código. */
export const CONCEPT_GROUPS = {
  forms: 'LOC_FORM_',
  asepsis: 'ASEPSIS_',
  pressure: 'PRESSURE_',
  sex: 'SEX_',
  ageGroup: 'AGE_',
  bedCategory: 'BED_CAT_',
  unitRole: 'SPACE_UNIT_ROLE_',
  subsector: 'SUBSECTOR_',
  careLevel: 'CARE_LEVEL_',
  typology: 'TYPOLOGY_',
  sedes: 'SEDES_',
  licenseStatus: 'LIC_',
  capacityKind: 'CAP_',
} as const;

/** Códigos de ciclo de vida del espacio, en orden. */
export const SPACE_LIFECYCLE_CODES = [
  'SPACE_PLANNED',
  'SPACE_ACTIVE',
  'SPACE_SUSPENDED',
  'SPACE_RETIRED',
] as const;

/** Códigos de ciclo de vida de la unidad, en orden. */
export const UNIT_LIFECYCLE_CODES = [
  'UNIT_PLANNED',
  'UNIT_ACTIVE',
  'UNIT_SUSPENDED',
  'UNIT_RETIRED',
] as const;

/**
 * Conceptos de un grupo, en el orden en que se declararon.
 *
 * @param prefix - Prefijo de código del grupo.
 * @param exclude - Prefijos que también empiezan igual pero son de otro grupo.
 */
export function conceptsByPrefix(
  prefix: string,
  exclude: readonly string[] = [],
): ConceptRef[] {
  return [...PRACTICE_CONCEPT_BY_ID.values()].filter(
    (c) =>
      c.code.startsWith(prefix) && !exclude.some((x) => c.code.startsWith(x)),
  );
}

/**
 * Id de un concepto de `practice` por código, o `undefined` si no existe o no
 * empieza con el prefijo esperado (un `pressureCode` no puede ser una forma).
 */
export function conceptIdOf(
  code: string | undefined | null,
  prefix: string,
): string | undefined {
  if (!code || !code.startsWith(prefix)) return undefined;
  return PRACTICE_CONCEPT_BY_CODE.get(code)?.id;
}

/** `{code, display}` de un concepto de `practice`, o `null`. */
export function conceptRef(
  id: string | undefined | null,
): { code: string; display: string } | null {
  if (!id) return null;
  const c = PRACTICE_CONCEPT_BY_ID.get(id);
  return c ? { code: c.code, display: c.display } : null;
}
