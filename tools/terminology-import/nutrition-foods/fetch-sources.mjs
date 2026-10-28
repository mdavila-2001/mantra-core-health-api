#!/usr/bin/env node
// =============================================================================
// Nutrición y alimentos · etapa 0 (red): baja los archivos fuente tal cual los publica cada titular,
// en streaming, y registra URL, versión, SHA-256, tamaño y fecha en `data/nutrition-foods.manifest.json`.
// Los crudos quedan FUERA de git (SOURCES_DIR, bajo GLOSSARY_BUILD_DIR). Reanudable: un archivo ya bajado y
// registrado con el mismo tamaño y SHA-256 no se vuelve a pedir.
//
//   GLOSSARY_BUILD_DIR=… node --max-old-space-size=2500 tools/terminology-import/nutrition-foods/fetch-sources.mjs [--only k1,k2] [--skip-heavy]
// =============================================================================
import { createHash } from 'node:crypto';
import { createReadStream, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { DATA_DIR, SOURCES_DIR } from './lib/paths.mjs';
import { downloadTo, sha256OfFile } from './lib/http.mjs';
import { ARTIFACTS } from './lib/sources.mjs';

export const MANIFEST_FILE = join(DATA_DIR, 'nutrition-foods.manifest.json');

const md5OfFile = (path) =>
  new Promise((resolve, reject) => {
    const h = createHash('md5');
    createReadStream(path).on('data', (c) => h.update(c)).on('end', () => resolve(h.digest('hex'))).on('error', reject);
  });

export function readManifest() {
  return existsSync(MANIFEST_FILE) ? JSON.parse(readFileSync(MANIFEST_FILE, 'utf8')) : { artifacts: {} };
}

export const artifactPath = (key) => join(SOURCES_DIR, ARTIFACTS[key].dir, ARTIFACTS[key].file);

async function main() {
  const args = process.argv.slice(2);
  const only = args.includes('--only') ? new Set(args[args.indexOf('--only') + 1].split(',')) : null;
  const skipHeavy = args.includes('--skip-heavy');
  mkdirSync(dirname(MANIFEST_FILE), { recursive: true });
  const manifest = readManifest();
  for (const [key, art] of Object.entries(ARTIFACTS)) {
    if (only && !only.has(key)) continue;
    if (skipHeavy && art.heavy) continue;
    const dest = artifactPath(key);
    const prev = manifest.artifacts[key];
    if (prev && existsSync(dest) && (await sha256OfFile(dest)) === prev.sha256) {
      console.log(`= ${key}: ya bajado (${prev.bytes} bytes, sha256 ${prev.sha256.slice(0, 12)}…)`);
      continue;
    }
    console.log(`↓ ${key}: ${art.url}`);
    const rec = await downloadTo(art.url, dest);
    if (art.md5) {
      const got = await md5OfFile(dest);
      if (got !== art.md5) throw new Error(`${key}: MD5 ${got} ≠ ${art.md5} publicado por Zenodo`);
      rec.md5 = got;
    }
    manifest.artifacts[key] = { ...rec, version: art.version, ...(art.commit ? { commit: art.commit } : {}), title: art.title, license: art.license };
    writeFileSync(MANIFEST_FILE, `${JSON.stringify(manifest, null, 2)}\n`);
    console.log(`  ${rec.bytes} bytes, sha256 ${rec.sha256}`);
  }
  console.log(`Manifiesto: ${MANIFEST_FILE}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error('ERROR FATAL en fetch-sources:', err);
    process.exitCode = 1;
  });
}
