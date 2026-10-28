#!/usr/bin/env node
// =============================================================================
// Catálogo de análisis · etapa 0-bis (descarga de las fuentes ABIERTAS por HTTP).
//
// Complementa a fetch-lab-tests-sources.mjs (que baja los paquetes npm). Acá se
// bajan, directamente del editor, los archivos de las fuentes con `obtain: 'http'`
// de lib/sources.mjs. Destino (FUERA de git):
//   <GLOSSARY_BUILD_DIR>/lab-tests-sources/<dir>/<archivo>
// y se anota en `lab-tests-sources/open-sources-manifest.json` por archivo: URL
// final, tamaño, SHA-256, Last-Modified, ETag y fecha de descarga.
//
// Buena ciudadanía: User-Agent identificable, un pedido a la vez, ≥ 600 ms entre
// pedidos al mismo host, reintentos con espera creciente y reanudación (`-C -`).
// Idempotente: un archivo que ya está no se vuelve a bajar (salvo `--refresh`).
// Sin cuentas, sin tokens y sin eludir nada: si un host exige cuenta o responde
// 403/401, el archivo queda como hueco con el código HTTP exacto.
//
// Uso: node tools/terminology-import/lab-tests/fetch-open-sources.mjs [clave …] [--refresh]
// =============================================================================

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, renameSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { BUILD_DIR, ensureDir, nowIso, sha256File, sleep, writeJson } from '../lib/glossary-es/common.mjs';
import { SOURCES } from './lib/sources.mjs';

export const OPEN_UA = 'mantra-core-health-terminology-import/1.0 (+contacto: pabliarca@gmail.com)';
const ROOT = ensureDir(join(BUILD_DIR, 'lab-tests-sources'));
export const OPEN_MANIFEST = join(ROOT, 'open-sources-manifest.json');
const MIN_GAP_MS = 600;

function parseHeaders(path) {
  // curl -D escribe un bloque por redirección; interesa el último.
  const blocks = readFileSync(path, 'utf8').split(/\r?\n\r?\n/).filter((b) => /^HTTP\//.test(b.trim()));
  const last = blocks.at(-1) ?? '';
  const h = {};
  for (const line of last.split(/\r?\n/).slice(1)) {
    const i = line.indexOf(':');
    if (i > 0) h[line.slice(0, i).trim().toLowerCase()] = line.slice(i + 1).trim();
  }
  return { status: Number(last.match(/^HTTP\/[\d.]+ (\d+)/)?.[1] ?? 0), headers: h };
}

/** Descarga una URL a `dest` con reintentos; devuelve metadatos o lanza con el código HTTP exacto. */
export function download(url, dest, { extraArgs = [] } = {}) {
  const part = `${dest}.part`;
  const hdr = `${dest}.headers`;
  const args = ['-sS', '-L', '--fail', '--retry', '5', '--retry-delay', '4', '--retry-all-errors', '--connect-timeout', '30', '--max-time', '1800', '-A', OPEN_UA, '-D', hdr, '-C', '-', '-o', part, ...extraArgs, url];
  try {
    execFileSync('curl', args, { stdio: ['ignore', 'inherit', 'pipe'], encoding: 'utf8' });
  } catch (err) {
    const info = existsSync(hdr) ? parseHeaders(hdr) : { status: 0 };
    const e = new Error(`${url}: curl salió con ${err.status} (HTTP ${info.status}) ${String(err.stderr ?? '').trim().slice(0, 200)}`);
    e.httpStatus = info.status;
    throw e;
  }
  const info = parseHeaders(hdr);
  renameSync(part, dest);
  rmSync(hdr, { force: true });
  return { httpStatus: info.status, lastModified: info.headers['last-modified'] ?? null, etag: info.headers.etag ?? null };
}

async function main() {
  const args = process.argv.slice(2);
  const refresh = args.includes('--refresh');
  const only = args.filter((a) => !a.startsWith('--'));
  const manifest = existsSync(OPEN_MANIFEST) ? JSON.parse(readFileSync(OPEN_MANIFEST, 'utf8')) : {};
  let last = 0;
  for (const [key, src] of Object.entries(SOURCES)) {
    if (src.obtain !== 'http' || (only.length && !only.includes(key))) continue;
    if (src.shareAlike && !only.includes(key)) {
      console.log(`[${key}] CC BY-SA (compartir igual): no se baja salvo que se nombre (decisión del propietario).`);
      continue;
    }
    const dir = ensureDir(join(ROOT, src.dir));
    manifest[key] ??= { files: {} };
    for (const f of src.files) {
      const dest = join(dir, f.name);
      if (existsSync(dest) && manifest[key].files[f.name] && !refresh) {
        console.log(`[${key}] ${f.name}: ya está (sha256 ${manifest[key].files[f.name].sha256.slice(0, 12)}…)`);
        continue;
      }
      const wait = MIN_GAP_MS - (Date.now() - last);
      if (wait > 0) await sleep(wait);
      last = Date.now();
      if (refresh) rmSync(dest, { force: true });
      try {
        const meta = download(f.url, dest, { extraArgs: f.curlArgs ?? [] });
        manifest[key].files[f.name] = { url: f.url, bytes: statSync(dest).size, sha256: sha256File(dest), retrievedAt: nowIso(), ...meta };
        console.log(`[${key}] ${f.name}: ${manifest[key].files[f.name].bytes} B, sha256 ${manifest[key].files[f.name].sha256.slice(0, 12)}…, Last-Modified ${meta.lastModified}`);
      } catch (err) {
        manifest[key].files[f.name] = { url: f.url, error: err.message, httpStatus: err.httpStatus ?? null, attemptedAt: nowIso() };
        console.error(`[${key}] ${f.name}: HUECO — ${err.message}`);
      }
    }
  }
  writeJson(OPEN_MANIFEST, manifest, true);
  console.log(`Manifiesto: ${OPEN_MANIFEST}`);
}

if (process.argv[1] && new URL(import.meta.url).pathname === process.argv[1]) main();
