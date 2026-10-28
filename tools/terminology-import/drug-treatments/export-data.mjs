#!/usr/bin/env node
// =============================================================================
// Tratamientos farmacológicos · exportar los datos normalizados al repo.
//
// El contenedor de trabajo es efímero: lo normalizado se versiona en
// `drug-treatments/data/` comprimido (.gz) y partido en archivos de menos de
// 45 MB (GitHub rechaza >100 MB). Los crudos NO se suben: se re-bajan con
// `fetch-sources.mjs` (repo, commit y SHA-256 en `data/manifest.json`).
//
//   data/drug-treatments-NNN.ndjson.gz   afirmaciones (partes en orden)
//   data/drug-treatments.meta.json       procedencia y conteos del build
//   data/drug-treatments-coverage.json   cobertura por tipo/fuente/pasada
//   data/manifest.json                   commits y SHA-256 de los crudos de GitHub
//   data/manifest-http.json              URL, fecha, SHA-256 y bytes de cada archivo de las fuentes HTTP
//   data/SHA256SUMS                      hash de cada archivo de data/
//
// gzip de Node escribe mtime 0: la misma entrada da los mismos bytes.
//
// Uso: node tools/terminology-import/drug-treatments/export-data.mjs
// =============================================================================

import { createHash } from 'node:crypto';
import { copyFileSync, createReadStream, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

import { BUILD_DIR, ensureDir, ndjsonPath } from '../lib/glossary-es/common.mjs';
import { MANIFEST } from './fetch-sources.mjs';
import { HTTP_MANIFEST } from './lib/http-files.mjs';

export const DATA_DIR = process.env.DRUG_TREATMENTS_DATA_DIR ?? join(dirname(fileURLToPath(import.meta.url)), 'data');
const MAX_GZ_BYTES = 45 * 1024 * 1024;
const RAW_BYTES_PER_PART = 64 * 1024 * 1024; // sin comprimir; el gzip de este JSON repetitivo queda muy por debajo del tope

async function main() {
  ensureDir(DATA_DIR);
  for (const f of readdirSync(DATA_DIR)) if (/^drug-treatments-\d{3}\.ndjson\.gz$/.test(f)) rmSync(join(DATA_DIR, f));

  // Streaming: el NDJSON ya pasa de 1 GB y no entra en una cadena de V8.
  let part = 0;
  let total = 0;
  let buffer = [];
  let bytes = 0;
  const writePart = () => {
    if (buffer.length === 0) return;
    const gz = gzipSync(buffer.join('\n') + '\n', { level: 9 });
    if (gz.length > MAX_GZ_BYTES) throw new Error(`parte ${part} pesa ${gz.length} bytes (> ${MAX_GZ_BYTES}): bajá RAW_BYTES_PER_PART`);
    writeFileSync(join(DATA_DIR, `drug-treatments-${String(part).padStart(3, '0')}.ndjson.gz`), gz);
    total += buffer.length;
    part++;
    buffer = [];
    bytes = 0;
  };
  const rl = createInterface({ input: createReadStream(ndjsonPath('drug-treatments'), { encoding: 'utf8' }), crlfDelay: Infinity });
  for await (const line of rl) {
    if (line.trim() === '') continue;
    buffer.push(line);
    bytes += line.length + 1;
    if (bytes >= RAW_BYTES_PER_PART) writePart();
  }
  writePart();
  const lines = { length: total };
  copyFileSync(ndjsonPath('drug-treatments').replace(/\.ndjson$/, '.meta.json'), join(DATA_DIR, 'drug-treatments.meta.json'));
  copyFileSync(join(BUILD_DIR, 'drug-treatments-coverage.json'), join(DATA_DIR, 'drug-treatments-coverage.json'));
  copyFileSync(MANIFEST, join(DATA_DIR, 'manifest.json'));
  copyFileSync(HTTP_MANIFEST, join(DATA_DIR, 'manifest-http.json'));

  const sums = readdirSync(DATA_DIR)
    .filter((f) => f !== 'SHA256SUMS')
    .sort()
    .map((f) => `${createHash('sha256').update(readFileSync(join(DATA_DIR, f))).digest('hex')}  ${f}`);
  writeFileSync(join(DATA_DIR, 'SHA256SUMS'), sums.join('\n') + '\n');
  console.log(`[export] ${lines.length} afirmaciones en ${part} partes → ${DATA_DIR}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error('ERROR FATAL en export-data:', err);
    process.exitCode = 1;
  });
}
