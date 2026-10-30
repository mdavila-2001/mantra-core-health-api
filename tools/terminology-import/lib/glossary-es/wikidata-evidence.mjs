// =============================================================================
// Wikidata → relaciones con evidencia (TAREA-41 F3.6). Puro: no toca red ni base.
//
// Complementa `wikidata-relations.mjs` (que alimenta las fichas del glosario)
// con propiedades cuyo destino es OTRA enfermedad, factor o causa con código
// propio, y que por eso se cargan por el camino de evidencia
// (`bulkLoadRelationships`, nivel T3 `COLLABORATIVE_KNOWLEDGE`) en vez de crear
// fichas nuevas:
//
//   P828  «tiene causa»        enfermedad → causa           CAUSED_BY
//   P5642 «factor de riesgo»   factor → enfermedad          RISK_FACTOR
//   P1542 «tiene efecto»       enfermedad → enfermedad      COMPLICATION
//   P279  «subclase de»        hijo → padre (sólo entre ítems con código)  REL_IS_A
//
// Ambos extremos deben identificarse con la identidad MONDO de F3.1 por un
// código declarado en Wikidata (CIE-10 P494, CIE-10-CM P4229, MeSH P486). Un
// ítem sin código o sin grupo no se carga: no se adivina por nombre ni se crea
// una ficha. Si los códigos de un ítem caen en grupos distintos, es un conflicto
// y se salta (`ambiguous-codes`).
//
// No entran acá, a propósito (ver el reporte de F3.6): P2175 (hay que resolver
// fármacos y fusionarlos con P2176 por clave natural), P769 (interacciones: van
// a `drug_interactions`, que exige un concepto de severidad que no existe) y
// P4044 (la ficha no define el tipo de relación).
// =============================================================================

import { deterministicId } from './common.mjs';
import { RELATION_TYPE } from './load-plan.mjs';

export const WIKIDATA_EVIDENCE_TIER = 'COLLABORATIVE_KNOWLEDGE';
export const WIKIDATA_SOURCE_TAG = 'wikidata-relations-evidence';

/** Tipos de relación nuevos de F1.1 (mismos ids que `src/common/constants/concepts.ts`). */
export const EVIDENCE_RELATION_TYPE = Object.freeze({
  CAUSED_BY: deterministicId('terminology:relationship:caused-by'),
  RISK_FACTOR: deterministicId('terminology:relationship:risk-factor'),
  COMPLICATION: deterministicId('terminology:relationship:complication'),
  SYMPTOM: RELATION_TYPE.SYMPTOM,
});

/** `reverse`: el ítem Wikidata del sujeto es el DESTINO de la arista cargada. */
export const EVIDENCE_PROPERTIES = Object.freeze({
  P828: { label: 'has cause', type: 'CAUSED_BY', reverse: false },
  P5642: { label: 'risk factor', type: 'RISK_FACTOR', reverse: true },
  P1542: { label: 'has effect', type: 'COMPLICATION', reverse: false },
});
export const SUBCLASS_PROPERTY = Object.freeze({ id: 'P279', label: 'subclass of' });

const CODE_PROPERTIES = [
  ['P494', 'ICD10WHO', 'icd10'],
  ['P4229', 'ICD10CM', 'icd10cm'],
  ['P486', 'MESH', 'mesh'],
];

const codedItem = (v) => CODE_PROPERTIES.map(([p]) => `{ ?${v} wdt:${p} [] }`).join(' UNION ');

/**
 * Pares (sujeto, objeto) de una propiedad con código en AMBOS extremos. Sólo ids
 * de ítem: los códigos vienen de `codeTableSparql` y se unen en local (con
 * `OPTIONAL` por cada código Wikidata recorre todas las aristas de P279, millones,
 * y corta la respuesta).
 */
export const itemPairsSparql = (prop) => `SELECT DISTINCT ?d ?x WHERE { ?d wdt:${prop} ?x . ${codedItem('d')} ${codedItem('x')} }`;

/** Todos los ítems con un código dado (P494, P4229 o P486). */
export const codeTableSparql = (codeProp) => `SELECT ?item ?code WHERE { ?item wdt:${codeProp} ?code }`;

export const CODE_TABLES = Object.freeze(CODE_PROPERTIES.map(([property, prefix]) => ({ property, prefix })));

const qid = (uri) => String(uri ?? '').split('/').pop() || null;

/** Bindings de `codeTableSparql` → Map Q → códigos con prefijo (`MESH:D001`). */
export function parseCodeTable(json, prefix, into = new Map()) {
  for (const b of json?.results?.bindings ?? []) {
    const q = qid(b.item?.value);
    const code = b.code?.value?.trim();
    if (!q || !/^Q\d+$/.test(q) || !code) continue;
    const list = into.get(q) ?? new Set();
    list.add(`${prefix}:${code}`);
    into.set(q, list);
  }
  return into;
}

/** Bindings de `itemPairsSparql` + tablas de códigos → aristas con los códigos de cada extremo. */
export function parseItemEdges(json, prop, codes) {
  const seen = new Set();
  const edges = [];
  for (const b of json?.results?.bindings ?? []) {
    const d = qid(b.d?.value);
    const x = qid(b.x?.value);
    if (!d || !x || d === x || !/^Q\d+$/.test(d) || !/^Q\d+$/.test(x)) continue;
    const key = `${d}|${x}`;
    if (seen.has(key)) continue;
    seen.add(key);
    edges.push({ property: prop, subjectQ: d, objectQ: x, subject: [...(codes.get(d) ?? [])].sort(), object: [...(codes.get(x) ?? [])].sort() });
  }
  return edges.sort((a, b) => a.subjectQ.localeCompare(b.subjectQ) || a.objectQ.localeCompare(b.objectQ));
}

/**
 * Resolutor de un ítem de Wikidata a UN concepto, por sus códigos.
 * @param {(curie: string) => { conceptId: string|null, reason?: string|null }} resolveCode - p. ej. `identity.resolve`.
 */
export function itemResolver(resolveCode) {
  return (codes) => {
    const ids = new Set();
    let reason = 'item-without-code';
    for (const code of codes) {
      const found = resolveCode(code);
      if (found?.conceptId) ids.add(found.conceptId);
      else reason = found?.reason ?? 'unresolved';
    }
    if (ids.size > 1) return { conceptId: null, reason: 'ambiguous-codes' };
    return ids.size === 1 ? { conceptId: [...ids][0] } : { conceptId: null, reason };
  };
}

/**
 * Aristas P828/P5642/P1542 → filas de `bulkLoadRelationships` (T3).
 * @param {ReturnType<typeof parseItemEdges>} edges
 * @param {{ resolveItem: ReturnType<typeof itemResolver>, validFrom: string }} options
 */
export function evidenceRows(edges, { resolveItem, validFrom }) {
  if (!validFrom) throw new Error('evidenceRows: falta validFrom (fecha de la consulta).');
  const stats = { read: 0, unresolved: {}, selfEdges: 0, duplicates: 0, rows: 0, byProperty: {} };
  const miss = (reason) => { stats.unresolved[reason] = (stats.unresolved[reason] ?? 0) + 1; };
  const seen = new Set();
  const rows = [];

  for (const e of edges) {
    stats.read += 1;
    const spec = EVIDENCE_PROPERTIES[e.property];
    if (!spec) throw new Error(`evidenceRows: propiedad sin tipo definido (${e.property}).`);
    const subject = resolveItem(e.subject);
    const object = resolveItem(e.object);
    if (!subject.conceptId || !object.conceptId) {
      miss(subject.conceptId ? `object-${object.reason}` : `subject-${subject.reason}`);
      continue;
    }
    if (subject.conceptId === object.conceptId) {
      stats.selfEdges += 1;
      continue;
    }
    const [source, target] = spec.reverse ? [object.conceptId, subject.conceptId] : [subject.conceptId, object.conceptId];
    const sourceReference = `wikidata:${e.subjectQ} ${e.property} ${e.objectQ}`;
    const dedupe = `${source}|${target}|${spec.type}|${sourceReference}`;
    if (seen.has(dedupe)) {
      stats.duplicates += 1;
      continue;
    }
    seen.add(dedupe);
    rows.push({
      sourceConceptId: source,
      targetConceptId: target,
      relationshipTypeConceptId: EVIDENCE_RELATION_TYPE[spec.type],
      evidenceTier: WIKIDATA_EVIDENCE_TIER,
      sourceReference,
      validFrom,
    });
    stats.byProperty[e.property] = (stats.byProperty[e.property] ?? 0) + 1;
  }
  stats.rows = rows.length;
  return { rows, stats };
}

/**
 * Aristas P279 → aristas hijo → padre para `hierarchyToRelationshipRows`. La
 * clave de cada extremo es el ítem (`wd:Q…`); `itemCodes` los lleva a sus códigos.
 */
export function subclassEdges(edges) {
  const itemCodes = new Map();
  const out = edges.map((e) => {
    itemCodes.set(`wd:${e.subjectQ}`, e.subject);
    itemCodes.set(`wd:${e.objectQ}`, e.object);
    return { child: `wd:${e.subjectQ}`, parent: `wd:${e.objectQ}`, via: 'wikidata-p279' };
  });
  return { edges: out, itemCodes };
}
