// =============================================================================
// Code systems que deja cargados el catálogo de enfermedades, y la forma de
// cada código. Es el contrato con las sesiones que enlazan por código (p. ej.
// síntomas): `internal_code` + `code` resuelven un concepto, igual que
// `CodeSystem/$lookup` con la URL canónica.
//
// Dos clases de sistema:
//  - «ontología»: la fuente trae nombre, sinónimos, jerarquía (y a veces
//    definición). Un concepto por clase de la fuente.
//  - «clave cruzada» (`keyOnly`): sólo se conoce el código, porque otra fuente
//    publicó un alineamiento hacia él (OMIM, CIE-10 OMS, CIE-11, MeSH, UMLS).
//    El concepto existe para poder enlazar por código; su `display` ES el
//    código y lleva la propiedad `disease_xref_key` que lo dice. No se le pone
//    un título: el de la fuente de origen exige licencia o no está accesible.
// =============================================================================

import { slugify } from '../../lib/glossary-es/common.mjs';
import { md5uuid } from '../../lib/glossary-es/load-plan.mjs';
import { LICENSES } from './sources.mjs';

export const SYSTEMS = {
  mondo: {
    name: 'Mondo Disease Ontology (MONDO)',
    sourceCode: 'MONARCH_MONDO',
    owner: 'Monarch Initiative',
    officialUrl: 'https://mondo.monarchinitiative.org/',
    license: LICENSES.MONDO,
    codeFormat: 'MONDO:0005015',
    uri: (code) => `http://purl.obolibrary.org/obo/${code.replace(':', '_')}`,
  },
  orphanet: {
    name: 'Orphanet — nomenclatura de enfermedades raras (ORPHAcode)',
    sourceCode: 'INSERM_ORPHANET',
    owner: 'Orphanet (INSERM US14)',
    officialUrl: 'https://www.orphadata.com/',
    license: LICENSES.ORPHANET,
    codeFormat: '558',
    uri: (code) => `http://www.orpha.net/ORDO/Orphanet_${code}`,
  },
  doid: {
    name: 'Human Disease Ontology (DOID)',
    sourceCode: 'DO_DOID',
    owner: 'Disease Ontology Knowledgebase — University of Maryland School of Medicine',
    officialUrl: 'https://disease-ontology.org/',
    license: LICENSES.DOID,
    codeFormat: 'DOID:9351',
    uri: (code) => `http://purl.obolibrary.org/obo/${code.replace(':', '_')}`,
  },
  'ncit-disease': {
    // No se llama «NCI Thesaurus» a secas: es un subconjunto (los términos de uso de NCI EVS reservan el nombre).
    name: 'Subconjunto C2991 «Disease or Disorder» del NCI Thesaurus (NCI EVS 26.09d, archivo plano oficial)',
    sourceCode: 'NCI_NCIT',
    owner: 'National Cancer Institute — Enterprise Vocabulary Services',
    officialUrl: 'https://evs.nci.nih.gov/',
    license: LICENSES.NCIT,
    codeFormat: 'C2985',
    uri: (code) => `http://purl.obolibrary.org/obo/NCIT_${code}`,
  },
  'ncit-xref': {
    name: 'NCI Thesaurus (NCI EVS 26.09d) — conceptos que citan otras fuentes de enfermedades y que están fuera de C2991, o retirados',
    sourceCode: 'NCI_NCIT',
    owner: 'National Cancer Institute — Enterprise Vocabulary Services',
    officialUrl: 'https://evs.nci.nih.gov/',
    license: LICENSES.NCIT,
    codeFormat: 'C3367',
    uri: (code) => `http://purl.obolibrary.org/obo/NCIT_${code}`,
  },
  gard: {
    name: 'GARD — Genetic and Rare Diseases Information Center (NCATS/NIH), lista oficial de enfermedades',
    sourceCode: 'NIH_NCATS_GARD',
    owner: 'National Center for Advancing Translational Sciences (NCATS), NIH',
    officialUrl: 'https://rarediseases.info.nih.gov/',
    license: LICENSES.GARD,
    codeFormat: 'GARD:0017890',
    uri: (code) => `https://rarediseases.info.nih.gov/?gard_id=${code.replace(/^GARD:/, '')}`,
  },
  'medlineplus-genetics': {
    name: 'MedlinePlus Genetics (NLM) — condiciones genéticas',
    sourceCode: 'NLM_MEDLINEPLUS_GENETICS',
    owner: 'U.S. National Library of Medicine',
    officialUrl: 'https://medlineplus.gov/genetics/',
    license: LICENSES.MEDLINEPLUS_GENETICS,
    codeFormat: '21631',
    uri: (code) => `https://medlineplus.gov/genetics/condition/?id=${code}`,
  },
  'wikidata-disease': {
    name: 'Wikidata — enfermedades con etiqueta en castellano o sin identificador de otro sistema del catálogo',
    sourceCode: 'WIKIMEDIA_WIKIDATA',
    owner: 'Wikimedia Foundation (Wikidata)',
    officialUrl: 'https://www.wikidata.org/',
    license: LICENSES.WIKIDATA,
    codeFormat: 'Q11081',
    uri: (code) => `http://www.wikidata.org/entity/${code}`,
  },
  nando: {
    name: 'NANDO — Nanbyo Disease Ontology (enfermedades intratables de Japón)',
    sourceCode: 'DBCLS_NANDO',
    owner: 'Database Center for Life Science (DBCLS) / NIBIOHN, Japón',
    officialUrl: 'https://nanbyodata.jp/',
    license: LICENSES.NANDO,
    codeFormat: 'NANDO:1200001',
    uri: (code) => `http://nanbyodata.jp/ontology/${code.replace(':', '_')}`,
  },
  oncotree: {
    name: 'OncoTree — tipos tumorales (Memorial Sloan Kettering Cancer Center)',
    sourceCode: 'MSK_ONCOTREE',
    owner: 'Memorial Sloan Kettering Cancer Center',
    officialUrl: 'https://oncotree.mskcc.org/',
    license: LICENSES.ONCOTREE,
    codeFormat: 'LUAD (tipo) · LUNG (tejido)',
    uri: () => null,
  },
  'efo-disease': {
    name: 'Experimental Factor Ontology — enfermedades propias de EFO',
    sourceCode: 'EBI_EFO',
    owner: 'EMBL-EBI',
    officialUrl: 'https://www.ebi.ac.uk/efo/',
    license: LICENSES.EFO,
    codeFormat: 'EFO:0000195',
    uri: (code) => `http://www.ebi.ac.uk/efo/${code.replace(':', '_')}`,
  },
  omim: {
    name: 'OMIM — claves de fenotipo citadas por MONDO, Orphanet y DOID',
    sourceCode: 'JHU_OMIM',
    owner: 'Johns Hopkins University (OMIM)',
    officialUrl: 'https://omim.org/',
    license: 'Sólo el número MIM, tal como lo publica la fuente que alinea. Los títulos y textos de OMIM exigen licencia (omim.org/downloads): no se cargan.',
    codeFormat: '219700 (entrada) · PS219700 (serie fenotípica)',
    keyOnly: true,
    uri: (code) => (code.startsWith('PS') ? `https://omim.org/phenotypicSeries/${code}` : `https://omim.org/entry/${code}`),
  },
  'icd10-who': {
    name: 'CIE-10 (OMS) — claves citadas por MONDO y Orphanet',
    sourceCode: 'WHO_ICD10',
    owner: 'Organización Mundial de la Salud',
    officialUrl: 'https://icd.who.int/browse10/2019/en',
    license: 'Sólo el código. Los títulos de la CIE-10 son © OMS; la descarga oficial no es accesible desde esta red.',
    codeFormat: 'E84.0',
    keyOnly: true,
    uri: (code) => `https://icd.who.int/browse10/2019/en#/${code}`,
  },
  'icd11-mms': {
    name: 'CIE-11 para Estadísticas de Mortalidad y Morbilidad (MMS), 2026-01',
    sourceCode: 'WHO_ICD11',
    owner: 'Organización Mundial de la Salud',
    officialUrl: 'https://icd.who.int/browse/2026-01/mms/en',
    license: LICENSES.ICD11,
    codeFormat: '5A11 (categoría) · BlockL1-1A0 (bloque) · chapter-01 (capítulo)',
    // La URI es la de linealización de cada fila (la pone buildIcd11Mms); no se arma desde el código.
    uri: () => null,
  },
  'icd11-foundation': {
    name: 'CIE-11 Fundación — entidades citadas por MONDO y Orphanet',
    sourceCode: 'WHO_ICD11',
    owner: 'Organización Mundial de la Salud',
    officialUrl: 'https://icd.who.int/browse/latest-release/mms/es',
    license: 'Sólo el identificador de entidad. La CIE-11 es CC BY-ND 3.0 IGO; su descarga no es accesible desde esta red.',
    codeFormat: '465177735',
    keyOnly: true,
    uri: (code) => `http://id.who.int/icd/entity/${code}`,
  },
  decipher: {
    name: 'DECIPHER — síndromes citados por las anotaciones HPO y por MONDO',
    sourceCode: 'WTSI_DECIPHER',
    owner: 'DECIPHER (Wellcome Sanger Institute)',
    officialUrl: 'https://www.deciphergenomics.org/',
    license: 'Sólo el identificador, tal como lo citan HPO y MONDO; deciphergenomics.org no es accesible desde esta red.',
    codeFormat: '16',
    keyOnly: true,
    uri: () => null,
  },
  mesh: {
    name: 'MeSH 2026 (NLM) — descriptores de enfermedad (árbol C y F03), enfermedades raras (SCR) y los citados por otras fuentes',
    sourceCode: 'NLM_MESH',
    owner: 'U.S. National Library of Medicine',
    officialUrl: 'https://www.nlm.nih.gov/mesh/',
    license: LICENSES.MESH,
    codeFormat: 'D003920 (descriptor) · C531599 (concepto suplementario, SCR)',
    // Archivos oficiales de NLM (desc/supp 2026). Si una fuente cita un UI que MeSH 2026 ya no tiene, queda como
    // clave (código sin nombre) en este mismo sistema.
    keyFallback: true,
    uri: (code) => `http://id.nlm.nih.gov/mesh/${code}`,
  },
  umls: {
    name: 'UMLS (NLM) — CUI citados por MONDO, Orphanet, DOID y NCIt',
    sourceCode: 'NLM_UMLS',
    owner: 'U.S. National Library of Medicine',
    officialUrl: 'https://www.nlm.nih.gov/research/umls/',
    license: 'Sólo el CUI. El Metathesaurus exige cuenta UTS y licencia: no se carga.',
    codeFormat: 'C0011849',
    keyOnly: true,
    uri: (code) => `https://uts.nlm.nih.gov/uts/umls/concept/${code}`,
  },
};

/**
 * Sistemas que NO crea este catálogo pero hacia los que publica alineamientos
 * si ya están en la base: el concepto destino se calcula con el id
 * determinista de su propio importador y el mapeo se inserta sólo si existe.
 */
export const EXTERNAL_TARGETS = {
  // import-icd10cm.mjs: md5('mantra:icd10cm:concept:' || code)
  icd10cm: (code) => md5uuid(`mantra:icd10cm:concept:${code}`),
  // CIE-10-ES (glosario): misma codificación que ICD-10-CM, del que es la
  // traducción oficial del Ministerio de Sanidad. Slug de cie10es.mjs.
  'cie10es-dx': (code) => md5uuid(`mantra:glossary-es:concept:cie10es-dx-${slugify(code)}`),
  // Tema de MedlinePlus en español (import-medlineplus-es.mjs): slug `medlineplus-es-<id del tema>`.
  'medlineplus-es': (id) => md5uuid(`mantra:glossary-es:concept:medlineplus-es-${id}`),
};

export const KEY_VERSION = 'xref-keys';

export const conceptId = (cs, code) => md5uuid(`mantra:diseases:concept:${cs}:${code}`);
export const sourceId = (sourceCode) => md5uuid(`mantra:diseases:source:${sourceCode}`);
export const codeSystemId = (cs) => md5uuid(`mantra:diseases:cs:${cs}`);
export const versionId = (cs, version) => md5uuid(`mantra:diseases:csv:${cs}:${version}`);
export const canonicalUrl = (cs) => `https://mantracore.health/fhir/CodeSystem/${cs}`;
