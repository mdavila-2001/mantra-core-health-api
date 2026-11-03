#!/usr/bin/env node
// Cargador idempotente del catálogo de estudios (laboratorio + imagenología) a
// `terminology.*`. Mismo patrón que tools/terminology-import/lab-tests/load-lab-tests.mjs:
// ids deterministas + ON CONFLICT DO NOTHING; la 2.ª corrida inserta 0 filas.
// No actualiza lo existente ni escribe DDL (ADR-0021).
//
//   node tools/study-catalogs/load-study-catalogs.mjs            # dry-run: plan y conteos, sin base
//   node tools/study-catalogs/load-study-catalogs.mjs --apply    # carga real (.env DB_*)
//
// Requisito: la API arrancó al menos una vez contra la base (siembra los conceptos
// internos, el value set `service-request-code`, las modalidades, las regiones y
// los tipos de relación). Si falta algo, el cargador lo dice y no escribe nada.
// Nada marcado `verificar` se siembra (ver check-study-catalogs.mjs).

import 'dotenv/config';
import pg from 'pg';
import { LOCAL_KEYS, readCatalogs } from './lib/catalogs.mjs';
import { validate } from './check-study-catalogs.mjs';
import { BOOT, INTERNAL_SYSTEM, STUDY_VALUE_SET, VALUE_SET_ORDINAL_BASE, buildPlan, planSummary, valueSetMemberId, valueSetVersionId } from './lib/plan.mjs';

const APPLY = process.argv.includes('--apply');

const cat = readCatalogs();
const { errors } = validate(cat);
if (errors.length) {
  console.error(`Los catálogos no validan (${errors.length} errores); nada se carga:`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}

const client = new pg.Client({
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5433),
  user: process.env.DB_USER ?? 'mantra',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME ?? 'mantra_redesa_health',
});

/** INSERT … ON CONFLICT DO NOTHING en bloques con unnest; devuelve las filas insertadas. */
async function insertMany(table, columns, types, rows) {
  const BATCH = 2000;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    const arrays = columns.map((_, c) => chunk.map((r) => r[c]));
    const cols = [...columns, 'created_at', 'updated_at'];
    // unnest($1::uuid[], $2::text[]…) como t(c0, c1…)
    const unnest = `unnest(${types.map((t, c) => `$${c + 1}::${t}[]`).join(', ')}) as t(${columns.map((_, c) => `c${c}`).join(', ')})`;
    const sel = [...columns.map((_, c) => `t.c${c}`), 'now()', 'now()'];
    const res = await client.query(`INSERT INTO ${table} (${cols.join(', ')}) SELECT ${sel.join(', ')} FROM ${unnest} ON CONFLICT DO NOTHING`, arrays);
    inserted += res.rowCount ?? 0;
  }
  return inserted;
}

async function resolvePrerequisites() {
  const missing = [];
  const one = async (sql, params, what) => {
    const { rows } = await client.query(sql, params);
    if (rows.length !== 1) missing.push(`${what} (${rows.length} filas)`);
    return rows[0];
  };
  const csv = await one(
    `select v.id, v.version from terminology.code_system_versions v join terminology.code_systems s on s.id = v.code_system_id
      where s.internal_code = $1 order by v.is_default desc nulls last, v.created_at limit 1`, [INTERNAL_SYSTEM], `versión del code system ${INTERNAL_SYSTEM}`);
  const tier = await one(
    `select c.id from terminology.catalog_concepts c where c.code = 'CURATED_REFERENCE'
        and exists (select 1 from terminology.value_set_members m join terminology.value_set_versions vv on vv.id = m.value_set_version_id
                      join terminology.value_sets vs on vs.id = vv.value_set_id where m.concept_id = c.id and vs.internal_code = 'VS_EVIDENCE_TIER')`,
    [], 'concepto de nivel de evidencia CURATED_REFERENCE (value set VS_EVIDENCE_TIER del modelo)');
  const ids = Object.entries(BOOT);
  const { rows: present } = await client.query('select id from terminology.catalog_concepts where id = any($1::uuid[])', [ids.map(([, v]) => v)]);
  const have = new Set(present.map((r) => r.id));
  for (const [k, v] of ids) if (!have.has(v)) missing.push(`concepto del arranque ${k} (${v})`);
  const { rows: vsv } = await client.query('select id from terminology.value_set_versions where id = $1', [valueSetVersionId(STUDY_VALUE_SET)]);
  if (vsv.length !== 1) missing.push(`versión del value set ${STUDY_VALUE_SET}`);
  return { csv, tier, missing };
}

async function main() {
  const t0 = Date.now();
  await client.connect();
  try {
    const { csv, tier, missing } = await resolvePrerequisites();
    if (missing.length) {
      console.error('Faltan prerrequisitos (¿arrancó la API contra esta base?):');
      for (const m of missing) console.error(`  - ${m}`);
      process.exitCode = 2;
      return;
    }
    // Conceptos LAB_*/IMG_* ya sembrados y tipos de espécimen vigentes. El seed de la API guarda
    // como `code` la CLAVE del concepto (catalog-concept-definitions.ts), no el código humano:
    // `local-concept-keys.json` traduce uno al otro.
    const wanted = [...cat.lab.analisis, ...cat.img.estudios].map((x) => x.codigo_api_existente).filter(Boolean);
    const keyOf = (c) => LOCAL_KEYS.studies[c] ?? (() => { throw new Error(`sin clave local para ${c}`); })();
    const { rows: ex } = await client.query('select id, code from terminology.catalog_concepts where code_system_version_id = $1 and code = any($2::text[])', [csv.id, wanted.map(keyOf)]);
    const byKey = new Map(ex.map((r) => [r.code, r.id]));
    const existing = new Map(wanted.filter((c) => byKey.has(keyOf(c))).map((c) => [c, byKey.get(keyOf(c))]));
    const { rows: sp } = await client.query('select id, code from terminology.catalog_concepts where code_system_version_id = $1 and code = any($2::text[])', [csv.id, Object.values(LOCAL_KEYS.specimens)]);
    const spById = new Map(sp.map((r) => [r.code, r.id]));
    const specimenByHl7 = new Map(Object.entries(LOCAL_KEYS.specimens).filter(([, k]) => spById.has(k)).map(([hl7, k]) => [hl7, spById.get(k)]));

    const plan = buildPlan(cat, existing, specimenByHl7);
    const summary = planSummary(plan);
    console.log('Plan (filas candidatas):', JSON.stringify(summary));
    console.log(`Omitidos por verificar (${plan.omitted.length}), no se siembran como válidos:`);
    for (const n of plan.notes) console.log(`  - ${n}`);
    if (!APPLY) {
      console.log('dry-run: no se escribió nada (usar --apply)');
      return;
    }

    await client.query('BEGIN');
    const out = {};
    const T = 'terminology.';
    out.terminology_sources = await insertMany(`${T}terminology_sources`, ['id', 'code', 'name', 'official_url', 'state_concept_id'], ['uuid', 'text', 'text', 'text', 'uuid'],
      [...plan.sources.values()].map((s) => [s.id, s.code, s.name, s.url, BOOT.TERM_ACTIVE]));
    out.catalog_concepts = await insertMany(`${T}catalog_concepts`, ['id', 'code_system_version_id', 'code', 'display', 'abstract', 'selectable', 'state_concept_id'], ['uuid', 'uuid', 'text', 'text', 'boolean', 'boolean', 'uuid'],
      [...plan.concepts.values()].map((c) => [c.id, csv.id, c.code, c.display, false, c.selectable, BOOT.TERM_ACTIVE]));
    out.concept_designations = await insertMany(`${T}concept_designations`, ['id', 'concept_id', 'language_concept_id', 'designation_type_concept_id', 'value', 'preferred'], ['uuid', 'uuid', 'uuid', 'uuid', 'text', 'boolean'], plan.designations);
    out.concept_properties = await insertMany(`${T}concept_properties`, ['id', 'concept_id', 'property_code', 'data_type', 'value_json'], ['uuid', 'uuid', 'text', 'terminology.technical_data_type', 'jsonb'], plan.properties);
    out.concept_relationships = await insertMany(`${T}concept_relationships`, ['id', 'source_concept_id', 'target_concept_id', 'relationship_type_concept_id', 'ordinal', 'evidence_count', 'best_evidence_tier_concept_id'], ['uuid', 'uuid', 'uuid', 'uuid', 'int', 'int', 'uuid'],
      [...plan.relationships.values()].map((r) => [r.id, r.source, r.target, r.typeId, r.ordinal, r.evidenceCount, tier.id]));
    out.concept_relationship_evidence = await insertMany(`${T}concept_relationship_evidence`,
      ['id', 'concept_relationship_id', 'terminology_source_id', 'code_system_version_id', 'evidence_tier_concept_id', 'source_reference', 'citation_text', 'citation_locator', 'valid_from'],
      ['uuid', 'uuid', 'uuid', 'uuid', 'uuid', 'text', 'text', 'text', 'date'],
      plan.evidence.map((e) => [e.id, e.relationshipId, e.sourceId, csv.id, tier.id, e.sourceReference, e.citationText, e.citationLocator, cat.lab.version]));
    out.value_set_members = await insertMany(`${T}value_set_members`, ['id', 'value_set_version_id', 'concept_id', 'included', 'ordinal'], ['uuid', 'uuid', 'uuid', 'boolean', 'int'],
      plan.valueSetMembers.map((cid, i) => [valueSetMemberId(STUDY_VALUE_SET, cid), valueSetVersionId(STUDY_VALUE_SET), cid, true, VALUE_SET_ORDINAL_BASE + i]));
    await client.query('COMMIT');
    console.log('Insertadas:', JSON.stringify(out));
    console.log(`Total insertadas: ${Object.values(out).reduce((a, b) => a + b, 0)} · ${Date.now() - t0} ms`);
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
