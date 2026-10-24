#!/usr/bin/env node
// =============================================================================
// Baja los espejos públicos de `lib/sources.mjs` (MIRRORS) fijados por commit
// a `$DX_DEVICES_US_RAW_DIR/mirrors/<id>` y escribe `mirrors-manifest.json`
// con el sha256 de cada archivo usado. Sólo lectura git anónima; no ejecuta
// nada del repo espejado.
//
//   node tools/terminology-import/diagnostic-devices/us/fetch-mirrors.mjs [--only <id>]
//
// Los .rda (R) se convierten a NDJSON con `lib/rda_to_ndjson.py`; requiere un
// Python con `rdata` (`DX_PYTHON=/ruta/a/venv/bin/python`). Los .xlsx/.xlsm, con
// `lib/xlsx_to_ndjson.py` (`openpyxl`).
// =============================================================================

import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ensureDir, sha256File } from './lib/io.mjs';
import { MIRRORS_DIR } from './lib/paths.mjs';
import { MIRRORS } from './lib/sources.mjs';

const args = process.argv.slice(2);
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;

function git(cwd, ...a) {
  return execFileSync('git', a, { cwd, encoding: 'utf8', env: { ...process.env, GIT_LFS_SKIP_SMUDGE: '1' }, stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

const manifestPath = join(MIRRORS_DIR, 'mirrors-manifest.json');
const manifest = (only && existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : []).filter((x) => x.id !== only);
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
    // Sólo los archivos usados (clon parcial + sparse checkout): algunos repos pesan GB.
    git(dir, 'sparse-checkout', 'set', '--no-cone', ...m.files.map((f) => `/${f}`));
    git(dir, 'fetch', '-q', '--depth', '1', '--filter=blob:none', 'origin', m.commit);
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
  // Conversión de formatos que Node no lee (R .rda) a NDJSON, con Python.
  for (const c of m.convert ?? []) {
    const out = join(dir, '.converted', c.out);
    ensureDir(join(dir, '.converted'));
    const py = process.env.DX_PYTHON ?? 'python3';
    const [script, src, obj] = c.rda ? ['rda_to_ndjson.py', c.rda, c.object] : c.parquet ? ['parquet_to_ndjson.py', c.parquet, c.columns ?? '*'] : ['xlsx_to_ndjson.py', c.xlsx, c.sheet];
    console.log(execFileSync(py, ['-I', fileURLToPath(new URL(`./lib/${script}`, import.meta.url)), join(dir, src), obj, out], { encoding: 'utf8' }).trim());
    files.push({ path: `.converted/${c.out}`, derivedFrom: src, bytes: statSync(out).size, sha256: await sha256File(out) });
  }
  manifest.push({ id: m.id, repo: m.repo, commit: got, commitDate: git(dir, 'log', '-1', '--format=%cI'), files, upstream: m.upstream ?? null });
  console.log(`[${m.id}] OK ${got.slice(0, 12)} · ${files.length} archivos`);
}
writeFileSync(manifestPath, `${JSON.stringify(manifest.sort((a, b) => a.id.localeCompare(b.id)), null, 2)}\n`);
console.log(`Manifiesto: ${join(MIRRORS_DIR, 'mirrors-manifest.json')}`);
