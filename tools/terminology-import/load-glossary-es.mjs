#!/usr/bin/env node
// =============================================================================
// ETL etapa 2 (load): corpus NDJSON del glosario ES → `terminology.*`.
//
// Escribe, para cada término de las capas presentes en glossary-data-build/ndjson:
//   terminology_sources / code_systems / code_system_versions (uno por codeSystem)
//   catalog_concepts        code, display (= nombre ES), definition, estado TERM_ACTIVE
//   concept_designations    preferida ES + sinónimos ES
//   concept_properties      glossary-slug, glossary-clinical-definition, glossary-provenance,
//                           glossary-image, glossary-images, glossary-hierarchy,
//                           glossary-source-flags, glossary-external-ids,
//                           glossary-definition-html, glossary-drug-facts
//                           (+ active_ingredients/dosage_form/route para Farmacología)
//   value_set_members       glossary-all-terms + glossary-category-<k> + glossary-tag-<t>
//   concept_relationships   las que declara la fuente (p. ej. temas relacionados de MedlinePlus)
//   catalog_import_batches  un lote por codeSystem con totales
//
// Idempotente: ids deterministas + `ON CONFLICT DO NOTHING`; la segunda corrida
// inserta 0. NO actualiza filas existentes (para refrescar un texto hay que
// versionar el code system, no pisar).
//
// Requiere que el backend ya haya sembrado la taxonomía del glosario
// (`GlossarySeedService`: value sets glossary-*) y los conceptos internos
// (idioma, tipos de designación, estado, tipos de relación). Si faltan, aborta.
//
// Uso:
//   node tools/terminology-import/load-glossary-es.mjs --dry-run      # sin base: plan y conteos
//   node tools/terminology-import/load-glossary-es.mjs                # carga real (.env DB_*)
//   node tools/terminology-import/load-glossary-es.mjs --layers cima,medlineplus-es
// =============================================================================

import 'dotenv/config';
import pg from 'pg';
import { join } from 'node:path';
import { BUILD_DIR, nowIso, writeJson } from './lib/glossary-es/common.mjs';
import { TERM_LAYERS, loadCorpus } from './lib/glossary-es/corpus.mjs';
import {
  CONCEPT, RELATION_TYPE, codeSystemPlan, conceptId, designationsFor, md5uuid, membershipsFor, propertiesFor, relationshipsFor, valueSetCodesFor, valueSetVersionId,
} from './lib/glossary-es/load-plan.mjs';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const layersArg = args.includes('--layers') ? args[args.indexOf('--layers') + 1].split(',') : TERM_LAYERS;
const BATCH = 1000;

const DB_CONFIG = {
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5433),
  user: process.env.DB_USER ?? 'mantra',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME ?? 'mantra_redesa_health',
};

async function insertMany(client, table, columns, tuples, casts, conflict = 'ON CONFLICT DO NOTHING') {
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
    const sql = `INSERT INTO terminology.${table} (${columns.join(', ')}, created_at, updated_at, row_version) VALUES ${values.join(',\n')} ${conflict}`;
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

async function assertPrerequisites(client, valueSetCodes) {
  const needed = [...valueSetCodes].map((c) => valueSetVersionId(c));
  const { rows } = await client.query('SELECT id FROM terminology.value_set_versions WHERE id = ANY($1::uuid[])', [needed]);
  const have = new Set(rows.map((r) => r.id));
  const missing = [...valueSetCodes].filter((c) => !have.has(valueSetVersionId(c)));
  if (missing.length) throw new Error(`Faltan value sets del glosario (¿corrió GlossarySeedService?): ${missing.join(', ')}`);
  const concepts = [CONCEPT.TERM_ACTIVE, CONCEPT.LANG_ES, CONCEPT.DESIG_PREFERRED, CONCEPT.DESIG_SYNONYM, ...Object.values(RELATION_TYPE)];
  const { rows: c } = await client.query('SELECT id FROM terminology.catalog_concepts WHERE id = ANY($1::uuid[])', [concepts]);
  if (c.length !== concepts.length) throw new Error(`Faltan conceptos internos del backend (${concepts.length - c.length} de ${concepts.length}): arrancá la API una vez para que siembre terminology.`);
}

function buildPlan(rows) {
  const byCs = new Map();
  for (const r of rows) {
    if (!byCs.has(r.codeSystem)) byCs.set(r.codeSystem, []);
    byCs.get(r.codeSystem).push(r);
  }
  const plan = [];
  for (const [cs, list] of byCs) {
    const p = codeSystemPlan(cs, list);
    plan.push({
      ...p,
      rows: list,
      concepts: list.map((r) => [conceptId(r.slug), p.version.id, r.code, r.esName, r.definition ?? null, CONCEPT.TERM_ACTIVE]),
      designations: list.flatMap(designationsFor).map((d) => [d.id, d.conceptId, CONCEPT.LANG_ES, d.type, d.value, d.preferred]),
      properties: list.flatMap(propertiesFor).map((x) => [x.id, x.conceptId, x.code, x.dataType, JSON.stringify(x.value)]),
      memberships: list.flatMap(membershipsFor).map((m) => [m.id, m.versionId, m.conceptId, true]),
      relationships: list.flatMap(relationshipsFor).map((x) => [x.id, x.source, x.target, x.type, x.ordinal]),
    });
  }
  return plan;
}

async function main() {
  const t0 = Date.now();
  console.log(`=== Carga del glosario ES a terminology.* ${DRY_RUN ? '(DRY-RUN, sin base)' : ''} ===`);
  const { rows, perLayer, orphanRelations } = loadCorpus({ layers: layersArg });
  const plan = buildPlan(rows);
  const valueSetCodes = new Set(rows.flatMap(valueSetCodesFor));
  const summary = plan.map((p) => ({
    codeSystem: p.codeSystem.internalCode,
    version: p.version.version,
    concepts: p.concepts.length,
    designations: p.designations.length,
    properties: p.properties.length,
    memberships: p.memberships.length,
    relationships: p.relationships.length,
  }));
  console.log(JSON.stringify({ perLayer, orphanRelations, valueSets: [...valueSetCodes].length, summary }, null, 2));

  if (DRY_RUN) {
    writeJson(join(BUILD_DIR, 'load-plan.dry-run.json'), { generatedAt: nowIso(), perLayer, summary, sample: plan.map((p) => ({ codeSystem: p.codeSystem, source: p.source, version: p.version, concept: p.concepts[0], properties: p.properties.slice(0, 4), memberships: p.memberships.slice(0, 3) })) }, true);
    console.log(`Plan escrito en ${join(BUILD_DIR, 'load-plan.dry-run.json')}. No se tocó ninguna base.`);
    return;
  }

  const client = new pg.Client(DB_CONFIG);
  await client.connect();
  const result = [];
  const pendientes = [];
  try {
    await assertPrerequisites(client, valueSetCodes);
    for (const p of plan) {
      const startedAt = new Date();
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
      const { rows: cs } = await client.query('SELECT id FROM terminology.code_systems WHERE internal_code = $1', [p.codeSystem.internalCode]);
      await client.query(
        `INSERT INTO terminology.code_system_versions (id, code_system_id, version, published_at, is_default, state_concept_id, created_at, updated_at, row_version)
         VALUES ($1::uuid, $2::uuid, $3, now(), true, $4::uuid, now(), now(), 1) ON CONFLICT DO NOTHING`,
        [p.version.id, cs[0].id, p.version.version, CONCEPT.TERM_ACTIVE],
      );
      const { rows: csv } = await client.query('SELECT id FROM terminology.code_system_versions WHERE code_system_id = $1 AND version = $2', [cs[0].id, p.version.version]);
      if (csv[0].id !== p.version.id) {
        // Otra corrida creó la versión con otro id: se reescriben las tuplas a ese id.
        for (const c of p.concepts) c[1] = csv[0].id;
      }
      const r = { codeSystem: p.codeSystem.internalCode };
      r.concepts = await insertMany(client, 'catalog_concepts', ['id', 'code_system_version_id', 'code', 'display', 'definition', 'state_concept_id'], p.concepts, ['uuid', 'uuid', null, null, null, 'uuid']);
      r.designations = await insertMany(client, 'concept_designations', ['id', 'concept_id', 'language_concept_id', 'designation_type_concept_id', 'value', 'preferred'], p.designations, ['uuid', 'uuid', 'uuid', 'uuid', null, null]);
      r.properties = await insertMany(client, 'concept_properties', ['id', 'concept_id', 'property_code', 'data_type', 'value_json'], p.properties, ['uuid', 'uuid', null, 'terminology.technical_data_type', 'jsonb']);
      r.memberships = await insertMany(client, 'value_set_members', ['id', 'value_set_version_id', 'concept_id', 'included'], p.memberships, ['uuid', 'uuid', 'uuid', null]);
      pendientes.push({ p, r, startedAt, sourceId: src[0].id, versionId: csv[0].id });
    }
    // Segunda pasada: las relaciones cruzan sistemas (una enfermedad de CIE-10-ES
    // apunta a un síntoma de Wikidata o a un medicamento de CIMA), así que van
    // cuando ya existen TODOS los conceptos; si no, la FK del destino rechaza el lote.
    for (const { p, r, startedAt, sourceId, versionId } of pendientes) {
      r.relationships = await insertMany(client, 'concept_relationships', ['id', 'source_concept_id', 'target_concept_id', 'relationship_type_concept_id', 'ordinal'], p.relationships, ['uuid', 'uuid', 'uuid', 'uuid', null]);
      const total = r.concepts + r.designations + r.properties + r.memberships + r.relationships;
      await client.query(
        `INSERT INTO terminology.catalog_import_batches (id, source_id, code_system_version_id, started_at, finished_at, total_read, total_inserted, total_errors, checksum, recorded_at)
         VALUES ($1::uuid, $2::uuid, $3::uuid, $4, now(), $5, $6, 0, $7, now())`,
        [md5uuid(`mantra:glossary-es:batch:${p.codeSystem.internalCode}:${startedAt.toISOString()}`), sourceId, versionId, startedAt, p.rows.length, total, md5uuid(p.rows.map((x) => x.slug).join('|'))],
      );
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
  console.error('ERROR FATAL en load-glossary-es:', err);
  process.exitCode = 1;
});
