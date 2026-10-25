#!/usr/bin/env node
// =============================================================================
// Subconjuntos de MEDLINE/PubMed (E-utilities): solo METADATOS e indexación
// MeSH de NLM, nunca texto de los artículos.
//
//   --subset cochrane    revisiones de «Cochrane Database Syst Rev» (la Cochrane
//                        Library responde 403 a este entorno)
//   --subset guidelines  guías de práctica clínica (tipos de publicación
//                        Guideline / Practice Guideline)
//   --subset rct         ensayos controlados aleatorizados publicados
//                        (tipo de publicación Randomized Controlled Trial)
//   --subset reviews     revisiones sistemáticas y metaanálisis fuera de Cochrane
//   --subset trials      ensayos clínicos no aleatorizados
//
// Por registro se guarda PMID, estado MEDLINE, fecha de revisión, tipos de
// publicación y encabezados MeSH (descriptor + calificadores), tal cual.
// E-utilities no entrega más allá del registro 10 000 de una búsqueda: se parte
// por fecha de alta en PubMed ([EDAT], única por registro; [PDAT] mezcla la
// fecha impresa y la electrónica y repite registros) en años y, si hace falta,
// meses, hasta que cada tramo
// tenga menos de 10 000; los tramos son disjuntos y deben sumar el total.
// Una página = 200 PMID, gzip en caché, reanudable; < 3 pedidos/s.
//
// Uso: node tools/terminology-import/procedures-treatments/fetch-pubmed.mjs --subset guidelines
// =============================================================================

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gunzipSync, gzipSync } from 'node:zlib';
import { cacheDir, ensureDir, nowIso, writeJson } from './lib/common.mjs';
import { PUBMED_SUBSETS, parsePubmedPage } from './lib/sources/pubmed.mjs';

const EUTILS = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
const BATCH = 200;
const LIMIT = 9999;

const args = process.argv.slice(2);
const subsetKey = args.includes('--subset')
  ? args[args.indexOf('--subset') + 1]
  : null;
const subset = PUBMED_SUBSETS[subsetKey];
if (!subset)
  throw new Error(`Use --subset ${Object.keys(PUBMED_SUBSETS).join('|')}`);
const DIR = ensureDir(cacheDir(subset.cache, 'pages'));

function get(url) {
  for (let attempt = 1; ; attempt++) {
    try {
      const out = execFileSync(
        'curl',
        ['-sS', '--fail', '--max-time', '300', url],
        {
          encoding: 'utf8',
          maxBuffer: 1 << 30,
          stdio: ['ignore', 'pipe', 'pipe'],
        },
      );
      execFileSync('sleep', ['0.4']);
      return out;
    } catch (err) {
      if (attempt >= 8)
        throw new Error(
          `E-utilities falló tras ${attempt} intentos: ${url}\n${err.stderr ?? err.message}`,
        );
      execFileSync('sleep', [String(4 * attempt)]);
    }
  }
}

const esearch = (term, history = false) =>
  JSON.parse(
    get(
      `${EUTILS}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(term)}&retmax=0&retmode=json${history ? '&usehistory=y' : ''}`,
    ),
  ).esearchresult;
const range = (a, b) => `"${a}"[EDAT] : "${b}"[EDAT]`;
const pad = (n) => String(n).padStart(2, '0');
// Último día real del mes: PubMed responde 0 («No items found») a una fecha
// inexistente como 2015/04/31 en vez de recortarla.
const lastDay = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate();

/** Tramos disjuntos de fecha de alta con menos de 10 000 registros cada uno (año → mes → día). */
function partitions(term) {
  const out = [];
  const total = Number(esearch(term).count);
  if (total <= LIMIT) return [{ tag: 'all', range: null, count: total }];
  const count = (r) => Number(esearch(`${term} AND (${r})`).count);
  const pre = count(range('1000', '1899'));
  if (pre > LIMIT) throw new Error('Más de 10 000 registros antes de 1900');
  if (pre)
    out.push({ tag: 'y0000-1899', range: range('1000', '1899'), count: pre });
  const lastYear = new Date().getUTCFullYear() + 1;
  for (let y = 1900; y <= lastYear; y++) {
    const yr =
      y === lastYear ? range(String(y), '3000') : range(String(y), String(y));
    const n = count(yr);
    if (n <= LIMIT) {
      if (n) out.push({ tag: `y${y}`, range: yr, count: n });
      continue;
    }
    for (let m = 1; m <= 12; m++) {
      const mr = range(`${y}/${pad(m)}/01`, `${y}/${pad(m)}/${lastDay(y, m)}`);
      const mn = count(mr);
      if (mn <= LIMIT) {
        if (mn) out.push({ tag: `y${y}m${pad(m)}`, range: mr, count: mn });
        continue;
      }
      for (let d = 1; d <= lastDay(y, m); d++) {
        const dr = range(
          `${y}/${pad(m)}/${pad(d)}`,
          `${y}/${pad(m)}/${pad(d)}`,
        );
        const dn = count(dr);
        if (dn > LIMIT)
          throw new Error(
            `Más de 10 000 registros el ${y}-${pad(m)}-${pad(d)}`,
          );
        if (dn)
          out.push({ tag: `y${y}m${pad(m)}d${pad(d)}`, range: dr, count: dn });
      }
    }
  }
  return out;
}

const total = Number(esearch(subset.term).count);
const parts = partitions(subset.term);
const sum = parts.reduce((n, p) => n + p.count, 0);
if (sum !== total)
  throw new Error(
    `Los tramos suman ${sum} y la búsqueda completa ${total}: revisar los rangos`,
  );
let saved = 0;
let booksSkipped = 0;
let refetched = 0;
// Páginas con libros de Bookshelf (`PubmedBookArticle`): se cuentan, no se guardan
// (no traen indexación MeSH de artículo). Sin esto, una página corta por un
// corte de E-utilities (HTTP 200 con el cuerpo truncado) pasa por «libros».
const BOOKS_FILE = join(DIR, '..', 'books.json');
const books = existsSync(BOOKS_FILE)
  ? JSON.parse(readFileSync(BOOKS_FILE, 'utf8'))
  : {};
const countRecords = (file) =>
  JSON.parse(gunzipSync(readFileSync(file)).toString('utf8')).length;

function fetchPage(s, start, expected) {
  for (let attempt = 1; ; attempt++) {
    const xml = get(
      `${EUTILS}/efetch.fcgi?db=pubmed&query_key=${s.querykey}&WebEnv=${s.webenv}&retstart=${start}&retmax=${BATCH}&retmode=xml`,
    );
    const { records, bookCount } = parsePubmedPage(xml);
    if (records.length + bookCount === expected) return { records, bookCount };
    if (attempt >= 5)
      throw new Error(
        `Página ${start} de ${expected} esperados: llegaron ${records.length} artículos y ${bookCount} libros tras ${attempt} intentos`,
      );
    execFileSync('sleep', [String(4 * attempt)]);
  }
}

for (const part of parts) {
  const term = part.range ? `${subset.term} AND (${part.range})` : subset.term;
  const s = esearch(term, true);
  const n = Number(s.count);
  for (let start = 0; start < n; start += BATCH) {
    const expected = Math.min(BATCH, n - start);
    const name = `${part.tag}-p${String(start / BATCH + 1).padStart(4, '0')}.json.gz`;
    const file = join(DIR, name);
    if (existsSync(file)) {
      const have = countRecords(file);
      if (have + (books[name] ?? 0) === expected) {
        saved += have;
        booksSkipped += books[name] ?? 0;
        continue;
      }
      console.log(
        `[pubmed-${subsetKey}] ${name}: ${have} guardados de ${expected}; se vuelve a pedir`,
      );
    }
    const { records, bookCount } = fetchPage(s, start, expected);
    refetched += 1;
    writeFileSync(file, gzipSync(JSON.stringify(records)));
    if (bookCount) books[name] = bookCount;
    else delete books[name];
    writeFileSync(BOOKS_FILE, JSON.stringify(books, null, 1));
    saved += records.length;
    booksSkipped += bookCount;
  }
  console.log(
    `[pubmed-${subsetKey}] ${part.tag}: ${saved + booksSkipped}/${total}`,
  );
}
if (saved + booksSkipped !== total)
  throw new Error(
    `Guardados ${saved} + libros ${booksSkipped} = ${saved + booksSkipped}; la búsqueda completa dice ${total}`,
  );

// Si ninguna página hubo que volver a pedir, el corpus es el de la descarga
// original: se conserva su fecha y la revalidación queda aparte.
const metaPath = cacheDir(subset.cache, 'meta.json');
const previous = existsSync(metaPath)
  ? JSON.parse(readFileSync(metaPath, 'utf8'))
  : null;
const now = nowIso();
const unchanged =
  previous && refetched === 0 && previous.records === saved ? previous : null;
writeJson(metaPath, {
  source: subset.cache,
  name: `${subset.name} (metadatos e indexación MeSH de NLM)`,
  publisher: 'U.S. National Library of Medicine (indexación MeSH de MEDLINE)',
  license:
    'Metadatos bibliográficos e indexación MeSH de MEDLINE (NLM); no se copia texto de los artículos',
  licenseUrl:
    'https://www.nlm.nih.gov/databases/download/terms_and_conditions.html',
  homepage: 'https://pubmed.ncbi.nlm.nih.gov/',
  query: subset.term,
  partitions: parts.map((p) => p.range),
  esearchCount: total,
  records: saved,
  booksSkipped,
  retrievedAt: unchanged ? unchanged.retrievedAt : now,
  ...(unchanged ? { revalidatedAt: now } : {}),
});
console.log(
  JSON.stringify({
    subset: subsetKey,
    total,
    saved,
    booksSkipped,
    partitions: parts.length,
  }),
);
