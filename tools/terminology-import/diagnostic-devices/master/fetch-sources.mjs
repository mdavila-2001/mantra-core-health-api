#!/usr/bin/env node
// =============================================================================
// Equipos de diagnóstico · master · etapa 0 (red): baja las fuentes propias.
//
// Para cada espejo de `lib/sources.mjs`: clona sin blobs, extrae solo los
// archivos fijados en el commit fijado, verifica su sha256 y escribe
// `<CACHE_DIR>/manifest.json`. Reanudable: si el archivo ya está y el hash
// coincide, no vuelve a bajar. No ejecuta nada de los repositorios.
//
// Uso:
//   node tools/terminology-import/diagnostic-devices/master/fetch-sources.mjs
//   node tools/terminology-import/diagnostic-devices/master/fetch-sources.mjs --force
// =============================================================================

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';

import {
  CACHE_DIR,
  MIRRORS,
  OFFICIAL,
  mirrorFilePath,
  officialFilePath,
} from './lib/sources.mjs';

const FORCE = process.argv.includes('--force');
const sha256 = (path) =>
  createHash('sha256').update(readFileSync(path)).digest('hex');
const git = (args, cwd) =>
  execFileSync('git', args, {
    cwd,
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 1 << 30,
  }).toString();

mkdirSync(CACHE_DIR, { recursive: true });
const manifest = { generatedAt: new Date().toISOString(), mirrors: {} };

for (const [key, m] of Object.entries(MIRRORS)) {
  const files = Object.entries(m.files);
  const ok =
    !FORCE &&
    files.every(
      ([fk, f]) =>
        existsSync(mirrorFilePath(key, fk)) &&
        sha256(mirrorFilePath(key, fk)) === f.sha256,
    );
  if (!ok) {
    const work = join(CACHE_DIR, `.git-${key}`);
    rmSync(work, { recursive: true, force: true });
    console.log(`[${key}] clonando ${m.repo} …`);
    git([
      'clone',
      '--quiet',
      '--filter=blob:none',
      '--no-checkout',
      m.repo,
      work,
    ]);
    git(['fetch', '--quiet', 'origin', m.commit], work);
    for (const [fk, f] of files) {
      const out = mirrorFilePath(key, fk);
      mkdirSync(dirname(out), { recursive: true });
      // `git show <commit>:<path>` escribe el blob tal cual, sin checkout.
      const blob = execFileSync('git', ['show', `${m.commit}:${f.path}`], {
        cwd: work,
        maxBuffer: 1 << 30,
      });
      writeFileSync(out, blob);
    }
    rmSync(work, { recursive: true, force: true });
  }
  manifest.mirrors[key] = { repo: m.repo, commit: m.commit, files: {} };
  for (const [fk, f] of files) {
    const path = mirrorFilePath(key, fk);
    const got = sha256(path);
    if (got !== f.sha256)
      throw new Error(
        `[${key}/${f.path}] sha256 ${got} ≠ esperado ${f.sha256}: no se usa`,
      );
    manifest.mirrors[key].files[fk] = {
      path: f.path,
      sha256: got,
      officialUrl: f.officialUrl,
    };
    console.log(`[${key}] ${f.path} ✓ ${got.slice(0, 12)}`);
  }
}

// Descargas oficiales: curl (respeta el proxy del entorno) + sha256 del zip y
// del archivo. Un hash distinto no corta la etapa: avisa y la build usa la
// copia en git.
manifest.official = {};
for (const [key, o] of Object.entries(OFFICIAL)) {
  const path = officialFilePath(key);
  if (FORCE || !existsSync(path) || sha256(path) !== o.sha256) {
    const dir = dirname(path);
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
    const zip = join(dir, 'download.zip');
    try {
      execFileSync('curl', ['-sSfL', '-m', '300', '-o', zip, o.url], {
        stdio: ['ignore', 'ignore', 'pipe'],
      });
    } catch (e) {
      console.warn(`[${key}] no se pudo bajar ${o.url}: ${e.message}`);
      continue;
    }
    const gotZip = sha256(zip);
    if (gotZip !== o.zipSha256) {
      console.warn(
        `[${key}] el zip publicado tiene sha256 ${gotZip} ≠ fijado ${o.zipSha256} (otra exportación): no se usa; actualizá el pin en lib/sources.mjs`,
      );
      rmSync(dir, { recursive: true, force: true });
      continue;
    }
    writeFileSync(
      path,
      execFileSync('unzip', ['-p', zip, o.path], { maxBuffer: 1 << 30 }),
    );
    rmSync(zip, { force: true });
  }
  const got = sha256(path);
  if (got !== o.sha256) {
    console.warn(`[${key}] ${o.path} sha256 ${got} ≠ ${o.sha256}: no se usa`);
    rmSync(path, { force: true });
    continue;
  }
  manifest.official[key] = {
    url: o.url,
    exportDate: o.exportDate,
    zipSha256: o.zipSha256,
    path: o.path,
    sha256: got,
  };
  console.log(`[${key}] ${o.path} ✓ ${got.slice(0, 12)} (${o.exportDate})`);
}

writeFileSync(
  join(CACHE_DIR, 'manifest.json'),
  `${JSON.stringify(manifest, null, 2)}\n`,
);
console.log(`manifest → ${join(CACHE_DIR, 'manifest.json')}`);
