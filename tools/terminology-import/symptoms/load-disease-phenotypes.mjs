#!/usr/bin/env node
// =============================================================================
// ETL de síntomas, etapa 3 (load de RELACIONES enfermedad → síntoma/fenotipo).
//
// Escribe en el modelo REAL (v4.2.50, repo del modelo, commit e8bd453):
//   concept_relationships          una arista por (enfermedad, fenotipo, tipo);
//                                  tipo REL_SYMPTOM, o REL_SYMPTOM_EXCLUDED para lo que
//                                  la fuente NIEGA (HPOA `NOT`, Orphanet «Excluded (0%)»)
//   concept_relationship_evidence  una fila por línea/axioma de la fuente, con su nivel de
//                                  evidencia, frecuencia (n/m o clase), referencia estable,
//                                  campos publicados, vigencia y versión del fenotipo
//
// Antes de escribir comprueba el modelo (tabla y columnas, value sets
// vs_evidence_tier y vs_relationship_frequency sembrados). Si falta algo,
// aborta SIN escribir y dice qué: cargar aristas sin su evidencia perdería lo
// que la fuente publica.
//
// No calcula las columnas derivadas de la arista (strength_score, evidence_count,
// best_evidence_tier_concept_id, frequency_concept_id): el modelo dice que las
// recalcula el cargador masivo de TAREA-41 F1.3 y no define la fórmula ni el
// orden entre niveles; no se inventan acá.
//
// Depende de `seed-diseases`: la enfermedad se busca por código en los sistemas
// de `DEFAULT_DISEASE_SYSTEMS` (lib/relations-plan.mjs) o en los de
// `--disease-systems <json>`. Lo que no resuelve se cuenta y se reporta.
// Requiere que `load-symptoms.mjs --apply` ya haya cargado HPO y SYMP.
//
// Uso:
//   node tools/terminology-import/symptoms/load-disease-phenotypes.mjs                 # dry-run: plan sin base
//   node tools/terminology-import/symptoms/load-disease-phenotypes.mjs --check         # sólo verifica el modelo y la resolución
//   node tools/terminology-import/symptoms/load-disease-phenotypes.mjs --apply [--sources hpoa,orphadata,doid] [--disease-systems x.json]
// =============================================================================

import 'dotenv/config';
import pg from 'pg';
import { existsSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { nowIso, readNdjson, writeJson } from '../lib/glossary-es/common.mjs';
import { DB_CONFIG, conceptIdsByCode, insertMany } from './lib/db.mjs';
import { CODE_SYSTEMS, md5uuid, versionId } from './lib/load-plan.mjs';
import { DEFAULT_DISEASE_SYSTEMS, EVIDENCE_VALUE_SETS, REL, RELATION_SOURCES, diseaseSystemsFromJson, phenotypeResolver, relationsPlan } from './lib/relations-plan.mjs';
import { OUT_DIR, SOURCE_FILES } from './lib/sources.mjs';

const args = process.argv.slice(2);
const opt = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : null);
const APPLY = args.includes('--apply');
const CHECK = args.includes('--check');
const SOURCES = (opt('--sources') ?? Object.keys(RELATION_SOURCES).filter((s) => existsSync(join(OUT_DIR, 'ndjson', `${RELATION_SOURCES[s].file}.ndjson`))).join(',')).split(',');
const DISEASE_SYSTEMS = opt('--disease-systems') ? diseaseSystemsFromJson(JSON.parse(readFileSync(opt('--disease-systems'), 'utf8'))) : DEFAULT_DISEASE_SYSTEMS;

export const EVIDENCE_TABLE = 'concept_relationship_evidence';
export const EVIDENCE_COLUMNS = ['id', 'concept_relationship_id', 'terminology_source_id', 'code_system_version_id', 'evidence_tier_concept_id', 'source_reference', 'citation_text', 'citation_locator', 'frequency_concept_id', 'frequency_numerator', 'frequency_denominator', 'statistic_value', 'valid_from'];
const EVIDENCE_CASTS = ['uuid', 'uuid', 'uuid', 'uuid', 'uuid', null, null, null, 'uuid', null, null, 'numeric', 'date'];
const RELATION_COLUMNS = ['id', 'source_concept_id', 'target_concept_id', 'relationship_type_concept_id', 'ordinal'];
const RELATION_CASTS = ['uuid', 'uuid', 'uuid', 'uuid', null];

/** Objeto de evidencia del plan → tupla en el orden de EVIDENCE_COLUMNS. */
export const evidenceTuple = (e, relationshipId = e.relationshipId) => [e.id, relationshipId, e.terminologySourceId, e.codeSystemVersionId, e.evidenceTierConceptId, e.sourceReference, e.citationText, e.citationLocator, e.frequencyConceptId, e.frequencyNumerator, e.frequencyDenominator, e.statisticValue, e.validFrom];

const nd = (name) => join(OUT_DIR, 'ndjson', `${name}.ndjson`);

function readCorpus() {
  const rows = [];
  for (const s of SOURCES) {
    if (!RELATION_SOURCES[s]) throw new Error(`Fuente de relaciones desconocida: ${s}`);
    const p = nd(RELATION_SOURCES[s].file);
    if (!existsSync(p)) throw new Error(`Falta ${p}: corré build-symptoms-corpus.mjs / build-gap-sources.mjs (o unpack-data.mjs)`);
    for (const r of readNdjson(p)) rows.push(r);
  }
  return rows;
}

/** Columnas faltantes de la tabla de evidencia (vacío = el modelo ya la tiene). */
async function missingEvidenceColumns(client) {
  const { rows } = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_schema = 'terminology' AND table_name = $1`, [EVIDENCE_TABLE]);
  const have = new Set(rows.map((r) => r.column_name));
  return EVIDENCE_COLUMNS.filter((c) => !have.has(c));
}

/** code → id de un value set sembrado (miembros de una versión de code system). */
async function valueSetMembers(client, { version, codes }) {
  const { rows } = await client.query(
    `SELECT cc.code, cc.id FROM terminology.catalog_concepts cc JOIN terminology.code_system_versions v ON v.id = cc.code_system_version_id WHERE v.version = $1 AND cc.code = ANY($2)`,
    [version, codes],
  );
  const map = new Map(rows.map((r) => [r.code, r.id]));
  const missing = codes.filter((c) => !map.has(c));
  return { map, missing };
}

/** Índice código → concepto de enfermedad cargado por `seed-diseases`. */
async function diseaseIndex(client, rows) {
  const byPrefix = new Map();
  for (const r of rows) {
    if (!byPrefix.has(r.disease.prefix)) byPrefix.set(r.disease.prefix, new Set());
    byPrefix.get(r.disease.prefix).add(r.disease.id);
  }
  const index = new Map();
  const loadedSystems = {};
  for (const [prefix, ids] of byPrefix) {
    const cfg = DISEASE_SYSTEMS[prefix];
    if (!cfg) continue;
    const candidates = [...ids].flatMap((id) => cfg.codes(id).map((code) => [code, `${prefix}:${id}`]));
    const curieOf = new Map(candidates);
    const { rows: found } = await client.query(
      `SELECT DISTINCT ON (cc.code) cc.code, cc.id, cs.internal_code
         FROM terminology.catalog_concepts cc
         JOIN terminology.code_system_versions v ON v.id = cc.code_system_version_id
         JOIN terminology.code_systems cs ON cs.id = v.code_system_id
        WHERE cs.internal_code = ANY($1) AND cc.code = ANY($2)
        ORDER BY cc.code, v.is_default DESC NULLS LAST, v.published_at DESC NULLS LAST`,
      [cfg.internalCodes, candidates.map(([c]) => c)],
    );
    for (const f of found) {
      index.set(curieOf.get(f.code), f.id);
      loadedSystems[f.internal_code] = (loadedSystems[f.internal_code] ?? 0) + 1;
    }
  }
  return { index, loadedSystems };
}

async function ensureSource(client, key) {
  const def = RELATION_SOURCES[key];
  if (def.code === 'HPO_CONSORTIUM') {
    const hpo = CODE_SYSTEMS.hpo;
    const license = SOURCE_FILES.find((s) => s.key === 'hpoa').license;
    await client.query(
      `INSERT INTO terminology.terminology_sources (id, code, name, owner, official_url, license, created_at, updated_at, row_version)
       VALUES ($1::uuid, $2, $3, $4, $5, $6, now(), now(), 1) ON CONFLICT DO NOTHING`,
      [md5uuid(`mantra:symptoms:source:${hpo.sourceCode}`), hpo.sourceCode, hpo.sourceName, hpo.owner, hpo.officialUrl, license],
    );
  } else {
    await client.query(
      `INSERT INTO terminology.terminology_sources (id, code, name, owner, official_url, license, created_at, updated_at, row_version)
       VALUES ($1::uuid, $2, $3, $4, $5, $6, now(), now(), 1) ON CONFLICT DO NOTHING`,
      [md5uuid(`mantra:symptoms:source:${def.code}`), def.code, def.name, def.owner, def.url, def.license],
    );
  }
  const { rows } = await client.query('SELECT id FROM terminology.terminology_sources WHERE code = $1', [def.code]);
  return rows[0].id;
}

/** Id real de cada arista ya existente (misma clave natural) cuando difiere del planificado. */
async function realRelationshipIds(client, relationships) {
  const remap = new Map();
  const CHUNK = 10000;
  for (let i = 0; i < relationships.length; i += CHUNK) {
    const part = relationships.slice(i, i + CHUNK);
    const { rows } = await client.query(
      `SELECT p.pid AS planned, r.id AS real
         FROM unnest($1::uuid[], $2::uuid[], $3::uuid[], $4::uuid[]) AS p(pid, s, t, ty)
         JOIN terminology.concept_relationships r ON r.source_concept_id = p.s AND r.target_concept_id = p.t AND r.relationship_type_concept_id = p.ty`,
      [part.map((r) => r[0]), part.map((r) => r[1]), part.map((r) => r[2]), part.map((r) => r[3])],
    );
    for (const r of rows) if (r.planned !== r.real) remap.set(r.planned, r.real);
  }
  return remap;
}

async function main() {
  const t0 = Date.now();
  const rows = readCorpus();
  console.log(`=== Relaciones enfermedad → síntoma (${APPLY ? 'APPLY' : CHECK ? 'CHECK' : 'DRY-RUN'}) — ${rows.length} filas de ${SOURCES.join(', ')} ===`);

  const codes = { hpo: new Set(readNdjson(nd('terms-hpo')).map((r) => r.code)), symp: new Set(readNdjson(nd('terms-symp')).map((r) => r.code)) };
  if (!APPLY && !CHECK) {
    // Plan sin base: todas las enfermedades «resueltas» con un id ficticio por código, para medir aristas y evidencia.
    const plan = relationsPlan(rows, {
      resolveDisease: (curie) => ({ conceptId: md5uuid(`dry-run:${curie}`), via: null }),
      resolvePhenotype: phenotypeResolver(codes),
      sourceIdOf: (s) => s,
      versionIdOf: (s) => `version:${s}`,
      tierIdOf: (c) => `tier:${c}`,
      frequencyIdOf: (c) => `freq:${c}`,
      excludedTypeAvailable: true,
    });
    writeJson(join(OUT_DIR, 'relations-plan.dry-run.json'), { generatedAt: nowIso(), stats: plan.stats, sampleEvidence: plan.evidence.slice(0, 3) }, true);
    console.log(JSON.stringify(plan.stats, null, 2));
    return;
  }

  const client = new pg.Client(DB_CONFIG);
  await client.connect();
  try {
    const missing = await missingEvidenceColumns(client);
    if (missing.length) {
      console.error(`BLOQUEADO POR EL MODELO: falta terminology.${EVIDENCE_TABLE} o sus columnas (${missing.join(', ')}).`);
      console.error('Aplicá SQL/03_terminology del repo del modelo, o su patch SQL/patches/2026-10-25_v4250_terminology_relationship_evidence.sql (commit e8bd453).');
      process.exitCode = 2;
      return;
    }
    const tiers = await valueSetMembers(client, EVIDENCE_VALUE_SETS.tier);
    const freqs = await valueSetMembers(client, EVIDENCE_VALUE_SETS.frequency);
    if (tiers.missing.length || freqs.missing.length) {
      console.error(`BLOQUEADO POR LOS SEEDS: faltan miembros de vs_evidence_tier (${tiers.missing.join(', ') || 'ninguno'}) o vs_relationship_frequency (${freqs.missing.join(', ') || 'ninguno'}).`);
      console.error('Los siembra gen_seeds.py (SEED_REVISION 2.8.0-v4.2.50): load_seeds.py --skip-prod --refresh.');
      process.exitCode = 2;
      return;
    }
    const { rows: rel } = await client.query('SELECT id FROM terminology.catalog_concepts WHERE id = ANY($1::uuid[])', [[REL.SYMPTOM, REL.SYMPTOM_EXCLUDED]]);
    const have = new Set(rel.map((r) => r.id));
    if (!have.has(REL.SYMPTOM)) throw new Error('Falta el concepto REL_SYMPTOM (terminology:relationship:symptom): arrancá la API una vez.');
    const excludedTypeAvailable = have.has(REL.SYMPTOM_EXCLUDED);

    // Fenotipos: conceptos de HPO/SYMP cargados por load-symptoms.mjs (con remapeo si otra carga los creó).
    const codesBySystem = {};
    const versionIds = {};
    const idMap = new Map();
    for (const cs of ['hpo', 'symp']) {
      const terms = readNdjson(nd(`terms-${cs}`));
      const { rows: v } = await client.query(
        `SELECT v.id FROM terminology.code_system_versions v JOIN terminology.code_systems c ON c.id = v.code_system_id
          WHERE (c.internal_code = $1 OR c.canonical_url = $2) AND v.version = $3`,
        [cs, CODE_SYSTEMS[cs].canonicalUrl, terms[0].version],
      );
      if (!v.length) throw new Error(`${cs} ${terms[0].version} no está cargado: corré load-symptoms.mjs --apply primero.`);
      const real = await conceptIdsByCode(client, v[0].id);
      codesBySystem[cs] = new Set(real.keys());
      versionIds[cs] = v[0].id;
      for (const [code, id] of real) {
        const planned = md5uuid(`mantra:symptoms:concept:${cs}:${code}`);
        if (planned !== id) idMap.set(planned, id);
      }
      if (v[0].id !== versionId(cs, terms[0].version)) console.warn(`[aviso] ${cs}: versión creada por otra carga (${v[0].id}); se usan sus conceptos.`);
    }

    // Enfermedades: por código; si no, por el MONDO id que Mondo declara equivalente.
    const { index, loadedSystems } = await diseaseIndex(client, rows);
    const equiv = new Map(readNdjson(nd('disease-equivalences')).map((e) => [e.curie, e.mondo]));
    const mondoNeeded = [...new Set(rows.map((r) => equiv.get(r.disease.curie)).filter(Boolean))].map((m) => ({ disease: { prefix: 'MONDO', id: m.slice(6), curie: m } }));
    const { index: mondoIndex } = await diseaseIndex(client, mondoNeeded);
    const resolveDisease = (curie) => {
      const direct = index.get(curie);
      if (direct) return { conceptId: direct, via: null };
      const m = equiv.get(curie);
      const viaMondo = m ? mondoIndex.get(m) : null;
      return viaMondo ? { conceptId: viaMondo, via: `MONDO:equivalentTo ${m}` } : null;
    };

    const sourceIds = {};
    for (const s of SOURCES) sourceIds[s] = await ensureSource(client, s);
    // El corpus nombra la fuente por su archivo (`hpoa`, `hpo-common-disease`, …): misma clave.
    const plan = relationsPlan(rows, {
      resolveDisease,
      resolvePhenotype: phenotypeResolver(codesBySystem, idMap),
      sourceIdOf: (s) => sourceIds[s],
      versionIdOf: (system) => versionIds[system],
      tierIdOf: (code) => tiers.map.get(code),
      frequencyIdOf: (code) => freqs.map.get(code),
      excludedTypeAvailable,
    });
    console.log(JSON.stringify({ loadedDiseaseSystems: loadedSystems, stats: plan.stats, unresolvedDiseasesByPrefix: plan.unresolvedDiseases, negatedNeeds: excludedTypeAvailable ? null : 'REL_SYMPTOM_EXCLUDED no sembrado: las negaciones se omiten' }, null, 2));
    if (CHECK) return;

    const startedAt = new Date();
    const inserted = { relationships: await insertMany(client, 'concept_relationships', RELATION_COLUMNS, plan.relationships, RELATION_CASTS) };
    // Si la arista ya existía con otro id (misma clave natural), la evidencia cuelga de la real.
    const remap = await realRelationshipIds(client, plan.relationships);
    inserted.evidence = await insertMany(client, EVIDENCE_TABLE, EVIDENCE_COLUMNS, plan.evidence.map((e) => evidenceTuple(e, remap.get(e.relationshipId) ?? e.relationshipId)), EVIDENCE_CASTS);
    for (const s of SOURCES) {
      await client.query(
        `INSERT INTO terminology.catalog_import_batches (id, source_id, started_at, finished_at, total_read, total_inserted, total_errors, checksum, recorded_at)
         VALUES ($1::uuid, $2::uuid, $3, now(), $4, $5, $6, $7, now())`,
        [md5uuid(`mantra:symptoms:relations-batch:${s}:${startedAt.toISOString()}`), sourceIds[s], startedAt, rows.filter((r) => r.source === s).length, inserted.relationships + inserted.evidence, plan.stats.diseaseUnresolved + plan.stats.phenotypeUnresolved, s],
      );
    }
    console.log('\n=== RESUMEN (filas NUEVAS; 0 en la segunda corrida = idempotente) ===');
    console.log(JSON.stringify({ inserted, remappedRelationships: remap.size, segundos: Math.round((Date.now() - t0) / 1000) }, null, 2));
  } finally {
    await client.end();
  }
}

if (basename(process.argv[1] ?? '') === 'load-disease-phenotypes.mjs') {
  main().catch((err) => {
    console.error('ERROR FATAL en load-disease-phenotypes:', err);
    process.exitCode = 1;
  });
}
