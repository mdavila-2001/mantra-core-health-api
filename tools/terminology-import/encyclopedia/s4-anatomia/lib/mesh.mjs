// =============================================================================
// MeSH (NLM) — notas de alcance («scope notes») de los descriptores.
//
// Se consulta el punto SPARQL oficial de NLM (https://id.nlm.nih.gov/mesh/sparql)
// por lotes de 100 descriptores. Las notas existen SOLO en inglés (el castellano
// de MeSH es DeCS, que queda fuera): `lang: "en"`, «sin traducción oficial».
//
// Términos de uso (nlm.nih.gov/databases/download/terms_and_conditions.html,
// leídos el 2026-10-08): agradecer a NLM con la frase «Courtesy of the U.S.
// National Library of Medicine», no insinuar que NLM respalda el producto y
// advertir cuando los datos no son la versión más reciente.
// =============================================================================

import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { CACHE_DIR } from './config.mjs';

export const MESH_SPARQL = 'https://id.nlm.nih.gov/mesh/sparql';
export const MESH_BATCH = 100;
export const MESH_LICENSE =
  'NLM Terms and Conditions: citar «Courtesy of the U.S. National Library of Medicine»; sin cargo; no insinuar respaldo de NLM';
export const MESH_LICENSE_URL = 'https://www.nlm.nih.gov/databases/download/terms_and_conditions.html';
export const MESH_ATTRIBUTION = 'Courtesy of the U.S. National Library of Medicine';

export const meshRecordUrl = (descriptorId) => `https://meshb.nlm.nih.gov/record/ui?ui=${descriptorId}`;

export function isDescriptorId(id) {
  return /^D\d{6,9}$/.test(id);
}

export function meshQuery(descriptorIds) {
  const values = descriptorIds.map((d) => `mesh:${d}`).join(' ');
  return `PREFIX meshv: <http://id.nlm.nih.gov/mesh/vocab#>
PREFIX mesh: <http://id.nlm.nih.gov/mesh/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
SELECT ?d ?label ?scope ?updated ?term WHERE {
  VALUES ?d { ${values} }
  ?d rdfs:label ?label .
  OPTIONAL { ?d meshv:lastUpdated ?updated }
  OPTIONAL { ?d meshv:preferredConcept ?c . ?c meshv:scopeNote ?scope }
  OPTIONAL { ?d meshv:preferredConcept ?c2 . ?c2 (meshv:preferredTerm|meshv:term) ?t . ?t (meshv:prefLabel|meshv:altLabel) ?term }
}`;
}

/** Respuesta SPARQL JSON → `Map descriptor → { label, scopeNote|null, lastUpdated|null, terms[] }`. */
export function parseMeshBindings(json) {
  const out = new Map();
  for (const b of json?.results?.bindings ?? []) {
    const id = b.d?.value?.split('/').pop();
    if (!id) continue;
    const entry = out.get(id) ?? { id, label: b.label?.value ?? null, scopeNote: null, lastUpdated: null, terms: new Set() };
    if (b.scope?.value) entry.scopeNote = b.scope.value;
    if (b.updated?.value) entry.lastUpdated = b.updated.value;
    if (b.term?.value) entry.terms.add(b.term.value);
    out.set(id, entry);
  }
  for (const entry of out.values()) entry.terms = [...entry.terms].sort();
  return out;
}

/**
 * Descarga las notas de los descriptores dados. `http` es un `HttpClient`.
 * Caché por lote, mismos ids → mismo archivo.
 */
export async function fetchMeshDescriptors(http, ids, { onProgress } = {}) {
  const unique = [...new Set(ids.filter(isDescriptorId))].sort();
  const result = new Map();
  for (let i = 0; i < unique.length; i += MESH_BATCH) {
    const batch = unique.slice(i, i + MESH_BATCH);
    const url = `${MESH_SPARQL}?${new URLSearchParams({ query: meshQuery(batch), format: 'JSON' })}`;
    const key = createHash('sha1').update(batch.join('|')).digest('hex').slice(0, 16);
    const json = await http.getJsonCached(url, join(CACHE_DIR, 'mesh', `${key}.json`));
    for (const [id, entry] of parseMeshBindings(json)) result.set(id, entry);
    onProgress?.(Math.min(i + MESH_BATCH, unique.length), unique.length);
  }
  return result;
}

/**
 * ¿El ítem de Wikidata y el descriptor son el mismo concepto? La equivalencia la
 * DECLARA Wikidata (P486); acá solo se comprueba que la etiqueta inglesa del
 * ítem sea la del descriptor o uno de sus términos de entrada. Si no coincide,
 * la nota de alcance NO se publica (podría ser de un concepto más amplio).
 */
export function meshLabelAgrees(wikidataLabels, descriptor) {
  if (!descriptor) return false;
  const meshForms = new Set([descriptor.label, ...(descriptor.terms ?? [])].filter(Boolean).map(tokenKey));
  return [wikidataLabels].flat().filter(Boolean).some((l) => meshForms.has(tokenKey(l)));
}

/** Clave de comparación: minúsculas, sin puntuación, palabras ordenadas («Lens, Crystalline» ≡ «crystalline lens»). */
export function tokenKey(text) {
  return String(text).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim().split(' ').filter(Boolean).sort().join(' ');
}
