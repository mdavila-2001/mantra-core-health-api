import { deterministicId } from '../constants/concepts';

/**
 * Las especialidades y subespecialidades médicas, odontológicas y de otras
 * disciplinas de salud que **faltan** en `VS_MEDICAL_SPECIALTY`.
 *
 * ## Por qué existe
 *
 * El cliente pidió (26/10/2026) que el catálogo de especialidades tuviera la
 * máxima amplitud: con las 63 que trae el paquete del modelo, un neurocirujano,
 * un cirujano plástico, un cardiólogo intervencionista o una periodoncista
 * forense no tenían qué elegir al registrarse, y la guía los dejaba bajo «Sin
 * especialidad registrada». El propio repo ya lo había medido:
 * `docs/seed-research/specialty-services.md` («Huecos») lista las que nombran
 * el arancel de Santa Cruz, FONASA y CUPS y el modelo no tiene, y
 * `observed-specialties.dataset.json` cuenta cientos de médicos de las redes de
 * Alianza y Nacional con especialidades fuera del catálogo (Neurocirugía: 318
 * apariciones; Cirugía Plástica: 239; Mastología: 39).
 *
 * ## Por qué es una lista aparte y no una edición de los datasets
 *
 * - `VS_MEDICAL_SPECIALTY` es del **paquete del modelo**
 *   (`seedsGenerales/modules/03_terminology.seeds.json`), que vive en otro
 *   repositorio. Esta lista no reemplaza ninguno de sus 63 conceptos ni los
 *   reordena: **suma miembros** a la versión vigente del conjunto
 *   (`BoMedicalSpecialtiesSeedService`).
 * - `dental-specialties.dataset.json` y `observed-specialties.dataset.json` son
 *   **extracciones** de documentos del stakeholder que genera
 *   `tools/bolivia-datasets/extract_datasets.py`. Editarlos a mano los
 *   desalinearía del markdown de origen y `extract_datasets.py --check` los
 *   reescribiría. Por eso la ampliación vive acá, curada, y esos archivos
 *   quedan como están.
 *
 * ## Qué NO está, a propósito
 *
 * Nada que el modelo ya declare con otro nombre, porque dos conceptos para la
 * misma especialidad parten a los profesionales en dos filtros de la guía:
 *
 * - «Oncología Médica / Clínica» → es `ONCOLOGIA`.
 * - «Medicina Crítica y Terapia Intensiva» → es `MEDICINA_INTENSIVA`.
 * - «Algología» → es `MEDICINA_DEL_DOLOR`.
 * - «Emergenciología» → es `MEDICINA_EMERGENCIA`.
 * - «Prostodoncia» → es `REHABILITACION_ORAL` (en Bolivia, una sola carrera).
 * - «Medicina del Trabajo», «Medicina del Deporte», «Medicina Física y
 *   Rehabilitación», «Neonatología», «Medicina Materno Fetal», «Oncología
 *   Ginecológica», «Cirugía Oncológica», «Coloproctología» → ya están.
 *
 * Tampoco hay medicinas alternativas (CUPS las trae: ayurveda, homeopatía,
 * naturopatía): no son especialidades médicas reconocidas en Bolivia.
 *
 * ## Invariantes
 *
 * - `code` es la clave natural: el id del concepto deriva de él, así que **no
 *   se renombra**. Una corrección de nombre va en `display`.
 * - Ningún `code` repite uno del modelo (lo comprueba la prueba contra
 *   `data/specialty-services/model-specialties.json`).
 * - `parentCode`, si está, nombra una especialidad del modelo o de esta misma
 *   lista: es la especialidad troncal de la que la subespecialidad deriva.
 */

/** Código interno del conjunto al que se suman los miembros (el del modelo). */
export const MEDICAL_SPECIALTY_VALUE_SET = 'VS_MEDICAL_SPECIALTY';

/** Disciplina de la especialidad: médica, odontológica u otra profesión de salud. */
export type BoSpecialtyDiscipline = 'MEDICA' | 'ODONTOLOGICA' | 'SALUD';

/** Una especialidad del catálogo ampliado. */
export interface BoMedicalSpecialtySeed {
  /** Clave estable en mayúsculas, con el mismo estilo que los códigos del modelo. */
  readonly code: string;
  /** Nombre en castellano, como lo escribe un título de especialidad. */
  readonly display: string;
  /** Disciplina a la que pertenece. */
  readonly discipline: BoSpecialtyDiscipline;
  /** Especialidad troncal, cuando es una subespecialidad. */
  readonly parentCode?: string;
}

/** Propiedad de concepto con la disciplina (`MEDICA`, `ODONTOLOGICA`, `SALUD`). */
export const BO_SPECIALTY_DISCIPLINE_PROPERTY_CODE =
  'bo-medical-specialty:discipline';

/** Propiedad de concepto con el código de la especialidad troncal. */
export const BO_SPECIALTY_PARENT_PROPERTY_CODE = 'bo-medical-specialty:parent';

const M = 'MEDICA' as const;
const O = 'ODONTOLOGICA' as const;
const S = 'SALUD' as const;

/**
 * Las especialidades que se suman. Agrupadas por tronco para leerlas; el orden
 * de la expansión no sale de acá sino del nombre (ver el seed).
 *
 * Donde una red del stakeholder ya escribe la especialidad, `display` usa ese
 * mismo nombre («Cirugía Plástica, Estética y Reconstructiva», «Mastología»,
 * «Cirugía Laparoscópica»): `DirectoryNetworksSeedService` mapea por nombre
 * normalizado, y así esos médicos caen en su especialidad.
 */
export const BO_MEDICAL_SPECIALTIES: readonly BoMedicalSpecialtySeed[] = [
  // --- Medicina interna y sus subespecialidades clínicas ---
  {
    code: 'CARDIOLOGIA_INTERVENCIONISTA',
    display: 'Cardiología Intervencionista y Hemodinamia',
    discipline: M,
    parentCode: 'CARDIOLOGIA',
  },
  {
    code: 'ELECTROFISIOLOGIA_CARDIACA',
    display: 'Electrofisiología Cardíaca y Arritmias',
    discipline: M,
    parentCode: 'CARDIOLOGIA',
  },
  {
    code: 'IMAGEN_CARDIOVASCULAR',
    display: 'Ecocardiografía e Imagen Cardiovascular',
    discipline: M,
    parentCode: 'CARDIOLOGIA',
  },
  {
    code: 'HEPATOLOGIA',
    display: 'Hepatología',
    discipline: M,
    parentCode: 'GASTROENTEROLOGIA',
  },
  {
    code: 'ENDOSCOPIA_DIGESTIVA',
    display: 'Endoscopía Digestiva',
    discipline: M,
    parentCode: 'GASTROENTEROLOGIA',
  },
  {
    code: 'DIABETOLOGIA',
    display: 'Diabetología',
    discipline: M,
    parentCode: 'ENDOCRINOLOGIA',
  },
  {
    code: 'NEUMOLOGIA_INTERVENCIONISTA',
    display: 'Neumología Intervencionista y Broncoscopía',
    discipline: M,
    parentCode: 'NEUMOLOGIA',
  },
  {
    code: 'ALERGOLOGIA',
    display: 'Alergología',
    discipline: M,
  },
  {
    code: 'INMUNOLOGIA_CLINICA',
    display: 'Inmunología Clínica',
    discipline: M,
  },
  {
    code: 'ONCOHEMATOLOGIA',
    display: 'Oncohematología',
    discipline: M,
    parentCode: 'HEMATOLOGIA',
  },
  {
    code: 'MEDICINA_TRANSFUSIONAL',
    display: 'Hemoterapia y Medicina Transfusional',
    discipline: M,
    parentCode: 'HEMATOLOGIA',
  },
  {
    code: 'NUTRIOLOGIA_CLINICA',
    display: 'Nutriología Clínica',
    discipline: M,
  },
  {
    code: 'MEDICINA_TROPICAL',
    display: 'Medicina Tropical',
    discipline: M,
    parentCode: 'INFECTOLOGIA',
  },
  {
    code: 'TOXICOLOGIA_CLINICA',
    display: 'Toxicología Clínica',
    discipline: M,
  },
  {
    code: 'GENETICA_MEDICA',
    display: 'Genética Médica',
    discipline: M,
  },
  {
    code: 'CUIDADOS_PALIATIVOS',
    display: 'Medicina Paliativa y Cuidados Paliativos',
    discipline: M,
  },
  {
    code: 'MEDICINA_DEL_SUENO',
    display: 'Medicina del Sueño',
    discipline: M,
  },
  {
    code: 'MEDICINA_HIPERBARICA',
    display: 'Medicina Hiperbárica y Subacuática',
    discipline: M,
  },
  {
    code: 'MEDICINA_AEROESPACIAL',
    display: 'Medicina Aeroespacial',
    discipline: M,
  },
  {
    code: 'MEDICINA_ESTETICA',
    display: 'Medicina Estética',
    discipline: M,
  },
  {
    code: 'SEXOLOGIA_CLINICA',
    display: 'Sexología Clínica',
    discipline: M,
  },
  {
    code: 'MEDICINA_DEL_ADOLESCENTE',
    display: 'Medicina del Adolescente',
    discipline: M,
    parentCode: 'PEDIATRIA',
  },

  // --- Neurología y salud mental ---
  {
    code: 'NEUROFISIOLOGIA_CLINICA',
    display: 'Neurofisiología Clínica',
    discipline: M,
    parentCode: 'NEUROLOGIA',
  },
  {
    code: 'PSIQUIATRIA_INFANTIL',
    display: 'Psiquiatría Infantil y de la Adolescencia',
    discipline: M,
    parentCode: 'PSIQUIATRIA',
  },
  {
    code: 'PSICOGERIATRIA',
    display: 'Psicogeriatría',
    discipline: M,
    parentCode: 'PSIQUIATRIA',
  },
  {
    code: 'PSIQUIATRIA_ADICCIONES',
    display: 'Psiquiatría de las Adicciones',
    discipline: M,
    parentCode: 'PSIQUIATRIA',
  },

  // --- Pediatría y sus subespecialidades ---
  {
    code: 'ENDOCRINOLOGIA_PEDIATRICA',
    display: 'Endocrinología Pediátrica',
    discipline: M,
    parentCode: 'PEDIATRIA',
  },
  {
    code: 'GASTROENTEROLOGIA_PEDIATRICA',
    display: 'Gastroenterología Pediátrica',
    discipline: M,
    parentCode: 'PEDIATRIA',
  },
  {
    code: 'NEUMOLOGIA_PEDIATRICA',
    display: 'Neumología Pediátrica',
    discipline: M,
    parentCode: 'PEDIATRIA',
  },
  {
    code: 'NEFROLOGIA_PEDIATRICA',
    display: 'Nefrología Pediátrica',
    discipline: M,
    parentCode: 'PEDIATRIA',
  },
  {
    code: 'HEMATOLOGIA_PEDIATRICA',
    display: 'Hematología Pediátrica',
    discipline: M,
    parentCode: 'PEDIATRIA',
  },
  {
    code: 'REUMATOLOGIA_PEDIATRICA',
    display: 'Reumatología Pediátrica',
    discipline: M,
    parentCode: 'PEDIATRIA',
  },
  {
    code: 'ALERGOLOGIA_PEDIATRICA',
    display: 'Alergia e Inmunología Pediátrica',
    discipline: M,
    parentCode: 'PEDIATRIA',
  },
  {
    code: 'DERMATOLOGIA_PEDIATRICA',
    display: 'Dermatología Pediátrica',
    discipline: M,
    parentCode: 'DERMATOLOGIA',
  },
  {
    code: 'EMERGENCIAS_PEDIATRICAS',
    display: 'Emergencias Pediátricas',
    discipline: M,
    parentCode: 'PEDIATRIA',
  },
  {
    code: 'NUTRICION_PEDIATRICA',
    display: 'Nutrición Clínica Pediátrica',
    discipline: M,
    parentCode: 'PEDIATRIA',
  },
  {
    code: 'PEDIATRIA_DESARROLLO',
    display: 'Pediatría del Desarrollo y la Conducta',
    discipline: M,
    parentCode: 'PEDIATRIA',
  },
  {
    code: 'GENETICA_PEDIATRICA',
    display: 'Genética Clínica Pediátrica',
    discipline: M,
    parentCode: 'GENETICA_MEDICA',
  },
  {
    code: 'CUIDADOS_PALIATIVOS_PEDIATRICOS',
    display: 'Cuidados Paliativos Pediátricos',
    discipline: M,
    parentCode: 'CUIDADOS_PALIATIVOS',
  },
  {
    code: 'RADIOLOGIA_PEDIATRICA',
    display: 'Radiología Pediátrica',
    discipline: M,
    parentCode: 'RADIOLOGIA',
  },
  {
    code: 'ANESTESIOLOGIA_PEDIATRICA',
    display: 'Anestesiología Pediátrica',
    discipline: M,
    parentCode: 'ANESTESIOLOGIA',
  },
  {
    code: 'OFTALMOLOGIA_PEDIATRICA',
    display: 'Oftalmología Pediátrica',
    discipline: M,
    parentCode: 'OFTALMOLOGIA',
  },
  {
    code: 'OTORRINOLARINGOLOGIA_PEDIATRICA',
    display: 'Otorrinolaringología Pediátrica',
    discipline: M,
    parentCode: 'OTORRINOLARINGOLOGIA',
  },
  {
    code: 'UROLOGIA_PEDIATRICA',
    display: 'Urología Pediátrica',
    discipline: M,
    parentCode: 'UROLOGIA',
  },
  {
    code: 'NEUROCIRUGIA_PEDIATRICA',
    display: 'Neurocirugía Pediátrica',
    discipline: M,
    parentCode: 'NEUROCIRUGIA',
  },
  {
    code: 'CIRUGIA_CARDIOVASCULAR_PEDIATRICA',
    display: 'Cirugía Cardiovascular Pediátrica',
    discipline: M,
    parentCode: 'CIRUGIA_CARDIOVASCULAR',
  },

  // --- Ginecología, obstetricia y mama ---
  {
    code: 'MEDICINA_REPRODUCTIVA',
    display: 'Medicina Reproductiva y Fertilidad',
    discipline: M,
    parentCode: 'GINECOLOGIA_OBSTETRICIA',
  },
  {
    code: 'UROGINECOLOGIA',
    display: 'Uroginecología y Piso Pélvico',
    discipline: M,
    parentCode: 'GINECOLOGIA_OBSTETRICIA',
  },
  {
    code: 'ENDOCRINOLOGIA_GINECOLOGICA',
    display: 'Endocrinología Ginecológica y Climaterio',
    discipline: M,
    parentCode: 'GINECOLOGIA_OBSTETRICIA',
  },
  {
    code: 'GINECOLOGIA_ENDOSCOPICA',
    display: 'Cirugía Ginecológica Endoscópica',
    discipline: M,
    parentCode: 'GINECOLOGIA_OBSTETRICIA',
  },
  {
    code: 'GINECOLOGIA_INFANTO_JUVENIL',
    display: 'Ginecología Infanto-Juvenil',
    discipline: M,
    parentCode: 'GINECOLOGIA_OBSTETRICIA',
  },
  {
    code: 'COLPOSCOPIA',
    display: 'Patología del Tracto Genital Inferior y Colposcopía',
    discipline: M,
    parentCode: 'GINECOLOGIA_OBSTETRICIA',
  },
  {
    code: 'MASTOLOGIA',
    display: 'Mastología',
    discipline: M,
  },

  // --- Especialidades quirúrgicas ---
  {
    code: 'NEUROCIRUGIA',
    display: 'Neurocirugía',
    discipline: M,
  },
  {
    code: 'CIRUGIA_CARDIOVASCULAR',
    display: 'Cirugía Cardiovascular',
    discipline: M,
  },
  {
    code: 'CIRUGIA_TORACICA',
    display: 'Cirugía Torácica',
    discipline: M,
  },
  {
    code: 'CIRUGIA_VASCULAR',
    display: 'Cirugía Vascular',
    discipline: M,
  },
  {
    code: 'CIRUGIA_PLASTICA',
    display: 'Cirugía Plástica, Estética y Reconstructiva',
    discipline: M,
  },
  {
    code: 'CIRUGIA_CABEZA_CUELLO',
    display: 'Cirugía de Cabeza y Cuello',
    discipline: M,
  },
  {
    code: 'CIRUGIA_HEPATOBILIOPANCREATICA',
    display: 'Cirugía Hepatobiliopancreática',
    discipline: M,
    parentCode: 'CIRUGIA_GENERAL',
  },
  {
    code: 'CIRUGIA_BARIATRICA',
    display: 'Cirugía Bariátrica y Metabólica',
    discipline: M,
    parentCode: 'CIRUGIA_GENERAL',
  },
  {
    code: 'CIRUGIA_LAPAROSCOPICA',
    display: 'Cirugía Laparoscópica',
    discipline: M,
    parentCode: 'CIRUGIA_GENERAL',
  },
  {
    code: 'CIRUGIA_TRASPLANTES',
    display: 'Cirugía de Trasplantes',
    discipline: M,
  },
  {
    code: 'CIRUGIA_QUEMADOS',
    display: 'Cirugía de Quemados',
    discipline: M,
    parentCode: 'CIRUGIA_PLASTICA',
  },
  {
    code: 'CIRUGIA_MANO',
    display: 'Cirugía de la Mano',
    discipline: M,
    parentCode: 'TRAUMATOLOGIA',
  },
  {
    code: 'CIRUGIA_COLUMNA',
    display: 'Cirugía de Columna',
    discipline: M,
    parentCode: 'TRAUMATOLOGIA',
  },
  {
    code: 'ARTROSCOPIA',
    display: 'Artroscopía y Cirugía Articular',
    discipline: M,
    parentCode: 'TRAUMATOLOGIA',
  },
  {
    code: 'CIRUGIA_PIE_TOBILLO',
    display: 'Cirugía de Pie y Tobillo',
    discipline: M,
    parentCode: 'TRAUMATOLOGIA',
  },
  {
    code: 'ANDROLOGIA',
    display: 'Andrología',
    discipline: M,
    parentCode: 'UROLOGIA',
  },
  {
    code: 'ANESTESIOLOGIA_CARDIOVASCULAR',
    display: 'Anestesiología Cardiovascular',
    discipline: M,
    parentCode: 'ANESTESIOLOGIA',
  },
  {
    code: 'ANESTESIA_OBSTETRICA',
    display: 'Anestesiología Obstétrica',
    discipline: M,
    parentCode: 'ANESTESIOLOGIA',
  },

  // --- Oftalmología ---
  {
    code: 'RETINA_VITREO',
    display: 'Retina y Vítreo',
    discipline: M,
    parentCode: 'OFTALMOLOGIA',
  },
  {
    code: 'GLAUCOMA',
    display: 'Glaucoma',
    discipline: M,
    parentCode: 'OFTALMOLOGIA',
  },
  {
    code: 'CORNEA_SUPERFICIE_OCULAR',
    display: 'Córnea y Superficie Ocular',
    discipline: M,
    parentCode: 'OFTALMOLOGIA',
  },
  {
    code: 'CIRUGIA_REFRACTIVA',
    display: 'Cirugía Refractiva y de Catarata',
    discipline: M,
    parentCode: 'OFTALMOLOGIA',
  },
  {
    code: 'OCULOPLASTICA',
    display: 'Órbita y Oculoplástica',
    discipline: M,
    parentCode: 'OFTALMOLOGIA',
  },
  {
    code: 'NEUROOFTALMOLOGIA',
    display: 'Neurooftalmología',
    discipline: M,
    parentCode: 'OFTALMOLOGIA',
  },
  {
    code: 'UVEITIS',
    display: 'Uveítis e Inflamación Ocular',
    discipline: M,
    parentCode: 'OFTALMOLOGIA',
  },
  {
    code: 'ESTRABISMO',
    display: 'Estrabismo',
    discipline: M,
    parentCode: 'OFTALMOLOGIA',
  },

  // --- Otorrinolaringología ---
  {
    code: 'OTOLOGIA',
    display: 'Otología y Otoneurología',
    discipline: M,
    parentCode: 'OTORRINOLARINGOLOGIA',
  },
  {
    code: 'RINOLOGIA',
    display: 'Rinología y Cirugía de Base de Cráneo',
    discipline: M,
    parentCode: 'OTORRINOLARINGOLOGIA',
  },
  {
    code: 'LARINGOLOGIA',
    display: 'Laringología y Voz',
    discipline: M,
    parentCode: 'OTORRINOLARINGOLOGIA',
  },
  {
    code: 'FONIATRIA',
    display: 'Foniatría',
    discipline: M,
    parentCode: 'OTORRINOLARINGOLOGIA',
  },

  // --- Dermatología ---
  {
    code: 'DERMATOPATOLOGIA',
    display: 'Dermatopatología',
    discipline: M,
    parentCode: 'DERMATOLOGIA',
  },
  {
    code: 'CIRUGIA_DERMATOLOGICA',
    display: 'Cirugía Dermatológica y Dermato-oncología',
    discipline: M,
    parentCode: 'DERMATOLOGIA',
  },

  // --- Diagnóstico por imagen, oncología radiante y laboratorio ---
  {
    code: 'RADIOLOGIA_INTERVENCIONISTA',
    display: 'Radiología Intervencionista',
    discipline: M,
    parentCode: 'RADIOLOGIA',
  },
  {
    code: 'NEURORRADIOLOGIA',
    display: 'Neurorradiología',
    discipline: M,
    parentCode: 'RADIOLOGIA',
  },
  {
    code: 'MEDICINA_NUCLEAR',
    display: 'Medicina Nuclear',
    discipline: M,
  },
  {
    code: 'RADIOTERAPIA',
    display: 'Radioterapia Oncológica',
    discipline: M,
  },
  {
    code: 'CITOPATOLOGIA',
    display: 'Citopatología',
    discipline: M,
    parentCode: 'ANATOMIA_PATOLOGICA',
  },

  // --- Salud pública, medicina legal y gestión ---
  {
    code: 'SALUD_PUBLICA',
    display: 'Salud Pública',
    discipline: M,
  },
  {
    code: 'EPIDEMIOLOGIA',
    display: 'Epidemiología',
    discipline: M,
    parentCode: 'SALUD_PUBLICA',
  },
  {
    code: 'MEDICINA_LEGAL',
    display: 'Medicina Legal y Forense',
    discipline: M,
  },
  {
    code: 'AUDITORIA_MEDICA',
    display: 'Auditoría Médica',
    discipline: M,
  },
  {
    code: 'ADMINISTRACION_HOSPITALARIA',
    display: 'Administración Hospitalaria y Gestión en Salud',
    discipline: M,
  },

  // --- Odontología ---
  {
    code: 'PATOLOGIA_BUCAL',
    display: 'Patología Bucal y Maxilofacial',
    discipline: O,
    parentCode: 'ODONTOLOGIA',
  },
  {
    code: 'ESTOMATOLOGIA',
    display: 'Estomatología y Medicina Bucal',
    discipline: O,
    parentCode: 'ODONTOLOGIA',
  },
  {
    code: 'RADIOLOGIA_ORAL',
    display: 'Radiología Oral y Maxilofacial',
    discipline: O,
    parentCode: 'ODONTOLOGIA',
  },
  {
    code: 'ODONTOLOGIA_FORENSE',
    display: 'Odontología Legal y Forense',
    discipline: O,
    parentCode: 'ODONTOLOGIA',
  },
  {
    code: 'ODONTOGERIATRIA',
    display: 'Odontogeriatría',
    discipline: O,
    parentCode: 'ODONTOLOGIA',
  },
  {
    code: 'ORTOPEDIA_MAXILAR',
    display: 'Ortopedia Funcional de los Maxilares',
    discipline: O,
    parentCode: 'ODONTOLOGIA',
  },
  {
    code: 'TRASTORNOS_TEMPOROMANDIBULARES',
    display: 'Trastornos Temporomandibulares y Dolor Orofacial',
    discipline: O,
    parentCode: 'ODONTOLOGIA',
  },
  {
    code: 'ODONTOLOGIA_SALUD_PUBLICA',
    display: 'Odontología en Salud Pública',
    discipline: O,
    parentCode: 'ODONTOLOGIA',
  },
  {
    code: 'AUDITORIA_ODONTOLOGICA',
    display: 'Auditoría Odontológica',
    discipline: O,
    parentCode: 'ODONTOLOGIA',
  },
  {
    code: 'OPERATORIA_DENTAL',
    display: 'Operatoria Dental y Biomateriales',
    discipline: O,
    parentCode: 'ODONTOLOGIA',
  },
  {
    code: 'ODONTOLOGIA_PACIENTES_ESPECIALES',
    display: 'Odontología para Pacientes con Necesidades Especiales',
    discipline: O,
    parentCode: 'ODONTOLOGIA',
  },
  {
    code: 'ODONTOLOGIA_HOSPITALARIA',
    display: 'Odontología Hospitalaria',
    discipline: O,
    parentCode: 'ODONTOLOGIA',
  },
  {
    code: 'PROTESIS_BUCOMAXILOFACIAL',
    display: 'Prótesis Bucomaxilofacial',
    discipline: O,
    parentCode: 'REHABILITACION_ORAL',
  },

  // --- Otras profesiones de salud ---
  // El conjunto ya incluye profesiones que no son especialidades médicas
  // (Enfermería, Fisioterapia, Psicología Clínica, Nutrición, Bioquímica). Éstas
  // son las que las redes del stakeholder y los nomencladores nombran y faltan.
  {
    code: 'FONOAUDIOLOGIA',
    display: 'Fonoaudiología',
    discipline: S,
  },
  {
    code: 'TERAPIA_OCUPACIONAL',
    display: 'Terapia Ocupacional',
    discipline: S,
  },
  {
    code: 'OPTOMETRIA',
    display: 'Optometría',
    discipline: S,
  },
];

/** Clave de concepto: prefijada por el dominio, como el resto del catálogo interno. */
export function boSpecialtyConceptCode(code: string): string {
  return `bo-medical-specialty:${code}`;
}

/** Id determinista del concepto de una especialidad. */
export function boSpecialtyConceptId(code: string): string {
  return deterministicId(`bo-medical-specialties:concept:${code}`);
}

/** Id determinista de su designación preferida en castellano. */
export function boSpecialtyDesignationId(code: string): string {
  return deterministicId(`bo-medical-specialties:designation:es:${code}`);
}

/** Id determinista de una propiedad del concepto. */
export function boSpecialtyPropertyId(
  code: string,
  propertyCode: string,
): string {
  return deterministicId(
    `bo-medical-specialties:property:${propertyCode}:${code}`,
  );
}

/**
 * Id determinista de la membresía, **por versión**: si el modelo publica una
 * versión nueva del conjunto, la ampliación se vuelve a sumar a ésa con ids
 * propios en vez de chocar con los de la anterior.
 */
export function boSpecialtyMemberId(versionId: string, code: string): string {
  return deterministicId(`bo-medical-specialties:member:${versionId}:${code}`);
}

/**
 * Forma comparable de un nombre: sin tildes, sin signos, en minúsculas. Es la
 * misma normalización que usa `DirectoryNetworksSeedService` para mapear.
 */
export function normalizeSpecialtyName(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}
