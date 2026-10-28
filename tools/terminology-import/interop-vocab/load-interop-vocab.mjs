#!/usr/bin/env node
// =============================================================================
// Etapa 2 · corpus normalizado (data/) → `terminology.*`.
//
//   terminology_sources / code_systems / code_system_versions   una fuente por origen, un code system por internal_code, una versión por edición
//   catalog_concepts        un concepto por (code system, versión, código)
//   concept_designations    nombres en inglés/español/sin idioma (los demás idiomas quedan en la propiedad fhir_designations)
//   concept_properties      procedencia (interop_provenance, licencia, URL, fecha, SHA-256) + las propiedades que publica la fuente
//   concept_relationships   is-a / part-of SOLO si el code system declara hierarchyMeaning
//   value_sets / value_set_versions / value_set_members         un value set por URL, una versión por edición
//   concept_maps            pares de ConceptMap de FHIR con ambos extremos cargados y relación con concepto interno
//   catalog_import_batches  un lote por edición (id determinista: la 2.ª corrida no agrega filas)
//
// Idempotente: ids deterministas + ON CONFLICT DO NOTHING; la 2.ª corrida inserta 0. No actualiza filas existentes,
// no escribe DDL. Requiere que la API haya sembrado los conceptos internos (ver seed-disposable-db.mjs para una base
// desechable). Por defecto apunta a localhost:5433/mantra_redesa_health: pasá DB_* explícito.
//
//   node tools/terminology-import/interop-vocab/load-interop-vocab.mjs --dry-run            # sin base
//   DB_HOST=127.0.0.1 DB_PORT=55451 DB_USER=mantra DB_NAME=c11 node …/load-interop-vocab.mjs
//   --data <dir>   corpus alterno (por defecto data/ del dominio)
// =============================================================================

import 'dotenv/config';
import pg from 'pg';
import { resolve } from 'node:path';
import { DATA_DIR, md5uuid } from './lib/common.mjs';
import { INTERNAL } from './lib/model.mjs';
import { buildPlan, readCorpus, requiredInternalIds } from './lib/load-plan.mjs';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const DIR = args.includes('--data') ? resolve(args[args.indexOf('--data') + 1]) : DATA_DIR;
const CHUNK = 2000;

const DB_CONFIG = {
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5433),
  user: process.env.DB_USER ?? 'mantra',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME ?? 'mantra_redesa_health',
};

/**
 * INSERT … SELECT FROM unnest(arrays) ON CONFLICT DO NOTHING, por lotes. `cols`: [nombre, tipo SQL del array].
 * Devuelve { inserted, byKey } (byKey cuenta por la columna `returningKey`, si se pide).
 */
async function bulk(client, table, cols, rows, { audit = true, returningKey = null } = {}) {
  let inserted = 0;
  const byKey = new Map();
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const names = cols.map(([n]) => n);
    const select = cols.map(([n, t], j) => `$${j + 1}::${t}[]`).join(', ');
    const auditCols = audit ? ', created_at, updated_at, row_version' : '';
    const auditVals = audit ? ', now(), now(), 1' : '';
    const sql = `INSERT INTO terminology.${table} (${names.join(', ')}${auditCols})
      SELECT ${names.map((n) => `x.${n}`).join(', ')}${auditVals} FROM unnest(${select}) AS x(${names.join(', ')})
      ON CONFLICT DO NOTHING${returningKey ? ` RETURNING ${returningKey}` : ''}`;
    try {
      const res = await client.query(sql, cols.map((_, j) => chunk.map((r) => r[j])));
      inserted += res.rowCount;
      if (returningKey) for (const r of res.rows) byKey.set(r[returningKey], (byKey.get(r[returningKey]) ?? 0) + 1);
    } catch (err) {
      throw new Error(`INSERT en ${table} falló (lote ${i / CHUNK + 1}): ${err.message}`);
    }
  }
  return { inserted, byKey };
}

async function assertPrerequisites(client) {
  const need = Object.entries(requiredInternalIds());
  const { rows } = await client.query('SELECT id::text FROM terminology.catalog_concepts WHERE id = ANY($1::uuid[])', [need.map(([, id]) => id)]);
  const have = new Set(rows.map((r) => r.id));
  const missing = need.filter(([, id]) => !have.has(id)).map(([k]) => k);
  if (missing.length) throw new Error(`Faltan conceptos internos (${missing.join(', ')}): arrancá la API una vez para que siembre terminology, o usá seed-disposable-db.mjs en una base desechable.`);
}

async function main() {
  const t0 = Date.now();
  console.log(`=== Carga de vocabularios de interoperabilidad a terminology.* ${DRY_RUN ? '(DRY-RUN, sin base)' : ''} ===`);
  const corpus = await readCorpus(DIR);
  const plan = buildPlan(corpus);
  const summary = {
    sources: plan.sources.length,
    codeSystems: plan.codeSystems.length,
    codeSystemVersions: plan.editions.length,
    concepts: plan.concepts.length,
    designations: plan.designations.length,
    properties: plan.properties.length,
    relationships: plan.relationships.length,
    valueSets: plan.valueSets.length,
    valueSetVersions: plan.valueSetVersions.length,
    valueSetMembers: plan.members.length,
    conceptMaps: plan.conceptMaps.length,
    parentsDeclaredButUnresolved: plan.stats.parentsDeclaredButUnresolved,
  };
  console.log(JSON.stringify(summary, null, 2));
  if (DRY_RUN) {
    console.log('No se tocó ninguna base.');
    return;
  }

  const client = new pg.Client(DB_CONFIG);
  await client.connect();
  console.log(`Base: ${DB_CONFIG.host}:${DB_CONFIG.port}/${DB_CONFIG.database}`);
  const result = {};
  try {
    await assertPrerequisites(client);
    await client.query('BEGIN');
    const active = INTERNAL.STATE.active;
    const stateId = (k) => INTERNAL.STATE[k] ?? active;

    result.sources = (await bulk(client, 'terminology_sources', [['id', 'uuid'], ['code', 'text'], ['name', 'text'], ['owner', 'text'], ['official_url', 'text'], ['license', 'text'], ['state_concept_id', 'uuid']], plan.sources.map((s) => [s.id, s.code, s.name, s.owner, s.officialUrl, s.license, active]))).inserted;
    const srcId = new Map((await client.query('SELECT code, id::text FROM terminology.terminology_sources WHERE code = ANY($1)', [plan.sources.map((s) => s.code)])).rows.map((r) => [r.code, r.id]));

    result.codeSystems = (
      await bulk(
        client,
        'code_systems',
        [['id', 'uuid'], ['source_id', 'uuid'], ['internal_code', 'text'], ['name', 'text'], ['canonical_url', 'text'], ['oid', 'text'], ['content_type_concept_id', 'uuid'], ['case_sensitive', 'boolean'], ['supports_composition', 'boolean'], ['state_concept_id', 'uuid']],
        plan.codeSystems.map((c) => [c.id, srcId.get(c.sourceCode), c.internalCode, c.name, c.canonicalUrl, c.oid, INTERNAL.CS_CONTENT_COMPLETE, c.caseSensitive, c.supportsComposition, stateId(c.state)]),
      )
    ).inserted;
    // El code system puede existir ya con otro id (p. ej. `ucum`, que carga lab-tests): se resuelve por internal_code.
    const csActual = new Map((await client.query('SELECT internal_code, id::text, canonical_url FROM terminology.code_systems WHERE internal_code = ANY($1)', [plan.codeSystems.map((c) => c.internalCode)])).rows.map((r) => [r.internal_code, r]));
    for (const c of plan.codeSystems) {
      const a = csActual.get(c.internalCode);
      if (!a) throw new Error(`code system ${c.internalCode} no quedó cargado (¿la URL ${c.canonicalUrl} ya pertenece a otro internal_code?)`);
      if (a.canonical_url !== c.canonicalUrl) throw new Error(`code system ${c.internalCode} ya existe con otra URL canónica (${a.canonical_url})`);
    }
    // versiones: es_default sólo si ese code system aún no tiene una por defecto
    let versionsInserted = 0;
    for (let i = 0; i < plan.editions.length; i += CHUNK) {
      const chunk = plan.editions.slice(i, i + CHUNK);
      const res = await client.query(
        `INSERT INTO terminology.code_system_versions (id, code_system_id, version, published_at, checksum, is_default, state_concept_id, created_at, updated_at, row_version)
         SELECT x.id, x.cs, x.version, x.published_at, x.checksum,
                x.want_default AND NOT EXISTS (SELECT 1 FROM terminology.code_system_versions d WHERE d.code_system_id = x.cs AND d.is_default),
                x.state, now(), now(), 1
           FROM unnest($1::uuid[], $2::uuid[], $3::text[], $4::timestamptz[], $5::text[], $6::boolean[], $7::uuid[]) AS x(id, cs, version, published_at, checksum, want_default, state)
         ON CONFLICT DO NOTHING`,
        [chunk.map((e) => e.id), chunk.map((e) => csActual.get(e.internalCode).id), chunk.map((e) => e.version), chunk.map((e) => e.publishedAt), chunk.map((e) => e.checksum), chunk.map((e) => e.isDefault), chunk.map((e) => stateId(e.state))],
      );
      versionsInserted += res.rowCount;
    }
    result.codeSystemVersions = versionsInserted;
    const versionActual = new Map((await client.query('SELECT code_system_id::text, version, id::text FROM terminology.code_system_versions WHERE code_system_id = ANY($1::uuid[])', [[...csActual.values()].map((r) => r.id)])).rows.map((r) => [`${r.code_system_id}\u0000${r.version}`, r.id]));
    const versionIdOf = (e) => versionActual.get(`${csActual.get(e.internalCode).id}\u0000${e.version}`);
    const editionVersionId = new Map(plan.editions.map((e) => [e.id, versionIdOf(e)]));

    const conceptRes = await bulk(
      client,
      'catalog_concepts',
      [['id', 'uuid'], ['code_system_version_id', 'uuid'], ['code', 'text'], ['display', 'text'], ['definition', 'text'], ['abstract', 'boolean'], ['selectable', 'boolean'], ['state_concept_id', 'uuid']],
      plan.concepts.map((c) => [c.id, editionVersionId.get(c.versionId), c.code, c.display, c.definition, c.abstract, c.selectable, stateId(c.state)]),
      { returningKey: 'code_system_version_id' },
    );
    result.concepts = conceptRes.inserted;
    result.designations = (await bulk(client, 'concept_designations', [['id', 'uuid'], ['concept_id', 'uuid'], ['language_concept_id', 'uuid'], ['designation_type_concept_id', 'uuid'], ['value', 'text'], ['preferred', 'boolean']], plan.designations.map((d) => [d.id, d.conceptId, d.lang, d.type, d.value, d.preferred]))).inserted;
    result.properties = (await bulk(client, 'concept_properties', [['id', 'uuid'], ['concept_id', 'uuid'], ['property_code', 'text'], ['data_type', 'terminology.technical_data_type'], ['value_json', 'jsonb']], plan.properties.map((p) => [p.id, p.conceptId, p.code, p.dataType, JSON.stringify(p.value)]))).inserted;
    result.relationships = (await bulk(client, 'concept_relationships', [['id', 'uuid'], ['source_concept_id', 'uuid'], ['target_concept_id', 'uuid'], ['relationship_type_concept_id', 'uuid'], ['ordinal', 'integer']], plan.relationships.map((r) => [r.id, r.source, r.target, r.type, r.ordinal]))).inserted;

    result.valueSets = (await bulk(client, 'value_sets', [['id', 'uuid'], ['internal_code', 'text'], ['name', 'text'], ['canonical_url', 'text'], ['description', 'text'], ['state_concept_id', 'uuid']], plan.valueSets.map((v) => [v.id, v.internalCode, v.name, v.canonicalUrl, v.description, stateId(v.state)]))).inserted;
    const vsActual = new Map((await client.query('SELECT internal_code, id::text FROM terminology.value_sets WHERE internal_code = ANY($1)', [plan.valueSets.map((v) => v.internalCode)])).rows.map((r) => [r.internal_code, r.id]));
    const vsIdByPlanned = new Map(plan.valueSets.map((v) => [v.id, vsActual.get(v.internalCode)]));
    let vsvInserted = 0;
    for (let i = 0; i < plan.valueSetVersions.length; i += CHUNK) {
      const chunk = plan.valueSetVersions.slice(i, i + CHUNK);
      const res = await client.query(
        `INSERT INTO terminology.value_set_versions (id, value_set_id, version, is_default, state_concept_id, created_at, updated_at, row_version)
         SELECT x.id, x.vs, x.version, x.want_default AND NOT EXISTS (SELECT 1 FROM terminology.value_set_versions d WHERE d.value_set_id = x.vs AND d.is_default), x.state, now(), now(), 1
           FROM unnest($1::uuid[], $2::uuid[], $3::text[], $4::boolean[], $5::uuid[]) AS x(id, vs, version, want_default, state) ON CONFLICT DO NOTHING`,
        [chunk.map((v) => v.id), chunk.map((v) => vsIdByPlanned.get(v.valueSetId)), chunk.map((v) => v.version), chunk.map((v) => v.isDefault), chunk.map((v) => stateId(v.state))],
      );
      vsvInserted += res.rowCount;
    }
    result.valueSetVersions = vsvInserted;
    const vsvActual = new Map((await client.query('SELECT value_set_id::text, version, id::text FROM terminology.value_set_versions WHERE value_set_id = ANY($1::uuid[])', [[...vsActual.values()]])).rows.map((r) => [`${r.value_set_id}\u0000${r.version}`, r.id]));
    const vsvIdOf = new Map(plan.valueSetVersions.map((v) => [v.id, vsvActual.get(`${vsIdByPlanned.get(v.valueSetId)}\u0000${v.version}`)]));
    result.members = (await bulk(client, 'value_set_members', [['id', 'uuid'], ['value_set_version_id', 'uuid'], ['concept_id', 'uuid'], ['included', 'boolean'], ['ordinal', 'integer']], plan.members.map((m) => [m.id, vsvIdOf.get(m.versionId), m.conceptId, true, m.ordinal]))).inserted;

    result.conceptMaps = (await bulk(client, 'concept_maps', [['id', 'uuid'], ['source_concept_id', 'uuid'], ['target_concept_id', 'uuid'], ['equivalence_concept_id', 'uuid'], ['context', 'text'], ['version', 'text'], ['state_concept_id', 'uuid']], plan.conceptMaps.map((m) => [m.id, m.source, m.target, m.equivalence, m.context, m.version, active]), { audit: true })).inserted;

    // un lote por edición; id determinista → la 2.ª corrida no agrega filas
    const started = new Date();
    const batchRows = plan.editions.map((e) => [
      md5uuid(`mantra:interop-vocab:batch:${e.internalCode}:${e.version}:${e.checksum}`),
      srcId.get(e.sourceCode),
      editionVersionId.get(e.id),
      started.toISOString(),
      started.toISOString(),
      started.toISOString(),
      e.concepts,
      conceptRes.byKey.get(editionVersionId.get(e.id)) ?? 0,
      0,
      e.checksum,
    ]);
    result.importBatches = (await bulk(client, 'catalog_import_batches', [['id', 'uuid'], ['source_id', 'uuid'], ['code_system_version_id', 'uuid'], ['started_at', 'timestamptz'], ['finished_at', 'timestamptz'], ['recorded_at', 'timestamptz'], ['total_read', 'bigint'], ['total_inserted', 'bigint'], ['total_errors', 'bigint'], ['checksum', 'text']], batchRows, { audit: false })).inserted;
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
  console.error('ERROR FATAL en load-interop-vocab:', err);
  process.exitCode = 1;
});
