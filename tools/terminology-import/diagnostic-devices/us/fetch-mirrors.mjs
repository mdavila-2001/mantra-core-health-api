#!/usr/bin/env node
// =============================================================================
// Baja los espejos públicos de `lib/sources.mjs` (MIRRORS) fijados por commit
// a `$DX_DEVICES_US_RAW_DIR/mirrors/<id>` y escribe `mirrors-manifest.json`
// con el sha256 de cada archivo usado. Sólo lectura git anónima; no ejecuta
// nada del repo espejado.
//
//   node tools/terminology-import/diagnostic-devices/us/fetch-mirrors.mjs [--only <id>]
// =============================================================================

import { execFileSync } from 'node:child_process';
import { existsSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ensureDir, sha256File } from './lib/io.mjs';
import { MIRRORS_DIR } from './lib/paths.mjs';
import { MIRRORS } from './lib/sources.mjs';

const args = process.argv.slice(2);
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;

function git(cwd, ...a) {
  return execFileSync('git', a, { cwd, encoding: 'utf8', env: { ...process.env, GIT_LFS_SKIP_SMUDGE: '1' }, stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

const manifest = [];
for (const m of MIRRORS) {
  if (only && m.id !== only) continue;
  const dir = join(ensureDir(MIRRORS_DIR), m.id);
  if (!existsSync(join(dir, '.git'))) {
    ensureDir(dir);
    git(dir, 'init', '-q');
    git(dir, 'remote', 'add', 'origin', m.repo);
  }
  const head = existsSync(join(dir, '.git')) ? (() => { try { return git(dir, 'rev-parse', 'HEAD'); } catch { return null; } })() : null;
  if (head !== m.commit) {
    console.log(`[${m.id}] git fetch --depth 1 ${m.repo} ${m.commit}`);
    git(dir, 'fetch', '-q', '--depth', '1', 'origin', m.commit);
    git(dir, 'checkout', '-q', '--detach', 'FETCH_HEAD');
  }
  const got = git(dir, 'rev-parse', 'HEAD');
  if (got !== m.commit) throw new Error(`[${m.id}] commit ${got} ≠ fijado ${m.commit}`);
  const files = [];
  for (const f of m.files) {
    const p = join(dir, f);
    if (!existsSync(p)) throw new Error(`[${m.id}] falta ${f} en ${m.commit}`);
    files.push({ path: f, bytes: statSync(p).size, sha256: await sha256File(p) });
  }
  manifest.push({ id: m.id, repo: m.repo, commit: got, commitDate: git(dir, 'log', '-1', '--format=%cI'), files, upstream: m.upstream ?? null });
  console.log(`[${m.id}] OK ${got.slice(0, 12)} · ${files.length} archivos`);
}
writeFileSync(join(MIRRORS_DIR, 'mirrors-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Manifiesto: ${join(MIRRORS_DIR, 'mirrors-manifest.json')}`);
