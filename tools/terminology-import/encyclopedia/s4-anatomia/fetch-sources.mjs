#!/usr/bin/env node
// Etapa de red 2 (después de `fetch-wikidata.mjs`): HPO, MeSH y Commons.
//   node fetch-sources.mjs [--skip-hpo] [--skip-mesh] [--skip-commons]
//
//  - HPO: `hp.json` (~22 MB), misma URL y sha256 que fija
//    `wt-alovida-medgemma/knowledge-sources/clinical-sources.lock.json` (solo
//    lectura). Si ya está en caché no se vuelve a bajar. La traducción
//    `hp-es.babelon.tsv` NO se usa (ver `lib/hpo.mjs`).
//  - MeSH: notas de alcance de los descriptores que Wikidata declara (P486), por
//    lotes de 100 contra el SPARQL oficial de NLM.
//  - Commons: `imageinfo` + `extmetadata` de los archivos que Wikidata declara
//    (P18, P5555, P6802, P117, P8224), 50 por pedido.
// 1 pedido por segundo y caché en disco; una sola descarga a la vez.

import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { CACHE_DIR } from './lib/config.mjs';
import { readEntityCache } from './lib/cache-reader.mjs';
import { fetchCommonsInfo } from './lib/commons.mjs';
import { fetchMeshDescriptors } from './lib/mesh.mjs';
import { imageFiles } from './lib/wikidata-sections.mjs';
import { makeHttp, stringValues } from './lib/wikidata-api.mjs';

const args = new Set(process.argv.slice(2));
const http = makeHttp();

const HPO_FILES = [
  {
    name: 'hp.json',
    url: 'https://github.com/obophenotype/human-phenotype-ontology/releases/latest/download/hp.json',
  },
];

async function fetchHpo() {
  const meta = {};
  for (const { name, url } of HPO_FILES) {
    const body = await http.getFileCached(url, join(CACHE_DIR, 'hpo', name));
    meta[name] = { url, bytes: body.length, sha256: createHash('sha256').update(body).digest('hex') };
    console.log(`[hpo] ${name}: ${body.length} bytes, sha256 ${meta[name].sha256}`);
  }
  writeFileSync(join(CACHE_DIR, 'hpo', 'meta.json'), JSON.stringify(meta, null, 2) + '\n');
}

const entities = readEntityCache('main');
if (entities.size === 0) throw new Error('Falta la caché de Wikidata: corré primero fetch-wikidata.mjs');

if (!args.has('--skip-hpo')) await fetchHpo();

if (!args.has('--skip-mesh')) {
  const ids = [...entities.values()].flatMap((e) => stringValues(e, 'P486'));
  console.log(`[mesh] ${new Set(ids).size} descriptores declarados por Wikidata`);
  const mesh = await fetchMeshDescriptors(http, ids, { onProgress: (d, t) => console.log(`[mesh] ${d}/${t}`) });
  console.log(`[mesh] ${mesh.size} descriptores recibidos, ${[...mesh.values()].filter((m) => m.scopeNote).length} con nota de alcance`);
}

if (!args.has('--skip-commons')) {
  const files = [...entities.values()].flatMap((e) => imageFiles(e).map((f) => f.file));
  console.log(`[commons] ${new Set(files).size} archivos declarados por Wikidata`);
  const info = await fetchCommonsInfo(http, files, { onProgress: (d, t) => (d % 250 === 0 || d === t) && console.log(`[commons] ${d}/${t}`) });
  console.log(`[commons] ${info.size} archivos con metadatos`);
}

console.log('[fetch-sources] listo', JSON.stringify(http.stats));
