#!/usr/bin/env node
// =============================================================================
// Catálogo de alergias · etapa 0 (descarga reproducible, con red).
//
// Baja cada artefacto de `lib/sources.mjs` a `glossary-data-build/allergy-sources/`
// (FUERA de git) y escribe `manifest.json` con, por artefacto: URL exacta,
// versión o commit, SHA-256, bytes, fecha de descarga y licencia.
//
//  - npm:    `npm pack <paquete@versión>` (registro npm) y se extrae `package/`.
//  - github: se resuelve el commit de la rama con `git ls-remote` y se baja el
//            archivo crudo DE ESE COMMIT (raw.githubusercontent.com/<repo>/<sha>/<path>),
//            de modo que la URL guardada sigue apuntando al mismo contenido.
//
// Usa `npm`, `git` y `curl` del sistema (respetan HTTPS_PROXY); no hace scraping
// ni elude controles de acceso. Si un artefacto falla, se anota y se sigue.
//
// Uso: node tools/terminology-import/allergies/fetch-allergy-sources.mjs [--only vsac,hpo]
// =============================================================================

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { nowIso, sha256File } from '../lib/glossary-es/common.mjs';
import { ARTIFACTS, SOURCES_DIR } from './lib/sources.mjs';

const args = process.argv.slice(2);
const only = args.includes('--only') ? new Set(args[args.indexOf('--only') + 1].split(',')) : null;

function run(cmd, argv, cwd) {
  return execFileSync(cmd, argv, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024 }).trim();
}

function fetchNpm(artifact) {
  const dir = join(SOURCES_DIR, 'npm', artifact.key);
  mkdirSync(dir, { recursive: true });
  const tarball = run('npm', ['pack', artifact.spec, '--silent'], dir).split('\n').at(-1);
  const tarPath = join(dir, tarball);
  run('tar', ['xzf', tarball], dir);
  const [name, version] = [artifact.spec.slice(0, artifact.spec.lastIndexOf('@')), artifact.spec.slice(artifact.spec.lastIndexOf('@') + 1)];
  return {
    url: `https://registry.npmjs.org/${name}/-/${name}-${version}.tgz`,
    version,
    file: tarPath,
    extractedTo: join(dir, 'package'),
    sha256: sha256File(tarPath),
    bytes: statSync(tarPath).size,
  };
}

function fetchGithub(artifact) {
  const dir = join(SOURCES_DIR, 'github', artifact.key);
  mkdirSync(dir, { recursive: true });
  const line = run('git', ['ls-remote', `https://github.com/${artifact.repo}`, `refs/heads/${artifact.ref}`]);
  const sha = line.split(/\s+/)[0];
  if (!/^[0-9a-f]{40}$/.test(sha)) throw new Error(`No se resolvió el commit de ${artifact.repo}@${artifact.ref}: «${line}»`);
  const url = `https://raw.githubusercontent.com/${artifact.repo}/${sha}/${artifact.path}`;
  const file = join(dir, artifact.path.split('/').at(-1));
  run('curl', ['-sSfL', '--retry', '4', '--retry-delay', '2', '-o', file, url]);
  return { url, version: sha, file, sha256: sha256File(file), bytes: statSync(file).size };
}

const manifestPath = join(SOURCES_DIR, 'manifest.json');
const previous = existsSync(manifestPath) ? JSON.parse((await import('node:fs')).readFileSync(manifestPath, 'utf8')) : { artifacts: {} };
const manifest = { generatedAt: nowIso(), artifacts: { ...previous.artifacts }, failures: [] };

for (const artifact of ARTIFACTS) {
  if (only && !only.has(artifact.key)) continue;
  const retrievedAt = nowIso();
  try {
    const got = artifact.kind === 'npm' ? fetchNpm(artifact) : fetchGithub(artifact);
    manifest.artifacts[artifact.key] = {
      key: artifact.key,
      kind: artifact.kind,
      spec: artifact.spec ?? `${artifact.repo}/${artifact.path}`,
      owner: artifact.owner,
      license: artifact.license,
      licenseEvidence: artifact.licenseEvidence,
      retrievedAt,
      ...got,
    };
    console.log(`[ok] ${artifact.key} ${got.version} ${got.bytes} B ${got.sha256.slice(0, 12)}`);
  } catch (err) {
    manifest.failures.push({ key: artifact.key, retrievedAt, error: String(err.stderr || err.message).slice(0, 500) });
    console.error(`[falla] ${artifact.key}: ${String(err.stderr || err.message).slice(0, 200)}`);
  }
}

writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log(`manifest → ${manifestPath} (${Object.keys(manifest.artifacts).length} artefactos; ${manifest.failures.length} fallas)`);
if (readdirSync(SOURCES_DIR).length === 0) process.exitCode = 1;
