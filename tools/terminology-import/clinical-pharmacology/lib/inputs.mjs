// Lectura de lo YA descargado (sin red): productos de CIMA, maestra ATC, LINAME
// y vademécum, y el universo de ATC 5 que se busca en las demás fuentes.

import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { atcMasterRows, cimaProduct, groupByAtc5, isAtc5 } from './cima.mjs';
import { listJson, readJsonIfExists, retrievedAtOf } from './cli.mjs';
import { loadLiname, loadVademecumAtc } from './liname.mjs';
import { CIMA_SHARED_CACHE, cpCache, rxnavByAtcPath, rxnavConceptPath } from './paths.mjs';
import { RXNAV_LICENSE, atcBridge, parseProperties, parseRelatedIn, parseRelatedPin, parseRxcuiByAtc } from './rxnorm.mjs';

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

/** Universo de ATC 5: CIMA (productos y maestra) ∪ LINAME ∪ vademecum. Con el origen de cada código. */
export function atcUniverse({ products, master, liname, vademecum }) {
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
  return new Map([...origin.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([c, s]) => [c, [...s].sort()]));
}

export function readAllInputs() {
  const { rows, products } = readCimaProducts();
  const master = readAtcMaster();
  const liname = loadLiname();
  const vademecum = loadVademecumAtc();
  return { rows, products, master, liname, vademecum, universe: atcUniverse({ products, master, liname, vademecum }) };
}

/** Puente RxNav de un ATC desde la caché v2 (sin red). `null` si ese ATC nunca se consultó. */
export function readBridge(atc) {
  const byAtcFile = rxnavByAtcPath(atc);
  if (!existsSync(byAtcFile)) return null;
  const files = [byAtcFile];
  const get = (rxcui, kind) => {
    const path = rxnavConceptPath(rxcui, kind);
    if (!existsSync(path)) return undefined;
    files.push(path);
    return readJsonIfExists(path);
  };
  const r = { byAtc: readJsonIfExists(byAtcFile), properties: {}, relatedIn: {}, relatedPin: {}, unii: {} };
  const props = (id) => (r.properties[id] ??= get(id, 'properties'));
  const ingredients = new Set();
  for (const id of parseRxcuiByAtc(r.byAtc)) {
    const p = parseProperties(props(id));
    if (p?.tty === 'IN' || p?.tty === 'PIN') ingredients.add(id);
    else if (p?.tty === 'MIN') {
      r.relatedIn[id] = get(id, 'related-in');
      for (const i of parseRelatedIn(r.relatedIn[id])) ingredients.add(i);
    }
  }
  for (const id of ingredients) {
    const p = parseProperties(props(id));
    r.unii[id] = get(id, 'unii');
    if (p?.tty === 'IN') {
      r.relatedPin[id] = get(id, 'related-pin');
      for (const pin of parseRelatedPin(r.relatedPin[id])) r.unii[pin.rxcui] = get(pin.rxcui, 'unii');
    }
  }
  const retrievedAt = files.map(retrievedAtOf).sort().at(-1);
  return { ...atcBridge(atc, r), source: 'nlm-rxnav', retrievedAt, license: RXNAV_LICENSE };
}
