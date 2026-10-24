#!/usr/bin/env node
// =============================================================================
// ETL de síntomas, etapa 2 (load de TÉRMINOS): corpus NDJSON → `terminology.*`.
//
// Por cada sistema (hpo, symp, ncit):
//   terminology_sources / code_systems / code_system_versions
//   catalog_concepts        code, display (castellano oficial o nombre de la fuente)
//   concept_designations    preferida EN, preferida ES (si es oficial), sinónimos EXACT EN
//   concept_properties      procedencia (fuente, id, versión, URI, fecha, licencia),
//                           definición de la fuente con su idioma, sinónimos con alcance,
//                           alt_ids, xrefs, sistema/órgano, subontología
//   concept_relationships   jerarquía is-a declarada por la fuente (REL_IS_A)
//   concept_maps            xrefs HPO → NCIt declarados por HPO
//   catalog_import_batches  un lote por sistema
// Con `--glossary`: además, los fenotipos de HPO con nombre oficial en castellano
// entran al glosario (value sets glossary-all-terms + glossary-category-signs-symptoms).
//
// Las relaciones enfermedad → síntoma NO van acá: ver load-disease-phenotypes.mjs.
//
// Idempotente: ids deterministas + ON CONFLICT DO NOTHING; no actualiza filas.
// Uso:
//   node tools/terminology-import/symptoms/load-symptoms.mjs                 # dry-run (sin base)
//   node tools/terminology-import/symptoms/load-symptoms.mjs --apply         # carga (.env DB_*)
//   node tools/terminology-import/symptoms/load-symptoms.mjs --apply --systems hpo
//   node tools/terminology-import/symptoms/load-symptoms.mjs --apply --glossary
// =============================================================================

import 'dotenv/config';
import pg from 'pg';
import { existsSync } from 'node:fs';
import { basename, join } from 'node:path';
import { nowIso, readNdjson, writeJson } from '../lib/glossary-es/common.mjs';
import { valueSetVersionId } from '../lib/glossary-es/load-plan.mjs';
import { DB_CONFIG, conceptIdsByCode, ensureCodeSystem, insertMany } from './lib/db.mjs';
import {
  CONCEPT, GLOSSARY_VALUE_SETS, codeSystemPlan, conceptId, conceptTuple, designationsFor, displayOf, glossaryFor, isARelationships, isGlossaryTerm, mapsFor, md5uuid, propertiesFor,
} from './lib/load-plan.mjs';
import { OUT_DIR, SOURCE_FILES } from './lib/sources.mjs';

const args = process.argv.slice(2);
if (args.includes('--dry-run') && args.includes('--apply')) throw new Error('Use --dry-run o --apply, no ambos.');
const DRY_RUN = !args.includes('--apply');
const GLOSSARY = args.includes('--glossary');
const SYSTEMS = args.includes('--systems') ? args[args.indexOf('--systems') + 1].split(',') : ['hpo', 'symp', 'ncit'];
const LICENSE = { hpo: SOURCE_FILES.find((s) => s.key === 'hpo-json').license, symp: SOURCE_FILES.find((s) => s.key === 'symp').license, ncit: SOURCE_FILES.find((s) => s.key === 'ncit').license };

function readTerms(cs) {
  const p = join(OUT_DIR, 'ndjson', `terms-${cs}.ndjson`);
  if (!existsSync(p)) throw new Error(`Falta ${p}: corré build-symptoms-corpus.mjs`);
  return readNdjson(p);
}

export function buildPlan(bySystem, { glossary = false } = {}) {
  const labels = new Map();
  for (const [cs, rows] of Object.entries(bySystem)) for (const r of rows) labels.set(`${cs}:${r.code}`, { en: r.enName, es: r.esName });
  const labelOf = (cs, code) => labels.get(`${cs}:${code}`) ?? { en: null, es: null };
  const codesBySystem = Object.fromEntries(Object.entries(bySystem).map(([cs, rows]) => [cs, new Set(rows.map((r) => r.code))]));
  return Object.entries(bySystem).map(([cs, rows]) => {
    const p = codeSystemPlan(cs, rows, LICENSE[cs]);
    const glossaryRows = glossary ? rows.filter(isGlossaryTerm).map(glossaryFor) : [];
    return {
      ...p,
      rows,
      concepts: rows.map((r) => conceptTuple(r, p.version.id)),
      designations: rows.flatMap(designationsFor).map((d) => [d.id, d.conceptId, d.lang, d.type, d.value, d.preferred]),
      properties: rows.flatMap((r) => propertiesFor(r, labelOf)).map((x) => [x.id, x.conceptId, x.code, x.dataType, JSON.stringify(x.value)]),
      relationships: rows.flatMap(isARelationships).map((x) => [x.id, x.source, x.target, x.type, x.ordinal]),
      maps: rows.flatMap((r) => mapsFor(r, codesBySystem)).map((m) => [m.id, m.source, m.target, null, m.context, m.version, CONCEPT.TERM_ACTIVE]),
      glossaryMemberships: glossaryRows.flatMap((g) => g.memberships).map((m) => [m.id, m.versionId, m.conceptId, true]),
      glossaryProperties: glossaryRows.flatMap((g) => g.properties).map((x) => [x.id, x.conceptId, x.code, x.dataType, JSON.stringify(x.value)]),
    };
  });
}

async function assertPrerequisites(client) {
  const needed = Object.values(CONCEPT);
  const { rows } = await client.query('SELECT id FROM terminology.catalog_concepts WHERE id = ANY($1::uuid[])', [needed]);
  if (rows.length !== needed.length) throw new Error(`Faltan conceptos internos del backend (${needed.length - rows.length} de ${needed.length}): arrancá la API una vez para que siembre terminology.`);
  if (GLOSSARY) {
    const ids = GLOSSARY_VALUE_SETS.map(valueSetVersionId);
    const { rows: vs } = await client.query('SELECT id FROM terminology.value_set_versions WHERE id = ANY($1::uuid[])', [ids]);
    if (vs.length !== ids.length) throw new Error('Faltan value sets del glosario (¿corrió GlossarySeedService?)');
  }
}

/** Reescribe en las tuplas los ids de concepto planificados por los reales. */
function remap(tuples, cols, idMap) {
  if (!idMap.size) return tuples;
  return tuples.map((t) => t.map((v, i) => (cols.includes(i) && idMap.has(v) ? idMap.get(v) : v)));
}

async function main() {
  const t0 = Date.now();
  console.log(`=== Carga de síntomas/fenotipos a terminology.* ${DRY_RUN ? '(DRY-RUN por defecto, sin base)' : '(APPLY explícito)'} ===`);
  const bySystem = Object.fromEntries(SYSTEMS.map((cs) => [cs, readTerms(cs)]));
  const plan = buildPlan(bySystem, { glossary: GLOSSARY });
  const summary = plan.map((p) => ({
    codeSystem: p.codeSystem.internalCode, version: p.version.version, concepts: p.concepts.length, designations: p.designations.length, properties: p.properties.length,
    isA: p.relationships.length, maps: p.maps.length, glossaryMembers: p.glossaryMemberships.length,
  }));
  console.log(JSON.stringify(summary, null, 2));
  if (DRY_RUN) {
    const sample = plan.map((p) => ({ codeSystem: p.codeSystem, source: p.source, version: p.version, concept: p.concepts[0], display: displayOf(p.rows[0]), designations: p.designations.slice(0, 3), properties: p.properties.slice(0, 6) }));
    writeJson(join(OUT_DIR, 'load-plan.dry-run.json'), { generatedAt: nowIso(), summary, sample }, true);
    console.log(`Plan en ${join(OUT_DIR, 'load-plan.dry-run.json')}. No se tocó ninguna base.`);
    return;
  }

  const client = new pg.Client(DB_CONFIG);
  await client.connect();
  const result = [];
  try {
    await assertPrerequisites(client);
    const idMap = new Map();
    const ctx = [];
    for (const p of plan) {
      const startedAt = new Date();
      const ids = await ensureCodeSystem(client, p, CONCEPT.TERM_ACTIVE);
      const concepts = p.concepts.map((c) => [c[0], ids.versionId, ...c.slice(2)]);
      const r = { codeSystem: p.codeSystem.internalCode, storedAs: ids.codeSystemInternalCode, version: p.version.version };
      r.concepts = await insertMany(client, 'catalog_concepts', ['id', 'code_system_version_id', 'code', 'display', 'definition', 'state_concept_id'], concepts, ['uuid', 'uuid', null, null, null, 'uuid']);
      const real = await conceptIdsByCode(client, ids.versionId);
      for (const row of p.rows) {
        const planned = conceptId(p.codeSystem.internalCode, row.code);
        const actual = real.get(row.code);
        if (actual && actual !== planned) idMap.set(planned, actual);
      }
      ctx.push({ p, r, ids, startedAt });
    }
    for (const { p, r } of ctx) {
      r.designations = await insertMany(client, 'concept_designations', ['id', 'concept_id', 'language_concept_id', 'designation_type_concept_id', 'value', 'preferred'], remap(p.designations, [1], idMap), ['uuid', 'uuid', 'uuid', 'uuid', null, null]);
      r.properties = await insertMany(client, 'concept_properties', ['id', 'concept_id', 'property_code', 'data_type', 'value_json'], remap([...p.properties, ...p.glossaryProperties], [1], idMap), ['uuid', 'uuid', null, 'terminology.technical_data_type', 'jsonb']);
    }
    // Relaciones y mapas al final: cruzan sistemas y la FK del destino exige que existan todos los conceptos.
    for (const { p, r, ids, startedAt } of ctx) {
      r.isA = await insertMany(client, 'concept_relationships', ['id', 'source_concept_id', 'target_concept_id', 'relationship_type_concept_id', 'ordinal'], remap(p.relationships, [1, 2], idMap), ['uuid', 'uuid', 'uuid', 'uuid', null]);
      r.maps = await insertMany(client, 'concept_maps', ['id', 'source_concept_id', 'target_concept_id', 'equivalence_concept_id', 'context', 'version', 'state_concept_id'], remap(p.maps, [1, 2], idMap), ['uuid', 'uuid', 'uuid', 'uuid', null, null, 'uuid']);
      r.glossaryMembers = await insertMany(client, 'value_set_members', ['id', 'value_set_version_id', 'concept_id', 'included'], remap(p.glossaryMemberships, [2], idMap), ['uuid', 'uuid', 'uuid', null]);
      const total = r.concepts + r.designations + r.properties + r.isA + r.maps + r.glossaryMembers;
      await client.query(
        `INSERT INTO terminology.catalog_import_batches (id, source_id, code_system_version_id, started_at, finished_at, total_read, total_inserted, total_errors, checksum, recorded_at)
         VALUES ($1::uuid, $2::uuid, $3::uuid, $4, now(), $5, $6, 0, $7, now())`,
        [md5uuid(`mantra:symptoms:batch:${p.codeSystem.internalCode}:${startedAt.toISOString()}`), ids.sourceId, ids.versionId, startedAt, p.rows.length, total, md5uuid(p.rows.map((x) => x.code).join('|'))],
      );
      r.remappedIds = [...idMap.keys()].length;
      result.push(r);
      console.log(`[load] ${JSON.stringify(r)}`);
    }
  } finally {
    await client.end();
  }
  console.log('\n=== RESUMEN (filas NUEVAS; 0 en la segunda corrida = idempotente) ===');
  console.log(JSON.stringify({ result, segundos: Math.round((Date.now() - t0) / 1000) }, null, 2));
}

if (basename(process.argv[1] ?? '') === 'load-symptoms.mjs') {
  main().catch((err) => {
    console.error('ERROR FATAL en load-symptoms:', err);
    process.exitCode = 1;
  });
}
