#!/usr/bin/env node
// =============================================================================
// Farmacología clínica · etapa 1e (red): informe oficial de medicamentos de la
// EMA («Medicines output», xlsx). Un solo archivo; se guarda en
// clinical-pharmacology/cache/ema/ con URL, bytes, sha256 y la fecha de
// generación que el propio informe declara.
//
// Uso: NODE_USE_ENV_PROXY=1 node tools/terminology-import/clinical-pharmacology/fetch-ema.mjs
// =============================================================================

import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { join } from 'node:path';

import { HttpClient, writeJson } from '../lib/glossary-es/common.mjs';
import { EMA_REPORT_URL, emaRecords, isHumanAuthorised, reportGeneratedAt } from './lib/ema.mjs';
import { cpCache } from './lib/paths.mjs';

const require = createRequire(import.meta.url);
const XLSX = require('xlsx');
const http = new HttpClient({ concurrency: 1, minDelayMs: 500 });

async function main() {
  const path = join(cpCache('ema'), 'medicines-output-medicines-report_en.xlsx');
  const body = await http.getFileCached(EMA_REPORT_URL, path);
  const wb = XLSX.read(body, { type: 'buffer' });
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: null });
  const records = emaRecords(rows);
  const human = records.filter(isHumanAuthorised);
  const meta = {
    source: 'ema-epar',
    url: EMA_REPORT_URL,
    bytes: body.length,
    sha256: createHash('sha256').update(body).digest('hex'),
    reportGeneratedAt: reportGeneratedAt(rows),
    records: records.length,
    humanAuthorised: human.length,
    humanAuthorisedWithAtc5: human.filter((r) => r.atc5.length).length,
    atc5: new Set(human.flatMap((r) => r.atc5)).size,
  };
  writeJson(join(cpCache('ema'), 'fetch.meta.json'), meta, true);
  console.log(JSON.stringify(meta, null, 2));
}

main().catch((err) => {
  console.error('ERROR FATAL en fetch-ema:', err);
  process.exitCode = 1;
});
