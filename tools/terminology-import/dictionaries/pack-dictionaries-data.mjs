#!/usr/bin/env node
// =============================================================================
// Empaqueta en git el corpus normalizado de los diccionarios (para que no viva
// sólo en el contenedor de la nube) y lo restaura.
//
//   --pack    glossary-data-build/dictionaries/ndjson/* + coverage.json + el
//             manifiesto de descargas → tools/terminology-import/dictionaries/data/
//             (gzip determinista, partes de ≤ 45 MB: GitHub rechaza > 100 MB)
//   --unpack  data/ → glossary-data-build/dictionaries/ndjson/ (verifica SHA-256),
//             listo para load-dictionaries.mjs sin volver a bajar ni construir
//
// Los archivos fuente crudos NO se suben (fma.owl pesa 200 MB): se vuelven a
// bajar con fetch-dictionaries.mjs, que fija URL y versión; `data/manifest.json`
// trae su SHA-256 para comprobar que son los mismos bytes.
// =============================================================================

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync, gzipSync } from 'node:zlib';
import { MANIFEST_PATH, NDJSON_DIR, REPORT_PATH } from './lib/paths.mjs';
import { ABBREVIATION_SOURCE, FMA_SOURCE, HGNC_SOURCE, OBO_SOURCES, ORGANISM_SOURCES } from './lib/sources.mjs';

const DATA_DIR = join(dirname(fileURLToPath(import.meta.url)), 'data');
const PART_BYTES = 45 * 1024 * 1024;
const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');

function pack() {
  // Tras un --unpack no está el manifiesto de descargas (no se bajó nada): se conserva el ya empaquetado.
  // Se lee ANTES de borrar data/, para no dejarlo a medias si falta.
  const prevManifest = join(DATA_DIR, 'manifest.json');
  const manifestSrc = existsSync(MANIFEST_PATH) ? MANIFEST_PATH : prevManifest;
  if (!existsSync(manifestSrc)) throw new Error(`Falta el manifiesto de descargas (${MANIFEST_PATH}): corré fetch-dictionaries.mjs`);
  const manifest = JSON.parse(readFileSync(manifestSrc, 'utf8'));
  if (existsSync(DATA_DIR)) rmSync(DATA_DIR, { recursive: true });
  mkdirSync(join(DATA_DIR, 'ndjson'), { recursive: true });
  const index = { packedAt: new Date().toISOString(), note: 'gzip de los archivos de glossary-data-build/dictionaries/ndjson; restaurar con --unpack', files: [] };
  const inputs = readdirSync(NDJSON_DIR).filter((f) => f.endsWith('.ndjson') || f.endsWith('.meta.json')).sort().map((f) => ({ name: f, path: join(NDJSON_DIR, f) }));
  inputs.push({ name: 'coverage.json', path: REPORT_PATH });
  for (const { name, path } of inputs) {
    const raw = readFileSync(path);
    const gz = gzipSync(raw, { level: 9 });
    const parts = [];
    for (let i = 0; i * PART_BYTES < gz.length; i++) {
      const partName = gz.length > PART_BYTES ? `${name}.gz.part${String(i).padStart(2, '0')}` : `${name}.gz`;
      const chunk = gz.subarray(i * PART_BYTES, (i + 1) * PART_BYTES);
      writeFileSync(join(DATA_DIR, 'ndjson', partName), chunk);
      parts.push({ name: partName, bytes: chunk.length });
    }
    index.files.push({ name, bytes: raw.length, sha256: sha256(raw), gzBytes: gz.length, parts });
  }
  // Manifiesto de descargas (URL, SHA-256, fecha), sólo de los archivos que el registro usa hoy.
  const used = new Set();
  for (const s of [...OBO_SOURCES, FMA_SOURCE, HGNC_SOURCE, ABBREVIATION_SOURCE]) for (const f of s.files) used.add(`${s.id}/${f.name}`);
  for (const f of Object.values(ORGANISM_SOURCES.files)) used.add(`${ORGANISM_SOURCES.id}/${f.name}`);
  const files = Object.fromEntries(Object.entries(manifest.files).filter(([k]) => used.has(k)));
  writeFileSync(join(DATA_DIR, 'manifest.json'), JSON.stringify({ files }, null, 2) + '\n');
  writeFileSync(join(DATA_DIR, 'INDEX.json'), JSON.stringify(index, null, 2) + '\n');
  const total = index.files.reduce((n, f) => n + f.gzBytes, 0);
  console.log(`[pack] ${index.files.length} archivos → ${DATA_DIR} (${(total / 1048576).toFixed(1)} MB comprimidos)`);
}

function unpack() {
  const index = JSON.parse(readFileSync(join(DATA_DIR, 'INDEX.json'), 'utf8'));
  mkdirSync(NDJSON_DIR, { recursive: true });
  for (const f of index.files) {
    const gz = Buffer.concat(f.parts.map((p) => readFileSync(join(DATA_DIR, 'ndjson', p.name))));
    const raw = gunzipSync(gz);
    if (sha256(raw) !== f.sha256) throw new Error(`SHA-256 distinto al restaurar ${f.name}`);
    writeFileSync(f.name === 'coverage.json' ? REPORT_PATH : join(NDJSON_DIR, f.name), raw);
  }
  console.log(`[unpack] ${index.files.length} archivos verificados → ${NDJSON_DIR}`);
}

const mode = process.argv[2];
if (mode === '--pack') pack();
else if (mode === '--unpack') unpack();
else {
  console.error('Uso: pack-dictionaries-data.mjs --pack | --unpack');
  process.exitCode = 1;
}
