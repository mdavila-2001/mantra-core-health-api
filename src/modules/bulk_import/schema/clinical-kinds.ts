import { BulkImportReason } from '../bulk-import.error-reasons';
import { BULK_IMPORT_PERMISSIONS } from '../bulk-import.constants';
import { BIRTH_DATE_MIN } from '../../iam/presentation/dto/register-patient.dto';
import type {
  CrossFieldRule,
  FieldIssue,
  FieldSpec,
  KindSchema,
  NormalizedRow,
} from './field-schema';

/**
 * Carga masiva de historias clínicas, un tipo por clase de registro.
 *
 * ## Qué es y qué no es el esquema
 *
 * Cada columna sale de una entidad real (`source`). Pero **ningún código clínico
 * está escrito acá**: un diagnóstico, un medicamento, una sustancia, una prueba
 * o una unidad viajan como un par `<campo>System` + `<campo>Code` —el
 * `internal_code` del sistema de codificación y el código dentro de él— y se
 * resuelven contra `terminology.catalog_concepts` al validar. Si el código no
 * existe en la terminología de esta instalación, la fila se rechaza; no hay
 * lista local a la que recurrir.
 *
 * ## El bloque de paciente (el «paciente-ref» del plan)
 *
 * Todas las filas abren con `nationalId` + `birthDate`: con eso, y sólo con eso,
 * se enlaza a un paciente que **ya exista**. El bloque es común y no un tipo de
 * carga propio: una carga que sólo resolviera identidades no escribiría nada.
 *
 * ## Qué no se carga
 *
 * - Estados que sólo tienen sentido en vivo (encuentro «en curso»): un registro
 *   histórico entra como cerrado; el ejecutor fija ese estado.
 * - Nada que sobrescriba: el motor sólo agrega con procedencia.
 */

const CLIN = 'src/modules/clinical/entities';
const CHART = 'src/modules/chart/entities';

const NATIONAL_ID_PATTERN = /^[A-Za-z0-9.-]+$/;
const SOURCE_ID_PATTERN = /^[A-Za-z0-9._:/-]+$/;
const SYSTEM_PATTERN = /^[a-z0-9][a-z0-9._-]*$/;
const CODE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:/+-]*$/;

/** Columnas comunes: la referencia al paciente y al registro de origen. */
const PATIENT_REF_FIELDS: readonly FieldSpec[] = [
  {
    name: 'nationalId',
    type: 'string',
    required: true,
    description:
      'Documento de identidad del paciente (enlace; el paciente tiene que existir ya)',
    example: 'SINT-0001',
    source:
      'src/modules/iam/presentation/dto/register-patient.dto.ts#RegisterPatientDto.nationalId',
    min: 4,
    max: 40,
    pattern: NATIONAL_ID_PATTERN,
    patternHint: 'Sólo admite letras, dígitos, punto y guion',
    sensitive: true,
  },
  {
    name: 'birthDate',
    type: 'date',
    required: true,
    description:
      'Fecha de nacimiento del paciente (AAAA-MM-DD). Con el documento, debe coincidir con un único paciente',
    example: '1990-05-17',
    source:
      'src/modules/iam/presentation/dto/register-patient.dto.ts#RegisterPatientDto.birthDate',
    minDate: BIRTH_DATE_MIN,
    notFuture: true,
    sensitive: true,
  },
  {
    name: 'sourceRecordId',
    type: 'string',
    required: true,
    description:
      'Identificador del registro en el sistema de origen. Es la clave de deduplicación y de procedencia: el mismo registro con el mismo contenido se omite; con otro contenido se reporta como conflicto',
    example: 'ORIGEN-REG-0001',
    source:
      'src/modules/health_data/entities/health_provenance_records.entity.ts#HealthProvenanceRecords',
    min: 1,
    max: 100,
    pattern: SOURCE_ID_PATTERN,
    patternHint: 'Sólo admite letras, dígitos y . _ : / -',
  },
];

/**
 * Un código clínico: el sistema y el código dentro de él.
 *
 * Los ejemplos son sintéticos (`sistema-demo`/`SINT-…`): una plantilla con un
 * código real invita a dejarlo puesto.
 */
function coded(
  prefix: string,
  required: boolean,
  what: string,
  source: string,
  example: string,
): FieldSpec[] {
  return [
    {
      name: `${prefix}System`,
      type: 'string',
      required,
      description: `Sistema de codificación de ${what}: el internal_code del sistema en la terminología de esta instalación`,
      example: 'sistema-demo',
      source,
      min: 1,
      max: 100,
      pattern: SYSTEM_PATTERN,
      patternHint: 'Sólo minúsculas, dígitos y . _ -',
    },
    {
      name: `${prefix}Code`,
      type: 'string',
      required,
      description: `Código de ${what} dentro de ese sistema. Se valida contra la terminología existente`,
      example,
      source,
      min: 1,
      max: 100,
      pattern: CODE_PATTERN,
      patternHint: 'Sólo letras, dígitos y . _ : / + -',
    },
  ];
}

/** Regla: el par sistema+código se llena entero o no se llena. */
function pairTogether(prefix: string): CrossFieldRule {
  return (row: NormalizedRow): FieldIssue[] => {
    const hasSystem = row[`${prefix}System`] !== undefined;
    const hasCode = row[`${prefix}Code`] !== undefined;
    if (hasSystem === hasCode) return [];
    return [
      {
        field: hasSystem ? `${prefix}Code` : `${prefix}System`,
        code: BulkImportReason.FIELD_COMBINATION_INVALID,
        message: `${prefix}System y ${prefix}Code van juntos: falta uno`,
      },
    ];
  };
}

/** Regla: `end` no puede ser anterior a `start`. */
function notBefore(start: string, end: string): CrossFieldRule {
  return (row) => {
    const a = row[start];
    const b = row[end];
    if (a === undefined || b === undefined) return [];
    return Date.parse(b) >= Date.parse(a)
      ? []
      : [
          {
            field: end,
            code: BulkImportReason.FIELD_COMBINATION_INVALID,
            message: `${end} no puede ser anterior a ${start}`,
          },
        ];
  };
}

const CLINICAL_STATUS = ['ACTIVE', 'INACTIVE', 'RESOLVED'] as const;

const COMMON_RULES: readonly string[] = [
  'El paciente debe existir: se enlaza sólo por documento + fecha de nacimiento. Sin coincidencia, o con más de una, la fila se rechaza; nunca se adivina.',
  'El lote declara organización de origen, base legal y fecha de carga.',
  'Sólo se agrega, con procedencia (origen, lote, fecha). Un registro idéntico se omite; uno distinto con el mismo sourceRecordId se reporta como conflicto y no se sobrescribe.',
  'Los códigos clínicos (sistema + código) se validan contra la terminología existente; no hay lista local.',
  'Un paciente con el consentimiento revocado rechaza la fila.',
  'Una columna que no figura en esta plantilla rechaza la fila.',
];

const COMMON_UNIQUE: readonly (readonly string[])[] = [['sourceRecordId']];

function clinical(
  partial: Pick<
    KindSchema,
    'kind' | 'title' | 'description' | 'fields' | 'rules' | 'crossFieldRules'
  >,
): KindSchema {
  return {
    version: '1',
    group: 'CLINICAL',
    permission: BULK_IMPORT_PERMISSIONS.clinical,
    uniqueKeys: COMMON_UNIQUE,
    ...partial,
    rules: [...COMMON_RULES, ...partial.rules],
  };
}

/** Encuentros (`clinical.encounters`). */
export const ENCOUNTER_SCHEMA: KindSchema = clinical({
  kind: 'hc-encuentro',
  title: 'Historia clínica · encuentros',
  description:
    'Agrega encuentros ya ocurridos al paciente. Entran como cerrados; no se cargan encuentros en curso.',
  fields: [
    ...PATIENT_REF_FIELDS,
    {
      name: 'startAt',
      type: 'datetime',
      required: true,
      description: 'Inicio del encuentro (ISO 8601 con zona)',
      example: '2024-03-15T10:30:00-04:00',
      source: `${CLIN}/encounters.entity.ts#Encounters.startAt`,
      notFuture: true,
    },
    {
      name: 'endAt',
      type: 'datetime',
      required: false,
      description: 'Fin del encuentro (no anterior al inicio)',
      example: '2024-03-15T11:00:00-04:00',
      source: `${CLIN}/encounters.entity.ts#Encounters.endAt`,
      notFuture: true,
    },
    {
      name: 'reasonText',
      type: 'text',
      required: false,
      description: 'Motivo de la consulta',
      example: 'Control de rutina (texto de ejemplo)',
      source: `${CLIN}/encounters.entity.ts#Encounters.reasonText`,
      max: 2000,
      sensitive: true,
    },
    ...coded(
      'encounterClass',
      false,
      'la clase de encuentro',
      `${CLIN}/encounters.entity.ts#Encounters.classConceptId`,
      'SINT-CLASE',
    ),
  ],
  rules: ['Los encuentros se cargan como cerrados (histórico).'],
  crossFieldRules: [
    notBefore('startAt', 'endAt'),
    pairTogether('encounterClass'),
  ],
});

/** Diagnósticos (`clinical.conditions`). */
export const CONDITION_SCHEMA: KindSchema = clinical({
  kind: 'hc-diagnostico',
  title: 'Historia clínica · diagnósticos',
  description: 'Agrega diagnósticos y problemas al paciente.',
  fields: [
    ...PATIENT_REF_FIELDS,
    ...coded(
      'diagnosis',
      true,
      'el diagnóstico',
      `${CLIN}/conditions.entity.ts#Conditions.codeConceptId`,
      'SINT-DX-0001',
    ),
    {
      name: 'clinicalStatus',
      type: 'enum',
      required: false,
      description: 'Estado clínico',
      example: 'ACTIVE',
      source: `${CLIN}/conditions.entity.ts#Conditions.clinicalStatusConceptId`,
      values: CLINICAL_STATUS,
    },
    {
      name: 'onsetAt',
      type: 'date',
      required: false,
      description: 'Fecha de inicio',
      example: '2023-11-02',
      source: `${CLIN}/conditions.entity.ts#Conditions.onsetAt`,
      notFuture: true,
    },
    {
      name: 'resolvedAt',
      type: 'date',
      required: false,
      description: 'Fecha de resolución (no anterior al inicio)',
      example: '2024-01-10',
      source: `${CLIN}/conditions.entity.ts#Conditions.resolvedAt`,
      notFuture: true,
    },
    {
      name: 'noteText',
      type: 'text',
      required: false,
      description: 'Nota libre del diagnóstico',
      example: 'Nota de ejemplo',
      source: `${CLIN}/conditions.entity.ts#Conditions.noteText`,
      max: 2000,
      sensitive: true,
    },
  ],
  rules: [],
  crossFieldRules: [notBefore('onsetAt', 'resolvedAt')],
});

/** Medicación (`clinical.medication_records`). */
export const MEDICATION_SCHEMA: KindSchema = clinical({
  kind: 'hc-medicacion',
  title: 'Historia clínica · medicación',
  description:
    'Agrega registros de medicación administrada al paciente. No crea recetas ni prescribe.',
  fields: [
    ...PATIENT_REF_FIELDS,
    ...coded(
      'medication',
      true,
      'el medicamento',
      `${CLIN}/medication_records.entity.ts#MedicationRecords.medicationConceptId`,
      'SINT-MED-0001',
    ),
    {
      name: 'doseDecimal',
      type: 'decimal',
      required: false,
      description: 'Dosis administrada (número con punto decimal)',
      example: '500',
      source: `${CLIN}/medication_records.entity.ts#MedicationRecords.doseDecimal`,
      gte: 0,
    },
    ...coded(
      'unit',
      false,
      'la unidad de la dosis',
      `${CLIN}/medication_records.entity.ts#MedicationRecords.unitConceptId`,
      'SINT-UND-0001',
    ),
    {
      name: 'administeredAt',
      type: 'datetime',
      required: true,
      description: 'Momento de la administración (ISO 8601 con zona)',
      example: '2024-03-15T10:45:00-04:00',
      source: `${CLIN}/medication_records.entity.ts#MedicationRecords.administeredAt`,
      notFuture: true,
    },
  ],
  rules: [
    'La dosis es un dato clínico del origen: el motor no la calcula, no la corrige ni la infiere.',
  ],
  crossFieldRules: [
    pairTogether('unit'),
    (row) =>
      row.doseDecimal !== undefined && row.unitCode === undefined
        ? [
            {
              field: 'unitCode',
              code: BulkImportReason.FIELD_COMBINATION_INVALID,
              message: 'Una dosis necesita su unidad (unitSystem + unitCode)',
            },
          ]
        : [],
  ],
});

/** Alergias (`clinical.allergy_intolerances`). */
export const ALLERGY_SCHEMA: KindSchema = clinical({
  kind: 'hc-alergia',
  title: 'Historia clínica · alergias',
  description: 'Agrega alergias e intolerancias al paciente.',
  fields: [
    ...PATIENT_REF_FIELDS,
    ...coded(
      'substance',
      true,
      'la sustancia',
      `${CLIN}/allergy_intolerances.entity.ts#AllergyIntolerances.substanceConceptId`,
      'SINT-SUS-0001',
    ),
    {
      name: 'clinicalStatus',
      type: 'enum',
      required: false,
      description: 'Estado clínico',
      example: 'ACTIVE',
      source: `${CLIN}/allergy_intolerances.entity.ts#AllergyIntolerances.clinicalStatusConceptId`,
      values: CLINICAL_STATUS,
    },
  ],
  rules: [],
});

/** Signos vitales (`clinical.observations`, categoría signos vitales). */
export const VITAL_SIGN_SCHEMA: KindSchema = clinical({
  kind: 'hc-signo-vital',
  title: 'Historia clínica · signos vitales',
  description: 'Agrega mediciones de signos vitales al paciente.',
  fields: [
    ...PATIENT_REF_FIELDS,
    ...coded(
      'vitalSign',
      true,
      'el signo vital',
      `${CLIN}/observations.entity.ts#Observations.codeConceptId`,
      'SINT-SV-0001',
    ),
    {
      name: 'value',
      type: 'decimal',
      required: true,
      description: 'Valor medido (número con punto decimal)',
      example: '36.5',
      source: `${CLIN}/observations.entity.ts#Observations.quantityValue`,
      sensitive: true,
    },
    ...coded(
      'unit',
      true,
      'la unidad',
      `${CLIN}/observations.entity.ts#Observations.quantityUnitConceptId`,
      'SINT-UND-0001',
    ),
    {
      name: 'effectiveAt',
      type: 'datetime',
      required: true,
      description: 'Momento de la medición (ISO 8601 con zona)',
      example: '2024-03-15T10:35:00-04:00',
      source: `${CLIN}/observations.entity.ts#Observations.effectiveStartAt`,
      notFuture: true,
    },
  ],
  rules: [],
});

/** Resultados (`clinical.observations`, categoría laboratorio/estudio). */
export const RESULT_SCHEMA: KindSchema = clinical({
  kind: 'hc-resultado',
  title: 'Historia clínica · resultados',
  description:
    'Agrega resultados de laboratorio o estudios al paciente (valor numérico o texto).',
  fields: [
    ...PATIENT_REF_FIELDS,
    ...coded(
      'test',
      true,
      'la prueba',
      `${CLIN}/observations.entity.ts#Observations.codeConceptId`,
      'SINT-PRUEBA-0001',
    ),
    {
      name: 'valueDecimal',
      type: 'decimal',
      required: false,
      description: 'Resultado numérico (si el resultado es un número)',
      example: '12.5',
      source: `${CLIN}/observations.entity.ts#Observations.valueDecimal`,
      sensitive: true,
    },
    {
      name: 'valueText',
      type: 'text',
      required: false,
      description: 'Resultado en texto (si el resultado no es un número)',
      example: '',
      source: `${CLIN}/observations.entity.ts#Observations.valueText`,
      max: 2000,
      sensitive: true,
    },
    ...coded(
      'unit',
      false,
      'la unidad del resultado numérico',
      `${CLIN}/observations.entity.ts#Observations.quantityUnitConceptId`,
      'SINT-UND-0001',
    ),
    {
      name: 'effectiveAt',
      type: 'datetime',
      required: true,
      description: 'Momento de la toma o del estudio (ISO 8601 con zona)',
      example: '2024-03-15T09:00:00-04:00',
      source: `${CLIN}/observations.entity.ts#Observations.effectiveStartAt`,
      notFuture: true,
    },
  ],
  rules: ['Lleva `valueDecimal` o `valueText`, uno de los dos.'],
  crossFieldRules: [
    pairTogether('unit'),
    (row) => {
      const hasNumber = row.valueDecimal !== undefined;
      const hasText = row.valueText !== undefined;
      if (hasNumber === hasText) {
        return [
          {
            field: hasNumber ? 'valueText' : 'valueDecimal',
            code: BulkImportReason.FIELD_COMBINATION_INVALID,
            message: 'Debe llevar valueDecimal o valueText, y sólo uno',
          },
        ];
      }
      return [];
    },
  ],
});

/** Notas clínicas (`chart.clinical_note_headers` + `clinical_note_versions`). */
export const NOTE_SCHEMA: KindSchema = clinical({
  kind: 'hc-nota',
  title: 'Historia clínica · notas',
  description:
    'Agrega notas de evolución ya firmadas en el origen. Entran como nota de evolución sin modificar el texto.',
  fields: [
    ...PATIENT_REF_FIELDS,
    {
      name: 'authorLicenseNumber',
      type: 'string',
      required: true,
      description:
        'Matrícula del profesional que escribió la nota: el autor debe existir como profesional en esta instalación (la versión de la nota exige un perfil de autor)',
      example: 'MAT-SINT-0001',
      source: `${CHART}/clinical_note_versions.entity.ts#ClinicalNoteVersions.authorProfileId`,
      min: 1,
      max: 100,
      sensitive: true,
    },
    {
      name: 'recordedAt',
      type: 'datetime',
      required: true,
      description: 'Momento en que se escribió la nota en el origen',
      example: '2024-03-15T11:10:00-04:00',
      source: `${CHART}/clinical_note_versions.entity.ts#ClinicalNoteVersions.recordedAt`,
      notFuture: true,
    },
    ...(
      [
        ['chiefComplaintText', 'Motivo de consulta'],
        ['subjectiveText', 'Subjetivo'],
        ['objectiveText', 'Objetivo'],
        ['assessmentText', 'Evaluación'],
        ['planText', 'Plan'],
      ] as const
    ).map(([name, label]): FieldSpec => ({
      name,
      type: 'text',
      required: false,
      description: `${label} (al menos una sección lleva texto)`,
      example: `${label}: texto de ejemplo`,
      source: `${CHART}/clinical_note_versions.entity.ts#ClinicalNoteVersions.${name}`,
      max: 10_000,
      sensitive: true,
    })),
  ],
  rules: ['Al menos una de las secciones de texto debe traer contenido.'],
  crossFieldRules: [
    (row) =>
      [
        'chiefComplaintText',
        'subjectiveText',
        'objectiveText',
        'assessmentText',
        'planText',
      ].some((f) => row[f] !== undefined)
        ? []
        : [
            {
              field: '*',
              code: BulkImportReason.FIELD_COMBINATION_INVALID,
              message: 'La nota necesita al menos una sección con texto',
            },
          ],
  ],
});

/** Todos los tipos de historia clínica. */
export const CLINICAL_SCHEMAS: readonly KindSchema[] = [
  ENCOUNTER_SCHEMA,
  CONDITION_SCHEMA,
  MEDICATION_SCHEMA,
  ALLERGY_SCHEMA,
  VITAL_SIGN_SCHEMA,
  RESULT_SCHEMA,
  NOTE_SCHEMA,
];

/** Pares sistema+código de un esquema clínico (para resolverlos en terminología). */
export function codedPairs(schema: KindSchema): readonly {
  readonly system: string;
  readonly code: string;
  readonly label: string;
}[] {
  const names = new Set(schema.fields.map((f) => f.name));
  return schema.fields
    .filter(
      (f) =>
        f.name.endsWith('System') &&
        names.has(f.name.replace(/System$/, 'Code')),
    )
    .map((f) => {
      const prefix = f.name.replace(/System$/, '');
      return { system: f.name, code: `${prefix}Code`, label: prefix };
    });
}
