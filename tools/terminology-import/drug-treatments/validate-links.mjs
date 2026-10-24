#!/usr/bin/env node
// =============================================================================
// Tratamientos farmacológicos · fase 2: medir el enlace (sólo lectura).
//
// Cuenta, contra una base con enfermedades y medicamentos ya cargados, cuántas
// afirmaciones resuelven fármaco, enfermedad y ambos por código exacto, y qué
// fármacos no tienen match en el catálogo. No escribe nada.
//
// Uso:
//   node tools/terminology-import/drug-treatments/validate-links.mjs [--targets targets.json]
//   (targets.json: { "MESH": ["<internal_code>"], "MONDO": [...], ... } según
//    los code systems que declare docs/seed-research/diseases.md)
// =============================================================================

import 'dotenv/config';
import pg from 'pg';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { BUILD_DIR, nowIso, writeJson } from '../lib/glossary-es/common.mjs';
import { linkStats, mergeTargets, resolveTargets } from './lib/link.mjs';
import { DB_CONFIG, readAssertions } from './load-drug-treatments.mjs';

const args = process.argv.slice(2);
const TARGETS = mergeTargets(args.includes('--targets') ? JSON.parse(readFileSync(args[args.indexOf('--targets') + 1], 'utf8')) : {});

async function main() {
  const assertions = readAssertions();
  const client = new pg.Client(DB_CONFIG);
  await client.connect();
  try {
    const { map, used, existingCodeSystems } = await resolveTargets(client, assertions, TARGETS);
    const perSource = linkStats(assertions, map);
    const drugsWithoutMatch = new Set();
    for (const a of assertions) {
      if (a.drug.combination) continue;
      if (![...a.drug.codes, ...a.crosswalk.drug].some((c) => map.has(`${c.system}:${c.code}`))) drugsWithoutMatch.add(a.pairKey.split('|')[0]);
    }
    const report = { generatedAt: nowIso(), targets: TARGETS, used, existingCodeSystems, perSource, drugsWithoutCatalogMatch: drugsWithoutMatch.size };
    writeJson(join(BUILD_DIR, 'drug-treatments-links.json'), report, true);
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('ERROR FATAL en validate-links:', err);
  process.exitCode = 1;
});
