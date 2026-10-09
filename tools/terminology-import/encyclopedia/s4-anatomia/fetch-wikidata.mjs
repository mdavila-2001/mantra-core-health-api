#!/usr/bin/env node
// Etapa de red 1: descarga de Wikidata (CC0) las entidades de los términos de S4.
//   node fetch-wikidata.mjs [--limit N]
// Pasada A: info (revisión) + claims + etiquetas + descripciones (es, en) de cada Q-id.
// Pasada B: etiquetas (es, en) de todo ítem referenciado por las propiedades que
//           el armado muestra (partes, irrigación, inervación…).
// Pasada C: etiquetas de las propiedades, contrastadas con las esperadas.
// 1 pedido por segundo, caché en disco por lote: volver a correr no vuelve a pedir.

import { pinRetrievedAt } from './lib/config.mjs';
import { buildUniverse, loadSeedRows, wikidataIdOf } from './lib/terms.mjs';
import { fetchEntities, itemValues, makeHttp } from './lib/wikidata-api.mjs';
import { ALL_PROPERTIES, EXPECTED_LABELS, EXPECTED_REVERSE_LABELS, ITEM_PROPERTIES } from './lib/wikidata-properties.mjs';

const limitArg = process.argv.indexOf('--limit');
const limit = limitArg > 0 ? Number(process.argv[limitArg + 1]) : Infinity;

pinRetrievedAt();
const http = makeHttp();
const { mine } = buildUniverse(loadSeedRows());
const qids = [...new Set(mine.map(wikidataIdOf).filter(Boolean))].slice(0, limit);
console.log(`[wikidata] ${qids.length} Q-ids del corte S4`);

const progress = (tag) => (done, total) => {
  if (done % 10 === 0 || done === total) console.log(`[wikidata:${tag}] lote ${done}/${total}`);
};

const main = await fetchEntities(http, qids, {
  props: ['info', 'claims', 'labels', 'descriptions', 'aliases'],
  tag: 'main',
  onProgress: progress('main'),
});

const referenced = new Set();
for (const entity of main.values()) for (const property of Object.keys(ITEM_PROPERTIES)) for (const id of itemValues(entity, property)) referenced.add(id);
for (const id of main.keys()) referenced.delete(id);
console.log(`[wikidata] ${referenced.size} ítems referenciados por propiedades que se muestran`);
await fetchEntities(http, [...referenced], { props: ['labels'], tag: 'referenced', onProgress: progress('referenced') });

const properties = await fetchEntities(http, ALL_PROPERTIES, { props: ['labels'], tag: 'properties' });
const expected = { ...EXPECTED_LABELS, ...EXPECTED_REVERSE_LABELS };
const wrong = Object.entries(expected).filter(([id, en]) => properties.get(id)?.labels?.en?.value !== en);
if (wrong.length > 0) {
  for (const [id, en] of wrong) console.error(`ETIQUETA INESPERADA ${id}: esperada «${en}», Wikidata dice «${properties.get(id)?.labels?.en?.value}»`);
  process.exit(1);
}
console.log(`[wikidata] ${Object.keys(expected).length} etiquetas de propiedad verificadas`);
console.log('[wikidata] listo', JSON.stringify(http.stats));
