#!/usr/bin/env node
// =============================================================================
// TAREA-41 F3.6 — Wikidata ampliado: P828 (causa), P5642 (factor de riesgo),
// P1542 (efecto → complicación) como evidencia T3, y P279 (subclase de) como
// `REL_IS_A`, todo identificado con la identidad MONDO de F3.1.
//
// Baja con consultas SPARQL (caché en `--out/wikidata-evidence/`), verifica la
// etiqueta inglesa de cada id de propiedad (un id equivocado aborta), arma las
// filas y, con `--load`, inserta (`--dry-run` = ROLLBACK).
//
//   node tools/terminology-import/import-f3-wikidata.mjs [--sources-dir <dir>]
//        [--out <dir>] [--only P828,P5642,P1542,P279] [--load [--dry-run]]
// =============================================================================

import 'dotenv/config';
import { writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import pg from 'pg';

import { BUILD_DIR, HttpClient, ensureDir, nowIso, writeJson } from './lib/glossary-es/common.mjs';
import { bulkLoadRelationships } from './lib/bulk-copy.mjs';
import { CONCEPT, md5uuid } from './lib/glossary-es/load-plan.mjs';
import { existingConceptIds, loadF3Identity } from './lib/glossary-es/f3-identity-inputs.mjs';
import { hierarchyToRelationshipRows } from './lib/glossary-es/hierarchy.mjs';
import { insertIsARows } from './lib/glossary-es/hierarchy-load.mjs';
import { SPARQL_ENDPOINT, assertEntityLabels, entityLabelsUrl } from './lib/glossary-es/wikidata.mjs';
import {
  CODE_TABLES, EVIDENCE_PROPERTIES, SUBCLASS_PROPERTY, WIKIDATA_SOURCE_TAG,
  codeTableSparql, evidenceRows, itemPairsSparql, itemResolver, parseCodeTable, parseItemEdges, subclassEdges,
} from './lib/glossary-es/wikidata-evidence.mjs';
import { DB_CONFIG, ensureCodeSystem } from './symptoms/lib/db.mjs';

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const opt = (name, fallback) => (flag(name) ? args[args.indexOf(name) + 1] : fallback);
const SOURCES_DIR = resolve(opt('--sources-dir', join(BUILD_DIR, 'f3-sources')));
const OUT_DIR = ensureDir(resolve(opt('--out', join(BUILD_DIR, 'f3-out'))));
const CACHE_DIR = ensureDir(join(OUT_DIR, 'wikidata-evidence'));
const ONLY = new Set(opt('--only', [...Object.keys(EVIDENCE_PROPERTIES), SUBCLASS_PROPERTY.id].join(',')).split(','));
const LOAD = flag('--load');
const DRY_RUN = flag('--dry-run');

const http = new HttpClient({ concurrency: 1, minDelayMs: 2000 });

const plan = () => ({
  source: {
    id: md5uuid(`mantra:f3:source:${WIKIDATA_SOURCE_TAG}`), code: WIKIDATA_SOURCE_TAG,
    name: 'Wikidata — causas, factores de riesgo y efectos de enfermedades', owner: 'Wikimedia Foundation',
    officialUrl: 'https://www.wikidata.org/', license: 'CC0 1.0',
  },
  codeSystem: {
    id: md5uuid(`mantra:f3:code-system:${WIKIDATA_SOURCE_TAG}`), internalCode: WIKIDATA_SOURCE_TAG,
    name: 'Wikidata (relaciones con evidencia)', canonicalUrl: 'urn:mantra:wikidata-relations-evidence', caseSensitive: true,
  },
  version: { id: md5uuid(`mantra:f3:version:${WIKIDATA_SOURCE_TAG}:${new Date().toISOString().slice(0, 7)}`), version: new Date().toISOString().slice(0, 7) },
});

/** Tablas de códigos de Wikidata (Q → CIE-10, CIE-10-CM, MeSH), una consulta por propiedad. */
async function fetchCodeTables() {
  const codes = new Map();
  for (const { property, prefix } of CODE_TABLES) {
    const url = `${SPARQL_ENDPOINT}?format=json&query=${encodeURIComponent(codeTableSparql(property))}`;
    parseCodeTable(await http.getJsonCached(url, join(CACHE_DIR, `codes-${property}.json`)), prefix, codes);
  }
  return codes;
}

async function fetchEdges(prop, codes) {
  const url = `${SPARQL_ENDPOINT}?format=json&query=${encodeURIComponent(itemPairsSparql(prop))}`;
  return parseItemEdges(await http.getJsonCached(url, join(CACHE_DIR, `pairs-${prop}.json`)), prop, codes);
}

async function run(client) {
  const retrievedAt = nowIso();
  const labels = { ...Object.fromEntries(Object.entries(EVIDENCE_PROPERTIES).map(([p, s]) => [p, s.label])), [SUBCLASS_PROPERTY.id]: SUBCLASS_PROPERTY.label, P494: 'ICD-10 ID', P4229: 'ICD-10-CM', P486: 'MeSH descriptor ID' };
  assertEntityLabels(await http.getJsonCached(entityLabelsUrl(Object.keys(labels)), join(CACHE_DIR, 'entity-labels.json')), labels);

  const identity = await loadF3Identity({ sourcesDir: SOURCES_DIR, buildDir: BUILD_DIR });
  const resolveItem = itemResolver(identity.resolve);
  const validFrom = retrievedAt.slice(0, 10);

  const codes = await fetchCodeTables();
  const evidenceEdges = [];
  const fetched = {};
  for (const prop of Object.keys(EVIDENCE_PROPERTIES).filter((p) => ONLY.has(p))) {
    const edges = await fetchEdges(prop, codes);
    fetched[prop] = edges.length;
    evidenceEdges.push(...edges);
    console.log(`[f3-wikidata] ${prop} (${EVIDENCE_PROPERTIES[prop].label}): ${edges.length} aristas con código en ambos extremos`);
  }
  const evidence = evidenceRows(evidenceEdges, { resolveItem, validFrom });

  let hierarchy = { rows: [], stats: null };
  if (ONLY.has(SUBCLASS_PROPERTY.id)) {
    const edges = await fetchEdges(SUBCLASS_PROPERTY.id, codes);
    fetched[SUBCLASS_PROPERTY.id] = edges.length;
    console.log(`[f3-wikidata] ${SUBCLASS_PROPERTY.id} (${SUBCLASS_PROPERTY.label}): ${edges.length} aristas con código en ambos extremos`);
    const { edges: isA, itemCodes } = subclassEdges(edges);
    hierarchy = hierarchyToRelationshipRows(isA, (key) => resolveItem(itemCodes.get(key) ?? []));
  }

  let evidenceRowsToLoad = evidence.rows;
  let isARowsToLoad = hierarchy.rows;
  if (client) {
    const present = await existingConceptIds(client, [
      ...evidence.rows.flatMap((r) => [r.sourceConceptId, r.targetConceptId]),
      ...hierarchy.rows.flatMap((r) => [r[1], r[2]]),
    ]);
    evidenceRowsToLoad = evidence.rows.filter((r) => present.has(r.sourceConceptId) && present.has(r.targetConceptId));
    isARowsToLoad = hierarchy.rows.filter((r) => present.has(r[1]) && present.has(r[2]));
  }

  const summary = {
    generatedAt: retrievedAt, loaded: LOAD, dryRun: LOAD && DRY_RUN, fetched,
    evidence: { stats: evidence.stats, afterDatabaseFilter: evidenceRowsToLoad.length },
    subclass: { stats: hierarchy.stats, afterDatabaseFilter: isARowsToLoad.length },
  };
  writeJson(join(OUT_DIR, 'f3-wikidata.summary.json'), summary, true);
  writeFileSync(join(OUT_DIR, 'f3-wikidata.summary.txt'), `${JSON.stringify(summary, null, 2)}\n`);
  console.log(JSON.stringify(summary, null, 2));
  if (!LOAD) return;

  try {
    if (evidenceRowsToLoad.length > 0) {
      const ids = await ensureCodeSystem(client, plan(), CONCEPT.TERM_ACTIVE);
      const result = await bulkLoadRelationships(client, { terminologySourceId: ids.sourceId, codeSystemVersionId: ids.versionId, rows: evidenceRowsToLoad, dryRun: DRY_RUN, log: console.log });
      console.log('[f3-wikidata evidencia]', JSON.stringify(result));
    }
    await client.query('BEGIN');
    const inserted = await insertIsARows(client, isARowsToLoad);
    console.log(`[f3-wikidata P279] relaciones IS_A nuevas: ${inserted}${DRY_RUN ? ' (dry-run: se revierte)' : ''}`);
    await client.query(DRY_RUN ? 'ROLLBACK' : 'COMMIT');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  }
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
