#!/usr/bin/env node
// =============================================================================
// ETL de síntomas, etapa 3 (load de RELACIONES enfermedad → síntoma/fenotipo).
//
// Usa `terminology.concept_relationship_evidence` del modelo canónico y el
// cargador masivo compartido. Si la tabla no existe, aborta sin
// escribir nada: cargar las aristas sin su evidencia perdería exactamente lo
// que la fuente publica (frecuencia, evidencia, negación).
//
// Depende de `seed-diseases`: la enfermedad se busca por código en los sistemas
// de `DEFAULT_DISEASE_SYSTEMS` (lib/relations-plan.mjs) o en los de
// `--disease-systems <json>`. Lo que no resuelve se cuenta y se reporta.
// Requiere que `load-symptoms.mjs --apply` ya haya cargado HPO y SYMP.
//
// Uso:
//   node tools/terminology-import/symptoms/load-disease-phenotypes.mjs                 # dry-run: plan sin base
//   node tools/terminology-import/symptoms/load-disease-phenotypes.mjs --check         # sólo verifica el modelo y la resolución
//   node tools/terminology-import/symptoms/load-disease-phenotypes.mjs --apply [--sources hpoa,doid] [--disease-systems x.json]
// =============================================================================

import 'dotenv/config';
import pg from 'pg';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { nowIso, readNdjson, writeJson } from '../lib/glossary-es/common.mjs';
import { DB_CONFIG, conceptIdsByCode, ensureCodeSystem } from './lib/db.mjs';
import { bulkLoadRelationships } from '../lib/bulk-copy.mjs';
import { CONCEPT } from '../lib/glossary-es/load-plan.mjs';
import { canonicalEvidenceBatches, EVIDENCE_COLUMNS } from './lib/evidence-contract.mjs';
import { CODE_SYSTEMS, md5uuid, versionId } from './lib/load-plan.mjs';
import { DEFAULT_DISEASE_SYSTEMS, REL, RELATION_SOURCES, diseaseSystemsFromJson, phenotypeResolver, relationsPlan } from './lib/relations-plan.mjs';
import { OUT_DIR, SOURCE_FILES } from './lib/sources.mjs';

const args = process.argv.slice(2);
const opt = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : null);
const APPLY = args.includes('--apply');
const CHECK = args.includes('--check');
const SOURCES = (opt('--sources') ?? Object.keys(RELATION_SOURCES).join(',')).split(',');
const DISEASE_SYSTEMS = opt('--disease-systems') ? diseaseSystemsFromJson(JSON.parse(readFileSync(opt('--disease-systems'), 'utf8'))) : DEFAULT_DISEASE_SYSTEMS;
const SOURCE_RELEASE_DATES = opt('--source-release-dates') ? JSON.parse(readFileSync(opt('--source-release-dates'), 'utf8')) : {};

export const EVIDENCE_TABLE = 'concept_relationship_evidence';
export { EVIDENCE_COLUMNS } from './lib/evidence-contract.mjs';

const nd = (name) => join(OUT_DIR, 'ndjson', `${name}.ndjson`);

function readCorpus() {
  const rows = [];
  for (const s of SOURCES) {
    if (!RELATION_SOURCES[s]) throw new Error(`Fuente de relaciones desconocida: ${s}`);
    const p = nd(RELATION_SOURCES[s].file);
    if (!existsSync(p)) throw new Error(`Falta ${p}: corré build-symptoms-corpus.mjs`);
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

async function main() {
  const t0 = Date.now();
  const rows = readCorpus();
  console.log(`=== Relaciones enfermedad → síntoma (${APPLY ? 'APPLY' : CHECK ? 'CHECK' : 'DRY-RUN'}) — ${rows.length} filas de ${SOURCES.join(', ')} ===`);

  if (!APPLY && !CHECK) {
    // Plan sin base: todas las enfermedades «resueltas» con un id ficticio por código, para medir aristas y evidencia.
    const codes = { hpo: new Set(readNdjson(nd('terms-hpo')).map((r) => r.code)), symp: new Set(readNdjson(nd('terms-symp')).map((r) => r.code)) };
    const plan = relationsPlan(rows, {
      resolveDisease: (curie) => ({ conceptId: md5uuid(`dry-run:${curie}`), via: null }),
      resolvePhenotype: phenotypeResolver(codes),
      sourceIdOf: (s) => s,
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
      console.error(`BLOQUEADO POR EL MODELO: falta terminology.${EVIDENCE_TABLE} (columnas ausentes: ${missing.join(', ')}).`);
      console.error('Aplicá el DDL canónico del modelo (SQL/03_terminology) y sus parches; ver docs/seed-research/symptoms.md § Modelo.');
      process.exitCode = 2;
      return;
    }
    const { rows: rel } = await client.query('SELECT id FROM terminology.catalog_concepts WHERE id = ANY($1::uuid[])', [[REL.SYMPTOM, REL.SYMPTOM_EXCLUDED]]);
    const have = new Set(rel.map((r) => r.id));
    if (!have.has(REL.SYMPTOM)) throw new Error('Falta el concepto REL_SYMPTOM (terminology:relationship:symptom): arrancá la API una vez.');
    const excludedTypeAvailable = have.has(REL.SYMPTOM_EXCLUDED);

    // Fenotipos: conceptos de HPO/SYMP cargados por load-symptoms.mjs (con remapeo si otra carga los creó).
    const codesBySystem = {};
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

    const plan = relationsPlan(rows, { resolveDisease, resolvePhenotype: phenotypeResolver(codesBySystem, idMap), sourceIdOf: (s) => s, excludedTypeAvailable });
    const batches = canonicalEvidenceBatches(plan, { validFromBySource: SOURCE_RELEASE_DATES });
    console.log(JSON.stringify({ loadedDiseaseSystems: loadedSystems, stats: plan.stats, unresolvedDiseasesByPrefix: plan.unresolvedDiseases, negatedNeeds: excludedTypeAvailable ? null : 'REL_SYMPTOM_EXCLUDED no sembrado: las negaciones se omiten' }, null, 2));
    if (CHECK) return;

    const inserted = { relationships: 0, evidence: 0 };
    const { rows: active } = await client.query('SELECT id FROM terminology.catalog_concepts WHERE id = $1::uuid', [CONCEPT.TERM_ACTIVE]);
    if (!active.length) throw new Error('Falta el concepto de estado activo de terminología');
    for (const batch of batches) {
      const sourceId = await ensureSource(client, batch.source);
      const key = `symptoms-annotations-${batch.source}`;
      const def = RELATION_SOURCES[batch.source];
      const context = await ensureCodeSystem(client, {
        source: { id: sourceId, code: def.code, name: def.name ?? CODE_SYSTEMS.hpo.sourceName },
        codeSystem: { id: md5uuid(`mantra:symptoms:annotation-system:${key}`), internalCode: key, name: key, canonicalUrl: `urn:mantra:${key}`, caseSensitive: true },
        version: { id: md5uuid(`mantra:symptoms:annotation-version:${key}:${batch.version}`), version: batch.version },
      }, active[0].id);
      const loaded = await bulkLoadRelationships(client, { terminologySourceId: context.sourceId, codeSystemVersionId: context.versionId, rows: batch.rows });
      inserted.relationships += loaded.relationships.inserted;
      inserted.evidence += loaded.evidence.inserted;
    }
    console.log('\n=== RESUMEN (filas NUEVAS; 0 en la segunda corrida = idempotente) ===');
    console.log(JSON.stringify({ inserted, segundos: Math.round((Date.now() - t0) / 1000) }, null, 2));
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('ERROR FATAL en load-disease-phenotypes:', err);
  process.exitCode = 1;
});
