#!/usr/bin/env node
// =============================================================================
// Catálogo de enfermedades · etapa 0 (red): baja las fuentes de `lib/sources.mjs`
// a `<BUILD_DIR>/diseases-sources/` (fuera de git) y escribe `manifest.json`
// con URL, versión, licencia, tamaño, SHA-256 y fecha de descarga de cada una.
//
// Reanudable: un archivo que ya existe no se vuelve a bajar (se recalcula su
// SHA-256). `--force` lo baja de nuevo. Usa `curl` (respeta HTTPS_PROXY y la
// CA del sistema) en vez de fetch de Node, que no lee el proxy por defecto.
//
// Uso:
//   node tools/terminology-import/diseases/fetch-sources.mjs
//   node tools/terminology-import/diseases/fetch-sources.mjs --only mondo,doid
// =============================================================================

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { ensureDir, nowIso, sha256File, writeJson } from '../lib/glossary-es/common.mjs';
import { MEASURE_FILES, SOURCE_FILES, SOURCES_DIR } from './lib/sources.mjs';

// Las fuentes que sólo se miden también se bajan y se registran (mismo manifiesto, `measureOnly`).
const ALL_FILES = [...SOURCE_FILES, ...MEASURE_FILES.map((f) => ({ ...f, measureOnly: true }))];

const args = process.argv.slice(2);
const FORCE = args.includes('--force');
const ONLY = args.includes('--only') ? new Set(args[args.indexOf('--only') + 1].split(',')) : null;

function download(url, dest) {
  ensureDir(dirname(dest));
  execFileSync('curl', ['-sSfL', '--retry', '4', '--retry-delay', '2', '-m', '1800', '-o', dest, url], { stdio: 'inherit' });
}

function main() {
  const manifestPath = join(SOURCES_DIR, 'manifest.json');
  const entries = [];
  for (const src of ALL_FILES) {
    if (ONLY && !ONLY.has(src.key) && ![...ONLY].some((k) => src.key.startsWith(k))) continue;
    const dest = join(SOURCES_DIR, src.file);
    const had = existsSync(dest) && statSync(dest).size > 1024;
    if (!had || FORCE) {
      console.log(`[fetch] ${src.key} ← ${src.url}`);
      download(src.url, dest);
    }
    const entry = {
      ...src,
      path: dest,
      bytes: statSync(dest).size,
      sha256: sha256File(dest),
      retrievedAt: had && !FORCE ? statSync(dest).mtime.toISOString() : nowIso(),
    };
    // Copias de terceros de un archivo oficial: el hash tiene que ser el publicado.
    if (src.expectedSha256 && entry.sha256 !== src.expectedSha256) {
      throw new Error(`${src.key}: SHA-256 ${entry.sha256} ≠ esperado ${src.expectedSha256}. No se usa.`);
    }
    if (src.untarTo) {
      ensureDir(join(SOURCES_DIR, src.untarTo));
      execFileSync('tar', ['-xzf', dest, '-C', join(SOURCES_DIR, src.untarTo)], { stdio: 'inherit' });
      entry.unzippedTo = join(SOURCES_DIR, src.untarTo);
    }
    if (src.unzipTo) {
      ensureDir(join(SOURCES_DIR, src.unzipTo));
      execFileSync('unzip', ['-oq', dest, '-d', join(SOURCES_DIR, src.unzipTo)], { stdio: 'inherit' });
      entry.unzippedTo = join(SOURCES_DIR, src.unzipTo);
    }
    entries.push(entry);
    console.log(`[ok] ${src.key} ${entry.bytes} B sha256=${entry.sha256.slice(0, 12)}…`);
  }
  // Con --only se conservan las entradas previas de las demás fuentes.
  const previous = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')).sources : [];
  const keys = new Set(entries.map((e) => e.key));
  const merged = [...previous.filter((e) => !keys.has(e.key) && ALL_FILES.some((s) => s.key === e.key)), ...entries];
  writeJson(manifestPath, { generatedAt: nowIso(), sources: merged }, true);
  console.log(`Manifiesto: ${manifestPath} (${merged.length} archivos)`);
}

main();
