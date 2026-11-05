#!/usr/bin/env node
// =============================================================================
// Repositorio universal de servicios · etapa 2 (corpus → `terminology.*`).
//
// Lee `data/` (verificado contra `MANIFEST.json`) y carga lo que describe
// `lib/load-plan.mjs`. Sin DDL. Idempotente: ids deterministas +
// `ON CONFLICT DO NOTHING`; la segunda corrida inserta 0.
//
// Lo único que toca filas existentes: completa `catalog_concepts.definition`
// cuando estaba vacía (conceptos CUPS que ya creó specialty-services/ sin
// definición). Nunca pisa una definición escrita.
//
// Precondiciones (aborta si faltan): la API arrancó una vez (conceptos
// internos) y `VS_MEDICAL_SPECIALTY` existe.
//
// Uso:
//   node tools/terminology-import/service-repository/load-service-repository.mjs            # dry-run
//   node tools/terminology-import/service-repository/load-service-repository.mjs --apply    # carga (.env DB_*)
// =============================================================================

import 'dotenv/config';
import pg from 'pg';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { CONCEPT, RELATION_TYPE } from '../lib/glossary-es/load-plan.mjs';
import { readGzParts } from '../specialty-services/lib/common.mjs';
import { DATA_DIR } from './lib/common.mjs';
import { LANG_EN, batchPlans, buildPlan, codeSystemPlans } from './lib/load-plan.mjs';

const APPLY = process.argv.includes('--apply');
const BATCH = 1000;

const DB_CONFIG = {
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5433),
  user: process.env.DB_USER ?? 'mantra',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME ?? 'mantra_redesa_health',
};

export function readCorpus(dir = DATA_DIR) {
  const manifest = JSON.parse(readFileSync(join(dir, 'MANIFEST.json'), 'utf8'));
  const records = readGzParts(dir, manifest.corpus).map((l) => JSON.parse(l));
  if (records.length !== manifest.records) throw new Error(`data/: ${records.length} registros, el manifiesto declara ${manifest.records}`);
  const [meta] = readGzParts(dir, manifest.meta).map((l) => JSON.parse(l));
  return { records, meta };
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
    ['idioma inglés', LANG_EN],
    ['designación preferida', CONCEPT.DESIG_PREFERRED],
    ['designación sinónimo', CONCEPT.DESIG_SYNONYM],
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
  await client.query(
    `INSERT INTO terminology.code_systems (id, source_id, internal_code, name, canonical_url, case_sensitive, supports_composition, state_concept_id, created_at, updated_at, row_version)
     VALUES ($1::uuid, $2::uuid, $3, $4, $5, true, false, $6::uuid, now(), now(), 1) ON CONFLICT DO NOTHING`,
    [cs.codeSystem.id, src[0].id, cs.codeSystem.internalCode, cs.codeSystem.name, cs.codeSystem.canonicalUrl, CONCEPT.TERM_ACTIVE],
  );
  const { rows: sys } = await client.query('SELECT id FROM terminology.code_systems WHERE internal_code = $1', [cs.codeSystem.internalCode]);
  // Un sistema que ya existía (FONASA, CUPS de specialty-services/) conserva su versión vigente:
  // los conceptos se reusan por id y no hace falta otra versión.
  const { rows: current } = await client.query('SELECT id FROM terminology.code_system_versions WHERE code_system_id = $1 ORDER BY is_default DESC NULLS LAST, created_at LIMIT 1', [sys[0].id]);
  if (current.length > 0) return { sourceId: src[0].id, versionId: current[0].id };
  await client.query(
    `INSERT INTO terminology.code_system_versions (id, code_system_id, version, valid_from, is_default, state_concept_id, created_at, updated_at, row_version)
     VALUES ($1::uuid, $2::uuid, $3, $4::timestamptz, true, $5::uuid, now(), now(), 1) ON CONFLICT DO NOTHING`,
    [cs.version.id, sys[0].id, cs.version.version, cs.version.validFrom, CONCEPT.TERM_ACTIVE],
  );
  return { sourceId: src[0].id, versionId: cs.version.id };
}

const summarize = (plan) => ({
  concepts: plan.concepts.length,
  designations: plan.designations.length,
  properties: plan.properties.length,
  relationships: plan.relationships.length,
  members: plan.members.length,
  unresolvedSpecialties: plan.unresolved,
});

async function main() {
  const t0 = Date.now();
  const { records, meta } = readCorpus();
  const codeSystems = codeSystemPlans(meta);
  console.log(`=== Repositorio universal de servicios → terminology.* ${APPLY ? '' : '(DRY-RUN, sin base)'} ===`);
  if (!APPLY) {
    const model = JSON.parse(readFileSync(new URL('../../../src/common/seed/data/specialty-services/model-specialties.json', import.meta.url), 'utf8'));
    const plan = buildPlan(records, new Map(model.specialties.map((s) => [s.code, s.conceptId])));
    console.log(JSON.stringify({ records: records.length, ...summarize(plan), codeSystems: codeSystems.length }, null, 2));
    console.log('Dry-run: nada se escribió. Para cargar: --apply');
    return;
  }

  const client = new pg.Client(DB_CONFIG);
  await client.connect();
  try {
    await assertPrerequisites(client);
    const specialtyIds = await specialtyIdsFromDb(client);
    if (specialtyIds.size === 0) throw new Error('VS_MEDICAL_SPECIALTY no existe: cargá el paquete del modelo (o arrancá la API) antes.');
    const { rows: pairs } = await client.query(
      'SELECT source_concept_id || $2 || target_concept_id AS k FROM terminology.concept_relationships WHERE relationship_type_concept_id = $1::uuid',
      [RELATION_TYPE.SPECIALTY, '|'],
    );
    const plan = buildPlan(records, specialtyIds, new Set(pairs.map((p) => p.k)));
    const result = { ...summarize(plan), inserted: {} };

    await client.query('BEGIN');
    const versionOf = {};
    for (const cs of codeSystems) {
      const ids = await upsertCodeSystem(client, cs);
      versionOf[cs.codeSystem.internalCode] = ids.versionId;
      cs.version.id = ids.versionId;
      cs.source.id = ids.sourceId;
    }
    const ins = result.inserted;
    ins.concepts = await insertMany(client, 'catalog_concepts', ['id', 'code_system_version_id', 'code', 'display', 'definition', 'state_concept_id'],
      plan.concepts.map((c) => { const t = [...c.tuple]; t[1] = versionOf[c.codeSystem]; return t; }), ['uuid', 'uuid', null, null, null, 'uuid']);
    const withDef = plan.concepts.filter((c) => c.definition);
    let filled = 0;
    for (let i = 0; i < withDef.length; i += BATCH) {
      const chunk = withDef.slice(i, i + BATCH);
      const res = await client.query(
        `UPDATE terminology.catalog_concepts c SET definition = v.def, updated_at = now()
           FROM unnest($1::uuid[], $2::text[]) AS v(id, def)
          WHERE c.id = v.id AND c.definition IS NULL`,
        [chunk.map((c) => c.tuple[0]), chunk.map((c) => c.definition)],
      );
      filled += res.rowCount;
    }
    ins.definitionsFilled = filled;
    ins.designations = await insertMany(client, 'concept_designations', ['id', 'concept_id', 'language_concept_id', 'designation_type_concept_id', 'value', 'preferred'], plan.designations, ['uuid', 'uuid', 'uuid', 'uuid', null, 'boolean']);
    ins.properties = await insertMany(client, 'concept_properties', ['id', 'concept_id', 'property_code', 'data_type', 'value_json'], plan.properties, ['uuid', 'uuid', null, 'terminology.technical_data_type', 'jsonb']);
    ins.relationships = await insertMany(client, 'concept_relationships', ['id', 'source_concept_id', 'target_concept_id', 'relationship_type_concept_id', 'ordinal'], plan.relationships, ['uuid', 'uuid', 'uuid', 'uuid', 'int']);
    ins.valueSets = await insertMany(client, 'value_sets', ['id', 'internal_code', 'name', 'canonical_url', 'description', 'state_concept_id'], [plan.valueSet], ['uuid', null, null, null, null, 'uuid']);
    ins.valueSetVersions = await insertMany(client, 'value_set_versions', ['id', 'value_set_id', 'version', 'is_default', 'state_concept_id'], [plan.valueSetVersion], ['uuid', 'uuid', null, 'boolean', 'uuid']);
    ins.valueSetMembers = await insertMany(client, 'value_set_members', ['id', 'value_set_version_id', 'concept_id', 'included', 'ordinal'], plan.members, ['uuid', 'uuid', 'uuid', 'boolean', 'int']);
    const batches = batchPlans(records, codeSystems);
    ins.batches = await insertMany(client, 'catalog_import_batches',
      ['id', 'source_id', 'code_system_version_id', 'state_concept_id', 'started_at', 'finished_at', 'total_read', 'total_inserted', 'total_errors', 'checksum', 'recorded_at'],
      batches.map((b) => [b.id, b.sourceId, b.csvId, CONCEPT.TERM_ACTIVE, new Date(t0).toISOString(), new Date().toISOString(), b.totalRead, null, 0, b.checksum, new Date().toISOString()]),
      ['uuid', 'uuid', 'uuid', 'uuid', 'timestamptz', 'timestamptz', 'bigint', 'bigint', 'bigint', null, 'timestamptz'], { audit: false });
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
