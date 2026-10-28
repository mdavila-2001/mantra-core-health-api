// =============================================================================
// Plan de carga (puro, sin base) del corpus de diccionarios a `terminology.*`.
//
// Ids: `md5('mantra:dictionaries:<tipo>:<clave>')::uuid`, el patrón de
// `tools/terminology-import/` (mismo `md5uuid` del glosario ES). Los conceptos
// internos (idioma, tipos de designación y de relación, equivalencias) se
// REUSAN de `src/common/constants/concepts.ts` vía `deterministicId`.
//
// Nada de DDL (ADR-0021): todo cabe en las tablas del módulo 03 —
// catalog_concepts, concept_designations, concept_properties,
// concept_relationships, concept_maps y catalog_import_batches—.
// =============================================================================

import { deterministicId } from '../../lib/glossary-es/common.mjs';
import { md5uuid } from '../../lib/glossary-es/load-plan.mjs';

export { md5uuid };

export const CONCEPT = {
  TERM_ACTIVE: deterministicId('terminology:state:active'),
  LANG_EN: deterministicId('terminology:language:en'),
  LANG_ES: deterministicId('terminology:language:es'),
  LANG_LA: deterministicId('terminology:language:la'),
  DESIG_PREFERRED: deterministicId('terminology:designation-type:preferred'),
  DESIG_SYNONYM: deterministicId('terminology:designation-type:synonym'),
  EQUIV_EQUIVALENT: deterministicId('terminology:equivalence:equivalent'),
};

/**
 * Tipo de relación del corpus → concepto del backend. IS_A y PART_OF ya
 * existían (jerarquía genérica); los otros cuatro se agregan en
 * `concepts.ts` (aditivos) junto con este importador.
 */
export const RELATION_TYPE = {
  IS_A: deterministicId('terminology:relationship:is-a'),
  PART_OF: deterministicId('terminology:relationship:part-of'),
  DEVELOPS_FROM: deterministicId('terminology:relationship:develops-from'),
  LOCATED_IN: deterministicId('terminology:relationship:located-in'),
  INFECTIOUS_AGENT: deterministicId('terminology:relationship:infectious-agent'),
  TRANSMITTED_BY: deterministicId('terminology:relationship:transmitted-by'),
};

/** ¿La fila entra en la carga por defecto? (opt-in → sólo con `--include`). */
export function isDefaultLoaded(source, row, include = new Set()) {
  if (source.id === 'abbreviations-metainventory' && row.namespace !== 'clinical' && !include.has('abbreviations-literature')) return false;
  if (source.id === 'fma' && row.namespace !== 'fma-core' && !include.has('fma-full')) return false;
  // Fuentes por niveles (ChEBI, NCIt, AbreMES-DB): la fila declara su nivel y `--include <id>` carga todos.
  if (row.tier === 'opt-in') return include.has(source.id);
  return source.load === 'default' || include.has(source.id);
}

export const conceptId = (key) => md5uuid(`mantra:dictionaries:concept:${key}`);
export const sourceId = (code) => md5uuid(`mantra:dictionaries:source:${code}`);
export const codeSystemId = (cs) => md5uuid(`mantra:dictionaries:cs:${cs}`);
export const codeSystemVersionId = (cs, version) => md5uuid(`mantra:dictionaries:csv:${cs}:${version}`);
export const relationshipId = (srcKey, type, tgtKey) => md5uuid(`mantra:dictionaries:relationship:${srcKey}:${type}:${tgtKey}`);
export const conceptMapId = (srcKey, tgtConceptId, context) => md5uuid(`mantra:dictionaries:map:${srcKey}:${tgtConceptId}:${context}`);

/** Versión del code system: la de la fuente o, si no tiene, la fecha de descarga. */
export function versionOf(rows) {
  const v = rows.map((r) => r.provenance.version).filter(Boolean);
  if (v.length) return [...new Set(v)].sort().at(-1);
  return rows.map((r) => r.provenance.retrievedAt.slice(0, 10)).sort().at(-1);
}

export function codeSystemPlan(source, rows) {
  const version = versionOf(rows);
  return {
    source: { id: sourceId(source.id), code: `DICT_${source.id.toUpperCase().replace(/[^A-Z0-9]+/g, '_')}`, name: source.name, owner: source.owner, officialUrl: source.officialUrl, license: `${source.license} — ${source.licenseUrl}` },
    codeSystem: { id: codeSystemId(source.codeSystem), internalCode: source.codeSystem, name: source.name, canonicalUrl: source.canonicalUrl },
    version: { id: codeSystemVersionId(source.codeSystem, version), version },
  };
}

export function conceptTuple(row, versionId) {
  return [conceptId(row.key), versionId, row.code, row.display, row.definition ?? null, CONCEPT.TERM_ACTIVE];
}

export function designationTuples(row) {
  const cid = conceptId(row.key);
  // El idioma lo declara la fuente en `row.lang` (todas las OBO: en; AbreMES-DB: es).
  const lang = row.lang === 'es' ? CONCEPT.LANG_ES : CONCEPT.LANG_EN;
  const out = [[md5uuid(`mantra:dictionaries:designation:preferred:${row.key}`), cid, lang, CONCEPT.DESIG_PREFERRED, row.display, true]];
  row.synonymsExact.forEach((s) => out.push([md5uuid(`mantra:dictionaries:designation:synonym:${row.key}:${s}`), cid, lang, CONCEPT.DESIG_SYNONYM, s, false]));
  // Nombres en castellano y latín sólo cuando la fuente DECLARA el idioma (FMA: axioma `language`).
  for (const [lang, values] of [['es', row.designationsEs], ['la', row.designationsLa]]) {
    for (const s of values ?? []) out.push([md5uuid(`mantra:dictionaries:designation:${lang}:${row.key}:${s}`), cid, lang === 'es' ? CONCEPT.LANG_ES : CONCEPT.LANG_LA, CONCEPT.DESIG_SYNONYM, s, false]);
  }
  return out;
}

/**
 * Dos propiedades por concepto: la procedencia (fuente, id de origen, versión,
 * URI, archivo y fecha) y el resto de lo que publica la fuente (xrefs,
 * sinónimos no exactos, subsets, relaciones no tipadas y la procedencia de
 * cada relación tipada que sale de este concepto).
 */
export function propertyTuples(row) {
  const cid = conceptId(row.key);
  const entry = {
    domain: row.domain,
    lang: row.lang,
    definitionXrefs: row.definitionXrefs,
    synonymsOther: row.synonymsOther,
    xrefs: row.xrefs,
    subsets: row.subsets,
    namespace: row.namespace,
    altIds: row.altIds,
    relations: row.relations.map((x) => ({ type: x.type, predicate: x.predicate, target: x.target, relationshipId: x.targetKey ? relationshipId(row.key, x.type, x.targetKey) : null })),
    otherRelations: row.otherRelations,
    ...row.extra,
  };
  return [
    [md5uuid(`mantra:dictionaries:property:dictionary-provenance:${row.key}`), cid, 'dictionary-provenance', 'json', JSON.stringify(row.provenance)],
    [md5uuid(`mantra:dictionaries:property:dictionary-entry:${row.key}`), cid, 'dictionary-entry', 'json', JSON.stringify(entry)],
  ];
}

/** Relaciones tipadas resueltas DENTRO del corpus cargado. */
export function relationshipTuples(row, loadedKeys) {
  const out = [];
  row.relations.forEach((x, i) => {
    if (!x.targetKey || !loadedKeys.has(x.targetKey)) return;
    out.push([relationshipId(row.key, x.type, x.targetKey), conceptId(row.key), conceptId(x.targetKey), RELATION_TYPE[x.type], i]);
  });
  return out;
}

/**
 * Claves con las que un xref o una enfermedad se buscan en la base, para
 * enlazar con lo que ya cargaron el glosario y las otras sesiones. Sólo códigos
 * idénticos, nunca nombres:
 *  - ICD10CM:X → concepto X de `icd10cm` y de `cie10es-diagnosticos-2026`
 *    (la CIE-10-ES es la traducción oficial de ICD-10-CM, mismos códigos).
 *  - ICD10/ICD10WHO:X → concepto X de `cie10es-diagnosticos-2026` (categorías de
 *    3-4 caracteres compartidas con la CIE-10 OMS) — sólo si existe tal cual.
 *  - MESH:D… → fichas del glosario cuyo `glossary-external-ids.mesh` lo contiene.
 *  - TA98:A… → fichas de anatomía del glosario (Wikidata) cuyo `glossary-external-ids.ta98` lo contiene.
 *  - MONDO:/DOID: → concepto con ese código en el code system de Mondo/DOID si
 *    otra sesión lo cargó (por URL canónica).
 */
export function lookupKeys(xrefId) {
  const [prefix, ...rest] = String(xrefId).split(':');
  const code = rest.join(':');
  if (!code) return [];
  switch (prefix) {
    case 'ICD10CM':
      return [{ kind: 'code', codeSystems: ['icd10cm', 'cie10es-diagnosticos-2026'], code: code.toUpperCase() }];
    case 'ICD10':
    case 'ICD10WHO':
      return [{ kind: 'code', codeSystems: ['cie10es-diagnosticos-2026'], code: code.toUpperCase() }];
    case 'MESH':
      return [{ kind: 'mesh', code }];
    case 'TA98':
      return [{ kind: 'ta98', code }];
    case 'MONDO':
      return [{ kind: 'canonical', canonicalUrl: 'http://purl.obolibrary.org/obo/mondo.owl', code: xrefId }];
    case 'DOID':
      return [{ kind: 'canonical', canonicalUrl: 'http://purl.obolibrary.org/obo/doid.owl', code: xrefId }];
    default:
      return [];
  }
}

/**
 * Capa opcional de nombres ES de Wikidata (import-wikidata-es-labels.mjs):
 * designaciones ES (sinónimo, nunca preferida: no es el nombre oficial) y una
 * propiedad con su procedencia por ítem. `rows` son las filas de un mismo concepto.
 */
export function esLabelTuples(key, rows, ownEs = new Set()) {
  const cid = conceptId(key);
  // Un nombre idéntico al que la fuente del concepto ya declara en castellano no se repite como designación.
  const values = [...new Set(rows.flatMap((r) => [r.esLabel, ...r.esAliases]))].filter((v) => !ownEs.has(v));
  const designations = values.map((v) => [md5uuid(`mantra:dictionaries:designation:wikidata-es:${key}:${v}`), cid, CONCEPT.LANG_ES, CONCEPT.DESIG_SYNONYM, v, false]);
  const provenance = rows.map((r) => ({ source: 'wikidata', item: r.q, uri: `https://www.wikidata.org/wiki/${r.q}`, property: r.property, label: r.esLabel, aliases: r.esAliases, description: r.esDescription, retrievedAt: r.retrievedAt, license: 'CC0 1.0', note: 'nombre de la comunidad de Wikidata, no traducción oficial' }));
  return { designations, property: [md5uuid(`mantra:dictionaries:property:dictionary-es-labels:${key}`), cid, 'dictionary-es-labels', 'json', JSON.stringify(provenance)] };
}
