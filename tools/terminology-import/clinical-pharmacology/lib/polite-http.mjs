// =============================================================================
// HttpClient con un tope de pedidos por segundo POR INSTANCIA (una instancia =
// un host). Agrega sólo un portón de salida delante de `HttpClient.get`; los
// reintentos con backoff, la caché en disco y el límite de concurrencia son los
// del cliente compartido (`lib/glossary-es/common.mjs`, sin tocar).
//
// Existe porque la corrida de 2026-10-27 comparte la salida de red con otros
// carriles y la consigna fija ≤ 2 pedidos/s por host.
// =============================================================================

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { gunzipSync, gzipSync } from 'node:zlib';

import { HttpClient, ensureDir, sleep } from '../../lib/glossary-es/common.mjs';

export class PoliteHttpClient extends HttpClient {
  #gap;
  #nextAt = 0;

  /** @param {{ rps?: number } & ConstructorParameters<typeof HttpClient>[0]} o */
  constructor({ rps = 2, ...rest } = {}) {
    super({ ...rest, minDelayMs: 0 });
    this.#gap = Math.ceil(1000 / rps);
  }

  async get(url, opts) {
    const now = Date.now();
    const at = Math.max(now, this.#nextAt);
    this.#nextAt = at + this.#gap;
    if (at > now) await sleep(at - now);
    return super.get(url, opts);
  }
}

/** Lee un JSON guardado con `writeJsonGz`; `undefined` si no existe. */
export function readJsonGz(path) {
  return existsSync(path) ? JSON.parse(gunzipSync(readFileSync(path)).toString('utf8')) : undefined;
}

export function writeJsonGz(path, value) {
  ensureDir(dirname(path));
  writeFileSync(path, gzipSync(Buffer.from(JSON.stringify(value), 'utf8'), { level: 9 }));
}

/** Como `getJsonCached`, pero la caché va en gzip. Un 404 permitido se cachea como `null`. */
export async function getJsonCachedGz(http, url, path, opts = {}) {
  if (existsSync(path)) {
    http.stats.cacheHits++;
    return readJsonGz(path);
  }
  const { status, body } = await http.get(url, { accept: 'application/json', ...opts });
  const text = body.toString('utf8');
  const value = status === 404 || text.trim() === '' ? null : JSON.parse(text);
  writeJsonGz(path, value);
  return value;
}
