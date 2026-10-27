#!/usr/bin/env node
// =============================================================================
// Farmacología clínica · etapa 1d (red): datos abiertos de medicamentos de la EMA.
// UN pedido (≈ 7 MB): https://www.ema.europa.eu/en/documents/report/medicines-output-medicines_json-report_en.json
// Reanudable (caché). Guarda URL, bytes, sha256 y el `meta.timestamp` del propio archivo en fetch.meta.json.
//
// Uso: node tools/terminology-import/clinical-pharmacology/fetch-ema.mjs [--refresh]
// =============================================================================

import { createHash } from 'node:crypto';
import { rmSync } from 'node:fs';

import { HttpClient, writeJson } from '../lib/glossary-es/common.mjs';
import { parseArgs } from './lib/cli.mjs';
import { EMA_DATA_URL, emaByAtc5 } from './lib/ema.mjs';
import { emaDataPath, emaMetaPath } from './lib/paths.mjs';

const { has } = parseArgs();
const http = new HttpClient({ concurrency: 1, minDelayMs: 1000 });

async function main() {
  if (has('--refresh')) rmSync(emaDataPath(), { force: true });
  const body = await http.getFileCached(EMA_DATA_URL, emaDataPath());
  const file = JSON.parse(body.toString('utf8'));
  const { byAtc, skipped, total } = emaByAtc5(file);
  const meta = {
    source: 'ema-medicines',
    url: EMA_DATA_URL,
    bytes: body.length,
    sha256: createHash('sha256').update(body).digest('hex'),
    fileTimestamp: file.meta?.timestamp ?? null,
    declaredRecords: file.meta?.total_records ?? null,
    records: total,
    humanAuthorisedWithAtc5: [...byAtc.values()].reduce((n, v) => n + v.length, 0),
    atc5: byAtc.size,
    skipped,
    http: http.stats,
  };
  writeJson(emaMetaPath(), meta, true);
  console.log(JSON.stringify(meta, null, 2));
}

main().catch((err) => {
  console.error('ERROR FATAL en fetch-ema:', err);
  process.exitCode = 1;
});
