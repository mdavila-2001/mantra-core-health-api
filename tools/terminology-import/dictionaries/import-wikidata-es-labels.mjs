#!/usr/bin/env node
// =============================================================================
// Etiquetas en castellano de Wikidata (CC0) para los conceptos del corpus de
// diccionarios, por identificador EXACTO declarado en el ítem (ver
// lib/wikidata-es.mjs): P1554 UBERON, P7963 CL, P1402 FMA, P354 HGNC, P685
// NCBITaxon, P686 GO, P3986 SO, P683 ChEBI, P1748 NCIt, P486 MeSH. Nunca por
// parecido de nombre. Son nombres de la comunidad de Wikidata, no traducciones
// oficiales: se cargan como sinónimos ES con el ítem Q como procedencia.
//
// Salida: <build>/dictionaries/ndjson/wikidata-es-labels.ndjson (+ .meta.json),
// que load-dictionaries.mjs suma como designaciones ES si está presente. Sólo
// quedan filas cuyo código existe en el corpus construido (correr después del
// build).
//
// Política de uso: User-Agent identificable, un pedido a la vez y ≥ 1,2 s entre
// pedidos; SPARQL sólo para el mapeo ítem ↔ id (una consulta mínima por propiedad)
// y la API de entidades (50 ítems por pedido) para las etiquetas,
// y ante 429 se espera lo que pida Retry-After (o 65 s: el límite que el
// servicio anuncia es de 1 pedido/min durante una caída). Cada respuesta se
// guarda en caché: la corrida se puede cortar y retomar sin repetir pedidos.
//
// Verificación que aborta: cada propiedad usada se contrasta con su etiqueta
// inglesa en Wikidata (`assertEntityLabels`, la misma del glosario ES).
//
// Uso: node tools/terminology-import/dictionaries/import-wikidata-es-labels.mjs [P1554 P7963 …]
// =============================================================================

import { createHash } from 'node:crypto';
import { createReadStream, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { dirname, join } from 'node:path';
import { USER_AGENT, cacheDir, nowIso, sleep, writeJson, writeNdjson } from '../lib/glossary-es/common.mjs';
import { SPARQL_ENDPOINT, assertEntityLabels, entityLabelsUrl } from '../lib/glossary-es/wikidata.mjs';
import { ID_PROPERTIES, NO_ENRICH, VALUES_PROPERTIES, entitiesUrl, esLabelRows, expectedLabels, labelPairs, labelsSparql, labelsSparqlFor } from './lib/wikidata-es.mjs';
import { NDJSON_DIR } from './lib/paths.mjs';

const CACHE = cacheDir('wikidata-dictionaries');
const BATCH = 50; // tope de wbgetentities sin permisos de bot
const VALUES_CHUNK = 600;
const MIN_GAP_MS = 1200;
const only = process.argv.slice(2).filter((a) => /^P\d+$/.test(a));
const stats = { requests: 0, retries: 0, rateLimited: 0, cacheHits: 0 };
let lastRequestAt = 0;

async function fetchJson(url, init, label) {
  for (let attempt = 1; attempt <= 14; attempt++) {
    const wait = lastRequestAt + MIN_GAP_MS - Date.now();
    if (wait > 0) await sleep(wait);
    lastRequestAt = Date.now();
    let res;
    try {
      res = await fetch(url, { ...init, headers: { 'User-Agent': USER_AGENT, ...init?.headers }, signal: AbortSignal.timeout(100000) });
    } catch (err) {
      stats.retries++;
      console.warn(`[wikidata] ${label}: red/timeout (${err.message}), reintento ${attempt}`);
      await sleep(Math.min(120000, 15000 * attempt));
      continue;
    }
    stats.requests++;
    if (res.status === 429) {
      stats.rateLimited++;
      stats.retries++;
      const ra = Number(res.headers.get('retry-after'));
      const ms = (Number.isFinite(ra) && ra > 0 ? ra : 65) * 1000 + 2000;
      console.warn(`[wikidata] ${label}: 429, espero ${Math.round(ms / 1000)} s`);
      await sleep(ms);
      continue;
    }
    if (res.status >= 500) {
      stats.retries++;
      console.warn(`[wikidata] ${label}: HTTP ${res.status}, reintento ${attempt}`);
      await sleep(Math.min(120000, 15000 * attempt));
      continue;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status} en ${label}`);
    try {
      return await res.json();
    } catch (err) {
      stats.retries++;
      console.warn(`[wikidata] ${label}: respuesta no JSON (${err.message}), reintento ${attempt}`);
      await sleep(15000 * attempt);
    }
  }
  throw new Error(`Wikidata no respondió tras 14 intentos: ${label}`);
}

async function cached(name, produce) {
  const path = join(CACHE, name);
  if (existsSync(path)) {
    stats.cacheHits++;
    return JSON.parse(readFileSync(path, 'utf8'));
  }
  const value = await produce();
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(value));
  return value;
}

const sparql = (query, label) =>
  fetchJson(SPARQL_ENDPOINT, { method: 'POST', headers: { Accept: 'application/sparql-results+json', 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ query }).toString() }, label);

/** Códigos del corpus por code system (sólo los de las propiedades pedidas), leídos de los ndjson sin parsearlos enteros. */
async function corpusCodes(codeSystems) {
  const out = new Map([...codeSystems].map((cs) => [cs, new Set()]));
  const { readdirSync } = await import('node:fs');
  for (const f of readdirSync(NDJSON_DIR).filter((x) => x.endsWith('.ndjson') && !x.startsWith('wikidata') && x !== 'disease-agents.ndjson')) {
    const rl = createInterface({ input: createReadStream(join(NDJSON_DIR, f), { encoding: 'utf8' }), crlfDelay: Infinity });
    for await (const line of rl) {
      const m = /^\{"key":"([^"|]+)\|(.+?)","codeSystem":/.exec(line);
      if (!m) { if (line.trim() !== '') throw new Error(`${f}: fila sin la forma {"key":"cs|código",…}`); continue; }
      if (out.has(m[1])) out.get(m[1]).add(JSON.parse(`"${m[2]}"`));
      else break; // un archivo = un code system (salvo capas con dos: ver abajo)
    }
  }
  return out;
}

async function main() {
  const retrievedAt = nowIso();
  const props = only.length ? only : Object.keys(ID_PROPERTIES);
  for (const p of props) if (!ID_PROPERTIES[p]) throw new Error(`Propiedad desconocida: ${p}`);
  const expected = expectedLabels();
  const labels = await cached('entity-labels.json', () => fetchJson(entityLabelsUrl(Object.keys(expected)), {}, 'wbgetentities'));
  assertEntityLabels(labels, expected);
  const codes = await corpusCodes(new Set(props.map((p) => ID_PROPERTIES[p].codeSystem)));
  for (const [cs, set] of codes) console.log(`[wikidata] corpus ${cs}: ${set.size} códigos`);
  const rows = [];
  const perProperty = {};
  for (const prop of props) {
    const spec = ID_PROPERTIES[prop];
    const inCorpus = codes.get(spec.codeSystem);
    // 1) Ítem ↔ id ↔ etiqueta en castellano (una consulta SPARQL mínima; por tandas de ids si la propiedad tiene millones de ítems).
    let pairs = [];
    if (VALUES_PROPERTIES.has(prop)) {
      const ids = [...inCorpus].map((c) => c.replace(/^NCBITaxon:/, '')).sort((a, b) => Number(a) - Number(b));
      for (let i = 0; i * VALUES_CHUNK < ids.length; i++) {
        const chunk = ids.slice(i * VALUES_CHUNK, (i + 1) * VALUES_CHUNK);
        pairs.push(...labelPairs(await cached(`${prop}-lab-${i}.json`, () => sparql(labelsSparqlFor(prop, chunk), `${prop} etiquetas ${i}`)), prop));
      }
    } else {
      pairs = labelPairs(await cached(`${prop}-lab.json`, () => sparql(labelsSparql(prop), `${prop} etiquetas`)), prop);
    }
    const withLabel = pairs.length;
    pairs = pairs.filter((p) => inCorpus.has(p.code));
    // 2) Alias y descripción en castellano de esos ítems (API de entidades, lotes de 50), salvo propiedades de volumen (genes).
    const qids = [...new Set(pairs.map((p) => p.q))].sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));
    const entities = { entities: {} };
    const enrich = !NO_ENRICH.has(prop) && !process.env.WIKIDATA_NO_ENRICH;
    for (let i = 0; enrich && i * BATCH < qids.length; i++) {
      const batch = qids.slice(i * BATCH, (i + 1) * BATCH);
      const json = await cached(`${prop}-ent-${String(i).padStart(5, '0')}.json`, () => fetchJson(entitiesUrl(batch), {}, `${prop} entidades ${i + 1}/${Math.ceil(qids.length / BATCH)}`));
      Object.assign(entities.entities, json?.entities ?? {});
      if ((i + 1) % 20 === 0) console.log(`[wikidata] ${prop}: ${i + 1}/${Math.ceil(qids.length / BATCH)} lotes`);
    }
    const found = esLabelRows(pairs, entities, prop, retrievedAt);
    perProperty[prop] = { property: spec.label, codeSystem: spec.codeSystem, itemsWithEsLabel: withLabel, itemsWithIdInCorpus: qids.length, rows: found.length, aliasesAndDescriptionsFetched: enrich };
    console.log(`[wikidata] ${prop}: ${JSON.stringify(perProperty[prop])}`);
    rows.push(...found);
  }
  rows.sort((a, b) => a.codeSystem.localeCompare(b.codeSystem) || a.code.localeCompare(b.code) || a.q.localeCompare(b.q));
  await writeNdjson(join(NDJSON_DIR, 'wikidata-es-labels.ndjson'), rows);
  // Wikidata es una fuente viva sin versiones: lo que queda como constancia es el SHA-256 de cada respuesta que se leyó
  // (la caché se borra al normalizar). `inputsSha256` = SHA-256 de la lista ordenada «archivo sha256».
  const inputs = Object.fromEntries(readdirSync(CACHE).filter((f) => f !== 'entity-labels.json' && props.some((p) => f.startsWith(`${p}-`))).sort().map((f) => [f, createHash('sha256').update(readFileSync(join(CACHE, f))).digest('hex')]));
  const inputsSha256 = createHash('sha256').update(Object.entries(inputs).map(([f, h]) => `${f} ${h}`).join('\n')).digest('hex');
  writeJson(join(NDJSON_DIR, 'wikidata-es-labels.meta.json'), { retrievedAt, endpoint: SPARQL_ENDPOINT, license: 'CC0 1.0', perProperty, http: stats, inputsSha256, inputs }, true);
  console.log(JSON.stringify({ perProperty, total: rows.length, http: stats }, null, 2));
}

main().catch((err) => {
  console.error('ERROR FATAL en import-wikidata-es-labels:', err);
  process.exitCode = 1;
});
