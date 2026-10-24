// Lectura de lo YA descargado (sin red): productos de CIMA, maestra ATC, LINAME
// y vademécum, y el universo de ATC 5 que se busca en las demás fuentes.

import { existsSync, readFileSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';

import { readNdjson } from '../../lib/glossary-es/common.mjs';

import { atcMasterRows, cimaProduct, groupByAtc5, isAtc5 } from './cima.mjs';
import { listJson, readJsonIfExists, retrievedAtOf } from './cli.mjs';
import { loadLiname, loadVademecumAtc } from './liname.mjs';
import { CIMA_SHARED_CACHE, cpCache, cpOut } from './paths.mjs';
import { RXNAV_LICENSE, atcBridge } from './rxnorm.mjs';

/** Productos de CIMA desde la caché compartida (listado + detalle). Vacío si nunca se bajó. */
export function readCimaProducts() {
  const listDir = join(CIMA_SHARED_CACHE, 'list');
  const rows = new Map();
  for (const name of listJson(listDir)) for (const r of readJsonIfExists(join(listDir, name))?.resultados ?? []) rows.set(r.nregistro, r);
  const products = [...rows.values()].map((r) => cimaProduct(r, readJsonIfExists(join(CIMA_SHARED_CACHE, 'detail', `${r.nregistro}.json`)) ?? null));
  return { rows: [...rows.values()], products };
}

export function readAtcMaster() {
  const dir = cpCache('cima', 'maestra-atc');
  return listJson(dir).flatMap((name) => atcMasterRows(readJsonIfExists(join(dir, name))));
}

/** Universo de ATC 5: CIMA (productos y maestra) ∪ LINAME ∪ vademecum ∪ GSRS. Con el origen de cada código. */
export function atcUniverse({ products, master, liname, vademecum, gsrsAtc = new Set() }) {
  const origin = new Map();
  const add = (code, src) => {
    if (!isAtc5(code)) return;
    if (!origin.has(code)) origin.set(code, new Set());
    origin.get(code).add(src);
  };
  for (const code of groupByAtc5(products).byAtc.keys()) add(code, 'cima-medicamentos');
  for (const r of master) add(r.code, 'cima-maestra-atc');
  for (const code of liname.keys()) add(code, 'liname-bo');
  for (const code of vademecum.keys()) add(code, 'vademecum');
  for (const code of gsrsAtc) add(code, 'fda-gsrs');
  return new Map([...origin.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([c, s]) => [c, [...s].sort()]));
}

/** ATC 5 que lista el GSRS (out/gsrs-entries.ndjson de fetch-gsrs.mjs); vacío si no se bajó. */
export function readGsrsAtc() {
  const path = cpOut('gsrs-entries.ndjson');
  if (!existsSync(path)) return new Set();
  return new Set(readNdjson(path).flatMap((e) => e.atc));
}

export function readAllInputs() {
  const { rows, products } = readCimaProducts();
  const master = readAtcMaster();
  const liname = loadLiname();
  const vademecum = loadVademecumAtc();
  const gsrsAtc = readGsrsAtc();
  return { rows, products, master, liname, vademecum, gsrsAtc, universe: atcUniverse({ products, master, liname, vademecum, gsrsAtc }) };
}

/** Puente RxNav de un ATC desde la caché (sin red). `null` si ese ATC nunca se consultó. */
export function readBridge(atc, dir = cpCache('rxnav', atc)) {
  const byAtc = readJsonIfExists(join(dir, 'by-atc.json'));
  if (byAtc === undefined) return null;
  const r = { byAtc, properties: {}, relatedIn: {}, unii: {} };
  for (const name of listJson(dir)) {
    const m = /^(properties|related-in|unii)-(\d+)\.json$/.exec(name);
    if (!m) continue;
    const slot = { properties: 'properties', 'related-in': 'relatedIn', unii: 'unii' }[m[1]];
    r[slot][m[2]] = readJsonIfExists(join(dir, name));
  }
  return { ...atcBridge(atc, r), source: 'nlm-rxnav', retrievedAt: retrievedAtOf(join(dir, 'by-atc.json')), license: RXNAV_LICENSE };
}

/** Informe de medicamentos de la EMA desde la caché (fetch-ema.mjs). `null` si no se bajó. */
export function readEma() {
  const path = cpCache('ema', 'medicines-output-medicines-report_en.xlsx');
  if (!existsSync(path)) return null;
  const XLSX = createRequire(import.meta.url)('xlsx');
  const wb = XLSX.read(readFileSync(path), { type: 'buffer' });
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: null });
  return { rows, retrievedAt: statSync(path).mtime.toISOString() };
}

/**
 * set_id de openFDA → si la etiqueta trae UNII (`openfda.unii`). Recorre las
 * particiones bajadas en streaming. Vacío si openFDA no se bajó.
 */
export async function openFdaSetIndex() {
  const { readdirSync } = await import('node:fs');
  const { zipResults } = await import('./json-stream.mjs');
  const dir = join(cpCache('openfda'), 'label');
  const out = new Map();
  if (!existsSync(dir)) return out;
  for (const zip of readdirSync(dir).filter((n) => n.endsWith('.zip')).sort()) {
    for await (const l of zipResults(join(dir, zip))) {
      if (!l.set_id) continue;
      const has = Array.isArray(l.openfda?.unii) && l.openfda.unii.length > 0;
      out.set(l.set_id, (out.get(l.set_id) ?? false) || has);
    }
  }
  return out;
}

/** Identidades de SPL de DailyMed guardadas por fetch-dailymed.mjs → Map(setId → identidad). */
export function readDailyMedIdentities() {
  const dir = cpCache('dailymed', 'spl-id');
  const out = new Map();
  for (const name of listJson(dir)) {
    const d = readJsonIfExists(join(dir, name));
    if (d?.setId && !d.notFound) out.set(d.setId, d);
  }
  return out;
}
