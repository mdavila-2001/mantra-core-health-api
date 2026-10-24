#!/usr/bin/env node
// =============================================================================
// Farmacología clínica · etapa 1c (red): openFDA drug labels, descarga masiva.
//
// Lee el índice oficial https://api.fda.gov/download.json y baja TODAS las
// particiones de `results.drug.label.partitions` (zip con un JSON
// `{ meta, results[] }` cada una) a clinical-pharmacology/cache/openfda/.
// La descarga masiva evita el tope de 1 000 pedidos/día de la API sin clave y
// no requiere cuenta. Reanudable: una partición ya bajada no se vuelve a pedir.
// El meta guarda URL, bytes y sha256 de cada partición (los crudos no se versionan).
//
// Uso: node tools/terminology-import/clinical-pharmacology/fetch-openfda.mjs [--limit-partitions N]
// =============================================================================

import { createHash } from 'node:crypto';
import { basename, join } from 'node:path';

import { HttpClient, writeJson } from '../lib/glossary-es/common.mjs';
import { parseArgs } from './lib/cli.mjs';
import { OPENFDA_DOWNLOAD_INDEX } from './lib/openfda.mjs';
import { openFdaDir } from './lib/paths.mjs';

const { opt } = parseArgs();
const LIMIT = Number(opt('--limit-partitions', 0));
const http = new HttpClient({ concurrency: 2, minDelayMs: 500 });

async function main() {
  const t0 = Date.now();
  const index = await http.getJsonCached(OPENFDA_DOWNLOAD_INDEX, join(openFdaDir(), 'download.json'));
  const label = index?.results?.drug?.label;
  if (!label?.partitions?.length) throw new Error('download.json no trae results.drug.label.partitions: la forma del índice cambió; revisar antes de seguir.');
  let partitions = label.partitions;
  if (LIMIT > 0) partitions = partitions.slice(0, LIMIT);
  console.log(`=== openFDA drug labels: ${partitions.length} particiones (export_date ${label.export_date}, total ${label.total_records ?? '?'}) ===`);
  let i = 0;
  const files = [];
  for (const p of partitions) {
    i++;
    const file = join(openFdaDir(), 'label', basename(new URL(p.file).pathname));
    const body = await http.getFileCached(p.file, file);
    files.push({ url: p.file, file: basename(file), bytes: body.length, sha256: createHash('sha256').update(body).digest('hex'), recordsDeclared: p.records ?? null });
    console.log(`[openfda] ${i}/${partitions.length} ${basename(file)} (${(body.length / 1e6).toFixed(1)} MB; ${p.records ?? '?'} etiquetas declaradas)`);
  }
  const meta = { source: 'openfda-label', index: OPENFDA_DOWNLOAD_INDEX, exportDate: label.export_date ?? null, partitions: partitions.length, files, http: http.stats, segundos: Math.round((Date.now() - t0) / 1000) };
  writeJson(join(openFdaDir(), 'fetch.meta.json'), meta, true);
  console.log(JSON.stringify(meta, null, 2));
}

main().catch((err) => {
  console.error('ERROR FATAL en fetch-openfda:', err);
  process.exitCode = 1;
});
