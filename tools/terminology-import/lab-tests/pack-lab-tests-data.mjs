#!/usr/bin/env node
// =============================================================================
// Catálogo de análisis · empaquetado de los datos normalizados para versionar.
//
// Copia, comprimido con gzip, lo que escribió build-lab-tests.mjs a
// `tools/terminology-import/lab-tests/data/`, para que el corpus sobreviva al
// contenedor y se pueda cargar sin volver a descargar las fuentes:
//   lab-tests-<capa>.ndjson.gz        (o .partNN.ndjson.gz si pasa de MAX_PART_BYTES)
//   lab-tests-<capa>.meta.json        (code systems, archivos leídos, conteos)
//   lab-tests-coverage.json           (reporte de cobertura)
//   sources-manifest.json             (spec npm, SHA-256 e integridad de cada fuente)
//   checksums.json                    (SHA-256 de cada NDJSON sin comprimir y número de líneas)
//
// Las fuentes CRUDAS no se suben (≈255 MB): se reproducen con
// fetch-lab-tests-sources.mjs, que verifica la integridad de npm.
//
// Uso: node tools/terminology-import/lab-tests/pack-lab-tests-data.mjs
// =============================================================================

import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

import { BUILD_DIR, ensureDir, writeJson } from '../lib/glossary-es/common.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const DATA_DIR = join(HERE, 'data');
/** GitHub rechaza archivos de más de 100 MB; se parte por debajo de 45 MB sin comprimir por pieza. */
const MAX_PART_BYTES = 45 * 1024 * 1024;

function main() {
  const ndjsonDir = join(BUILD_DIR, 'ndjson');
  const only = process.argv.includes('--layers') ? process.argv[process.argv.indexOf('--layers') + 1].split(',') : null;
  const layers = readdirSync(ndjsonDir).filter((f) => /^lab-tests-.+\.ndjson$/.test(f) && (!only || only.includes(f.replace(/^lab-tests-|\.ndjson$/g, ''))));
  if (!layers.length) throw new Error(`No hay lab-tests-*.ndjson${only ? ` de ${only.join(', ')}` : ''} en ${ndjsonDir}: corré build-lab-tests.mjs.`);
  ensureDir(DATA_DIR);
  // Con --layers sólo se reescriben esas capas: las demás (y su manifiesto npm) quedan como están en git.
  const mine = (f) => !only || layers.some((l) => f.startsWith(`${l.replace(/\.ndjson$/, '')}.`));
  for (const f of readdirSync(DATA_DIR)) if (/^lab-tests-.+\.(ndjson\.gz|meta\.json)$|^lab-tests-.+\.part\d+\.ndjson\.gz$/.test(f) ? mine(f) : !only && /^lab-tests-|^checksums\.json$|^sources-manifest\.json$/.test(f)) rmSync(join(DATA_DIR, f));

  const checksums = only && existsSync(join(DATA_DIR, 'checksums.json')) ? JSON.parse(readFileSync(join(DATA_DIR, 'checksums.json'), 'utf8')) : {};
  for (const file of layers) {
    const raw = readFileSync(join(ndjsonDir, file));
    const lines = raw.toString('utf8').split('\n').filter((l) => l !== '');
    const base = file.replace(/\.ndjson$/, '');
    const parts = [];
    let chunk = [];
    let size = 0;
    const flush = () => {
      if (!chunk.length) return;
      parts.push(chunk.join('\n') + '\n');
      chunk = [];
      size = 0;
    };
    for (const l of lines) {
      if (size + Buffer.byteLength(l) + 1 > MAX_PART_BYTES) flush();
      chunk.push(l);
      size += Buffer.byteLength(l) + 1;
    }
    flush();
    const written = parts.map((text, i) => {
      const name = parts.length === 1 ? `${base}.ndjson.gz` : `${base}.part${String(i + 1).padStart(2, '0')}.ndjson.gz`;
      writeFileSync(join(DATA_DIR, name), gzipSync(Buffer.from(text, 'utf8'), { level: 9 }));
      return name;
    });
    checksums[base] = { sha256: createHash('sha256').update(raw).digest('hex'), lines: lines.length, files: written };
    const meta = join(ndjsonDir, `${base}.meta.json`);
    if (existsSync(meta)) copyFileSync(meta, join(DATA_DIR, `${base}.meta.json`));
    console.log(`[pack] ${base}: ${lines.length} líneas → ${written.join(', ')}`);
  }
  const coverage = join(ndjsonDir, 'lab-tests-coverage.json');
  if (existsSync(coverage)) copyFileSync(coverage, join(DATA_DIR, 'lab-tests-coverage.json'));
  const manifest = join(BUILD_DIR, 'lab-tests-sources', 'manifest.json');
  if (!only && existsSync(manifest)) copyFileSync(manifest, join(DATA_DIR, 'sources-manifest.json'));
  const openManifest = join(BUILD_DIR, 'lab-tests-sources', 'open-sources-manifest.json');
  if (existsSync(openManifest)) copyFileSync(openManifest, join(DATA_DIR, 'open-sources-manifest.json'));
  writeJson(join(DATA_DIR, 'checksums.json'), checksums, true);
  console.log(`[pack] listo en ${DATA_DIR}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
