#!/usr/bin/env node
// =============================================================================
// Empaqueta el corpus NORMALIZADO (salida de build-symptoms-corpus.mjs) en
// `tools/terminology-import/symptoms/data/` para versionarlo en git: el
// contenedor de la nube se pierde al cerrar la sesión y el corpus no puede
// vivir sólo ahí. Los crudos NO se empaquetan (pesan ~510 MB): se re-bajan con
// fetch-symptom-sources.mjs, que verifica URL, versión y SHA-256.
//
// - Un `.ndjson.gz` por archivo; si pasa de PART_LIMIT se parte POR LÍNEAS en
//   `<nombre>.partNN.ndjson.gz`, cada parte un gzip válido (GitHub rechaza
//   archivos de más de 100 MB).
// - gzip sin fecha de modificación: el mismo corpus produce los mismos bytes.
// - `data/MANIFEST.json`: filas, bytes y SHA-256 de cada parte y del original.
//
// Uso: node tools/terminology-import/symptoms/pack-data.mjs
//      node tools/terminology-import/symptoms/pack-data.mjs --only relations-orphadata,terms-mesh-c23,crosswalk-wikidata-hpo,gap-coverage.json,saturation-gaps.json
//        (--only agrega o reemplaza SOLO esos archivos y deja intactos los demás partes y
//         el resto del MANIFEST: así un corpus nuevo no re-escribe 20 MB que no cambiaron)
// Inverso: unpack-data.mjs
// =============================================================================

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { DATA_DIR, OUT_DIR, SOURCES_DIR, sourceByKey, sourcePath } from './lib/sources.mjs';

export const PART_LIMIT = 45 * 1024 * 1024;
/** Reportes chicos que acompañan al corpus. */
const EXTRA_JSON = ['coverage.json', 'saturation.json', 'gap-coverage.json', 'saturation-gaps.json'];
/**
 * Archivos que vienen de las fuentes, no del build, pero sin los cuales el build no se
 * reproduce desde data/: el manifiesto de procedencia (sin rutas locales) y el resultado
 * normalizado de la consulta SPARQL a Wikidata, que es en vivo y no se puede repetir idéntico.
 */
export const SOURCE_FILES_IN_DATA = {
  'sources-manifest.json': () => join(SOURCES_DIR, 'manifest.json'),
  'wikidata-p3841-snapshot.json': () => sourcePath(sourceByKey('wikidata-p3841').file),
};

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');
const gzip = (buf) => gzipSync(buf, { level: 9 });

/**
 * Parte un NDJSON por líneas en bloques cuyo gzip queda bajo `limit`. Si un
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

function main() {
  const only = process.argv.includes('--only') ? new Set(process.argv[process.argv.indexOf('--only') + 1].split(',')) : null;
  const ndDir = join(OUT_DIR, 'ndjson');
  if (!existsSync(ndDir)) throw new Error(`Falta ${ndDir}: corré build-symptoms-corpus.mjs`);
  mkdirSync(DATA_DIR, { recursive: true });
  const manifestPath = join(DATA_DIR, 'MANIFEST.json');
  let manifest = { generatedFrom: 'build-symptoms-corpus.mjs', files: [] };
  if (only) {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    manifest.generatedFrom = 'build-symptoms-corpus.mjs + build-gap-sources.mjs';
    // Se reemplazan sólo las entradas nombradas: se borran sus partes viejas y su entrada.
    for (const f of manifest.files.filter((x) => only.has(x.name) || only.has(x.name.replace(/\.ndjson$/, '')))) {
      for (const part of f.parts) rmSync(join(DATA_DIR, part.file), { force: true });
    }
    manifest.files = manifest.files.filter((x) => !(only.has(x.name) || only.has(x.name.replace(/\.ndjson$/, ''))));
  } else if (existsSync(DATA_DIR)) {
    for (const f of readdirSync(DATA_DIR)) if (f.endsWith('.gz') || f === 'MANIFEST.json') rmSync(join(DATA_DIR, f));
  }
  for (const name of readdirSync(ndDir).filter((f) => f.endsWith('.ndjson')).sort()) {
    if (only && !only.has(name) && !only.has(name.replace(/\.ndjson$/, ''))) continue;
    const raw = readFileSync(join(ndDir, name));
    const parts = splitByLines(raw.toString('utf8'));
    const base = name.replace(/\.ndjson$/, '');
    const entry = { name, rows: 0, bytes: raw.length, sha256: sha256(raw), parts: [] };
    parts.forEach((p, i) => {
      const file = parts.length === 1 ? `${base}.ndjson.gz` : `${base}.part${String(i + 1).padStart(2, '0')}.ndjson.gz`;
      writeFileSync(join(DATA_DIR, file), p.gz);
      entry.rows += p.lines.length;
      entry.parts.push({ file, rows: p.lines.length, gzBytes: p.gz.length, gzSha256: sha256(p.gz) });
    });
    manifest.files.push(entry);
    console.log(`[pack] ${name}: ${entry.rows} filas → ${entry.parts.map((p) => `${p.file} (${(p.gzBytes / 1048576).toFixed(1)} MB)`).join(', ')}`);
  }
  for (const name of [...EXTRA_JSON, ...Object.keys(SOURCE_FILES_IN_DATA)]) {
    if (only && !only.has(name)) continue;
    const p = SOURCE_FILES_IN_DATA[name] ? SOURCE_FILES_IN_DATA[name]() : join(OUT_DIR, name);
    if (!existsSync(p)) continue;
    const raw = readFileSync(p);
    const gz = gzip(raw);
    writeFileSync(join(DATA_DIR, `${name}.gz`), gz);
    manifest.files.push({ name, rows: null, bytes: raw.length, sha256: sha256(raw), parts: [{ file: `${name}.gz`, rows: null, gzBytes: gz.length, gzSha256: sha256(gz) }] });
  }
  manifest.files.sort((a, b) => a.name.localeCompare(b.name));
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  const total = manifest.files.reduce((n, f) => n + f.parts.reduce((m, p) => m + p.gzBytes, 0), 0);
  console.log(`[pack] ${manifest.files.length} archivos, ${(total / 1048576).toFixed(1)} MB comprimidos en ${DATA_DIR}`);
}

if (basename(process.argv[1] ?? '') === 'pack-data.mjs') main();
