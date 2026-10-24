// =============================================================================
// Asignación de categoría y etiquetas del glosario, POR FUENTE, a partir de la
// estructura oficial que la propia fuente publica (capítulo/bloque de CIE-10-ES,
// sección de ICD-10-PCS, grupo anatómico ATC de la OMS, grupo de MedlinePlus).
//
// No es juicio clínico término a término: es una tabla de correspondencia entre
// dos clasificaciones estructurales (la de la fuente y las 12 categorías / 15
// etiquetas de `src/common/seed/glossary-taxonomy.ts`). Cada regla cita el
// elemento oficial del que sale. Si una rama no encaja con claridad, cae en
// `other` sin etiqueta: se prefiere no etiquetar a etiquetar mal.
// =============================================================================

/** Las 12 claves de categoría válidas (espejo de GLOSSARY_CATEGORIES). */
export const CATEGORY_KEYS = [
  'anatomy', 'signs-symptoms', 'disease', 'specialty', 'diagnostic-test', 'procedure',
  'treatment', 'pharmacology', 'lab', 'imaging', 'care', 'other',
];

/** Nombres ES de las categorías (espejo de GLOSSARY_CATEGORIES.name). */
export const CATEGORY_NAMES = {
  anatomy: 'Anatomía', 'signs-symptoms': 'Signos y síntomas', disease: 'Enfermedades',
  specialty: 'Especialidades médicas', 'diagnostic-test': 'Pruebas diagnósticas',
  procedure: 'Procedimientos', treatment: 'Tratamientos', pharmacology: 'Farmacología clínica',
  lab: 'Laboratorio', imaging: 'Imagenología', care: 'Cuidados de enfermería', other: 'Otros términos',
};

/** Las 21 etiquetas (espejo de GLOSSARY_TAGS). */
export const TAG_NAMES = {
  urgency: 'Urgencia', chronic: 'Crónico', pediatric: 'Pediatría', cardiovascular: 'Cardiovascular',
  respiratory: 'Respiratorio', endocrine: 'Endocrino', infectious: 'Infeccioso',
  'mental-health': 'Salud mental', musculoskeletal: 'Musculoesquelético', digestive: 'Digestivo',
  renal: 'Renal', urologic: 'Urológico', dermatologic: 'Dermatológico', oncologic: 'Oncológico',
  'gyn-ob': 'Ginecoobstétrico', neurologic: 'Neurológico', hematologic: 'Hematológico e inmunitario',
  ophthalmologic: 'Oftalmológico', ent: 'Otorrinolaringológico', congenital: 'Congénito',
  trauma: 'Traumatismos y envenenamientos',
};

// --- CIE-10-ES Diagnósticos (traducción de ICD-10-CM) -----------------------------

/**
 * Rango de códigos → capítulo oficial de CIE-10-ES 2026 (Tomo I, lista tabular).
 * Se compara por los 3 primeros caracteres. `categoryKey`/`tags` salen del
 * título del capítulo, no del diagnóstico concreto.
 */
const DX_CHAPTERS = [
  { from: 'A00', to: 'B99', chapter: 1, categoryKey: 'disease', tags: ['infectious'] },
  { from: 'C00', to: 'D49', chapter: 2, categoryKey: 'disease', tags: ['oncologic'] },
  // Cap. 3 «Enfermedades de la sangre y órganos hematopoyéticos y ciertos trastornos
  // que afectan al mecanismo inmunológico».
  { from: 'D50', to: 'D89', chapter: 3, categoryKey: 'disease', tags: ['hematologic'] },
  { from: 'E00', to: 'E89', chapter: 4, categoryKey: 'disease', tags: ['endocrine'] },
  { from: 'F01', to: 'F99', chapter: 5, categoryKey: 'disease', tags: ['mental-health'] },
  { from: 'G00', to: 'G99', chapter: 6, categoryKey: 'disease', tags: ['neurologic'] },
  // Cap. 7 «Enfermedades del ojo y sus anexos»; cap. 8 «… del oído y de la apófisis mastoides».
  { from: 'H00', to: 'H59', chapter: 7, categoryKey: 'disease', tags: ['ophthalmologic'] },
  { from: 'H60', to: 'H95', chapter: 8, categoryKey: 'disease', tags: ['ent'] },
  { from: 'I00', to: 'I99', chapter: 9, categoryKey: 'disease', tags: ['cardiovascular'] },
  { from: 'J00', to: 'J99', chapter: 10, categoryKey: 'disease', tags: ['respiratory'] },
  { from: 'K00', to: 'K95', chapter: 11, categoryKey: 'disease', tags: ['digestive'] },
  { from: 'L00', to: 'L99', chapter: 12, categoryKey: 'disease', tags: ['dermatologic'] },
  { from: 'M00', to: 'M99', chapter: 13, categoryKey: 'disease', tags: ['musculoskeletal'] },
  // Cap. 14 «Enfermedades del aparato genitourinario»: sólo los bloques N00-N39
  // (riñón y vías urinarias) llevan «Renal»; N60-N98 (mama y órganos pélvicos
  // femeninos) llevan «Ginecoobstétrico». N40-N53 (órganos genitales masculinos) → «Urológico».
  { from: 'N00', to: 'N39', chapter: 14, categoryKey: 'disease', tags: ['renal'] },
  { from: 'N40', to: 'N59', chapter: 14, categoryKey: 'disease', tags: ['urologic'] },
  { from: 'N60', to: 'N99', chapter: 14, categoryKey: 'disease', tags: ['gyn-ob'] },
  { from: 'O00', to: 'O9A', chapter: 15, categoryKey: 'disease', tags: ['gyn-ob'] },
  { from: 'P00', to: 'P96', chapter: 16, categoryKey: 'disease', tags: ['pediatric'] },
  // Cap. 17 «Malformaciones congénitas, deformidades y anomalías cromosómicas».
  { from: 'Q00', to: 'Q99', chapter: 17, categoryKey: 'disease', tags: ['congenital'] },
  // Cap. 18 «Síntomas, signos y resultados anormales…» → Signos y síntomas. Las
  // etiquetas salen del BLOQUE oficial (`R_BLOCK_TAGS`), no del capítulo.
  { from: 'R00', to: 'R99', chapter: 18, categoryKey: 'signs-symptoms', tags: [] },
  // Cap. 19 «Lesiones traumáticas, envenenamientos…»: se clasifican como Enfermedades
  // (es la categoría de «condición»; no existe una categoría de lesiones).
  { from: 'S00', to: 'T88', chapter: 19, categoryKey: 'disease', tags: ['trauma'] },
  // Cap. 22 «Códigos para propósitos especiales» (U00-U85, p. ej. COVID-19 U07.1).
  { from: 'U00', to: 'U85', chapter: 22, categoryKey: 'disease', tags: [] },
  // Cap. 20 «Causas externas de morbilidad» y cap. 21 «Factores que influyen en el
  // estado de salud y contacto con los servicios sanitarios»: no son enfermedades.
  // El cap. 20 son accidentes, agresiones y lesiones autoinfligidas: «Traumatismos».
  { from: 'V00', to: 'Y99', chapter: 20, categoryKey: 'other', tags: ['trauma'] },
  { from: 'Z00', to: 'Z99', chapter: 21, categoryKey: 'other', tags: [] },
];

export function dxChapterOf(code) {
  const c3 = String(code).slice(0, 3).toUpperCase();
  return DX_CHAPTERS.find((r) => c3 >= r.from && c3 <= r.to) ?? null;
}

/**
 * Bloques oficiales del cap. 18 de CIE-10-ES 2026 (título del bloque, tal cual
 * lo trae la lista tabular) → etiquetas. Los bloques de signos generales
 * (R50-R69), otros líquidos (R83-R89), imagen (R90-R94) y mortalidad (R99) no
 * nombran un aparato: quedan sin etiqueta.
 */
const R_BLOCK_TAGS = [
  { from: 'R00', to: 'R09', tags: ['cardiovascular', 'respiratory'] }, // aparatos circulatorio y respiratorio
  { from: 'R10', to: 'R19', tags: ['digestive'] }, // aparato digestivo y abdomen
  { from: 'R20', to: 'R23', tags: ['dermatologic'] }, // piel y tejido celular subcutáneo
  { from: 'R25', to: 'R29', tags: ['musculoskeletal', 'neurologic'] }, // sistemas nervioso y musculoesquelético
  { from: 'R30', to: 'R39', tags: ['renal', 'urologic'] }, // aparato genitourinario
  { from: 'R40', to: 'R46', tags: ['mental-health', 'neurologic'] }, // funciones cognitivas, percepción, emoción y conducta
  { from: 'R47', to: 'R49', tags: ['neurologic'] }, // habla y voz
  { from: 'R70', to: 'R79', tags: ['hematologic'] }, // resultados anormales en análisis de sangre
  { from: 'R80', to: 'R82', tags: ['renal'] }, // resultados anormales en análisis de orina
  { from: 'R97', to: 'R97', tags: ['oncologic'] }, // marcadores tumorales anormales
];

/** Etiquetas del bloque oficial del capítulo R al que pertenece el código. */
export function rBlockTags(code) {
  const c3 = String(code).slice(0, 3).toUpperCase();
  return R_BLOCK_TAGS.find((b) => c3 >= b.from && c3 <= b.to)?.tags ?? [];
}

/**
 * Nivel de un código CIE-10 que entra al glosario. Bolivia notifica con la
 * CIE-10 de la OMS (SNIS), que llega a categoría (3 caracteres) y subcategoría
 * (4); los niveles de 5 a 7 son extensiones de ICD-10-CM (lateralidad, episodio
 * de atención). Esos siguen siendo conceptos de terminología, pero no fichas del
 * glosario: 90 080 filas sin definición que tapaban a las 12 051 que sí se buscan.
 */
export const GLOSSARY_MAX_DX_CODE_LENGTH = 4;

export function isGlossaryDxLevel(code) {
  return String(code).replace('.', '').length <= GLOSSARY_MAX_DX_CODE_LENGTH;
}

/**
 * Categoría y etiquetas de un código diagnóstico. Suma las etiquetas que
 * derivan de los marcadores oficiales del propio Excel (Pediátrico, Obstétrico,
 * Perinatal).
 */
export function dxTaxonomy(code, flags = {}) {
  const ch = dxChapterOf(code);
  const tags = new Set([...(ch?.tags ?? []), ...(ch?.chapter === 18 ? rBlockTags(code) : [])]);
  if (flags.pediatric || flags.perinatal) tags.add('pediatric');
  if (flags.obstetric) tags.add('gyn-ob');
  return { categoryKey: ch?.categoryKey ?? 'other', tagKeys: [...tags].sort(), chapter: ch?.chapter ?? null };
}

// --- CIE-10-ES Procedimientos (traducción de ICD-10-PCS) ---------------------------

/**
 * Primer carácter = «Sección» de ICD-10-PCS (nombres oficiales de la edición
 * española). Para F, el 2.º carácter (calificador de sección) separa
 * Rehabilitación (0) de Audiología diagnóstica (1).
 */
export const PCS_SECTIONS = {
  0: { name: 'Médico-quirúrgica', categoryKey: 'procedure' },
  1: { name: 'Obstetricia', categoryKey: 'procedure', tags: ['gyn-ob'] },
  2: { name: 'Colocación', categoryKey: 'procedure' },
  3: { name: 'Administración', categoryKey: 'treatment' },
  4: { name: 'Medición y monitorización', categoryKey: 'diagnostic-test' },
  5: { name: 'Asistencia y soporte extracorpóreos', categoryKey: 'treatment' },
  6: { name: 'Terapias extracorpóreas', categoryKey: 'treatment' },
  7: { name: 'Osteopática', categoryKey: 'treatment', tags: ['musculoskeletal'] },
  8: { name: 'Otros procedimientos', categoryKey: 'procedure' },
  9: { name: 'Quiropráctica', categoryKey: 'treatment', tags: ['musculoskeletal'] },
  B: { name: 'Imagen', categoryKey: 'imaging' },
  C: { name: 'Medicina nuclear', categoryKey: 'imaging' },
  D: { name: 'Radioterapia', categoryKey: 'treatment', tags: ['oncologic'] },
  F: { name: 'Rehabilitación física y audiología diagnóstica', categoryKey: 'treatment' },
  G: { name: 'Salud mental', categoryKey: 'treatment', tags: ['mental-health'] },
  H: { name: 'Tratamiento de abuso de sustancias', categoryKey: 'treatment', tags: ['mental-health'] },
  X: { name: 'Nueva tecnología', categoryKey: 'procedure' },
};

export function pcsTaxonomy(code) {
  const s = PCS_SECTIONS[code[0]];
  if (!s) return { categoryKey: 'procedure', tagKeys: [], sectionName: null };
  let categoryKey = s.categoryKey;
  // F1 = Audiología diagnóstica → prueba diagnóstica; F0 = Rehabilitación → tratamiento.
  if (code[0] === 'F' && code[1] === '1') categoryKey = 'diagnostic-test';
  return { categoryKey, tagKeys: [...(s.tags ?? [])], sectionName: s.name };
}

// --- ATC (OMS) → etiquetas, para Farmacología clínica --------------------------------

/**
 * Grupo anatómico principal ATC (1.er nivel) y algunos subgrupos terapéuticos
 * (2.º nivel) cuyo nombre oficial coincide con una etiqueta. Fuente de los
 * nombres: índice ATC/DDD de la OMS; los niveles los trae CIMA en `atcs`.
 */
export function atcTags(atcCodes) {
  const tags = new Set();
  for (const raw of atcCodes) {
    const c = String(raw).toUpperCase();
    const l1 = c[0];
    const l2 = c.slice(0, 3);
    if (l2 === 'A10') tags.add('endocrine'); // Fármacos usados en diabetes
    else if (l1 === 'A') tags.add('digestive'); // Tracto alimentario y metabolismo
    if (l1 === 'C') tags.add('cardiovascular');
    if (l1 === 'D') tags.add('dermatologic');
    if (l2 === 'G04') tags.add('renal'); // Urológicos
    else if (l1 === 'G') tags.add('gyn-ob'); // Sistema genitourinario y hormonas sexuales
    if (l1 === 'H') tags.add('endocrine'); // Preparados hormonales sistémicos
    if (l1 === 'J' || l1 === 'P') tags.add('infectious'); // Antiinfecciosos / antiparasitarios
    if (l2 === 'L01' || l2 === 'L02') tags.add('oncologic'); // Antineoplásicos / terapia endocrina
    if (l1 === 'M') tags.add('musculoskeletal');
    if (l2 === 'N05' || l2 === 'N06') tags.add('mental-health'); // Psicolépticos / psicoanalépticos
    else if (l1 === 'N') tags.add('neurologic');
    if (l1 === 'R') tags.add('respiratory');
  }
  return [...tags].sort();
}

// --- MedlinePlus (grupos de temas en español) --------------------------------------

/**
 * Grupos oficiales de MedlinePlus en español (texto exacto de `<group>` en
 * `mplus_topics_<fecha>.xml`, corrida 2026-09-30) → etiqueta.
 */
const MPLUS_GROUP_TAGS = {
  'Sangre, corazón y circulación': 'cardiovascular',
  'Pulmón y vías respiratorias': 'respiratory',
  'Sistema endocrino': 'endocrine',
  'Diabetes mellitus': 'endocrine',
  'Problemas del metabolismo': 'endocrine',
  Infecciones: 'infectious',
  'Salud mental y conducta': 'mental-health',
  'Consumo de sustancias y sus trastornos': 'mental-health',
  'Huesos, articulaciones y músculos': 'musculoskeletal',
  'Sistema digestivo': 'digestive',
  'Riñones y sistema urinario': 'renal',
  'Piel, cabello y uñas': 'dermatologic',
  Cánceres: 'oncologic',
  'Embarazo y reproducción': 'gyn-ob',
  'Sistema reproductor femenino': 'gyn-ob',
  'Cerebro y nervios': 'neurologic',
  'Niños y adolescentes': 'pediatric',
  'Lesiones y heridas': 'urgency',
  Desastres: 'urgency',
};

/** Grupos de aparato/sistema o de afección: un tema bajo ellos es una condición. */
const MPLUS_CONDITION_GROUPS = new Set([
  ...Object.keys(MPLUS_GROUP_TAGS).filter((g) => g !== 'Niños y adolescentes' && g !== 'Desastres'),
  'Sistema inmunitario', 'Genética y defectos congénitos', 'Oído, nariz y garganta', 'Ojos y visión',
  'Sistema reproductor masculino', 'Salud oral y dental', 'Envenenamientos, toxicología y salud ambiental',
]);

/**
 * Categoría de un tema MedlinePlus según sus grupos oficiales, en este orden:
 * «Pruebas de diagnóstico» → diagnostic-test; «Cirugía y rehabilitación» y
 * «Transplantes y donaciones» → procedure; «Tratamiento con medicamentos» y
 * «Terapias complementarias y alternativas» → treatment; «Síntomas» →
 * signs-symptoms; cualquier grupo de aparato/sistema o afección → disease; el
 * resto (bienestar, poblaciones, asuntos sociales, sistemas de salud) → other.
 */
export function medlineplusTaxonomy(groupNames) {
  const names = new Set(groupNames.map((g) => String(g).trim()));
  let categoryKey = 'other';
  if (names.has('Pruebas de diagnóstico')) categoryKey = 'diagnostic-test';
  else if (names.has('Cirugía y rehabilitación') || names.has('Transplantes y donaciones')) categoryKey = 'procedure';
  else if (names.has('Tratamiento con medicamentos') || names.has('Terapias complementarias y alternativas')) categoryKey = 'treatment';
  else if (names.has('Síntomas')) categoryKey = 'signs-symptoms';
  else if ([...names].some((n) => MPLUS_CONDITION_GROUPS.has(n))) categoryKey = 'disease';
  const tags = new Set();
  for (const n of names) if (MPLUS_GROUP_TAGS[n]) tags.add(MPLUS_GROUP_TAGS[n]);
  return { categoryKey, tagKeys: [...tags].sort() };
}
