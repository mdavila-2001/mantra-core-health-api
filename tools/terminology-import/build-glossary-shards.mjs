#!/usr/bin/env node
// =============================================================================
// Shards estáticos para la maqueta del front (ver glossary-data-build/SCHEMA.md):
//   shards/index.json
//   shards/<categoryKey>/page-<n>.json     500 tarjetas por página, orden esName (es)
//   shards/detail/<slug>.json              fila completa si hay drugFacts o definitionHtml
//   shards/search-index/<letra>.json       índice liviano
// Sin red. Reescribe `shards/` entero en cada corrida (es salida derivada).
// =============================================================================

import { rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BUILD_DIR, foldForSearch, nowIso, writeJson } from './lib/glossary-es/common.mjs';
import { loadCorpus } from './lib/glossary-es/corpus.mjs';
import { CATEGORY_KEYS, CATEGORY_NAMES, TAG_NAMES } from './lib/glossary-es/taxonomy.mjs';

export const PAGE_SIZE = 500;
const SHARDS = join(BUILD_DIR, 'shards');
const collator = new Intl.Collator('es');

/** Fila completa → tarjeta liviana (sin HTML, secciones de ficha ni presentaciones). */
export function toCard(row, hasDetail) {
  // `sourceName`/`sourceLicense` se repiten idénticos en toda una fuente: viven
  // una sola vez en `index.json#sources` (clave `source`). Ahorra ~1/3 del peso.
  const { definitionHtml, sections, sourceName, sourceLicense, ...rest } = row;
  const card = { ...rest, hasDetail };
  if (row.definitionSource) {
    const { license, ...ds } = row.definitionSource;
    card.definitionSource = ds;
  }
  if (row.drugFacts) {
    const { sections: _s, products, ...df } = row.drugFacts;
    card.drugFacts = {
      ...df,
      sectionCodes: (row.drugFacts.sections ?? []).map((s) => s.section),
      products: products.map(({ presentations, ...p }) => ({ ...p, presentationCount: presentations?.length ?? 0 })),
    };
  }
  return card;
}

export function searchLetter(name) {
  const c = foldForSearch(name).trim().charAt(0);
  if (c === 'ñ') return 'ñ';
  if (/[a-z]/.test(c)) return c;
  if (/[0-9]/.test(c)) return '0-9';
  return 'otros';
}

function main() {
  const t0 = Date.now();
  const { rows, perLayer, orphanRelations, imagesIndexed } = loadCorpus();
  rmSync(SHARDS, { recursive: true, force: true });

  const byCategory = new Map(CATEGORY_KEYS.map((k) => [k, []]));
  for (const r of rows) byCategory.get(r.categoryKey).push(r);

  const search = new Map();
  const categories = [];
  let details = 0;
  for (const key of CATEGORY_KEYS) {
    const list = byCategory.get(key).sort((a, b) => collator.compare(a.esName, b.esName) || a.slug.localeCompare(b.slug));
    const totalPages = Math.ceil(list.length / PAGE_SIZE);
    for (let p = 0; p < totalPages; p++) {
      const items = list.slice(p * PAGE_SIZE, (p + 1) * PAGE_SIZE).map((r) => {
        const hasDetail = Boolean(r.drugFacts || r.definitionHtml);
        if (hasDetail) {
          writeJson(join(SHARDS, 'detail', `${r.slug}.json`), r);
          details++;
        }
        const letter = searchLetter(r.esName);
        if (!search.has(letter)) search.set(letter, []);
        search.get(letter).push({ s: r.slug, n: r.esName, y: r.esSynonyms, c: key, p: p + 1 });
        return toCard(r, hasDetail);
      });
      writeJson(join(SHARDS, key, `page-${p + 1}.json`), { categoryKey: key, page: p + 1, pageSize: PAGE_SIZE, totalPages, total: list.length, items });
    }
    categories.push({
      key,
      name: CATEGORY_NAMES[key],
      count: list.length,
      pages: totalPages,
      withDefinition: list.filter((r) => r.definition).length,
      withImage: list.filter((r) => r.imageUrl).length,
    });
  }

  for (const [letter, entries] of search) {
    entries.sort((a, b) => collator.compare(a.n, b.n));
    writeJson(join(SHARDS, 'search-index', `${letter}.json`), entries);
  }

  const tagCounts = Object.fromEntries(Object.keys(TAG_NAMES).map((k) => [k, 0]));
  for (const r of rows) for (const t of r.tagKeys) tagCounts[t]++;
  const sources = new Map();
  for (const r of rows) {
    const s = sources.get(r.source) ?? { source: r.source, sourceName: r.sourceName, count: 0, retrievedAt: r.sourceRetrievedAt, license: r.sourceLicense };
    s.count++;
    sources.set(r.source, s);
  }
  const index = {
    schemaVersion: 2,
    generatedAt: nowIso(),
    total: rows.length,
    withDefinition: rows.filter((r) => r.definition).length,
    withImage: rows.filter((r) => r.imageUrl).length,
    categories,
    tags: Object.entries(tagCounts).map(([key, count]) => ({ key, name: TAG_NAMES[key], count })),
    sources: [...sources.values()],
    layers: perLayer,
    orphanRelationsDropped: orphanRelations,
    detailFiles: details,
    searchIndexLetters: [...search.keys()].sort(collator.compare),
    pageSize: PAGE_SIZE,
    note: 'Sólo términos importados de fuentes oficiales (reviewStatus = external-source). Los 69 curados, las capas de data/glossary/ del front y las láminas de anatomía NO están acá.',
  };
  writeJson(join(SHARDS, 'index.json'), index, true);
  console.log(JSON.stringify({ ...index, imagesIndexed, segundos: Math.round((Date.now() - t0) / 1000) }, null, 2));
}

if (fileURLToPath(import.meta.url) === resolve(process.argv[1] ?? '')) main();
