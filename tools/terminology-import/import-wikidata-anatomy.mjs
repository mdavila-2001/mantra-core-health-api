#!/usr/bin/env node
// =============================================================================
// ETL etapa 1 (fetch → NDJSON): Anatomía desde Wikidata — ítems con
// identificador de Terminologia Anatomica (TA98 P1323 o TA2 P7863) y etiqueta en
// castellano, con su descripción ES, alias ES y la imagen P18 (atribución de
// Commons).
//
// Qué es y qué no: Wikidata es una base comunitaria bajo CC0. El identificador
// TA viene de la Terminologia Anatomica (FIPAT); la ETIQUETA y la DESCRIPCIÓN en
// castellano son de la comunidad de Wikidata, no una traducción oficial de la TA.
// Así queda dicho en `sourceName`/`definitionSource` de cada fila.
//
// Salida: `ndjson/wikidata-anatomia.ndjson`.
// =============================================================================

import { join } from 'node:path';
import {
  HttpClient, NO_IMAGE, assertRow, cacheDir, ndjsonPath, nowIso, writeJson, writeNdjson,
} from './lib/glossary-es/common.mjs';
import { COMMONS_API, SPARQL_ENDPOINT, commonsImageInfo, fileNameFromCommonsUrl } from './lib/glossary-es/wikidata.mjs';

const http = new HttpClient({ concurrency: 1, minDelayMs: 1000 });
const CACHE = cacheDir('wikidata');
const WIKIDATA_LICENSE = 'Wikidata: datos bajo CC0 1.0 (https://creativecommons.org/publicdomain/zero/1.0/). Etiquetas y descripciones en castellano aportadas por la comunidad de Wikidata. Imagen: licencia de su archivo en Wikimedia Commons.';

const QUERY = `SELECT ?item ?taProp ?ta ?esLabel ?esDesc ?enLabel ?img ?alias WHERE {
  VALUES ?taProp { wdt:P1323 wdt:P7863 }
  ?item ?taProp ?ta ; rdfs:label ?esLabel FILTER(LANG(?esLabel) = "es")
  OPTIONAL { ?item schema:description ?esDesc FILTER(LANG(?esDesc) = "es") }
  OPTIONAL { ?item rdfs:label ?enLabel FILTER(LANG(?enLabel) = "en") }
  OPTIONAL { ?item wdt:P18 ?img }
  OPTIONAL { ?item skos:altLabel ?alias FILTER(LANG(?alias) = "es") }
}`;

async function main() {
  const t0 = Date.now();
  const retrievedAt = nowIso();
  const json = await http.getJsonCached(`${SPARQL_ENDPOINT}?format=json&query=${encodeURIComponent(QUERY)}`, join(CACHE, 'sparql-anatomy-ta.json'));
  const items = new Map();
  for (const b of json.results.bindings) {
    const q = b.item.value.split('/').pop();
    const it = items.get(q) ?? { q, ta98: new Set(), ta2: new Set(), esLabel: b.esLabel.value, esDesc: null, enLabel: null, imgs: new Set(), aliases: new Set() };
    (b.taProp.value.endsWith('P1323') ? it.ta98 : it.ta2).add(b.ta.value);
    if (b.esDesc) it.esDesc = b.esDesc.value;
    if (b.enLabel) it.enLabel = b.enLabel.value;
    if (b.img) it.imgs.add(fileNameFromCommonsUrl(b.img.value));
    if (b.alias) it.aliases.add(b.alias.value);
    items.set(q, it);
  }
  // Imagen principal determinista: el primer archivo en orden alfabético.
  const files = [...new Set([...items.values()].map((i) => [...i.imgs].sort()[0]).filter(Boolean))].sort();
  const info = new Map();
  for (let i = 0; i < files.length; i += 50) {
    const params = new URLSearchParams({
      action: 'query', format: 'json', prop: 'imageinfo', iiprop: 'url|extmetadata|mime', iiurlwidth: '330',
      iiextmetadatafilter: 'Artist|Credit|LicenseShortName|LicenseUrl|UsageTerms|AttributionRequired',
      titles: files.slice(i, i + 50).map((f) => `File:${f}`).join('|'),
    });
    const res = await http.getJsonCached(`${COMMONS_API}?${params}`, join(CACHE, 'commons-anatomy', `batch-${String(i / 50).padStart(4, '0')}.json`));
    for (const [k, v] of commonsImageInfo(res)) info.set(k, v);
  }

  const rows = [...items.values()].map((it) => {
    const file = [...it.imgs].sort()[0];
    const im = file ? info.get(file) : null;
    const img = im && im.free ? im : null;
    const esName = it.esLabel.charAt(0).toUpperCase() + it.esLabel.slice(1);
    const url = `https://www.wikidata.org/wiki/${it.q}`;
    return assertRow({
      slug: `wikidata-anatomia-${it.q.toLowerCase()}`,
      code: it.q,
      codeSystem: 'wikidata-anatomia',
      display: esName,
      esName,
      enDisplay: it.enLabel,
      esSynonyms: [...it.aliases].filter((a) => a.toLowerCase() !== it.esLabel.toLowerCase()).sort((a, b) => a.localeCompare(b, 'es')),
      definition: it.esDesc,
      definitionKind: it.esDesc ? 'wikidata-description' : null,
      definitionHtml: null,
      definitionSource: it.esDesc ? { name: `Wikidata ${it.q} — descripción en castellano (comunidad de Wikidata)`, url, retrievedAt, license: 'CC0 1.0' } : null,
      plainSummaryEs: null,
      categoryKey: 'anatomy',
      tagKeys: [],
      lang: 'es',
      hierarchy: [],
      externalIds: { wikidata: it.q, ...(it.ta98.size ? { ta98: [...it.ta98].sort() } : {}), ...(it.ta2.size ? { ta2: [...it.ta2].sort() } : {}) },
      relations: [],
      ...NO_IMAGE,
      ...(img
        ? { imageUrl: img.imageUrl, imageThumbUrl: img.imageThumbUrl, imageAttribution: img.imageAttribution, imageLicense: img.imageLicense, imageLicenseUrl: img.imageLicenseUrl, imageSourcePage: img.imageSourcePage, imageOrigin: 'wikimedia-commons' }
        : {}),
      source: 'wikidata',
      sourceName: 'Wikidata — ítems con identificador de Terminologia Anatomica (TA98/TA2); etiqueta y descripción ES de la comunidad',
      sourceUrl: url,
      sourceRetrievedAt: retrievedAt,
      sourceLicense: WIKIDATA_LICENSE,
      reviewStatus: 'external-source',
    });
  });
  rows.sort((a, b) => a.esName.localeCompare(b.esName, 'es'));
  await writeNdjson(ndjsonPath('wikidata-anatomia'), rows);
  const meta = {
    source: 'wikidata', retrievedAt, sparql: SPARQL_ENDPOINT, items: rows.length,
    withDescription: rows.filter((r) => r.definition).length, withImage: rows.filter((r) => r.imageUrl).length,
    http: http.stats, segundos: Math.round((Date.now() - t0) / 1000),
  };
  writeJson(ndjsonPath('wikidata-anatomia').replace(/\.ndjson$/, '.meta.json'), meta, true);
  console.log(JSON.stringify(meta, null, 2));
}

main().catch((err) => {
  console.error('ERROR FATAL en import-wikidata-anatomy:', err);
  process.exitCode = 1;
});
