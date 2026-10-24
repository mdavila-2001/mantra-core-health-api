#!/usr/bin/env node
// =============================================================================
// Etapa 1 (red, reanudable): descarga los crudos de las fuentes con
// `autoFetch: true` a ../diagnostic-devices-data/eu/cache/ (fuera de git) y
// anota cada archivo en cache/manifest.json con URL, bytes, sha256 y fecha.
// Una fuente bloqueada o caída queda registrada como hueco; nunca se rellena.
//
//   node tools/terminology-import/diagnostic-devices/eu/fetch.mjs
//   node …/fetch.mjs --only=EMDN,EUDAMED_DATALAKE --max-codes=20 --concurrency=6
//
// Orden: EMDN oficial → EUDAMED /reference → EUDAMED /udi por cada código EMDN
// en alcance (en paralelo, páginas gzip) → EUDAMED /actors (fabricantes) →
// Italia.
//
// Verificado en vivo (2026-10-24; la salida literal quedó en el historial de git,
// 79a7e486:docs/trabajo/2026-10-24-seed-dx-devices-eu-oficial/evidencia/): el Data Lake
// guarda NOMENCLATURE_CODE con un espacio inicial (" Z11040101"); el filtro
// exacto sin ese espacio devuelve 0 filas. Páginas de hasta 1000 filas con
// nextLink `$after=…` que conserva los filtros.
// =============================================================================

import { execFile, execFileSync } from 'node:child_process';
import {
  existsSync,
  readFileSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { basename, join } from 'node:path';
import { promisify } from 'node:util';
import { gzipSync } from 'node:zlib';
import {
  cacheDir,
  ensureDir,
  httpFetch,
  nowIso,
  readJson,
  sha256File,
  writeJson,
} from './lib/common.mjs';
import { loadEmdn } from './lib/load-emdn.mjs';
import { SOURCES } from './lib/sources.mjs';
import { discoverExcelLinks } from './lib/sources/emdn.mjs';
import {
  assertSafeNext,
  buildUrl,
  parsePage,
} from './lib/sources/eudamed-datalake.mjs';

const execFileP = promisify(execFile);
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  }),
);
const ONLY = args.only ? new Set(String(args.only).split(',')) : null;
const MAX_CODES = args['max-codes'] ? Number(args['max-codes']) : Infinity;
const CONCURRENCY = Number(args.concurrency ?? 6);
const wants = (key) => (!ONLY || ONLY.has(key)) && SOURCES[key].autoFetch;

const MANIFEST = cacheDir('manifest.json');
const manifest = existsSync(MANIFEST)
  ? readJson(MANIFEST)
  : { files: [], gaps: [] };
const byFile = new Map(manifest.files.map((f) => [f.file, f]));
const runGaps = [];
let sinceFlush = 0;

function flushManifest() {
  manifest.files = [...byFile.values()];
  writeJson(MANIFEST, manifest);
  sinceFlush = 0;
}

function record(source, url, file, extra = {}) {
  byFile.set(file, {
    source,
    url,
    file,
    bytes: statSync(file).size,
    sha256: sha256File(file),
    retrievedAt: nowIso(),
    ...extra,
  });
  if (++sinceFlush >= 50) flushManifest();
}

function gap(source, url, res, note) {
  const g = {
    source,
    url,
    at: nowIso(),
    reason: res?.blocked
      ? 'bloqueado por la política de red del entorno (proxy 403)'
      : res?.status
        ? `HTTP ${res.status}`
        : (res?.error ?? note),
    note: note ?? null,
  };
  runGaps.push(g);
  console.warn(`[hueco] ${source}: ${g.reason} — ${url}`);
  return null;
}

const datalakeHeaders = () => ({
  Accept: 'application/json',
  ...(process.env.EUDAMED_SUBSCRIPTION_KEY
    ? { 'Ocp-Apim-Subscription-Key': process.env.EUDAMED_SUBSCRIPTION_KEY }
    : {}),
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** GET con curl (respeta HTTPS_PROXY y la CA del entorno); reintenta 429/5xx/errores de red. */
async function curlToFile(url, outFile, headers = {}, attempts = 6) {
  for (let i = 0; i < attempts; i++) {
    const argv = [
      '-sS',
      '-L',
      '--max-time',
      '300',
      '-o',
      outFile,
      '-w',
      '%{http_code}',
    ];
    for (const [k, v] of Object.entries(headers)) argv.push('-H', `${k}: ${v}`);
    argv.push(url);
    try {
      const { stdout } = await execFileP('curl', argv, { maxBuffer: 1 << 20 });
      const status = Number(stdout.trim()) || null;
      if (status >= 200 && status < 300) return { ok: true, status };
      if (status !== 429 && !(status >= 500)) return { ok: false, status };
    } catch (err) {
      const msg = String(err.stderr ?? err.message ?? err);
      if (err.code === 56 && /CONNECT tunnel failed/.test(msg))
        return { ok: false, blocked: true, error: msg.trim() };
      if (i === attempts - 1)
        return { ok: false, error: msg.trim().split('\n').pop() };
    }
    await sleep(3000 * 2 ** i);
  }
  return { ok: false, error: 'reintentos agotados' };
}

/** GET paginado por nextLink; guarda cada página gzip; reanuda si ya está completo. */
async function fetchPaged(source, firstUrl, dir) {
  ensureDir(dir);
  const done = join(dir, '_complete.json');
  if (existsSync(done)) return readJson(done).pages;
  const pages = [];
  let url = firstUrl;
  while (url) {
    const n = String(pages.length + 1).padStart(5, '0');
    const tmp = join(dir, `page-${n}.json.part`);
    const file = join(dir, `page-${n}.json.gz`);
    const res = await curlToFile(url, tmp, datalakeHeaders());
    if (!res.ok) {
      if (existsSync(tmp)) unlinkSync(tmp);
      return gap(source, url, res);
    }
    const body = readFileSync(tmp);
    const { nextLink } = parsePage(JSON.parse(body.toString('utf8')));
    writeFileSync(file, gzipSync(body));
    unlinkSync(tmp);
    record(source, url, file);
    pages.push(file);
    url = nextLink ? assertSafeNext(nextLink, url) : null;
  }
  writeJson(done, { firstUrl, pages, completedAt: nowIso() });
  return pages;
}

/** Igual que fetchPaged, pero un error de un código queda como hueco y no corta la corrida. */
async function fetchPagedSafe(source, firstUrl, dir) {
  try {
    return await fetchPaged(source, firstUrl, dir);
  } catch (err) {
    return gap(source, firstUrl, null, String(err.message ?? err));
  }
}

/** Pool de promesas con concurrencia fija. */
async function pool(items, n, fn) {
  let i = 0;
  let doneCount = 0;
  const worker = async () => {
    while (i < items.length) {
      const item = items[i++];
      await fn(item);
      if (++doneCount % 100 === 0)
        console.log(
          `[EUDAMED] ${doneCount}/${items.length} códigos procesados`,
        );
    }
  };
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, worker));
}

// --- EMDN --------------------------------------------------------------------
async function fetchEmdn() {
  const page = SOURCES.EMDN.downloadPage;
  const htmlFile = cacheDir('emdn', 'page.html');
  const res = httpFetch(page, { outFile: htmlFile });
  if (!res.ok) return gap('EMDN', page, res);
  record('EMDN', page, htmlFile);
  const links = discoverExcelLinks(readFileSync(htmlFile, 'utf8'), page);
  const url =
    process.env.EMDN_XLSX_URL ??
    links.find((l) => /_EN\b|_EN\./i.test(decodeURIComponent(l))) ??
    links[0];
  if (!url) return gap('EMDN', page, null, 'la página no enlaza ningún Excel');
  const file = cacheDir(
    'emdn',
    decodeURIComponent(basename(new URL(url).pathname)).replace(/\s+/g, '_'),
  );
  const dl = httpFetch(url, { outFile: file });
  if (!dl.ok) return gap('EMDN', url, dl);
  return record('EMDN', url, file, { candidates: links });
}

// --- EUDAMED Data Lake ---------------------------------------------------------
async function fetchUdiByCodes(codes) {
  const list = codes.slice(0, MAX_CODES);
  console.log(
    `[EUDAMED] ${list.length} códigos EMDN a consultar (concurrencia ${CONCURRENCY})`,
  );
  await pool(list, CONCURRENCY, (code) =>
    fetchPagedSafe(
      'EUDAMED_DATALAKE',
      // El Data Lake guarda el código con un espacio inicial (verificado en vivo).
      buildUrl('udi', { NOMENCLATURE_CODE: ` ${code}` }),
      cacheDir('eudamed', 'udi', code),
    ),
  );
}

// --- Italia --------------------------------------------------------------------
// La ficha enlaza el mismo conjunto en ZIP _csv, _json y _xml: se baja solo el
// _csv (o un .csv directo) y se descomprime al lado. El manifiesto anota el
// ZIP y el CSV extraído, este último con la URL del ZIP y `archive`.
function fetchItalianDataset(key) {
  const page = SOURCES[key].officialUrl;
  const htmlFile = cacheDir(key.toLowerCase(), 'page.html');
  const res = httpFetch(page, { outFile: htmlFile });
  if (!res.ok) return gap(key, page, res);
  record(key, page, htmlFile);
  const html = readFileSync(htmlFile, 'utf8');
  const links = [
    ...new Set(
      [...html.matchAll(/href\s*=\s*"([^"]+\.(?:csv|zip)(?:\?[^"]*)?)"/gi)].map(
        (m) => new URL(m[1].replace(/&amp;/g, '&'), page).toString(),
      ),
    ),
  ].filter((u) => /\.csv$|_csv\.zip$/i.test(new URL(u).pathname));
  if (!links.length)
    return gap(key, page, null, 'la ficha no enlaza ningún CSV ni ZIP _csv');
  for (const url of links) {
    const file = cacheDir(key.toLowerCase(), basename(new URL(url).pathname));
    const dl = httpFetch(url, { outFile: file, timeoutS: 1800 });
    if (!dl.ok) {
      gap(key, url, dl);
      continue;
    }
    record(key, url, file);
    if (!/\.zip$/i.test(file)) continue;
    const dir = cacheDir(key.toLowerCase());
    const listing = execFileSync('unzip', ['-Z1', file], { encoding: 'utf8' })
      .split('\n')
      .filter((n) => /^[^/\\]+\.csv$/i.test(n));
    for (const name of listing) {
      execFileSync('unzip', ['-o', '-q', file, name, '-d', dir]);
      record(key, url, join(dir, name), { archive: basename(file) });
    }
  }
}

// --- main ----------------------------------------------------------------------
async function main() {
  ensureDir(cacheDir());
  for (const [key, s] of Object.entries(SOURCES))
    if (!s.autoFetch && (!ONLY || ONLY.has(key)))
      runGaps.push({
        source: key,
        url: s.officialUrl,
        at: nowIso(),
        reason: 'sin descarga automática',
        note: s.terms.text,
      });

  if (wants('EMDN')) {
    await fetchEmdn();
    flushManifest();
  }
  if (wants('EUDAMED_DATALAKE')) {
    const ref = await fetchPaged(
      'EUDAMED_DATALAKE',
      buildUrl('reference', { LANGUAGE: 'en' }),
      cacheDir('eudamed', 'reference', 'en'),
    );
    if (ref !== null) {
      const { concepts, origin } = await loadEmdn();
      if (!concepts.length)
        gap(
          'EUDAMED_DATALAKE',
          buildUrl('udi', {}),
          null,
          'sin EMDN no hay lista de códigos en alcance',
        );
      else {
        console.log(`[EUDAMED] EMDN de origen ${origin}`);
        await fetchUdiByCodes(
          concepts.filter((c) => c.scope.inScope).map((c) => c.code),
        );
        await fetchPaged(
          'EUDAMED_DATALAKE',
          buildUrl('actors', { ACTOR_TYPE: 'Manufacturer' }),
          cacheDir('eudamed', 'actors', 'Manufacturer'),
        );
      }
    }
  }
  if (wants('IT_BDRDM')) fetchItalianDataset('IT_BDRDM');
  if (wants('IT_CND')) fetchItalianDataset('IT_CND');

  // Con --only se conservan los huecos de las fuentes que esta corrida no tocó.
  manifest.gaps = [
    ...(manifest.gaps ?? []).filter((g) => ONLY && !ONLY.has(g.source)),
    ...runGaps,
  ];
  manifest.lastRunAt = nowIso();
  flushManifest();
  console.log(
    `\nArchivos en manifiesto: ${manifest.files.length} · huecos de esta corrida: ${runGaps.length} · ${MANIFEST}`,
  );
}

main().catch((err) => {
  console.error('ERROR FATAL en diagnostic-devices/eu/fetch:', err);
  process.exitCode = 1;
});
