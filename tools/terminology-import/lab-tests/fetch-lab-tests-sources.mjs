#!/usr/bin/env node
// =============================================================================
// Catálogo de análisis · etapa 0 (descarga de las fuentes que no exigen cuenta).
//
// Baja a `<GLOSSARY_BUILD_DIR>/lab-tests-sources/<dir>/` (FUERA de git) los
// paquetes npm que publican fuentes oficiales, con `npm pack` (que verifica el
// `dist.integrity` del registro) y anota versión, SHA-256 y fecha en
// `lab-tests-sources/manifest.json`. Idempotente: si el tarball ya está, no lo
// vuelve a bajar.
//
// LOINC NO se baja acá: exige cuenta en loinc.org y aceptar la licencia. Una
// persona descarga «LOINC Table + Accessory Files» y lo descomprime en
// `lab-tests-sources/loinc/` (ver SOURCES.md).
//
// Uso: node tools/terminology-import/lab-tests/fetch-lab-tests-sources.mjs
// =============================================================================

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { BUILD_DIR, ensureDir, nowIso, sha256File, writeJson } from '../lib/glossary-es/common.mjs';
import { SOURCES } from './lib/sources.mjs';

const ROOT = ensureDir(join(BUILD_DIR, 'lab-tests-sources'));
const MANIFEST = join(ROOT, 'manifest.json');

function main() {
  const manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : {};
  for (const [key, src] of Object.entries(SOURCES)) {
    if (src.obtain !== 'npm') {
      console.log(`[${key}] ${src.obtain}: no se descarga automáticamente (${src.officialUrl}).`);
      continue;
    }
    const dir = ensureDir(join(ROOT, src.dir));
    const spec = `${src.npm.name}@${src.npm.version}`;
    let tgz = readdirSync(dir).find((f) => f.endsWith('.tgz'));
    let packInfo = manifest[key]?.npm ?? null;
    if (!tgz) {
      const out = execFileSync('npm', ['pack', spec, '--pack-destination', dir, '--json', '--silent'], { encoding: 'utf8' });
      const [info] = JSON.parse(out);
      tgz = info.filename.replace(/^@/, '').replace(/\//g, '-');
      if (!existsSync(join(dir, tgz))) tgz = readdirSync(dir).find((f) => f.endsWith('.tgz'));
      packInfo = { name: info.name, version: info.version, integrity: info.integrity, shasum: info.shasum };
      execFileSync('tar', ['xzf', join(dir, tgz), '-C', dir]);
      manifest[key] = { ...manifest[key], retrievedAt: nowIso() };
    }
    manifest[key] = {
      ...manifest[key],
      spec,
      tarball: tgz,
      sha256: sha256File(join(dir, tgz)),
      npm: packInfo,
      registryUrl: `https://registry.npmjs.org/${src.npm.name}/${src.npm.version}`,
      license: src.license,
    };
    console.log(`[${key}] ${spec} → ${join(dir, tgz)} (sha256 ${manifest[key].sha256.slice(0, 16)}…)`);
  }
  writeJson(MANIFEST, manifest, true);
  console.log(`Manifiesto: ${MANIFEST}`);
}

main();
