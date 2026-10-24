#!/usr/bin/env node
// =============================================================================
// Catálogo de análisis · etapa 2 (NDJSON común → `terminology.*`).
//
// Lee `ndjson/lab-tests-<capa>.ndjson` (+ `.meta.json`) y carga:
//   terminology_sources / code_systems / code_system_versions
//   catalog_concepts        un concepto por código de la fuente
//   concept_designations    variante LOINC en castellano (si se aportó)
//   concept_properties      los seis ejes LOINC, clase, unidades, paneles, procedencia…
//   concept_relationships   miembro «parte de» panel (LOINC), jerarquía «es un» (HL7)
//   value_sets / _versions / _members   dominios, clases LOINC, tablas HL7, UCUM
//   catalog_import_batches  un lote por code system y corrida
//
// Idempotente: ids deterministas + `ON CONFLICT DO NOTHING`; la segunda corrida
// inserta 0 filas de catálogo (sólo agrega el registro de auditoría del lote).
// No actualiza filas existentes ni escribe DDL (ADR-0021).
//
// Uso:
//   node tools/terminology-import/lab-tests/load-lab-tests.mjs              # dry-run: plan y conteos, sin base
//   node tools/terminology-import/lab-tests/load-lab-tests.mjs --apply      # carga real (.env DB_*)
//   … --layers hl7-tho,ucum                                                  # sólo esas capas
// =============================================================================

import 'dotenv/config';
import pg from 'pg';
import { createReadStream, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { createInterface } from 'node:readline';
import { gunzipSync } from 'node:zlib';

import { BUILD_DIR, nowIso, writeJson } from '../lib/glossary-es/common.mjs';
import { CONCEPT, md5uuid } from '../lib/glossary-es/load-plan.mjs';
import { PREREQUISITE_CONCEPTS, buildPlan, planSummary } from './lib/load-plan.mjs';
import { DATA_DIR } from './pack-lab-tests-data.mjs';

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const LAYERS = args.includes('--layers') ? args[args.indexOf('--layers') + 1].split(',') : ['loinc', 'hl7-tho', 'ucum', 'fonasa-mle', 'sigtap-sus', 'tuss-ans', 'icd10pcs-cms', 'pami-nomenclador', 'cups-co', 'gtr-ncbi'];
const BATCH = 1000;

const DB_CONFIG = {
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5433),
  user: process.env.DB_USER ?? 'mantra',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME ?? 'mantra_redesa_health',
};

/**
 * Una capa: primero el build local (`<GLOSSARY_BUILD_DIR>/ndjson/`); si no está,
 * la copia versionada y comprimida de `data/` (pack-lab-tests-data.mjs), cuyo
 * SHA-256 sin comprimir se verifica contra `data/checksums.json`.
 */
async function readLayer(layer) {
  const path = join(BUILD_DIR, 'ndjson', `lab-tests-${layer}.ndjson`);
  if (existsSync(path)) {
    const meta = JSON.parse(readFileSync(path.replace(/\.ndjson$/, '.meta.json'), 'utf8'));
    const records = [];
    for await (const line of createInterface({ input: createReadStream(path), crlfDelay: Infinity })) if (line.trim()) records.push(JSON.parse(line));
    return { layer, meta, records, from: path };
  }
  const base = `lab-tests-${layer}`;
  const sums = existsSync(join(DATA_DIR, 'checksums.json')) ? JSON.parse(readFileSync(join(DATA_DIR, 'checksums.json'), 'utf8')) : {};
  if (!sums[base]) return null;
  const raw = Buffer.concat(sums[base].files.map((f) => gunzipSync(readFileSync(join(DATA_DIR, f)))));
  const sha = createHash('sha256').update(raw).digest('hex');
  if (sha !== sums[base].sha256) throw new Error(`${base}: el SHA-256 de data/ no coincide con checksums.json (${sha})`);
  const meta = JSON.parse(readFileSync(join(DATA_DIR, `${base}.meta.json`), 'utf8'));
  const records = raw.toString('utf8').split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l));
  return { layer, meta, records, from: `data/${sums[base].files.join(', ')}` };
}

async function insertMany(client, table, columns, tuples, casts, audit = true) {
  let inserted = 0;
  const tail = audit ? ', now(), now(), 1' : '';
  const extra = audit ? ', created_at, updated_at, row_version' : '';
  for (let i = 0; i < tuples.length; i += BATCH) {
    const chunk = tuples.slice(i, i + BATCH);
    const params = [];
    const values = chunk.map((t) => `(${t.map((v, j) => (params.push(v), `$${params.length}${casts[j] ? `::${casts[j]}` : ''}`)).join(', ')}${tail})`);
    const res = await client.query(`INSERT INTO terminology.${table} (${columns.join(', ')}${extra}) VALUES ${values.join(',\n')} ON CONFLICT DO NOTHING`, params);
    inserted += res.rowCount;
  }
  return inserted;
}

async function assertPrerequisites(client) {
  const ids = Object.values(PREREQUISITE_CONCEPTS);
  const { rows } = await client.query('SELECT id FROM terminology.catalog_concepts WHERE id = ANY($1::uuid[])', [ids]);
  const have = new Set(rows.map((r) => r.id));
  const missing = Object.entries(PREREQUISITE_CONCEPTS).filter(([, id]) => !have.has(id)).map(([k]) => k);
  if (missing.length) throw new Error(`Faltan conceptos internos (${missing.join(', ')}): arrancá la API una vez para que siembre terminology.`);
}

async function load(client, plan) {
  const r = { sources: 0, codeSystems: 0, versions: 0, concepts: 0, properties: 0, designations: 0, relationships: 0, valueSets: 0, valueSetVersions: 0, valueSetMembers: 0, batches: 0 };
  const startedAt = new Date();
  await client.query('BEGIN');
  try {
    for (const s of plan.sources) {
      r.sources += (await client.query(
        `INSERT INTO terminology.terminology_sources (id, code, name, owner, official_url, license, state_concept_id, created_at, updated_at, row_version)
         VALUES ($1::uuid, $2, $3, $4, $5, $6, $7::uuid, now(), now(), 1) ON CONFLICT DO NOTHING`,
        [s.id, s.code, s.name, s.owner, s.officialUrl, s.license, CONCEPT.TERM_ACTIVE],
      )).rowCount;
    }
    // Las filas pueden existir con otro id (p. ej. creadas por import-loinc.mjs): se resuelven por clave natural.
    const sourceIdByCode = new Map((await client.query('SELECT id, code FROM terminology.terminology_sources WHERE code = ANY($1)', [plan.sources.map((s) => s.code)])).rows.map((x) => [x.code, x.id]));
    const versionIdOf = new Map();
    for (const cs of plan.codeSystems) {
      const sourceRowId = sourceIdByCode.get(plan.sources.find((s) => s.key === cs.sourceKey).code);
      r.codeSystems += (await client.query(
        `INSERT INTO terminology.code_systems (id, source_id, internal_code, name, canonical_url, case_sensitive, supports_composition, state_concept_id, created_at, updated_at, row_version)
         VALUES ($1::uuid, $2::uuid, $3, $4, $5, true, false, $6::uuid, now(), now(), 1) ON CONFLICT DO NOTHING`,
        [cs.id, sourceRowId, cs.internalCode, cs.name, cs.canonicalUrl, CONCEPT.TERM_ACTIVE],
      )).rowCount;
      const { rows: csRow } = await client.query('SELECT id FROM terminology.code_systems WHERE internal_code = $1', [cs.internalCode]);
      r.versions += (await client.query(
        `INSERT INTO terminology.code_system_versions (id, code_system_id, version, published_at, is_default, state_concept_id, created_at, updated_at, row_version)
         VALUES ($1::uuid, $2::uuid, $3, now(),
                 NOT EXISTS (SELECT 1 FROM terminology.code_system_versions WHERE code_system_id = $2::uuid AND is_default), $4::uuid, now(), now(), 1)
         ON CONFLICT DO NOTHING`,
        [cs.versionId, csRow[0].id, cs.version, CONCEPT.TERM_ACTIVE],
      )).rowCount;
      const { rows: v } = await client.query('SELECT id FROM terminology.code_system_versions WHERE code_system_id = $1 AND version = $2', [csRow[0].id, cs.version]);
      versionIdOf.set(cs.versionId, v[0].id);
      cs.dbSourceId = sourceRowId;
    }
    const insertedByCs = new Map();
    for (const cs of plan.codeSystems) {
      const tuples = plan.concepts.filter((c) => c[1] === cs.versionId).map((c) => [c[0], versionIdOf.get(cs.versionId), ...c.slice(2)]);
      const n = await insertMany(client, 'catalog_concepts', ['id', 'code_system_version_id', 'code', 'display', 'definition', 'abstract', 'selectable', 'state_concept_id'], tuples, ['uuid', 'uuid', null, null, null, null, null, 'uuid']);
      insertedByCs.set(cs.internalCode, n);
      r.concepts += n;
    }
    r.properties = await insertMany(client, 'concept_properties', ['id', 'concept_id', 'property_code', 'data_type', 'value_json'], plan.properties, ['uuid', 'uuid', null, 'terminology.technical_data_type', 'jsonb']);
    r.designations = await insertMany(client, 'concept_designations', ['id', 'concept_id', 'language_concept_id', 'designation_type_concept_id', 'value', 'preferred'], plan.designations, ['uuid', 'uuid', 'uuid', 'uuid', null, null]);
    r.relationships = await insertMany(client, 'concept_relationships', ['id', 'source_concept_id', 'target_concept_id', 'relationship_type_concept_id', 'ordinal'], plan.relationships, ['uuid', 'uuid', 'uuid', 'uuid', null]);
    for (const vs of plan.valueSets) {
      r.valueSets += (await client.query(
        `INSERT INTO terminology.value_sets (id, internal_code, name, canonical_url, description, state_concept_id, created_at, updated_at, row_version)
         VALUES ($1::uuid, $2, $3, $4, $5, $6::uuid, now(), now(), 1) ON CONFLICT DO NOTHING`,
        [vs.id, vs.code, vs.name, vs.canonicalUrl, vs.description, CONCEPT.TERM_ACTIVE],
      )).rowCount;
      r.valueSetVersions += (await client.query(
        `INSERT INTO terminology.value_set_versions (id, value_set_id, version, is_default, state_concept_id, created_at, updated_at, row_version)
         VALUES ($1::uuid, $2::uuid, $3, true, $4::uuid, now(), now(), 1) ON CONFLICT DO NOTHING`,
        [vs.versionId, vs.id, vs.version, CONCEPT.TERM_ACTIVE],
      )).rowCount;
      r.valueSetMembers += await insertMany(client, 'value_set_members', ['id', 'value_set_version_id', 'concept_id', 'included', 'ordinal'], vs.members, ['uuid', 'uuid', 'uuid', null, null]);
    }
    for (const cs of plan.codeSystems) {
      await client.query(
        `INSERT INTO terminology.catalog_import_batches (id, source_id, code_system_version_id, started_at, finished_at, total_read, total_inserted, total_errors, checksum, recorded_at)
         VALUES ($1::uuid, $2::uuid, $3::uuid, $4, now(), $5, $6, 0, $7, now())`,
        [md5uuid(`mantra:lab-tests:batch:${cs.internalCode}:${startedAt.toISOString()}`), cs.dbSourceId, versionIdOf.get(cs.versionId), startedAt, cs.records, insertedByCs.get(cs.internalCode), cs.checksum],
      );
      r.batches += 1;
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  }
  return r;
}

async function main() {
  const t0 = Date.now();
  console.log(`=== Catálogo de análisis → terminology.* ${APPLY ? '(APPLY)' : '(DRY-RUN, sin base)'} ===`);
  const layers = (await Promise.all(LAYERS.map(readLayer))).filter(Boolean);
  if (!layers.length) throw new Error('No hay capas lab-tests-*.ndjson ni copia en data/: corré build-lab-tests.mjs.');
  const plan = buildPlan(layers);
  for (const cs of plan.codeSystems) cs.checksum = md5uuid(layers.flatMap((l) => l.records.filter((x) => x.codeSystem === cs.internalCode).map((x) => x.id)).join('|'));
  const summary = { layers: layers.map((l) => `${l.layer} (${l.records.length}) ← ${l.from}`), ...planSummary(plan) };
  console.log(JSON.stringify(summary, null, 2));
  if (!APPLY) {
    writeJson(join(BUILD_DIR, 'lab-tests-load-plan.dry-run.json'), { generatedAt: nowIso(), summary }, true);
    console.log('Dry-run: no se tocó ninguna base. Para cargar: --apply');
    return;
  }
  const client = new pg.Client(DB_CONFIG);
  await client.connect();
  try {
    await assertPrerequisites(client);
    const result = await load(client, plan);
    console.log('\n=== Filas NUEVAS (0 en la segunda corrida = idempotente; `batches` es el registro de auditoría) ===');
    console.log(JSON.stringify({ result, segundos: Math.round((Date.now() - t0) / 1000) }, null, 2));
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('ERROR FATAL en load-lab-tests:', err);
  process.exitCode = 1;
});
