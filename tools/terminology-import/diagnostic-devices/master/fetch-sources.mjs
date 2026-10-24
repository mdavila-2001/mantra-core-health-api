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
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { CACHE_DIR, MIRRORS, mirrorFilePath } from './lib/sources.mjs';

const FORCE = process.argv.includes('--force');
const sha256 = (path) => createHash('sha256').update(readFileSync(path)).digest('hex');
const git = (args, cwd) => execFileSync('git', args, { cwd, stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 1 << 30 }).toString();

mkdirSync(CACHE_DIR, { recursive: true });
const manifest = { generatedAt: new Date().toISOString(), mirrors: {} };

for (const [key, m] of Object.entries(MIRRORS)) {
  const files = Object.entries(m.files);
  const ok = !FORCE && files.every(([fk, f]) => existsSync(mirrorFilePath(key, fk)) && sha256(mirrorFilePath(key, fk)) === f.sha256);
  if (!ok) {
    const work = join(CACHE_DIR, `.git-${key}`);
    rmSync(work, { recursive: true, force: true });
    console.log(`[${key}] clonando ${m.repo} …`);
    git(['clone', '--quiet', '--filter=blob:none', '--no-checkout', m.repo, work]);
    git(['fetch', '--quiet', 'origin', m.commit], work);
    for (const [fk, f] of files) {
      const out = mirrorFilePath(key, fk);
      mkdirSync(dirname(out), { recursive: true });
      // `git show <commit>:<path>` escribe el blob tal cual, sin checkout.
      const blob = execFileSync('git', ['show', `${m.commit}:${f.path}`], { cwd: work, maxBuffer: 1 << 30 });
      writeFileSync(out, blob);
    }
    rmSync(work, { recursive: true, force: true });
  }
  manifest.mirrors[key] = { repo: m.repo, commit: m.commit, files: {} };
  for (const [fk, f] of files) {
    const path = mirrorFilePath(key, fk);
    const got = sha256(path);
    if (got !== f.sha256) throw new Error(`[${key}/${f.path}] sha256 ${got} ≠ esperado ${f.sha256}: no se usa`);
    manifest.mirrors[key].files[fk] = { path: f.path, sha256: got, officialUrl: f.officialUrl };
    console.log(`[${key}] ${f.path} ✓ ${got.slice(0, 12)}`);
  }
}

writeFileSync(join(CACHE_DIR, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`manifest → ${join(CACHE_DIR, 'manifest.json')}`);
