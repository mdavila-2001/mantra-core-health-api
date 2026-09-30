// =============================================================================
// Carga del corpus normalizado completo (todas las capas NDJSON presentes) con
// el enriquecimiento de imágenes aplicado y las relaciones huérfanas quitadas.
// Lo usan `build-glossary-shards.mjs` y `load-glossary-es.mjs`, así la maqueta y
// la base ven exactamente las mismas filas.
// =============================================================================

import { existsSync } from 'node:fs';
import { assertRow, ndjsonPath, readNdjson } from './common.mjs';
import { applyImage, indexImages } from './enrich.mjs';
import { CATEGORY_KEYS, TAG_NAMES } from './taxonomy.mjs';

/** Capas de términos, en orden de precedencia (si un slug se repitiera, gana la primera). */
export const TERM_LAYERS = [
  'cie10es-diagnosticos',
  'cie10es-procedimientos',
  'cima',
  'medlineplus-es',
  'medlineplus-es-pruebas',
  'wikidata-anatomia',
  'loinc-es',
];

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
    for (const raw of readNdjson(p)) {
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
  let orphans = 0;
  for (const r of rows) {
    if (!r.relations?.length) continue;
    const kept = r.relations.filter((rel) => seen.has(rel.targetSlug));
    orphans += r.relations.length - kept.length;
    r.relations = kept;
  }
  return { rows, perLayer, orphanRelations: orphans, imagesIndexed: idx.size };
}
