#!/usr/bin/env node
// =============================================================================
// ETL etapa 1 (fetch → NDJSON): Anatomía desde Wikidata — ítems con
// identificador de Terminologia Anatomica (TA98 P1323 o TA2 P7173), etiqueta en
// castellano Y que son estructura anatómica (P31/P279 hasta Q4936952).
//
// Dos verificaciones que abortan la corrida si fallan:
//  1. Cada id de propiedad/clase usado se contrasta con su etiqueta en Wikidata
//     (`assertEntityLabels`). La primera versión usó P7863 creyendo que era TA2:
//     es «aperture» y metió objetivos de cámara Canon como anatomía.
//  2. Cada fila emitida tiene que haber pasado el filtro de clase
//     (`anatomyClassVerified`); `anatomyRow` lanza si no.
// Los ítems con id TA que NO son estructura anatómica se listan en el `.meta.json`.
//
// La etiqueta y la descripción en castellano son de la comunidad de Wikidata
// (CC0), no una traducción oficial de la TA: así lo dicen `sourceName` y
// `definitionSource` de cada fila.
// Salida: `ndjson/wikidata-anatomia.ndjson`.
// =============================================================================

import { join } from 'node:path';
import { HttpClient, cacheDir, ndjsonPath, nowIso, writeJson, writeNdjson } from './lib/glossary-es/common.mjs';
import {
  COMMONS_API, EXPECTED_ENTITY_LABELS, SPARQL_ENDPOINT, WIKIDATA_API, assertEntityLabels, commonsImageInfo, entityLabelsUrl,
  fileNameFromCommonsUrl, parentClasses, reachesClass,
} from './lib/glossary-es/wikidata.mjs';
import { ANATOMICAL_STRUCTURE, anatomyRow } from './lib/glossary-es/wikidata-anatomy.mjs';

const http = new HttpClient({ concurrency: 1, minDelayMs: 1000 });
const CACHE = cacheDir('wikidata');

const QUERY = `SELECT ?item ?taProp ?ta ?esLabel ?esDesc ?enLabel ?img ?alias ?cls WHERE {
  VALUES ?taProp { wdt:P1323 wdt:P7173 }
  ?item ?taProp ?ta ; rdfs:label ?esLabel FILTER(LANG(?esLabel) = "es")
  OPTIONAL { ?item schema:description ?esDesc FILTER(LANG(?esDesc) = "es") }
  OPTIONAL { ?item rdfs:label ?enLabel FILTER(LANG(?enLabel) = "en") }
  OPTIONAL { ?item wdt:P18 ?img }
  OPTIONAL { ?item skos:altLabel ?alias FILTER(LANG(?alias) = "es") }
  OPTIONAL { ?item wdt:P31|wdt:P279 ?cls }
}`;

async function main() {
  const t0 = Date.now();
  const retrievedAt = nowIso();

  // Verificación 1: los ids son lo que se cree.
  assertEntityLabels(await http.getJsonCached(entityLabelsUrl(Object.keys(EXPECTED_ENTITY_LABELS)), join(CACHE, 'entity-labels.json')));

  const json = await http.getJsonCached(`${SPARQL_ENDPOINT}?format=json&query=${encodeURIComponent(QUERY)}`, join(CACHE, 'sparql-anatomy-ta-v2.json'));
  const items = new Map();
  for (const b of json.results.bindings) {
    const q = b.item.value.split('/').pop();
    const it = items.get(q) ?? { q, ta98: new Set(), ta2: new Set(), esLabel: b.esLabel.value, esDesc: null, enLabel: null, imgs: new Set(), aliases: new Set(), classes: new Set() };
    (b.taProp.value.endsWith('P1323') ? it.ta98 : it.ta2).add(b.ta.value);
    if (b.esDesc) it.esDesc = b.esDesc.value;
    if (b.enLabel) it.enLabel = b.enLabel.value;
    if (b.img) it.imgs.add(fileNameFromCommonsUrl(b.img.value));
    if (b.alias) it.aliases.add(b.alias.value);
    if (b.cls) it.classes.add(b.cls.value.split('/').pop());
    items.set(q, it);
  }

  // Filtro de clase: subir por P279 (API de Wikidata, 50 ids por pedido, con caché).
  const parentsOf = new Map();
  let frontier = new Set([...items.values()].flatMap((i) => [...i.classes]));
  let depth = 0;
  while (frontier.size && depth < 40) {
    const ids = [...frontier].filter((c) => !parentsOf.has(c)).sort();
    for (let i = 0; i < ids.length; i += 50) {
      const batch = ids.slice(i, i + 50);
      const url = `${WIKIDATA_API}?action=wbgetentities&format=json&props=claims&ids=${batch.join('|')}`;
      const res = await http.getJsonCached(url, join(CACHE, 'classes', `${batch[0]}-${batch.length}-${batch.at(-1)}.json`));
      for (const [k, v] of parentClasses(res)) parentsOf.set(k, v);
      for (const id of batch) if (!parentsOf.has(id)) parentsOf.set(id, []);
    }
    frontier = new Set(ids.flatMap((c) => parentsOf.get(c) ?? []).filter((c) => !parentsOf.has(c)));
    depth++;
  }
  const excluded = [];
  for (const it of items.values()) {
    it.anatomyClassVerified = reachesClass([...it.classes], ANATOMICAL_STRUCTURE, parentsOf);
    if (!it.anatomyClassVerified) excluded.push({ q: it.q, es: it.esLabel, en: it.enLabel });
  }
  const kept = [...items.values()].filter((i) => i.anatomyClassVerified);

  // Imágenes de Commons.
  const files = [...new Set(kept.map((i) => [...i.imgs].sort()[0]).filter(Boolean))].sort();
  const info = new Map();
  for (let i = 0; i < files.length; i += 50) {
    const params = new URLSearchParams({
      action: 'query', format: 'json', prop: 'imageinfo', iiprop: 'url|extmetadata|mime', iiurlwidth: '330',
      iiextmetadatafilter: 'Artist|Credit|LicenseShortName|LicenseUrl|UsageTerms|AttributionRequired',
      titles: files.slice(i, i + 50).map((f) => `File:${f}`).join('|'),
    });
    const res = await http.getJsonCached(`${COMMONS_API}?${params}`, join(CACHE, 'commons-anatomy', `${files[i]}.json`.replace(/[/\\]/g, '_')));
    for (const [k, v] of commonsImageInfo(res)) info.set(k, v);
  }

  // Verificación 2: `anatomyRow` lanza si una fila no pasó el filtro de clase.
  const rows = kept.map((it) => anatomyRow(it, info, retrievedAt)).sort((a, b) => a.esName.localeCompare(b.esName, 'es'));
  await writeNdjson(ndjsonPath('wikidata-anatomia'), rows);
  const meta = {
    source: 'wikidata', retrievedAt, sparql: SPARQL_ENDPOINT,
    itemsConIdTA: items.size, filas: rows.length,
    excluidosPorNoSerEstructuraAnatomica: excluded.length, excluidos: excluded.sort((a, b) => a.q.localeCompare(b.q)),
    clasesRecorridas: parentsOf.size,
    conDescripcion: rows.filter((r) => r.definition).length, conImagen: rows.filter((r) => r.imageUrl).length,
    http: http.stats, segundos: Math.round((Date.now() - t0) / 1000),
  };
  writeJson(ndjsonPath('wikidata-anatomia').replace(/\.ndjson$/, '.meta.json'), meta, true);
  const { excluidos, ...short } = meta;
  console.log(JSON.stringify({ ...short, ejemplosExcluidos: excluidos.slice(0, 15) }, null, 2));
}

main().catch((err) => {
  console.error('ERROR FATAL en import-wikidata-anatomy:', err);
  process.exitCode = 1;
});
