#!/usr/bin/env node
// =============================================================================
// Wikidata (CC0) · etapa 0 (red): enfermedades con nombre en castellano, y las que
// ninguna otra fuente del catálogo identifica.
//
// Consulta el servicio SPARQL público https://query.wikidata.org/sparql:
//   disease = ítems que son instancia de una subclase de «disease» (Q12136) o subclase de ella.
//   alcance = disease con etiqueta en castellano  ∪  disease sin ningún identificador de los
//             sistemas del catálogo (MONDO, DOID, Orphanet, MeSH, OMIM, NCIt, CIE-10/11, UMLS).
//             El resto (con identificador y sin castellano) ya está en el catálogo y no
//             aporta nombres ni conceptos nuevos.
// Por cada lote de ítems baja etiquetas y descripciones (en, es), alias (en, es), los
// identificadores externos y los P31/P279. Las propiedades se verifican por su etiqueta
// en Wikidata antes de usarlas (no se asume ningún número de propiedad).
//
// Cortesía: 1 consulta a la vez, ≥ 1,5 s entre consultas, User-Agent identificable,
// reintentos con backoff. Reanudable (cada respuesta queda en disco con su SHA-256).
// Salida: <SOURCES_DIR>/wikidata/{props.json, scope.json, batches/*.json, manifest.json}
//
// Uso: node tools/terminology-import/diseases/fetch-wikidata.mjs
// =============================================================================

import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { promisify } from 'node:util';

import { ensureDir, nowIso, sleep, writeJson } from '../lib/glossary-es/common.mjs';
import { WIKIDATA } from './lib/sources.mjs';

const run = promisify(execFile);
const UA = 'mantra-core-health-terminology-import/1.0 (carga de catalogos; contacto pabliarca@gmail.com)';
const DELAY_MS = 2500;
const BATCH = 200;

const DISEASE = '{ ?i wdt:P31/wdt:P279* wd:Q12136 } UNION { ?i wdt:P279+ wd:Q12136 }';
const sha = (s) => createHash('sha256').update(s).digest('hex');

async function sparql(query, label) {
  const tmp = join(WIKIDATA.dir, '.respuesta.tmp');
  for (let attempt = 1; ; attempt++) {
    let code = 0;
    try {
      const { stdout } = await run('curl', ['-sS', '-m', '170', '-A', UA, '-H', 'Accept: application/sparql-results+json', '--data-urlencode', `query=${query}`, '-o', tmp, '-D', `${tmp}.hdr`, '-w', '%{http_code}', WIKIDATA.endpoint]);
      code = Number(stdout);
      if (code === 200) {
        const body = readFileSync(tmp, 'utf8');
        JSON.parse(body);
        await sleep(DELAY_MS);
        return body;
      }
    } catch (err) {
      if (attempt >= 8) throw new Error(`Wikidata ${label}: ${err.message}`);
    }
    // 429 / 5xx: se respeta Retry-After (WDQS limita por tiempo de consulta acumulado); si no viene, backoff exponencial.
    const hdr = existsSync(`${tmp}.hdr`) ? readFileSync(`${tmp}.hdr`, 'utf8') : '';
    const retryAfter = Number(/^retry-after:\s*(\d+)/im.exec(hdr)?.[1]);
    if (attempt >= 8) throw new Error(`Wikidata ${label}: HTTP ${code} tras ${attempt} intentos`);
    const wait = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter + 5 : 30 * 2 ** (attempt - 1);
    console.log(`[wikidata] ${label}: HTTP ${code}, espero ${wait} s (intento ${attempt})`);
    await sleep(wait * 1000);
  }
}

const qids = (json) => JSON.parse(json).results.bindings.map((b) => b.i.value.replace('http://www.wikidata.org/entity/', ''));

async function cached(path, query, label) {
  if (existsSync(path)) return readFileSync(path, 'utf8');
  const out = await sparql(query, label);
  writeFileSync(path, out);
  return out;
}

async function main() {
  const dir = ensureDir(WIKIDATA.dir);
  const batches = ensureDir(join(dir, 'batches'));
  // 1. Propiedades: la etiqueta en inglés de cada una tiene que ser la esperada.
  const propsList = Object.keys(WIKIDATA.properties);
  const propsJson = await cached(join(dir, 'props.json'), `SELECT ?p ?l WHERE { VALUES ?p { ${propsList.map((p) => `wd:${p}`).join(' ')} wd:Q12136 } ?p rdfs:label ?l FILTER(LANG(?l)="en") }`, 'propiedades');
  const labels = Object.fromEntries(JSON.parse(propsJson).results.bindings.map((b) => [b.p.value.split('/').pop(), b.l.value]));
  for (const [p, v] of Object.entries(WIKIDATA.properties)) if (labels[p] !== v.label) throw new Error(`Wikidata: ${p} se llama «${labels[p]}», se esperaba «${v.label}»`);
  if (labels.Q12136 !== 'disease') throw new Error(`Wikidata: Q12136 se llama «${labels.Q12136}»`);
  // 2. Alcance.
  const scopePath = join(dir, 'scope.json');
  if (!existsSync(scopePath)) {
    const idProps = Object.entries(WIKIDATA.properties).filter(([, v]) => v.id).map(([p]) => p);
    const all = qids(await sparql(`SELECT DISTINCT ?i WHERE { ${DISEASE} }`, 'disease'));
    const es = qids(await sparql(`SELECT DISTINCT ?i WHERE { { ${DISEASE} } ?i rdfs:label ?l FILTER(LANG(?l)="es") }`, 'con castellano'));
    const withId = new Set(qids(await sparql(`SELECT DISTINCT ?i WHERE { { ${DISEASE} } ?i ?p ?v VALUES ?p { ${idProps.map((p) => `wdt:${p}`).join(' ')} } }`, 'con identificador')));
    const inScope = new Set([...es, ...all.filter((q) => !withId.has(q))]);
    writeJson(scopePath, { queriedAt: nowIso(), diseaseItems: all.length, withSpanishLabel: es.length, withCatalogId: withId.size, withoutCatalogId: all.filter((q) => !withId.has(q)).length, scope: [...inScope].sort((a, b) => Number(a.slice(1)) - Number(b.slice(1))) });
  }
  const scope = JSON.parse(readFileSync(scopePath, 'utf8')).scope;
  // 3. Detalles por lote.
  const idList = Object.entries(WIKIDATA.properties).filter(([, v]) => v.id).map(([p]) => `wdt:${p}`);
  for (let i = 0; i * BATCH < scope.length; i++) {
    const values = scope.slice(i * BATCH, (i + 1) * BATCH).map((q) => `wd:${q}`).join(' ');
    const n = String(i + 1).padStart(3, '0');
    const queries = {
      labels: `SELECT ?i ?le ?ls ?de ?ds WHERE { VALUES ?i { ${values} } OPTIONAL { ?i rdfs:label ?le FILTER(LANG(?le)="en") } OPTIONAL { ?i rdfs:label ?ls FILTER(LANG(?ls)="es") } OPTIONAL { ?i schema:description ?de FILTER(LANG(?de)="en") } OPTIONAL { ?i schema:description ?ds FILTER(LANG(?ds)="es") } }`,
      aliases: `SELECT ?i ?a (LANG(?a) AS ?lang) WHERE { VALUES ?i { ${values} } ?i skos:altLabel ?a FILTER(LANG(?a)="en" || LANG(?a)="es") }`,
      // UNION por propiedad (VALUES ?i primero): el producto VALUES × VALUES agota los 60 s del servicio.
      ids: `SELECT ?i ?p ?v WHERE { VALUES ?i { ${values} } ${idList.map((p) => `{ ?i ${p} ?v BIND("${p.slice(4)}" AS ?p) }`).join(' UNION ')} }`,
      classes: `SELECT ?i ?p ?c WHERE { VALUES ?i { ${values} } { ?i wdt:P31 ?c BIND("P31" AS ?p) } UNION { ?i wdt:P279 ?c BIND("P279" AS ?p) } }`,
    };
    for (const [kind, q] of Object.entries(queries)) await cached(join(batches, `${n}-${kind}.json`), q, `lote ${n} ${kind}`);
    if ((i + 1) % 5 === 0) console.log(`[wikidata] lote ${i + 1}/${Math.ceil(scope.length / BATCH)}`);
  }
  // 4. Manifiesto.
  const files = ['props.json', 'scope.json', ...Array.from({ length: Math.ceil(scope.length / BATCH) }, (_, i) => ['labels', 'aliases', 'ids', 'classes'].map((k) => `batches/${String(i + 1).padStart(3, '0')}-${k}.json`)).flat()];
  const entries = files.map((f) => ({ file: f, sha256: sha(readFileSync(join(dir, f))) }));
  const combined = sha(entries.map((e) => `${e.file} ${e.sha256}`).join('\n'));
  const scopeInfo = JSON.parse(readFileSync(scopePath, 'utf8'));
  writeJson(join(dir, 'manifest.json'), { generatedAt: nowIso(), endpoint: WIKIDATA.endpoint, userAgent: UA, queriedAt: scopeInfo.queriedAt, counts: { diseaseItems: scopeInfo.diseaseItems, withSpanishLabel: scopeInfo.withSpanishLabel, withCatalogId: scopeInfo.withCatalogId, withoutCatalogId: scopeInfo.withoutCatalogId, scope: scope.length }, propertyLabels: labels, files: entries.length, combinedSha256: combined }, true);
  console.log(`[wikidata] alcance ${scope.length} ítems · ${entries.length} archivos · SHA-256 combinado ${combined}`);
}

main().catch((err) => {
  console.error('ERROR FATAL en fetch-wikidata:', err);
  process.exitCode = 1;
});
