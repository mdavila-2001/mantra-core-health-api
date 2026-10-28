#!/usr/bin/env node
// =============================================================================
// Empaqueta el corpus NORMALIZADO (salida de build-genetics-corpus.mjs) en
// `tools/terminology-import/genetics/data/` para versionarlo en git: el
// contenedor de la nube se pierde al cerrar la sesión y el corpus no puede
// vivir sólo ahí. Los crudos NO se empaquetan: se re-bajan con
// fetch-genetics-sources.mjs, que verifica URL, versión y SHA-256.
//
// - Un `<sistema>.ndjson.gz` por archivo; si no entra en PART_LIMIT se parte POR
//   LÍNEAS en `<sistema>.partNN.ndjson.gz`, cada parte un gzip válido, < 45 MB.
// - gzip sin fecha de modificación: el mismo corpus produce los mismos bytes.
// - `data/MANIFEST.json` (filas, bytes y SHA-256 de cada parte y del original) y
//   `data/SHA256SUMS` (formato `sha256sum -c`).
// - Va también el `manifest.json` de las fuentes (URL, versión y SHA-256 de cada
//   crudo, sin rutas locales) y `coverage.json`.
//
// Uso: node tools/terminology-import/genetics/pack-data.mjs [--only hgnc,so]
// Inverso: unpack-data.mjs
// =============================================================================

import { createHash } from 'node:crypto';
import { createReadStream, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { basename, join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { DATA_DIR, OUT_DIR, SOURCES_DIR } from './lib/sources.mjs';

export const PART_LIMIT = 45 * 1024 * 1024;
/** Tamaño crudo objetivo por parte: con ~10:1 de compresión queda muy por debajo de PART_LIMIT; si no, se subdivide. */
const RAW_TARGET = 96 * 1024 * 1024;

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');
const gzip = (buf) => gzipSync(buf, { level: 9 });

/**
 * Parte un NDJSON (texto) por líneas en bloques cuyo gzip queda bajo `limit`. Si un
 * bloque se pasa, se reparte en bloques de la mitad de líneas; una línea sola
 * que no entra es un error (nunca se corta una fila).
 */
export function splitByLines(text, limit = PART_LIMIT) {
  const lines = text.split('\n').filter((l) => l !== '');
  let size = lines.length;
  for (;;) {
    const out = [];
    let fits = true;
    for (let i = 0; i < lines.length && fits; i += size) {
      const chunk = lines.slice(i, i + size);
      const gz = gzip(Buffer.from(chunk.join('\n') + '\n'));
      if (gz.length > limit) fits = false;
      else out.push({ lines: chunk, gz });
    }
    if (fits) return out;
    if (size === 1) throw new Error(`Una sola fila comprimida supera ${limit} bytes`);
    size = Math.ceil(size / 2);
  }
}

/** Lee un NDJSON en streaming y devuelve bloques de texto de ~RAW_TARGET bytes (nunca corta una línea) con el sha256 del original. */
async function* rawBlocks(path) {
  const rl = createInterface({ input: createReadStream(path), crlfDelay: Infinity });
  let buf = [];
  let bytes = 0;
  for await (const line of rl) {
    if (line === '') continue;
    buf.push(line);
    bytes += Buffer.byteLength(line) + 1;
    if (bytes >= RAW_TARGET) {
      yield buf.join('\n') + '\n';
      buf = [];
      bytes = 0;
    }
  }
  if (buf.length) yield buf.join('\n') + '\n';
}

async function packNdjson(name, path, dataDir) {
  const base = name.replace(/\.ndjson$/, '');
  const whole = createHash('sha256');
  let totalBytes = 0;
  let rows = 0;
  const gzParts = [];
  for await (const block of rawBlocks(path)) {
    whole.update(block);
    totalBytes += Buffer.byteLength(block);
    for (const p of splitByLines(block)) {
      gzParts.push(p);
      rows += p.lines.length;
    }
  }
  const entry = { name, rows, bytes: totalBytes, sha256: whole.digest('hex'), parts: [] };
  gzParts.forEach((p, i) => {
    const file = gzParts.length === 1 ? `${base}.ndjson.gz` : `${base}.part${String(i + 1).padStart(2, '0')}.ndjson.gz`;
    writeFileSync(join(dataDir, file), p.gz);
    entry.parts.push({ file, rows: p.lines.length, gzBytes: p.gz.length, gzSha256: sha256(p.gz) });
  });
  return entry;
}

async function main() {
  const args = process.argv.slice(2);
  const only = args.includes('--only') ? new Set(args[args.indexOf('--only') + 1].split(',')) : null;
  const ndDir = join(OUT_DIR, 'ndjson');
  if (!existsSync(ndDir)) throw new Error(`Falta ${ndDir}: corré build-genetics-corpus.mjs`);
  mkdirSync(DATA_DIR, { recursive: true });
  const manifestPath = join(DATA_DIR, 'MANIFEST.json');
  let manifest = { generatedFrom: 'build-genetics-corpus.mjs', files: [] };
  const mine = (name) => !only || only.has(name) || only.has(name.replace(/\.ndjson$/, ''));
  if (only) {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    for (const f of manifest.files.filter((x) => mine(x.name))) for (const part of f.parts) rmSync(join(DATA_DIR, part.file), { force: true });
    manifest.files = manifest.files.filter((x) => !mine(x.name));
  } else {
    for (const f of readdirSync(DATA_DIR)) if (f.endsWith('.gz') || f === 'MANIFEST.json' || f === 'SHA256SUMS') rmSync(join(DATA_DIR, f));
  }
  for (const name of readdirSync(ndDir).filter((f) => f.endsWith('.ndjson')).sort()) {
    if (!mine(name)) continue;
    const entry = await packNdjson(name, join(ndDir, name), DATA_DIR);
    manifest.files.push(entry);
    console.log(`[pack] ${name}: ${entry.rows} filas → ${entry.parts.map((p) => `${p.file} (${(p.gzBytes / 1048576).toFixed(1)} MB)`).join(', ')}`);
  }
  const extras = { 'sources-manifest.json': () => cleanManifest(), 'coverage.json': () => readFileSync(join(OUT_DIR, 'coverage.json')) };
  for (const [name, read] of Object.entries(extras)) {
    if (only && !only.has(name)) continue;
    const raw = Buffer.from(read());
    const gz = gzip(raw);
    writeFileSync(join(DATA_DIR, `${name}.gz`), gz);
    manifest.files = manifest.files.filter((x) => x.name !== name);
    manifest.files.push({ name, rows: null, bytes: raw.length, sha256: sha256(raw), parts: [{ file: `${name}.gz`, rows: null, gzBytes: gz.length, gzSha256: sha256(gz) }] });
  }
  manifest.files.sort((a, b) => a.name.localeCompare(b.name));
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  const sums = [...manifest.files.flatMap((f) => f.parts.map((p) => `${p.gzSha256}  ${p.file}`)), `${sha256(readFileSync(manifestPath))}  MANIFEST.json`].sort((a, b) => (a.slice(66) < b.slice(66) ? -1 : 1));
  writeFileSync(join(DATA_DIR, 'SHA256SUMS'), sums.join('\n') + '\n');
  const total = manifest.files.reduce((n, f) => n + f.parts.reduce((m, p) => m + p.gzBytes, 0), 0);
  console.log(`[pack] ${manifest.files.length} archivos, ${(total / 1048576).toFixed(1)} MB comprimidos en ${DATA_DIR}`);
}

/** manifest.json de las fuentes sin la ruta local (`dir`), para que no dependa de la máquina. */
function cleanManifest() {
  const m = JSON.parse(readFileSync(join(SOURCES_DIR, 'manifest.json'), 'utf8'));
  delete m.dir;
  return JSON.stringify(m, null, 2) + '\n';
}

if (basename(process.argv[1] ?? '') === 'pack-data.mjs') {
  main().catch((err) => {
    console.error('ERROR FATAL en pack-data:', err);
    process.exitCode = 1;
  });
}
