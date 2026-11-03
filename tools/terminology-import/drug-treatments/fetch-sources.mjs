#!/usr/bin/env node
// =============================================================================
// Tratamientos farmacológicos · etapa 0 (fuentes → caché fuera de git).
//
// Clona cada repositorio de `lib/sources.mjs` EN SU COMMIT FIJADO (fetch por
// sha, sparse: sólo los archivos que se leen) en
// `glossary-data-build/cache/drug-treatments/<repo>@<sha12>/` y escribe
// `manifest.json` con commit, fecha de descarga y SHA-256 de cada archivo.
// Re-ejecutable: si el clon ya está en el commit, no vuelve a bajar y conserva
// la fecha de descarga original.
//
// Uso: node tools/terminology-import/drug-treatments/fetch-sources.mjs
// =============================================================================

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { cacheDir, ensureDir, nowIso, sha256File, writeJson } from '../lib/glossary-es/common.mjs';
import { CROSSWALKS, SOURCES, cloneDirName } from './lib/sources.mjs';

export const CACHE = cacheDir('drug-treatments');
export const MANIFEST = join(CACHE, 'manifest.json');

const git = (cwd, ...args) => execFileSync('git', args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim();

function headOf(dir) {
  try {
    return git(dir, 'rev-parse', 'HEAD');
  } catch {
    return null;
  }
}

function cloneAt(def, dir, paths) {
  if (existsSync(join(dir, '.git')) && headOf(dir) === def.commit) {
    git(dir, 'sparse-checkout', 'set', '--no-cone', ...paths);
    return false;
  }
  ensureDir(dir);
  if (!existsSync(join(dir, '.git'))) {
    git(dir, 'init', '-q');
    git(dir, 'remote', 'add', 'origin', def.repo);
  }
  git(dir, 'sparse-checkout', 'set', '--no-cone', ...paths);
  git(dir, 'fetch', '-q', '--depth', '1', '--filter=blob:none', 'origin', def.commit);
  git(dir, 'checkout', '-q', def.commit);
  const head = headOf(dir);
  if (head !== def.commit) throw new Error(`${def.repo}: HEAD ${head} ≠ commit fijado ${def.commit}`);
  return true;
}

async function main() {
  const previous = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : { entries: {} };
  const all = { ...SOURCES, ...CROSSWALKS };
  // Las fuentes que comparten repo y commit comparten clon: se juntan sus archivos.
  const byDir = new Map();
  for (const [key, def] of Object.entries(all)) {
    const dirName = cloneDirName(key);
    const entry = byDir.get(dirName) ?? { def, keys: [], paths: new Set() };
    entry.keys.push(key);
    for (const p of def.sparse ?? Object.values(def.files)) entry.paths.add(p);
    byDir.set(dirName, entry);
  }

  const entries = {};
  for (const [dirName, { def, keys, paths }] of byDir) {
    const dir = join(CACHE, dirName);
    const fetched = cloneAt(def, dir, [...paths]);
    const prev = previous.entries?.[dirName];
    const retrievedAt = !fetched && prev?.commit === def.commit ? prev.retrievedAt : nowIso();
    const committedAt = git(dir, 'show', '-s', '--format=%cI', def.commit);
    const files = {};
    for (const p of paths) {
      const abs = join(dir, p);
      if (!existsSync(abs)) throw new Error(`${def.repo}@${def.commit}: falta ${p}`);
      files[p] = { sha256: sha256File(abs), bytes: statSync(abs).size };
    }
    entries[dirName] = { repo: def.repo, commit: def.commit, committedAt, retrievedAt, sources: keys, files };
    console.log(`[fetch] ${dirName} ${fetched ? 'clonado' : 'ya estaba'} · ${Object.keys(files).length} archivos`);
  }
  writeJson(MANIFEST, { generatedAt: nowIso(), cache: CACHE, entries }, true);
  console.log(`Manifiesto: ${MANIFEST}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error('ERROR FATAL en fetch-sources:', err);
    process.exitCode = 1;
  });
}
