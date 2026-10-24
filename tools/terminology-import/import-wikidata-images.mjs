#!/usr/bin/env node
// =============================================================================
// ETL etapa 1 (fetch → NDJSON): imágenes libres para el glosario desde
// Wikidata + Wikimedia Commons.
//
//  1. SPARQL (https://query.wikidata.org/sparql): ítems con código ICD-10-CM
//     (P4229), CIE-10 OMS (P494), MeSH (P486), ATC (P267) o LOINC (P4338) y con
//     imagen (P18); para ATC también estructura química (P117).
//  2. Commons API (imageinfo + extmetadata, 50 archivos por pedido): URL,
//     miniatura de 330 px, autor, licencia, URL de licencia y página del archivo.
//
// User-Agent descriptivo (política de Wikimedia), 1 pedido a la vez, caché en
// disco. Salida: `ndjson/wikidata-images.ndjson` (una fila por código+imagen).
// La unión con los términos la hacen `build-glossary-shards.mjs` y
// `load-glossary-es.mjs` (ver `lib/glossary-es/enrich.mjs`).
// =============================================================================

import { join } from 'node:path';
import {
  HttpClient, cacheDir, ndjsonPath, nowIso, progressLogger, writeJson, writeNdjson,
} from './lib/glossary-es/common.mjs';
import {
  CODE_PROPERTIES, COMMONS_API, EXPECTED_ENTITY_LABELS, SPARQL_ENDPOINT, assertEntityLabels, commonsImageInfo, entityLabelsUrl, sparqlBindings, sparqlFor,
} from './lib/glossary-es/wikidata.mjs';

const http = new HttpClient({ concurrency: 1, minDelayMs: 1000 });
const CACHE = cacheDir('wikidata');

async function main() {
  const t0 = Date.now();
  const retrievedAt = nowIso();
  console.log('=== Wikidata + Commons → imágenes del glosario ===');

  // Los ids de propiedad se contrastan con su etiqueta en Wikidata antes de consultar.
  assertEntityLabels(await http.getJsonCached(entityLabelsUrl(Object.keys(EXPECTED_ENTITY_LABELS)), join(CACHE, 'entity-labels.json')));

  const queries = [
    ...Object.keys(CODE_PROPERTIES).map((p) => [p, 'P18']),
    ['P267', 'P117'],
  ];
  const raw = [];
  const perQuery = {};
  for (const [prop, imgProp] of queries) {
    const url = `${SPARQL_ENDPOINT}?format=json&query=${encodeURIComponent(sparqlFor(prop, imgProp))}`;
    const json = await http.getJsonCached(url, join(CACHE, `sparql-${prop}-${imgProp}.json`));
    const rows = sparqlBindings(json, prop, imgProp).filter((r) => r.code && r.file);
    perQuery[`${prop}/${imgProp}`] = rows.length;
    raw.push(...rows);
    console.log(`[wikidata] ${prop} (${CODE_PROPERTIES[prop]}) + ${imgProp}: ${rows.length} filas`);
  }

  // Metadatos de Commons, 50 por pedido.
  const files = [...new Set(raw.map((r) => r.file))].sort();
  const info = new Map();
  const log = progressLogger('commons', 1000);
  for (let i = 0; i < files.length; i += 50) {
    const batch = files.slice(i, i + 50);
    const params = new URLSearchParams({
      action: 'query', format: 'json', prop: 'imageinfo', iiprop: 'url|extmetadata|mime', iiurlwidth: '330',
      iiextmetadatafilter: 'Artist|Credit|LicenseShortName|LicenseUrl|UsageTerms|AttributionRequired',
      titles: batch.map((f) => `File:${f}`).join('|'),
    });
    const json = await http.getJsonCached(`${COMMONS_API}?${params}`, join(CACHE, 'commons', `batch-${String(i / 50).padStart(5, '0')}.json`));
    for (const [k, v] of commonsImageInfo(json)) info.set(k, v);
    log(Math.min(i + 50, files.length), files.length);
  }

  const out = [];
  let nonFree = 0;
  let missing = 0;
  for (const r of raw) {
    const im = info.get(r.file);
    if (!im) {
      missing++;
      continue;
    }
    if (!im.free) {
      nonFree++;
      continue;
    }
    out.push({
      ...r,
      matchPropertyName: CODE_PROPERTIES[r.matchProperty],
      imageUrl: im.imageUrl,
      imageThumbUrl: im.imageThumbUrl,
      imageAttribution: im.imageAttribution,
      imageAuthor: im.imageAuthor,
      imageLicense: im.imageLicense,
      imageLicenseUrl: im.imageLicenseUrl,
      imageSourcePage: im.imageSourcePage,
      imageOrigin: 'wikimedia-commons',
      wikidataUrl: `https://www.wikidata.org/wiki/${r.wikidataId}`,
      retrievedAt,
    });
  }
  out.sort((a, b) => a.matchProperty.localeCompare(b.matchProperty) || a.code.localeCompare(b.code) || a.wikidataId.localeCompare(b.wikidataId));
  await writeNdjson(ndjsonPath('wikidata-images'), out);
  const meta = {
    source: 'wikidata-commons',
    retrievedAt,
    sparql: SPARQL_ENDPOINT,
    perQuery,
    uniqueFiles: files.length,
    rows: out.length,
    descartadasSinLicenciaLibre: nonFree,
    sinMetadatosCommons: missing,
    license: 'Datos de Wikidata: CC0. Cada imagen: la licencia de su archivo en Commons (campo imageLicense), con atribución obligatoria según la licencia.',
    http: http.stats,
    segundos: Math.round((Date.now() - t0) / 1000),
  };
  writeJson(ndjsonPath('wikidata-images').replace(/\.ndjson$/, '.meta.json'), meta, true);
  console.log(JSON.stringify(meta, null, 2));
}

main().catch((err) => {
  console.error('ERROR FATAL en import-wikidata-images:', err);
  process.exitCode = 1;
});
