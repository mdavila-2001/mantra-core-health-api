#!/usr/bin/env node
// =============================================================================
// Farmacología clínica · etapa 1b (red): puente ATC 5 → RxCUI → UNII (RxNav).
//
// Para cada ATC 5 del universo (CIMA ∪ maestra ATC ∪ LINAME ∪ vademecum):
//   rxcui.json?idtype=ATC&id=<ATC5>             RxCUI(s) del ATC
//   rxcui/<id>/properties.json                  TTY (IN, MIN, PIN…)
//   rxcui/<id>/related.json?tty=IN              ingredientes de un MIN
//   rxcui/<id>/related.json?tty=PIN             sales/formas precisas de un IN
//   rxcui/<id>/property.json?propName=UNII_CODE UNII de cada IN/PIN
// Todo por código. Lo que depende de un RxCUI se baja UNA vez aunque lo compartan
// muchos ATC (paracetamol aparece en decenas de combinaciones): caché en
// clinical-pharmacology/cache/rxnav/rxcui/<id>/ y by-atc/<ATC>.json.
// Tope: ≤ 2 pedidos/s (`--rps`), concurrencia 4 (RxNav publica ≤ 20/s).
//
// Uso: node tools/terminology-import/clinical-pharmacology/fetch-rxnorm.mjs [--limit-atc N] [--rps 2]
// =============================================================================

import { mapPool, progressLogger, writeJson } from '../lib/glossary-es/common.mjs';
import { parseArgs } from './lib/cli.mjs';
import { readAllInputs } from './lib/inputs.mjs';
import { PoliteHttpClient } from './lib/polite-http.mjs';
import { cpCache, rxnavByAtcPath, rxnavConceptPath } from './lib/paths.mjs';
import { atcBridge, parseProperties, parseRelatedIn, parseRelatedPin, parseRxcuiByAtc, propertiesUrl, relatedInUrl, relatedPinUrl, rxcuiByAtcUrl, uniiUrl } from './lib/rxnorm.mjs';

const { opt } = parseArgs();
const LIMIT_ATC = Number(opt('--limit-atc', 0));
const http = new PoliteHttpClient({ concurrency: 4, rps: Number(opt('--rps', 2)) });

const URLS = { properties: propertiesUrl, 'related-in': relatedInUrl, 'related-pin': relatedPinUrl, unii: uniiUrl };
const inflight = new Map();
/** Respuesta de RxNav para (kind, rxcui), con caché en disco y sin pedir dos veces lo mismo en vuelo. */
function concept(kind, rxcui) {
  const key = `${kind}:${rxcui}`;
  if (!inflight.has(key)) inflight.set(key, http.getJsonCached(URLS[kind](rxcui), rxnavConceptPath(rxcui, kind), { allow404: true }));
  return inflight.get(key);
}

/** Descarga (o lee de caché) las respuestas de un ATC y devuelve el puente. `build-monographs` lo relee sin red (`readBridge`). */
async function bridgeFor(atc) {
  const r = { byAtc: await http.getJsonCached(rxcuiByAtcUrl(atc), rxnavByAtcPath(atc), { allow404: true }), properties: {}, relatedIn: {}, relatedPin: {}, unii: {} };
  const props = async (id) => (r.properties[id] ??= await concept('properties', id));
  const ingredients = new Set();
  for (const id of parseRxcuiByAtc(r.byAtc)) {
    const p = parseProperties(await props(id));
    if (p?.tty === 'IN' || p?.tty === 'PIN') ingredients.add(id);
    else if (p?.tty === 'MIN') {
      r.relatedIn[id] = await concept('related-in', id);
      for (const i of parseRelatedIn(r.relatedIn[id])) ingredients.add(i);
    }
  }
  for (const id of ingredients) {
    const p = parseProperties(await props(id));
    r.unii[id] = await concept('unii', id);
    if (p?.tty === 'IN') {
      r.relatedPin[id] = await concept('related-pin', id);
      for (const pin of parseRelatedPin(r.relatedPin[id])) r.unii[pin.rxcui] = await concept('unii', pin.rxcui);
    }
  }
  return atcBridge(atc, r);
}

async function main() {
  const t0 = Date.now();
  const { universe } = readAllInputs();
  let codes = [...universe.keys()];
  if (LIMIT_ATC > 0) codes = codes.slice(0, LIMIT_ATC);
  console.log(`=== Farmacología clínica · RxNav: ${codes.length} ATC 5 ===`);
  const bridges = await mapPool(codes, 4, bridgeFor, progressLogger('rxnav', 200));
  const meta = {
    source: 'nlm-rxnav',
    finishedAt: new Date().toISOString(),
    atc5: codes.length,
    conRxcui: bridges.filter((b) => b.rxcuis.length > 0).length,
    conUniiCompleto: bridges.filter((b) => b.complete).length,
    http: http.stats,
    segundos: Math.round((Date.now() - t0) / 1000),
  };
  writeJson(cpCache('rxnav', 'fetch.meta.json'), meta, true);
  console.log(JSON.stringify(meta, null, 2));
}

main().catch((err) => {
  console.error('ERROR FATAL en fetch-rxnorm:', err);
  process.exitCode = 1;
});
