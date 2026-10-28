#!/usr/bin/env node
// =============================================================================
// EU · descarga de los archivos OFICIALES que NO son el recorrido de /udi
// (ese es `fetch-eudamed.mjs`): EMDN (Excel de la Comisión), EUDAMED /reference
// y /actors (Data Lake) y la BD/RDM + CND del Ministero della Salute.
// Registra procedencia (URL, Last-Modified, bytes, SHA-256, fecha) en
// `<BUILD>/official/official.json`. Reanudable.
//
//   node fetch-official.mjs [--only=emdn,eudamed-reference,eudamed-actors,it] [--force]
//
// Verificado el 2026-10-27:
//  - EMDN: la página de la Comisión ya no enlaza el Excel; lo enlaza la app
//    https://webgate.ec.europa.eu/dyna2/emdn/ → `build/EMDN v2026_EN..xlsx`.
//  - BD/RDM: ficha https://www.dati.salute.gov.it/it/dataset/dispositivi-medici/ enlaza
//    `DISPO_RDM_1_<AAAAMMDD>_csv.zip` (se descubre en la ficha, no se fija a mano).
// =============================================================================

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { cacheDir, ensureDir, httpFetch, nowIso, readJson } from './lib/common.mjs';
import {
  assertSafeNext,
  buildUrl,
  parsePage,
} from './lib/sources/eudamed-datalake.mjs';

const OFFICIAL_DIR = ensureDir(cacheDir('..', 'official'));
const REGISTRY = join(OFFICIAL_DIR, 'official.json');
const args = process.argv.slice(2);
const FORCE = args.includes('--force');
const only = args.find((a) => a.startsWith('--only='))?.slice(7).split(',') ?? null;
const registry = existsSync(REGISTRY) ? readJson(REGISTRY) : {};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const sha256 = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');
const save = () => writeFileSync(REGISTRY, `${JSON.stringify(registry, null, 2)}\n`);

async function fetchOne(key, url, name, { timeoutS = 1200 } = {}) {
  const file = join(OFFICIAL_DIR, name);
  if (!FORCE && registry[key] && existsSync(file)) {
    console.log(`= ${key} (ya descargado)`);
    return registry[key];
  }
  let res;
  for (let attempt = 1; attempt <= 5; attempt++) {
    ensureDir(join(file, '..'));
    res = httpFetch(url, { outFile: file, timeoutS });
    if (res.ok) break;
    console.warn(`[intento ${attempt}] ${res.status ?? res.error} ${url}`);
    await sleep(Math.min(60_000, 3_000 * 2 ** attempt));
  }
  if (!res.ok) {
    registry[key] = { url, error: `HTTP ${res.status ?? res.error}`, at: nowIso() };
    save();
    return registry[key];
  }
  registry[key] = {
    url,
    file: name,
    bytes: statSync(file).size,
    sha256: sha256(file),
    retrievedAt: nowIso(),
  };
  save();
  console.log(`+ ${key} ${registry[key].bytes} B`);
  return registry[key];
}

/** Última página de una paginación por nextLink, guardada como un único JSON {value:[…]}. */
async function fetchAllPages(key, firstUrl, name, delayMs = 1000) {
  const file = join(OFFICIAL_DIR, name);
  if (!FORCE && registry[key] && existsSync(file)) {
    console.log(`= ${key} (ya descargado)`);
    return;
  }
  const rows = [];
  let url = firstUrl;
  let pages = 0;
  const tmp = `${file}.page`;
  while (url) {
    let ok = false;
    for (let attempt = 1; attempt <= 6 && !ok; attempt++) {
      const res = httpFetch(url, { headers: { Accept: 'application/json' }, outFile: tmp, timeoutS: 180 });
      if (res.ok) {
        const { rows: r, nextLink } = parsePage(JSON.parse(readFileSync(tmp, 'utf8')));
        rows.push(...r);
        url = nextLink ? assertSafeNext(nextLink, url) : null;
        ok = true;
      } else {
        console.warn(`[intento ${attempt}] ${res.status ?? res.error} ${url.slice(0, 120)}`);
        await sleep(Math.min(60_000, 2_000 * 2 ** attempt));
      }
    }
    if (!ok) throw new Error(`${key}: 6 intentos fallidos`);
    pages += 1;
    if (pages % 10 === 0) console.log(`  ${key}: ${pages} páginas, ${rows.length} filas`);
    await sleep(delayMs);
  }
  writeFileSync(file, JSON.stringify({ value: rows }));
  registry[key] = {
    url: firstUrl,
    file: name,
    pages,
    rows: rows.length,
    bytes: statSync(file).size,
    sha256: sha256(file),
    retrievedAt: nowIso(),
  };
  save();
  console.log(`+ ${key} ${rows.length} filas en ${pages} páginas`);
}

const JOBS = {
  async emdn() {
    await fetchOne('emdn', 'https://webgate.ec.europa.eu/dyna2/emdn/build/EMDN%20v2026_EN..xlsx', 'emdn/EMDN_v2026_EN.xlsx');
  },
  async 'eudamed-reference'() {
    await fetchAllPages('eudamed-reference', buildUrl('reference', { LANGUAGE: 'en' }), 'eudamed/reference-en.json');
  },
  async 'eudamed-actors'() {
    await fetchAllPages('eudamed-actors', buildUrl('actors', {}), 'eudamed/actors.json');
  },
  async it() {
    const page = 'https://www.dati.salute.gov.it/it/dataset/dispositivi-medici/';
    const html = join(OFFICIAL_DIR, 'it/ficha-dispositivi-medici.html');
    ensureDir(join(html, '..'));
    const r = httpFetch(page, { outFile: html });
    if (!r.ok) throw new Error(`ficha BD/RDM: HTTP ${r.status}`);
    const link = /href="(\/sites\/default\/files\/opendata\/DISPO_RDM_1_\d{8}_csv\.zip)"/.exec(readFileSync(html, 'utf8'))?.[1];
    if (!link) throw new Error('la ficha de la BD/RDM ya no enlaza DISPO_RDM_1_*_csv.zip');
    const origin = 'https://www.dati.salute.gov.it';
    await fetchOne('it-bdrdm', origin + link, `it/${link.split('/').pop()}`);
    const cndPage = httpFetch(
      'https://www.dati.salute.gov.it/it/dataset/classificazione-nazionale-dei-dispositivi-medici-cnd/',
      { outFile: join(OFFICIAL_DIR, 'it/ficha-cnd.html') },
    );
    if (!cndPage.ok) throw new Error(`ficha CND: HTTP ${cndPage.status}`);
    const cnd = /href="(\/sites\/default\/files\/opendata\/DISPO_RDM_74_\d{8}\.csv)"/.exec(
      readFileSync(join(OFFICIAL_DIR, 'it/ficha-cnd.html'), 'utf8'),
    )?.[1];
    if (!cnd) throw new Error('la ficha de la CND ya no enlaza DISPO_RDM_74_*.csv');
    await fetchOne('it-cnd', origin + cnd, `it/${cnd.split('/').pop()}`);
    await fetchOne('it-dict-bdrdm', `${origin}/dati/documenti/ID_1_16_Dataset_Dispositivi_medici_v2.0.pdf`, 'it/dict-dispositivi-medici-v2.0.pdf');
    await fetchOne('it-dict-cnd', `${origin}/dati/documenti/Dataset_CND_v2.0.pdf`, 'it/dict-cnd-v2.0.pdf');
  },
};

for (const [name, job] of Object.entries(JOBS)) {
  if (only && !only.includes(name)) continue;
  await job();
}
console.log(`official.json → ${REGISTRY}`);
