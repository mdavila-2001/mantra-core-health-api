#!/usr/bin/env node
// =============================================================================
// TAREA-41 F3.7 — mide cuántos conceptos de `terminology.catalog_concepts` no
// tienen relación ni faceta. SOLO LECTURA: no escribe en la base.
//
//   node tools/terminology-import/measure-reachability.mjs [--out <dir>]
//
// Conexión por `.env` (`DB_*`). Escribe `reachability.md` y `reachability.json`.
// Sale con código 1 si los huérfanos superan la meta (para usarlo de candado).
// =============================================================================

import 'dotenv/config';
import { writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import pg from 'pg';

import { BUILD_DIR, ensureDir } from './lib/glossary-es/common.mjs';
import { REACHABILITY_SQL, reachabilityMarkdown, summarizeReachability } from './lib/glossary-es/reachability.mjs';
import { DB_CONFIG } from './symptoms/lib/db.mjs';

const args = process.argv.slice(2);
const OUT_DIR = ensureDir(resolve(args.includes('--out') ? args[args.indexOf('--out') + 1] : join(BUILD_DIR, 'f3-out')));

const client = new pg.Client(DB_CONFIG);
await client.connect();
try {
  await client.query('SET TRANSACTION READ ONLY').catch(() => {});
  const { rows } = await client.query(REACHABILITY_SQL);
  const summary = summarizeReachability(rows);
  const measuredAt = new Date().toISOString();
  const database = `${DB_CONFIG.database}@${DB_CONFIG.host}:${DB_CONFIG.port}`;
  writeFileSync(join(OUT_DIR, 'reachability.json'), `${JSON.stringify({ measuredAt, database, ...summary }, null, 2)}\n`);
  writeFileSync(join(OUT_DIR, 'reachability.md'), reachabilityMarkdown(summary, { measuredAt, database }));
  console.log(reachabilityMarkdown(summary, { measuredAt, database }));
  if (!summary.withinLimit) process.exitCode = 1;
} finally {
  await client.end();
}
