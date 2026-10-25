#!/usr/bin/env node
// =============================================================================
// Catálogo de alergias · etapa 2 (NDJSON común → `terminology.*`).
//
// Lee `glossary-data-build/ndjson/allergy-catalog.ndjson` (lo escribe
// build-allergy-catalog.mjs) y carga:
//   terminology_sources / code_systems / code_system_versions   uno por code system
//   catalog_concepts        un concepto por registro (id = md5 de codeSystem+código)
//   concept_designations    nombre preferido EN y, si la fuente lo publica, ES; sinónimos
//   concept_properties      procedencia (`allergy_provenance`), licencia, definiciones, ids externos
//   concept_relationships   is-a declarado por la fuente (HL7, HPO, DOID, Mondo, OFF)
//   value_sets / value_set_versions / value_set_members        ver `VALUE_SETS`
//   concept_maps            enumeraciones internas de la API ↔ código HL7
//   catalog_import_batches  un lote por code system
//
// Idempotente: ids deterministas + `ON CONFLICT DO NOTHING`; la segunda corrida
// inserta 0 (el lote de importación sí se registra en cada corrida, como en los
// otros cargadores). No actualiza filas existentes. No escribe DDL.
//
// Requiere que la API haya arrancado al menos una vez (conceptos internos de
// idioma, tipo de designación, estado, is-a y equivalencia). Los `concept_maps`
// de las enumeraciones sólo se cargan si sus conceptos internos ya existen.
//
// Uso:
//   node tools/terminology-import/allergies/load-allergy-catalog.mjs --dry-run   # sin base
//   node tools/terminology-import/allergies/load-allergy-catalog.mjs             # carga real (.env DB_*)
//   node tools/terminology-import/allergies/load-allergy-catalog.mjs --from-repo # usa data/allergy-catalog.ndjson.gz
// =============================================================================

import 'dotenv/config';
import pg from 'pg';
import { createReadStream, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';
import { createGunzip } from 'node:zlib';

import { BUILD_DIR, nowIso, writeJson } from '../lib/glossary-es/common.mjs';
import { md5uuid } from '../lib/glossary-es/load-plan.mjs';
import { INTERNAL, buildPlan } from './lib/load-plan.mjs';
import { NDJSON_DIR } from './lib/sources.mjs';

const DRY_RUN = process.argv.includes('--dry-run');
const FROM_REPO = process.argv.includes('--from-repo');
const REPO_DATA = join(dirname(fileURLToPath(import.meta.url)), 'data', 'allergy-catalog.ndjson.gz');
const BATCH = 1000;

const DB_CONFIG = {
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5433),
  user: process.env.DB_USER ?? 'mantra',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME ?? 'mantra_redesa_health',
};

/**
 * NDJSON a cargar: el que acaba de escribir build-allergy-catalog.mjs en
 * `glossary-data-build/ndjson/` o, si no está (p. ej. en un clon limpio), la
 * copia comprimida versionada en `allergies/data/allergy-catalog.ndjson.gz`.
 */
function catalogSource() {
  const built = join(NDJSON_DIR, 'allergy-catalog.ndjson');
  if (!FROM_REPO && existsSync(built)) return { path: built, input: () => createReadStream(built) };
  if (existsSync(REPO_DATA)) return { path: REPO_DATA, input: () => createReadStream(REPO_DATA).pipe(createGunzip()) };
  throw new Error(`Falta ${built} y ${REPO_DATA}. Corré primero build-allergy-catalog.mjs.`);
}

async function readRecords() {
  const source = catalogSource();
  console.log(`Leyendo ${source.path}`);
  const records = [];
  for await (const line of createInterface({ input: source.input(), crlfDelay: Infinity })) {
    if (line.trim() !== '') records.push(JSON.parse(line));
  }
  return records;
}

/** INSERT por lotes con `ON CONFLICT DO NOTHING`; devuelve las filas realmente nuevas. */
async function insertMany(client, table, columns, tuples, casts, { audit = true } = {}) {
  let inserted = 0;
  const tail = audit ? ', now(), now(), 1' : '';
  const auditCols = audit ? ', created_at, updated_at, row_version' : '';
  for (let i = 0; i < tuples.length; i += BATCH) {
    const chunk = tuples.slice(i, i + BATCH);
    const params = [];
    const values = chunk.map((t) => {
      const ph = t.map((v, j) => {
        params.push(v);
        return `$${params.length}${casts[j] ? `::${casts[j]}` : ''}`;
      });
      return `(${ph.join(', ')}${tail})`;
    });
    const sql = `INSERT INTO terminology.${table} (${columns.join(', ')}${auditCols}) VALUES ${values.join(',\n')} ON CONFLICT DO NOTHING`;
    try {
      const res = await client.query(sql, params);
      inserted += res.rowCount;
    } catch (err) {
      throw new Error(`INSERT en ${table} falló (lote ${i / BATCH + 1}): ${err.message}`);
    }
  }
  return inserted;
}

async function assertPrerequisites(client) {
  const needed = Object.entries(INTERNAL);
  const { rows } = await client.query('SELECT id::text FROM terminology.catalog_concepts WHERE id = ANY($1::uuid[])', [needed.map(([, id]) => id)]);
  const have = new Set(rows.map((r) => r.id));
  const missing = needed.filter(([, id]) => !have.has(id)).map(([k]) => k);
  if (missing.length > 0) throw new Error(`Faltan conceptos internos (${missing.join(', ')}): arrancá la API una vez para que siembre terminology.`);
}

async function loadCodeSystem(client, plan) {
  await client.query(
    `INSERT INTO terminology.terminology_sources (id, code, name, owner, official_url, license, state_concept_id, created_at, updated_at, row_version)
     VALUES ($1::uuid, $2, $3, $4, $5, $6, $7::uuid, now(), now(), 1) ON CONFLICT DO NOTHING`,
    [plan.source.id, plan.source.code, plan.source.name, plan.source.owner, plan.source.officialUrl, plan.source.license, INTERNAL.TERM_ACTIVE],
  );
  const { rows: src } = await client.query('SELECT id FROM terminology.terminology_sources WHERE code = $1', [plan.source.code]);
  await client.query(
    `INSERT INTO terminology.code_systems (id, source_id, internal_code, name, canonical_url, case_sensitive, supports_composition, state_concept_id, created_at, updated_at, row_version)
     VALUES ($1::uuid, $2::uuid, $3, $4, $5, true, false, $6::uuid, now(), now(), 1) ON CONFLICT DO NOTHING`,
    [plan.codeSystem.id, src[0].id, plan.codeSystem.internalCode, plan.codeSystem.name, plan.codeSystem.canonicalUrl, INTERNAL.TERM_ACTIVE],
  );
  const { rows: cs } = await client.query('SELECT id FROM terminology.code_systems WHERE internal_code = $1', [plan.codeSystem.internalCode]);
  await client.query(
    `INSERT INTO terminology.code_system_versions (id, code_system_id, version, published_at, is_default, state_concept_id, created_at, updated_at, row_version)
     VALUES ($1::uuid, $2::uuid, $3, now(), true, $4::uuid, now(), now(), 1) ON CONFLICT DO NOTHING`,
    [plan.version.id, cs[0].id, plan.version.version, INTERNAL.TERM_ACTIVE],
  );
  const { rows: csv } = await client.query('SELECT id FROM terminology.code_system_versions WHERE code_system_id = $1 AND version = $2', [cs[0].id, plan.version.version]);
  const concepts = plan.records.map((r) => [r.id, csv[0].id, r.code, r.display, r.definitions.es ?? r.definitions.en ?? null, r.selectable, INTERNAL.TERM_ACTIVE]);
  const inserted = await insertMany(client, 'catalog_concepts', ['id', 'code_system_version_id', 'code', 'display', 'definition', 'selectable', 'state_concept_id'], concepts, ['uuid', 'uuid', null, null, null, 'boolean', 'uuid']);
  return { sourceId: src[0].id, versionId: csv[0].id, concepts: inserted };
}

async function main() {
  const t0 = Date.now();
  console.log(`=== Carga del catálogo de alergias a terminology.* ${DRY_RUN ? '(DRY-RUN, sin base)' : ''} ===`);
  const records = await readRecords();
  const plan = buildPlan(records);
  const summary = {
    codeSystems: plan.codeSystems.map((p) => ({ codeSystem: p.codeSystem.internalCode, version: p.version.version, concepts: p.records.length })),
    concepts: records.length,
    designations: plan.designations.length,
    properties: plan.properties.length,
    relationships: plan.relationships.length,
    valueSets: plan.valueSets.length,
    members: plan.members.length,
    conceptMaps: plan.conceptMaps.length,
  };
  console.log(JSON.stringify(summary, null, 2));

  if (DRY_RUN) {
    writeJson(join(BUILD_DIR, 'allergy-catalog-load-plan.dry-run.json'), { generatedAt: nowIso(), summary }, true);
    console.log('No se tocó ninguna base.');
    return;
  }

  const client = new pg.Client(DB_CONFIG);
  await client.connect();
  const result = { codeSystems: [] };
  try {
    await assertPrerequisites(client);
    await client.query('BEGIN');
    const started = new Date();
    const batches = [];
    for (const cs of plan.codeSystems) {
      const r = await loadCodeSystem(client, cs);
      result.codeSystems.push({ codeSystem: cs.codeSystem.internalCode, concepts: r.concepts });
      batches.push({ cs, ...r });
    }
    result.designations = await insertMany(client, 'concept_designations', ['id', 'concept_id', 'language_concept_id', 'designation_type_concept_id', 'value', 'preferred'], plan.designations.map((d) => [d.id, d.conceptId, d.lang, d.type, d.value, d.preferred]), ['uuid', 'uuid', 'uuid', 'uuid', null, 'boolean']);
    result.properties = await insertMany(client, 'concept_properties', ['id', 'concept_id', 'property_code', 'data_type', 'value_json'], plan.properties.map((p) => [p.id, p.conceptId, p.code, p.dataType, JSON.stringify(p.value)]), ['uuid', 'uuid', null, 'terminology.technical_data_type', 'jsonb']);
    result.relationships = await insertMany(client, 'concept_relationships', ['id', 'source_concept_id', 'target_concept_id', 'relationship_type_concept_id', 'ordinal'], plan.relationships.map((x) => [x.id, x.source, x.target, x.type, x.ordinal]), ['uuid', 'uuid', 'uuid', 'uuid', 'int']);
    result.valueSets = await insertMany(client, 'value_sets', ['id', 'internal_code', 'name', 'canonical_url', 'description', 'state_concept_id'], plan.valueSets.map((v) => [v.id, v.code, v.name, v.canonicalUrl, v.description, INTERNAL.TERM_ACTIVE]), ['uuid', null, null, null, null, 'uuid']);
    result.valueSetVersions = await insertMany(client, 'value_set_versions', ['id', 'value_set_id', 'version', 'is_default', 'state_concept_id'], plan.valueSets.map((v) => [v.versionId, v.id, '1', true, INTERNAL.TERM_ACTIVE]), ['uuid', 'uuid', null, 'boolean', 'uuid']);
    result.members = await insertMany(client, 'value_set_members', ['id', 'value_set_version_id', 'concept_id', 'included'], plan.members.map((m) => [m.id, m.versionId, m.conceptId, true]), ['uuid', 'uuid', 'uuid', 'boolean']);
    const { rows: present } = await client.query('SELECT id::text FROM terminology.catalog_concepts WHERE id = ANY($1::uuid[])', [plan.conceptMaps.map((m) => m.source)]);
    const have = new Set(present.map((r) => r.id));
    const maps = plan.conceptMaps.filter((m) => have.has(m.source));
    result.conceptMapsSkipped = plan.conceptMaps.length - maps.length;
    result.conceptMaps = await insertMany(client, 'concept_maps', ['id', 'source_concept_id', 'target_concept_id', 'equivalence_concept_id', 'context', 'version', 'state_concept_id'], maps.map((m) => [m.id, m.source, m.target, m.equivalence, m.context, m.version, INTERNAL.TERM_ACTIVE]), ['uuid', 'uuid', 'uuid', 'uuid', null, null, 'uuid']);
    for (const b of batches) {
      await client.query(
        `INSERT INTO terminology.catalog_import_batches (id, source_id, code_system_version_id, started_at, finished_at, total_read, total_inserted, total_errors, checksum, recorded_at)
         VALUES ($1::uuid, $2::uuid, $3::uuid, $4, now(), $5, $6, 0, $7, now())`,
        [md5uuid(`mantra:allergy-catalog:batch:${b.cs.codeSystem.internalCode}:${started.toISOString()}`), b.sourceId, b.versionId, started, b.cs.records.length, b.concepts, md5uuid(b.cs.records.map((r) => r.id).join('|'))],
      );
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    await client.end();
  }
  console.log('\n=== RESUMEN (filas NUEVAS; 0 en la segunda corrida = idempotente) ===');
  console.log(JSON.stringify({ result, segundos: Math.round((Date.now() - t0) / 1000) }, null, 2));
}

main().catch((err) => {
  console.error('ERROR FATAL en load-allergy-catalog:', err);
  process.exitCode = 1;
});
