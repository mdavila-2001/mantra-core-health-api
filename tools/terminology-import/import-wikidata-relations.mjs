#!/usr/bin/env node
// =============================================================================
// ETL etapa 1 (fetch → NDJSON): relaciones clínicas del glosario desde Wikidata.
//
// Por cada propiedad de `RELATION_PROPERTIES` (síntomas P780, medicamento o
// terapia P2176, especialidad P1995, tratamiento posible P924, exámenes P923,
// localización anatómica P927) baja las aristas enfermedad → destino cuyo
// destino tiene etiqueta en castellano, con los códigos de ambos lados (CIE-10,
// ICD-10-CM, ATC, MeSH). NO resuelve contra el glosario: eso lo hace
// `lib/glossary-es/corpus.mjs` al armar shards o al cargar la base, así las dos
// salidas ven exactamente las mismas relaciones.
//
// Antes de consultar, contrasta cada id de propiedad con su etiqueta inglesa en
// Wikidata (`assertEntityLabels`): un id equivocado aborta la corrida.
// Salida: `ndjson/wikidata-relaciones.ndjson` (+ `.meta.json`).
// =============================================================================

import { join } from 'node:path';
import { HttpClient, cacheDir, ndjsonPath, nowIso, writeJson, writeNdjson } from './lib/glossary-es/common.mjs';
import { SPARQL_ENDPOINT, assertEntityLabels, entityLabelsUrl } from './lib/glossary-es/wikidata.mjs';
import { IDENTITY_SPARQL, RELATION_PROPERTIES, conceptIdentities, relationEdges, relationSparql } from './lib/glossary-es/wikidata-relations.mjs';

const http = new HttpClient({ concurrency: 1, minDelayMs: 1500 });
const CACHE = cacheDir('wikidata');

async function main() {
  const t0 = Date.now();
  const retrievedAt = nowIso();
  const expected = { P494: 'ICD-10 ID', P4229: 'ICD-10-CM', P267: 'ATC code', P486: 'MeSH descriptor ID' };
  for (const [p, spec] of Object.entries(RELATION_PROPERTIES)) expected[p] = spec.label;
  assertEntityLabels(await http.getJsonCached(entityLabelsUrl(Object.keys(expected)), join(CACHE, 'entity-labels-relations.json')), expected);

  const edges = [];
  const porPropiedad = {};
  for (const prop of Object.keys(RELATION_PROPERTIES)) {
    const url = `${SPARQL_ENDPOINT}?format=json&query=${encodeURIComponent(relationSparql(prop))}`;
    const json = await http.getJsonCached(url, join(CACHE, `sparql-relations-${prop}-v2.json`));
    const list = relationEdges(json, prop).map((e) => ({ ...e, retrievedAt }));
    porPropiedad[prop] = { label: RELATION_PROPERTIES[prop].label, bindings: json.results.bindings.length, aristas: list.length };
    console.log(`[wikidata-relaciones] ${prop} (${RELATION_PROPERTIES[prop].label}): ${list.length} aristas`);
    edges.push(...list);
  }
  await writeNdjson(ndjsonPath('wikidata-relaciones'), edges);

  // Identidades: un ítem con CIE-10 y MeSH a la vez une la ficha CIE-10-ES con la de MedlinePlus.
  const idJson = await http.getJsonCached(`${SPARQL_ENDPOINT}?format=json&query=${encodeURIComponent(IDENTITY_SPARQL)}`, join(CACHE, 'sparql-identities-icd-v2.json'));
  const identities = conceptIdentities(idJson);
  await writeNdjson(ndjsonPath('wikidata-identidades'), identities);
  console.log(`[wikidata-relaciones] ítems con CIE-10 (identidades): ${identities.length}`);
  const meta = {
    source: 'wikidata',
    retrievedAt,
    sparql: SPARQL_ENDPOINT,
    license: 'CC0 1.0',
    aristas: edges.length,
    identidades: identities.length,
    porPropiedad,
    regla: 'Sólo aristas cuyo destino tiene etiqueta en castellano. La resolución contra el glosario es por código idéntico (CIE-10, ICD-10-CM, ATC, MeSH, Q-id de anatomía) y la hace corpus.mjs.',
    segundos: Math.round((Date.now() - t0) / 1000),
  };
  writeJson(ndjsonPath('wikidata-relaciones').replace(/\.ndjson$/, '.meta.json'), meta, true);
  console.log(JSON.stringify(meta, null, 2));
}

main().catch((err) => {
  console.error('ERROR FATAL en import-wikidata-relations:', err);
  process.exitCode = 1;
});
