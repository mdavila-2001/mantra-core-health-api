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
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { nowIso, readNdjson, writeJson } from '../lib/glossary-es/common.mjs';
import { ABBREVIATION_SOURCE, FMA_SOURCE, HGNC_SOURCE, OBO_SOURCES, ORGANISM_SOURCES, PREFIX_CODE_SYSTEM } from './lib/sources.mjs';
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

const DB_CONFIG = {
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5433),
  user: process.env.DB_USER ?? 'mantra',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME ?? 'mantra_redesa_health',
};

const SOURCES = [ORGANISM_SOURCES, ...OBO_SOURCES, FMA_SOURCE, HGNC_SOURCE, ABBREVIATION_SOURCE];

function loadCorpus() {
  const out = [];
  for (const source of SOURCES) {
    if (ONLY.size && !ONLY.has(source.id)) continue;
    const p = join(NDJSON_DIR, `${source.id}.ndjson`);
    if (!existsSync(p)) { console.warn(`[load] capa ausente (se omite): ${source.id}`); continue; }
    const all = readNdjson(p);
    const rows = all.filter((r) => isDefaultLoaded(source, r, INCLUDE));
    out.push({ source, rows, skipped: all.length - rows.length });
  }
  const edgesPath = join(NDJSON_DIR, 'disease-agents.ndjson');
  const esPath = join(NDJSON_DIR, 'wikidata-es-labels.ndjson');
  return {
    layers: out.filter((l) => l.rows.length),
    skipped: out.filter((l) => !l.rows.length).map((l) => l.source.id),
    edges: existsSync(edgesPath) ? readNdjson(edgesPath) : [],
    esLabels: existsSync(esPath) ? readNdjson(esPath) : [],
  };
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

function plan() {
  const { layers, skipped, edges, esLabels } = loadCorpus();
  const loadedKeys = new Set(layers.flatMap((l) => l.rows.map((r) => r.key)));
  // Nombres ES de Wikidata: sólo para conceptos que se cargan en esta corrida.
  const esByKey = new Map();
  for (const r of esLabels) {
    const key = `${r.codeSystem}|${r.code}`;
    if (!loadedKeys.has(key)) continue;
    if (!esByKey.has(key)) esByKey.set(key, []);
    esByKey.get(key).push(r);
  }
  const es = [...esByKey].map(([key, rows]) => esLabelTuples(key, rows));
  return {
    layers: layers.map((l) => {
      const p = codeSystemPlan(l.source, l.rows);
      return {
        ...p,
        layer: l,
        concepts: l.rows.map((r) => conceptTuple(r, p.version.id)),
        designations: l.rows.flatMap(designationTuples),
        properties: l.rows.flatMap(propertyTuples),
        relationships: l.rows.flatMap((r) => relationshipTuples(r, loadedKeys)),
      };
    }),
    skipped,
    edges,
    loadedKeys,
    esLabels: { concepts: es.length, designations: es.flatMap((x) => x.designations), properties: es.map((x) => x.property) },
  };
}

/** Xrefs → concept_maps, sólo hacia conceptos que existen (corpus cargado o base). */
function conceptMapTuples(row, lookups, keyToId, version) {
  const out = [];
  const src = keyToId.get(row.key);
  for (const x of row.xrefs) {
    const prefix = x.id.split(':')[0];
    const targets = [];
    const internal = keyToId.get(`${PREFIX_CODE_SYSTEM[prefix] ?? ''}|${x.id}`);
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

async function main() {
  const t0 = Date.now();
  console.log(`=== Carga de diccionarios médicos a terminology.* ${DRY_RUN ? '(DRY-RUN por defecto, sin base)' : '(APPLY explícito)'} ===`);
  const p = plan();
  const summary = p.layers.map((l) => ({
    source: l.layer.source.id, codeSystem: l.codeSystem.internalCode, version: l.version.version, skippedByPolicy: l.layer.skipped,
    concepts: l.concepts.length, designations: l.designations.length, properties: l.properties.length, relationships: l.relationships.length,
  }));
  const totals = Object.fromEntries(['concepts', 'designations', 'properties', 'relationships'].map((k) => [k, summary.reduce((n, s) => n + s[k], 0)]));
  console.log(JSON.stringify({ include: [...INCLUDE], notLoaded: p.skipped, summary, totals, diseaseAgentEdges: p.edges.length, wikidataEsLabels: { concepts: p.esLabels.concepts, designations: p.esLabels.designations.length } }, null, 2));
  if (DRY_RUN) {
    writeJson(join(NDJSON_DIR, '..', 'load-plan.dry-run.json'), { generatedAt: nowIso(), include: [...INCLUDE], summary, totals, sample: p.layers.map((l) => ({ codeSystem: l.codeSystem, version: l.version, concept: l.concepts[0], designation: l.designations[0], relationship: l.relationships[0] ?? null })) }, true);
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
    for (const l of p.layers) {
      const startedAt = new Date();
      const cs = await ensureCodeSystem(client, l);
      for (const c of l.concepts) c[1] = cs.versionId;
      const r = { source: l.layer.source.id, codeSystem: l.codeSystem.internalCode, reusedCodeSystem: cs.reusedCodeSystem };
      r.concepts = await insertMany(client, 'catalog_concepts', ['id', 'code_system_version_id', 'code', 'display', 'definition', 'state_concept_id'], l.concepts, ['uuid', 'uuid', null, null, null, 'uuid']);
      // Ids reales por (versión, código): si otra sesión ya tenía el concepto, se cuelga del suyo.
      const { rows } = await client.query('SELECT code, id FROM terminology.catalog_concepts WHERE code_system_version_id = $1', [cs.versionId]);
      const real = new Map(rows.map((x) => [x.code, x.id]));
      r.conceptsReused = 0;
      for (const row of l.layer.rows) {
        const id = real.get(row.code);
        keyToId.set(row.key, id);
        if (id !== conceptId(row.key)) { remap.set(conceptId(row.key), id); r.conceptsReused++; }
      }
      r.designations = await insertMany(client, 'concept_designations', ['id', 'concept_id', 'language_concept_id', 'designation_type_concept_id', 'value', 'preferred'], fix(l.designations, [1]), ['uuid', 'uuid', 'uuid', 'uuid', null, null]);
      r.properties = await insertMany(client, 'concept_properties', ['id', 'concept_id', 'property_code', 'data_type', 'value_json'], fix(l.properties, [1]), ['uuid', 'uuid', null, 'terminology.technical_data_type', 'jsonb']);
      done.push({ l, r, cs, startedAt });
    }
    const lookups = await loadLookups(client);
    for (const { l, r, cs, startedAt } of done) {
      r.relationships = await insertMany(client, 'concept_relationships', ['id', 'source_concept_id', 'target_concept_id', 'relationship_type_concept_id', 'ordinal'], fix(l.relationships, [1, 2]), ['uuid', 'uuid', 'uuid', 'uuid', null]);
      const maps = l.layer.rows.flatMap((row) => conceptMapTuples(row, lookups, keyToId, l.version.version));
      r.conceptMaps = await insertMany(client, 'concept_maps', ['id', 'source_concept_id', 'target_concept_id', 'equivalence_concept_id', 'context', 'version', 'state_concept_id'], maps, ['uuid', 'uuid', 'uuid', 'uuid', null, null, 'uuid']);
      const total = r.concepts + r.designations + r.properties + r.relationships + r.conceptMaps;
      await client.query(
        `INSERT INTO terminology.catalog_import_batches (id, source_id, code_system_version_id, started_at, finished_at, total_read, total_inserted, total_errors, checksum, recorded_at)
         VALUES ($1::uuid, $2::uuid, $3::uuid, $4, now(), $5, $6, 0, $7, now())`,
        [md5uuid(`mantra:dictionaries:batch:${l.codeSystem.internalCode}:${startedAt.toISOString()}`), cs.sourceId, cs.versionId, startedAt, l.layer.rows.length, total, md5uuid(l.layer.rows.map((x) => x.key).join('|'))],
      );
      result.push(r);
      console.log(`[load] ${JSON.stringify(r)}`);
    }
    if (p.esLabels.concepts) {
      const d = await insertMany(client, 'concept_designations', ['id', 'concept_id', 'language_concept_id', 'designation_type_concept_id', 'value', 'preferred'], fix(p.esLabels.designations, [1]), ['uuid', 'uuid', 'uuid', 'uuid', null, null]);
      const pr = await insertMany(client, 'concept_properties', ['id', 'concept_id', 'property_code', 'data_type', 'value_json'], fix(p.esLabels.properties, [1]), ['uuid', 'uuid', null, 'terminology.technical_data_type', 'jsonb']);
      result.push({ source: 'wikidata-es-labels', concepts: p.esLabels.concepts, designations: d, properties: pr });
      console.log(`[load] ${JSON.stringify(result.at(-1))}`);
    }
    const agents = diseaseAgentTuples(p.edges, lookups, keyToId);
    const inserted = await insertMany(client, 'concept_relationships', ['id', 'source_concept_id', 'target_concept_id', 'relationship_type_concept_id', 'ordinal'], agents.tuples, ['uuid', 'uuid', 'uuid', 'uuid', null]);
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
