// =============================================================================
// Plan de carga de afirmaciones fármaco → enfermedad (puro, sin base).
//
// `concept_relationships` sólo guarda origen, destino, tipo y ordinal: no tiene
// dónde poner fuente, id de origen, versión, URI, fecha ni evidencia. Para no
// perder la procedencia SIN DDL, cada afirmación publicada se carga como un
// CONCEPTO de un code system propio por fuente (`drug-treatment-assertions-*`)
// con su procedencia en `concept_properties`, y se enlaza con dos relaciones
// estructurales: afirmación → fármaco y afirmación → enfermedad. Así ninguna
// arista fármaco → enfermedad existe sin su fuente. La propuesta para que el
// modelo guarde procedencia en la propia relación está en
// `docs/seed-research/drug-treatments.md`.
//
// Ids deterministas (md5uuid con prefijo `mantra:drug-treatments:`), como el
// resto de los importadores: la segunda carga inserta 0 filas.
// =============================================================================

import { CONCEPT, md5uuid } from '../../lib/glossary-es/load-plan.mjs';
import { RELATION_TYPES, SOURCES, STRUCTURAL_TYPES } from './sources.mjs';

export const PROPERTY = {
  RELATION_TYPE: 'assertion_relation_type',
  POLARITY: 'assertion_polarity',
  DRUG_CODES: 'assertion_drug_codes',
  DRUG_LABEL: 'assertion_drug_label',
  DRUG_COMBINATION: 'assertion_drug_combination',
  CONDITION_CODES: 'assertion_condition_codes',
  CONDITION_LABEL: 'assertion_condition_label',
  CROSSWALK: 'assertion_crosswalk',
  EVIDENCE: 'assertion_evidence',
  SOURCE_NAME: 'source_name',
  SOURCE_RECORD_ID: 'source_record_id',
  SOURCE_URL: 'source_url',
  SOURCE_VERSION: 'source_version',
  SOURCE_RETRIEVED_AT: 'source_retrieved_at',
  SOURCE_LICENSE: 'source_license',
  SOURCE_REPOSITORY: 'source_repository',
  SOURCE_COMMIT: 'source_commit',
  SOURCE_RELEASE: 'source_release',
  SOURCE_FILE_URL: 'source_file_url',
  SOURCE_FILE: 'source_file',
  SOURCE_FILE_SHA256: 'source_file_sha256',
  TYPE_DEFINITION_EN: 'relation_type_definition_en',
  TYPE_LABEL_ES_OFFICIAL: 'relation_type_label_es_official',
};

const INTERNAL_SOURCE = {
  code: 'MANTRA_DRUG_TREATMENTS',
  name: 'AloVida — tipos de relación de tratamientos farmacológicos publicados',
  owner: 'Mantra Core Health',
  officialUrl: null,
  license: 'Etiquetas en castellano: traducción propia (no oficial). Definiciones en inglés: literales de cada fuente.',
};

export const TYPES_CODE_SYSTEM = 'drug-treatment-relation-types';
export const assertionCodeSystem = (sourceKey) => `drug-treatment-assertions-${sourceKey}`;

const id = (key) => md5uuid(`mantra:drug-treatments:${key}`);
export const typeConceptId = (typeKey) => id(`type:${typeKey}`);

function sourcePlan(code, def) {
  return { id: id(`source:${code}`), code, name: def.name, owner: def.owner, officialUrl: def.officialUrl ?? null, license: def.license };
}

function codeSystemPlan(internalCode, name, version) {
  return {
    codeSystem: { id: id(`cs:${internalCode}`), internalCode, name, canonicalUrl: `https://mantracore.health/fhir/CodeSystem/${internalCode}` },
    version: { id: id(`csv:${internalCode}:${version}`), version },
  };
}

function prop(conceptId, code, dataType, value) {
  return [id(`property:${code}:${conceptId}`), conceptId, code, dataType, JSON.stringify(value)];
}

/** Tipos de relación: un concepto por tipo declarado por las fuentes + los dos estructurales. */
export function typesPlan() {
  const base = codeSystemPlan(TYPES_CODE_SYSTEM, 'Tipos de relación fármaco → enfermedad (por fuente)', '1');
  const source = sourcePlan(INTERNAL_SOURCE.code, INTERNAL_SOURCE);
  const all = { ...RELATION_TYPES, ...STRUCTURAL_TYPES };
  const concepts = Object.entries(all).map(([key, def]) => [typeConceptId(key), base.version.id, key, def.labelEs, def.definitionEn, CONCEPT.TERM_ACTIVE]);
  const properties = Object.entries(all).flatMap(([key, def]) => [
    prop(typeConceptId(key), PROPERTY.TYPE_DEFINITION_EN, 'text', def.definitionEn),
    prop(typeConceptId(key), PROPERTY.TYPE_LABEL_ES_OFFICIAL, 'boolean', false),
    ...(def.polarity ? [prop(typeConceptId(key), PROPERTY.POLARITY, 'string', def.polarity)] : []),
    ...(def.source ? [prop(typeConceptId(key), PROPERTY.SOURCE_NAME, 'string', SOURCES[def.source].name)] : []),
  ]);
  return { ...base, source, concepts, properties, relationships: [] };
}

const codeText = (codes) => codes.map((c) => `${c.system}:${c.code}`).join(' + ');

/** Texto de `display`: etiquetas literales de la fuente o, si no trae, los códigos. Nunca traducido. */
export function assertionDisplay(a) {
  const drug = a.drug.label ?? codeText(a.drug.codes);
  const condition = a.condition.label ?? codeText(a.condition.codes);
  return `${drug} → ${condition}`.slice(0, 500);
}

export function propertiesFor(a) {
  const text = (code, v) => (v == null || v === '' ? [] : [prop(a.id, code, 'string', String(v))]);
  const json = (code, v) => (v == null ? [] : [prop(a.id, code, 'json', v)]);
  return [
    ...text(PROPERTY.RELATION_TYPE, a.relation.type),
    ...text(PROPERTY.POLARITY, a.relation.polarity),
    ...json(PROPERTY.DRUG_CODES, a.drug.codes),
    ...text(PROPERTY.DRUG_LABEL, a.drug.label),
    ...(a.drug.combination ? [prop(a.id, PROPERTY.DRUG_COMBINATION, 'boolean', true)] : []),
    ...json(PROPERTY.CONDITION_CODES, a.condition.codes),
    ...text(PROPERTY.CONDITION_LABEL, a.condition.label),
    ...json(PROPERTY.CROSSWALK, a.crosswalk),
    ...json(PROPERTY.EVIDENCE, a.evidence),
    ...text(PROPERTY.SOURCE_NAME, a.source.name),
    ...text(PROPERTY.SOURCE_RECORD_ID, a.source.recordId),
    ...text(PROPERTY.SOURCE_URL, a.source.uri),
    ...text(PROPERTY.SOURCE_VERSION, a.source.version),
    ...text(PROPERTY.SOURCE_RETRIEVED_AT, a.source.retrievedAt),
    ...text(PROPERTY.SOURCE_LICENSE, a.source.license),
    ...text(PROPERTY.SOURCE_REPOSITORY, a.source.repo),
    ...text(PROPERTY.SOURCE_COMMIT, a.source.commit),
    ...text(PROPERTY.SOURCE_RELEASE, a.source.release),
    ...text(PROPERTY.SOURCE_FILE_URL, a.source.fileUrl),
    ...text(PROPERTY.SOURCE_FILE, a.source.file),
    ...text(PROPERTY.SOURCE_FILE_SHA256, a.source.fileSha256),
  ];
}

/** Plan de una fuente: un code system de afirmaciones versionado por commit. */
export function assertionsPlan(sourceKey, assertions) {
  const def = SOURCES[sourceKey];
  const internalCode = assertionCodeSystem(sourceKey);
  const base = codeSystemPlan(internalCode, `Afirmaciones publicadas fármaco → enfermedad: ${def.name}`, def.commit ?? def.versionTag);
  return {
    ...base,
    source: sourcePlan(`DRUG_TREATMENTS_${sourceKey.toUpperCase().replace(/-/g, '_')}`, def),
    assertions,
    concepts: assertions.map((a) => [a.id, base.version.id, a.source.recordId, assertionDisplay(a), null, CONCEPT.TERM_ACTIVE]),
    properties: assertions.flatMap(propertiesFor),
  };
}

/**
 * Relaciones estructurales hacia conceptos YA cargados en la base. `targets`
 * es un Map `SISTEMA:código` → [concept_id] (lo arma `link.mjs` consultando la
 * base). Sólo se enlaza por código exacto; sin destino, la afirmación queda
 * igual con sus códigos en propiedades. Una combinación de ingredientes no
 * se enlaza a cada ingrediente por separado.
 */
export function relationshipsFor(a, targets) {
  const rows = [];
  const add = (role, codes) => {
    const seen = new Set();
    for (const c of codes) {
      for (const target of targets.get(`${c.system}:${c.code}`) ?? []) {
        if (seen.has(target)) continue;
        seen.add(target);
        rows.push([id(`rel:${a.id}:${role}:${target}`), a.id, target, typeConceptId(role), seen.size]);
      }
    }
  };
  // Una combinación no se enlaza a cada ingrediente: la fuente habla del conjunto.
  if (!a.drug.combination) add('assertion:drug', [...a.drug.codes, ...a.crosswalk.drug]);
  add('assertion:condition', [...a.condition.codes, ...a.crosswalk.condition]);
  return rows;
}
