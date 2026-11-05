#!/usr/bin/env node
// =============================================================================
// Equipos de diagnóstico · ROW · etapa 0: bajar los espejos fijados.
//
// Clona cada espejo de `sources.mjs` en su commit exacto dentro de
// `$DX_DEVICES_BUILD_DIR/mirrors/` (fuera de git), verifica cada hash fijado y
// prepara lo que la etapa 1 lee sin ejecutar nada del espejo:
//   - `datasets.zip` de Health Canada → `extracted/hc-mdall/*.json` (unzip)
//   - pickles de TGA DAEN → `extracted/tga-daen/reports.jsonl` con un
//     unpickler que rechaza toda clase (`tga-daen-pickles.py`, python -I)
//
// Escribe `retrieved.json` con la fecha de descarga de cada espejo.
// Uso: node tools/terminology-import/diagnostic-devices/row/fetch-mirrors.mjs
// =============================================================================

import { execFileSync } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  BUILD_DIR,
  ROW_DIR,
  ensureDir,
  readJson,
  sha256File,
} from './lib/row.mjs';
import { MIRRORS } from './sources.mjs';

const MIRRORS_DIR = ensureDir(join(BUILD_DIR, 'mirrors'));
const EXTRACTED_DIR = ensureDir(join(BUILD_DIR, 'extracted'));
const RETRIEVED_PATH = join(BUILD_DIR, 'retrieved.json');

const git = (args, cwd) =>
  execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, GIT_LFS_SKIP_SMUDGE: '1' },
  }).trim();

export function mirrorDir(repo) {
  return join(MIRRORS_DIR, repo.replace('/', '__'));
}

function checkout(repo, mirror) {
  const dir = mirrorDir(repo);
  if (
    existsSync(join(dir, '.git')) &&
    git(['rev-parse', 'HEAD'], dir) === mirror.commit
  )
    return { dir, fresh: false };
  if (!existsSync(join(dir, '.git'))) {
    ensureDir(dir);
    git(['init', '-q'], dir);
    git(['remote', 'add', 'origin', mirror.url], dir);
  }
  git(['fetch', '-q', '--depth', '1', 'origin', mirror.commit], dir);
  git(['checkout', '-q', '--detach', mirror.commit], dir);
  return { dir, fresh: true };
}

async function verify(repo, mirror, dir) {
  for (const pin of mirror.pins) {
    const actual =
      pin.kind === 'tree'
        ? git(['rev-parse', `HEAD:${pin.path}`], dir)
        : await sha256File(join(dir, pin.path));
    if (actual !== pin.hash)
      throw new Error(
        `${repo}:${pin.path} ${pin.kind} ${actual} ≠ fijado ${pin.hash}`,
      );
    console.log(`  ${pin.kind} OK  ${pin.path}`);
  }
}

async function main() {
  const retrieved = existsSync(RETRIEVED_PATH) ? readJson(RETRIEVED_PATH) : {};
  for (const [repo, mirror] of Object.entries(MIRRORS)) {
    console.log(`${repo}@${mirror.commit.slice(0, 8)}`);
    const { dir, fresh } = checkout(repo, mirror);
    await verify(repo, mirror, dir);
    if (fresh || retrieved[repo]?.commit !== mirror.commit) {
      retrieved[repo] = {
        commit: mirror.commit,
        retrievedAt: new Date().toISOString(),
      };
    }
  }

  const hcOut = ensureDir(join(EXTRACTED_DIR, 'hc-mdall'));
  execFileSync('unzip', [
    '-o',
    '-q',
    join(mirrorDir('misterrPink1/symmetric'), 'datasets.zip'),
    '-d',
    hcOut,
  ]);
  console.log(`hc-mdall extraído en ${hcOut}`);

  const tgaOut = ensureDir(join(EXTRACTED_DIR, 'tga-daen'));
  execFileSync('python3', [
    '-I',
    join(ROW_DIR, 'tga-daen-pickles.py'),
    join(mirrorDir('tobinsouth/MedicalDeviceNLP'), 'data', 'list_of_reports'),
    join(tgaOut, 'reports.jsonl'),
  ]);
  console.log(`tga-daen convertido en ${join(tgaOut, 'reports.jsonl')}`);

  writeFileSync(RETRIEVED_PATH, JSON.stringify(retrieved, null, 2) + '\n');
  console.log(`retrieved.json → ${RETRIEVED_PATH}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
