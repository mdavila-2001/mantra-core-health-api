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
    name: 'NCI Thesaurus — Disease or Disorder (C2991)',
    sourceCode: 'NCI_NCIT',
    owner: 'National Cancer Institute — Enterprise Vocabulary Services',
    officialUrl: 'https://evs.nci.nih.gov/',
    license: LICENSES.NCIT,
    codeFormat: 'C2985',
    uri: (code) => `http://purl.obolibrary.org/obo/NCIT_${code}`,
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
    name: 'CIE-11 MMS — claves citadas por Orphanet',
    sourceCode: 'WHO_ICD11',
    owner: 'Organización Mundial de la Salud',
    officialUrl: 'https://icd.who.int/browse/latest-release/mms/es',
    license: 'Sólo el código. La CIE-11 es CC BY-ND 3.0 IGO; su descarga (icd.who.int/icdcdn) no es accesible desde esta red.',
    codeFormat: '5A11',
    keyOnly: true,
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
  mesh: {
    name: 'MeSH (NLM) — descriptores citados por MONDO, Orphanet y DOID',
    sourceCode: 'NLM_MESH',
    owner: 'U.S. National Library of Medicine',
    officialUrl: 'https://www.nlm.nih.gov/mesh/',
    license: 'Sólo el identificador. MeSH es de libre uso con atribución, pero su descarga (nlmpubs.nlm.nih.gov) no es accesible desde esta red.',
    codeFormat: 'D003920',
    keyOnly: true,
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
};

export const KEY_VERSION = 'xref-keys';

export const conceptId = (cs, code) => md5uuid(`mantra:diseases:concept:${cs}:${code}`);
export const sourceId = (sourceCode) => md5uuid(`mantra:diseases:source:${sourceCode}`);
export const codeSystemId = (cs) => md5uuid(`mantra:diseases:cs:${cs}`);
export const versionId = (cs, version) => md5uuid(`mantra:diseases:csv:${cs}:${version}`);
export const canonicalUrl = (cs) => `https://mantracore.health/fhir/CodeSystem/${cs}`;
