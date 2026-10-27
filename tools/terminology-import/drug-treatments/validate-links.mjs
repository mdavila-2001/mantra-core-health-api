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
import { DB_CONFIG, assertionChunks } from './load-drug-treatments.mjs';

const args = process.argv.slice(2);
const TARGETS = mergeTargets(args.includes('--targets') ? JSON.parse(readFileSync(args[args.indexOf('--targets') + 1], 'utf8')) : {});

async function main() {
  const client = new pg.Client(DB_CONFIG);
  await client.connect();
  try {
    const perSource = {};
    const drugsMatched = new Set();
    const drugsAll = new Set();
    let used = null;
    let existingCodeSystems = null;
    for await (const { assertions } of assertionChunks()) {
      const r = await resolveTargets(client, assertions, TARGETS);
      used ??= r.used;
      existingCodeSystems ??= r.existingCodeSystems;
      for (const [k, v] of Object.entries(linkStats(assertions, r.map))) {
        const l = (perSource[k] ??= { assertions: 0, drug: 0, condition: 0, both: 0 });
        for (const f of Object.keys(l)) l[f] += v[f];
      }
      for (const a of assertions) {
        if (a.drug.combination) continue;
        drugsAll.add(a.pairKey.split('|')[0]);
        if ([...a.drug.codes, ...a.crosswalk.drug].some((c) => r.map.has(`${c.system}:${c.code}`))) drugsMatched.add(a.pairKey.split('|')[0]);
      }
    }
    // Un fármaco (clave canónica) cuenta como «sin match» solo si NINGUNA de sus afirmaciones enlazó.
    const report = { generatedAt: nowIso(), targets: TARGETS, used, existingCodeSystems, perSource, drugsTotal: drugsAll.size, drugsWithCatalogMatch: drugsMatched.size, drugsWithoutCatalogMatch: drugsAll.size - drugsMatched.size };
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
