#!/usr/bin/env node
// =============================================================================
// Etapa 0b · códigos ISO 3166-2 (subdivisiones) con sus nombres en inglés y español, desde Wikidata (datos
// estructurados: CC0 1.0, https://www.wikidata.org/wiki/Wikidata:Licensing). CLDR no trae nombres de subdivisiones.
//
// Una página de SPARQL por pedido (≤ 1 pedido/s, reintentos con backoff ante 429/5xx), guardada TAL CUAL en
// <GLOSSARY_BUILD_DIR>/raw/wikidata/iso3166-2-pNNN.json con su SHA-256 en raw/manifest.json. La consulta ordena por
// (código, ítem) para que la paginación sea estable. Un código que Wikidata asigna a más de un ítem NO se carga (ver corpus).
//
//   node tools/terminology-import/interop-vocab/fetch-wikidata.mjs [--force]
// =============================================================================

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { RAW_DIR, USER_AGENT, download, nowIso, readJson, writeJson } from './lib/common.mjs';

export const WD_PAGE_SIZE = 2000;
export const WD_QUERY = (offset) =>
  `SELECT ?item ?code ?labelEn ?labelEs WHERE {
  ?item wdt:P300 ?code .
  OPTIONAL { ?item rdfs:label ?labelEn FILTER(LANG(?labelEn) = "en") }
  OPTIONAL { ?item rdfs:label ?labelEs FILTER(LANG(?labelEs) = "es") }
} ORDER BY ?code ?item LIMIT ${WD_PAGE_SIZE} OFFSET ${offset}`;

const FORCE = process.argv.includes('--force');
const manifestPath = join(RAW_DIR, 'manifest.json');
const manifest = existsSync(manifestPath) ? readJson(manifestPath) : { files: {} };

if (process.argv[1] && process.argv[1].endsWith('fetch-wikidata.mjs')) {
  const pages = [];
  for (let page = 0; ; page++) {
    const dest = join(RAW_DIR, 'wikidata', `iso3166-2-p${String(page).padStart(3, '0')}.json`);
    const url = `https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(WD_QUERY(page * WD_PAGE_SIZE))}`;
    let rec = pages.length === page ? null : null;
    if (!existsSync(dest) || FORCE) {
      console.log(`↓ página ${page}`);
      const r = await download(url, dest, { headers: { Accept: 'application/sparql-results+json' }, minDelayMs: 1100 });
      rec = { file: `wikidata/iso3166-2-p${String(page).padStart(3, '0')}.json`, bytes: r.bytes, sha256: r.sha256, retrievedAt: nowIso(), url };
    } else {
      console.log(`= página ${page} ya bajada`);
    }
    const { default: fs } = await import('node:fs');
    const bindings = JSON.parse(fs.readFileSync(dest, 'utf8')).results.bindings.length;
    if (rec) pages.push(rec);
    else {
      const prior = manifest.files['wikidata-iso3166-2']?.pages?.find((p) => p.file === `wikidata/iso3166-2-p${String(page).padStart(3, '0')}.json`);
      if (!prior) throw new Error(`página ${page} bajada pero sin registro en el manifiesto; corré con --force`);
      pages.push(prior);
    }
    if (bindings < WD_PAGE_SIZE) break;
  }
  manifest.files['wikidata-iso3166-2'] = {
    key: 'wikidata-iso3166-2',
    name: 'Wikidata — propiedad P300 (código ISO 3166-2)',
    version: `consulta del ${pages[0].retrievedAt.slice(0, 10)}`,
    url: 'https://query.wikidata.org/sparql',
    query: WD_QUERY('<offset>'),
    userAgent: USER_AGENT,
    license: 'CC0-1.0 (https://www.wikidata.org/wiki/Wikidata:Licensing)',
    retrievedAt: pages[0].retrievedAt,
    sha256: pages.map((p) => p.sha256).join('+'),
    pages,
  };
  writeJson(manifestPath, manifest, true);
  console.log(`Listo: ${pages.length} páginas`);
}
