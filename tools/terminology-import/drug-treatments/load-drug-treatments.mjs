#!/usr/bin/env node
// =============================================================================
// Tratamientos farmacológicos · etapa 2 (NDJSON → `terminology.*`, sin DDL).
//
// Carga, en code systems propios (ver lib/load-plan.mjs):
//   drug-treatment-relation-types        un concepto por tipo que declara cada fuente
//   drug-treatment-assertions-<fuente>   un concepto por afirmación publicada,
//                                        con procedencia y evidencia en concept_properties
//   concept_relationships                afirmación → fármaco / → enfermedad, sólo
//                                        hacia conceptos que YA estén en la base (código exacto)
//   catalog_import_batches               un lote por code system
//
// Idempotente: ids deterministas + ON CONFLICT DO NOTHING; la segunda corrida
// inserta 0 filas de datos (el lote sí se registra cada vez, como en
// load-medicine-catalog.mjs). No actualiza filas existentes.
//
// Por defecto es DRY-RUN (plan y conteos, sin conexión). La carga real exige
// `--apply` y el `.env` (DB_*). Ver la decisión pendiente en
// docs/seed-research/drug-treatments.md antes de correrla contra una base compartida.
//
// Uso:
//   node tools/terminology-import/drug-treatments/load-drug-treatments.mjs
//   node tools/terminology-import/drug-treatments/load-drug-treatments.mjs --apply [--targets targets.json]
// =============================================================================

import 'dotenv/config';
import pg from 'pg';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gunzipSync } from 'node:zlib';

import { BUILD_DIR, ndjsonPath, nowIso, readNdjson, writeJson } from '../lib/glossary-es/common.mjs';
import { CONCEPT, md5uuid } from '../lib/glossary-es/load-plan.mjs';
import { DATA_DIR } from './export-data.mjs';
import { linkStats, mergeTargets, resolveTargets } from './lib/link.mjs';
import { assertionsPlan, relationshipsFor, typesPlan } from './lib/load-plan.mjs';
import { SOURCES } from './lib/sources.mjs';

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const TARGETS = mergeTargets(args.includes('--targets') ? JSON.parse(readFileSync(args[args.indexOf('--targets') + 1], 'utf8')) : {});
const BATCH = 1000;

export const DB_CONFIG = {
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5433),
  user: process.env.DB_USER ?? 'mantra',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME ?? 'mantra_redesa_health',
};

/** Del build local si existe; si no, de las partes versionadas en `data/` (export-data.mjs). */
export function readAssertions() {
  const path = ndjsonPath('drug-treatments');
  if (existsSync(path)) return readNdjson(path);
  const parts = existsSync(DATA_DIR) ? readdirSync(DATA_DIR).filter((f) => /^drug-treatments-\d{3}\.ndjson\.gz$/.test(f)).sort() : [];
  if (parts.length === 0) throw new Error(`Falta ${path} y no hay partes en ${DATA_DIR}. Corré build-drug-treatments.mjs.`);
  console.log(`[load] leyendo ${parts.length} partes versionadas de ${DATA_DIR}`);
  return parts.flatMap((f) =>
    gunzipSync(readFileSync(join(DATA_DIR, f)))
      .toString('utf8')
      .split('\n')
      .filter((l) => l.trim() !== '')
      .map((l) => JSON.parse(l)),
  );
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
    try {
      const res = await client.query(sql, params);
      inserted += res.rowCount;
    } catch (err) {
      throw new Error(`INSERT en ${table} falló (lote ${i / BATCH + 1}): ${err.message}`);
    }
  }
  return inserted;
}

/** Fuente, code system y versión; devuelve el id real de la versión (por si otra corrida la creó). */
async function ensureCodeSystem(client, plan) {
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
  const { rows: cs } = await client.query('SELECT id FROM terminology.code_systems WHERE internal_code = $1', [plan.codeSystem.internalCode]);
  await client.query(
    `INSERT INTO terminology.code_system_versions (id, code_system_id, version, published_at, is_default, state_concept_id, created_at, updated_at, row_version)
     VALUES ($1::uuid, $2::uuid, $3, now(), true, $4::uuid, now(), now(), 1) ON CONFLICT DO NOTHING`,
    [plan.version.id, cs[0].id, plan.version.version, CONCEPT.TERM_ACTIVE],
  );
  const { rows: csv } = await client.query('SELECT id FROM terminology.code_system_versions WHERE code_system_id = $1 AND version = $2', [cs[0].id, plan.version.version]);
  return { sourceId: src[0].id, versionId: csv[0].id };
}

async function loadPlan(client, plan, relationships) {
  const startedAt = new Date();
  await client.query('BEGIN');
  try {
    const { sourceId, versionId } = await ensureCodeSystem(client, plan);
    for (const c of plan.concepts) c[1] = versionId;
    const r = { codeSystem: plan.codeSystem.internalCode };
    r.concepts = await insertMany(client, 'catalog_concepts', ['id', 'code_system_version_id', 'code', 'display', 'definition', 'state_concept_id'], plan.concepts, ['uuid', 'uuid', null, null, null, 'uuid']);
    r.properties = await insertMany(client, 'concept_properties', ['id', 'concept_id', 'property_code', 'data_type', 'value_json'], plan.properties, ['uuid', 'uuid', null, 'terminology.technical_data_type', 'jsonb']);
    r.relationships = await insertMany(client, 'concept_relationships', ['id', 'source_concept_id', 'target_concept_id', 'relationship_type_concept_id', 'ordinal'], relationships, ['uuid', 'uuid', 'uuid', 'uuid', null]);
    await client.query(
      `INSERT INTO terminology.catalog_import_batches (id, source_id, code_system_version_id, started_at, finished_at, total_read, total_inserted, total_errors, checksum, recorded_at)
       VALUES ($1::uuid, $2::uuid, $3::uuid, $4, now(), $5, $6, 0, $7, now())`,
      [
        md5uuid(`mantra:drug-treatments:batch:${plan.codeSystem.internalCode}:${startedAt.toISOString()}`),
        sourceId,
        versionId,
        startedAt,
        plan.concepts.length,
        r.concepts + r.properties + r.relationships,
        md5uuid(plan.concepts.map((c) => c[0]).join('|')),
      ],
    );
    await client.query('COMMIT');
    return r;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  }
}

async function main() {
  const t0 = Date.now();
  console.log(`=== Tratamientos farmacológicos → terminology.* ${APPLY ? '(CARGA REAL)' : '(DRY-RUN, sin base)'} ===`);
  const assertions = readAssertions();
  const types = typesPlan();
  const plans = Object.keys(SOURCES)
    .map((key) => assertionsPlan(key, assertions.filter((a) => a.source.key === key)))
    .filter((p) => p.concepts.length > 0);
  const summary = [types, ...plans].map((p) => ({ codeSystem: p.codeSystem.internalCode, version: p.version.version, concepts: p.concepts.length, properties: p.properties.length }));
  console.log(JSON.stringify(summary, null, 2));

  if (!APPLY) {
    writeJson(join(BUILD_DIR, 'drug-treatments-load-plan.dry-run.json'), { generatedAt: nowIso(), summary, targets: TARGETS }, true);
    console.log('DRY-RUN: no se tocó ninguna base. Las relaciones estructurales se calculan contra la base en --apply.');
    return;
  }

  const client = new pg.Client(DB_CONFIG);
  await client.connect();
  const result = [];
  try {
    const { rows } = await client.query('SELECT id FROM terminology.catalog_concepts WHERE id = $1::uuid', [CONCEPT.TERM_ACTIVE]);
    if (rows.length !== 1) throw new Error('Falta el concepto interno «estado activo»: arrancá la API una vez para que siembre terminology.');
    const { map, used } = await resolveTargets(client, assertions, TARGETS);
    console.log(`[load] destinos usados por sistema: ${JSON.stringify(used)}`);
    result.push(await loadPlan(client, types, []));
    for (const plan of plans) result.push(await loadPlan(client, plan, plan.assertions.flatMap((a) => relationshipsFor(a, map))));
    console.log(`[load] enlace: ${JSON.stringify(linkStats(assertions, map))}`);
  } finally {
    await client.end();
  }
  console.log('\n=== RESUMEN (filas NUEVAS; 0 en la segunda corrida = idempotente) ===');
  console.log(JSON.stringify({ result, segundos: Math.round((Date.now() - t0) / 1000) }, null, 2));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error('ERROR FATAL en load-drug-treatments:', err);
    process.exitCode = 1;
  });
}
