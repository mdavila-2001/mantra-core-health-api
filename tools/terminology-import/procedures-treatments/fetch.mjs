#!/usr/bin/env node
// =============================================================================
// Etapa 1 (descarga): baja las fuentes alcanzables a la caché fuera de git y
// deja, por fuente, un `meta.json` con URL fijada (commit o tag), sha256,
// tamaño, versión declarada por el archivo y fecha de descarga.
//
// Además sondea los hosts de las fuentes bloqueadas (`BLOCKED_SOURCES`) y
// escribe `cache/_network.json`: así cada pasada del protocolo de saturación
// registra si la política de red cambió. No elude bloqueos ni usa espejos.
//
// Usa `curl` (respeta HTTPS_PROXY y la CA del entorno) y `git ls-remote`.
//
// Uso:
//   node tools/terminology-import/procedures-treatments/fetch.mjs            # todas las alcanzables + sondeo
//   node tools/terminology-import/procedures-treatments/fetch.mjs maxo mondo # solo esas
//   node tools/terminology-import/procedures-treatments/fetch.mjs --probe    # solo sondeo de red
// =============================================================================

import { execFileSync } from 'node:child_process';
import { statSync } from 'node:fs';
import { join } from 'node:path';
import {
  cacheDir,
  ensureDir,
  nowIso,
  sha256File,
  writeJson,
} from './lib/common.mjs';
import { BLOCKED_SOURCES, GITHUB_SOURCES } from './lib/sources.mjs';

const args = process.argv.slice(2);
const probeOnly = args.includes('--probe');
const wanted = args.filter((a) => !a.startsWith('--'));

function curl(argv) {
  return execFileSync(
    'curl',
    ['-sS', '--retry', '3', '--max-time', '1800', ...argv],
    { encoding: 'utf8', maxBuffer: 1 << 20, stdio: ['ignore', 'pipe', 'pipe'] },
  );
}

function headCommit(repo) {
  const out = execFileSync(
    'git',
    ['ls-remote', `https://github.com/${repo}`, 'HEAD'],
    { encoding: 'utf8' },
  );
  const sha = out.split(/\s+/)[0];
  if (!/^[0-9a-f]{40}$/.test(sha))
    throw new Error(`No se pudo leer el commit HEAD de ${repo}`);
  return sha;
}

/** Tag de la última release: GitHub responde 302 a `releases/download/<tag>/<asset>`. */
function latestReleaseUrl(repo, asset) {
  const loc = curl([
    '-o',
    '/dev/null',
    '-w',
    '%{redirect_url}',
    `https://github.com/${repo}/releases/latest/download/${asset}`,
  ]).trim();
  const m = loc.match(
    new RegExp(`/${repo.replace('/', '\\/')}/releases/download/([^/]+)/`),
  );
  if (!m)
    throw new Error(
      `No se pudo resolver la última release de ${repo}/${asset} (redirect: ${loc || 'vacío'})`,
    );
  return {
    tag: decodeURIComponent(m[1]),
    url: `https://github.com/${repo}/releases/download/${m[1]}/${asset}`,
  };
}

function fetchSource(key, spec) {
  const dir = ensureDir(cacheDir(key));
  const retrievedAt = nowIso();
  const files = {};
  let pin;
  if (spec.kind === 'github-raw') {
    const sha = headCommit(spec.repo);
    pin = { commit: sha };
    for (const [name, path] of Object.entries(spec.files)) {
      const url = `https://raw.githubusercontent.com/${spec.repo}/${sha}/${path}`;
      const dest = join(dir, name);
      curl(['--fail', '-o', dest, url]);
      files[name] = {
        url,
        fileUrl: `https://github.com/${spec.repo}/blob/${sha}/${path}`,
        sha256: sha256File(dest),
        bytes: statSync(dest).size,
      };
    }
  } else if (spec.kind === 'github-release') {
    for (const [name, asset] of Object.entries(spec.files)) {
      const { tag, url } = latestReleaseUrl(spec.repo, asset);
      pin = { tag };
      const dest = join(dir, name);
      curl(['--fail', '-L', '-o', dest, url]);
      files[name] = {
        url,
        fileUrl: url,
        sha256: sha256File(dest),
        bytes: statSync(dest).size,
      };
    }
  } else {
    throw new Error(`Tipo de fuente desconocido: ${spec.kind}`);
  }
  const meta = {
    source: key,
    name: spec.name,
    publisher: spec.publisher,
    license: spec.license,
    licenseUrl: spec.licenseUrl,
    homepage: spec.homepage,
    retrievedAt,
    ...pin,
    files,
  };
  writeJson(join(dir, 'meta.json'), meta);
  console.log(
    `[fetch] ${key}: ${Object.entries(files)
      .map(([n, f]) => `${n} ${f.bytes} B sha256=${f.sha256.slice(0, 12)}…`)
      .join(', ')} (${pin.commit ?? pin.tag})`,
  );
  return meta;
}

function probe() {
  const result = { probedAt: nowIso(), hosts: {} };
  for (const [key, spec] of Object.entries(BLOCKED_SOURCES)) {
    for (const host of spec.hosts) {
      let status;
      try {
        status = curl([
          '-o',
          '/dev/null',
          '-w',
          '%{http_code}',
          '--max-time',
          '25',
          `https://${host}/`,
        ]).trim();
      } catch (err) {
        status = `error: ${String(err.stderr ?? err.message)
          .trim()
          .split('\n')
          .pop()}`;
      }
      result.hosts[host] = { source: key, status };
      console.log(`[probe] ${host} (${key}): ${status}`);
    }
  }
  writeJson(cacheDir('_network.json'), result);
  return result;
}

if (!probeOnly) {
  const keys = wanted.length ? wanted : Object.keys(GITHUB_SOURCES);
  for (const key of keys) {
    const spec = GITHUB_SOURCES[key];
    if (!spec)
      throw new Error(
        `Fuente no registrada o no descargable desde este entorno: ${key}`,
      );
    fetchSource(key, spec);
  }
}
probe();
