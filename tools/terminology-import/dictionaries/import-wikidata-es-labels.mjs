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
// NO CORRIDO todavía: la sesión que lo escribió (2026-10-24) no tenía salida a
// query.wikidata.org ni a www.wikidata.org (403 de la política de red).
// Uso: node tools/terminology-import/dictionaries/import-wikidata-es-labels.mjs
// =============================================================================

import { join } from 'node:path';
import { HttpClient, cacheDir, nowIso, writeJson, writeNdjson } from '../lib/glossary-es/common.mjs';
import { SPARQL_ENDPOINT, assertEntityLabels, entityLabelsUrl } from '../lib/glossary-es/wikidata.mjs';
import { ID_PROPERTIES, esLabelRows, expectedLabels, labelsSparql } from './lib/wikidata-es.mjs';
import { NDJSON_DIR } from './lib/paths.mjs';

const http = new HttpClient({ concurrency: 1, minDelayMs: 1000 });
const CACHE = cacheDir('wikidata-dictionaries');

async function main() {
  const retrievedAt = nowIso();
  const expected = expectedLabels();
  assertEntityLabels(await http.getJsonCached(entityLabelsUrl(Object.keys(expected)), join(CACHE, 'entity-labels.json')), expected);
  const rows = [];
  const perProperty = {};
  for (const prop of Object.keys(ID_PROPERTIES)) {
    const json = await http.getJsonCached(`${SPARQL_ENDPOINT}?format=json&query=${encodeURIComponent(labelsSparql(prop))}`, join(CACHE, `sparql-es-${prop}.json`));
    const r = esLabelRows(json, prop, retrievedAt);
    perProperty[prop] = r.length;
    rows.push(...r);
  }
  await writeNdjson(join(NDJSON_DIR, 'wikidata-es-labels.ndjson'), rows);
  writeJson(join(NDJSON_DIR, 'wikidata-es-labels.meta.json'), { retrievedAt, endpoint: SPARQL_ENDPOINT, license: 'CC0 1.0', perProperty, http: http.stats }, true);
  console.log(JSON.stringify({ perProperty, total: rows.length }, null, 2));
}

main().catch((err) => {
  console.error('ERROR FATAL en import-wikidata-es-labels:', err);
  process.exitCode = 1;
});
