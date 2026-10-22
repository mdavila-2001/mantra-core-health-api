#!/usr/bin/env node
// Armado OFFLINE de `articles.ndjson` y `rejected.ndjson` del corte S4.
//   node build-articles.mjs
// No hace ninguna petición de red: lee la caché que dejaron `fetch-wikidata.mjs`
// y `fetch-sources.mjs`. No carga nada a ninguna base. Salida en `OUT_DIR`:
//   articles.ndjson  — un artículo por línea (contrato §12.3)
//   rejected.ndjson  — todo lo que se descartó, con su motivo
//   held.ndjson      — artículos válidos retenidos hasta verificar su licencia (INLASA)
//   stats.json       — cifras medidas (insumo de COVERAGE.md y LICENSES.md)

import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { OUT_DIR, resolveRetrievedAt } from './lib/config.mjs';
import { labelMapOf, readCommonsCache, readEntityCache, readHpoCache, readMeshCache } from './lib/cache-reader.mjs';
import { runPipeline } from './lib/pipeline.mjs';
import { loadSeedRows } from './lib/terms.mjs';

const toNdjson = (rows) => rows.map((r) => JSON.stringify(r) + '\n').join('');
const sha256 = (text) => createHash('sha256').update(text).digest('hex');

const entities = readEntityCache('main');
if (entities.size === 0) throw new Error('Caché de Wikidata vacía: corré fetch-wikidata.mjs primero');
const properties = readEntityCache('properties');
const labels = labelMapOf(entities, readEntityCache('referenced'));
const props = labelMapOf(properties);

const retrievedAt = resolveRetrievedAt();
const { articles, held, rejected, stats } = runPipeline(loadSeedRows(), {
  entities,
  labels,
  props,
  hpo: readHpoCache(),
  mesh: readMeshCache(),
  commons: readCommonsCache(),
  retrievedAt,
});

const articlesText = toNdjson(articles);
const rejectedText = toNdjson(rejected);
const heldText = toNdjson(held);
mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(join(OUT_DIR, 'articles.ndjson'), articlesText);
writeFileSync(join(OUT_DIR, 'rejected.ndjson'), rejectedText);
writeFileSync(join(OUT_DIR, 'held.ndjson'), heldText);
writeFileSync(
  join(OUT_DIR, 'stats.json'),
  JSON.stringify({ retrievedAt, sha256: { articles: sha256(articlesText), rejected: sha256(rejectedText), held: sha256(heldText) }, ...stats }, null, 2) + '\n',
);
console.log(`[build] ${articles.length} artículos, ${held.length} retenidos por licencia sin verificar, ${rejected.length} rechazos → ${OUT_DIR}`);
console.log(`[build] sha256 articles.ndjson ${sha256(articlesText)}`);
