#!/usr/bin/env node
// =============================================================================
// Nutrición y alimentos · etapa 2 (corpus normalizado → `terminology.*`).
//
// Lee `data/` (o `--data DIR`) y carga:
//   terminology_sources / code_systems / code_system_versions   uno por fuente / code system
//   catalog_concepts        un concepto por registro (id = md5 de code system + versión + código)
//   concept_designations    nombres EN/ES; los demás idiomas (francés de Ciqual/CNF) van íntegros en la propiedad names_other_languages
//   concept_properties      procedencia (`nutrition_provenance`), licencia y los campos de cada fuente
//   concept_relationships   is-a que declara la fuente (alimento → categoría/grupo; clase FoodOn → superclase)
//   catalog_import_batches  un lote por code system y corpus (id determinista: la 2.ª corrida no agrega nada)
//
// Idempotente: ids deterministas + `ON CONFLICT DO NOTHING`; no actualiza filas ni escribe DDL.
// Requiere los conceptos internos que siembra la API (estado, idiomas, tipos de designación, is-a).
// SEGURIDAD: exige DB_HOST y DB_PORT explícitos (no lee .env) y se niega a correr contra la base real del stack.
//
//   DB_HOST=127.0.0.1 DB_PORT=55443 DB_USER=mantra DB_NAME=c13 node --max-old-space-size=2500 \
//     tools/terminology-import/nutrition-foods/load-nutrition-foods.mjs [--dry-run] [--no-branded] [--data DIR]
// =============================================================================
import pg from 'pg';
import { resolve } from 'node:path';

import { DATA_DIR } from './lib/paths.mjs';
import { INTERNAL, md5uuid } from './lib/model.mjs';
import { artifactIndex, conceptParts, planConcept, readCodeSystems, readNdjsonGz, structurePlan } from './lib/load-plan.mjs';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const NO_BRANDED = args.includes('--no-branded');
const DIR = resolve(args.includes('--data') ? args[args.indexOf('--data') + 1] : DATA_DIR);
const CHUNK = 2000;

function dbConfig() {
  for (const k of ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER']) if (!process.env[k]) throw new Error(`Falta ${k}: este cargador exige la conexión explícita a una base desechable (no usa .env ni valores por defecto).`);
  const cfg = { host: process.env.DB_HOST, port: Number(process.env.DB_PORT), user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME };
  if (!/^(127\.0\.0\.1|localhost)$/.test(cfg.host)) throw new Error(`DB_HOST=${cfg.host}: solo se carga contra una base local desechable`);
  if (cfg.port === 5433 || /redesa|mantra_.*health/i.test(cfg.database)) throw new Error(`Se niega a cargar en ${cfg.host}:${cfg.port}/${cfg.database}: parece la base real del stack`);
  return cfg;
}

/**
 * INSERT … SELECT FROM unnest(arrays) ON CONFLICT DO NOTHING. `cols` = [[nombre, tipo]]; los valores viajan como
 * texto y se convierten en el SELECT (así un lote de 2000 filas son N parámetros, no 2000×N).
 */
async function insertRows(client, table, cols, rows, { audit = true } = {}) {
  if (rows.length === 0) return 0;
  const params = cols.map((_, j) => rows.map((r) => (r[j] === null || r[j] === undefined ? null : typeof r[j] === 'object' ? JSON.stringify(r[j]) : String(r[j]))));
  const names = cols.map(([n]) => n);
  const sel = cols.map(([, t], j) => (t === 'text' ? `x.c${j}` : `x.c${j}::${t}`));
  const aliases = cols.map((_, j) => `c${j}`);
  const sql = `INSERT INTO terminology.${table} (${names.join(', ')}${audit ? ', created_at, updated_at, row_version' : ''})
     SELECT ${sel.join(', ')}${audit ? ', now(), now(), 1' : ''}
       FROM unnest(${cols.map((_, j) => `$${j + 1}::text[]`).join(', ')}) AS x(${aliases.join(', ')})
     ON CONFLICT DO NOTHING`;
  try {
    return (await client.query(sql, params)).rowCount;
  } catch (err) {
    throw new Error(`INSERT en ${table} falló: ${err.message}`);
  }
}

const COLS = {
  concepts: [['id', 'uuid'], ['code_system_version_id', 'uuid'], ['code', 'text'], ['display', 'text'], ['definition', 'text'], ['abstract', 'boolean'], ['selectable', 'boolean'], ['state_concept_id', 'uuid']],
  designations: [['id', 'uuid'], ['concept_id', 'uuid'], ['language_concept_id', 'uuid'], ['designation_type_concept_id', 'uuid'], ['value', 'text'], ['preferred', 'boolean']],
  properties: [['id', 'uuid'], ['concept_id', 'uuid'], ['property_code', 'text'], ['data_type', 'terminology.technical_data_type'], ['value_json', 'jsonb']],
  relationships: [['id', 'uuid'], ['source_concept_id', 'uuid'], ['target_concept_id', 'uuid'], ['relationship_type_concept_id', 'uuid'], ['ordinal', 'int']],
};

async function assertPrerequisites(client) {
  const needed = [...Object.values(INTERNAL.STATE), ...Object.values(INTERNAL.LANG), INTERNAL.DESIG_PREFERRED, INTERNAL.DESIG_SYNONYM, INTERNAL.REL_IS_A];
  const { rows } = await client.query('SELECT id::text FROM terminology.catalog_concepts WHERE id = ANY($1::uuid[])', [needed]);
  const have = new Set(rows.map((r) => r.id));
  const missing = needed.filter((id) => !have.has(id));
  if (missing.length) throw new Error(`Faltan ${missing.length} conceptos internos: arrancá la API una vez (o sembrá una base desechable con seed-disposable-db.mjs).`);
}

async function loadStructure(client, plan) {
  const out = { sources: 0, codeSystems: 0, versions: 0 };
  for (const s of plan.sources) {
    out.sources += await insertRows(client, 'terminology_sources', [['id', 'uuid'], ['code', 'text'], ['name', 'text'], ['owner', 'text'], ['official_url', 'text'], ['license', 'text'], ['state_concept_id', 'uuid']], [[s.id, s.code, s.name, s.owner, s.officialUrl, s.license, INTERNAL.STATE.active]]);
  }
  const srcIds = new Map((await client.query('SELECT code, id::text FROM terminology.terminology_sources WHERE code = ANY($1)', [plan.sources.map((s) => s.code)])).rows.map((r) => [r.code, r.id]));
  for (const c of plan.systems) {
    out.codeSystems += await insertRows(client, 'code_systems', [['id', 'uuid'], ['source_id', 'uuid'], ['internal_code', 'text'], ['name', 'text'], ['canonical_url', 'text'], ['case_sensitive', 'boolean'], ['supports_composition', 'boolean'], ['state_concept_id', 'uuid']], [[c.id, srcIds.get(c.sourceCode), c.internalCode, c.name, c.canonicalUrl, true, false, INTERNAL.STATE.active]]);
    const realId = (await client.query('SELECT id::text FROM terminology.code_systems WHERE internal_code = $1', [c.internalCode])).rows[0].id;
    if (realId !== c.id) throw new Error(`${c.internalCode}: ya existe con otro id (${realId}); la carga no reescribe filas ajenas`);
    out.versions += await insertRows(client, 'code_system_versions', [['id', 'uuid'], ['code_system_id', 'uuid'], ['version', 'text'], ['is_default', 'boolean'], ['state_concept_id', 'uuid']], [[c.versionId, c.id, c.version, true, INTERNAL.STATE.active]]);
  }
  return out;
}

async function main() {
  const t0 = Date.now();
  console.log(`=== Carga de nutrición y alimentos a terminology.* ${DRY_RUN ? '(DRY-RUN, sin base)' : ''} · corpus ${DIR}${NO_BRANDED ? ' · sin Branded' : ''} ===`);
  const codeSystems = await readCodeSystems(DIR, { noBranded: NO_BRANDED });
  const plan = structurePlan(codeSystems);
  const artifacts = artifactIndex(codeSystems);
  const parts = conceptParts(DIR, { noBranded: NO_BRANDED });
  const client = DRY_RUN ? null : new pg.Client(dbConfig());
  const result = { structure: null, concepts: 0, designations: 0, properties: 0, relationships: 0, importBatches: 0 };
  const seen = { concepts: 0, designations: 0, properties: 0, relationships: 0 };
  if (client) {
    await client.connect();
    console.log(`Conectado a ${client.host}:${client.port}/${client.database}`);
  }
  try {
    if (client) {
      await assertPrerequisites(client);
      await client.query('BEGIN');
      result.structure = await loadStructure(client, plan);
    }
    // pasada 1: conceptos, designaciones y propiedades. pasada 2: relaciones (los destinos ya existen)
    for (const pass of [1, 2]) {
      for (const file of parts) {
        console.log(`pasada ${pass}: ${file}`);
        let buf = { concepts: [], designations: [], properties: [], relationships: [] };
        const flush = async () => {
          if (client) {
            if (pass === 1) {
              result.concepts += await insertRows(client, 'catalog_concepts', COLS.concepts, buf.concepts);
              result.designations += await insertRows(client, 'concept_designations', COLS.designations, buf.designations);
              result.properties += await insertRows(client, 'concept_properties', COLS.properties, buf.properties);
            } else {
              result.relationships += await insertRows(client, 'concept_relationships', COLS.relationships, buf.relationships);
            }
          }
          buf = { concepts: [], designations: [], properties: [], relationships: [] };
        };
        for await (const rec of readNdjsonGz(file)) {
          const p = planConcept(rec, artifacts);
          if (pass === 1) {
            seen.concepts++;
            buf.concepts.push([p.concept.id, p.concept.versionId, p.concept.code, p.concept.display, p.concept.definition, false, true, p.concept.state]);
            for (const d of p.designations) { seen.designations++; buf.designations.push([d.id, d.conceptId, d.lang, d.type, d.value, d.preferred]); }
            for (const q of p.properties) { seen.properties++; buf.properties.push([q.id, q.conceptId, q.code, q.dataType, JSON.stringify(q.value)]); }
          } else {
            for (const r of p.relationships) { seen.relationships++; buf.relationships.push([r.id, r.source, r.target, r.type, r.ordinal]); }
          }
          if (buf.concepts.length >= CHUNK || buf.relationships.length >= CHUNK) await flush();
        }
        await flush();
      }
    }
    if (client) {
      const started = new Date();
      for (const c of plan.systems) {
        const { rows } = await client.query('SELECT id::text FROM terminology.terminology_sources s WHERE s.code = $1', [c.sourceCode]);
        result.importBatches += await insertRows(
          client,
          'catalog_import_batches',
          [['id', 'uuid'], ['source_id', 'uuid'], ['code_system_version_id', 'uuid'], ['started_at', 'timestamptz'], ['finished_at', 'timestamptz'], ['total_read', 'int'], ['total_inserted', 'int'], ['total_errors', 'int'], ['checksum', 'text'], ['recorded_at', 'timestamptz']],
          [[md5uuid(`mantra:nutrition-foods:batch:${c.internalCode}:${c.version}:${c.checksum}`), rows[0].id, c.versionId, started.toISOString(), new Date().toISOString(), c.concepts, c.concepts, 0, c.checksum, new Date().toISOString()]],
          { audit: false },
        );
      }
      await client.query('COMMIT');
    }
  } catch (err) {
    if (client) await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    if (client) await client.end();
  }
  console.log('\n=== LEÍDO DEL CORPUS ===');
  console.log(JSON.stringify({ codeSystems: plan.systems.length, ...seen }, null, 2));
  if (!DRY_RUN) {
    console.log('\n=== FILAS NUEVAS (0 en la segunda corrida = idempotente) ===');
    console.log(JSON.stringify({ ...result, segundos: Math.round((Date.now() - t0) / 1000) }, null, 2));
  } else {
    console.log('No se tocó ninguna base.');
  }
}

main().catch((err) => {
  console.error('ERROR FATAL en load-nutrition-foods:', err);
  process.exitCode = 1;
});
