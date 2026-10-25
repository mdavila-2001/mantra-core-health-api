#!/usr/bin/env node
// =============================================================================
// Etapa 1 (red): baja las fuentes de enfermería a la carpeta de descargas FUERA
// de git (`glossary-data-build/cache/nursing-care/`, ver `GLOSSARY_BUILD_DIR`).
//
//   - openEHR CKM: clon superficial del espejo oficial (github.com/openEHR/CKM-mirror)
//     en un commit fijo. Sin `--ckm-commit` toma la punta de `master` y la anota.
//   - Arquetipos ISO 13606 del Ministerio de Sanidad (CMDIC): clon superficial de
//     github.com/openEHR/adl-archetypes en un commit fijo (`--adl-archetypes-commit`).
//   - HL7 Terminology (THO): tarball npm `hl7.terminology@<versión>`, verificado
//     contra el `integrity` (sha512) que publica el registro, y descomprimido.
//
// Escribe `sources.meta.json` con commit, fecha, URL, SHA-256 e integridad.
// Reanudable: si el clon o el tarball ya están, sólo verifica y vuelve a anotar.
//
// Uso:
//   node tools/terminology-import/nursing-care/fetch-sources.mjs
//   node tools/terminology-import/nursing-care/fetch-sources.mjs --ckm-commit c3fdc43dcf0e… --adl-archetypes-commit 093c77ea… --tho-version 7.0.1
// =============================================================================

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ensureDir, nowIso, sha256File, writeJson } from '../lib/glossary-es/common.mjs';
import { ADL_ARCHETYPES_REPO_URL } from './lib/msssi.mjs';
import { CKM_REPO_URL, NURSING_CACHE, THO_PACKAGE } from './lib/paths.mjs';

const args = process.argv.slice(2);
const arg = (name, fallback = null) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
const ckmCommit = arg('--ckm-commit');
const adlCommit = arg('--adl-archetypes-commit');
const thoVersion = arg('--tho-version', THO_PACKAGE.version);

const git = (cwd, ...a) => execFileSync('git', a, { cwd, encoding: 'utf8', env: { ...process.env, GIT_LFS_SKIP_SMUDGE: '1' } }).trim();

/** Clon superficial de un repositorio público en un commit fijo (o la punta si no se fija). */
function fetchGit(name, repoUrl, commit) {
  const dir = join(NURSING_CACHE, name);
  if (!existsSync(join(dir, '.git'))) {
    ensureDir(NURSING_CACHE);
    console.log(`[${name}] clonando ${repoUrl} …`);
    execFileSync('git', ['clone', '--depth', '1', repoUrl, dir], { stdio: 'inherit', env: { ...process.env, GIT_LFS_SKIP_SMUDGE: '1' } });
  }
  if (commit && git(dir, 'rev-parse', 'HEAD') !== commit) {
    console.log(`[${name}] fijando el commit ${commit}`);
    git(dir, 'fetch', '--depth', '1', 'origin', commit);
    git(dir, 'checkout', '--detach', commit);
  }
  return {
    repoUrl,
    dir,
    commit: git(dir, 'rev-parse', 'HEAD'),
    commitDate: git(dir, 'log', '-1', '--format=%cI'),
    retrievedAt: nowIso(),
  };
}

async function fetchTho() {
  const metaUrl = `https://registry.npmjs.org/${THO_PACKAGE.name}/${thoVersion}`;
  const res = await fetch(metaUrl);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${metaUrl}`);
  const meta = await res.json();
  const tarballUrl = meta.dist.tarball;
  const integrity = meta.dist.integrity;
  const tgz = join(NURSING_CACHE, `${THO_PACKAGE.name}-${thoVersion}.tgz`);
  if (!existsSync(tgz)) {
    console.log(`[tho] bajando ${tarballUrl}`);
    const r = await fetch(tarballUrl);
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${tarballUrl}`);
    ensureDir(NURSING_CACHE);
    writeFileSync(tgz, Buffer.from(await r.arrayBuffer()));
  }
  const [algo, b64] = integrity.split('-');
  const got = createHash(algo).update(readFileSync(tgz)).digest('base64');
  if (got !== b64) throw new Error(`Integridad del tarball ${tgz} no coincide con ${integrity}`);
  const dir = ensureDir(join(NURSING_CACHE, `${THO_PACKAGE.name}-${thoVersion}`));
  if (!existsSync(join(dir, 'package', 'package.json'))) execFileSync('tar', ['xzf', tgz, '-C', dir]);
  const pkg = JSON.parse(readFileSync(join(dir, 'package', 'package.json'), 'utf8'));
  return {
    packageName: THO_PACKAGE.name,
    packageVersion: thoVersion,
    packageLicense: pkg.license ?? null,
    packageDate: pkg.date ?? null,
    tarballUrl,
    integrity,
    sha256: sha256File(tgz),
    dir: join(dir, 'package'),
    retrievedAt: nowIso(),
  };
}

async function main() {
  const ckm = fetchGit('ckm-mirror', CKM_REPO_URL, ckmCommit);
  const adlArchetypes = fetchGit('adl-archetypes', ADL_ARCHETYPES_REPO_URL, adlCommit);
  const tho = await fetchTho();
  const meta = { generatedAt: nowIso(), ckm, adlArchetypes, tho };
  writeJson(join(NURSING_CACHE, 'sources.meta.json'), meta, true);
  console.log(JSON.stringify(meta, null, 2));
}

main().catch((err) => {
  console.error('ERROR en fetch-sources:', err);
  process.exitCode = 1;
});
