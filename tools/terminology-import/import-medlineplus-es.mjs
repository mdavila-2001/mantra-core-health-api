#!/usr/bin/env node
// =============================================================================
// ETL etapa 1 (fetch → NDJSON): MedlinePlus en español (NLM, dominio público).
//
//  a) Temas de salud: el XML diario publicado en https://medlineplus.gov/xml.html
//     (se toma el `mplus_topics_<fecha>.xml` más reciente enlazado ahí). Es UNA
//     descarga de un archivo ofrecido explícitamente para bajar.
//     Nota robots.txt: `/xml/` figura como Disallow para rastreadores; esto no
//     rastrea el sitio, baja el archivo que la página de descargas ofrece.
//  b) Guías de pruebas médicas: https://medlineplus.gov/spanish/pruebas-de-laboratorio/
//     (índice + una página por guía; esa ruta no está en Disallow). 1 pedido a la
//     vez, 1 s entre pedidos, caché en disco.
//
// Salida: `ndjson/medlineplus-es.ndjson`, `ndjson/medlineplus-es-pruebas.ndjson`.
// =============================================================================

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  HttpClient, assertRow, cacheDir, mapPool, ndjsonPath, nowIso, progressLogger, sha256File, writeJson, writeNdjson,
} from './lib/glossary-es/common.mjs';
import { LAB_INDEX_URL, labIndexLinks, labPageRow, parseTopics, topicRows } from './lib/glossary-es/medlineplus.mjs';

const http = new HttpClient({ concurrency: 1, minDelayMs: 1000 });
const CACHE = cacheDir('medlineplus');

async function latestTopicsXmlUrl() {
  const { body } = await http.get('https://medlineplus.gov/xml.html');
  const urls = [...body.toString('utf8').matchAll(/href="(https:\/\/medlineplus\.gov\/xml\/mplus_topics_(\d{4}-\d{2}-\d{2})\.xml)"/g)]
    .map((m) => ({ url: m[1], date: m[2] }))
    .sort((a, b) => b.date.localeCompare(a.date));
  if (!urls.length) throw new Error('No se encontró mplus_topics_<fecha>.xml en https://medlineplus.gov/xml.html');
  return urls[0];
}

async function main() {
  const t0 = Date.now();
  const retrievedAt = nowIso();
  console.log('=== MedlinePlus en español → glosario ES ===');

  // a) Temas
  const latest = await latestTopicsXmlUrl();
  const xmlPath = join(CACHE, `mplus_topics_${latest.date}.xml`);
  await http.getFileCached(latest.url, xmlPath);
  const topics = parseTopics(readFileSync(xmlPath, 'utf8'));
  const rows = topicRows(topics, { retrievedAt, xmlUrl: latest.url }).map(assertRow);
  rows.sort((a, b) => a.esName.localeCompare(b.esName, 'es'));
  await writeNdjson(ndjsonPath('medlineplus-es'), rows);
  console.log(`[medlineplus] temas: ${topics.length} en el XML; ${rows.length} en español`);

  // b) Guías de pruebas médicas
  const indexHtml = (await http.getFileCached(LAB_INDEX_URL, join(CACHE, 'pruebas', 'index.html'))).toString('utf8');
  const links = labIndexLinks(indexHtml);
  const labRows = [];
  const skipped = [];
  await mapPool(
    links,
    1,
    async (url) => {
      const slug = url.replace(/\/$/, '').split('/').pop();
      const html = (await http.getFileCached(url, join(CACHE, 'pruebas', `${slug}.html`))).toString('utf8');
      const row = labPageRow(url, html, { retrievedAt });
      if (row && row.definition) labRows.push(assertRow(row));
      else skipped.push(url);
    },
    progressLogger('medlineplus:pruebas', 50),
  );
  labRows.sort((a, b) => a.esName.localeCompare(b.esName, 'es'));
  await writeNdjson(ndjsonPath('medlineplus-es-pruebas'), labRows);

  const count = (arr, k) => arr.reduce((acc, r) => ((acc[r[k]] = (acc[r[k]] ?? 0) + 1), acc), {});
  const meta = {
    source: 'nlm-medlineplus-es',
    retrievedAt,
    topicsXml: { url: latest.url, sha256: sha256File(xmlPath), topicsInXml: topics.length, spanishTopics: rows.length, byCategory: count(rows, 'categoryKey'), withDefinition: rows.filter((r) => r.definition).length },
    labGuides: { indexUrl: LAB_INDEX_URL, linksInIndex: links.length, rows: labRows.length, skippedWithoutStructure: skipped, byCategory: count(labRows, 'categoryKey') },
    http: http.stats,
    segundos: Math.round((Date.now() - t0) / 1000),
  };
  writeJson(ndjsonPath('medlineplus-es').replace(/\.ndjson$/, '.meta.json'), meta, true);
  console.log(JSON.stringify(meta, null, 2));
}

main().catch((err) => {
  console.error('ERROR FATAL en import-medlineplus-es:', err);
  process.exitCode = 1;
});
