#!/usr/bin/env node
// =============================================================================
// TAREA-41 F3.5 — baja MRCOC 2024 (NLM MEDLINE Co-Occurrences) y deja SOLO los
// pares síntoma × enfermedad en un TSV chico, con constancia (SHA-256, filas).
//
// Mismo filtro y mismo formato de salida que el AI Service
// (`scripts/fetch-clinical-sources.mjs`, commit 1163e62 de AlovidaAIService):
// MeSH C23.888 (signos y síntomas) × (C ∪ F03 sin C23.888), frecuencias
// sumadas en todos los años. Ese script no es importable (al cargarlo descarga
// HPO, MONDO, Orphanet… ~cientos de MB) y está en otro repositorio, así que no
// se pudo reutilizar tal cual; la paridad se comprueba contra su lock
// (`--expect-pairs`, `--expect-sha256`) en vez de confiar en la copia.
//
// Descarga (todo público, NLM / Wikidata CC0): MRCOC en flujo (~1,6 GB, no se
// guarda), MH_freq_counts_2024 (~0,4 MB), árboles MeSH (SPARQL) y el cruce
// MeSH ↔ HPO de Wikidata (P486 ↔ P3841).
//
//   node tools/terminology-import/mrcoc/fetch-mrcoc.mjs [--out <dir>]
//        [--expect-pairs N] [--expect-sha256 HEX]
// =============================================================================

import { createHash } from 'node:crypto';
import { createWriteStream, existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createInterface } from 'node:readline';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { createGunzip } from 'node:zlib';

import { BUILD_DIR, ensureDir, nowIso } from '../lib/glossary-es/common.mjs';

const args = process.argv.slice(2);
const opt = (name, fallback = null) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
const OUT = ensureDir(resolve(opt('--out', join(BUILD_DIR, 'mrcoc'))));
const USER_AGENT = 'MantraCoreHealth-terminology-import/1.0 (TAREA-41 F3.5)';

const MRCOC_URL = 'https://data.lhncbc.nlm.nih.gov/public/ii/information/MRCOC/summary_CoOccurs_2024.txt.gz';
const FREQ_URL = 'https://data.lhncbc.nlm.nih.gov/public/ii/information/MRCOC/MH_freq_counts_2024.txt.gz';
const MESH_SPARQL = 'https://id.nlm.nih.gov/mesh/sparql';
const WIKIDATA_SPARQL = 'https://query.wikidata.org/sparql';
const MESH_BRANCHES = ['C01', 'C04', 'C05', 'C06', 'C07', 'C08', 'C09', 'C10', 'C11', 'C12', 'C14', 'C15', 'C16', 'C17', 'C18', 'C19', 'C20', 'C21', 'C22', 'C23', 'C24', 'C25', 'C26', 'F03'];
const SYMPTOM_TREE = 'C23.888';
const NLM_TERMS = 'NLM Terms and Conditions (datos públicos; citar la fuente) — https://www.nlm.nih.gov/databases/download/terms_and_conditions.html';

const sha256 = (path) => createHash('sha256').update(readFileSync(path)).digest('hex');

async function sparql(endpoint, query, { pageSize = 0 } = {}) {
  const rows = [];
  for (let offset = 0; ; offset += pageSize) {
    const q = pageSize ? `${query} LIMIT ${pageSize} OFFSET ${offset}` : query;
    const response = await fetch(`${endpoint}?${new URLSearchParams({ query: q, format: 'json' })}`, {
      headers: { 'user-agent': USER_AGENT, accept: 'application/sparql-results+json' },
    });
    if (!response.ok) throw new Error(`SPARQL ${endpoint}: HTTP ${response.status}`);
    const page = (await response.json()).results.bindings.map((b) => Object.fromEntries(Object.entries(b).map(([k, v]) => [k, v.value])));
    rows.push(...page);
    if (!pageSize || page.length < pageSize) return rows;
  }
}

function writeTsv(file, columns, rows) {
  const body = rows.map((r) => columns.map((c) => String(r[c] ?? '').replace(/[\t\n]/g, ' ')).join('\t'));
  writeFileSync(join(OUT, file), `${[columns.join('\t'), ...body].join('\n')}\n`);
}

async function main() {
  const retrievedAt = nowIso();
  const meta = { retrievedAt, sources: {} };

  const freqPath = join(OUT, 'MH_freq_counts_2024.txt.gz');
  const freqResponse = await fetch(FREQ_URL, { headers: { 'user-agent': USER_AGENT } });
  if (!freqResponse.ok || !freqResponse.body) throw new Error(`MH_freq_counts: HTTP ${freqResponse.status}`);
  await pipeline(Readable.fromWeb(freqResponse.body), createWriteStream(freqPath));
  meta.sources.meshFrequency = { url: FREQ_URL, license: NLM_TERMS, bytes: statSync(freqPath).size, sha256: sha256(freqPath) };
  console.log(`[mrcoc] MH_freq_counts_2024: ${statSync(freqPath).size} bytes`);

  const meshRows = [];
  for (const branch of MESH_BRANCHES) {
    meshRows.push(
      ...(await sparql(
        MESH_SPARQL,
        `PREFIX meshv: <http://id.nlm.nih.gov/mesh/vocab#> PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    SELECT ?dui ?label ?tree FROM <http://id.nlm.nih.gov/mesh> WHERE { ?d a meshv:TopicalDescriptor ; rdfs:label ?label ; meshv:treeNumber ?tn .
    BIND(STRAFTER(STR(?d), 'http://id.nlm.nih.gov/mesh/') AS ?dui) BIND(STRAFTER(STR(?tn), 'http://id.nlm.nih.gov/mesh/') AS ?tree) FILTER(STRSTARTS(?tree, '${branch}')) } ORDER BY ?dui ?tree`,
        { pageSize: 1000 },
      )),
    );
  }
  writeTsv('mesh-trees.tsv', ['dui', 'label', 'tree'], meshRows);
  meta.sources.meshTrees = { url: MESH_SPARQL, license: NLM_TERMS, branches: MESH_BRANCHES, rows: meshRows.length, sha256: sha256(join(OUT, 'mesh-trees.tsv')) };
  console.log(`[mrcoc] árboles MeSH: ${meshRows.length} filas`);

  const wdHpo = await sparql(WIKIDATA_SPARQL, 'SELECT ?mesh ?hpo WHERE { ?item wdt:P486 ?mesh ; wdt:P3841 ?hpo . }');
  writeTsv('wikidata-mesh-hpo.tsv', ['mesh', 'hpo'], wdHpo);
  meta.sources.wikidataMeshHpo = { url: WIKIDATA_SPARQL, license: 'CC0 1.0', rows: wdHpo.length, sha256: sha256(join(OUT, 'wikidata-mesh-hpo.tsv')) };
  console.log(`[mrcoc] Wikidata MeSH↔HPO: ${wdHpo.length} filas`);

  const symptoms = new Set(meshRows.filter((r) => r.tree.startsWith(SYMPTOM_TREE)).map((r) => r.dui));
  const diseases = new Set(meshRows.filter((r) => !r.tree.startsWith(SYMPTOM_TREE)).map((r) => r.dui));
  const pairs = new Map();
  const response = await fetch(MRCOC_URL, { headers: { 'user-agent': USER_AGENT } });
  if (!response.ok || !response.body) throw new Error(`MRCOC: HTTP ${response.status}`);
  const lines = createInterface({ input: Readable.fromWeb(response.body).pipe(createGunzip()), crlfDelay: Infinity });
  let read = 0;
  for await (const line of lines) {
    read += 1;
    if (read % 50_000_000 === 0) console.log(`[mrcoc]  … ${read / 1e6} M filas, ${pairs.size} pares`);
    const a = line.slice(0, line.indexOf('|'));
    const rest = line.indexOf('|', a.length + 1);
    const b = line.slice(rest + 1, line.indexOf('|', rest + 1));
    let key;
    if (symptoms.has(a) && diseases.has(b)) key = `${a}|${b}`;
    else if (symptoms.has(b) && diseases.has(a)) key = `${b}|${a}`;
    else continue;
    const freq = Number(line.split('|')[4]);
    if (Number.isFinite(freq)) pairs.set(key, (pairs.get(key) ?? 0) + freq);
  }
  const tsv = join(OUT, 'mrcoc-symptom-disease-2024.tsv');
  writeFileSync(tsv, `${['symptom_dui\tdisease_dui\tarticles', ...[...pairs].map(([k, n]) => `${k.replace('|', '\t')}\t${n}`)].join('\n')}\n`);
  meta.sources.mrcoc = {
    url: MRCOC_URL, license: NLM_TERMS, rowsRead: read, pairs: pairs.size, bytes: statSync(tsv).size, sha256: sha256(tsv),
    filter: `MeSH ${SYMPTOM_TREE} × (C ∪ F03 sin ${SYMPTOM_TREE}), frecuencias sumadas en todos los años`,
  };
  writeFileSync(join(OUT, 'mrcoc.meta.json'), `${JSON.stringify(meta, null, 2)}\n`);
  console.log(`[mrcoc] ${read} filas leídas → ${pairs.size} pares, sha256 ${meta.sources.mrcoc.sha256}`);

  const expectPairs = opt('--expect-pairs');
  const expectSha = opt('--expect-sha256');
  const problems = [];
  if (expectPairs && Number(expectPairs) !== pairs.size) problems.push(`pares ${pairs.size} ≠ esperado ${expectPairs}`);
  if (expectSha && expectSha !== meta.sources.mrcoc.sha256) problems.push(`sha256 distinto del esperado ${expectSha}`);
  if (problems.length) {
    console.error(`[mrcoc] PARIDAD CON EL AI SERVICE: FALLA — ${problems.join('; ')}`);
    process.exitCode = 2;
  } else if (expectPairs || expectSha) console.log('[mrcoc] PARIDAD CON EL AI SERVICE: OK');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
