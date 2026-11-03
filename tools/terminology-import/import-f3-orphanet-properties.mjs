#!/usr/bin/env node
// =============================================================================
// TAREA-41 F3.3 (cierre) — Orphanet product9: edad de inicio, herencia y
// prevalencia como `concept_properties` de la enfermedad (identidad MONDO de F3.1).
//
//   node tools/terminology-import/import-f3-orphanet-properties.mjs
//        [--sources-dir <dir>] [--out <dir>] [--load [--dry-run]]
//
// Entradas en `--sources-dir`: en_product9_ages.xml, en_product9_prev.xml (los
// baja `measure-sources.mjs`), mondo.obo y mondo.sssom.tsv. Con `--load` inserta
// en una sola transacción (`--dry-run` = ROLLBACK); id determinista +
// ON CONFLICT DO NOTHING: la segunda corrida da 0.
// =============================================================================

import 'dotenv/config';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import pg from 'pg';

import { BUILD_DIR, ensureDir } from './lib/glossary-es/common.mjs';
import { existingConceptIds, loadF3Identity } from './lib/glossary-es/f3-identity-inputs.mjs';
import { parseOrphanetReleaseDate } from './lib/glossary-es/orphanet.mjs';
import { orphanetPropertyRows, parseOrphanetAges, parseOrphanetPrevalence } from './lib/glossary-es/orphanet-properties.mjs';
import { DB_CONFIG } from './symptoms/lib/db.mjs';

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const opt = (name, fallback) => (flag(name) ? args[args.indexOf(name) + 1] : fallback);
const SOURCES_DIR = resolve(opt('--sources-dir', join(BUILD_DIR, 'f3-sources')));
const OUT_DIR = ensureDir(resolve(opt('--out', join(BUILD_DIR, 'f3-out'))));
const LOAD = flag('--load');
const DRY_RUN = flag('--dry-run');

const read = (name) => {
  const path = join(SOURCES_DIR, name);
  if (!existsSync(path)) throw new Error(`Falta ${path}. Bajalo con: node tools/terminology-import/measure-sources.mjs`);
  return readFileSync(path, 'utf8');
};

async function run(client) {
  const identity = await loadF3Identity({ sourcesDir: SOURCES_DIR, buildDir: BUILD_DIR });
  const agesXml = read('en_product9_ages.xml');
  const prevXml = read('en_product9_prev.xml');
  const built = orphanetPropertyRows(
    { ages: parseOrphanetAges(agesXml), prevalence: parseOrphanetPrevalence(prevXml) },
    { resolveDisease: identity.resolve, release: parseOrphanetReleaseDate(agesXml) },
  );
  let rows = built.rows;
  if (client) {
    const present = await existingConceptIds(client, rows.map((r) => r[1]));
    rows = rows.filter((r) => present.has(r[1]));
  }
  const summary = {
    generatedAt: new Date().toISOString(), loaded: LOAD, dryRun: LOAD && DRY_RUN,
    releases: { ages: parseOrphanetReleaseDate(agesXml), prevalence: parseOrphanetReleaseDate(prevXml) },
    stats: built.stats, afterDatabaseFilter: rows.length,
  };
  writeFileSync(join(OUT_DIR, 'f3-orphanet-properties.summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
  console.log(JSON.stringify(summary, null, 2));
  if (!LOAD) return;

  await client.query('BEGIN');
  try {
    const inserted = await insertProperties(client, rows);
    console.log(`[f3 orphanet-properties] propiedades nuevas: ${inserted}${DRY_RUN ? ' (dry-run: se revierte)' : ''}`);
    await client.query(DRY_RUN ? 'ROLLBACK' : 'COMMIT');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  }
}

/** Mismo INSERT que `insertMany` pero sin su BEGIN/COMMIT por lote: todo queda en la transacción del llamador, así `--dry-run` revierte todo. */
async function insertProperties(client, rows) {
  let inserted = 0;
  for (let i = 0; i < rows.length; i += 1000) {
    const params = [];
    const values = rows.slice(i, i + 1000).map((r) => {
      const ph = r.map((v, j) => {
        params.push(v);
        return `$${params.length}${['::uuid', '::uuid', '', '::terminology.technical_data_type', '::jsonb'][j]}`;
      });
      return `(${ph.join(', ')}, now(), now(), 1)`;
    });
    const res = await client.query(
      `INSERT INTO terminology.concept_properties (id, concept_id, property_code, data_type, value_json, created_at, updated_at, row_version) VALUES ${values.join(',\n')} ON CONFLICT DO NOTHING`,
      params,
    );
    inserted += res.rowCount;
  }
  return inserted;
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
