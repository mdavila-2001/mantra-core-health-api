#!/usr/bin/env node
// =============================================================================
// Equipos de diagnóstico · master · etapa 2: taxonomía (`out/taxonomy-*`) →
// `terminology.*`. Sin DDL (ADR-0021), idempotente (ids deterministas +
// `ON CONFLICT DO NOTHING`: la segunda corrida inserta 0) y sin truncar nada.
//
// Fabricantes, marcas y modelos quedan en `out/` hasta que el modelo tenga sus
// tablas (propuesta en docs/seed-research/diagnostic-devices-master.md).
//
// Uso:
//   node tools/terminology-import/diagnostic-devices/master/load-taxonomy.mjs --dry-run
//   node tools/terminology-import/diagnostic-devices/master/load-taxonomy.mjs   # .env DB_*; la API tiene que haber sembrado terminology
// =============================================================================

import 'dotenv/config';
import pg from 'pg';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { listOutFiles, readNdjsonGz } from './lib/exchange.mjs';
import { INTERNAL, planTaxonomy } from './lib/load-plan.mjs';
import { md5uuid } from '../../lib/glossary-es/load-plan.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, 'out');
const DRY_RUN = process.argv.includes('--dry-run');
const BATCH = 1000;

const DB_CONFIG = {
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5433),
  user: process.env.DB_USER ?? 'mantra',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME ?? 'mantra_redesa_health',
};

if (
  !DRY_RUN &&
  !process.env.DB_NAME &&
  !process.argv.includes('--default-db')
)
  throw new Error(
    'Sin DB_NAME: este cargador apuntaría por defecto a 5433/mantra_redesa_health. Defina DB_HOST/DB_PORT/DB_USER/DB_NAME explícitos (o --default-db si de verdad es esa base).',
  );

async function readAll(base) {
  const out = [];
  for (const f of listOutFiles(OUT).filter(
    (f) =>
      f === `${base}.ndjson.gz` ||
      new RegExp(`^${base}-\\d{4}\\.ndjson\\.gz$`).test(f),
  )) {
    for await (const r of readNdjsonGz(join(OUT, f))) out.push(r);
  }
  return out;
}

async function insertMany(
  client,
  table,
  columns,
  tuples,
  casts,
  { audit = true } = {},
) {
  let inserted = 0;
  for (let i = 0; i < tuples.length; i += BATCH) {
    const chunk = tuples.slice(i, i + BATCH);
    const params = [];
    const values = chunk.map(
      (t) =>
        `(${t.map((v, j) => (params.push(v), `$${params.length}${casts[j] ? `::${casts[j]}` : ''}`)).join(', ')}${audit ? ', now(), now(), 1' : ''})`,
    );
    const cols = `${columns.join(', ')}${audit ? ', created_at, updated_at, row_version' : ''}`;
    await client.query('BEGIN');
    try {
      const res = await client.query(
        `INSERT INTO terminology.${table} (${cols}) VALUES ${values.join(',\n')} ON CONFLICT DO NOTHING`,
        params,
      );
      await client.query('COMMIT');
      inserted += res.rowCount;
    } catch (err) {
      await client.query('ROLLBACK');
      throw new Error(
        `INSERT en ${table} falló (lote ${i / BATCH + 1}): ${err.message}`,
      );
    }
  }
  return inserted;
}

async function assertPrerequisites(client) {
  const needed = Object.values(INTERNAL);
  const { rows } = await client.query(
    'SELECT id FROM terminology.catalog_concepts WHERE id = ANY($1::uuid[])',
    [needed],
  );
  if (rows.length !== needed.length) {
    const have = new Set(rows.map((r) => r.id));
    throw new Error(
      `Faltan conceptos internos (${needed.filter((n) => !have.has(n)).join(', ')}): arranque la API una vez para que siembre terminology.`,
    );
  }
}

/** Fuente, code system y versión; devuelve los ids reales (por si ya existían con otro id). */
async function upsertSystem(client, p) {
  await client.query(
    `INSERT INTO terminology.terminology_sources (id, code, name, owner, official_url, license, state_concept_id, created_at, updated_at, row_version)
     VALUES ($1::uuid, $2, $3, $4, $5, $6, $7::uuid, now(), now(), 1) ON CONFLICT DO NOTHING`,
    [
      p.source.id,
      p.source.code,
      p.source.name,
      p.source.owner,
      p.source.officialUrl,
      p.source.license,
      INTERNAL.TERM_ACTIVE,
    ],
  );
  const { rows: src } = await client.query(
    'SELECT id FROM terminology.terminology_sources WHERE code = $1',
    [p.source.code],
  );
  await client.query(
    `INSERT INTO terminology.code_systems (id, source_id, internal_code, name, canonical_url, case_sensitive, supports_composition, state_concept_id, created_at, updated_at, row_version)
     VALUES ($1::uuid, $2::uuid, $3, $4, $5, true, false, $6::uuid, now(), now(), 1) ON CONFLICT DO NOTHING`,
    [
      p.codeSystem.id,
      src[0].id,
      p.codeSystem.internalCode,
      p.codeSystem.name,
      p.codeSystem.canonicalUrl,
      INTERNAL.TERM_ACTIVE,
    ],
  );
  const { rows: cs } = await client.query(
    'SELECT id FROM terminology.code_systems WHERE internal_code = $1',
    [p.codeSystem.internalCode],
  );
  await client.query(
    `INSERT INTO terminology.code_system_versions (id, code_system_id, version, published_at, checksum, is_default, state_concept_id, created_at, updated_at, row_version)
     VALUES ($1::uuid, $2::uuid, $3, now(), $4, true, $5::uuid, now(), now(), 1) ON CONFLICT DO NOTHING`,
    [
      p.version.id,
      cs[0].id,
      p.version.version,
      p.checksum,
      INTERNAL.TERM_ACTIVE,
    ],
  );
  const { rows: csv } = await client.query(
    'SELECT id FROM terminology.code_system_versions WHERE code_system_id = $1 AND version = $2',
    [cs[0].id, p.version.version],
  );
  for (const c of p.concepts) c[1] = csv[0].id;
  return { sourceId: src[0].id, versionId: csv[0].id };
}

async function main() {
  const t0 = Date.now();
  console.log(
    `=== Taxonomía de equipos de diagnóstico → terminology.* ${DRY_RUN ? '(DRY-RUN, sin base)' : ''} ===`,
  );
  const nodes = await readAll('taxonomy-nodes');
  const crosswalks = await readAll('taxonomy-crosswalks');
  if (!nodes.length)
    throw new Error(`Sin nodos en ${OUT}: corra antes build.mjs`);
  const plan = planTaxonomy({ nodes, crosswalks });
  console.log('Nomenclaturas NO cargadas (política de licencia/idioma):');
  console.table(
    plan.skipped.map((x) => ({
      system: x.system,
      nodes: x.count,
      kind: x.kind,
      reason: x.reason.slice(0, 110),
    })),
  );
  console.log(`mapeos publicados omitidos por tener un extremo no cargable: ${plan.skippedCrosswalks}`);
  console.table(
    plan.systems.map((p) => ({
      system: p.system,
      version: p.version.version,
      concepts: p.concepts.length,
      designations: p.designations.length,
      properties: p.properties.length,
      relationships: p.relationships.length,
    })),
  );
  console.log(
    `mapeos publicados: ${plan.maps.length}; miembros del value set ${plan.valueSet.code}: ${plan.valueSet.members.length}`,
  );
  if (DRY_RUN) {
    console.log('No se tocó ninguna base.');
    return;
  }

  const client = new pg.Client(DB_CONFIG);
  await client.connect();
  const result = {};
  try {
    await assertPrerequisites(client);
    const ctx = new Map();
    for (const p of plan.systems)
      ctx.set(p.system, await upsertSystem(client, p));
    for (const p of plan.systems) {
      result[p.system] = {
        concepts: await insertMany(
          client,
          'catalog_concepts',
          [
            'id',
            'code_system_version_id',
            'code',
            'display',
            'definition',
            'selectable',
            'replaced_by_concept_id',
            'state_concept_id',
          ],
          p.concepts,
          ['uuid', 'uuid', null, null, null, 'boolean', 'uuid', 'uuid'],
        ),
      };
    }
    for (const p of plan.systems) {
      const r = result[p.system];
      r.designations = await insertMany(
        client,
        'concept_designations',
        [
          'id',
          'concept_id',
          'language_concept_id',
          'designation_type_concept_id',
          'value',
          'preferred',
        ],
        p.designations,
        ['uuid', 'uuid', 'uuid', 'uuid', null, 'boolean'],
      );
      r.properties = await insertMany(
        client,
        'concept_properties',
        ['id', 'concept_id', 'property_code', 'data_type', 'value_json'],
        p.properties,
        ['uuid', 'uuid', null, 'terminology.technical_data_type', 'jsonb'],
      );
      r.relationships = await insertMany(
        client,
        'concept_relationships',
        [
          'id',
          'source_concept_id',
          'target_concept_id',
          'relationship_type_concept_id',
          'ordinal',
        ],
        p.relationships,
        ['uuid', 'uuid', 'uuid', 'uuid', 'int'],
      );
      const { sourceId, versionId } = ctx.get(p.system);
      // Un lote solo se registra si esta corrida insertó algo: la 2.ª corrida no deja filas.
      if (Object.values(r).reduce((x, y) => x + y, 0) === 0) continue;
      await client.query(
        `INSERT INTO terminology.catalog_import_batches (id, source_id, code_system_version_id, started_at, finished_at, total_read, total_inserted, total_errors, checksum, recorded_at)
         VALUES ($1::uuid, $2::uuid, $3::uuid, $4, now(), $5, $6, 0, $7, now())`,
        [
          md5uuid(
            `mantra:dx-devices:batch:${p.system}:${new Date(t0).toISOString()}`,
          ),
          sourceId,
          versionId,
          new Date(t0),
          p.concepts.length,
          Object.values(r).reduce((a, b) => a + b, 0),
          p.checksum,
        ],
      );
    }
    result.maps = await insertMany(
      client,
      'concept_maps',
      [
        'id',
        'source_concept_id',
        'target_concept_id',
        'equivalence_concept_id',
        'context',
        'version',
        'state_concept_id',
      ],
      plan.maps,
      ['uuid', 'uuid', 'uuid', 'uuid', null, null, 'uuid'],
    );
    const vs = plan.valueSet;
    await client.query(
      `INSERT INTO terminology.value_sets (id, internal_code, name, canonical_url, description, state_concept_id, created_at, updated_at, row_version)
       VALUES ($1::uuid, $2, $3, $4, $5, $6::uuid, now(), now(), 1) ON CONFLICT DO NOTHING`,
      [
        vs.id,
        vs.code,
        vs.name,
        vs.canonicalUrl,
        'Tipos de dispositivo que la taxonomía publicada clasifica como equipos de diagnóstico (21 CFR, EMDN W y mapeos publicados).',
        INTERNAL.TERM_ACTIVE,
      ],
    );
    const { rows: vsr } = await client.query(
      'SELECT id FROM terminology.value_sets WHERE internal_code = $1',
      [vs.code],
    );
    await client.query(
      `INSERT INTO terminology.value_set_versions (id, value_set_id, version, valid_from, is_default, state_concept_id, created_at, updated_at, row_version)
       VALUES ($1::uuid, $2::uuid, $3, now(), true, $4::uuid, now(), now(), 1) ON CONFLICT DO NOTHING`,
      [vs.versionId, vsr[0].id, vs.version, INTERNAL.TERM_ACTIVE],
    );
    const { rows: vsv } = await client.query(
      'SELECT id FROM terminology.value_set_versions WHERE value_set_id = $1 AND version = $2',
      [vsr[0].id, vs.version],
    );
    for (const m of vs.members) m[1] = vsv[0].id;
    result.valueSetMembers = await insertMany(
      client,
      'value_set_members',
      ['id', 'value_set_version_id', 'concept_id', 'included', 'ordinal'],
      vs.members,
      ['uuid', 'uuid', 'uuid', 'boolean', 'int'],
    );
  } finally {
    await client.end();
  }
  console.log(
    '\n=== RESUMEN (filas NUEVAS; 0 en la segunda corrida = idempotente) ===',
  );
  console.log(
    JSON.stringify(
      { result, segundos: Math.round((Date.now() - t0) / 1000) },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error('ERROR FATAL en load-taxonomy (diagnostic-devices):', err);
  process.exitCode = 1;
});
