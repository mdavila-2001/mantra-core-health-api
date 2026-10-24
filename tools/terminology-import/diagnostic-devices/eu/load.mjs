#!/usr/bin/env node
// =============================================================================
// Etapa 3 (carga): EMDN → `terminology.*`. Sin DDL (ADR-0021).
//
//   dry-run (por defecto)  imprime el plan; no abre ninguna conexión
//   --apply                inserta con `ON CONFLICT DO NOTHING` sobre ids
//                          md5 estables; la 2.ª corrida inserta 0
//
// Qué se escribe con --apply:
//   terminology_sources / code_systems / code_system_versions de `emdn`
//   (se buscan por internal_code y se crean solo si faltan), un
//   catalog_concepts por código EMDN y sus concept_properties (nivel, padre,
//   terminal, regla de alcance diagnóstico, URL oficial), y un
//   catalog_import_batches por corrida.
// La jerarquía va como propiedad `emdn_parent_code`: no se inventa un tipo de
// relación en concept_relationships.
//
// Los EQUIPOS (fabricante, marca, modelo, UDI-DI) NO se cargan: el modelo no
// tiene dónde guardarlos (ver docs/seed-research/diagnostic-devices-eu.md,
// «Propuesta para el repo del modelo»). El dry-run informa cuántos hay.
//
//   node tools/terminology-import/diagnostic-devices/eu/load.mjs
//   node tools/terminology-import/diagnostic-devices/eu/load.mjs --apply   # .env DB_*
// =============================================================================

import 'dotenv/config';
import pg from 'pg';
import {
  md5uuid,
  nowIso,
  outDir,
  readJson,
  readNdjsonGzParts,
} from './lib/common.mjs';
import { existsSync } from 'node:fs';
import {
  conceptProperties,
  conceptRowId,
  propertyRowId,
} from './lib/load-plan.mjs';
import { SOURCES } from './lib/sources.mjs';

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const BATCH = 1000;
const CODE_SYSTEM = 'emdn';
const SOURCE_CODE = 'EC_EMDN';

const DB_CONFIG = {
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5433),
  user: process.env.DB_USER ?? 'mantra',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME ?? 'mantra_redesa_health',
};

async function insertMany(client, table, columns, tuples, casts) {
  let inserted = 0;
  for (let i = 0; i < tuples.length; i += BATCH) {
    const params = [];
    const values = tuples.slice(i, i + BATCH).map((t) => {
      const ph = t.map((v, j) => {
        params.push(v);
        return `$${params.length}${casts[j] ? `::${casts[j]}` : ''}`;
      });
      return `(${ph.join(', ')}, now(), now(), 1)`;
    });
    const res = await client.query(
      `INSERT INTO terminology.${table} (${columns.join(', ')}, created_at, updated_at, row_version) VALUES ${values.join(',\n')} ON CONFLICT DO NOTHING`,
      params,
    );
    inserted += res.rowCount;
  }
  return inserted;
}

async function ensureCodeSystem(client, version) {
  const src = SOURCES.EMDN;
  await client.query(
    `INSERT INTO terminology.terminology_sources (id, code, name, owner, official_url, license, created_at, updated_at, row_version)
     VALUES ($1::uuid, $2, $3, $4, $5, $6, now(), now(), 1) ON CONFLICT DO NOTHING`,
    [
      md5uuid(`mantra:dx-devices:source:${SOURCE_CODE}`),
      SOURCE_CODE,
      src.name,
      src.owner,
      src.officialUrl,
      src.terms.text,
    ],
  );
  const { rows: s } = await client.query(
    'SELECT id FROM terminology.terminology_sources WHERE code = $1',
    [SOURCE_CODE],
  );
  await client.query(
    `INSERT INTO terminology.code_systems (id, source_id, internal_code, name, canonical_url, case_sensitive, supports_composition, created_at, updated_at, row_version)
     VALUES ($1::uuid, $2::uuid, $3, $4, $5, true, false, now(), now(), 1) ON CONFLICT DO NOTHING`,
    [
      md5uuid(`mantra:dx-devices:code-system:${CODE_SYSTEM}`),
      s[0].id,
      CODE_SYSTEM,
      src.name,
      'https://webgate.ec.europa.eu/dyna2/emdn/',
    ],
  );
  const { rows: cs } = await client.query(
    'SELECT id, source_id FROM terminology.code_systems WHERE internal_code = $1',
    [CODE_SYSTEM],
  );
  await client.query(
    `INSERT INTO terminology.code_system_versions (id, code_system_id, version, published_at, is_default, created_at, updated_at, row_version)
     VALUES ($1::uuid, $2::uuid, $3, now(), false, now(), now(), 1) ON CONFLICT DO NOTHING`,
    [
      md5uuid(
        `mantra:dx-devices:code-system-version:${CODE_SYSTEM}:${version}`,
      ),
      cs[0].id,
      version,
    ],
  );
  const { rows: v } = await client.query(
    'SELECT id FROM terminology.code_system_versions WHERE code_system_id = $1 AND version = $2',
    [cs[0].id, version],
  );
  return { sourceId: cs[0].source_id, versionId: v[0].id };
}

async function main() {
  const concepts = readNdjsonGzParts('ec-emdn', { dir: outDir('emdn') });
  const manifest = existsSync(outDir('manifest.json'))
    ? readJson(outDir('manifest.json'))
    : { files: [] };
  const deviceRows = manifest.files.reduce((n, f) => n + f.rows, 0);
  const versions = [...new Set(concepts.map((c) => c.sourceVersion))];
  const summary = {
    mode: APPLY ? 'APPLY' : 'DRY-RUN',
    emdnConcepts: concepts.length,
    emdnVersions: versions,
    emdnProperties: concepts.reduce(
      (n, c) => n + conceptProperties(c).length,
      0,
    ),
    devicesNotLoaded: deviceRows,
    devicesNotLoadedReason:
      'el modelo no tiene tabla de catálogo de equipos (fabricante/marca/modelo/UDI-DI); ver propuesta en docs/seed-research/diagnostic-devices-eu.md',
  };
  console.log(JSON.stringify(summary, null, 2));
  if (!concepts.length) {
    console.log(
      'No hay EMDN en out/: nada que cargar (corra fetch.mjs y build.mjs con la fuente alcanzable).',
    );
    return;
  }
  if (versions.length !== 1)
    throw new Error(
      `Se esperaba una sola versión de EMDN en out/, hay ${versions.length}`,
    );
  if (!APPLY) return;

  const client = new pg.Client(DB_CONFIG);
  await client.connect();
  const startedAt = new Date();
  try {
    const { sourceId, versionId } = await ensureCodeSystem(client, versions[0]);
    const insertedConcepts = await insertMany(
      client,
      'catalog_concepts',
      [
        'id',
        'code_system_version_id',
        'code',
        'display',
        'abstract',
        'selectable',
      ],
      concepts.map((c) => [
        conceptRowId(versionId, c.code),
        versionId,
        c.code,
        c.display,
        !c.terminal,
        c.terminal,
      ]),
      ['uuid', 'uuid', null, null, null, null],
    );
    const { rows } = await client.query(
      'SELECT id, code FROM terminology.catalog_concepts WHERE code_system_version_id = $1',
      [versionId],
    );
    const idByCode = new Map(rows.map((r) => [r.code, r.id]));
    const props = concepts.flatMap((c) =>
      conceptProperties(c).map(([code, value]) => [
        propertyRowId(idByCode.get(c.code), code),
        idByCode.get(c.code),
        code,
        'json',
        JSON.stringify(value),
      ]),
    );
    const insertedProps = await insertMany(
      client,
      'concept_properties',
      ['id', 'concept_id', 'property_code', 'data_type', 'value_json'],
      props,
      ['uuid', 'uuid', null, 'terminology.technical_data_type', 'jsonb'],
    );
    await client.query(
      `INSERT INTO terminology.catalog_import_batches (id, source_id, code_system_version_id, started_at, finished_at, total_read, total_inserted, total_errors, checksum, recorded_at)
       VALUES ($1::uuid, $2::uuid, $3::uuid, $4, now(), $5, $6, 0, $7, now())`,
      [
        md5uuid(`mantra:dx-devices:emdn:batch:${startedAt.toISOString()}`),
        sourceId,
        versionId,
        startedAt,
        concepts.length + props.length,
        insertedConcepts + insertedProps,
        versions[0],
      ],
    );
    console.log(
      JSON.stringify(
        { insertedConcepts, insertedProps, at: nowIso() },
        null,
        2,
      ),
    );
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('ERROR FATAL en diagnostic-devices/eu/load:', err);
  process.exitCode = 1;
});
