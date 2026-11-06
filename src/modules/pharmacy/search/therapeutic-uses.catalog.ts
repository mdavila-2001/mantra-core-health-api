/**
 * What a medication is used for, derived **only** from its ATC code.
 *
 * ## Source and limits (B-13)
 *
 * The LINAME carries no indications, and B-13 forbids clinical content backed
 * by a source that does not publish it. The WHO ATC classification does
 * publish one thing: the therapeutic group each substance belongs to. Each
 * entry below is a plain-language label for an ATC group, plus the words a
 * patient types when looking for that group («dolor abdominal», «cólico»).
 *
 * It is a classification, not a prescription: it says «this belongs to the
 * group used for X», never «take this for X». The screen labels it that way.
 * An entry may only point to ATC prefixes, never to a single brand.
 */

/** One therapeutic use: a label, the words that find it, and its ATC groups. */
export interface TherapeuticUse {
  /** Label shown on the card («Dolor abdominal y cólicos»). */
  readonly label: string;
  /** Phrases a patient types to look for it (normalized at load time). */
  readonly terms: readonly string[];
  /** ATC prefixes (any level) of the groups this use covers. */
  readonly atc: readonly string[];
}

export const THERAPEUTIC_USES: readonly TherapeuticUse[] = [
  {
    label: 'Dolor abdominal y cólicos',
    atc: ['A03A', 'A03B'],
    terms: [
      'dolor abdominal',
      'dolor de estomago',
      'dolor de barriga',
      'dolor de panza',
      'dolor de vientre',
      'colico',
      'colicos',
      'retorcijon',
      'espasmo',
      'espasmos',
      'antiespasmodico',
      'abdomen',
    ],
  },
  {
    label: 'Gases e hinchazón abdominal',
    atc: ['A03AX13'],
    terms: [
      'gases',
      'flatulencia',
      'hinchazon abdominal',
      'meteorismo',
      'barriga hinchada',
      'panza hinchada',
      'inflamacion abdominal',
    ],
  },
  {
    label: 'Acidez, reflujo y gastritis',
    atc: ['A02'],
    terms: [
      'acidez',
      'agruras',
      'reflujo',
      'gastritis',
      'ulcera',
      'ardor de estomago',
      'antiacido',
      'dispepsia',
      'indigestion',
    ],
  },
  {
    label: 'Náuseas y vómitos',
    atc: ['A03F', 'A04'],
    terms: [
      'nauseas',
      'vomito',
      'vomitos',
      'ganas de vomitar',
      'antiemetico',
      'mareo',
    ],
  },
  {
    label: 'Diarrea',
    atc: ['A07'],
    terms: ['diarrea', 'antidiarreico', 'deposiciones liquidas', 'suero oral'],
  },
  {
    label: 'Estreñimiento',
    atc: ['A06'],
    terms: ['estrenimiento', 'constipacion', 'laxante'],
  },
  {
    label: 'Diabetes',
    atc: ['A10'],
    terms: [
      'diabetes',
      'azucar en la sangre',
      'glucosa',
      'glicemia',
      'insulina',
      'antidiabetico',
    ],
  },
  {
    label: 'Vitaminas y minerales',
    atc: ['A11', 'A12'],
    terms: ['vitamina', 'vitaminas', 'suplemento', 'calcio', 'minerales'],
  },
  {
    label: 'Anemia',
    atc: ['B03'],
    terms: ['anemia', 'hierro', 'antianemico', 'acido folico'],
  },
  {
    label: 'Coágulos y trombosis',
    atc: ['B01'],
    terms: [
      'coagulos',
      'trombosis',
      'anticoagulante',
      'sangre espesa',
      'antiagregante',
    ],
  },
  {
    label: 'Corazón: arritmia e insuficiencia',
    atc: ['C01'],
    terms: [
      'corazon',
      'arritmia',
      'insuficiencia cardiaca',
      'angina',
      'dolor de pecho',
    ],
  },
  {
    label: 'Presión alta',
    atc: ['C02', 'C03', 'C07', 'C08', 'C09'],
    terms: [
      'presion alta',
      'hipertension',
      'tension alta',
      'antihipertensivo',
      'presion arterial',
    ],
  },
  {
    label: 'Retención de líquidos',
    atc: ['C03'],
    terms: [
      'retencion de liquidos',
      'edema',
      'diuretico',
      'hinchazon de piernas',
      'pies hinchados',
    ],
  },
  {
    label: 'Hemorroides y várices',
    atc: ['C05'],
    terms: ['hemorroides', 'almorranas', 'varices'],
  },
  {
    label: 'Colesterol y triglicéridos',
    atc: ['C10'],
    terms: [
      'colesterol',
      'trigliceridos',
      'grasa en la sangre',
      'hipolipemiante',
    ],
  },
  {
    label: 'Hongos',
    atc: ['D01', 'G01', 'J02'],
    terms: [
      'hongos',
      'micosis',
      'pie de atleta',
      'candidiasis',
      'antimicotico',
      'antifungico',
    ],
  },
  {
    label: 'Piel: dermatitis y eccema',
    atc: ['D07', 'D04'],
    terms: [
      'dermatitis',
      'eccema',
      'irritacion de la piel',
      'picazon de la piel',
      'sarpullido',
      'piel',
    ],
  },
  {
    label: 'Heridas y antisépticos',
    atc: ['D03', 'D06', 'D08'],
    terms: [
      'herida',
      'heridas',
      'antiseptico',
      'desinfectar',
      'quemadura',
      'cicatrizante',
    ],
  },
  { label: 'Acné', atc: ['D10'], terms: ['acne', 'granos', 'espinillas'] },
  {
    label: 'Anticonceptivos y hormonas',
    atc: ['G03'],
    terms: [
      'anticonceptivo',
      'anticonceptivos',
      'planificacion familiar',
      'hormonas',
      'menopausia',
    ],
  },
  {
    label: 'Vías urinarias',
    atc: ['G04'],
    terms: ['prostata', 'vias urinarias', 'orinar', 'incontinencia'],
  },
  {
    label: 'Corticoides e inflamación',
    atc: ['H02'],
    terms: ['corticoide', 'corticoides', 'cortisona'],
  },
  {
    label: 'Tiroides',
    atc: ['H03'],
    terms: ['tiroides', 'hipotiroidismo', 'hipertiroidismo'],
  },
  {
    label: 'Infecciones bacterianas',
    atc: ['J01'],
    terms: [
      'infeccion',
      'infecciones',
      'antibiotico',
      'antibioticos',
      'bacteria',
      'infeccion urinaria',
      'infeccion de garganta',
      'amigdalitis',
      'neumonia',
    ],
  },
  { label: 'Tuberculosis', atc: ['J04'], terms: ['tuberculosis', 'tbc'] },
  {
    label: 'Virus',
    atc: ['J05'],
    terms: ['virus', 'antiviral', 'herpes', 'vih', 'sida'],
  },
  {
    label: 'Vacunas e inmunoglobulinas',
    atc: ['J06', 'J07'],
    terms: ['vacuna', 'vacunas', 'inmunizacion'],
  },
  {
    label: 'Cáncer',
    atc: ['L01', 'L02'],
    terms: ['cancer', 'quimioterapia', 'tumor', 'oncologico'],
  },
  {
    label: 'Defensas e inmunidad',
    atc: ['L03', 'L04'],
    terms: ['inmunosupresor', 'trasplante', 'defensas'],
  },
  {
    label: 'Dolor, inflamación y fiebre',
    atc: ['M01A'],
    terms: [
      'dolor',
      'inflamacion',
      'antiinflamatorio',
      'dolor muscular',
      'dolor de espalda',
      'dolor de muela',
      'dolor de muelas',
      'dolor menstrual',
      'artritis',
      'artrosis',
      'golpe',
      'torcedura',
      'fiebre',
    ],
  },
  {
    label: 'Dolor y fiebre',
    atc: ['N02B', 'N02A'],
    terms: [
      'dolor',
      'dolor de cabeza',
      'cefalea',
      'fiebre',
      'calentura',
      'temperatura',
      'analgesico',
      'malestar',
      'dolor de cuerpo',
      'dolor de muela',
      'dolor de garganta',
      'gripe',
      'resfrio',
    ],
  },
  { label: 'Migraña', atc: ['N02C'], terms: ['migrana', 'jaqueca'] },
  {
    label: 'Contracturas musculares',
    atc: ['M03'],
    terms: [
      'contractura',
      'relajante muscular',
      'calambre',
      'tortícolis',
      'torticolis',
    ],
  },
  { label: 'Gota y ácido úrico', atc: ['M04'], terms: ['gota', 'acido urico'] },
  {
    label: 'Huesos y osteoporosis',
    atc: ['M05'],
    terms: ['osteoporosis', 'huesos'],
  },
  { label: 'Anestesia', atc: ['N01'], terms: ['anestesia', 'anestesico'] },
  {
    label: 'Epilepsia y convulsiones',
    atc: ['N03'],
    terms: ['epilepsia', 'convulsiones', 'anticonvulsivo', 'ataques'],
  },
  { label: 'Parkinson', atc: ['N04'], terms: ['parkinson', 'temblores'] },
  {
    label: 'Psicosis',
    atc: ['N05A'],
    terms: ['psicosis', 'esquizofrenia', 'antipsicotico', 'bipolar'],
  },
  {
    label: 'Ansiedad',
    atc: ['N05B'],
    terms: ['ansiedad', 'nervios', 'ansiolitico', 'angustia', 'estres'],
  },
  {
    label: 'Insomnio',
    atc: ['N05C'],
    terms: ['insomnio', 'dormir', 'sueño', 'sueno', 'somnifero'],
  },
  {
    label: 'Depresión',
    atc: ['N06A'],
    terms: ['depresion', 'antidepresivo', 'tristeza'],
  },
  {
    label: 'Parásitos y lombrices',
    atc: ['P02', 'P03'],
    terms: [
      'parasitos',
      'lombrices',
      'antiparasitario',
      'desparasitante',
      'piojos',
      'sarna',
    ],
  },
  {
    label: 'Malaria y protozoos',
    atc: ['P01'],
    terms: [
      'malaria',
      'paludismo',
      'amebas',
      'giardia',
      'chagas',
      'leishmaniasis',
    ],
  },
  {
    label: 'Asma y bronquios',
    atc: ['R03'],
    terms: [
      'asma',
      'falta de aire',
      'bronquitis',
      'broncoespasmo',
      'inhalador',
      'silbido de pecho',
    ],
  },
  {
    label: 'Tos',
    atc: ['R05'],
    terms: ['tos', 'jarabe para la tos', 'flema', 'expectorante'],
  },
  {
    label: 'Alergias',
    atc: ['R06'],
    terms: [
      'alergia',
      'alergias',
      'antihistaminico',
      'rinitis',
      'estornudos',
      'urticaria',
      'picazon',
      'comezon',
      'congestion nasal',
    ],
  },
  {
    label: 'Ojos',
    atc: ['S01'],
    terms: [
      'ojos',
      'conjuntivitis',
      'ojo rojo',
      'gotas para los ojos',
      'glaucoma',
    ],
  },
  {
    label: 'Oídos',
    atc: ['S02'],
    terms: ['oido', 'oidos', 'otitis', 'dolor de oido'],
  },
  {
    label: 'Intoxicaciones y antídotos',
    atc: ['V03'],
    terms: ['intoxicacion', 'antidoto', 'envenenamiento'],
  },
];

/** Where the label comes from, for the screen and the API docs. */
export const THERAPEUTIC_USES_SOURCE =
  'Grupo terapéutico según la clasificación ATC de la OMS. No es una indicación médica.';
