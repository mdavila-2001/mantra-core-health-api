#!/usr/bin/env node
// =============================================================================
// ETL etapa 3 (load): corpus de diccionarios → `terminology.*`.
//
// Por fuente (code system): terminology_sources, code_systems,
// code_system_versions, catalog_concepts, concept_designations (EN),
// concept_properties (`dictionary-provenance`, `dictionary-entry`) y un
// catalog_import_batches. Después, cuando ya existen todos los conceptos:
//   concept_relationships  is-a, part-of, develops-from, located-in entre
//                          conceptos cargados; enfermedad → organismo
//                          (infectious-agent, transmitted-by) hacia las
//                          enfermedades que YA están en la base
//   concept_maps           xrefs publicados por la fuente que resuelven por
//                          código idéntico a un concepto ya cargado (CIE-10-ES,
//                          ICD-10-CM, MeSH del glosario, otra ontología del corpus)
//
// Deduplicación con las otras sesiones: un code system con la misma URL
// canónica o el mismo internal_code se REUSA; un concepto con el mismo código
// en esa versión se reusa (UNIQUE(code_system_version_id, code)) y todo lo
// demás cuelga del id que ya tenía.
//
// Memoria acotada: ChEBI + NCIt + PRO + FMA suman más de un millón de conceptos y no caben juntos en
// 2,5 GB. Cada fuente se lee en streaming por tandas (2 000 filas) y se recorre en tres barridos: conceptos,
// designaciones y propiedades; y, con todos los conceptos ya en la base, relaciones y concept_maps.
//
// Idempotente: ids deterministas + `ON CONFLICT DO NOTHING`; la segunda corrida
// inserta 0 (salvo el lote de auditoría catalog_import_batches, uno por corrida).
// No actualiza filas existentes. Sin DDL.
//
// Uso:
//   node tools/terminology-import/dictionaries/load-dictionaries.mjs                 # dry-run (por defecto, sin base)
//   node tools/terminology-import/dictionaries/load-dictionaries.mjs --apply         # carga (.env DB_*)
//   node tools/terminology-import/dictionaries/load-dictionaries.mjs --apply --include go,pato,abbreviations-literature
//   node tools/terminology-import/dictionaries/load-dictionaries.mjs --only uberon,cl
// =============================================================================

import 'dotenv/config';
import pg from 'pg';
import { createReadStream, existsSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { join } from 'node:path';
import { nowIso, readNdjson, writeJson } from '../lib/glossary-es/common.mjs';
import { ABBREVIATION_SOURCE, ABREMES_SOURCE, C7_OBO_SOURCES, EMDN_SOURCE, FMA_SOURCE, HGNC_SOURCE, MESH_SOURCE, OBO_SOURCES, ORGANISM_SOURCES, corpusKey } from './lib/sources.mjs';
import { NDJSON_DIR } from './lib/paths.mjs';
import {
  CONCEPT, RELATION_TYPE, codeSystemPlan, conceptId, conceptMapId, conceptTuple, designationTuples, esLabelTuples, isDefaultLoaded, lookupKeys, md5uuid, propertyTuples, relationshipTuples,
} from './lib/load-plan.mjs';

const args = process.argv.slice(2);
const argList = (flag) => (args.includes(flag) ? args[args.indexOf(flag) + 1].split(',') : []);
if (args.includes('--dry-run') && args.includes('--apply')) throw new Error('Use --dry-run o --apply, no ambos.');
const DRY_RUN = !args.includes('--apply');
const INCLUDE = new Set(argList('--include'));
const ONLY = new Set(argList('--only'));
const BATCH = 1000;
const CHUNK = 2000;

const DB_CONFIG = {
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5433),
  user: process.env.DB_USER ?? 'mantra',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME ?? 'mantra_redesa_health',
};

const SOURCES = [ORGANISM_SOURCES, ...OBO_SOURCES, FMA_SOURCE, HGNC_SOURCE, ABBREVIATION_SOURCE, ...C7_OBO_SOURCES, MESH_SOURCE, EMDN_SOURCE, ABREMES_SOURCE];

const layerPath = (source) => join(NDJSON_DIR, `${source.id}.ndjson`);

/** Fuentes presentes en disco y seleccionadas por --only. */
function activeSources() {
  const out = [];
  for (const source of SOURCES) {
    if (ONLY.size && !ONLY.has(source.id)) continue;
    if (!existsSync(layerPath(source))) { console.warn(`[load] capa ausente (se omite): ${source.id}`); continue; }
    out.push(source);
  }
  return out;
}

/** Filas que entran en la carga, por tandas y en streaming. Cuenta también las filas saltadas por política. */
async function* layerChunks(source, counters = { skipped: 0 }, size = CHUNK) {
  const rl = createInterface({ input: createReadStream(layerPath(source), { encoding: 'utf8' }), crlfDelay: Infinity });
  let chunk = [];
  for await (const line of rl) {
    if (line.trim() === '') continue;
    const row = JSON.parse(line);
    if (!isDefaultLoaded(source, row, INCLUDE)) { counters.skipped++; continue; }
    chunk.push(row);
    if (chunk.length >= size) { yield chunk; chunk = []; }
  }
  if (chunk.length) yield chunk;
}

/** Barrido previo: claves cargadas (para filtrar relaciones) y versión de cada fuente. Copias planas de las claves. */
async function scanLayers(sources) {
  const loadedKeys = new Set();
  /** Nombres ES que la propia fuente declara (FMA): el nombre de Wikidata idéntico no se duplica. */
  const ownEs = new Map();
  const layers = [];
  for (const source of sources) {
    const counters = { skipped: 0 };
    const versions = new Set();
    const retrieved = new Set();
    let count = 0;
    for await (const chunk of layerChunks(source, counters)) {
      for (const r of chunk) {
        loadedKeys.add(Buffer.from(r.key, 'utf8').toString('utf8'));
        if (r.designationsEs?.length) ownEs.set(Buffer.from(r.key, 'utf8').toString('utf8'), new Set(r.designationsEs));
        if (r.provenance.version) versions.add(r.provenance.version);
        retrieved.add(r.provenance.retrievedAt.slice(0, 10));
        count++;
      }
    }
    if (!count) { console.log(`[load] sin filas por política (opt-in): ${source.id} (${counters.skipped} saltadas)`); continue; }
    // Misma regla que versionOf (load-plan.mjs) sin tener todas las filas a mano.
    const version = versions.size ? [...versions].sort().at(-1) : [...retrieved].sort().at(-1);
    layers.push({ source, count, skipped: counters.skipped, plan: codeSystemPlan(source, [{ provenance: { version: versions.size ? version : null, retrievedAt: `${version}T00:00:00.000Z` } }]) });
  }
  return { layers, loadedKeys, ownEs };
}

async function insertMany(client, table, columns, tuples, casts) {
  let inserted = 0;
  for (let i = 0; i < tuples.length; i += BATCH) {
    const chunk = tuples.slice(i, i + BATCH);
    const params = [];
    const values = chunk.map((t) => `(${t.map((v, j) => { params.push(v); return `$${params.length}${casts[j] ? `::${casts[j]}` : ''}`; }).join(', ')}, now(), now(), 1)`);
    const sql = `INSERT INTO terminology.${table} (${columns.join(', ')}, created_at, updated_at, row_version) VALUES ${values.join(',\n')} ON CONFLICT DO NOTHING`;
    try {
      inserted += (await client.query(sql, params)).rowCount;
    } catch (err) {
      throw new Error(`INSERT en ${table} falló (lote ${i / BATCH + 1}): ${err.message}`);
    }
  }
  return inserted;
}

const COLS = {
  concepts: [['id', 'code_system_version_id', 'code', 'display', 'definition', 'state_concept_id'], ['uuid', 'uuid', null, null, null, 'uuid']],
  designations: [['id', 'concept_id', 'language_concept_id', 'designation_type_concept_id', 'value', 'preferred'], ['uuid', 'uuid', 'uuid', 'uuid', null, null]],
  properties: [['id', 'concept_id', 'property_code', 'data_type', 'value_json'], ['uuid', 'uuid', null, 'terminology.technical_data_type', 'jsonb']],
  relationships: [['id', 'source_concept_id', 'target_concept_id', 'relationship_type_concept_id', 'ordinal'], ['uuid', 'uuid', 'uuid', 'uuid', null]],
  conceptMaps: [['id', 'source_concept_id', 'target_concept_id', 'equivalence_concept_id', 'context', 'version', 'state_concept_id'], ['uuid', 'uuid', 'uuid', 'uuid', null, null, 'uuid']],
};
const insertInto = (client, table, tuples) => insertMany(client, table === 'conceptMaps' ? 'concept_maps' : table === 'relationships' ? 'concept_relationships' : table === 'concepts' ? 'catalog_concepts' : table === 'designations' ? 'concept_designations' : 'concept_properties', COLS[table][0], tuples, COLS[table][1]);

async function assertPrerequisites(client) {
  const needed = { ...CONCEPT, ...RELATION_TYPE };
  const { rows } = await client.query('SELECT id FROM terminology.catalog_concepts WHERE id = ANY($1::uuid[])', [Object.values(needed)]);
  const have = new Set(rows.map((r) => r.id));
  const missing = Object.entries(needed).filter(([, id]) => !have.has(id)).map(([k]) => k);
  if (missing.length) throw new Error(`Faltan conceptos internos del backend: ${missing.join(', ')}. Arrancá la API (con el concepts.ts de esta rama) una vez para que los siembre.`);
}

/** Fuente + code system + versión; reusa lo que ya exista por código, URL canónica o versión. */
async function ensureCodeSystem(client, p) {
  await client.query(
    `INSERT INTO terminology.terminology_sources (id, code, name, owner, official_url, license, state_concept_id, created_at, updated_at, row_version)
     VALUES ($1::uuid, $2, $3, $4, $5, $6, $7::uuid, now(), now(), 1) ON CONFLICT DO NOTHING`,
    [p.source.id, p.source.code, p.source.name, p.source.owner, p.source.officialUrl, p.source.license, CONCEPT.TERM_ACTIVE],
  );
  const { rows: src } = await client.query('SELECT id FROM terminology.terminology_sources WHERE code = $1', [p.source.code]);
  await client.query(
    `INSERT INTO terminology.code_systems (id, source_id, internal_code, name, canonical_url, case_sensitive, supports_composition, state_concept_id, created_at, updated_at, row_version)
     VALUES ($1::uuid, $2::uuid, $3, $4, $5, true, false, $6::uuid, now(), now(), 1) ON CONFLICT DO NOTHING`,
    [p.codeSystem.id, src[0].id, p.codeSystem.internalCode, p.codeSystem.name, p.codeSystem.canonicalUrl, CONCEPT.TERM_ACTIVE],
  );
  const { rows: cs } = await client.query('SELECT id, internal_code, canonical_url FROM terminology.code_systems WHERE canonical_url = $1 OR internal_code = $2 ORDER BY (canonical_url = $1) DESC LIMIT 1', [p.codeSystem.canonicalUrl, p.codeSystem.internalCode]);
  await client.query(
    `INSERT INTO terminology.code_system_versions (id, code_system_id, version, published_at, is_default, state_concept_id, created_at, updated_at, row_version)
     VALUES ($1::uuid, $2::uuid, $3, now(), true, $4::uuid, now(), now(), 1) ON CONFLICT DO NOTHING`,
    [p.version.id, cs[0].id, p.version.version, CONCEPT.TERM_ACTIVE],
  );
  const { rows: v } = await client.query('SELECT id FROM terminology.code_system_versions WHERE code_system_id = $1 AND version = $2', [cs[0].id, p.version.version]);
  return { sourceId: src[0].id, codeSystemId: cs[0].id, reusedCodeSystem: cs[0].internal_code !== p.codeSystem.internalCode ? cs[0].internal_code : null, versionId: v[0].id };
}

/** Índices de la base para resolver xrefs y enfermedades por código idéntico. */
async function loadLookups(client) {
  const byCode = new Map();
  const { rows } = await client.query(
    `SELECT cs.internal_code, cs.canonical_url, cc.code, cc.id FROM terminology.catalog_concepts cc
       JOIN terminology.code_system_versions v ON v.id = cc.code_system_version_id
       JOIN terminology.code_systems cs ON cs.id = v.code_system_id
      WHERE cs.internal_code = ANY($1) OR cs.canonical_url = ANY($2)`,
    [['icd10cm', 'cie10es-diagnosticos-2026'], ['http://purl.obolibrary.org/obo/mondo.owl', 'http://purl.obolibrary.org/obo/doid.owl']],
  );
  for (const r of rows) {
    const k1 = `${r.internal_code}|${r.code.toUpperCase()}`;
    const k2 = `${r.canonical_url}|${r.code}`;
    for (const k of [k1, k2]) if (!byCode.has(k)) byCode.set(k, r.id);
  }
  // Fichas del glosario por los códigos externos que declaran (MeSH de MedlinePlus/Wikidata, TA98 de la anatomía de Wikidata).
  const ext = { mesh: new Map(), ta98: new Map() };
  const { rows: m } = await client.query(`SELECT concept_id, value_json->'mesh' AS mesh, value_json->'ta98' AS ta98 FROM terminology.concept_properties WHERE property_code = 'glossary-external-ids' AND (value_json ? 'mesh' OR value_json ? 'ta98')`);
  for (const r of m) for (const k of ['mesh', 'ta98']) for (const d of [].concat(r[k] ?? [])) { if (!ext[k].has(d)) ext[k].set(d, []); ext[k].get(d).push(r.concept_id); }
  return {
    resolve(xrefId) {
      const out = [];
      for (const k of lookupKeys(xrefId)) {
        if (k.kind === 'code') for (const cs of k.codeSystems) { const id = byCode.get(`${cs}|${k.code}`); if (id) out.push({ id, via: `${cs} ${k.code}` }); }
        if (k.kind === 'canonical') { const id = byCode.get(`${k.canonicalUrl}|${k.code}`); if (id) out.push({ id, via: `${k.canonicalUrl} ${k.code}` }); }
        if (k.kind === 'mesh' || k.kind === 'ta98') for (const id of ext[k.kind].get(k.code) ?? []) out.push({ id, via: `glossary ${k.kind} ${k.code}` });
      }
      return out;
    },
    sizes: { codes: byCode.size, mesh: ext.mesh.size, ta98: ext.ta98.size },
  };
}

/** Xrefs → concept_maps, sólo hacia conceptos que existen (corpus cargado o base). */
function conceptMapTuples(row, lookups, keyToId, version) {
  const out = [];
  const src = keyToId.get(row.key);
  for (const x of row.xrefs) {
    const targets = [];
    const internalKey = corpusKey(x.id);
    const internal = internalKey ? keyToId.get(internalKey) : null;
    if (internal) targets.push({ id: internal, via: 'corpus' });
    targets.push(...lookups.resolve(x.id));
    for (const t of targets) {
      if (t.id === src) continue;
      const context = `xref ${x.id} declarado por ${row.provenance.sourceId} ${row.provenance.version ?? ''} (${row.code}); resuelto: ${t.via}`.slice(0, 250);
      out.push([conceptMapId(row.key, t.id, x.id), src, t.id, x.equivalent ? CONCEPT.EQUIV_EQUIVALENT : null, context, version, CONCEPT.TERM_ACTIVE]);
    }
  }
  return out;
}

/** Aristas enfermedad → organismo hacia enfermedades ya cargadas en la base. */
function diseaseAgentTuples(edges, lookups, keyToId) {
  const out = [];
  const stats = { edges: edges.length, withOrganism: 0, resolvedDisease: 0, unresolvedDisease: 0, relationships: 0 };
  for (const e of edges) {
    const org = keyToId.get(`ncbitaxon|${e.target}`);
    if (!org) continue;
    stats.withOrganism++;
    const ids = [e.diseaseId, ...e.diseaseXrefs.filter((x) => e.diseaseSystem === 'doid' || x.equivalent).map((x) => x.id)];
    const diseases = new Map();
    for (const id of ids) for (const t of lookups.resolve(id)) diseases.set(t.id, t.via);
    if (!diseases.size) { stats.unresolvedDisease++; continue; }
    stats.resolvedDisease++;
    for (const [d] of diseases) {
      out.push([md5uuid(`mantra:dictionaries:relationship:disease:${d}:${e.type}:ncbitaxon|${e.target}`), d, org, RELATION_TYPE[e.type], null]);
      stats.relationships++;
    }
  }
  return { tuples: out, stats };
}

/** Nombres ES de Wikidata (wikidata-es-labels.ndjson) sólo para conceptos que se cargan en esta corrida. */
function esLabelPlan(loadedKeys, ownEs = new Map()) {
  const esPath = join(NDJSON_DIR, 'wikidata-es-labels.ndjson');
  const byKey = new Map();
  if (existsSync(esPath)) {
    for (const r of readNdjson(esPath)) {
      const key = `${r.codeSystem}|${r.code}`;
      if (!loadedKeys.has(key)) continue;
      if (!byKey.has(key)) byKey.set(key, []);
      byKey.get(key).push(r);
    }
  }
  const es = [...byKey].map(([key, rows]) => esLabelTuples(key, rows, ownEs.get(key)));
  return { concepts: es.length, designations: es.flatMap((x) => x.designations), properties: es.map((x) => x.property) };
}

async function main() {
  const t0 = Date.now();
  console.log(`=== Carga de diccionarios médicos a terminology.* ${DRY_RUN ? '(DRY-RUN por defecto, sin base)' : '(APPLY explícito)'} ===`);
  const sources = activeSources();
  const { layers, loadedKeys, ownEs } = await scanLayers(sources);
  const edgesPath = join(NDJSON_DIR, 'disease-agents.ndjson');
  const edges = existsSync(edgesPath) ? readNdjson(edgesPath) : [];
  const es = esLabelPlan(loadedKeys, ownEs);

  if (DRY_RUN) {
    const summary = [];
    for (const l of layers) {
      const s = { source: l.source.id, codeSystem: l.plan.codeSystem.internalCode, version: l.plan.version.version, skippedByPolicy: l.skipped, concepts: 0, designations: 0, properties: 0, relationships: 0 };
      for await (const chunk of layerChunks(l.source)) {
        s.concepts += chunk.length;
        for (const r of chunk) {
          s.designations += designationTuples(r).length;
          s.properties += propertyTuples(r).length;
          s.relationships += relationshipTuples(r, loadedKeys).length;
        }
      }
      summary.push(s);
    }
    const totals = Object.fromEntries(['concepts', 'designations', 'properties', 'relationships'].map((k) => [k, summary.reduce((n, s) => n + s[k], 0)]));
    console.log(JSON.stringify({ include: [...INCLUDE], summary, totals, diseaseAgentEdges: edges.length, wikidataEsLabels: { concepts: es.concepts, designations: es.designations.length } }, null, 2));
    writeJson(join(NDJSON_DIR, '..', 'load-plan.dry-run.json'), { generatedAt: nowIso(), include: [...INCLUDE], summary, totals }, true);
    console.log('Plan escrito. No se tocó ninguna base (xrefs y aristas a enfermedades se resuelven contra la base en --apply).');
    return;
  }

  const client = new pg.Client(DB_CONFIG);
  await client.connect();
  const result = [];
  try {
    await assertPrerequisites(client);
    const keyToId = new Map();
    const remap = new Map(); // id determinista propio → id real (concepto que ya existía)
    const fix = (tuples, idx) => { if (remap.size) for (const t of tuples) for (const i of idx) t[i] = remap.get(t[i]) ?? t[i]; return tuples; };
    const done = [];
    for (const l of layers) {
      const startedAt = new Date();
      const cs = await ensureCodeSystem(client, l.plan);
      const r = { source: l.source.id, codeSystem: l.plan.codeSystem.internalCode, reusedCodeSystem: cs.reusedCodeSystem, concepts: 0, designations: 0, properties: 0, conceptsReused: 0 };
      // Barrido 1: conceptos.
      for await (const chunk of layerChunks(l.source)) {
        const tuples = chunk.map((row) => conceptTuple(row, cs.versionId));
        r.concepts += await insertInto(client, 'concepts', tuples);
      }
      // Ids reales por (versión, código): si otra sesión ya tenía el concepto, se cuelga del suyo.
      const { rows } = await client.query('SELECT code, id FROM terminology.catalog_concepts WHERE code_system_version_id = $1', [cs.versionId]);
      const real = new Map(rows.map((x) => [x.code, x.id]));
      // Barrido 2: designaciones y propiedades (más claves de los ids reales).
      for await (const chunk of layerChunks(l.source)) {
        for (const row of chunk) {
          const id = real.get(row.code);
          keyToId.set(Buffer.from(row.key, 'utf8').toString('utf8'), id);
          if (id !== conceptId(row.key)) { remap.set(conceptId(row.key), id); r.conceptsReused++; }
        }
        r.designations += await insertInto(client, 'designations', fix(chunk.flatMap(designationTuples), [1]));
        r.properties += await insertInto(client, 'properties', fix(chunk.flatMap(propertyTuples), [1]));
      }
      done.push({ l, r, cs, startedAt });
      console.log(`[load] ${JSON.stringify(r)}`);
    }
    const lookups = await loadLookups(client);
    for (const { l, r, cs, startedAt } of done) {
      // Barrido 3: relaciones y concept_maps, con todos los conceptos ya en la base.
      r.relationships = 0;
      r.conceptMaps = 0;
      for await (const chunk of layerChunks(l.source)) {
        r.relationships += await insertInto(client, 'relationships', fix(chunk.flatMap((row) => relationshipTuples(row, loadedKeys)), [1, 2]));
        r.conceptMaps += await insertInto(client, 'conceptMaps', chunk.flatMap((row) => conceptMapTuples(row, lookups, keyToId, l.plan.version.version)));
      }
      const total = r.concepts + r.designations + r.properties + r.relationships + r.conceptMaps;
      await client.query(
        `INSERT INTO terminology.catalog_import_batches (id, source_id, code_system_version_id, started_at, finished_at, total_read, total_inserted, total_errors, checksum, recorded_at)
         VALUES ($1::uuid, $2::uuid, $3::uuid, $4, now(), $5, $6, 0, $7, now())`,
        [md5uuid(`mantra:dictionaries:batch:${l.plan.codeSystem.internalCode}:${startedAt.toISOString()}`), cs.sourceId, cs.versionId, startedAt, l.count, total, md5uuid(`${l.source.id}:${l.count}`)],
      );
      result.push(r);
      console.log(`[load] ${JSON.stringify(r)}`);
    }
    if (es.concepts) {
      const d = await insertInto(client, 'designations', fix(es.designations, [1]));
      const pr = await insertInto(client, 'properties', fix(es.properties, [1]));
      result.push({ source: 'wikidata-es-labels', concepts: es.concepts, designations: d, properties: pr });
      console.log(`[load] ${JSON.stringify(result.at(-1))}`);
    }
    const agents = diseaseAgentTuples(edges, lookups, keyToId);
    const inserted = await insertInto(client, 'relationships', agents.tuples);
    result.push({ source: 'disease-agents', ...agents.stats, inserted, lookups: lookups.sizes });
    console.log(`[load] disease-agents ${JSON.stringify(result.at(-1))}`);
  } finally {
    await client.end();
  }
  const report = { finishedAt: nowIso(), seconds: Math.round((Date.now() - t0) / 1000), include: [...INCLUDE], result };
  writeJson(join(NDJSON_DIR, '..', `load-report.${Date.now()}.json`), report, true);
  console.log('\n=== RESUMEN (filas NUEVAS; 0 en la segunda corrida = idempotente) ===');
  console.log(JSON.stringify(report, null, 2));
}

main().catch((err) => {
  console.error('ERROR FATAL en load-dictionaries:', err);
  process.exitCode = 1;
});
