#!/usr/bin/env node
// =============================================================================
// TAREA-41 F3.5 — MRCOC → relaciones enfermedad → síntoma T4 (lift).
//
// Entradas (las deja `mrcoc/fetch-mrcoc.mjs` en `--mrcoc-dir`): el TSV filtrado,
// `MH_freq_counts_2024.txt.gz`, `wikidata-mesh-hpo.tsv` y `mesh-trees.tsv`
// (sólo para rotular la muestra). Identidad: la de F3.1 con las fuentes de
// `--sources-dir`.
//
// Siempre escribe en `--out`:
//   mrcoc-thresholds.csv  cuántos pares/ filas quedan con cada combinación de
//                         umbrales (para elegir con datos, no a ojo)
//   mrcoc-sample-50.csv   50 pares de las filas cargadas, repartidos parejo por
//                         lift, con los rótulos de MeSH, para revisión humana
//   f3-mrcoc.summary.json
// Con `--load` inserta (un lote, `--dry-run` = ROLLBACK).
//
//   node tools/terminology-import/import-f3-mrcoc.mjs [--mrcoc-dir <dir>]
//        [--sources-dir <dir>] [--out <dir>] [--min-articles N] [--min-lift X]
//        [--load [--dry-run]]
// =============================================================================

import 'dotenv/config';
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { gunzipSync } from 'node:zlib';
import pg from 'pg';

import { BUILD_DIR, ensureDir } from './lib/glossary-es/common.mjs';
import { bulkLoadRelationships } from './lib/bulk-copy.mjs';
import { CONCEPT, md5uuid } from './lib/glossary-es/load-plan.mjs';
import { existingConceptIds, loadF3Identity, onlyExistingDiseases } from './lib/glossary-es/f3-identity-inputs.mjs';
import {
  MEDLINE_CITATIONS, MIN_ARTICLES, MIN_LIFT, MRCOC_SOURCE_TAG,
  mrcocToRelationshipRows, parseMeshFrequencies, parseMeshHpoCrosswalk, parseMrcocPairs,
} from './lib/glossary-es/mrcoc.mjs';
import { DB_CONFIG, ensureCodeSystem } from './symptoms/lib/db.mjs';

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const opt = (name, fallback) => (flag(name) ? args[args.indexOf(name) + 1] : fallback);
const MRCOC_DIR = resolve(opt('--mrcoc-dir', join(BUILD_DIR, 'mrcoc')));
const SOURCES_DIR = resolve(opt('--sources-dir', join(BUILD_DIR, 'f3-sources')));
const OUT_DIR = ensureDir(resolve(opt('--out', join(BUILD_DIR, 'f3-out'))));
const MIN_ART = Number(opt('--min-articles', MIN_ARTICLES));
const MINIMUM_LIFT = Number(opt('--min-lift', MIN_LIFT));
const LOAD = flag('--load');
const DRY_RUN = flag('--dry-run');
const RELEASE = '2024-01-01';
const SAMPLE_SIZE = 50;

const THRESHOLD_GRID = [[3, 1.5], [10, 2], [20, 2], [20, 3], [50, 2], [50, 5], [100, 5]];

const plan = () => ({
  source: {
    id: md5uuid(`mantra:f3:source:${MRCOC_SOURCE_TAG}`), code: MRCOC_SOURCE_TAG,
    name: 'NLM MEDLINE Co-Occurrences (MRCOC) 2024 — síntoma × enfermedad', owner: 'U.S. National Library of Medicine',
    officialUrl: 'https://lhncbc.nlm.nih.gov/ii/information/MRCOC.html',
    license: 'NLM Terms and Conditions (datos públicos; citar la fuente) — https://www.nlm.nih.gov/databases/download/terms_and_conditions.html',
  },
  codeSystem: {
    id: md5uuid(`mantra:f3:code-system:${MRCOC_SOURCE_TAG}`), internalCode: MRCOC_SOURCE_TAG,
    name: 'MRCOC 2024', canonicalUrl: 'urn:mantra:mrcoc-2024', caseSensitive: true,
  },
  version: { id: md5uuid(`mantra:f3:version:${MRCOC_SOURCE_TAG}:2024`), version: '2024' },
});

const readText = (name) => readFileSync(join(MRCOC_DIR, name), 'utf8');
const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

function sampleEvenly(rows, size) {
  if (rows.length <= size) return rows;
  const sorted = [...rows].sort((a, b) => a.statisticValue - b.statisticValue);
  return Array.from({ length: size }, (_, i) => sorted[Math.floor((i * (sorted.length - 1)) / (size - 1))]);
}

async function run(client) {
  const rawIdentity = await loadF3Identity({ sourcesDir: SOURCES_DIR, buildDir: BUILD_DIR });
  const identity = client ? await onlyExistingDiseases(client, rawIdentity) : rawIdentity;
  const pairs = parseMrcocPairs(readText('mrcoc-symptom-disease-2024.tsv'));
  const meshFrequency = parseMeshFrequencies(gunzipSync(readFileSync(join(MRCOC_DIR, 'MH_freq_counts_2024.txt.gz'))).toString('utf8'));
  const meshToHpo = parseMeshHpoCrosswalk(readText('wikidata-mesh-hpo.tsv'));
  const labels = new Map(readText('mesh-trees.tsv').split('\n').slice(1).filter(Boolean).map((l) => l.split('\t')).map(([dui, label]) => [dui, label]));
  const build = (minArticles, minLift) =>
    mrcocToRelationshipRows(pairs, { meshFrequency, meshToHpo, resolveDisease: identity.resolve, validFrom: RELEASE, minArticles, minLift });

  const grid = THRESHOLD_GRID.map(([a, l]) => {
    const { rows, stats } = build(a, l);
    return { minArticles: a, minLift: l, rows: rows.length, conceptPairs: stats.conceptPairs };
  });
  writeFileSync(join(OUT_DIR, 'mrcoc-thresholds.csv'), `min_articles,min_lift,filas_cargables,pares_de_concepto\n${grid.map((g) => `${g.minArticles},${g.minLift},${g.rows},${g.conceptPairs}`).join('\n')}\n`);

  const { rows: built, stats, unresolvedDiseases } = build(MIN_ART, MINIMUM_LIFT);
  const rows = client ? await dropMissingConcepts(client, built) : built;

  const sampleLines = ['sintoma_mesh,sintoma,enfermedad_mesh,enfermedad,articulos,lift'];
  for (const r of sampleEvenly(rows, SAMPLE_SIZE)) {
    const [symptom, disease] = r.meshPairs[0].split('x');
    const articles = r.sourceReference.replace(`${MRCOC_SOURCE_TAG} articles=`, '');
    sampleLines.push([symptom, labels.get(symptom), disease, labels.get(disease), articles, r.statisticValue].map(csvCell).join(','));
  }
  writeFileSync(join(OUT_DIR, 'mrcoc-sample-50.csv'), `${sampleLines.join('\n')}\n`);

  const summary = {
    generatedAt: new Date().toISOString(), loaded: LOAD, dryRun: LOAD && DRY_RUN,
    thresholds: { minArticles: MIN_ART, minLift: MINIMUM_LIFT, medlineCitations: MEDLINE_CITATIONS }, pairsRead: pairs.length, stats,
    unresolvedDiseases, rowsAfterDatabaseFilter: rows.length, grid,
  };
  writeFileSync(join(OUT_DIR, 'f3-mrcoc.summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
  console.log(JSON.stringify(summary, null, 2));
  if (!LOAD) return;

  const ids = await ensureCodeSystem(client, plan(), CONCEPT.TERM_ACTIVE);
  const result = await bulkLoadRelationships(client, { terminologySourceId: ids.sourceId, codeSystemVersionId: ids.versionId, rows, dryRun: DRY_RUN, log: console.log });
  console.log('[f3 mrcoc]', JSON.stringify(result));
}

/** Con base: un extremo inexistente en `catalog_concepts` descarta la fila (no se crean conceptos). */
async function dropMissingConcepts(client, rows) {
  const present = await existingConceptIds(client, rows.flatMap((r) => [r.sourceConceptId, r.targetConceptId]));
  return rows.filter((r) => present.has(r.sourceConceptId) && present.has(r.targetConceptId));
}

async function main() {
  const client = LOAD ? new pg.Client(DB_CONFIG) : null;
  if (client) await client.connect();
  try {
    await run(client);
  } finally {
    if (client) await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
