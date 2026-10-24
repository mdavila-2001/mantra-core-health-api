#!/usr/bin/env node
// =============================================================================
// Etiquetas en castellano de Wikidata (CC0) para los conceptos del corpus de
// diccionarios, por identificador declarado (ver lib/wikidata-es.mjs).
// Salida: glossary-data-build/dictionaries/ndjson/wikidata-es-labels.ndjson,
// que load-dictionaries.mjs suma como designaciones ES si está presente.
//
// Verificación que aborta: cada propiedad usada se contrasta con su etiqueta
// inglesa en Wikidata (`assertEntityLabels`, la misma del glosario ES).
//
// NO CORRIDO todavía en la nube: la sesión que lo escribió (2026-10-24) no tenía
// salida a query.wikidata.org ni a www.wikidata.org (403 de la política de red).
// Uso: node tools/terminology-import/dictionaries/import-wikidata-es-labels.mjs [--props P1554,P7963]
// Necesita el corpus (build-dictionaries.mjs o pack-dictionaries-data.mjs --unpack) para los taxones.
// =============================================================================

import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { HttpClient, cacheDir, nowIso, readNdjson, writeJson, writeNdjson } from '../lib/glossary-es/common.mjs';
import { SPARQL_ENDPOINT, assertEntityLabels, entityLabelsUrl } from '../lib/glossary-es/wikidata.mjs';
import { ID_PROPERTIES, RESTRICT_TO_CORPUS, esLabelRows, expectedLabels, labelsSparql, wikidataValue } from './lib/wikidata-es.mjs';
import { NDJSON_DIR } from './lib/paths.mjs';

const args = process.argv.slice(2);
const PROPS = args.includes('--props') ? args[args.indexOf('--props') + 1].split(',') : Object.keys(ID_PROPERTIES);
const BATCH = 300;
const http = new HttpClient({ concurrency: 1, minDelayMs: 1000 });
const CACHE = cacheDir('wikidata-dictionaries');

async function main() {
  const retrievedAt = nowIso();
  const expected = expectedLabels();
  assertEntityLabels(await http.getJsonCached(entityLabelsUrl(Object.keys(expected)), join(CACHE, 'entity-labels.json')), expected);
  const rows = [];
  const perProperty = {};
  for (const prop of PROPS) {
    if (!ID_PROPERTIES[prop]) throw new Error(`Propiedad desconocida: ${prop}`);
    const layer = RESTRICT_TO_CORPUS[prop];
    let batches = [null];
    if (layer) {
      const p = join(NDJSON_DIR, `${layer}.ndjson`);
      if (!existsSync(p)) throw new Error(`Falta ${p}: corré build-dictionaries.mjs o pack-dictionaries-data.mjs --unpack`);
      const ids = readNdjson(p).map((r) => wikidataValue(r.code));
      batches = [];
      for (let i = 0; i < ids.length; i += BATCH) batches.push(ids.slice(i, i + BATCH));
    }
    let n = 0;
    for (const [i, values] of batches.entries()) {
      const cache = join(CACHE, values ? `sparql-es-${prop}-${i}.json` : `sparql-es-${prop}.json`);
      const json = await http.getJsonCached(`${SPARQL_ENDPOINT}?format=json&query=${encodeURIComponent(labelsSparql(prop, values))}`, cache);
      const r = esLabelRows(json, prop, retrievedAt);
      n += r.length;
      rows.push(...r);
    }
    perProperty[prop] = n;
    console.log(`[wikidata-es] ${prop} (${ID_PROPERTIES[prop].label}): ${n} nombres ES`);
  }
  await writeNdjson(join(NDJSON_DIR, 'wikidata-es-labels.ndjson'), rows);
  writeJson(join(NDJSON_DIR, 'wikidata-es-labels.meta.json'), { retrievedAt, endpoint: SPARQL_ENDPOINT, license: 'CC0 1.0', perProperty, http: http.stats }, true);
  console.log(JSON.stringify({ perProperty, total: rows.length }, null, 2));
}

main().catch((err) => {
  console.error('ERROR FATAL en import-wikidata-es-labels:', err);
  process.exitCode = 1;
});
