#!/usr/bin/env node
// =============================================================================
// Servicios por especialidad · etapa 2 (corpus NDJSON → `terminology.*`).
//
// Lee `<BUILD_DIR>/specialty-services.ndjson` (lo escribe
// `build-specialty-services.mjs`) o, si no hay armado local, la copia versionada
// de `data/` (verificada contra su `MANIFEST.json`), y carga lo que describe
// `lib/load-plan.mjs`.
// Sin DDL: sólo filas en tablas que el modelo ya declara.
//
// Idempotente: ids deterministas + `ON CONFLICT DO NOTHING`; la segunda
// corrida inserta 0 (también el lote: su id sale del contenido). No actualiza
// filas existentes. `total_inserted` del lote queda nulo: la carga es una sola
// transacción para todas las fuentes y el conteo real se imprime al terminar.
//
// Precondiciones (las verifica y aborta si faltan):
//  - la API arrancó una vez (conceptos internos: estado, idioma, `REL_SPECIALTY`);
//  - `VS_MEDICAL_SPECIALTY` existe con versión vigente (paquete del modelo);
//  - para relacionar el arancel boliviano, `VS_BO_MEDICAL_PROCEDURE` sembrado.
//    Si falta, esas relaciones se saltean y se informa: no se crean conceptos
//    que son de otro seed.
//
// Uso:
//   node tools/terminology-import/specialty-services/load-specialty-services.mjs            # dry-run: plan y conteos, sin base
//   node tools/terminology-import/specialty-services/load-specialty-services.mjs --apply    # carga real (.env DB_*)
// =============================================================================

import 'dotenv/config';
import pg from 'pg';
import { existsSync, readFileSync } from 'node:fs';

import { CONCEPT, RELATION_TYPE } from '../lib/glossary-es/load-plan.mjs';
import { join } from 'node:path';

import { CORPUS_PATH, REPO_DATA_DIR, readGzParts } from './lib/common.mjs';
import { batchPlans, boSourcePlan, buildPlan, codeSystemPlans } from './lib/load-plan.mjs';
import { loadModelSpecialties } from './lib/rules.mjs';

const APPLY = process.argv.includes('--apply');
const BATCH = 1000;

const DB_CONFIG = {
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5433),
  user: process.env.DB_USER ?? 'mantra',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME ?? 'mantra_redesa_health',
};

function readCorpus() {
  const path = CORPUS_PATH();
  if (existsSync(path)) {
    console.log(`Corpus: ${path}`);
    return readFileSync(path, 'utf8')
      .split('\n')
      .filter((l) => l.trim() !== '')
      .map((l) => JSON.parse(l));
  }
  const manifestPath = join(REPO_DATA_DIR, 'MANIFEST.json');
  if (!existsSync(manifestPath)) throw new Error(`Falta ${path} y no hay copia en ${REPO_DATA_DIR}. Corré primero build-specialty-services.mjs.`);
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const records = readGzParts(REPO_DATA_DIR, manifest.corpus).map((l) => JSON.parse(l));
  if (records.length !== manifest.records) throw new Error(`data/: ${records.length} registros, el manifiesto declara ${manifest.records}`);
  console.log(`Corpus: copia versionada de ${REPO_DATA_DIR} (armado ${manifest.builtAt})`);
  return records;
}

async function insertMany(client, table, columns, tuples, casts, { audit = true } = {}) {
  let inserted = 0;
  for (let i = 0; i < tuples.length; i += BATCH) {
    const chunk = tuples.slice(i, i + BATCH);
    const params = [];
    const values = chunk.map((t) => {
      const ph = t.map((v, j) => {
        params.push(v);
        return `$${params.length}${casts[j] ? `::${casts[j]}` : ''}`;
      });
      return `(${ph.join(', ')}${audit ? ', now(), now(), 1' : ''})`;
    });
    const cols = audit ? `${columns.join(', ')}, created_at, updated_at, row_version` : columns.join(', ');
    const res = await client.query(`INSERT INTO terminology.${table} (${cols}) VALUES ${values.join(',\n')} ON CONFLICT DO NOTHING`, params);
    inserted += res.rowCount;
  }
  return inserted;
}

/** Especialidades del modelo en la base: código → concept id (acepta el código con prefijo del suplente de la API). */
async function specialtyIdsFromDb(client) {
  const { rows } = await client.query(
    `SELECT cc.id, cc.code
       FROM terminology.value_sets vs
       JOIN terminology.value_set_versions v ON v.value_set_id = vs.id AND v.is_default IS TRUE
       JOIN terminology.value_set_members m ON m.value_set_version_id = v.id AND m.included IS TRUE
       JOIN terminology.catalog_concepts cc ON cc.id = m.concept_id
      WHERE vs.internal_code = 'VS_MEDICAL_SPECIALTY'`,
  );
  return new Map(rows.map((r) => [r.code.split(':').at(-1), r.id]));
}

async function assertPrerequisites(client) {
  for (const [name, idValue] of [
    ['estado activo', CONCEPT.TERM_ACTIVE],
    ['idioma castellano', CONCEPT.LANG_ES],
    ['designación preferida', CONCEPT.DESIG_PREFERRED],
    ['relación «especialidad» (REL_SPECIALTY)', RELATION_TYPE.SPECIALTY],
  ]) {
    const { rows } = await client.query('SELECT 1 FROM terminology.catalog_concepts WHERE id = $1::uuid', [idValue]);
    if (rows.length !== 1) throw new Error(`Falta el concepto interno «${name}»: arrancá la API una vez para que siembre terminology.`);
  }
}

async function upsertCodeSystem(client, cs) {
  await client.query(
    `INSERT INTO terminology.terminology_sources (id, code, name, owner, official_url, license, state_concept_id, created_at, updated_at, row_version)
     VALUES ($1::uuid, $2, $3, $4, $5, $6, $7::uuid, now(), now(), 1) ON CONFLICT DO NOTHING`,
    [cs.source.id, cs.source.code, cs.source.name, cs.source.owner, cs.source.officialUrl, cs.source.license, CONCEPT.TERM_ACTIVE],
  );
  const { rows: src } = await client.query('SELECT id FROM terminology.terminology_sources WHERE code = $1', [cs.source.code]);
  if (!cs.codeSystem) return { sourceId: src[0].id };
  await client.query(
    `INSERT INTO terminology.code_systems (id, source_id, internal_code, name, canonical_url, case_sensitive, supports_composition, state_concept_id, created_at, updated_at, row_version)
     VALUES ($1::uuid, $2::uuid, $3, $4, $5, true, false, $6::uuid, now(), now(), 1) ON CONFLICT DO NOTHING`,
    [cs.codeSystem.id, src[0].id, cs.codeSystem.internalCode, cs.codeSystem.name, cs.codeSystem.canonicalUrl, CONCEPT.TERM_ACTIVE],
  );
  const { rows: sys } = await client.query('SELECT id FROM terminology.code_systems WHERE internal_code = $1', [cs.codeSystem.internalCode]);
  await client.query(
    `INSERT INTO terminology.code_system_versions (id, code_system_id, version, valid_from, is_default, state_concept_id, created_at, updated_at, row_version)
     VALUES ($1::uuid, $2::uuid, $3, $4::timestamptz, true, $5::uuid, now(), now(), 1) ON CONFLICT DO NOTHING`,
    [cs.version.id, sys[0].id, cs.version.version, cs.version.validFrom, CONCEPT.TERM_ACTIVE],
  );
  const { rows: ver } = await client.query('SELECT id FROM terminology.code_system_versions WHERE code_system_id = $1 AND version = $2', [sys[0].id, cs.version.version]);
  return { sourceId: src[0].id, versionId: ver[0].id };
}

function summarize(plan) {
  return {
    concepts: plan.concepts.length,
    designations: plan.designations.length,
    properties: plan.properties.length,
    relationships: plan.relationships.length,
    valueSets: plan.valueSets.length,
    valueSetMembers: plan.valueSetMembers.length,
    unresolvedSpecialties: plan.unresolved,
  };
}

async function main() {
  const t0 = Date.now();
  const records = readCorpus();
  const model = loadModelSpecialties();
  const modelDisplay = new Map(model.specialties.map((s) => [s.code, s.display]));
  const codeSystems = codeSystemPlans();
  const boSource = boSourcePlan();
  console.log(`=== Servicios por especialidad → terminology.* ${APPLY ? '' : '(DRY-RUN, sin base)'} ===`);

  if (!APPLY) {
    // La foto del modelo hace de resolutor: los conteos son los que daría una base con el paquete del modelo.
    const plan = buildPlan(records, new Map(model.specialties.map((s) => [s.code, s.conceptId])), modelDisplay);
    console.log(JSON.stringify({ records: records.length, ...summarize(plan), batches: batchPlans(records, codeSystems, boSource).length }, null, 2));
    console.log('Dry-run: nada se escribió. Para cargar: --apply');
    return;
  }

  const client = new pg.Client(DB_CONFIG);
  await client.connect();
  try {
    await assertPrerequisites(client);
    const specialtyIds = await specialtyIdsFromDb(client);
    if (specialtyIds.size === 0) throw new Error('VS_MEDICAL_SPECIALTY no existe o no tiene versión vigente: cargá el paquete del modelo (o arrancá la API) antes.');

    // Conceptos del arancel boliviano: se reusan sólo si existen.
    const boIds = records.filter((r) => r.reuse).map((r) => r.id);
    const { rows: present } = await client.query('SELECT id FROM terminology.catalog_concepts WHERE id = ANY($1::uuid[])', [boIds]);
    const presentSet = new Set(present.map((r) => r.id));
    const usable = records.filter((r) => !r.reuse || presentSet.has(r.id));
    const skippedBo = records.length - usable.length;

    const plan = buildPlan(usable, specialtyIds, modelDisplay);
    const result = { skippedBoConceptsMissing: skippedBo, ...summarize(plan), inserted: {} };

    await client.query('BEGIN');
    const versionOf = {};
    for (const cs of codeSystems) {
      const ids = await upsertCodeSystem(client, cs);
      versionOf[cs.codeSystem.internalCode] = ids.versionId;
      cs.version.id = ids.versionId;
      cs.source.id = ids.sourceId;
    }
    boSource.id = (await upsertCodeSystem(client, { source: boSource })).sourceId;

    const conceptTuples = plan.concepts.map((c) => {
      const t = [...c.tuple];
      t[1] = versionOf[c.codeSystem];
      return t;
    });
    const ins = result.inserted;
    ins.concepts = await insertMany(client, 'catalog_concepts', ['id', 'code_system_version_id', 'code', 'display', 'definition', 'state_concept_id'], conceptTuples, ['uuid', 'uuid', null, null, null, 'uuid']);
    ins.designations = await insertMany(client, 'concept_designations', ['id', 'concept_id', 'language_concept_id', 'designation_type_concept_id', 'value', 'preferred'], plan.designations, ['uuid', 'uuid', 'uuid', 'uuid', null, 'boolean']);
    ins.properties = await insertMany(client, 'concept_properties', ['id', 'concept_id', 'property_code', 'data_type', 'value_json'], plan.properties, ['uuid', 'uuid', null, 'terminology.technical_data_type', 'jsonb']);
    ins.relationships = await insertMany(client, 'concept_relationships', ['id', 'source_concept_id', 'target_concept_id', 'relationship_type_concept_id', 'ordinal'], plan.relationships, ['uuid', 'uuid', 'uuid', 'uuid', 'int']);
    ins.valueSets = await insertMany(client, 'value_sets', ['id', 'internal_code', 'name', 'canonical_url', 'description', 'state_concept_id'], plan.valueSets, ['uuid', null, null, null, null, 'uuid']);
    ins.valueSetVersions = await insertMany(client, 'value_set_versions', ['id', 'value_set_id', 'version', 'is_default', 'state_concept_id'], plan.valueSetVersions, ['uuid', 'uuid', null, 'boolean', 'uuid']);
    ins.valueSetMembers = await insertMany(client, 'value_set_members', ['id', 'value_set_version_id', 'concept_id', 'included', 'ordinal'], plan.valueSetMembers, ['uuid', 'uuid', 'uuid', 'boolean', 'int']);

    const batches = batchPlans(usable, codeSystems, boSource);
    ins.batches = await insertMany(
      client,
      'catalog_import_batches',
      ['id', 'source_id', 'code_system_version_id', 'state_concept_id', 'started_at', 'finished_at', 'total_read', 'total_inserted', 'total_errors', 'checksum', 'recorded_at'],
      batches.map((b) => [b.id, b.sourceId, b.csvId, CONCEPT.TERM_ACTIVE, new Date(t0).toISOString(), new Date().toISOString(), b.totalRead, null, 0, b.checksum, new Date().toISOString()]),
      ['uuid', 'uuid', 'uuid', 'uuid', 'timestamptz', 'timestamptz', 'bigint', 'bigint', 'bigint', null, 'timestamptz'],
      { audit: false },
    );
    await client.query('COMMIT');
    console.log(JSON.stringify({ ...result, segundos: Math.round((Date.now() - t0) / 1000) }, null, 2));
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err.stack ?? err.message);
  process.exit(1);
});
