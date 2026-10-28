#!/usr/bin/env node
// =============================================================================
// Etapa 0 · baja los crudos a <GLOSSARY_BUILD_DIR>/raw/ (fuera de git), en streaming,
// ≤ 2 pedidos/s por host, con reintentos y reanudable (un archivo ya bajado se reusa
// salvo --force). Verifica la integridad que publica el registro de npm (sha512), anota
// URL, SHA-256, tamaño, fecha, Last-Modified/ETag en raw/manifest.json y extrae los
// paquetes FHIR a raw/x/<clave>/ (sólo para el build; se borran con `build --clean`).
//
//   node tools/terminology-import/interop-vocab/fetch-sources.mjs [--force] [--only tho-r4,cdc-cvx]
// =============================================================================

import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { RAW_DIR, download, ensureDir, nowIso, readJson, rmrf, writeJson } from './lib/common.mjs';
import { SOURCES } from './lib/sources.mjs';

const args = process.argv.slice(2);
const FORCE = args.includes('--force');
const ONLY = args.includes('--only') ? new Set(args[args.indexOf('--only') + 1].split(',')) : null;

const manifestPath = join(RAW_DIR, 'manifest.json');
const manifest = existsSync(manifestPath) ? readJson(manifestPath) : { files: {} };
for (const k of Object.keys(manifest.files)) if (!SOURCES.some((s) => s.key === k)) delete manifest.files[k]; // claves retiradas de sources.mjs

async function npmIntegrity(metaUrl) {
  const res = await fetch(metaUrl, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${metaUrl}`);
  const j = await res.json();
  return { integrity: j.dist?.integrity ?? null, shasum: j.dist?.shasum ?? null, license: j.license ?? null };
}

for (const s of SOURCES) {
  if (ONLY && !ONLY.has(s.key)) continue;
  const dest = join(RAW_DIR, s.file);
  let rec = manifest.files[s.key];
  if (!existsSync(dest) || FORCE || !rec) {
    console.log(`↓ ${s.key}  ${s.url}`);
    const r = await download(s.url, dest);
    rec = {
      key: s.key,
      url: s.url,
      file: s.file,
      bytes: r.bytes,
      sha256: r.sha256,
      retrievedAt: nowIso(),
      httpStatus: r.status,
      lastModified: r.headers['last-modified'] ?? null,
      etag: r.headers.etag ?? null,
      name: s.name ?? null,
      version: s.version ?? null,
    };
    if (s.metaUrl) {
      const npm = await npmIntegrity(s.metaUrl);
      const sha512 = `sha512-${createHash('sha512').update(readFileSync(dest)).digest('base64')}`;
      if (npm.integrity && npm.integrity !== sha512) throw new Error(`${s.key}: la integridad sha512 no coincide con el registro de npm`);
      rec.npmIntegrity = npm.integrity;
      rec.npmShasum = npm.shasum;
      rec.npmLicense = npm.license;
    }
    manifest.files[s.key] = rec;
    writeJson(manifestPath, manifest, true);
  } else {
    console.log(`= ${s.key}  ya bajado (${rec.sha256.slice(0, 12)}…)`);
  }
  if (s.kind === 'npm-package' || s.kind === 'fhir-package') {
    const dir = join(RAW_DIR, 'x', s.key);
    if (!existsSync(join(dir, 'package', 'package.json')) || FORCE) {
      rmrf(dir);
      ensureDir(dir);
      execFileSync('tar', ['-xzf', dest, '-C', dir, '--no-same-owner'], { stdio: 'inherit' });
    }
    const pkg = readJson(join(dir, 'package', 'package.json'));
    if (pkg.license !== s.pkgLicense) throw new Error(`${s.key}: package.json declara licencia ${pkg.license}, se esperaba ${s.pkgLicense}`);
    if (pkg.name !== s.name || pkg.version !== s.version) throw new Error(`${s.key}: el paquete es ${pkg.name}@${pkg.version}`);
    rec.packageLicense = pkg.license;
    manifest.files[s.key] = rec;
    writeJson(manifestPath, manifest, true);
  }
}
console.log(`Listo: ${Object.keys(manifest.files).length} archivos en ${RAW_DIR}`);
