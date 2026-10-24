#!/usr/bin/env node
// =============================================================================
// Farmacología clínica · etapa 1b (red): puente ATC 5 → RxCUI → UNII (RxNav).
//
// Para cada ATC 5 del universo (CIMA ∪ maestra ATC ∪ LINAME ∪ vademecum):
//   rxcui.json?idtype=ATC&id=<ATC5>, properties de cada RxCUI, related?tty=IN
//   de los MIN, y property?propName=UNII_CODE de cada ingrediente.
// Todo por código. Caché en clinical-pharmacology/cache/rxnav/<ATC5>/.
// RxNav pide no superar 20 pedidos/s: acá concurrencia 4 y 150 ms por carril.
//
// Uso: node tools/terminology-import/clinical-pharmacology/fetch-rxnorm.mjs [--limit-atc N]
// =============================================================================

import { HttpClient, mapPool, progressLogger, writeJson } from '../lib/glossary-es/common.mjs';
import { parseArgs } from './lib/cli.mjs';
import { readAllInputs } from './lib/inputs.mjs';
import { cpCache, rxnavPath } from './lib/paths.mjs';
import { atcBridge, parseProperties, parseRelatedIn, parseRxcuiByAtc, propertiesUrl, relatedInUrl, rxcuiByAtcUrl, uniiUrl } from './lib/rxnorm.mjs';

const { opt } = parseArgs();
const LIMIT_ATC = Number(opt('--limit-atc', 0));
const http = new HttpClient({ concurrency: 4, minDelayMs: 150 });

/** Descarga (o lee de caché) las respuestas de un ATC y devuelve el puente. `build-monographs` lo relee sin red (`readBridge`). */
async function bridgeFor(atc) {
  const r = { byAtc: await http.getJsonCached(rxcuiByAtcUrl(atc), rxnavPath(atc, 'by-atc'), { allow404: true }), properties: {}, relatedIn: {}, unii: {} };
  for (const id of parseRxcuiByAtc(r.byAtc)) {
    r.properties[id] = await http.getJsonCached(propertiesUrl(id), rxnavPath(atc, 'properties', id), { allow404: true });
    const p = parseProperties(r.properties[id]);
    if (p?.tty === 'MIN') r.relatedIn[id] = await http.getJsonCached(relatedInUrl(id), rxnavPath(atc, 'related-in', id), { allow404: true });
  }
  const ingredients = new Set();
  for (const id of Object.keys(r.properties)) {
    const p = parseProperties(r.properties[id]);
    if (p?.tty === 'IN' || p?.tty === 'PIN') ingredients.add(id);
  }
  for (const resp of Object.values(r.relatedIn)) for (const i of parseRelatedIn(resp)) ingredients.add(i);
  for (const id of ingredients) r.unii[id] = await http.getJsonCached(uniiUrl(id), rxnavPath(atc, 'unii', id), { allow404: true });
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
