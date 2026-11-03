#!/usr/bin/env node
// =============================================================================
// Catálogo de análisis · LOINC desde NLM Clinical Table Search Service (CTSS).
//
// Complementa a fetch-loinc-txfhir.mjs con lo que tx.fhir.org no devuelve en
// sus expansiones:
//   - por término: COMPONENT, PROPERTY, METHOD_TYP, RELATEDNAMES2, CONSUMER_NAME,
//     datatype y `units` (unidades UCUM del archivo «panels and forms» de LOINC,
//     con su rango normal SÓLO cuando la fuente lo publica);
//   - con `--panels`: la definición de cada panel incluido en el catálogo
//     (`/loinc_form_definitions`): sus miembros en orden, anidados.
//
// Enumeración: árbol de prefijos sobre LOINC_NUM (`sf=LOINC_NUM` es búsqueda
// por prefijo); cada hoja con total ≤ 7 500 se pagina con count=500 (límite
// documentado por NLM: offset+count ≤ 7 500). Caché en disco por pedido.
//
// Uso:
//   NODE_USE_ENV_PROXY=1 node tools/terminology-import/lab-tests/fetch-loinc-ctss.mjs
//   NODE_USE_ENV_PROXY=1 node tools/terminology-import/lab-tests/fetch-loinc-ctss.mjs --panels   # después de fetch-loinc-txfhir.mjs
// =============================================================================

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { BUILD_DIR, USER_AGENT, ensureDir, nowIso, sleep, writeJson } from '../lib/glossary-es/common.mjs';
import { loincDomain } from './lib/domains.mjs';

const API = 'https://clinicaltables.nlm.nih.gov/api/loinc_items/v3/search';
const FORMS = 'https://clinicaltables.nlm.nih.gov/loinc_form_definitions';
const OUT_DIR = ensureDir(join(BUILD_DIR, 'lab-tests-sources', 'loinc-ctss'));
const CACHE = ensureDir(join(OUT_DIR, 'cache'));
const EF = ['COMPONENT', 'PROPERTY', 'METHOD_TYP', 'RELATEDNAMES2', 'CONSUMER_NAME', 'datatype', 'units'];
const PAGE = 500;
const LEAF_MAX = 7500;
const MIN_INTERVAL_MS = 150;

let last = 0;
let requests = 0;
let cacheHits = 0;

async function getJson(url) {
  const file = join(CACHE, `${createHash('sha1').update(url).digest('hex')}.json`);
  if (existsSync(file)) {
    cacheHits += 1;
    return JSON.parse(readFileSync(file, 'utf8'));
  }
  for (let attempt = 1; ; attempt += 1) {
    const wait = last + MIN_INTERVAL_MS - Date.now();
    if (wait > 0) await sleep(wait);
    last = Date.now();
    requests += 1;
    let res;
    try {
      res = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' } });
    } catch (err) {
      if (attempt >= 6) throw err;
      await sleep(1500 * attempt);
      continue;
    }
    if (res.status === 429 || res.status >= 500) {
      if (attempt >= 6) throw new Error(`HTTP ${res.status}: ${url}`);
      await sleep(2000 * attempt);
      continue;
    }
    // 404 en /loinc_form_definitions = el panel no tiene definición publicada: se registra como faltante.
    if (res.status === 404 && url.startsWith(FORMS)) {
      writeFileSync(file, 'null');
      return null;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
    const json = await res.json();
    writeFileSync(file, JSON.stringify(json));
    return json;
  }
}

const searchUrl = (prefix, offset) => `${API}?${new URLSearchParams({ terms: prefix, sf: 'LOINC_NUM', count: String(PAGE), offset: String(offset), ef: EF.join(',') })}`;

async function crawlItems() {
  const items = {};
  let leaves = 0;
  let sumOfTotals = 0;
  const visit = async (prefix) => {
    const first = await getJson(searchUrl(prefix, 0));
    const total = first[0];
    if (total > LEAF_MAX) {
      for (let d = 0; d <= 9; d += 1) await visit(`${prefix}${d}`);
      await visit(`${prefix}-`);
      return;
    }
    leaves += 1;
    sumOfTotals += total;
    const ingest = ([, codes, ef]) => {
      codes.forEach((code, i) => {
        items[code] ??= Object.fromEntries(EF.map((f) => [f, ef?.[f]?.[i] ?? null]));
      });
    };
    ingest(first);
    for (let offset = PAGE; offset < total; offset += PAGE) ingest(await getJson(searchUrl(prefix, offset)));
  };
  for (let d = 1; d <= 9; d += 1) await visit(String(d));
  return { items, leaves, sumOfTotals };
}

/** Miembros directos de cada panel/sección de una definición de formulario (recursivo). */
export function panelMembers(def) {
  const out = {};
  const walk = (code, items) => {
    if (!Array.isArray(items) || !items.length) return;
    out[code] ??= items
      .filter((it) => it.questionCode)
      .map((it, i) => ({ loinc: it.questionCode, sequence: i + 1, displayNameForForm: it.question ?? null, units: (it.units ?? []).map((u) => u.code ?? u.name).filter(Boolean) }));
    for (const it of items) if (it.questionCode && it.items?.length) walk(it.questionCode, it.items);
  };
  walk(def.code, def.items);
  return out;
}

async function crawlPanels() {
  const tx = JSON.parse(readFileSync(join(BUILD_DIR, 'lab-tests-sources', 'loinc-txfhir', 'loinc-txfhir.json'), 'utf8'));
  const panelCodes = Object.entries(tx.terms)
    .filter(([, t]) => /^PANEL\./.test(t.class) && loincDomain(t.class, tx.classes[t.class]?.classType).domain)
    .map(([code]) => code)
    .sort();
  const panels = {};
  const missing = [];
  for (const code of panelCodes) {
    const def = await getJson(`${FORMS}?loinc_num=${encodeURIComponent(code)}`);
    if (!def || !def.items) {
      missing.push(code);
      continue;
    }
    Object.assign(panels, panelMembers(def));
  }
  return { panelCodes: panelCodes.length, withDefinition: panelCodes.length - missing.length, missing, panels };
}

async function main() {
  const startedAt = nowIso();
  if (process.argv.includes('--panels')) {
    const r = await crawlPanels();
    writeJson(join(OUT_DIR, 'loinc-ctss-panels.json'), { source: FORMS, startedAt, finishedAt: nowIso(), requests, cacheHits, ...r });
    console.log(JSON.stringify({ panelCodes: r.panelCodes, withDefinition: r.withDefinition, missing: r.missing.length, panelsWithMembers: Object.keys(r.panels).length, requests, cacheHits }, null, 2));
    return;
  }
  const { items, leaves, sumOfTotals } = await crawlItems();
  writeJson(join(OUT_DIR, 'loinc-ctss-items.json'), { source: API, fields: EF, startedAt, finishedAt: nowIso(), requests, cacheHits, leaves, sumOfTotals, items });
  console.log(JSON.stringify({ items: Object.keys(items).length, leaves, sumOfTotals, requests, cacheHits }, null, 2));
}

if (process.argv[1]?.endsWith('fetch-loinc-ctss.mjs')) {
  main().catch((err) => {
    console.error('ERROR FATAL en fetch-loinc-ctss:', err);
    process.exitCode = 1;
  });
}
