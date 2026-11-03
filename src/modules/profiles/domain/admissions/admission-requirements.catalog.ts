import { PROF } from '../../profiles.concepts';
import { deterministicId } from '../../../../common/constants/concepts';

/** Clase de ficha que revisa un requisito. */
export type AdmissionItemType =
  'LICENSE' | 'CREDENTIAL' | 'SPECIALTY' | 'PROFILE';

/** Cómo se presenta la evidencia de un requisito. */
export type AdmissionEvidenceKind = 'DOCUMENT' | 'DATA';

/** Grupo profesional al que puede acotarse un requisito. */
export type ProfessionGroup = 'MEDICO' | 'ODONTOLOGO';

/** Concepto de cada clase de ficha. */
export const ADMISSION_ITEM_CONCEPT: Readonly<
  Record<AdmissionItemType, string>
> = {
  LICENSE: PROF.ADMISSION_ITEM_LICENSE,
  CREDENTIAL: PROF.ADMISSION_ITEM_CREDENTIAL,
  SPECIALTY: PROF.ADMISSION_ITEM_SPECIALTY,
  PROFILE: PROF.ADMISSION_ITEM_PROFILE,
};

/** La clase de ficha de un concepto, o `undefined` si no es una. */
export function admissionItemTypeOf(
  conceptId: string | undefined,
): AdmissionItemType | undefined {
  return (Object.keys(ADMISSION_ITEM_CONCEPT) as AdmissionItemType[]).find(
    (type) => ADMISSION_ITEM_CONCEPT[type] === conceptId,
  );
}

/** Un requisito del catálogo, tal como se siembra. */
export interface AdmissionRequirementSeed {
  readonly code: string;
  readonly label: string;
  readonly description: string;
  readonly itemType: AdmissionItemType;
  readonly itemSubtype?: string;
  readonly evidence: AdmissionEvidenceKind;
  readonly required: boolean;
  readonly requiresSourceUri: boolean;
  readonly professionGroup?: ProfessionGroup;
  readonly minItems?: number;
  readonly maxItems?: number;
  readonly sortOrder: number;
}

/**
 * Requisitos de la admisión ALTA_DE_DOCTOR, tomados del proceso 2.1 del
 * registro de procesos del stakeholder («Registro en la App (Médico nuevo)»).
 * Cada ítem del proceso es un requisito; lo que el proceso no pide no existe
 * salvo el registro del SEDES, que la app ya captura al registrarse y que acá
 * es opcional.
 *
 * El colegio cambia con la profesión (2.1: «cambiar de manera AUTOMÁTICA el
 * nombre del COLEGIO al seleccionar la profesión del doctor»): hay un
 * requisito por colegio, acotado con `professionGroup`.
 */
export const PRACTITIONER_ONBOARDING_REQUIREMENTS: readonly AdmissionRequirementSeed[] =
  [
    {
      code: 'CI',
      label:
        'Cédula de identidad (con terminación del departamento de emisión)',
      description:
        'Número de la cédula y su terminación (SC, LP, CB…). Se compara con el documento de identidad del profesional.',
      itemType: 'PROFILE',
      itemSubtype: 'IDENTITY',
      evidence: 'DATA',
      required: true,
      requiresSourceUri: false,
      sortOrder: 10,
    },
    {
      code: 'MATRICULA_MSALUD',
      label: 'Matrícula del Ministerio de Salud Nacional',
      description:
        'Número de matrícula y su respaldo. Verificar contra el registro del Ministerio y declarar la fuente consultada.',
      itemType: 'LICENSE',
      itemSubtype: 'NATIONAL',
      evidence: 'DOCUMENT',
      required: true,
      requiresSourceUri: true,
      minItems: 1,
      maxItems: 1,
      sortOrder: 20,
    },
    {
      code: 'TITULO_UNIVERSITARIO',
      label: 'Título profesional universitario',
      description:
        'Hasta dos títulos de carrera diferentes (hay profesionales con dos carreras).',
      itemType: 'CREDENTIAL',
      itemSubtype: 'DEGREE',
      evidence: 'DOCUMENT',
      required: true,
      requiresSourceUri: true,
      minItems: 1,
      maxItems: 2,
      sortOrder: 30,
    },
    {
      code: 'DIPLOMADO',
      label: 'Título de diplomado',
      description: 'Opcional. Puede cargar varios.',
      itemType: 'CREDENTIAL',
      itemSubtype: 'DIPLOMA',
      evidence: 'DOCUMENT',
      required: false,
      requiresSourceUri: true,
      sortOrder: 40,
    },
    {
      code: 'MAESTRIA',
      label: 'Título de maestría',
      description: 'Opcional. Puede cargar varias.',
      itemType: 'CREDENTIAL',
      itemSubtype: 'MASTER',
      evidence: 'DOCUMENT',
      required: false,
      requiresSourceUri: true,
      sortOrder: 50,
    },
    {
      code: 'DOCTORADO',
      label: 'Título de doctorado',
      description: 'Opcional. Puede cargar varios.',
      itemType: 'CREDENTIAL',
      itemSubtype: 'DOCTORATE',
      evidence: 'DOCUMENT',
      required: false,
      requiresSourceUri: true,
      sortOrder: 60,
    },
    {
      code: 'TITULO_ESPECIALIDAD',
      label: 'Título de especialidad',
      description: 'Opcional. Puede cargar varios.',
      itemType: 'CREDENTIAL',
      itemSubtype: 'SPECIALTY',
      evidence: 'DOCUMENT',
      required: false,
      requiresSourceUri: true,
      sortOrder: 70,
    },
    {
      code: 'REGISTRO_COLEGIO_MEDICO',
      label: 'Registro del Colegio Médico',
      description:
        'Aplica a médicos. Número de registro, su fecha y el respaldo emitido por el colegio.',
      itemType: 'LICENSE',
      itemSubtype: 'PROFESSIONAL_COLLEGE',
      evidence: 'DOCUMENT',
      required: true,
      requiresSourceUri: true,
      professionGroup: 'MEDICO',
      minItems: 1,
      maxItems: 1,
      sortOrder: 80,
    },
    {
      code: 'REGISTRO_COLEGIO_ODONTOLOGOS',
      label: 'Registro del Colegio de Odontólogos',
      description:
        'Aplica a odontólogos. Número de registro, su fecha y el respaldo emitido por el colegio.',
      itemType: 'LICENSE',
      itemSubtype: 'PROFESSIONAL_COLLEGE',
      evidence: 'DOCUMENT',
      required: true,
      requiresSourceUri: true,
      professionGroup: 'ODONTOLOGO',
      minItems: 1,
      maxItems: 1,
      sortOrder: 90,
    },
    {
      code: 'ESPECIALIDADES_DECLARADAS',
      label: 'Especialidades declaradas',
      description:
        'Hasta tres. Se comparan con el título de especialidad que las respalda.',
      itemType: 'SPECIALTY',
      evidence: 'DATA',
      required: false,
      requiresSourceUri: false,
      maxItems: 3,
      sortOrder: 100,
    },
    {
      code: 'UBICACION_CONSULTORIOS',
      label: 'Ubicación de los consultorios de atención',
      description:
        'Dirección y ubicación GPS de cada consultorio declarado en el alta.',
      itemType: 'PROFILE',
      itemSubtype: 'PRACTICE_SITES',
      evidence: 'DATA',
      required: false,
      requiresSourceUri: false,
      sortOrder: 110,
    },
    {
      code: 'REGISTRO_SEDES',
      label: 'Registro del SEDES',
      description:
        'Registro ante el Servicio Departamental de Salud, que la app ya captura al registrarse.',
      itemType: 'LICENSE',
      itemSubtype: 'SEDES',
      evidence: 'DOCUMENT',
      required: false,
      requiresSourceUri: true,
      maxItems: 1,
      sortOrder: 120,
    },
  ];

/** Id determinista de un requisito del catálogo de ALTA_DE_DOCTOR. */
export function requirementId(typeKey: string, code: string): string {
  return deterministicId(`profiles:admission-requirement:${typeKey}:${code}`);
}

/** Subtipo de matrícula a partir de su jurisdicción. */
export function licenseSubtype(
  jurisdictionConceptId: string,
): 'NATIONAL' | 'PROFESSIONAL_COLLEGE' | 'SEDES' {
  if (jurisdictionConceptId === PROF.JURISDICTION_PROFESSIONAL_COLLEGE) {
    return 'PROFESSIONAL_COLLEGE';
  }
  const sedes: readonly string[] = [
    PROF.JURISDICTION_SEDES_SANTA_CRUZ,
    PROF.JURISDICTION_SEDES_LA_PAZ,
    PROF.JURISDICTION_SEDES_COCHABAMBA,
    PROF.JURISDICTION_SEDES_ORURO,
    PROF.JURISDICTION_SEDES_POTOSI,
    PROF.JURISDICTION_SEDES_CHUQUISACA,
    PROF.JURISDICTION_SEDES_TARIJA,
    PROF.JURISDICTION_SEDES_BENI,
    PROF.JURISDICTION_SEDES_PANDO,
  ];
  if (sedes.includes(jurisdictionConceptId)) return 'SEDES';
  // Cualquier otra jurisdicción (la nacional y las que un administrador cargue)
  // se revisa como la matrícula del Ministerio: no hay habilitación sin revisar.
  return 'NATIONAL';
}

/** Subtipo de título a partir de su tipo de credencial. */
export function credentialSubtype(
  credentialTypeConceptId: string,
): 'DEGREE' | 'DIPLOMA' | 'MASTER' | 'DOCTORATE' | 'SPECIALTY' {
  switch (credentialTypeConceptId) {
    case PROF.CREDENTIAL_TYPE_DIPLOMA:
      return 'DIPLOMA';
    case PROF.CREDENTIAL_TYPE_MASTER:
      return 'MASTER';
    case PROF.CREDENTIAL_TYPE_DOCTORATE:
      return 'DOCTORATE';
    case PROF.CREDENTIAL_TYPE_SPECIALTY:
      return 'SPECIALTY';
    default:
      return 'DEGREE';
  }
}

/**
 * Grupo profesional a partir de los nombres de las profesiones que acreditan
 * sus títulos (COB-2023) y del título declarado. Odontólogo si alguno nombra la
 * odontología o a los dentistas (sin contar a los auxiliares); en cualquier
 * otro caso, médico: es el grupo por omisión del alta de doctor.
 */
export function resolveProfessionGroup(
  professionNames: readonly (string | undefined | null)[],
): ProfessionGroup {
  for (const raw of professionNames) {
    if (!raw) continue;
    const name = raw
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase();
    if (/auxiliar|ayudante|asistente/.test(name)) continue;
    if (/odont|dentist/.test(name)) return 'ODONTOLOGO';
  }
  return 'MEDICO';
}
