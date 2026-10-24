#!/usr/bin/env node
// =============================================================================
// Etapa 1 (red, reanudable): descarga los crudos de las fuentes con
// `autoFetch: true` a ../diagnostic-devices-data/eu/cache/ (fuera de git) y
// anota cada archivo en cache/manifest.json con URL, bytes, sha256 y fecha.
// Una fuente bloqueada o caída queda registrada como hueco; nunca se rellena.
//
//   node tools/terminology-import/diagnostic-devices/eu/fetch.mjs
//   node …/fetch.mjs --only=EMDN,EUDAMED_DATALAKE --max-codes=20
//
// Orden: EMDN → EUDAMED /reference → EUDAMED /udi por cada código EMDN en
// alcance → EUDAMED /actors por cada SRN de fabricante visto → Italia.
// =============================================================================

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import {
  cacheDir,
  ensureDir,
  httpFetch,
  nowIso,
  readJson,
  sha256File,
  writeJson,
} from './lib/common.mjs';
import { SOURCES } from './lib/sources.mjs';
import {
  discoverExcelLinks,
  parseEmdnRows,
  readFirstSheet,
} from './lib/sources/emdn.mjs';
import {
  assertSafeNext,
  buildUrl,
  parsePage,
} from './lib/sources/eudamed-datalake.mjs';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  }),
);
const ONLY = args.only ? new Set(String(args.only).split(',')) : null;
const MAX_CODES = args['max-codes'] ? Number(args['max-codes']) : Infinity;
const wants = (key) => (!ONLY || ONLY.has(key)) && SOURCES[key].autoFetch;

const MANIFEST = cacheDir('manifest.json');
const manifest = existsSync(MANIFEST)
  ? readJson(MANIFEST)
  : { files: [], gaps: [] };
const runGaps = [];

function record(source, url, file, extra = {}) {
  const entry = {
    source,
    url,
    file,
    bytes: readFileSync(file).length,
    sha256: sha256File(file),
    retrievedAt: nowIso(),
    ...extra,
  };
  manifest.files = manifest.files.filter((f) => f.file !== file);
  manifest.files.push(entry);
  return entry;
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
  'Content-Type': 'application/json',
  ...(process.env.EUDAMED_SUBSCRIPTION_KEY
    ? { 'Ocp-Apim-Subscription-Key': process.env.EUDAMED_SUBSCRIPTION_KEY }
    : {}),
});

/** GET paginado por nextLink; guarda cada página y devuelve sus rutas. */
function fetchPaged(source, firstUrl, dir) {
  ensureDir(dir);
  const done = join(dir, '_complete.json');
  if (existsSync(done)) return readJson(done).pages;
  const pages = [];
  let url = firstUrl;
  while (url) {
    const file = join(
      dir,
      `page-${String(pages.length + 1).padStart(5, '0')}.json`,
    );
    const res = httpFetch(url, { headers: datalakeHeaders(), outFile: file });
    if (!res.ok) return gap(source, url, res);
    const { nextLink } = parsePage(JSON.parse(readFileSync(file, 'utf8')));
    record(source, url, file);
    pages.push(file);
    url = nextLink ? assertSafeNext(nextLink, url) : null;
  }
  writeJson(done, { firstUrl, pages, completedAt: nowIso() });
  return pages;
}

// --- EMDN --------------------------------------------------------------------
async function fetchEmdn() {
  const page = SOURCES.EMDN.officialUrl;
  const htmlFile = cacheDir('emdn', 'page.html');
  const res = httpFetch(page, { outFile: htmlFile });
  if (!res.ok) return gap('EMDN', page, res);
  record('EMDN', page, htmlFile);
  const links = discoverExcelLinks(readFileSync(htmlFile, 'utf8'), page);
  if (!links.length)
    return gap('EMDN', page, null, 'la página no enlaza ningún Excel');
  const url = process.env.EMDN_XLSX_URL ?? links[0];
  const file = cacheDir('emdn', basename(new URL(url).pathname) || 'emdn.xlsx');
  const dl = httpFetch(url, { outFile: file });
  if (!dl.ok) return gap('EMDN', url, dl);
  return record('EMDN', url, file, { candidates: links });
}

async function emdnConceptsFromCache() {
  const xlsx = manifest.files.find(
    (f) => f.source === 'EMDN' && /\.xlsx?$/i.test(f.file),
  );
  if (!xlsx) return null;
  const { header, records } = await readFirstSheet(xlsx.file);
  return parseEmdnRows(header, records, {
    sourceUrl: xlsx.url,
    sourceVersion: `sha256:${xlsx.sha256.slice(0, 12)}`,
    retrievedAt: xlsx.retrievedAt,
  });
}

// --- EUDAMED Data Lake ---------------------------------------------------------
function fetchReference() {
  const url = buildUrl('reference', { LANGUAGE: 'en' });
  return fetchPaged(
    'EUDAMED_DATALAKE',
    url,
    cacheDir('eudamed', 'reference', 'en'),
  );
}

function fetchUdiByCodes(codes) {
  let n = 0;
  for (const code of codes) {
    if (n++ >= MAX_CODES) break;
    const url = buildUrl('udi', { NOMENCLATURE_CODE: code });
    const pages = fetchPaged(
      'EUDAMED_DATALAKE',
      url,
      cacheDir('eudamed', 'udi', code),
    );
    if (pages === null && runGaps.at(-1)?.reason.startsWith('bloqueado')) {
      console.warn(
        '[EUDAMED] host bloqueado: se corta la iteración por códigos.',
      );
      return;
    }
  }
}

function fetchActorsForSeenSrns() {
  const root = cacheDir('eudamed', 'udi');
  if (!existsSync(root)) return;
  const srns = new Set();
  for (const code of readdirSync(root))
    for (const f of readdirSync(join(root, code)).filter((x) =>
      x.startsWith('page-'),
    ))
      for (const row of parsePage(
        JSON.parse(readFileSync(join(root, code, f), 'utf8')),
      ).rows)
        if (row.MF_SRN) srns.add(row.MF_SRN);
  for (const srn of srns) {
    const pages = fetchPaged(
      'EUDAMED_DATALAKE',
      buildUrl('actors', { ACTOR_ID: srn }),
      cacheDir('eudamed', 'actors', srn),
    );
    if (pages === null && runGaps.at(-1)?.reason.startsWith('bloqueado'))
      return;
  }
}

// --- Italia --------------------------------------------------------------------
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
  ];
  if (!links.length)
    return gap(key, page, null, 'la ficha no enlaza ningún CSV/ZIP');
  for (const url of links) {
    const file = cacheDir(key.toLowerCase(), basename(new URL(url).pathname));
    const dl = httpFetch(url, { outFile: file, timeoutS: 1800 });
    if (!dl.ok) gap(key, url, dl);
    else record(key, url, file);
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

  if (wants('EMDN')) await fetchEmdn();
  if (wants('EUDAMED_DATALAKE')) {
    if (fetchReference() !== null) {
      const emdn = await emdnConceptsFromCache();
      if (!emdn)
        gap(
          'EUDAMED_DATALAKE',
          buildUrl('udi', {}),
          null,
          'sin EMDN descargada no hay lista de códigos en alcance para consultar /udi',
        );
      else {
        fetchUdiByCodes(emdn.filter((c) => c.scope.inScope).map((c) => c.code));
        fetchActorsForSeenSrns();
      }
    }
  }
  if (wants('IT_BDRDM')) fetchItalianDataset('IT_BDRDM');
  if (wants('IT_CND')) fetchItalianDataset('IT_CND');

  manifest.gaps = runGaps;
  manifest.lastRunAt = nowIso();
  writeJson(MANIFEST, manifest);
  console.log(
    `\nArchivos en manifiesto: ${manifest.files.length} · huecos de esta corrida: ${runGaps.length} · ${MANIFEST}`,
  );
}

main().catch((err) => {
  console.error('ERROR FATAL en diagnostic-devices/eu/fetch:', err);
  process.exitCode = 1;
});
