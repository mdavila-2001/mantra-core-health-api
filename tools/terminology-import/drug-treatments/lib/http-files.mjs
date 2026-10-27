// =============================================================================
// Archivos que bajan las fuentes HTTP: descarga con SHA-256 y manifiesto.
//
// Cada archivo que leen los parsers (el descargado tal cual o el extraído de
// él) queda en `cache/drug-treatments-http/<ruta>` y en `manifest.json` con:
//   source      clave de la fuente (lib/open-sources.mjs)
//   url         de dónde salió (o de qué descargas, si es un extracto)
//   retrievedAt fecha de descarga (ISO)
//   sha256      del archivo guardado
//   bytes
//   etag / lastModified   si el servidor los da
//   derivedFrom [{ url, sha256, bytes }]  si el archivo es un extracto de otro
//   note        cómo se extrajo
// =============================================================================

import { createHash } from 'node:crypto';
import { createReadStream, createWriteStream, existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';

import { USER_AGENT, cacheDir, ensureDir, nowIso, sha256File, writeJson } from '../../lib/glossary-es/common.mjs';

export const HTTP_CACHE = cacheDir('drug-treatments-http');
export const HTTP_MANIFEST = join(HTTP_CACHE, 'manifest.json');

export function readManifest() {
  return existsSync(HTTP_MANIFEST) ? JSON.parse(readFileSync(HTTP_MANIFEST, 'utf8')) : { generatedAt: null, cache: HTTP_CACHE, files: {} };
}

const touched = new Set();

/** Escribe el manifiesto fusionando con el del disco: solo pisa las rutas que ESTE proceso registró. */
export function writeManifest(manifest) {
  const disk = readManifest();
  for (const rel of touched) disk.files[rel] = manifest.files[rel];
  manifest.files = disk.files;
  manifest.generatedAt = nowIso();
  manifest.cache = HTTP_CACHE;
  const sorted = Object.fromEntries(Object.entries(manifest.files).sort(([a], [b]) => a.localeCompare(b)));
  writeJson(HTTP_MANIFEST, { ...manifest, files: sorted }, true);
}

export const pathOf = (rel) => join(HTTP_CACHE, rel);

/** Registra un archivo ya guardado en `cache/drug-treatments-http/<rel>`. */
export function record(manifest, rel, meta) {
  const abs = pathOf(rel);
  touched.add(rel);
  manifest.files[rel] = {
    ...meta,
    retrievedAt: meta.retrievedAt ?? nowIso(),
    sha256: sha256File(abs),
    bytes: statSync(abs).size,
  };
  return manifest.files[rel];
}

/** Descarga `url` a `dest` por streaming, devuelve SHA-256 y cabeceras útiles. Reintenta ante 429/5xx/red. */
export async function downloadToFile(url, dest, { headers = {}, retries = 5 } = {}) {
  ensureDir(dirname(dest));
  for (let attempt = 1; ; attempt++) {
    let res;
    try {
      res = await fetch(url, { headers: { 'User-Agent': USER_AGENT, ...headers } });
    } catch (err) {
      if (attempt > retries) throw new Error(`Red: ${url}: ${err.message}`);
      await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
      continue;
    }
    if (res.status === 429 || res.status >= 500) {
      if (attempt > retries) throw new Error(`HTTP ${res.status} tras ${retries} reintentos: ${url}`);
      const ra = Number(res.headers.get('retry-after'));
      await new Promise((r) => setTimeout(r, Number.isFinite(ra) && ra > 0 ? ra * 1000 : 1000 * 2 ** attempt));
      continue;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
    const hash = createHash('sha256');
    const out = createWriteStream(dest);
    const body = Readable.fromWeb(res.body);
    body.on('data', (chunk) => hash.update(chunk));
    await pipeline(body, out);
    return { sha256: hash.digest('hex'), bytes: statSync(dest).size, etag: res.headers.get('etag'), lastModified: res.headers.get('last-modified'), contentType: res.headers.get('content-type') };
  }
}

/** Lee un archivo de la caché HTTP junto con su procedencia, lista para `makeAssertion`. */
export function httpFile(manifest, def, fileKey) {
  const rel = def.files[fileKey];
  const entry = manifest.files[rel];
  if (!entry) throw new Error(`Falta ${rel} en el manifiesto HTTP. Corré fetch-open-sources.mjs.`);
  const abs = pathOf(rel);
  if (sha256File(abs) !== entry.sha256) throw new Error(`${rel}: el SHA-256 no coincide con el manifiesto`);
  return {
    abs,
    text: () => readFileSync(abs, 'utf8'),
    provenance: { version: def.version, retrievedAt: entry.retrievedAt, release: def.versionTag, file: rel, fileSha256: entry.sha256, fileUrl: entry.url },
  };
}

/** SHA-256 por streaming (para archivos de cientos de MB). */
export async function sha256Stream(path) {
  const hash = createHash('sha256');
  await pipeline(createReadStream(path), hash);
  return hash.digest('hex');
}

export const streamLines = (abs) => createReadStream(abs, { encoding: 'utf8' });
