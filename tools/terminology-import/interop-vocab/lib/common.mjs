// =============================================================================
// Piezas comunes del importador de vocabularios de interoperabilidad abiertos.
// Transporte (descarga en streaming con reintentos y SHA-256), rutas y empaquetado
// determinista. Nada de acá decide contenido clínico.
// =============================================================================

import { createHash } from 'node:crypto';
import { createReadStream, createWriteStream, existsSync, mkdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { md5uuid } from '../../lib/glossary-es/load-plan.mjs';

export { md5uuid };

const HERE = dirname(fileURLToPath(import.meta.url));
export const DOMAIN_DIR = resolve(HERE, '..');
export const DATA_DIR = join(DOMAIN_DIR, 'data');
export const BUILD_DIR = process.env.GLOSSARY_BUILD_DIR ?? resolve(DOMAIN_DIR, '../../../../glossary-data-build');
export const RAW_DIR = join(BUILD_DIR, 'raw');
export const NDJSON_DIR = join(BUILD_DIR, 'ndjson');
export const USER_AGENT = 'mantra-core-health-terminology-import/1.0 (interop-vocab; pabliarca@gmail.com)';

export const ensureDir = (p) => (mkdirSync(p, { recursive: true }), p);
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const nowIso = () => new Date().toISOString();
export const sha256Buf = (b) => createHash('sha256').update(b).digest('hex');
export function sha256File(path) {
  return new Promise((res, rej) => {
    const h = createHash('sha256');
    createReadStream(path).on('data', (d) => h.update(d)).on('error', rej).on('end', () => res(h.digest('hex')));
  });
}

const lastHit = new Map(); // host → timestamp (≤ 2 pedidos/s por host)

/**
 * Descarga `url` a `dest` en streaming (a un `.part` y renombra), con reintentos exponenciales
 * ante red caída, 429 y 5xx. Devuelve { status, bytes, sha256, headers }.
 * Un cero por error de red NO es un resultado: tras agotar los reintentos lanza.
 */
export async function download(url, dest, { headers = {}, maxRetries = 5, minDelayMs = 600 } = {}) {
  ensureDir(dirname(dest));
  const host = new URL(url).host;
  for (let attempt = 1; ; attempt++) {
    const wait = (lastHit.get(host) ?? 0) + minDelayMs - Date.now();
    if (wait > 0) await sleep(wait);
    lastHit.set(host, Date.now());
    let res;
    try {
      res = await fetch(url, { headers: { 'User-Agent': USER_AGENT, ...headers }, redirect: 'follow' });
    } catch (err) {
      if (attempt > maxRetries) throw new Error(`Red: ${url}: ${err.message}`);
      await sleep(500 * 2 ** attempt);
      continue;
    }
    if (res.status === 429 || res.status >= 500) {
      if (attempt > maxRetries) throw new Error(`HTTP ${res.status} tras ${maxRetries} reintentos: ${url}`);
      const ra = Number(res.headers.get('retry-after'));
      await sleep(Number.isFinite(ra) && ra > 0 ? ra * 1000 : 500 * 2 ** attempt);
      continue;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
    const part = `${dest}.part`;
    await pipeline(Readable.fromWeb(res.body), createWriteStream(part));
    renameSync(part, dest);
    return { status: res.status, bytes: statSync(dest).size, sha256: await sha256File(dest), headers: Object.fromEntries(res.headers) };
  }
}

export function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}
export function writeJson(path, value, pretty = false) {
  ensureDir(dirname(path));
  writeFileSync(path, pretty ? JSON.stringify(value, null, 2) + '\n' : JSON.stringify(value));
}
export function rmrf(path) {
  if (existsSync(path)) rmSync(path, { recursive: true, force: true });
}

/** Orden canónico de claves (build reproducible: mismo contenido → mismos bytes). */
export function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map((k) => [k, canonical(value[k])]));
  return value;
}
export const line = (obj) => JSON.stringify(obj) + '\n';

/** Atajo: objeto sin claves nulas/vacías (lo que la fuente no trae no se escribe). */
export function compact(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v != null && v !== '' && !(Array.isArray(v) && v.length === 0)));
}
