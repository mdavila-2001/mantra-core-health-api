#!/usr/bin/env node
// =============================================================================
// Etapa 1b (red: solo GitHub): clona cada réplica de lib/mirrors.mjs en su
// commit fijado, con checkout disperso de las rutas que se usan, a
// ../diagnostic-devices-data/eu/cache/mirrors/<id>/ (fuera de git), y anota en
// cache/mirrors/manifest.json el sha256 de cada archivo de datos.
//
//   node tools/terminology-import/diagnostic-devices/eu/fetch-mirrors.mjs
// =============================================================================

import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import {
  cacheDir,
  ensureDir,
  nowIso,
  sha256File,
  writeJson,
} from './lib/common.mjs';
import { MIRRORS } from './lib/mirrors.mjs';

const git = (args, cwd) =>
  execFileSync('git', args, {
    cwd,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, GIT_LFS_SKIP_SMUDGE: '1' },
    maxBuffer: 1 << 28,
  })
    .toString()
    .trim();

function listFiles(path) {
  if (!existsSync(path)) return [];
  if (statSync(path).isFile()) return [path];
  return readdirSync(path)
    .sort()
    .flatMap((f) => listFiles(join(path, f)));
}

const manifest = { generatedAt: nowIso(), mirrors: [] };
for (const m of MIRRORS) {
  const dir = cacheDir('mirrors', m.id);
  try {
    if (!existsSync(join(dir, '.git'))) {
      ensureDir(dir);
      git(['init', '-q'], dir);
      git(['remote', 'add', 'origin', m.repo], dir);
    }
    git(['config', 'core.sparseCheckout', 'true'], dir);
    git(['sparse-checkout', 'set', '--no-cone', ...m.paths], dir);
    git(
      ['fetch', '-q', '--depth', '1', '--filter=blob:none', 'origin', m.commit],
      dir,
    );
    git(['checkout', '-q', '--detach', m.commit], dir);
    const head = git(['rev-parse', 'HEAD'], dir);
    if (head !== m.commit)
      throw new Error(`HEAD ${head} ≠ commit fijado ${m.commit}`);
    const files = listFiles(join(dir, m.data)).map((f) => ({
      path: f.slice(dir.length + 1),
      bytes: statSync(f).size,
      sha256: sha256File(f),
    }));
    const treeSha =
      files.length === 1
        ? files[0].sha256
        : // Carpeta: sha256 de la lista ordenada «ruta sha256».
          (await import('node:crypto'))
            .createHash('sha256')
            .update(files.map((f) => `${f.path} ${f.sha256}`).join('\n'))
            .digest('hex');
    manifest.mirrors.push({
      id: m.id,
      repo: m.repo,
      commit: m.commit,
      dir,
      data: m.data,
      files: files.length,
      bytes: files.reduce((n, f) => n + f.bytes, 0),
      sha256: treeSha,
      retrievedAt: nowIso(),
    });
    console.log(
      `${m.id}: ${files.length} archivos @ ${m.commit.slice(0, 8)} (sha256 ${treeSha.slice(0, 12)})`,
    );
  } catch (err) {
    manifest.mirrors.push({
      id: m.id,
      repo: m.repo,
      commit: m.commit,
      error: String(err.message ?? err),
    });
    console.warn(`[hueco] ${m.id}: ${err.message ?? err}`);
  }
}
writeJson(cacheDir('mirrors', 'manifest.json'), manifest);
console.log(`Manifiesto: ${cacheDir('mirrors', 'manifest.json')}`);
