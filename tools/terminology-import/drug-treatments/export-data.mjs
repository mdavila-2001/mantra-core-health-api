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
//   data/manifest.json                   commits y SHA-256 de los crudos
//   data/SHA256SUMS                      hash de cada archivo de data/
//
// gzip de Node escribe mtime 0: la misma entrada da los mismos bytes.
//
// Uso: node tools/terminology-import/drug-treatments/export-data.mjs
// =============================================================================

import { createHash } from 'node:crypto';
import { copyFileSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

import { BUILD_DIR, ensureDir, ndjsonPath } from '../lib/glossary-es/common.mjs';
import { MANIFEST } from './fetch-sources.mjs';

export const DATA_DIR = join(dirname(fileURLToPath(import.meta.url)), 'data');
const MAX_GZ_BYTES = 45 * 1024 * 1024;
const LINES_PER_PART = 4000;

function main() {
  ensureDir(DATA_DIR);
  for (const f of readdirSync(DATA_DIR)) if (/^drug-treatments-\d{3}\.ndjson\.gz$/.test(f)) rmSync(join(DATA_DIR, f));

  const lines = readFileSync(ndjsonPath('drug-treatments'), 'utf8').split('\n').filter((l) => l.trim() !== '');
  let part = 0;
  for (let i = 0; i < lines.length; i += LINES_PER_PART) {
    const gz = gzipSync(lines.slice(i, i + LINES_PER_PART).join('\n') + '\n', { level: 9 });
    if (gz.length > MAX_GZ_BYTES) throw new Error(`parte ${part} pesa ${gz.length} bytes (> ${MAX_GZ_BYTES}): bajá LINES_PER_PART`);
    writeFileSync(join(DATA_DIR, `drug-treatments-${String(part).padStart(3, '0')}.ndjson.gz`), gz);
    part++;
  }
  copyFileSync(ndjsonPath('drug-treatments').replace(/\.ndjson$/, '.meta.json'), join(DATA_DIR, 'drug-treatments.meta.json'));
  copyFileSync(join(BUILD_DIR, 'drug-treatments-coverage.json'), join(DATA_DIR, 'drug-treatments-coverage.json'));
  copyFileSync(MANIFEST, join(DATA_DIR, 'manifest.json'));

  const sums = readdirSync(DATA_DIR)
    .filter((f) => f !== 'SHA256SUMS')
    .sort()
    .map((f) => `${createHash('sha256').update(readFileSync(join(DATA_DIR, f))).digest('hex')}  ${f}`);
  writeFileSync(join(DATA_DIR, 'SHA256SUMS'), sums.join('\n') + '\n');
  console.log(`[export] ${lines.length} afirmaciones en ${part} partes → ${DATA_DIR}`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
