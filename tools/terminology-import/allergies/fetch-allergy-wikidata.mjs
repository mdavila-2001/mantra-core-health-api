#!/usr/bin/env node
// =============================================================================
// Catálogo de alergias · tanda 2 · etiquetas en castellano desde Wikidata (CC0).
//
// Para cada concepto cuyo identificador tiene propiedad en Wikidata (RxCUI P3345,
// UNII P652, ChEBI P683, DOID P699, Mondo P5270, NCIt P1748, MeSH P486, UniProt P352) pregunta
// al servicio SPARQL por `?item wdt:Pxxx "<id exacto>"` y guarda etiqueta y alias en castellano.
// NUNCA por nombre. Lee el catálogo de la tanda 1 (data/) y, si existe, el NDJSON de la tanda 2
// ya construido (hay que correr `build-allergy-open.mjs` antes, sin Wikidata, y de nuevo después).
//
// Cortesía con WDQS: User-Agent identificable, 1 consulta cada ~1,5 s, lotes de 150 valores, caché.
// =============================================================================

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';

import { HttpClient, ensureDir, nowIso } from '../lib/glossary-es/common.mjs';
import { OPEN_DIR, OPEN_MANIFEST, OPEN_SOURCES, OPEN_USER_AGENT } from './lib/open-sources.mjs';
import { WIKIDATA_TARGETS } from './lib/passes-open.mjs';
import { NDJSON_DIR } from './lib/sources.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const BATCH = 150;
const sha = (b) => createHash('sha256').update(b).digest('hex');
const client = new HttpClient({ concurrency: 1, minDelayMs: 1500, maxRetries: 6, headers: { 'User-Agent': OPEN_USER_AGENT } });

const records = gunzipSync(readFileSync(join(HERE, 'data', 'allergy-catalog.ndjson.gz'))).toString('utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
const openPath = join(NDJSON_DIR, 'allergy-catalog-open.ndjson');
if (existsSync(openPath)) records.push(...readFileSync(openPath, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)).filter((r) => !r.patch));

const byProp = new Map();
for (const r of records) {
  const t = WIKIDATA_TARGETS[r.codeSystem];
  if (!t) continue;
  if (!byProp.has(t.prop)) byProp.set(t.prop, new Set());
  byProp.get(t.prop).add(t.value(r.code));
}

const dir = ensureDir(join(OPEN_DIR, 'wikidata'));
const queryFor = (prop, values) =>
  `SELECT ?v ?item ?es ?alias WHERE { VALUES ?v { ${values.map((v) => JSON.stringify(v)).join(' ')} } ?item wdt:${prop} ?v . OPTIONAL { ?item rdfs:label ?es . FILTER(lang(?es) = "es") } OPTIONAL { ?item skos:altLabel ?alias . FILTER(lang(?alias) = "es") } }`;
const files = [];
let requests = 0;
for (const [prop, set] of [...byProp].sort()) {
  const values = [...set].sort();
  for (let i = 0; i < values.length; i += BATCH) {
    const name = `${prop}-${String(i / BATCH).padStart(4, '0')}.json`;
    const file = join(dir, name);
    if (!existsSync(file)) {
      const q = queryFor(prop, values.slice(i, i + BATCH));
      const res = await client.get(`https://query.wikidata.org/sparql?query=${encodeURIComponent(q)}`, { accept: 'application/sparql-results+json' });
      writeFileSync(file, res.body);
      requests += 1;
    }
    const buf = readFileSync(file);
    files.push({ path: relative(OPEN_DIR, file), url: 'https://query.wikidata.org/sparql', bytes: buf.length, sha256: sha(buf), prop, ids: Math.min(BATCH, values.length - i) });
  }
  console.log(`  ${prop}: ${values.length} identificadores`);
}
const manifest = JSON.parse(readFileSync(OPEN_MANIFEST, 'utf8'));
const prev = manifest.sources.wikidata;
const fingerprint = sha(JSON.stringify(files.map((f) => [f.path, f.sha256])));
manifest.sources.wikidata = {
  key: 'wikidata',
  ...OPEN_SOURCES.wikidata,
  retrievedAt: prev?.fingerprint === fingerprint ? prev.retrievedAt : nowIso(),
  fingerprint,
  version: 'Wikidata Query Service (consulta por identificador exacto)',
  queryTemplate: queryFor('Pxxx', ['<id>']),
  properties: Object.fromEntries([...byProp].map(([p, s]) => [p, s.size])),
  files,
};
writeFileSync(OPEN_MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
console.log(`wikidata: ${files.length} lotes (${requests} consultas nuevas)`);
