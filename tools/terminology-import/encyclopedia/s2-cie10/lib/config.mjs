// =============================================================================
// F9 · corte S2 — constantes del contrato y catálogo de fuentes.
//
// Nada acá es contenido médico: son las reglas de §12 de TAREA-41 (kinds
// cerrados, hosts de imagen de la CSP, licencias admitidas) y la lista de
// fuentes con su licencia tal como la declara la propia fuente.
// =============================================================================

export const CODE_SYSTEM = 'CIE10ES';
export const GLOSSARY_SOURCE = 'sanidad-cie10es-2026';
export const CIE_SOURCE_URL =
  'https://www.sanidad.gob.es/estadEstudios/estadisticas/normalizacion/CIE10/2026/Diagnosticos_Tabla_Referencia_CIE10ES_2026.xlsx';

/** Catálogo cerrado de `kind` para enfermedades (TAREA-41 §12.3). Agregar uno exige actualizar la ficha. */
export const DISEASE_SECTION_KINDS = Object.freeze([
  'definition', 'overview', 'symptoms', 'causes', 'risk_factors', 'diagnosis', 'treatment_overview',
  'complications', 'prevention', 'prognosis', 'when_to_seek_care', 'epidemiology', 'genetics', 'classification',
]);

/** Campos de procedencia que toda sección debe traer (TAREA-41 §12.2.3). */
export const SECTION_PROVENANCE_FIELDS = Object.freeze(['source', 'sourceUrl', 'license', 'retrievedAt', 'sourceVersion', 'locator']);

/** Hosts de imagen que admite la CSP del front (`src/server/security-headers.ts`, `img-src`). */
export const IMAGE_HOSTS = Object.freeze(['upload.wikimedia.org', 'thumb.wikimedia.org', 'cima.aemps.es']);

export const ORPHANET_MAPPING_EXACT_ID = '21527';
export const ORPHANET_VALIDATED_NAME = /^Validado$/i;

/**
 * HPO: términos de frecuencia (los 6 que fija el contrato §11). `rank` es SOLO una clave de orden
 * (punto medio, en %, del rango que define el propio término HPO); nunca se muestra ni se guarda como dato.
 */
export const HPO_FREQUENCY_TERMS = Object.freeze({
  'HP:0040280': { rank: 100, excluded: false },
  'HP:0040281': { rank: 89.5, excluded: false },
  'HP:0040282': { rank: 54.5, excluded: false },
  'HP:0040283': { rank: 17, excluded: false },
  'HP:0040284': { rank: 2.5, excluded: false },
  'HP:0040285': { rank: 0, excluded: true },
});

export const WIKIDATA_FACT_PROPERTIES = Object.freeze({
  P7329: { expectedLabel: 'ICD-11 ID (MMS)', factLabel: 'Código CIE-11 (MMS)', urlOf: (v) => `https://icd.who.int/browse/latest-release/mms/en#${v}` },
  P2892: { expectedLabel: 'UMLS CUI', factLabel: 'UMLS CUI', urlOf: (v) => `https://uts.nlm.nih.gov/uts/umls/concept/${v}` },
  P486: { expectedLabel: 'MeSH descriptor ID', factLabel: 'Descriptor MeSH', urlOf: (v) => `https://meshb.nlm.nih.gov/record/ui?ui=${v}` },
  P492: { expectedLabel: 'OMIM ID', factLabel: 'Código OMIM', urlOf: (v) => `https://omim.org/entry/${v}` },
  P1550: { expectedLabel: 'Orphanet ID', factLabel: 'Código ORPHA', urlOf: (v) => `https://www.orpha.net/en/disease/detail/${v}` },
  P699: { expectedLabel: 'Disease Ontology ID', factLabel: 'Disease Ontology', urlOf: (v) => `https://disease-ontology.org/?id=${v}` },
  P5270: { expectedLabel: 'Mondo ID', factLabel: 'MONDO', urlOf: (v) => `https://monarchinitiative.org/${v}` },
});

export const WIKIDATA_CODE_PROPERTIES = Object.freeze({
  P4229: { expectedLabel: 'ICD-10-CM', name: 'ICD-10-CM' },
  P494: { expectedLabel: 'ICD-10 ID', name: 'CIE-10 OMS' },
});

/**
 * Licencias de IMAGEN admitidas (TAREA-41 §12.2.7): dominio público, CC0, CC BY y CC BY-SA.
 * Rechaza NC, ND, GFDL, «sin licencia» y cualquier texto que no case exactamente.
 */
export const ALLOWED_IMAGE_LICENSE = /^(CC0(?: 1\.0)?|CC[ -]BY[ -]\d\.\d(?: [A-Za-z]{2,3})?|CC[ -]BY[ -]SA[ -]\d\.\d(?: [A-Za-z]{2,3})?|Public domain|PD(?:[ -][A-Za-z0-9-]+)*)$/i;
export const FORBIDDEN_IMAGE_LICENSE = /\b(NC|ND)\b|non-?commercial|no-?derivs?/i;

/**
 * Fuentes de TEXTO y de DATO que usa el corte. `status`:
 *  - `verified`    licencia leída en la propia fuente (archivo o página oficial).
 *  - `conditional` el texto de la licencia primaria no se pudo leer; solo hay fuentes secundarias.
 */
export const SOURCES = Object.freeze({
  'orphanet-es': {
    name: 'Orphanet (Orphadata), nomenclatura en castellano',
    license: 'CC BY 4.0 — Orphanet, www.orpha.net',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    homepage: 'https://www.orpha.net',
    status: 'verified',
  },
  'orphanet-epidemiology-es': {
    name: 'Orphanet (Orphadata), epidemiología y historia natural en castellano',
    license: 'CC BY 4.0 — Orphanet, www.orpha.net',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    homepage: 'https://www.orpha.net',
    status: 'verified',
  },
  mondo: {
    name: 'Mondo Disease Ontology',
    license: 'CC BY 4.0 — Monarch Initiative (Mondo)',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    homepage: 'https://mondo.monarchinitiative.org',
    status: 'verified',
  },
  'disease-ontology': {
    name: 'Human Disease Ontology (DOID)',
    license: 'CC0 1.0 — Disease Ontology',
    licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    homepage: 'https://disease-ontology.org',
    status: 'verified',
  },
  'nlm-mesh': {
    name: 'MeSH (NLM), notas de alcance',
    license: 'NLM Terms and Conditions — «Courtesy of the U.S. National Library of Medicine»',
    licenseUrl: 'https://www.nlm.nih.gov/databases/download/terms_and_conditions.html',
    homepage: 'https://www.nlm.nih.gov/mesh/',
    status: 'verified',
  },
  hpo: {
    name: 'Human Phenotype Ontology — anotaciones enfermedad → fenotipo',
    license: 'HPO License (uso libre con cita de la Human Phenotype Ontology Consortium; contenido y relaciones lógicas sin modificar) — https://hpo.jax.org/app/license',
    licenseUrl: 'https://hpo.jax.org/app/license',
    homepage: 'https://hpo.jax.org',
    status: 'conditional',
  },
  wikidata: {
    name: 'Wikidata',
    license: 'CC0 1.0 — Wikidata',
    licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    homepage: 'https://www.wikidata.org',
    status: 'verified',
  },
  [GLOSSARY_SOURCE]: {
    name: 'CIE-10-ES Diagnósticos, 6.ª edición 2026 — Ministerio de Sanidad',
    license:
      'Ministerio de Sanidad, aviso legal: reutilización autorizada, también comercial, citando la fuente y la fecha de última actualización y sin desnaturalizar el contenido',
    licenseUrl: 'https://www.sanidad.gob.es/avisoLegal/home.htm',
    homepage: 'https://www.sanidad.gob.es',
    status: 'verified',
  },
});

/**
 * §12.2.8 — texto CC BY-SA (Wikipedia) no se carga hasta que el propietario decida. Una definición de
 * MONDO/DOID que CITA a Wikipedia como referencia puede ser una adaptación de ese texto: se retiene
 * (con su fila en `rejected.ndjson`) salvo `--include-wikipedia-cited`.
 */
export const WIKIPEDIA_REFERENCE = /wikipedia/i;

/** Motivos de rechazo (cerrados): cada término sin artículo o con identidad dudosa lleva uno. */
export const REJECT_REASONS = Object.freeze({
  NO_CONCEPT_REF: 'conceptRef_no_coincide_con_el_glosario',
  NO_EXACT_SOURCE: 'sin_fuente_con_correspondencia_exacta',
  SOURCE_CONFLICT: 'orphanet_y_mondo_declaran_enfermedades_distintas',
  SOURCE_CONCEPT_MAPS_TO_MANY: 'el_concepto_de_la_fuente_corresponde_a_varios_terminos_del_glosario',
  CODE_MAPS_TO_MANY_SOURCE: 'varios_conceptos_de_la_fuente_declaran_el_mismo_codigo',
  DOSE_PATTERN: 'texto_con_patron_de_dosis',
  MISSING_PROVENANCE: 'seccion_sin_los_seis_campos_de_procedencia',
  IMAGE_LICENSE: 'licencia_de_imagen_no_admitida',
  IMAGE_HOST: 'host_de_imagen_fuera_de_la_csp',
  IMAGE_NO_AUTHOR: 'imagen_cc_by_sin_autor',
  QID_MAPS_TO_MANY_TERMS: 'el_qid_de_wikidata_declara_varios_terminos_del_glosario',
  CODE_MAPS_TO_MANY_QID: 'varios_qid_de_wikidata_declaran_el_mismo_codigo',
  EMPTY_ARTICLE: 'sin_secciones_ni_imagenes',
  WIKIPEDIA_CITED: 'definicion_que_cita_wikipedia_(cc_by_sa)_retenida_hasta_decision_del_propietario',
});
