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
import { existsSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { ensureDir, nowIso, sha256File, writeJson } from '../lib/glossary-es/common.mjs';
import { SOURCE_FILES, SOURCES_DIR } from './lib/sources.mjs';

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
  for (const src of SOURCE_FILES) {
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
    entries.push(entry);
    console.log(`[ok] ${src.key} ${entry.bytes} B sha256=${entry.sha256.slice(0, 12)}…`);
  }
  writeJson(manifestPath, { generatedAt: nowIso(), sources: entries }, true);
  console.log(`Manifiesto: ${manifestPath} (${entries.length} archivos)`);
}

main();
