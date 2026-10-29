import { PRAC, PRACTICE_CONCEPT_SEEDS } from './practice.concepts';

/**
 * Catálogo de infraestructura hospitalaria (CONTRATO-F0-F1 §2): formas, funciones
 * con su perfil, reglas padre→hijo y reglas de tipología.
 *
 * Qué es dato y qué es código, a propósito:
 *
 * - Los **conceptos** (formas, funciones, estados, atributos) se declaran en
 *   `practice.concepts.ts` y se siembran con el catálogo transversal.
 * - El **perfil de función** es una constante TS (decisión del contrato): es el
 *   comportamiento que la API conoce de cada función y se expone por
 *   `GET /practice/infrastructure-catalog`.
 * - Las **reglas padre→hijo** y de **tipología** son filas de
 *   `practice.space_form_parent_rules` y `practice.facility_typology_rules`
 *   (INV-18: reglas y umbrales son datos). Lo que está acá abajo
 *   (`PARENT_RULE_SEEDS`, `TYPOLOGY_RULE_SEEDS`) es la **semilla** que
 *   `InfrastructureCatalogSeedService` escribe en esas tablas; la validación
 *   lee las tablas, nunca estas constantes.
 * - La **regla de raíz** (qué formas admiten no tener padre) no cabe en
 *   `space_form_parent_rules` —su PK compuesta exige un padre—, así que es la
 *   constante `ROOT_FORMS` (Desvíos del modelo, CONTRATO-F0-F1).
 */

/** Las diez formas (`LOC_FORM_*`, sin el prefijo). */
export const FORM_KEYS = [
  'SITE',
  'BUILDING',
  'WING',
  'LEVEL',
  'WARD',
  'AREA',
  'CORRIDOR',
  'ROOM',
  'BED',
  'VIRTUAL',
] as const;

/** Clave corta de una forma. */
export type FormKey = (typeof FORM_KEYS)[number];

/** Código FHIR (`Location.form`) de cada forma. */
export const FORM_FHIR_CODE: Readonly<Record<FormKey, string>> = {
  SITE: 'si',
  BUILDING: 'bu',
  WING: 'wi',
  LEVEL: 'lvl',
  WARD: 'wa',
  AREA: 'area',
  CORRIDOR: 'co',
  ROOM: 'ro',
  BED: 'bd',
  VIRTUAL: 'vi',
};

/**
 * Formas que admiten no tener padre (raíz del árbol de un establecimiento).
 * Constante, no tabla: ver el comentario del archivo.
 */
export const ROOT_FORMS: readonly FormKey[] = [
  'BUILDING',
  'AREA',
  'ROOM',
  'VIRTUAL',
];

/** Banderas de comportamiento de una función (CONTRATO-F0-F1 §2, «Perfil de función»). */
export interface FunctionFlags {
  /** El espacio puede ser recurso agendable. */
  readonly schedulable: boolean;
  /** Aloja pacientes internados. */
  readonly inpatient: boolean;
  /** Genera cargos (día-cama, uso de quirófano…). */
  readonly billable: boolean;
  /** Admite reservas solapadas (sala de espera, oficina). */
  readonly allowOverlap: boolean;
  /** Puede usarse para aislamiento. */
  readonly isolationCapable: boolean;
  /** Es punto de stock (botiquín, depósito, farmacia). */
  readonly stockPoint: boolean;
  /** Aloja equipos. */
  readonly hostsEquipment: boolean;
  /** Exige limpieza terminal tras contaminación o aislamiento. */
  readonly requiresTerminalCleaning: boolean;
  /** Exige la superficie útil (`areaM2`) para activarse. */
  readonly requiresArea: boolean;
  /** Exige presión, renovaciones por hora y validación HVAC para activarse. */
  readonly requiresHvac: boolean;
}

/** Perfil de una función: formas permitidas y banderas. */
export interface FunctionProfile extends FunctionFlags {
  /** Formas bajo las que la función puede existir. */
  readonly forms: readonly FormKey[];
}

const NONE: FunctionFlags = {
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

/**
 * Perfil por función (clave = código del concepto, p. ej. `SPACE_FN_OPERATING_ROOM`).
 *
 * El contrato fija los nombres de las banderas, no sus valores: los de abajo son
 * la lectura de `procesos/01…03`, `glosario.md` y `fuentes/` y se corrigen
 * editando esta constante. `SPACE_TYPE_ROOM` (la función genérica que ya
 * existía) admite cualquier forma sin banderas.
 */
export const FUNCTION_PROFILES = {
  SPACE_TYPE_ROOM: { ...NONE, forms: [...FORM_KEYS] },
  SPACE_FN_CONSULTING_ROOM: {
    ...NONE,
    forms: ['ROOM'],
    schedulable: true,
    billable: true,
    hostsEquipment: true,
  },
  SPACE_FN_INPATIENT_ROOM: {
    ...NONE,
    forms: ['ROOM'],
    inpatient: true,
    isolationCapable: true,
    requiresTerminalCleaning: true,
  },
  SPACE_FN_OPERATING_ROOM: {
    ...NONE,
    forms: ['ROOM'],
    schedulable: true,
    billable: true,
    hostsEquipment: true,
    requiresTerminalCleaning: true,
    requiresArea: true,
    requiresHvac: true,
  },
  SPACE_FN_PROCEDURE_ROOM: {
    ...NONE,
    forms: ['ROOM'],
    schedulable: true,
    billable: true,
    hostsEquipment: true,
    requiresTerminalCleaning: true,
  },
  SPACE_FN_DELIVERY_ROOM: {
    ...NONE,
    forms: ['ROOM'],
    schedulable: true,
    billable: true,
    hostsEquipment: true,
    requiresTerminalCleaning: true,
    requiresArea: true,
  },
  SPACE_FN_RECOVERY_PACU: {
    ...NONE,
    forms: ['ROOM', 'AREA'],
    inpatient: true,
    hostsEquipment: true,
    requiresTerminalCleaning: true,
  },
  SPACE_FN_ICU_BAY: {
    ...NONE,
    forms: ['ROOM', 'AREA'],
    inpatient: true,
    isolationCapable: true,
    hostsEquipment: true,
    requiresTerminalCleaning: true,
  },
  SPACE_FN_EMERGENCY_BOX: {
    ...NONE,
    forms: ['ROOM', 'AREA'],
    billable: true,
    hostsEquipment: true,
    requiresTerminalCleaning: true,
  },
  SPACE_FN_OBSERVATION: {
    ...NONE,
    forms: ['ROOM', 'AREA'],
    inpatient: true,
    requiresTerminalCleaning: true,
  },
  SPACE_FN_ISOLATION_AIIR: {
    ...NONE,
    forms: ['ROOM'],
    inpatient: true,
    isolationCapable: true,
    requiresTerminalCleaning: true,
    requiresArea: true,
    requiresHvac: true,
  },
  SPACE_FN_PROTECTIVE_ENV: {
    ...NONE,
    forms: ['ROOM'],
    inpatient: true,
    isolationCapable: true,
    requiresTerminalCleaning: true,
    requiresArea: true,
    requiresHvac: true,
  },
  SPACE_FN_IMAGING_ROOM: {
    ...NONE,
    forms: ['ROOM'],
    schedulable: true,
    billable: true,
    hostsEquipment: true,
    requiresArea: true,
  },
  SPACE_FN_SAMPLE_COLLECTION: {
    ...NONE,
    forms: ['ROOM', 'AREA'],
    schedulable: true,
    billable: true,
  },
  SPACE_FN_LAB_AREA: {
    ...NONE,
    forms: ['AREA', 'ROOM'],
    hostsEquipment: true,
  },
  SPACE_FN_PHARMACY: { ...NONE, forms: ['ROOM', 'AREA'], stockPoint: true },
  SPACE_FN_STORAGE: { ...NONE, forms: ['ROOM', 'AREA'], stockPoint: true },
  SPACE_FN_STERILIZATION: {
    ...NONE,
    forms: ['ROOM', 'AREA'],
    hostsEquipment: true,
  },
  SPACE_FN_WAITING: {
    ...NONE,
    forms: ['ROOM', 'AREA', 'CORRIDOR'],
    allowOverlap: true,
  },
  SPACE_FN_NURSE_STATION: {
    ...NONE,
    forms: ['ROOM', 'AREA'],
    allowOverlap: true,
    stockPoint: true,
  },
  SPACE_FN_OFFICE_ADMIN: { ...NONE, forms: ['ROOM'], allowOverlap: true },
  SPACE_FN_BED_STANDARD: {
    ...NONE,
    forms: ['BED'],
    inpatient: true,
    billable: true,
    requiresTerminalCleaning: true,
  },
  SPACE_FN_BED_ICU: {
    ...NONE,
    forms: ['BED'],
    inpatient: true,
    billable: true,
    isolationCapable: true,
    hostsEquipment: true,
    requiresTerminalCleaning: true,
  },
  SPACE_FN_CRIB: {
    ...NONE,
    forms: ['BED'],
    inpatient: true,
    billable: true,
    requiresTerminalCleaning: true,
  },
  SPACE_FN_STRETCHER: {
    ...NONE,
    forms: ['BED'],
    inpatient: true,
    billable: true,
    requiresTerminalCleaning: true,
  },
  SPACE_FN_BUILDING_GENERIC: { ...NONE, forms: ['BUILDING'] },
  SPACE_FN_WING_GENERIC: { ...NONE, forms: ['WING'] },
  SPACE_FN_LEVEL_GENERIC: { ...NONE, forms: ['LEVEL'] },
  SPACE_FN_WARD_GENERIC: { ...NONE, forms: ['WARD'], inpatient: true },
  SPACE_FN_AREA_GENERIC: { ...NONE, forms: ['AREA'] },
} as const satisfies Record<string, FunctionProfile>;

/** Código del concepto de una función (clave de `FUNCTION_PROFILES`). */
export type FunctionCode = keyof typeof FUNCTION_PROFILES;

/** Los códigos de función, en el orden del contrato. */
export const FUNCTION_CODES = Object.keys(FUNCTION_PROFILES) as FunctionCode[];

/** Las funciones de cama: sus espacios cuentan como camas de la sede. */
export const BED_FORM: FormKey = 'BED';

/** Regla padre→hijo semilla (forma, no concepto). */
export interface ParentRuleSeed {
  /** Forma del padre. */
  readonly parent: FormKey;
  /** Formas que pueden colgar de ese padre. */
  readonly children: readonly FormKey[];
}

/**
 * Semilla de `space_form_parent_rules` (CONTRATO-F0-F1 §2):
 * SITE→BUILDING|AREA; BUILDING→WING|LEVEL|AREA|ROOM; WING→LEVEL|WARD|AREA|ROOM;
 * LEVEL→WARD|AREA|ROOM|CORRIDOR; WARD→ROOM|BED; AREA→ROOM|BED|AREA; ROOM→BED;
 * CORRIDOR→ROOM.
 */
export const PARENT_RULE_SEEDS: readonly ParentRuleSeed[] = [
  { parent: 'SITE', children: ['BUILDING', 'AREA'] },
  { parent: 'BUILDING', children: ['WING', 'LEVEL', 'AREA', 'ROOM'] },
  { parent: 'WING', children: ['LEVEL', 'WARD', 'AREA', 'ROOM'] },
  { parent: 'LEVEL', children: ['WARD', 'AREA', 'ROOM', 'CORRIDOR'] },
  { parent: 'WARD', children: ['ROOM', 'BED'] },
  { parent: 'AREA', children: ['ROOM', 'BED', 'AREA'] },
  { parent: 'ROOM', children: ['BED'] },
  { parent: 'CORRIDOR', children: ['ROOM'] },
];

/** Código de tipología (clave de `PRAC`, `TYPOLOGY_*`). */
export const TYPOLOGY_CODES = [
  'TYPOLOGY_HEALTH_POST',
  'TYPOLOGY_HC_AMBULATORY',
  'TYPOLOGY_HC_INPATIENT',
  'TYPOLOGY_HC_INTEGRAL',
  'TYPOLOGY_HOSPITAL_L2',
  'TYPOLOGY_HOSPITAL_L3',
  'TYPOLOGY_INSTITUTE_L4',
  'TYPOLOGY_PRIVATE_CLINIC',
  'TYPOLOGY_MEDICAL_OFFICE',
  'TYPOLOGY_DIAGNOSTIC_CENTER',
  'TYPOLOGY_LABORATORY',
] as const;

/** Código de tipología. */
export type TypologyCode = (typeof TYPOLOGY_CODES)[number];

/** Regla de tipología semilla: la función se permite o se exige. */
export interface TypologyRuleSeed {
  /** Tipología a la que aplica. */
  readonly typology: TypologyCode;
  /** Función afectada. */
  readonly fn: FunctionCode;
  /** `TYPO_ALLOWED` o `TYPO_REQUIRED`. */
  readonly rule: 'TYPO_ALLOWED' | 'TYPO_REQUIRED';
  /** Norma de la que sale la regla (dato, no `if`). */
  readonly source: string;
}

/**
 * Norma de origen por tipología. El texto de las normas de caracterización no se
 * pudo leer (`minsalud.gob.bo` bloqueado en la investigación, `PLAN.md` §7), así
 * que la fuente se declara con la marca **[sin verificar]** del contrato.
 */
export const TYPOLOGY_SOURCES: Readonly<Record<TypologyCode, string>> = {
  TYPOLOGY_HEALTH_POST:
    'Norma Nacional de Caracterización de Establecimientos de Salud de Primer Nivel [sin verificar]',
  TYPOLOGY_HC_AMBULATORY:
    'Norma Nacional de Caracterización de Establecimientos de Salud de Primer Nivel [sin verificar]',
  TYPOLOGY_HC_INPATIENT:
    'Norma Nacional de Caracterización de Establecimientos de Salud de Primer Nivel [sin verificar]',
  TYPOLOGY_HC_INTEGRAL:
    'Norma Nacional de Caracterización de Establecimientos de Salud de Primer Nivel [sin verificar]',
  TYPOLOGY_HOSPITAL_L2:
    'Norma Nacional de Caracterización de Establecimientos de Salud de Segundo Nivel [sin verificar]',
  TYPOLOGY_HOSPITAL_L3:
    'Norma Nacional de Caracterización de Establecimientos de Salud de Tercer Nivel [sin verificar]',
  TYPOLOGY_INSTITUTE_L4: 'Ley 738 (institutos de cuarto nivel) [sin verificar]',
  TYPOLOGY_PRIVATE_CLINIC: 'Sin norma de caracterización verificada',
  TYPOLOGY_MEDICAL_OFFICE: 'Sin norma de caracterización verificada',
  TYPOLOGY_DIAGNOSTIC_CENTER: 'Sin norma de caracterización verificada',
  TYPOLOGY_LABORATORY:
    'Reglamento de laboratorios (CODELAB/SEDES) [sin verificar]',
};

/** Funciones que un establecimiento sin internación ni quirófano no admite. */
const INPATIENT_FUNCTIONS: readonly FunctionCode[] = [
  'SPACE_FN_INPATIENT_ROOM',
  'SPACE_FN_BED_STANDARD',
  'SPACE_FN_BED_ICU',
  'SPACE_FN_CRIB',
  'SPACE_FN_STRETCHER',
];

/**
 * Semántica de `facility_typology_rules` (supuesto anotado en el reporte):
 *
 * - Una tipología con **al menos una** fila `TYPO_ALLOWED` es *restrictiva*: sólo
 *   admite las funciones permitidas o exigidas.
 * - Una tipología con sólo filas `TYPO_REQUIRED` (o sin filas) no restringe;
 *   las exigidas se reportan como advertencia si faltan.
 *
 * La tabla no tiene una columna «prohibida», así que «no admite X» se siembra
 * como «admite todo lo demás».
 */
function allowedExcept(
  typology: TypologyCode,
  forbidden: readonly FunctionCode[],
): TypologyRuleSeed[] {
  return FUNCTION_CODES.filter((fn) => !forbidden.includes(fn)).map((fn) => ({
    typology,
    fn,
    rule: 'TYPO_ALLOWED' as const,
    source: TYPOLOGY_SOURCES[typology],
  }));
}

/**
 * Semilla de `facility_typology_rules` (CONTRATO-F0-F1 §2):
 *
 * - Puesto de Salud no admite quirófano, puesto de UTI, habitación de internación
 *   ni camas.
 * - Centro de Salud ambulatorio no admite habitación de internación, camas ni
 *   quirófano.
 * - Hospital de 2.º y 3.er nivel: son **obligatorios** box de emergencias,
 *   habitación de internación y quirófano.
 */
export const TYPOLOGY_RULE_SEEDS: readonly TypologyRuleSeed[] = [
  ...allowedExcept('TYPOLOGY_HEALTH_POST', [
    'SPACE_FN_OPERATING_ROOM',
    'SPACE_FN_ICU_BAY',
    ...INPATIENT_FUNCTIONS,
  ]),
  ...allowedExcept('TYPOLOGY_HC_AMBULATORY', [
    'SPACE_FN_OPERATING_ROOM',
    ...INPATIENT_FUNCTIONS,
  ]),
  ...(['TYPOLOGY_HOSPITAL_L2', 'TYPOLOGY_HOSPITAL_L3'] as const).flatMap(
    (typology) =>
      (
        [
          'SPACE_FN_EMERGENCY_BOX',
          'SPACE_FN_INPATIENT_ROOM',
          'SPACE_FN_OPERATING_ROOM',
        ] as const
      ).map((fn) => ({
        typology,
        fn,
        rule: 'TYPO_REQUIRED' as const,
        source: TYPOLOGY_SOURCES[typology],
      })),
  ),
];

/** Estados de ciclo de vida del espacio, en orden de avance. */
export const SPACE_STATUS = {
  PLANNED: PRAC.SPACE_PLANNED,
  ACTIVE: PRAC.SPACE_ACTIVE,
  SUSPENDED: PRAC.SPACE_SUSPENDED,
  RETIRED: PRAC.SPACE_RETIRED,
} as const;

/** Estados de ciclo de vida de la unidad clínica. */
export const UNIT_STATUS = {
  PLANNED: PRAC.UNIT_PLANNED,
  ACTIVE: PRAC.UNIT_ACTIVE,
  SUSPENDED: PRAC.UNIT_SUSPENDED,
  RETIRED: PRAC.UNIT_RETIRED,
} as const;

/** Acción de ciclo de vida del contrato. */
export type LifecycleAction = 'activate' | 'suspend' | 'reactivate' | 'retire';

/** Transición permitida: desde qué estados y a cuál llega. */
export interface LifecycleTransition {
  /** Estados desde los que se puede aplicar. */
  readonly from: readonly string[];
  /** Estado al que llega. */
  readonly to: string;
  /** Exige `reason` no vacío (INV-13). */
  readonly requiresReason: boolean;
}

/**
 * Tabla de transiciones del espacio (`procesos/02`): PLANNED→ACTIVE (activate),
 * ACTIVE→SUSPENDED (suspend), SUSPENDED→ACTIVE (reactivate) y
 * PLANNED|ACTIVE|SUSPENDED→RETIRED (retire).
 */
export const SPACE_TRANSITIONS: Readonly<
  Record<LifecycleAction, LifecycleTransition>
> = {
  activate: {
    from: [SPACE_STATUS.PLANNED],
    to: SPACE_STATUS.ACTIVE,
    requiresReason: false,
  },
  suspend: {
    from: [SPACE_STATUS.ACTIVE],
    to: SPACE_STATUS.SUSPENDED,
    requiresReason: true,
  },
  reactivate: {
    from: [SPACE_STATUS.SUSPENDED],
    to: SPACE_STATUS.ACTIVE,
    requiresReason: false,
  },
  retire: {
    from: [SPACE_STATUS.PLANNED, SPACE_STATUS.ACTIVE, SPACE_STATUS.SUSPENDED],
    to: SPACE_STATUS.RETIRED,
    requiresReason: true,
  },
};

/** Tabla de transiciones de la unidad clínica (mismo patrón que el espacio). */
export const UNIT_TRANSITIONS: Readonly<
  Record<LifecycleAction, LifecycleTransition>
> = {
  activate: {
    from: [UNIT_STATUS.PLANNED],
    to: UNIT_STATUS.ACTIVE,
    requiresReason: false,
  },
  suspend: {
    from: [UNIT_STATUS.ACTIVE],
    to: UNIT_STATUS.SUSPENDED,
    requiresReason: true,
  },
  reactivate: {
    from: [UNIT_STATUS.SUSPENDED],
    to: UNIT_STATUS.ACTIVE,
    requiresReason: false,
  },
  retire: {
    from: [UNIT_STATUS.PLANNED, UNIT_STATUS.ACTIVE, UNIT_STATUS.SUSPENDED],
    to: UNIT_STATUS.RETIRED,
    requiresReason: true,
  },
};

/** Una entrada resuelta de una familia de conceptos. */
export interface ConceptEntry {
  /** Código completo del concepto (`LOC_FORM_ROOM`). */
  readonly code: string;
  /** Id determinista del concepto. */
  readonly id: string;
  /** Texto para mostrar. */
  readonly display: string;
}

const DISPLAY_BY_CODE: ReadonlyMap<string, string> = new Map(
  PRACTICE_CONCEPT_SEEDS.map((seed) => [seed.code, seed.display]),
);

/** Resuelve un código de concepto de `practice` a su entrada (id + display). */
export function practiceConcept(code: string): ConceptEntry {
  const id = (PRAC as Record<string, string>)[code];
  if (!id) throw new Error(`Concepto de practice desconocido: ${code}`);
  return { code, id, display: DISPLAY_BY_CODE.get(code) ?? code };
}

/**
 * Familia de conceptos con búsqueda por código (completo o corto) y por id.
 *
 * El contrato nombra los códigos con su prefijo (`SPACE_FN_OPERATING_ROOM`,
 * `TYPOLOGY_HEALTH_POST`, `CAP_BEDS_CENSABLE`) y las formas de los cuerpos con
 * formas cortas en algunos ejemplos; la API **acepta ambos** y **emite siempre
 * el código completo**.
 */
export class ConceptFamily {
  private readonly byCode = new Map<string, ConceptEntry>();
  private readonly byId = new Map<string, ConceptEntry>();

  /**
   * @param prefix - Prefijo común de los códigos (`LOC_FORM_`).
   * @param codes - Códigos completos de la familia.
   * @param aliases - Alias adicionales (código corto → código completo).
   */
  constructor(
    private readonly prefix: string,
    codes: readonly string[],
    private readonly aliases: Readonly<Record<string, string>> = {},
  ) {
    for (const code of codes) {
      const entry = practiceConcept(code);
      this.byCode.set(code, entry);
      this.byId.set(entry.id, entry);
    }
  }

  /** Todas las entradas, en el orden de declaración. */
  all(): ConceptEntry[] {
    return [...this.byCode.values()];
  }

  /** Busca por código completo, corto o alias; `undefined` si no es de la familia. */
  byInput(input: string | undefined | null): ConceptEntry | undefined {
    if (!input) return undefined;
    const normalized = input.trim().toUpperCase();
    return (
      this.byCode.get(normalized) ??
      this.byCode.get(this.aliases[normalized] ?? '') ??
      this.byCode.get(`${this.prefix}${normalized}`)
    );
  }

  /** Busca por id de concepto. */
  byConceptId(id: string | undefined | null): ConceptEntry | undefined {
    return id ? this.byId.get(id) : undefined;
  }

  /** Códigos completos de la familia. */
  codes(): string[] {
    return [...this.byCode.keys()];
  }
}

/** Formas (`LOC_FORM_*`). */
export const FORMS = new ConceptFamily(
  'LOC_FORM_',
  FORM_KEYS.map((key) => `LOC_FORM_${key}`),
);

/** Funciones: las nuevas y la genérica heredada (`GENERIC` → `SPACE_TYPE_ROOM`). */
export const FUNCTIONS = new ConceptFamily('SPACE_FN_', FUNCTION_CODES, {
  GENERIC: 'SPACE_TYPE_ROOM',
});

/** Estados del espacio. */
export const SPACE_LIFECYCLE = new ConceptFamily('SPACE_', [
  'SPACE_PLANNED',
  'SPACE_ACTIVE',
  'SPACE_SUSPENDED',
  'SPACE_RETIRED',
]);

/** Estados de la unidad. */
export const UNIT_LIFECYCLE = new ConceptFamily('UNIT_', [
  'UNIT_PLANNED',
  'UNIT_ACTIVE',
  'UNIT_SUSPENDED',
  'UNIT_RETIRED',
]);

/** Atributos técnicos del local y rol del vínculo con la unidad. */
export const ATTRIBUTES = {
  asepsis: new ConceptFamily('ASEPSIS_', [
    'ASEPSIS_UNRESTRICTED',
    'ASEPSIS_SEMI',
    'ASEPSIS_RESTRICTED',
  ]),
  pressure: new ConceptFamily('PRESSURE_', [
    'PRESSURE_NEUTRAL',
    'PRESSURE_POSITIVE',
    'PRESSURE_NEGATIVE',
  ]),
  sex: new ConceptFamily('SEX_', ['SEX_ANY', 'SEX_FEMALE', 'SEX_MALE']),
  ageGroup: new ConceptFamily('AGE_', [
    'AGE_ANY',
    'AGE_ADULT',
    'AGE_PEDIATRIC',
    'AGE_NEONATAL',
  ]),
  bedCategory: new ConceptFamily('BED_CAT_', [
    'BED_CAT_PRIVATE',
    'BED_CAT_SHARED',
    'BED_CAT_ICU',
    'BED_CAT_INTERMEDIATE',
    'BED_CAT_NEONATAL',
  ]),
  unitRole: new ConceptFamily('SPACE_UNIT_ROLE_', [
    'SPACE_UNIT_ROLE_OWNER',
    'SPACE_UNIT_ROLE_SHARED',
    'SPACE_UNIT_ROLE_LOAN',
  ]),
} as const;

/** Conceptos regulatorios de Bolivia. */
export const REGULATORY = {
  subsector: new ConceptFamily('SUBSECTOR_', [
    'SUBSECTOR_PUBLIC',
    'SUBSECTOR_SOCIAL_SECURITY',
    'SUBSECTOR_PRIVATE',
    'SUBSECTOR_PRIVATE_AGREEMENT',
    'SUBSECTOR_NGO_CHURCH',
  ]),
  careLevel: new ConceptFamily('CARE_LEVEL_', [
    'CARE_LEVEL_1',
    'CARE_LEVEL_2',
    'CARE_LEVEL_3',
    'CARE_LEVEL_4',
  ]),
  typology: new ConceptFamily('', TYPOLOGY_CODES),
  sedes: new ConceptFamily('SEDES_', [
    'SEDES_LPZ',
    'SEDES_CBB',
    'SEDES_SCZ',
    'SEDES_ORU',
    'SEDES_PTS',
    'SEDES_CHQ',
    'SEDES_TJA',
    'SEDES_BEN',
    'SEDES_PND',
  ]),
  licenseStatus: new ConceptFamily('LIC_', [
    'LIC_IN_PROCESS',
    'LIC_VALID',
    'LIC_EXPIRED',
    'LIC_SUSPENDED',
    'LIC_REVOKED',
  ]),
  capacityKind: new ConceptFamily('CAP_', [
    'CAP_BEDS_CENSABLE',
    'CAP_BEDS_NON_CENSABLE',
    'CAP_CONSULTING_ROOMS',
    'CAP_OPERATING_ROOMS',
    'CAP_DELIVERY_ROOMS',
    'CAP_EMERGENCY_BAYS',
    'CAP_ICU_BEDS',
  ]),
} as const;

/**
 * Cómo se **deriva** cada tipo de capacidad contando espacios activos (INV-20).
 * Dato, no `if`: agregar un tipo es agregar una fila.
 */
export interface CapacityDerivation {
  /** Forma exigida, si aplica. */
  readonly form?: FormKey;
  /** Funciones que cuentan (alguna de). */
  readonly functions?: readonly FunctionCode[];
  /** Categorías de cama que cuentan (alguna de), además de las funciones. */
  readonly bedCategories?: readonly string[];
  /** `true` sólo camas censables; `false` sólo no censables. */
  readonly censable?: boolean;
}

/** Derivación por tipo de capacidad (clave = código `CAP_*`). */
export const CAPACITY_DERIVATIONS: Readonly<
  Record<string, CapacityDerivation>
> = {
  CAP_BEDS_CENSABLE: { form: 'BED', censable: true },
  CAP_BEDS_NON_CENSABLE: { form: 'BED', censable: false },
  CAP_CONSULTING_ROOMS: { functions: ['SPACE_FN_CONSULTING_ROOM'] },
  CAP_OPERATING_ROOMS: { functions: ['SPACE_FN_OPERATING_ROOM'] },
  CAP_DELIVERY_ROOMS: { functions: ['SPACE_FN_DELIVERY_ROOM'] },
  CAP_EMERGENCY_BAYS: { functions: ['SPACE_FN_EMERGENCY_BOX'] },
  CAP_ICU_BEDS: {
    form: 'BED',
    functions: ['SPACE_FN_BED_ICU'],
    bedCategories: ['BED_CAT_ICU'],
  },
};
