#!/usr/bin/env node
// =============================================================================
// Catálogo de análisis · descarga de archivos oficiales publicados por URL directa.
//
// Cada entrada de `DIRECT_SOURCES` se baja a `lab-tests-sources/<dir>/` (fuera
// de git) y queda en `lab-tests-sources/manifest.json` con URL, tamaño, SHA-256,
// Last-Modified y fecha. Idempotente: si el archivo ya está, no lo vuelve a bajar
// (`--refresh` lo fuerza).
//
// Uso: NODE_USE_ENV_PROXY=1 node tools/terminology-import/lab-tests/fetch-direct-sources.mjs [--only cie10es-px] [--refresh]
// =============================================================================

import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { BUILD_DIR, USER_AGENT, ensureDir, nowIso, sha256File, writeJson } from '../lib/glossary-es/common.mjs';
import { CIE_BASE, PX_FILE } from '../lib/glossary-es/cie10es.mjs';

const SOCRATA = (id) => `https://www.datos.gov.co/api/views/${id}/rows.csv?accessType=DOWNLOAD`;

export const DIRECT_SOURCES = {
  'minsalud-co-laboratorio': { dir: 'minsalud-co', files: [{ name: 'POSPOPULI-LABORATORIO-s5f2-yivs.csv', url: SOCRATA('s5f2-yivs') }] },
  'minsalud-co-pbs': { dir: 'minsalud-co', files: [{ name: 'Procedimiento-del-PBS-9zcz-bjue.csv', url: SOCRATA('9zcz-bjue') }] },
  'cie10es-px': {
    dir: 'cie10es',
    files: [{ name: PX_FILE, url: `${CIE_BASE}/${PX_FILE}` }],
  },
};

const MANIFEST = join(BUILD_DIR, 'lab-tests-sources', 'manifest.json');

async function main() {
  const args = process.argv.slice(2);
  const only = args.includes('--only') ? new Set(args[args.indexOf('--only') + 1].split(',')) : null;
  const refresh = args.includes('--refresh');
  const manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : {};
  for (const [key, src] of Object.entries(DIRECT_SOURCES)) {
    if (only && !only.has(key)) continue;
    const dir = ensureDir(join(BUILD_DIR, 'lab-tests-sources', src.dir));
    const files = { ...(manifest[key]?.files ?? {}) };
    for (const f of src.files) {
      const path = join(dir, f.name);
      if (existsSync(path) && files[f.name] && !refresh) continue;
      const res = await fetch(f.url, { headers: { 'User-Agent': USER_AGENT } });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${f.url}`);
      writeFileSync(path, Buffer.from(await res.arrayBuffer()));
      files[f.name] = { url: f.url, bytes: statSync(path).size, sha256: sha256File(path), lastModified: res.headers.get('last-modified'), retrievedAt: nowIso() };
      console.log(`[${key}] ${f.name}: ${files[f.name].bytes} bytes, sha256 ${files[f.name].sha256.slice(0, 16)}…`);
    }
    manifest[key] = { ...(manifest[key] ?? {}), dir: src.dir, files, retrievedAt: manifest[key]?.retrievedAt ?? nowIso() };
  }
  writeJson(MANIFEST, manifest, true);
}

main().catch((err) => {
  console.error('ERROR FATAL en fetch-direct-sources:', err);
  process.exitCode = 1;
});
