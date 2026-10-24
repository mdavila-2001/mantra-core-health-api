#!/usr/bin/env node
// =============================================================================
// Catálogo de enfermedades · etapa 2 (NDJSON → `terminology.*`).
//
// Lee `<BUILD_DIR>/ndjson/diseases/<codeSystem>.ndjson` (lo escribe
// `build-catalog.mjs`) y carga, por code system:
//   terminology_sources / code_systems / code_system_versions
//   catalog_concepts        un concepto por clase de la fuente (o por clave cruzada)
//   concept_designations    nombre preferido y sinónimos, con idioma (ES/EN)
//   concept_properties      procedencia, clasificación, xrefs no mapeables, …
//   concept_relationships   jerarquía is-a (REL_IS_A)
//   concept_maps            alineamientos publicados (EQUIV_*), y hacia
//                           icd10cm / CIE-10-ES sólo si esos conceptos existen
//   catalog_import_batches  un lote por code system
//
// Fases: primero TODOS los conceptos (los mapeos cruzan sistemas), después el
// resto. Idempotente: ids deterministas + `ON CONFLICT DO NOTHING`; la segunda
// corrida inserta 0. No actualiza filas: una versión nueva de una fuente es
// otro `code_system_version`.
//
// Uso:
//   node tools/terminology-import/diseases/load-catalog.mjs --dry-run      # sin base
//   node tools/terminology-import/diseases/load-catalog.mjs                # carga real (.env DB_*)
//   node tools/terminology-import/diseases/load-catalog.mjs --systems mondo,orphanet
// =============================================================================

import 'dotenv/config';
import pg from 'pg';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { BUILD_DIR, nowIso, readNdjson, writeJson } from '../lib/glossary-es/common.mjs';
import { md5uuid } from '../lib/glossary-es/load-plan.mjs';
import { INTERNAL, planFor } from './lib/plan.mjs';
import { NDJSON_DIR } from './lib/sources.mjs';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const ONLY = args.includes('--systems') ? new Set(args[args.indexOf('--systems') + 1].split(',')) : null;
const BATCH = 1000;

const DB_CONFIG = {
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5433),
  user: process.env.DB_USER ?? 'mantra',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME ?? 'mantra_redesa_health',
};

const AUDIT = ', now(), now(), 1';

async function insertMany(client, table, columns, tuples, casts, { audit = true, guardColumn = null } = {}) {
  let inserted = 0;
  for (let i = 0; i < tuples.length; i += BATCH) {
    const chunk = tuples.slice(i, i + BATCH);
    const params = [];
    const values = chunk.map((t) => {
      const ph = t.map((v, j) => {
        params.push(v);
        return `$${params.length}${casts[j] ? `::${casts[j]}` : ''}`;
      });
      return `(${ph.join(', ')}${audit ? AUDIT : ''})`;
    });
    const cols = `${columns.join(', ')}${audit ? ', created_at, updated_at, row_version' : ''}`;
    // `guardColumn`: inserta sólo las filas cuyo destino ya existe (mapeos hacia
    // conceptos de otros importadores, que pueden no estar cargados).
    const sql = guardColumn
      ? `INSERT INTO terminology.${table} (${cols})
         SELECT v.* FROM (VALUES ${values.join(',\n')}) AS v(${cols})
         WHERE EXISTS (SELECT 1 FROM terminology.catalog_concepts c WHERE c.id = v.${guardColumn})
         ON CONFLICT DO NOTHING`
      : `INSERT INTO terminology.${table} (${cols}) VALUES ${values.join(',\n')} ON CONFLICT DO NOTHING`;
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
  const needed = [INTERNAL.TERM_ACTIVE, INTERNAL.TERM_DRAFT, INTERNAL.TERM_DEPRECATED, INTERNAL.LANG.es, INTERNAL.LANG.en, INTERNAL.DESIG_PREFERRED, INTERNAL.DESIG_SYNONYM, INTERNAL.REL_IS_A, ...Object.values(INTERNAL.EQUIV)];
  const { rows } = await client.query('SELECT id FROM terminology.catalog_concepts WHERE id = ANY($1::uuid[])', [needed]);
  if (rows.length !== needed.length) {
    const have = new Set(rows.map((r) => r.id));
    throw new Error(`Faltan ${needed.length - rows.length} conceptos internos (${needed.filter((n) => !have.has(n)).join(', ')}): arrancá la API una vez para que siembre terminology.`);
  }
}

async function upsertSystem(client, plan) {
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
    `INSERT INTO terminology.code_system_versions (id, code_system_id, version, published_at, checksum, is_default, state_concept_id, created_at, updated_at, row_version)
     VALUES ($1::uuid, $2::uuid, $3, now(), $4, true, $5::uuid, now(), now(), 1) ON CONFLICT DO NOTHING`,
    [plan.version.id, cs[0].id, plan.version.version, plan.checksum, INTERNAL.TERM_ACTIVE],
  );
  const { rows: csv } = await client.query('SELECT id FROM terminology.code_system_versions WHERE code_system_id = $1 AND version = $2', [cs[0].id, plan.version.version]);
  // Si otra corrida creó la versión con otro id, las tuplas se reescriben a ese id.
  for (const c of plan.concepts) c[1] = csv[0].id;
  return { sourceId: src[0].id, versionId: csv[0].id };
}

const CONCEPT_COLS = ['id', 'code_system_version_id', 'code', 'display', 'definition', 'selectable', 'replaced_by_concept_id', 'state_concept_id'];
const CONCEPT_CASTS = ['uuid', 'uuid', null, null, null, 'boolean', 'uuid', 'uuid'];
const MAP_COLS = ['id', 'source_concept_id', 'target_concept_id', 'equivalence_concept_id', 'context', 'version', 'state_concept_id'];
const MAP_CASTS = ['uuid', 'uuid', 'uuid', 'uuid', null, null, 'uuid'];

function readPlans() {
  if (!existsSync(NDJSON_DIR)) throw new Error(`Falta ${NDJSON_DIR}. Corré primero build-catalog.mjs.`);
  const files = JSON.parse(readFileSync(join(NDJSON_DIR, '_systems.json'), 'utf8'));
  const plans = [];
  for (const f of readdirSync(NDJSON_DIR).filter((n) => n.endsWith('.ndjson')).sort()) {
    const cs = f.replace(/\.ndjson$/, '');
    if (ONLY && !ONLY.has(cs)) continue;
    const records = readNdjson(join(NDJSON_DIR, f));
    const version = records[0]?.provenance.version;
    // `checksum`: SHA-256 de los archivos de origen, en el orden de `_systems.json`.
    plans.push({ ...planFor(cs, version, records), checksum: (files[cs] ?? []).map((f) => `${f.key}:sha256:${f.sha256}`).join(' ') || null });
  }
  return plans;
}

async function main() {
  const t0 = Date.now();
  console.log(`=== Catálogo de enfermedades → terminology.* ${DRY_RUN ? '(DRY-RUN, sin base)' : ''} ===`);
  const plans = readPlans();
  const summary = plans.map((p) => ({
    codeSystem: p.codeSystem.internalCode,
    version: p.version.version,
    concepts: p.concepts.length,
    designations: p.designations.length,
    properties: p.properties.length,
    relationships: p.relationships.length,
    maps: p.maps.length,
    externalMapsCandidates: p.externalMaps.length,
  }));
  console.table(summary);
  const totals = summary.reduce((a, s) => {
    for (const k of Object.keys(s)) if (typeof s[k] === 'number') a[k] = (a[k] ?? 0) + s[k];
    return a;
  }, {});
  console.log('Totales:', totals);
  if (DRY_RUN) {
    writeJson(join(BUILD_DIR, 'diseases-load-plan.dry-run.json'), { generatedAt: nowIso(), summary, totals }, true);
    console.log('No se tocó ninguna base.');
    return;
  }

  const client = new pg.Client(DB_CONFIG);
  await client.connect();
  const result = {};
  try {
    await assertPrerequisites(client);
    const ctx = new Map();
    for (const p of plans) ctx.set(p.codeSystem.internalCode, await upsertSystem(client, p));
    for (const p of plans) {
      const r = (result[p.codeSystem.internalCode] = {});
      r.concepts = await insertMany(client, 'catalog_concepts', CONCEPT_COLS, p.concepts, CONCEPT_CASTS);
      console.log(`[concepts] ${p.codeSystem.internalCode} +${r.concepts}`);
    }
    for (const p of plans) {
      const cs = p.codeSystem.internalCode;
      const r = result[cs];
      r.designations = await insertMany(client, 'concept_designations', ['id', 'concept_id', 'language_concept_id', 'designation_type_concept_id', 'value', 'preferred'], p.designations, ['uuid', 'uuid', 'uuid', 'uuid', null, 'boolean']);
      r.properties = await insertMany(client, 'concept_properties', ['id', 'concept_id', 'property_code', 'data_type', 'value_json'], p.properties, ['uuid', 'uuid', null, 'terminology.technical_data_type', 'jsonb']);
      r.relationships = await insertMany(client, 'concept_relationships', ['id', 'source_concept_id', 'target_concept_id', 'relationship_type_concept_id', 'ordinal'], p.relationships, ['uuid', 'uuid', 'uuid', 'uuid', 'int']);
      r.maps = await insertMany(client, 'concept_maps', MAP_COLS, p.maps, MAP_CASTS);
      r.externalMaps = await insertMany(client, 'concept_maps', MAP_COLS, p.externalMaps, MAP_CASTS, { guardColumn: 'target_concept_id' });
      const { sourceId, versionId } = ctx.get(cs);
      const inserted = Object.values(r).reduce((a, b) => a + b, 0);
      await client.query(
        `INSERT INTO terminology.catalog_import_batches (id, source_id, code_system_version_id, started_at, finished_at, total_read, total_inserted, total_errors, checksum, recorded_at)
         VALUES ($1::uuid, $2::uuid, $3::uuid, $4, now(), $5, $6, 0, $7, now())`,
        [md5uuid(`mantra:diseases:batch:${cs}:${new Date(t0).toISOString()}`), sourceId, versionId, new Date(t0), p.records.length, inserted, md5uuid(p.records.map((x) => x.code).join('|'))],
      );
      console.log(`[load] ${cs} ${JSON.stringify(r)}`);
    }
  } finally {
    await client.end();
  }
  console.log('\n=== RESUMEN (filas NUEVAS; 0 en la segunda corrida = idempotente) ===');
  console.log(JSON.stringify({ result, segundos: Math.round((Date.now() - t0) / 1000) }, null, 2));
}

main().catch((err) => {
  console.error('ERROR FATAL en load-catalog (diseases):', err);
  process.exitCode = 1;
});
