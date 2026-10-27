// =============================================================================
// Registro común de una afirmación publicada fármaco → enfermedad (puro).
//
// Una afirmación = UNA relación que una fuente publica, con su tipo exacto y
// su procedencia (fuente, id de origen, versión, URI, fecha). Los códigos son
// los que trae la fuente; los que se agregan por un cruce publicado van aparte
// en `crosswalk`, con el cruce y el predicado que lo justifican. Nada se deduce
// por nombre.
// =============================================================================

import { md5uuid } from '../../lib/glossary-es/load-plan.mjs';
import { RELATION_TYPES, SOURCES } from './sources.mjs';

/** Sistemas de código normalizados (prefijo estable, en mayúsculas). */
export const SYSTEM = {
  RXCUI: 'RXCUI',
  DRUGBANK: 'DRUGBANK',
  DRUGCENTRAL: 'DRUGCENTRAL',
  CHEMBL: 'CHEMBL',
  UNII: 'UNII',
  CHEBI: 'CHEBI',
  MESH: 'MESH',
  UMLS: 'UMLS',
  DOID: 'DOID',
  MONDO: 'MONDO',
  OMIM: 'OMIM',
  ORPHA: 'ORPHA',
  ICD10WHO: 'ICD10WHO',
  ICD10CM: 'ICD10CM',
  ICD11: 'ICD11',
  NCIT: 'NCIT',
  EFO: 'EFO',
  ATC: 'ATC',
  MESH_CONCEPT: 'MESH_CONCEPT',
  MEDRT_NUI: 'MEDRT_NUI',
  WIKIDATA: 'WIKIDATA',
  HPO: 'HPO',
  ICD11MMS: 'ICD11MMS',
  MESH_HEADING: 'MESH_HEADING',
};

const PATTERNS = {
  RXCUI: /^\d+$/,
  DRUGBANK: /^DB\d{5}$/,
  DRUGCENTRAL: /^\d+$/,
  CHEMBL: /^CHEMBL\d+$/,
  UNII: /^[A-Z0-9]{10}$/,
  CHEBI: /^\d+$/,
  MESH: /^[CD]\d{6,9}$/,
  UMLS: /^C\d{7}$/,
  DOID: /^\d+$/,
  MONDO: /^\d{7}$/,
  OMIM: /^\d{6}$/,
  ORPHA: /^\d+$/,
  ICD10WHO: /^[A-Z]\d{2}(\.[0-9A-Z]{1,4})?$/,
  ICD10CM: /^[A-Z]\d{2}(\.[0-9A-Z]{1,4})?$/,
  ICD11: /^\d+$/,
  NCIT: /^C\d+$/,
  EFO: /^\d{7}$/,
  // ATC nivel 5 (sustancia química). Solo el código: los nombres de clase son de la OMS y no se guardan.
  ATC: /^[A-Z]\d{2}[A-Z]{2}\d{2}$/,
  MESH_CONCEPT: /^M\d{7,9}$/,
  MEDRT_NUI: /^N\d{10}$/,
  WIKIDATA: /^Q\d+$/,
  HPO: /^\d{7}$/,
  ICD11MMS: /^[0-9A-Z]{4}(\.[0-9A-Z]{1,3})?$/,
  // Encabezado MeSH tal cual lo publica la fuente (texto, no identificador). Se resuelve a descriptor solo por igualdad exacta.
  MESH_HEADING: /^\S.*\S$/,
};

/** Un código normalizado o `null` si no tiene la forma del sistema (nunca se "arregla"). */
export function code(system, raw) {
  if (!PATTERNS[system]) throw new Error(`sistema de código desconocido: ${system}`);
  const value = String(raw ?? '').trim();
  return PATTERNS[system].test(value) ? { system, code: value } : null;
}

/** `PREFIJO:valor` → código normalizado (acepta los prefijos que usan las fuentes y los cruces). */
const PREFIX = {
  MESH: 'MESH',
  mesh: 'MESH',
  UMLS: 'UMLS',
  UMLS_CUI: 'UMLS',
  DOID: 'DOID',
  MONDO: 'MONDO',
  OMIM: 'OMIM',
  MIM: 'OMIM',
  Orphanet: 'ORPHA',
  ORDO: 'ORPHA',
  ORPHA: 'ORPHA',
  ICD10WHO: 'ICD10WHO',
  ICD10CM: 'ICD10CM',
  'icd11.foundation': 'ICD11',
  NCIT: 'NCIT',
  NCI: 'NCIT',
  EFO: 'EFO',
  CHEBI: 'CHEBI',
  DB: 'DRUGBANK',
  HP: 'HPO',
  NCIt: 'NCIT',
};

export function curie(raw) {
  const text = String(raw ?? '').trim();
  const i = text.indexOf(':');
  if (i <= 0) return null;
  const system = PREFIX[text.slice(0, i)];
  if (!system) return null;
  let value = text.slice(i + 1);
  if (system === 'ORPHA' && value.startsWith('Orphanet_')) value = value.slice('Orphanet_'.length);
  return code(system, value);
}

export const codeKey = (c) => `${c.system}:${c.code}`;

export function uniqueCodes(codes) {
  const seen = new Map();
  for (const c of codes) if (c && !seen.has(codeKey(c))) seen.set(codeKey(c), c);
  return [...seen.values()];
}

/** Id estable de la afirmación: depende sólo de la fuente y del id de origen. */
export const assertionId = (source, recordId) => md5uuid(`mantra:drug-treatments:assertion:${source}:${recordId}`);

/**
 * Arma una afirmación y verifica las reglas duras: tipo declarado por la fuente,
 * procedencia completa y al menos un código estándar de cada lado.
 */
export function makeAssertion({ source, recordId, uri, type, drug, condition, evidence, provenance }) {
  const def = SOURCES[source];
  if (!def) throw new Error(`fuente desconocida: ${source}`);
  const rel = RELATION_TYPES[type];
  if (!rel || rel.source !== source) throw new Error(`tipo ${type} no declarado por la fuente ${source}`);
  const drugCodes = uniqueCodes(drug.codes);
  const conditionCodes = uniqueCodes(condition.codes);
  if (drugCodes.length === 0) throw new Error(`${source}:${recordId} sin código de fármaco`);
  if (conditionCodes.length === 0) throw new Error(`${source}:${recordId} sin código de enfermedad`);
  // Fuente de GitHub: commit fijado. Fuente HTTP: lanzamiento (`release`) y URL del archivo.
  const http = def.transport === 'http';
  for (const k of ['version', 'retrievedAt', http ? 'release' : 'commit', 'file', 'fileSha256']) {
    if (!provenance?.[k]) throw new Error(`${source}:${recordId} sin procedencia «${k}»`);
  }
  if (http && !provenance.fileUrl) throw new Error(`${source}:${recordId} sin procedencia «fileUrl»`);
  if (!uri) throw new Error(`${source}:${recordId} sin URI`);
  return {
    id: assertionId(source, recordId),
    source: {
      key: source,
      name: def.name,
      recordId,
      uri,
      version: provenance.version,
      retrievedAt: provenance.retrievedAt,
      license: def.license,
      repo: def.repo ?? null,
      commit: provenance.commit ?? null,
      ...(http ? { release: provenance.release, fileUrl: provenance.fileUrl } : {}),
      file: provenance.file,
      fileSha256: provenance.fileSha256,
    },
    relation: { type, polarity: rel.polarity },
    drug: { label: drug.label ?? null, codes: drugCodes },
    condition: { label: condition.label ?? null, codes: conditionCodes },
    evidence: evidence ?? {},
  };
}

/** Une afirmaciones con el mismo id (misma fuente + mismo id de origen) acumulando evidencia. */
export function mergeById(assertions, mergeEvidence) {
  const byId = new Map();
  for (const a of assertions) {
    const prev = byId.get(a.id);
    if (!prev) byId.set(a.id, a);
    else prev.evidence = mergeEvidence(prev.evidence, a.evidence);
  }
  return [...byId.values()];
}

export const sortedUnique = (values) => [...new Set(values.filter((v) => v != null && v !== ''))].sort();
