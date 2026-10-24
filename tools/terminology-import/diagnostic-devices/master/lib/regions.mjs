// =============================================================================
// Salidas de las regiones hermanas (us, eu, row), leídas desde git sin hacer
// checkout: `git ls-tree` + `git show <ref>:<path>`.
//
// Busca primero la rama acordada (`origin/justin/seed-dx-devices-<región>`) y,
// si no existe, cualquier rama remota que tenga
// `tools/terminology-import/diagnostic-devices/<región>/out/manifest.json`
// (las sesiones en la nube a veces empujan a `claude/<nombre>`); se queda con
// la de commit más reciente. Con `--dir` se puede apuntar a una carpeta local.
// =============================================================================

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { parseNdjsonGzBuffer } from './exchange.mjs';

export const REGIONS = Object.freeze(['us', 'eu', 'row']);
export const REGION_BRANCH = (region) => `justin/seed-dx-devices-${region}`;
export const REGION_OUT = (region) =>
  `tools/terminology-import/diagnostic-devices/${region}/out`;

const git = (args, cwd) =>
  execFileSync('git', args, {
    cwd,
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 2 ** 31,
  });
const tryGit = (args, cwd) => {
  try {
    return git(args, cwd);
  } catch {
    return null;
  }
};

/**
 * Dónde está la salida de una región. Devuelve
 * `{ region, kind: 'git', ref, commit, commitDate }`, `{ region, kind: 'dir', dir }`
 * o `{ region, kind: 'missing' }`.
 */
export function locateRegion(region, { repoDir, dirOverride } = {}) {
  if (dirOverride)
    return existsSync(join(dirOverride, 'manifest.json'))
      ? { region, kind: 'dir', dir: dirOverride }
      : {
          region,
          kind: 'missing',
          reason: `sin manifest.json en ${dirOverride}`,
        };
  const manifestPath = `${REGION_OUT(region)}/manifest.json`;
  const candidates = [];
  const preferred = `origin/${REGION_BRANCH(region)}`;
  const refs =
    tryGit(
      ['for-each-ref', '--format=%(refname:short)', 'refs/remotes/origin'],
      repoDir,
    )
      ?.toString()
      .trim()
      .split('\n')
      .filter(Boolean) ?? [];
  for (const ref of refs) {
    if (ref.endsWith('/HEAD')) continue;
    if (!tryGit(['cat-file', '-e', `${ref}:${manifestPath}`], repoDir))
      continue;
    const [commit, commitDate] = git(
      ['log', '-1', '--format=%H %cI', ref],
      repoDir,
    )
      .toString()
      .trim()
      .split(' ');
    candidates.push({ ref, commit, commitDate, preferred: ref === preferred });
  }
  if (!candidates.length)
    return {
      region,
      kind: 'missing',
      reason: `ninguna rama remota tiene ${manifestPath}`,
    };
  candidates.sort(
    (a, b) =>
      Number(b.preferred) - Number(a.preferred) ||
      b.commitDate.localeCompare(a.commitDate),
  );
  return {
    region,
    kind: 'git',
    ...candidates[0],
    alternatives: candidates.slice(1).map((c) => c.ref),
  };
}

/** Lee el manifest de una región ya ubicada. */
export function readRegionManifest(loc, { repoDir } = {}) {
  const text =
    loc.kind === 'git'
      ? git(
          ['show', `${loc.commit}:${REGION_OUT(loc.region)}/manifest.json`],
          repoDir,
        ).toString('utf8')
      : readFileSync(join(loc.dir, 'manifest.json'), 'utf8');
  return JSON.parse(text);
}

/**
 * Filas de una región, archivo por archivo, verificando el sha256 del
 * manifest. Llama `onFile({ path, rows, sha256, ok })` por archivo.
 */
export function* readRegionRows(loc, manifest, { repoDir, onFile } = {}) {
  for (const f of manifest.files ?? []) {
    const buf =
      loc.kind === 'git'
        ? git(
            ['show', `${loc.commit}:${REGION_OUT(loc.region)}/${f.path}`],
            repoDir,
          )
        : readFileSync(join(loc.dir, f.path));
    const sha = createHash('sha256').update(buf).digest('hex');
    const ok = !f.sha256 || f.sha256 === sha;
    onFile?.({ path: f.path, declaredRows: f.rows ?? null, sha256: sha, ok });
    if (!ok) continue;
    yield* parseNdjsonGzBuffer(buf, `${loc.region}/${f.path}`);
  }
}
