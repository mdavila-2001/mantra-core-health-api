// =============================================================================
// Descarga en streaming con SHA-256, reintentos con backoff y cortesía por host
// (≤ 2 pedidos/s, User-Agent identificable). Reanudable: si el archivo ya está
// en disco y el manifiesto lo registra con el mismo SHA-256, no se vuelve a bajar.
// =============================================================================
import { createHash } from 'node:crypto';
import { createReadStream, createWriteStream, existsSync, mkdirSync, renameSync, rmSync, statSync } from 'node:fs';
import { dirname } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { Readable, Transform } from 'node:stream';
import { sleep, USER_AGENT } from '../../lib/glossary-es/common.mjs';

const MIN_INTERVAL_MS = 550; // ≤ 2 pedidos/s por host
const lastRequest = new Map();

/** Espera lo necesario para no superar 2 pedidos/s contra el mismo host. */
async function politeness(url) {
  const host = new URL(url).host;
  const wait = (lastRequest.get(host) ?? 0) + MIN_INTERVAL_MS - Date.now();
  lastRequest.set(host, Math.max(Date.now(), (lastRequest.get(host) ?? 0) + MIN_INTERVAL_MS));
  if (wait > 0) await sleep(wait);
}

export const sha256OfFile = (path) =>
  new Promise((resolve, reject) => {
    const h = createHash('sha256');
    createReadStream(path).on('data', (c) => h.update(c)).on('end', () => resolve(h.digest('hex'))).on('error', reject);
  });

/**
 * GET con streaming a `destPath` (vía `.part` + rename). Devuelve el registro del manifiesto.
 * Reintenta ante red caída, 429 y 5xx; un 4xx distinto de 429 es definitivo.
 */
export async function downloadTo(url, destPath, { headers = {}, maxRetries = 5 } = {}) {
  mkdirSync(dirname(destPath), { recursive: true });
  for (let attempt = 1; ; attempt++) {
    await politeness(url);
    const part = `${destPath}.part`;
    try {
      const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT, ...headers }, redirect: 'follow' });
      if (res.status === 429 || res.status >= 500) throw Object.assign(new Error(`HTTP ${res.status}`), { retryable: true });
      if (!res.ok) throw Object.assign(new Error(`HTTP ${res.status}: ${url}`), { retryable: false });
      const hash = createHash('sha256');
      let bytes = 0;
      const counter = new Transform({ transform(chunk, _e, cb) { hash.update(chunk); bytes += chunk.length; cb(null, chunk); } });
      await pipeline(Readable.fromWeb(res.body), counter, createWriteStream(part));
      const declared = Number(res.headers.get('content-length'));
      if (Number.isFinite(declared) && declared > 0 && res.headers.get('content-encoding') == null && declared !== bytes) {
        throw Object.assign(new Error(`Descarga incompleta: ${bytes} de ${declared} bytes`), { retryable: true });
      }
      renameSync(part, destPath);
      return {
        url,
        finalUrl: res.url,
        status: res.status,
        bytes,
        sha256: hash.digest('hex'),
        contentType: res.headers.get('content-type'),
        lastModified: res.headers.get('last-modified'),
        etag: res.headers.get('etag'),
        retrievedAt: new Date().toISOString(),
      };
    } catch (err) {
      rmSync(part, { force: true });
      const retryable = err.retryable !== false;
      if (!retryable || attempt > maxRetries) throw new Error(`${url}: ${err.message}`);
      await sleep(1000 * 2 ** attempt);
    }
  }
}

export const fileSize = (path) => (existsSync(path) ? statSync(path).size : null);
