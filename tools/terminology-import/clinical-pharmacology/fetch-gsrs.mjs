#!/usr/bin/env node
// =============================================================================
// Farmacología clínica · etapa 1d (red): sustancias del FDA GSRS vía openFDA.
//
// Baja la partición de `results.other.substance` del índice oficial
// https://api.fda.gov/download.json (un zip, ~320 MB) y la reduce, en
// streaming, a `out/gsrs-entries.ndjson`: por sustancia sólo UNII, fracción
// activa, códigos WHO-ATC y RXCUI, nombre FDA y clase (ver lib/gsrs.mjs).
// El meta guarda URL, export_date, bytes y sha256 del zip.
//
// En entornos con proxy de salida, Node necesita `NODE_USE_ENV_PROXY=1`.
// Uso: NODE_USE_ENV_PROXY=1 node tools/terminology-import/clinical-pharmacology/fetch-gsrs.mjs
// =============================================================================

import { createHash } from 'node:crypto';
import { basename, join } from 'node:path';

import { HttpClient, writeJson, writeNdjson } from '../lib/glossary-es/common.mjs';
import { gsrsEntry } from './lib/gsrs.mjs';
import { zipResults } from './lib/json-stream.mjs';
import { OPENFDA_DOWNLOAD_INDEX } from './lib/openfda.mjs';
import { cpCache, cpOut } from './lib/paths.mjs';

const http = new HttpClient({ concurrency: 1, minDelayMs: 500 });

async function main() {
  const t0 = Date.now();
  const index = await http.getJsonCached(OPENFDA_DOWNLOAD_INDEX, join(cpCache('openfda'), 'download.json'));
  const sub = index?.results?.other?.substance;
  if (!sub?.partitions?.length) throw new Error('download.json no trae results.other.substance.partitions: revisar la forma del índice.');
  const files = [];
  const entries = [];
  let records = 0;
  for (const p of sub.partitions) {
    const path = join(cpCache('gsrs'), basename(new URL(p.file).pathname));
    const body = await http.getFileCached(p.file, path);
    files.push({ url: p.file, file: basename(path), bytes: body.length, sha256: createHash('sha256').update(body).digest('hex'), recordsDeclared: p.records ?? null });
    for await (const r of zipResults(path)) {
      records++;
      const e = gsrsEntry(r);
      if (e) entries.push(e);
    }
  }
  entries.sort((a, b) => a.unii.localeCompare(b.unii));
  await writeNdjson(cpOut('gsrs-entries.ndjson'), entries);
  const meta = {
    source: 'fda-gsrs',
    index: OPENFDA_DOWNLOAD_INDEX,
    exportDate: sub.export_date ?? null,
    files,
    records,
    withUnii: entries.length,
    withWhoAtc: entries.filter((e) => e.atc.length).length,
    atc5Codes: new Set(entries.flatMap((e) => e.atc)).size,
    segundos: Math.round((Date.now() - t0) / 1000),
  };
  writeJson(cpOut('gsrs-entries.meta.json'), meta, true);
  console.log(JSON.stringify(meta, null, 2));
}

main().catch((err) => {
  console.error('ERROR FATAL en fetch-gsrs:', err);
  process.exitCode = 1;
});
