// =============================================================================
// Qué propiedades de Wikidata alimentan qué sección del catálogo §12.3.
//
// Cada propiedad se midió contra los 2 833 ítems del corte (frecuencia por
// categoría en COVERAGE.md) y su etiqueta se contrasta contra Wikidata en cada
// corrida (`EXPECTED_LABELS`): un id equivocado aborta, igual que en
// `lib/glossary-es/wikidata.mjs`. Nada acá es contenido clínico.
//
// Las SECCIONES salen de afirmaciones cuyo valor es un ítem (lista de nombres).
// Los FACTS salen de afirmaciones de ítem (“Especialidad médica: …”) o de
// identificadores abiertos (código TA98, MeSH, CIE-10…). SNOMED CT, LOINC y ATC
// quedan FUERA a propósito (licencias que decide el propietario).
// =============================================================================

/** Etiqueta inglesa esperada de cada propiedad usada (se contrasta con la API). */
export const EXPECTED_LABELS = Object.freeze({
  P31: 'instance of',
  P279: 'subclass of',
  P361: 'part of',
  P527: 'has part(s)',
  P927: 'anatomical location',
  P2286: 'arterial supply',
  P2289: 'venous drainage',
  P3189: 'innervated by',
  P3190: 'innervates',
  P3261: 'anatomical branch of',
  P3262: 'has anatomical branch',
  P2789: 'connects with',
  P2329: 'antagonist muscle',
  P3490: 'muscle origin',
  P3491: 'muscle insertion',
  P3310: 'muscle action',
  P828: 'has cause',
  P1542: 'has effect',
  P1995: 'health specialty',
  P2176: 'drug or therapy used for treatment',
  P2578: 'is the study of',
  P3095: 'practiced by',
  P366: 'has use',
  P2175: 'medical condition treated',
  P2283: 'uses',
  P1343: 'described by source',
  P18: 'image',
  P117: 'chemical structure',
  P5555: 'schematic',
  P6802: 'related image',
  P8224: 'image of molecular model or crystal lattice model',
  P1323: 'Terminologia Anatomica 98 ID',
  P7173: 'TA2 ID',
  P3982: 'TA98 Latin term',
  P1402: 'Foundational Model of Anatomy ID',
  P1554: 'UBERON ID',
  P2892: 'UMLS CUI',
  P486: 'MeSH descriptor ID',
  P672: 'MeSH tree code',
  P1748: 'NCI Thesaurus ID',
  P3841: 'Human Phenotype Ontology ID',
  P494: 'ICD-10 ID',
  P4229: 'ICD-10-CM',
  P1692: 'ICD-9-CM',
  P667: 'ICPC 2 ID',
  P7807: 'ICD-11 ID (Foundation)',
  P492: 'OMIM ID',
  P274: 'chemical formula',
});

/**
 * Secciones por afirmaciones de ítem. `category` = `categoryKey` de la semilla.
 * El orden dentro de cada categoría es el orden de aparición en el artículo.
 */
export const CLAIM_SECTIONS = Object.freeze({
  anatomy: [
    { property: 'P927', kind: 'location' },
    { property: 'P527', kind: 'structure' },
    { property: 'P3262', kind: 'structure' },
    { property: 'P3490', kind: 'structure' },
    { property: 'P3491', kind: 'structure' },
    { property: 'P3310', kind: 'function' },
    { property: 'P2286', kind: 'blood_supply' },
    { property: 'P2289', kind: 'blood_supply' },
    { property: 'P3189', kind: 'innervation' },
    { property: 'P3190', kind: 'innervation' },
    { property: 'P361', kind: 'related_structures' },
    { property: 'P3261', kind: 'related_structures' },
    { property: 'P2789', kind: 'related_structures' },
    { property: 'P2329', kind: 'related_structures' },
  ],
  'signs-symptoms': [
    { property: 'P828', kind: 'associated_conditions' },
    { property: 'P1542', kind: 'associated_conditions' },
  ],
  specialty: [
    { property: 'P2578', kind: 'scope' },
    { property: 'P527', kind: 'subspecialties' },
  ],
  'diagnostic-test': [{ property: 'P366', kind: 'purpose' }],
  treatment: [
    { property: 'P2175', kind: 'purpose' },
    { property: 'P366', kind: 'purpose' },
  ],
});

/** Afirmaciones de ítem que se muestran como `facts` (etiqueta de la propiedad + nombres). */
export const CLAIM_FACTS = Object.freeze({
  anatomy: ['P31', 'P279'],
  'signs-symptoms': ['P31', 'P279', 'P1995', 'P2176'],
  specialty: ['P31', 'P279', 'P361', 'P3095'],
  'diagnostic-test': ['P31', 'P279', 'P1995', 'P927', 'P2283'],
  treatment: ['P31', 'P279'],
});

/**
 * Identificadores abiertos que se muestran como `facts`.
 * `label` es el nombre del sistema en castellano; `url` arma el enlace de origen.
 */
export const IDENTIFIER_FACTS = Object.freeze([
  { property: 'P1323', label: 'Terminologia Anatomica 98 (TA98)' },
  { property: 'P7173', label: 'Terminologia Anatomica 2 (TA2)' },
  { property: 'P3982', label: 'Término latino TA98' },
  { property: 'P1402', label: 'Foundational Model of Anatomy (FMA)' },
  { property: 'P1554', label: 'UBERON' },
  { property: 'P486', label: 'Descriptor MeSH' },
  { property: 'P672', label: 'Código de árbol MeSH' },
  { property: 'P2892', label: 'UMLS CUI' },
  { property: 'P1748', label: 'NCI Thesaurus' },
  { property: 'P3841', label: 'Human Phenotype Ontology (HPO)' },
  { property: 'P494', label: 'Código CIE-10 (OMS)' },
  { property: 'P4229', label: 'Código CIE-10-CM' },
  { property: 'P1692', label: 'Código CIE-9-CM' },
  { property: 'P667', label: 'ICPC-2' },
  { property: 'P7807', label: 'CIE-11 (identificador Foundation)' },
  { property: 'P492', label: 'OMIM' },
  { property: 'P274', label: 'Fórmula química' },
]);

/** Propiedades de imagen de Wikidata y el `kind` que implican por sí mismas. */
export const IMAGE_PROPERTIES = Object.freeze([
  { property: 'P18', max: 3, impliedKind: null },
  { property: 'P5555', max: 1, impliedKind: 'diagram' },
  { property: 'P6802', max: 2, impliedKind: null },
  { property: 'P117', max: 1, impliedKind: 'diagram' },
  { property: 'P8224', max: 1, impliedKind: 'diagram' },
]);

/** Máximo de imágenes por artículo. */
export const MAX_IMAGES_PER_ARTICLE = 4;

/**
 * Relaciones INVERSAS ya presentes en la semilla (`relations[]`, con
 * `provenance: "wikidata:Pnnn Qa→Qb …"`): la enfermedad declara la propiedad
 * hacia este término. Se muestran como lista de enfermedades, citando la propiedad.
 */
export const REVERSE_RELATION_SECTIONS = Object.freeze({
  anatomy: [{ property: 'P927', relationType: 'DISEASE', kind: 'clinical_relevance' }],
  'signs-symptoms': [{ property: 'P780', relationType: 'DISEASE', kind: 'associated_conditions' }],
  specialty: [{ property: 'P1995', relationType: 'DISEASE', kind: 'conditions_treated' }],
  'diagnostic-test': [{ property: 'P923', relationType: 'DISEASE', kind: 'purpose' }],
  treatment: [
    { property: 'P2176', relationType: 'DISEASE', kind: 'purpose' },
    { property: 'P924', relationType: 'DISEASE', kind: 'purpose' },
  ],
});

/** Etiquetas esperadas de las propiedades de las relaciones inversas. */
export const EXPECTED_REVERSE_LABELS = Object.freeze({
  P780: 'symptoms and signs',
  P923: 'medical examination',
  P924: 'possible treatment',
});

/** Propiedades cuyos valores (ítems) hay que etiquetar: todo lo que se muestra como nombre. */
export const ITEM_PROPERTIES = Object.freeze(
  Object.fromEntries(
    [
      ...Object.values(CLAIM_SECTIONS).flat().map((s) => s.property),
      ...Object.values(CLAIM_FACTS).flat(),
      'P1343',
    ].map((p) => [p, true]),
  ),
);

/** Todas las propiedades cuya etiqueta se pide (para títulos de sección y verificación). */
export const ALL_PROPERTIES = Object.freeze([
  ...new Set([...Object.keys(EXPECTED_LABELS), ...Object.keys(EXPECTED_REVERSE_LABELS)]),
]);

/** Tope de ítems por sección (el resto se declara en el `locator`). */
export const MAX_ITEMS_PER_SECTION = 200;
