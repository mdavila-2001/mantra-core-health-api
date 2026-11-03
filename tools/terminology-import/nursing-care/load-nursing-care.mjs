#!/usr/bin/env node
// =============================================================================
// Etapa 3 (base): NDJSON de enfermería → `terminology.*`. Dry-run por defecto.
//
//   terminology_sources / code_systems / code_system_versions   uno por code system
//   catalog_concepts        display (= castellano si la fuente lo publica), definición
//   concept_designations    ES (traducción publicada en CKM) y EN (original)
//   concept_properties      procedencia por fila, licencia del contenido, reglas de enfermería…
//   concept_relationships   PART_OF (contención en el arquetipo) e IS_A (especialización)
//   concept_maps            enlaces del arquetipo a LOINC, SÓLO si el código LOINC existe en la base
//   value_sets (+versión, miembros)   `nursing-care-clinical-models`
//   value_set_members       glosario: `glossary-all-terms` + `glossary-category-care`
//   catalog_import_batches  una fila por code system y corrida (bitácora)
//
// Idempotente: ids deterministas + `ON CONFLICT DO NOTHING`; la segunda corrida
// inserta 0 filas de datos (sólo la fila de bitácora). No actualiza filas
// existentes. No escribe DDL.
//
// Uso:
//   node tools/terminology-import/nursing-care/load-nursing-care.mjs            # dry-run, sin base
//   node tools/terminology-import/nursing-care/load-nursing-care.mjs --apply    # carga (.env DB_*)
//   … --from-repo-data   lee los datos versionados en nursing-care/data/ aunque haya build local
// =============================================================================

import 'dotenv/config';
import pg from 'pg';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { nowIso, readNdjson, writeJson } from '../lib/glossary-es/common.mjs';
import { CONCEPT, valueSetVersionId } from '../lib/glossary-es/load-plan.mjs';
import { CODE_SYSTEM } from './lib/ckm.mjs';
import { NURSING_OUT, SOURCES_META } from './lib/paths.mjs';
import {
  LANG_EN, NURSING_VALUE_SET, REL_IS_A, REL_PART_OF, codeSystemPlan, conceptId, definitionOf, designationsFor, displayOf, id, loincRequestsFor, membershipsFor, propertiesFor, relationshipsFor,
} from './lib/plan.mjs';
import { MSSSI_CODE_SYSTEM } from './lib/msssi.mjs';
import { REGISTRY_CODE_SYSTEM } from './lib/registry.mjs';
import { parseNdjsonText, readManifest, readRepoDataset } from './lib/repo-data.mjs';

const args = process.argv.slice(2);
if (args.includes('--dry-run') && args.includes('--apply')) throw new Error('Use --dry-run o --apply, no ambos.');
const DRY_RUN = !args.includes('--apply');
const FROM_REPO_DATA = args.includes('--from-repo-data');
const BATCH = 1000;

const DB_CONFIG = {
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5433),
  user: process.env.DB_USER ?? 'mantra',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME ?? 'mantra_redesa_health',
};

const LOINC_CODE_SYSTEMS = ['loinc', 'loinc-es'];

export function buildPlan(rowsByCs, versions) {
  return Object.entries(rowsByCs).map(([cs, rows]) => {
    const allCodes = new Set(rows.map((r) => r.code));
    const p = codeSystemPlan(cs, versions[cs]);
    return {
      ...p,
      rows,
      concepts: rows.map((r) => [conceptId(r), p.version.id, r.code, displayOf(r), definitionOf(r), CONCEPT.TERM_ACTIVE]),
      designations: rows.flatMap(designationsFor).map((d) => [d.id, d.conceptId, d.lang, d.type, d.value, d.preferred]),
      properties: rows.flatMap(propertiesFor).map((x) => [x.id, x.conceptId, x.code, x.dataType, JSON.stringify(x.value)]),
      relationships: rows.flatMap((r) => relationshipsFor(r, allCodes)).map((x) => [x.id, x.source, x.target, x.type, x.ordinal]),
      memberships: rows.flatMap(membershipsFor),
      loinc: rows.flatMap(loincRequestsFor),
    };
  });
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
    const sql = `INSERT INTO terminology.${table} (${columns.join(', ')}${audit ? ', created_at, updated_at, row_version' : ''}) VALUES ${values.join(',\n')} ON CONFLICT DO NOTHING`;
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
  const needed = { TERM_ACTIVE: CONCEPT.TERM_ACTIVE, LANG_ES: CONCEPT.LANG_ES, LANG_EN, DESIG_PREFERRED: CONCEPT.DESIG_PREFERRED, REL_PART_OF, REL_IS_A };
  const { rows } = await client.query('SELECT id FROM terminology.catalog_concepts WHERE id = ANY($1::uuid[])', [Object.values(needed)]);
  const have = new Set(rows.map((r) => r.id));
  const missing = Object.entries(needed).filter(([, v]) => !have.has(v)).map(([k]) => k);
  if (missing.length) throw new Error(`Faltan conceptos internos del backend (${missing.join(', ')}): arrancá la API una vez para que siembre terminology.`);
  const glossary = ['glossary-all-terms', 'glossary-category-care'].map(valueSetVersionId);
  const { rows: g } = await client.query('SELECT id FROM terminology.value_set_versions WHERE id = ANY($1::uuid[])', [glossary]);
  return { glossaryReady: g.length === glossary.length };
}

/**
 * Entradas: el build local (`glossary-data-build/nursing-care/`) si está completo;
 * si no, o con `--from-repo-data`, los datos versionados en `nursing-care/data/`
 * (verificados contra su `MANIFEST.json`).
 */
function readInputs() {
  const names = [CODE_SYSTEM, MSSSI_CODE_SYSTEM, REGISTRY_CODE_SYSTEM];
  const local = existsSync(SOURCES_META) && names.every((cs) => existsSync(join(NURSING_OUT, `${cs}.ndjson`)));
  const fromRepo = FROM_REPO_DATA || !local;
  if (fromRepo && !readManifest()) throw new Error('No hay build local ni datos versionados: corré fetch-sources.mjs y build-nursing-care.mjs');
  const meta = fromRepo ? JSON.parse(readRepoDataset('sources-meta')) : JSON.parse(readFileSync(SOURCES_META, 'utf8'));
  const rowsByCs = {};
  for (const cs of names) rowsByCs[cs] = fromRepo ? parseNdjsonText(readRepoDataset(cs)) : readNdjson(join(NURSING_OUT, `${cs}.ndjson`));
  const versions = {
    [CODE_SYSTEM]: `${meta.ckm.commitDate.slice(0, 10)}+${meta.ckm.commit.slice(0, 8)}`,
    [MSSSI_CODE_SYSTEM]: `${meta.adlArchetypes.commitDate.slice(0, 10)}+${meta.adlArchetypes.commit.slice(0, 8)}`,
    [REGISTRY_CODE_SYSTEM]: meta.tho.packageVersion,
  };
  console.log(`[entrada] ${fromRepo ? 'datos versionados en tools/terminology-import/nursing-care/data/' : NURSING_OUT}`);
  return { meta, rowsByCs, versions };
}

async function main() {
  const t0 = Date.now();
  console.log(`=== Carga de enfermería a terminology.* ${DRY_RUN ? '(DRY-RUN, sin base)' : '(APPLY)'} ===`);
  const { rowsByCs, versions } = readInputs();
  const plan = buildPlan(rowsByCs, versions);
  const summary = plan.map((p) => ({
    codeSystem: p.codeSystem.internalCode,
    version: p.version.version,
    concepts: p.concepts.length,
    designations: p.designations.length,
    properties: p.properties.length,
    relationships: p.relationships.length,
    memberships: p.memberships.length,
    glossaryMemberships: p.memberships.filter((m) => m.glossary).length,
    loincBindingsRequested: p.loinc.length,
  }));
  for (const kind of ['concepts', 'designations', 'properties', 'relationships']) {
    const ids = plan.flatMap((p) => p[kind].map((t) => t[0]));
    if (new Set(ids).size !== ids.length) throw new Error(`Ids repetidos en ${kind}`);
  }
  console.log(JSON.stringify(summary, null, 2));
  if (DRY_RUN) {
    writeJson(join(NURSING_OUT, 'load-plan.dry-run.json'), { generatedAt: nowIso(), summary, sample: plan.map((p) => ({ source: p.source, codeSystem: p.codeSystem, version: p.version, concept: p.concepts[0], properties: p.properties.slice(0, 6) })) }, true);
    console.log(`Plan escrito en ${join(NURSING_OUT, 'load-plan.dry-run.json')}. No se tocó ninguna base.`);
    return;
  }

  const client = new pg.Client(DB_CONFIG);
  await client.connect();
  const result = [];
  try {
    const { glossaryReady } = await assertPrerequisites(client);
    if (!glossaryReady) console.warn('[aviso] Faltan los value sets del glosario (GlossarySeedService): se omiten las membresías del glosario.');
    const pending = [];
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
      if (csv[0].id !== p.version.id) for (const c of p.concepts) c[1] = csv[0].id;
      const r = { codeSystem: p.codeSystem.internalCode };
      r.concepts = await insertMany(client, 'catalog_concepts', ['id', 'code_system_version_id', 'code', 'display', 'definition', 'state_concept_id'], p.concepts, ['uuid', 'uuid', null, null, null, 'uuid']);
      r.designations = await insertMany(client, 'concept_designations', ['id', 'concept_id', 'language_concept_id', 'designation_type_concept_id', 'value', 'preferred'], p.designations, ['uuid', 'uuid', 'uuid', 'uuid', null, null]);
      r.properties = await insertMany(client, 'concept_properties', ['id', 'concept_id', 'property_code', 'data_type', 'value_json'], p.properties, ['uuid', 'uuid', null, 'terminology.technical_data_type', 'jsonb']);
      pending.push({ p, r, startedAt, sourceId: src[0].id, versionId: csv[0].id });
    }
    // Value set propio (una vez) y membresías.
    await client.query(
      `INSERT INTO terminology.value_sets (id, internal_code, name, canonical_url, description, state_concept_id, created_at, updated_at, row_version)
       VALUES ($1::uuid, $2, $3, $4, $5, $6::uuid, now(), now(), 1) ON CONFLICT DO NOTHING`,
      [id('vs', NURSING_VALUE_SET.code), NURSING_VALUE_SET.code, NURSING_VALUE_SET.name, NURSING_VALUE_SET.canonicalUrl, NURSING_VALUE_SET.description, CONCEPT.TERM_ACTIVE],
    );
    await client.query(
      `INSERT INTO terminology.value_set_versions (id, value_set_id, version, is_default, state_concept_id, created_at, updated_at, row_version)
       VALUES ($1::uuid, $2::uuid, '1', true, $3::uuid, now(), now(), 1) ON CONFLICT DO NOTHING`,
      [id('vsv', `${NURSING_VALUE_SET.code}:1`), id('vs', NURSING_VALUE_SET.code), CONCEPT.TERM_ACTIVE],
    );
    // Segunda pasada: relaciones, membresías y mapas, con todos los conceptos ya presentes.
    for (const { p, r, startedAt, sourceId, versionId } of pending) {
      r.relationships = await insertMany(client, 'concept_relationships', ['id', 'source_concept_id', 'target_concept_id', 'relationship_type_concept_id', 'ordinal'], p.relationships, ['uuid', 'uuid', 'uuid', 'uuid', null]);
      const members = p.memberships.filter((m) => glossaryReady || !m.glossary).map((m) => [m.id, m.versionId, m.conceptId, true]);
      r.memberships = await insertMany(client, 'value_set_members', ['id', 'value_set_version_id', 'concept_id', 'included'], members, ['uuid', 'uuid', 'uuid', null]);
      r.glossaryMembershipsSkipped = glossaryReady ? 0 : p.memberships.filter((m) => m.glossary).length;
      const codes = [...new Set(p.loinc.map((l) => l.loincCode))];
      const { rows: found } = codes.length
        ? await client.query(
          `SELECT cc.id, cc.code FROM terminology.catalog_concepts cc
             JOIN terminology.code_system_versions v ON v.id = cc.code_system_version_id
             JOIN terminology.code_systems cs ON cs.id = v.code_system_id
            WHERE cs.internal_code = ANY($1) AND cc.code = ANY($2)`,
          [LOINC_CODE_SYSTEMS, codes],
        )
        : { rows: [] };
      const byCode = new Map();
      for (const f of found) {
        if (!byCode.has(f.code)) byCode.set(f.code, []);
        byCode.get(f.code).push(f.id);
      }
      const maps = p.loinc.flatMap((l) => (byCode.get(l.loincCode) ?? []).map((target) => [id('map', `${l.id}:${target}`), l.source, target, l.context, l.version, CONCEPT.TERM_ACTIVE]));
      r.loincMaps = await insertMany(client, 'concept_maps', ['id', 'source_concept_id', 'target_concept_id', 'context', 'version', 'state_concept_id'], maps, ['uuid', 'uuid', 'uuid', null, null, 'uuid']);
      r.loincCodesNotInDb = codes.filter((c) => !byCode.has(c)).length;
      const total = r.concepts + r.designations + r.properties + r.relationships + r.memberships + r.loincMaps;
      await client.query(
        `INSERT INTO terminology.catalog_import_batches (id, source_id, code_system_version_id, started_at, finished_at, total_read, total_inserted, total_errors, checksum, recorded_at)
         VALUES ($1::uuid, $2::uuid, $3::uuid, $4, now(), $5, $6, 0, $7, now())`,
        [id('batch', `${p.codeSystem.internalCode}:${startedAt.toISOString()}`), sourceId, versionId, startedAt, p.rows.length, total, id('checksum', p.rows.map((x) => x.code).join('|'))],
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

const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  main().catch((err) => {
    console.error('ERROR FATAL en load-nursing-care:', err);
    process.exitCode = 1;
  });
}
