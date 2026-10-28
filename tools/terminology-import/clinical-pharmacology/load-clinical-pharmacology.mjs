#!/usr/bin/env node
// =============================================================================
// Farmacología clínica · etapa 3: monografías NDJSON → `terminology.*`.
//
// Escribe (ver lib/load-plan.mjs): terminology_sources, code_systems,
// code_system_versions, catalog_concepts (ATC niveles 1–5),
// concept_designations, concept_properties (una fila por sección de cada
// documento), concept_relationships (IS_A), concept_maps (ATC 5 → vademecum,
// resuelto contra la base) y un catalog_import_batches por corrida.
//
// Idempotente: ids deterministas + `ON CONFLICT DO NOTHING`. `--prune` (por
// defecto) borra SÓLO propiedades `pharmacology_*` de conceptos de ESTE code
// system que ya no están en el plan (una ficha que cambió de versión): la
// segunda corrida con las mismas fuentes inserta 0 y borra 0. Sin DDL.
//
// Uso:
//   node tools/terminology-import/clinical-pharmacology/load-clinical-pharmacology.mjs --dry-run
//   node tools/terminology-import/clinical-pharmacology/load-clinical-pharmacology.mjs [--no-prune]   (.env DB_*)
// =============================================================================

import 'dotenv/config';
import pg from 'pg';
import { existsSync } from 'node:fs';

import { writeJson } from '../lib/glossary-es/common.mjs';
import { CONCEPT, md5uuid } from '../lib/glossary-es/load-plan.mjs';
import { parseArgs } from './lib/cli.mjs';
import { streamLines } from './lib/ndjson-stream.mjs';
import { CODE_SYSTEM, EQUIV_EQUIVALENT, PROPERTY_PREFIX, REL_IS_A, planFor, vademecumMapTuple } from './lib/load-plan.mjs';
import { DRY_RUN_PLAN, MONOGRAPHS_NDJSON } from './lib/paths.mjs';

const { has } = parseArgs();
const DRY_RUN = has('--dry-run');
const PRUNE = !has('--no-prune');
const BATCH = 500;
const MAX_STATEMENT_BYTES = 24 * 1024 * 1024; // las secciones largas (jsonb) llegan a cientos de KB: se corta también por tamaño
const MONOGRAPHS_PER_BATCH = 25;
const MAX_BATCH_CHARS = 12 * 1024 * 1024;

const DB_CONFIG = {
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5433),
  user: process.env.DB_USER ?? 'mantra',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME ?? 'mantra_redesa_health',
};

const approxBytes = (t) => t.reduce((n, v) => n + (typeof v === 'string' ? v.length : 16), 0);

function* chunksBySize(tuples) {
  let chunk = [];
  let bytes = 0;
  for (const t of tuples) {
    const b = approxBytes(t);
    if (chunk.length > 0 && (chunk.length >= BATCH || bytes + b > MAX_STATEMENT_BYTES)) {
      yield chunk;
      chunk = [];
      bytes = 0;
    }
    chunk.push(t);
    bytes += b;
  }
  if (chunk.length > 0) yield chunk;
}

async function insertMany(client, table, columns, tuples, casts) {
  let inserted = 0;
  for (const chunk of chunksBySize(tuples)) {
    const params = [];
    const values = chunk.map((t) => {
      const ph = t.map((v, j) => {
        params.push(v);
        return `$${params.length}${casts[j] ? `::${casts[j]}` : ''}`;
      });
      return `(${ph.join(', ')}, now(), now(), 1)`;
    });
    const res = await client.query(
      `INSERT INTO terminology.${table} (${columns.join(', ')}, created_at, updated_at, row_version) VALUES ${values.join(',\n')} ON CONFLICT DO NOTHING`,
      params,
    );
    inserted += res.rowCount;
  }
  return inserted;
}

async function assertPrerequisites(client) {
  const need = { TERM_ACTIVE: CONCEPT.TERM_ACTIVE, LANG_ES: CONCEPT.LANG_ES, DESIG_PREFERRED: CONCEPT.DESIG_PREFERRED, REL_IS_A, EQUIV_EQUIVALENT };
  const { rows } = await client.query('SELECT id FROM terminology.catalog_concepts WHERE id = ANY($1::uuid[])', [Object.values(need)]);
  const have = new Set(rows.map((r) => r.id));
  const missing = Object.entries(need).filter(([, id]) => !have.has(id)).map(([k]) => k);
  if (missing.length) throw new Error(`Faltan conceptos internos (${missing.join(', ')}): arrancá la API una vez para que siembre terminology.`);
}

async function upsertHeader(client, plan) {
  const s = plan.source;
  await client.query(
    `INSERT INTO terminology.terminology_sources (id, code, name, owner, official_url, license, state_concept_id, created_at, updated_at, row_version)
     VALUES ($1::uuid, $2, $3, $4, $5, $6, $7::uuid, now(), now(), 1) ON CONFLICT DO NOTHING`,
    [s.id, s.code, s.name, s.owner, s.officialUrl, s.license, CONCEPT.TERM_ACTIVE],
  );
  const { rows: src } = await client.query('SELECT id FROM terminology.terminology_sources WHERE code = $1', [s.code]);
  await client.query(
    `INSERT INTO terminology.code_systems (id, source_id, internal_code, name, canonical_url, case_sensitive, supports_composition, state_concept_id, created_at, updated_at, row_version)
     VALUES ($1::uuid, $2::uuid, $3, $4, $5, true, false, $6::uuid, now(), now(), 1) ON CONFLICT DO NOTHING`,
    [plan.codeSystem.id, src[0].id, plan.codeSystem.internalCode, plan.codeSystem.name, plan.codeSystem.canonicalUrl, CONCEPT.TERM_ACTIVE],
  );
  const { rows: cs } = await client.query('SELECT id FROM terminology.code_systems WHERE internal_code = $1', [CODE_SYSTEM]);
  await client.query(
    `INSERT INTO terminology.code_system_versions (id, code_system_id, version, published_at, is_default, state_concept_id, created_at, updated_at, row_version)
     VALUES ($1::uuid, $2::uuid, $3, now(), true, $4::uuid, now(), now(), 1) ON CONFLICT DO NOTHING`,
    [plan.version.id, cs[0].id, plan.version.version, CONCEPT.TERM_ACTIVE],
  );
  const { rows: csv } = await client.query('SELECT id FROM terminology.code_system_versions WHERE code_system_id = $1 AND version = $2', [cs[0].id, plan.version.version]);
  return { sourceId: src[0].id, csId: cs[0].id, csvId: csv[0].id };
}

/** ATC 5 de `vademecum` presentes en la base → tuplas de concept_maps. */
async function vademecumMaps(client, atc5, version) {
  const { rows } = await client.query(
    `SELECT cc.id, cc.code FROM terminology.catalog_concepts cc
       JOIN terminology.code_system_versions v ON v.id = cc.code_system_version_id
       JOIN terminology.code_systems cs ON cs.id = v.code_system_id
      WHERE cs.internal_code = 'vademecum' AND cc.code = ANY($1::text[])`,
    [atc5],
  );
  return rows.map((r) => vademecumMapTuple(r.code, r.id, version));
}

async function collectPlanIds(client, planIds) {
  await client.query('CREATE TEMP TABLE IF NOT EXISTS cp_plan_ids (id uuid PRIMARY KEY) ON COMMIT DROP');
  for (let i = 0; i < planIds.length; i += 5000) {
    await client.query('INSERT INTO cp_plan_ids SELECT unnest($1::uuid[]) ON CONFLICT DO NOTHING', [planIds.slice(i, i + 5000)]);
  }
}

async function prune(client, csvId) {
  const res = await client.query(
    `DELETE FROM terminology.concept_properties p
      USING terminology.catalog_concepts cc
      WHERE cc.id = p.concept_id AND cc.code_system_version_id = $1::uuid
        AND p.property_code LIKE $2
        AND NOT EXISTS (SELECT 1 FROM cp_plan_ids x WHERE x.id = p.id)`,
    [csvId, `${PROPERTY_PREFIX.replace(/_/g, '\\_')}%`],
  );
  return res.rowCount;
}

/**
 * Lotes de monografías leídos en flujo (el NDJSON completo no cabe en una cadena de V8). El lote se corta por cantidad
 * Y por tamaño: con la pasada exhaustiva de CIMA una monografía llega a ~85 MB de JSON, y 25 juntas agotan el heap.
 */
async function* batches() {
  let batch = [];
  let bytes = 0;
  for await (const line of streamLines(MONOGRAPHS_NDJSON())) {
    if (batch.length > 0 && bytes + line.length > MAX_BATCH_CHARS) {
      yield batch;
      batch = [];
      bytes = 0;
    }
    batch.push(JSON.parse(line));
    bytes += line.length;
    if (batch.length >= MONOGRAPHS_PER_BATCH) {
      yield batch;
      batch = [];
      bytes = 0;
    }
  }
  if (batch.length > 0) yield batch;
}

async function main() {
  const t0 = Date.now();
  if (!existsSync(MONOGRAPHS_NDJSON())) throw new Error(`Falta ${MONOGRAPHS_NDJSON()}: corré build-monographs.mjs.`);
  console.log(`=== Farmacología clínica → terminology.* ${DRY_RUN ? '(DRY-RUN, sin base)' : ''} ===`);

  const seenNodes = new Set();
  const seenIds = new Set();
  let version = null;
  let first = null;
  const summary = { codeSystem: CODE_SYSTEM, version: null, monographs: 0, concepts: 0, designations: 0, properties: 0, relationships: 0, uniqueIds: 0 };
  const atc5 = [];
  let lastLogged = 0;
  let client = null;
  let ids = null;
  const result = { concepts: 0, designations: 0, relationships: 0, properties: 0 };

  if (!DRY_RUN) {
    client = new pg.Client(DB_CONFIG);
    await client.connect();
  }
  try {
    if (client) {
      await assertPrerequisites(client);
      await client.query('BEGIN');
    }
    for await (const batch of batches()) {
      const plan = planFor(batch, undefined, seenNodes);
      first ??= plan;
      version = plan.version;
      summary.monographs += plan.monographs;
      summary.concepts += plan.concepts.length;
      summary.designations += plan.designations.length;
      summary.properties += plan.properties.length;
      summary.relationships += plan.relationships.length;
      for (const t of [...plan.concepts, ...plan.designations, ...plan.properties, ...plan.relationships]) seenIds.add(t[0]);
      atc5.push(...plan.atc5);
      if (!client) continue;
      ids ??= await upsertHeader(client, plan);
      for (const c of plan.concepts) c[1] = ids.csvId;
      // Concepto ya existente con otra versión: sus propiedades cuelgan del id, que es estable.
      result.concepts += await insertMany(client, 'catalog_concepts', ['id', 'code_system_version_id', 'code', 'display', 'definition', 'abstract', 'selectable', 'state_concept_id'], plan.concepts, ['uuid', 'uuid', null, null, null, 'boolean', 'boolean', 'uuid']);
      result.designations += await insertMany(client, 'concept_designations', ['id', 'concept_id', 'language_concept_id', 'designation_type_concept_id', 'value', 'preferred'], plan.designations, ['uuid', 'uuid', 'uuid', 'uuid', null, 'boolean']);
      result.relationships += await insertMany(client, 'concept_relationships', ['id', 'source_concept_id', 'target_concept_id', 'relationship_type_concept_id', 'ordinal'], plan.relationships, ['uuid', 'uuid', 'uuid', 'uuid', 'int']);
      await collectPlanIds(client, plan.properties.map((p) => p[0]));
      result.properties += await insertMany(client, 'concept_properties', ['id', 'concept_id', 'property_code', 'data_type', 'value_json'], plan.properties, ['uuid', 'uuid', null, 'terminology.technical_data_type', 'jsonb']);
      if (Math.floor(summary.monographs / 250) > lastLogged) {
        lastLogged = Math.floor(summary.monographs / 250);
        console.log(`[load] ${summary.monographs} monografías…`);
      }
    }
    summary.version = version?.version ?? null;
    summary.uniqueIds = seenIds.size;
    console.log(JSON.stringify(summary, null, 2));
    if (DRY_RUN) {
      writeJson(DRY_RUN_PLAN(), { generatedAt: new Date().toISOString(), summary }, true);
      console.log('No se tocó ninguna base.');
      return;
    }
    result.prunedProperties = PRUNE ? await prune(client, ids.csvId) : null;
    const maps = await vademecumMaps(client, atc5, version.version);
    result.vademecumMaps = await insertMany(client, 'concept_maps', ['id', 'source_concept_id', 'target_concept_id', 'equivalence_concept_id', 'context', 'version', 'state_concept_id'], maps, ['uuid', 'uuid', 'uuid', 'uuid', null, null, 'uuid']);
    result.vademecumMapsPlanned = maps.length;
    const startedAt = new Date(t0);
    await client.query(
      `INSERT INTO terminology.catalog_import_batches (id, source_id, code_system_version_id, started_at, finished_at, total_read, total_inserted, total_errors, checksum, recorded_at)
       VALUES ($1::uuid, $2::uuid, $3::uuid, $4, now(), $5, $6, 0, $7, now())`,
      [
        md5uuid(`mantra:${CODE_SYSTEM}:batch:${startedAt.toISOString()}`),
        ids.sourceId,
        ids.csvId,
        startedAt,
        summary.monographs,
        result.concepts + result.designations + result.relationships + result.properties + result.vademecumMaps,
        md5uuid([...seenIds].sort().join('|')),
      ],
    );
    await client.query('COMMIT');
  } catch (err) {
    if (client) await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    if (client) await client.end();
  }
  console.log('\n=== RESUMEN (filas NUEVAS/BORRADAS; 0 y 0 en la segunda corrida = idempotente) ===');
  console.log(JSON.stringify({ result, segundos: Math.round((Date.now() - t0) / 1000) }, null, 2));
}

main().catch((err) => {
  console.error('ERROR FATAL en load-clinical-pharmacology:', err);
  process.exitCode = 1;
});
