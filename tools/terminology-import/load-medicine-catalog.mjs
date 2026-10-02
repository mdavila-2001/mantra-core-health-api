#!/usr/bin/env node
// =============================================================================
// Catálogo universal de medicamentos · etapa 2 (NDJSON común → `terminology.*`).
//
// Lee `glossary-data-build/ndjson/medicines-<fuente>.ndjson` (lo escribe
// `build-medicine-catalog.mjs`) y carga, por fuente:
//   terminology_sources / code_systems / code_system_versions
//   catalog_concepts      un concepto por registro oficial (id = id del registro)
//   concept_properties    ver PROPERTY en lib/medicine-catalog/load-plan.mjs
//   catalog_import_batches un lote por fuente
//
// Idempotente: ids deterministas + `ON CONFLICT DO NOTHING`; la segunda corrida
// inserta 0. No actualiza filas existentes: una versión nueva de la fuente es
// otro `code_system_version`, no un pisado.
//
// NO se carga desde `gen_seeds.py` ni desde el seed de la app: es un catálogo
// externo con su propio ciclo (ver la nota «Base de seeders alovida_seeds»).
//
// Uso:
//   node tools/terminology-import/load-medicine-catalog.mjs --dry-run   # sin base
//   node tools/terminology-import/load-medicine-catalog.mjs             # carga real (.env DB_*)
//   node tools/terminology-import/load-medicine-catalog.mjs --sources cima,invima
// =============================================================================

import 'dotenv/config';
import pg from 'pg';
import { createReadStream, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createInterface } from 'node:readline';

import { BUILD_DIR, nowIso, writeJson } from './lib/glossary-es/common.mjs';
import { CONCEPT, md5uuid } from './lib/glossary-es/load-plan.mjs';
import { planFor } from './lib/medicine-catalog/load-plan.mjs';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const SOURCES = args.includes('--sources') ? args[args.indexOf('--sources') + 1].split(',') : ['cima', 'invima', 'anvisa'];
const CODE_SYSTEM_OF = { cima: 'cima-medicamentos', invima: 'invima-medicamentos', anvisa: 'anvisa-medicamentos' };
const BATCH = 1000;

const DB_CONFIG = {
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5433),
  user: process.env.DB_USER ?? 'mantra',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME ?? 'mantra_redesa_health',
};

async function readRecords(source) {
  const path = join(BUILD_DIR, 'ndjson', `medicines-${source}.ndjson`);
  if (!existsSync(path)) throw new Error(`Falta ${path}. Corré primero build-medicine-catalog.mjs.`);
  const records = [];
  for await (const line of createInterface({ input: createReadStream(path), crlfDelay: Infinity })) {
    if (line.trim() !== '') records.push(JSON.parse(line));
  }
  return records;
}

async function insertMany(client, table, columns, tuples, casts) {
  let inserted = 0;
  for (let i = 0; i < tuples.length; i += BATCH) {
    const chunk = tuples.slice(i, i + BATCH);
    const params = [];
    const values = chunk.map((t) => {
      const ph = t.map((v, j) => {
        params.push(v);
        return `$${params.length}${casts[j] ? `::${casts[j]}` : ''}`;
      });
      return `(${ph.join(', ')}, now(), now(), 1)`;
    });
    const sql = `INSERT INTO terminology.${table} (${columns.join(', ')}, created_at, updated_at, row_version) VALUES ${values.join(',\n')} ON CONFLICT DO NOTHING`;
    await client.query('BEGIN');
    try {
      const res = await client.query(sql, params);
      await client.query('COMMIT');
      inserted += res.rowCount;
    } catch (err) {
      await client.query('ROLLBACK');
      throw new Error(`INSERT en ${table} falló (lote ${i / BATCH + 1}): ${err.message}`);
    }
  }
  return inserted;
}

async function assertPrerequisites(client) {
  const { rows } = await client.query('SELECT id FROM terminology.catalog_concepts WHERE id = $1::uuid', [CONCEPT.TERM_ACTIVE]);
  if (rows.length !== 1) throw new Error('Falta el concepto interno «estado activo»: arrancá la API una vez para que siembre terminology.');
}

async function loadOne(client, plan) {
  const startedAt = new Date();
  await client.query(
    `INSERT INTO terminology.terminology_sources (id, code, name, owner, official_url, license, state_concept_id, created_at, updated_at, row_version)
     VALUES ($1::uuid, $2, $3, $4, $5, $6, $7::uuid, now(), now(), 1) ON CONFLICT DO NOTHING`,
    [plan.source.id, plan.source.code, plan.source.name, plan.source.owner, plan.source.officialUrl, plan.source.license, CONCEPT.TERM_ACTIVE],
  );
  const { rows: src } = await client.query('SELECT id FROM terminology.terminology_sources WHERE code = $1', [plan.source.code]);
  await client.query(
    `INSERT INTO terminology.code_systems (id, source_id, internal_code, name, canonical_url, case_sensitive, supports_composition, state_concept_id, created_at, updated_at, row_version)
     VALUES ($1::uuid, $2::uuid, $3, $4, $5, true, false, $6::uuid, now(), now(), 1) ON CONFLICT DO NOTHING`,
    [plan.codeSystem.id, src[0].id, plan.codeSystem.internalCode, plan.codeSystem.name, plan.codeSystem.canonicalUrl, CONCEPT.TERM_ACTIVE],
  );
  const { rows: cs } = await client.query('SELECT id FROM terminology.code_systems WHERE internal_code = $1', [plan.codeSystem.internalCode]);
  await client.query(
    `INSERT INTO terminology.code_system_versions (id, code_system_id, version, published_at, is_default, state_concept_id, created_at, updated_at, row_version)
     VALUES ($1::uuid, $2::uuid, $3, now(), true, $4::uuid, now(), now(), 1) ON CONFLICT DO NOTHING`,
    [plan.version.id, cs[0].id, plan.version.version, CONCEPT.TERM_ACTIVE],
  );
  const { rows: csv } = await client.query('SELECT id FROM terminology.code_system_versions WHERE code_system_id = $1 AND version = $2', [cs[0].id, plan.version.version]);
  // Si otra corrida creó la versión con otro id, las tuplas se reescriben a ese id.
  for (const concept of plan.concepts) concept[1] = csv[0].id;

  const result = { codeSystem: plan.codeSystem.internalCode };
  result.concepts = await insertMany(client, 'catalog_concepts', ['id', 'code_system_version_id', 'code', 'display', 'definition', 'state_concept_id'], plan.concepts, ['uuid', 'uuid', null, null, null, 'uuid']);
  result.properties = await insertMany(client, 'concept_properties', ['id', 'concept_id', 'property_code', 'data_type', 'value_json'], plan.properties, ['uuid', 'uuid', null, 'terminology.technical_data_type', 'jsonb']);
  await client.query(
    `INSERT INTO terminology.catalog_import_batches (id, source_id, code_system_version_id, started_at, finished_at, total_read, total_inserted, total_errors, checksum, recorded_at)
     VALUES ($1::uuid, $2::uuid, $3::uuid, $4, now(), $5, $6, 0, $7, now())`,
    [
      md5uuid(`mantra:medicine-catalog:batch:${plan.codeSystem.internalCode}:${startedAt.toISOString()}`),
      src[0].id,
      csv[0].id,
      startedAt,
      plan.records.length,
      result.concepts + result.properties,
      md5uuid(plan.records.map((r) => r.id).join('|')),
    ],
  );
  return result;
}

async function main() {
  const t0 = Date.now();
  console.log(`=== Carga del catálogo de medicamentos a terminology.* ${DRY_RUN ? '(DRY-RUN, sin base)' : ''} ===`);
  const plans = [];
  for (const source of SOURCES) plans.push(planFor(CODE_SYSTEM_OF[source], await readRecords(source)));
  const summary = plans.map((p) => ({ codeSystem: p.codeSystem.internalCode, version: p.version.version, concepts: p.concepts.length, properties: p.properties.length }));
  console.log(JSON.stringify(summary, null, 2));

  if (DRY_RUN) {
    writeJson(join(BUILD_DIR, 'medicine-catalog-load-plan.dry-run.json'), { generatedAt: nowIso(), summary }, true);
    console.log('No se tocó ninguna base.');
    return;
  }

  const client = new pg.Client(DB_CONFIG);
  await client.connect();
  const result = [];
  try {
    await assertPrerequisites(client);
    for (const plan of plans) {
      const r = await loadOne(client, plan);
      result.push(r);
      console.log(`[load] ${JSON.stringify(r)}`);
    }
  } finally {
    await client.end();
  }
  console.log('\n=== RESUMEN (filas NUEVAS; 0 en la segunda corrida = idempotente) ===');
  console.log(JSON.stringify({ result, segundos: Math.round((Date.now() - t0) / 1000) }, null, 2));
}

main().catch((err) => {
  console.error('ERROR FATAL en load-medicine-catalog:', err);
  process.exitCode = 1;
});
