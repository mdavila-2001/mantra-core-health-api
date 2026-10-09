// =============================================================================
// Cliente HTTP cortés para el corte S3: UNA petición a la vez, al menos 1 s
// entre el inicio de una y la siguiente, User-Agent identificable, reintento con
// retroceso exponencial ante red caída / 429 / 5xx (respeta Retry-After) y caché
// en disco (una corrida interrumpida se reanuda sin repetir lo ya bajado).
//
// No hay concurrencia a propósito: §12.6 de la ficha pide 1 petición por
// segundo y la Mac mini ya está cargada.
// =============================================================================

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

export const USER_AGENT =
  process.env.S3_USER_AGENT ??
  'AloVida-GlossaryBuilder/1.0 (Mantra Core Health; F9-S3 farmacos; +https://github.com/mdavila-2001/mantra-core-health-api)';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export class PoliteClient {
  /**
   * @param {object} o
   * @param {number} [o.minIntervalMs=1000] separación mínima entre inicios de petición
   * @param {number} [o.maxRetries=6]
   * @param {typeof fetch} [o.fetchImpl]   inyectable para pruebas
   * @param {(ms:number)=>Promise<void>} [o.sleepImpl] inyectable para pruebas
   * @param {()=>number} [o.nowImpl]
   */
  constructor({ minIntervalMs = 1000, maxRetries = 6, fetchImpl = fetch, sleepImpl = sleep, nowImpl = Date.now } = {}) {
    this.minIntervalMs = minIntervalMs;
    this.maxRetries = maxRetries;
    this.fetchImpl = fetchImpl;
    this.sleepImpl = sleepImpl;
    this.nowImpl = nowImpl;
    this.lastStart = 0;
    this.chain = Promise.resolve();
    this.stats = { requests: 0, retries: 0, cacheHits: 0, notFound: 0, failures: 0, bytes: 0 };
  }

  /** Serializa: cada petición espera su turno y el intervalo mínimo desde la anterior. */
  #turn() {
    const run = this.chain.then(async () => {
      const wait = this.lastStart + this.minIntervalMs - this.nowImpl();
      if (wait > 0) await this.sleepImpl(wait);
      this.lastStart = this.nowImpl();
    });
    this.chain = run.catch(() => {});
    return run;
  }

  /** @returns {Promise<{status:number, body:Buffer, headers:Headers}>} */
  async request(url, { method = 'GET', accept, allow404 = false } = {}) {
    for (let attempt = 1; ; attempt++) {
      await this.#turn();
      let res;
      try {
        res = await this.fetchImpl(url, {
          method,
          redirect: 'follow',
          headers: { 'User-Agent': USER_AGENT, ...(accept ? { Accept: accept } : {}) },
        });
      } catch (err) {
        if (attempt > this.maxRetries) {
          this.stats.failures++;
          throw new Error(`Red: ${url}: ${err.message}`);
        }
        this.stats.retries++;
        await this.sleepImpl(1000 * 2 ** attempt);
        continue;
      }
      if (res.status === 429 || res.status >= 500) {
        if (attempt > this.maxRetries) {
          this.stats.failures++;
          throw new Error(`HTTP ${res.status} tras ${this.maxRetries} reintentos: ${url}`);
        }
        this.stats.retries++;
        const retryAfter = Number(res.headers.get('retry-after'));
        await this.sleepImpl(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 1000 * 2 ** attempt);
        continue;
      }
      const body = method === 'HEAD' ? Buffer.alloc(0) : Buffer.from(await res.arrayBuffer());
      this.stats.requests++;
      this.stats.bytes += body.length;
      if (res.status === 404 && allow404) {
        this.stats.notFound++;
        return { status: 404, body, headers: res.headers };
      }
      return { status: res.status, body, headers: res.headers };
    }
  }

  /** Escritura de caché que aguanta un disco lleno pasajero (la Mac mini lo comparte con otras sesiones). */
  async #writeCache(cachePath, text) {
    mkdirSync(dirname(cachePath), { recursive: true });
    for (let attempt = 1; ; attempt++) {
      try {
        writeFileSync(cachePath, text);
        return;
      } catch (err) {
        if (err.code !== 'ENOSPC' || attempt >= 10) throw err;
        await this.sleepImpl(30_000);
      }
    }
  }

  /**
   * GET JSON con caché. Un 404 o un cuerpo vacío se guarda como `null` (CIMA
   * responde así cuando la ficha no tiene esa sección).
   */
  async getJsonCached(url, cachePath, opts = {}) {
    if (existsSync(cachePath)) {
      this.stats.cacheHits++;
      return JSON.parse(readFileSync(cachePath, 'utf8'));
    }
    const { status, body } = await this.request(url, { accept: 'application/json', allow404: true, ...opts });
    if (status !== 200 && status !== 404) {
      this.stats.failures++;
      throw new Error(`HTTP ${status}: ${url}`);
    }
    const text = body.toString('utf8').trim();
    const value = status === 404 || text === '' ? null : JSON.parse(text);
    await this.#writeCache(cachePath, JSON.stringify(value));
    return value;
  }
}
