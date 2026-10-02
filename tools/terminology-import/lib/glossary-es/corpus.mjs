// =============================================================================
// Carga del corpus normalizado completo (todas las capas NDJSON presentes) con
// el enriquecimiento de imágenes aplicado y las relaciones huérfanas quitadas.
// Lo usan `build-glossary-shards.mjs` y `load-glossary-es.mjs`, así la maqueta y
// la base ven exactamente las mismas filas.
// =============================================================================

import { existsSync } from 'node:fs';
import { assertRow, ndjsonPath, readNdjson } from './common.mjs';
import { applyImage, indexImages } from './enrich.mjs';
import { applyDxHierarchy, inheritTagsFromDiseases, tagAnatomyByTa98 } from './graph.mjs';
import { applyConceptIdentities, applyRelationEdges } from './wikidata-relations.mjs';
import { CATEGORY_KEYS, TAG_NAMES, isGlossaryDxLevel } from './taxonomy.mjs';

/**
 * Capas de términos, en orden de precedencia (si un slug se repitiera, gana la primera).
 *
 * `cie10es-procedimientos` (78 948 códigos ICD-10-PCS de España) ya no entra:
 * Bolivia no codifica procedimientos con PCS, la fuente no trae definiciones y
 * el 97 % quedaba sin etiqueta. Su NDJSON se sigue generando por si se quiere
 * como sistema de códigos, pero no es glosario.
 */
export const TERM_LAYERS = [
  'cie10es-diagnosticos',
  'cima',
  'medlineplus-es',
  'medlineplus-es-pruebas',
  'wikidata-anatomia',
  'loinc-es',
  'inlasa-aranceles',
];

/** Aristas de Wikidata (enfermedad → síntoma, medicamento, especialidad…); ver `wikidata-relations.mjs`. */
export const RELATION_EDGES_LAYER = 'wikidata-relaciones';

/** Identidades CIE-10 ↔ MeSH de Wikidata (una ficha CIE-10-ES = un tema de MedlinePlus). */
export const IDENTITIES_LAYER = 'wikidata-identidades';

/** Filtro por capa: qué filas de la fuente son fichas del glosario. */
const LAYER_FILTERS = {
  'cie10es-diagnosticos': (row) => isGlossaryDxLevel(row.code),
};

export function loadCorpus({ layers = TERM_LAYERS, log = console.warn } = {}) {
  const imagesPath = ndjsonPath('wikidata-images');
  const idx = existsSync(imagesPath) ? indexImages(readNdjson(imagesPath)) : new Map();
  const rows = [];
  const seen = new Set();
  const perLayer = {};
  for (const layer of layers) {
    const p = ndjsonPath(layer);
    if (!existsSync(p)) {
      log(`[corpus] capa ausente (se omite): ${layer}`);
      continue;
    }
    let n = 0;
    const keep = LAYER_FILTERS[layer] ?? (() => true);
    for (const raw of readNdjson(p)) {
      if (!keep(raw)) continue;
      const row = applyImage(assertRow(raw), idx);
      if (!CATEGORY_KEYS.includes(row.categoryKey)) throw new Error(`categoryKey inválida en ${row.slug}: ${row.categoryKey}`);
      for (const t of row.tagKeys) if (!TAG_NAMES[t]) throw new Error(`tagKey inválida en ${row.slug}: ${t}`);
      if (seen.has(row.slug)) throw new Error(`Slug repetido entre capas: ${row.slug}`);
      seen.add(row.slug);
      rows.push(row);
      n++;
    }
    perLayer[layer] = n;
  }
  let relationStats = null;
  const edgesPath = ndjsonPath(RELATION_EDGES_LAYER);
  if (existsSync(edgesPath)) {
    relationStats = applyRelationEdges(rows, readNdjson(edgesPath));
    for (const r of rows.slice(rows.length - relationStats.fichasCreadas)) seen.add(r.slug);
    perLayer[`${RELATION_EDGES_LAYER} (fichas creadas)`] = relationStats.fichasCreadas;
  } else {
    log(`[corpus] capa ausente (se omite): ${RELATION_EDGES_LAYER}`);
  }
  let identityStats = null;
  if (existsSync(ndjsonPath(IDENTITIES_LAYER))) identityStats = applyConceptIdentities(rows, readNdjson(ndjsonPath(IDENTITIES_LAYER)));
  else log(`[corpus] capa ausente (se omite): ${IDENTITIES_LAYER}`);
  let orphans = 0;
  for (const r of rows) {
    if (!r.relations?.length) continue;
    const kept = r.relations.filter((rel) => seen.has(rel.targetSlug));
    orphans += r.relations.length - kept.length;
    r.relations = kept;
  }
  const graph = { jerarquiaCie10: applyDxHierarchy(rows), anatomiaTa98: tagAnatomyByTa98(rows), etiquetasHeredadas: inheritTagsFromDiseases(rows) };
  for (const r of rows) r.relations?.sort((x, y) => x.type.localeCompare(y.type) || x.targetSlug.localeCompare(y.targetSlug));
  return { rows, perLayer, orphanRelations: orphans, imagesIndexed: idx.size, relationStats, identityStats, graph };
}
