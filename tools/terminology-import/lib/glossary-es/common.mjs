// =============================================================================
// Piezas compartidas por los importadores del glosario en castellano.
//
// Nada de acá decide contenido clínico: son utilidades de transporte (HTTP con
// reintentos y caché en disco), de formato (NDJSON, HTML → texto) y de
// identidad (slug, UUID determinista). Las reglas de categoría/etiqueta viven
// en `taxonomy.mjs`, una por fuente, derivadas de la estructura oficial.
// =============================================================================

import { createHash } from 'node:crypto';
import { createWriteStream, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));

/** Raíz del repo de la API (…/tools/terminology-import/lib/glossary-es → ../../../..). */
export const API_ROOT = resolve(HERE, '../../../..');

/**
 * Carpeta de salida FUERA de git. Por convención es hermana de los repos
 * (`Mantra Core Health/glossary-data-build`); se puede redefinir con
 * `GLOSSARY_BUILD_DIR`. Desde un worktree `wt-*` la raíz del proyecto es la
 * misma carpeta padre, así que la resolución por `..` funciona igual.
 */
export const BUILD_DIR = process.env.GLOSSARY_BUILD_DIR ?? resolve(API_ROOT, '..', 'glossary-data-build');

/** User-Agent descriptivo (política de Wikimedia y buena ciudadanía con AEMPS/NLM). */
export const USER_AGENT =
  process.env.GLOSSARY_USER_AGENT ??
  'AloVida-GlossaryImporter/1.0 (Mantra Core Health; terminology import; contacto: equipo AloVida)';

export function ensureDir(path) {
  mkdirSync(path, { recursive: true });
  return path;
}

export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export function nowIso() {
  return new Date().toISOString();
}

export function sha256File(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

// --- Identidad ----------------------------------------------------------------

/** Namespace de `src/common/constants/concepts.ts` (SALUD_UUID_NAMESPACE). */
export const SALUD_UUID_NAMESPACE = '3f2b6c14-9d5e-5a41-b7c2-0a1e9f4d8b60';

/**
 * Réplica exacta de `deterministicId` (UUIDv5) de `src/common/constants/concepts.ts`.
 * Hace falta para escribir membresías en los value sets del glosario, cuyos ids
 * derivan de esa función (`seed:value-set-version:<code>:1`, etc.). El test
 * `common.test.mjs` fija un valor conocido para detectar divergencias.
 */
export function deterministicId(key) {
  const ns = Buffer.from(SALUD_UUID_NAMESPACE.replace(/-/g, ''), 'hex');
  const bytes = createHash('sha1').update(ns).update(Buffer.from(key, 'utf8')).digest().subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const h = bytes.toString('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/** kebab-case ASCII estable (sin tildes). */
export function slugify(text) {
  return String(text)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Clave de búsqueda: minúsculas sin tildes (conserva la ñ). */
export function foldForSearch(text) {
  return String(text)
    .toLowerCase()
    .replace(/ñ/g, '\u0000')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\u0000/g, 'ñ');
}

// --- HTML ---------------------------------------------------------------------

const NAMED_ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—',
  laquo: '«', raquo: '»', iquest: '¿', iexcl: '¡', deg: '°', micro: 'µ', middot: '·',
  aacute: 'á', eacute: 'é', iacute: 'í', oacute: 'ó', uacute: 'ú', ntilde: 'ñ', uuml: 'ü',
  Aacute: 'Á', Eacute: 'É', Iacute: 'Í', Oacute: 'Ó', Uacute: 'Ú', Ntilde: 'Ñ', Uuml: 'Ü',
  ge: '≥', le: '≤', plusmn: '±', times: '×', reg: '®', copy: '©', trade: '™', beta: 'β', alpha: 'α',
  gamma: 'γ', mu: 'μ', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', hellip: '…', bull: '•',
};

export function decodeEntities(s) {
  return String(s)
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-zA-Z]+);/g, (m, n) => NAMED_ENTITIES[n] ?? m);
}

/** HTML → texto plano legible (párrafos y viñetas conservados como saltos de línea). */
export function htmlToText(html) {
  if (html == null) return null;
  const text = decodeEntities(
    String(html)
      .replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
      .replace(/<li[^>]*>/gi, '\n• ')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|h\d|li|tr|ul|ol|table)>/gi, '\n')
      .replace(/<[^>]+>/g, ''),
  )
    .replace(/ /g, ' ')
    .replace(/[ \t\r\f\v]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return text.length > 0 ? text : null;
}

/**
 * Sanea HTML de fuente confiable para mostrarlo: quita scripts/estilos,
 * atributos `style`/`class`/`on*` y deja la estructura. No cambia el texto.
 */
export function sanitizeHtml(html) {
  if (html == null) return null;
  return String(html)
    .replace(/<(script|style|iframe|object)[\s\S]*?<\/\1>/gi, '')
    .replace(/\s(on\w+|style|class|lang|data-[\w-]+)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/<\/?(span|font|u)\b[^>]*>/gi, '')
    .replace(/\r/g, '')
    .replace(/\n\s*\n+/g, '\n')
    .trim();
}

// --- HTTP con reintentos, caché y límite de concurrencia -----------------------

export class HttpClient {
  /**
   * @param {object} o
   * @param {number} [o.concurrency=4]  pedidos simultáneos máximos
   * @param {number} [o.minDelayMs=100] espera mínima tras cada pedido (por "carril")
   * @param {number} [o.maxRetries=6]
   */
  constructor({ concurrency = 4, minDelayMs = 100, maxRetries = 6, headers = {} } = {}) {
    this.concurrency = concurrency;
    this.minDelayMs = minDelayMs;
    this.maxRetries = maxRetries;
    this.headers = { 'User-Agent': USER_AGENT, ...headers };
    this.active = 0;
    this.queue = [];
    this.stats = { requests: 0, retries: 0, cacheHits: 0, failures: 0, bytes: 0 };
  }

  async #slot() {
    if (this.active < this.concurrency) {
      this.active++;
      return;
    }
    await new Promise((r) => this.queue.push(r));
    this.active++;
  }

  #release() {
    this.active--;
    const next = this.queue.shift();
    if (next) next();
  }

  /** GET con reintentos exponenciales ante red caída, 429 y 5xx. Devuelve {status, body(Buffer), headers}. */
  async get(url, { accept, allow404 = false } = {}) {
    await this.#slot();
    try {
      for (let attempt = 1; ; attempt++) {
        let res;
        try {
          res = await fetch(url, { headers: { ...this.headers, ...(accept ? { Accept: accept } : {}) } });
        } catch (err) {
          if (attempt > this.maxRetries) throw new Error(`Red: ${url}: ${err.message}`);
          this.stats.retries++;
          await sleep(500 * 2 ** attempt);
          continue;
        }
        if (res.status === 429 || res.status >= 500) {
          if (attempt > this.maxRetries) throw new Error(`HTTP ${res.status} tras ${this.maxRetries} reintentos: ${url}`);
          this.stats.retries++;
          const retryAfter = Number(res.headers.get('retry-after'));
          await sleep(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 500 * 2 ** attempt);
          continue;
        }
        const body = Buffer.from(await res.arrayBuffer());
        this.stats.requests++;
        this.stats.bytes += body.length;
        await sleep(this.minDelayMs);
        if (res.status === 404 && allow404) return { status: 404, body, headers: res.headers };
        if (!res.ok) {
          this.stats.failures++;
          throw new Error(`HTTP ${res.status}: ${url}`);
        }
        return { status: res.status, body, headers: res.headers };
      }
    } finally {
      this.#release();
    }
  }

  /**
   * GET JSON con caché en disco: si `cachePath` existe se lee de ahí y no se
   * pide nada (reanudable). Un 404 permitido se cachea como `null`.
   */
  async getJsonCached(url, cachePath, opts = {}) {
    if (existsSync(cachePath)) {
      this.stats.cacheHits++;
      return JSON.parse(readFileSync(cachePath, 'utf8'));
    }
    const { status, body } = await this.get(url, { accept: 'application/json', ...opts });
    const text = body.toString('utf8');
    const value = status === 404 ? null : text.trim() === '' ? null : JSON.parse(text);
    ensureDir(dirname(cachePath));
    writeFileSync(cachePath, JSON.stringify(value));
    return value;
  }

  /** GET texto/binario con caché en disco. */
  async getFileCached(url, cachePath, opts = {}) {
    if (existsSync(cachePath)) {
      this.stats.cacheHits++;
      return readFileSync(cachePath);
    }
    const { body } = await this.get(url, opts);
    ensureDir(dirname(cachePath));
    writeFileSync(cachePath, body);
    return body;
  }
}

/** Ejecuta `fn` sobre cada ítem con a lo sumo `limit` en vuelo (el HttpClient limita además la red). */
export async function mapPool(items, limit, fn, onProgress) {
  const results = new Array(items.length);
  let next = 0;
  let done = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
      done++;
      if (onProgress) onProgress(done, items.length);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

/** Log de progreso cada `every` ítems o al final. */
export function progressLogger(label, every = 500) {
  const t0 = Date.now();
  return (done, total) => {
    if (done % every === 0 || done === total) {
      const s = ((Date.now() - t0) / 1000).toFixed(0);
      console.log(`[${label}] ${done}/${total} (${s}s)`);
    }
  };
}

// --- NDJSON ------------------------------------------------------------------

export async function writeNdjson(path, rows) {
  ensureDir(dirname(path));
  const out = createWriteStream(path, { encoding: 'utf8' });
  for (const row of rows) {
    if (!out.write(JSON.stringify(row) + '\n')) await new Promise((r) => out.once('drain', r));
  }
  await new Promise((r, j) => out.end((e) => (e ? j(e) : r())));
}

export function readNdjson(path) {
  return readFileSync(path, 'utf8')
    .split('\n')
    .filter((l) => l.trim() !== '')
    .map((l) => JSON.parse(l));
}

export function writeJson(path, value, pretty = false) {
  ensureDir(dirname(path));
  writeFileSync(path, pretty ? JSON.stringify(value, null, 2) + '\n' : JSON.stringify(value));
}

export function ndjsonPath(name) {
  return join(BUILD_DIR, 'ndjson', `${name}.ndjson`);
}

export function cacheDir(...parts) {
  return join(BUILD_DIR, 'cache', ...parts);
}

/** Campos de imagen vacíos: toda fila los declara aunque no tenga imagen. */
export const NO_IMAGE = Object.freeze({
  imageUrl: null,
  imageThumbUrl: null,
  imageAttribution: null,
  imageLicense: null,
  imageLicenseUrl: null,
  imageSourcePage: null,
  imageOrigin: null,
});

/** Controla que una fila cumpla el esquema mínimo de SCHEMA.md; lanza con el motivo. */
export function assertRow(row) {
  const required = ['slug', 'code', 'codeSystem', 'display', 'esName', 'categoryKey', 'lang', 'source', 'sourceName', 'sourceUrl', 'sourceRetrievedAt', 'sourceLicense', 'reviewStatus'];
  for (const k of required) {
    if (row[k] === undefined || row[k] === null || row[k] === '') throw new Error(`Fila ${row.slug ?? '?'} sin «${k}»`);
  }
  if (!Array.isArray(row.tagKeys)) throw new Error(`Fila ${row.slug} sin tagKeys[]`);
  if (!Array.isArray(row.esSynonyms)) throw new Error(`Fila ${row.slug} sin esSynonyms[]`);
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(row.slug)) throw new Error(`Slug inválido: ${row.slug}`);
  if (row.reviewStatus !== 'external-source') throw new Error(`reviewStatus inesperado en ${row.slug}`);
  return row;
}
