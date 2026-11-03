#!/usr/bin/env node
// =============================================================================
// Catálogo de análisis · descarga de NCBI GTR (FTP público de NCBI).
//
// Baja a `lab-tests-sources/gtr/` (fuera de git) los tres archivos que usa
// `lib/gtr.mjs` y anota URL, tamaño, SHA-256 y fecha en
// `lab-tests-sources/manifest.json` (clave `gtr-ncbi`). NCBI regenera
// test_version y test_condition_gene a diario: el SHA-256 identifica la copia leída.
//
// Uso: NODE_USE_ENV_PROXY=1 node tools/terminology-import/lab-tests/fetch-gtr.mjs
// =============================================================================

import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { BUILD_DIR, USER_AGENT, ensureDir, nowIso, sha256File, writeJson } from '../lib/glossary-es/common.mjs';

export const GTR_FTP = 'https://ftp.ncbi.nlm.nih.gov/pub/GTR/data/';
export const GTR_FILES = ['test_version.gz', 'test_condition_gene.txt', 'tests_by_method_category.txt'];
const DIR = ensureDir(join(BUILD_DIR, 'lab-tests-sources', 'gtr'));
const MANIFEST = join(BUILD_DIR, 'lab-tests-sources', 'manifest.json');

async function main() {
  const manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : {};
  const files = {};
  for (const name of GTR_FILES) {
    const url = `${GTR_FTP}${name}`;
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
    const path = join(DIR, name);
    writeFileSync(path, Buffer.from(await res.arrayBuffer()));
    files[name] = { url, bytes: statSync(path).size, sha256: sha256File(path), lastModified: res.headers.get('last-modified') };
    console.log(`[gtr] ${name}: ${files[name].bytes} bytes, sha256 ${files[name].sha256.slice(0, 16)}…`);
  }
  manifest['gtr-ncbi'] = { retrievedAt: nowIso(), files, license: 'Dominio público (NCBI/NLM); atribución pedida a GTR.' };
  writeJson(MANIFEST, manifest, true);
}

main().catch((err) => {
  console.error('ERROR FATAL en fetch-gtr:', err);
  process.exitCode = 1;
});
