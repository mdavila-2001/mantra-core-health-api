#!/usr/bin/env node
// =============================================================================
// ETL de genética, etapa 2 (load): corpus NDJSON → `terminology.*`.
//
// Por cada code system (hgnc, hgnc-gene-group, ncbi-gene-hs, medgen, so,
// clinvar-terms, clinvar-functional, clingen-terms, hgvs-syntax, ga4gh-vrs):
//   terminology_sources / code_systems / code_system_versions
//   catalog_concepts        code, display (verbatim de la fuente)
//   concept_designations    preferida + sinónimos (inglés, verbatim)
//   concept_properties      procedencia por fila (fuente, id, versión, URL, fecha,
//                           SHA-256 de los archivos de entrada, licencia),
//                           definición de la fuente y propiedades del sistema
//   concept_relationships   is-a (SO, grupos HGNC, NCI vía MedGen) y part-of (gen → grupo)
//   concept_maps            cruces por código exacto que declara la fuente; sólo si el
//                           destino ya existe en la base (no se crea ninguno)
//   catalog_import_batches  un lote por sistema que insertó filas
//
// Streaming por sistema y por lotes (NCBI Gene pesa 260 MB de NDJSON): dos pasadas,
// 1.ª conceptos/designaciones/propiedades, 2.ª relaciones y mapas (necesitan que
// existan todos los conceptos). Ids deterministas + ON CONFLICT DO NOTHING:
// la 2.ª corrida inserta 0 filas.
//
//   node tools/terminology-import/genetics/load-genetics.mjs                      # dry-run (sin base)
//   DB_HOST=… DB_PORT=… DB_USER=… DB_NAME=… node …/load-genetics.mjs --apply      # carga
//   … --apply --systems so,hgvs-syntax
// =============================================================================

import 'dotenv/config';
import pg from 'pg';
import { createHash } from 'node:crypto';
import { createReadStream, existsSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { basename, join } from 'node:path';
import { OUT_DIR } from './lib/sources.mjs';
import { dbConfig, ensureCodeSystem, insertMany } from './lib/db.mjs';
import { CONCEPT, SYSTEM_ORDER, codeSystemPlan, conceptTuple, designationTuples, mapTuples, md5uuid, propertyTuples, relationshipTuples, versionLabel } from './lib/load-plan.mjs';

const CHUNK = 2000;

async function* readRows(path) {
  const rl = createInterface({ input: createReadStream(path), crlfDelay: Infinity });
  for await (const line of rl) if (line !== '') yield JSON.parse(line);
}

async function* chunks(path, size = CHUNK) {
  let buf = [];
  for await (const row of readRows(path)) {
    buf.push(row);
    if (buf.length === size) {
      yield buf;
      buf = [];
    }
  }
  if (buf.length) yield buf;
}

/** Lectura previa de un sistema: versiones, licencia, SHA-256 del NDJSON y conjunto de códigos. */
async function scan(path) {
  const h = createHash('sha256');
  const versions = new Set();
  const codes = new Set();
  let license = null;
  let rows = 0;
  const rl = createInterface({ input: createReadStream(path), crlfDelay: Infinity });
  for await (const line of rl) {
    if (line === '') continue;
    h.update(line + '\n');
    const r = JSON.parse(line);
    if (codes.has(r.code)) throw new Error(`${path}: código repetido ${r.code}`);
    codes.add(r.code);
    versions.add(r.version);
    license ??= r.license;
    rows++;
  }
  return { rows, versions: [...versions], codes, license, sha256: h.digest('hex') };
}

export function parseArgs(argv) {
  const args = argv.slice(2);
  if (args.includes('--dry-run') && args.includes('--apply')) throw new Error('Use --dry-run o --apply, no ambos.');
  return {
    apply: args.includes('--apply'),
    systems: args.includes('--systems') ? args[args.indexOf('--systems') + 1].split(',') : SYSTEM_ORDER,
    dir: args.includes('--dir') ? args[args.indexOf('--dir') + 1] : join(OUT_DIR, 'ndjson'),
  };
}

async function main() {
  const { apply, systems, dir } = parseArgs(process.argv);
  const t0 = Date.now();
  console.log(`=== Carga de genética a terminology.* ${apply ? '(APPLY explícito)' : '(DRY-RUN por defecto, sin base)'} ===`);
  const plans = [];
  for (const cs of SYSTEM_ORDER.filter((s) => systems.includes(s))) {
    const path = join(dir, `${cs}.ndjson`);
    if (!existsSync(path)) throw new Error(`Falta ${path}: corré build-genetics-corpus.mjs o unpack-data.mjs`);
    const info = await scan(path);
    plans.push({ cs, path, info, plan: codeSystemPlan(cs, { version: versionLabel(info.versions), license: info.license, checksum: info.sha256 }) });
    console.log(`[scan] ${cs}: ${info.rows} filas, versión «${versionLabel(info.versions)}», sha256 ${info.sha256.slice(0, 16)}…`);
  }
  const codesOf = (cs) => plans.find((p) => p.cs === cs)?.info.codes;

  const client = apply ? new pg.Client(dbConfig()) : null;
  await client?.connect();
  const result = [];
  try {
    if (client) {
      const { rows } = await client.query('SELECT id FROM terminology.catalog_concepts WHERE id = ANY($1::uuid[])', [Object.values(CONCEPT)]);
      if (rows.length !== Object.values(CONCEPT).length) throw new Error(`Faltan conceptos internos del backend (${Object.values(CONCEPT).length - rows.length} de ${Object.values(CONCEPT).length}): arrancá la API una vez para que siembre terminology.`);
    }
    // --- 1.ª pasada: conceptos, designaciones, propiedades
    for (const p of plans) {
      const r = { codeSystem: p.cs, rows: p.info.rows, startedAt: new Date(), concepts: 0, designations: 0, properties: 0, planned: { concepts: 0, designations: 0, properties: 0 } };
      p.result = r;
      if (client) {
        p.ids = await ensureCodeSystem(client, p.plan, CONCEPT.TERM_ACTIVE);
        r.codeSystemReused = p.ids.reusedCodeSystem;
        r.versionIsDefault = p.ids.isDefault;
      }
      for await (const rows of chunks(p.path)) {
        const concepts = rows.map((row) => conceptTuple(row, p.ids?.versionId ?? p.plan.version.id));
        const designations = rows.flatMap(designationTuples);
        const properties = rows.flatMap(propertyTuples);
        r.planned.concepts += concepts.length;
        r.planned.designations += designations.length;
        r.planned.properties += properties.length;
        if (!client) continue;
        r.concepts += await insertMany(client, 'catalog_concepts', ['id', 'code_system_version_id', 'code', 'display', 'definition', 'state_concept_id'], concepts, ['uuid', 'uuid', null, null, null, 'uuid']);
        r.designations += await insertMany(client, 'concept_designations', ['id', 'concept_id', 'language_concept_id', 'designation_type_concept_id', 'value', 'preferred'], designations, ['uuid', 'uuid', 'uuid', 'uuid', null, null]);
        r.properties += await insertMany(client, 'concept_properties', ['id', 'concept_id', 'property_code', 'data_type', 'value_json'], properties, ['uuid', 'uuid', null, 'terminology.technical_data_type', 'jsonb']);
      }
      console.log(`[load 1/2] ${p.cs}: ${JSON.stringify(client ? { concepts: r.concepts, designations: r.designations, properties: r.properties } : r.planned)}`);
    }
    // --- 2.ª pasada: relaciones y cruces
    const cache = new Map(); // `${system}\0${code}` → [concept ids] (destinos de OTROS importadores)
    const external = async (pairs) => {
      const bySystem = new Map();
      for (const [system, code] of pairs) {
        if (codesOf(system) || cache.has(`${system}\0${code}`)) continue;
        if (!bySystem.has(system)) bySystem.set(system, new Set());
        bySystem.get(system).add(code);
        cache.set(`${system}\0${code}`, []);
      }
      if (!client) return;
      for (const [system, codes] of bySystem) {
        const { rows } = await client.query(
          `SELECT c.code, c.id FROM terminology.catalog_concepts c
             JOIN terminology.code_system_versions v ON v.id = c.code_system_version_id
             JOIN terminology.code_systems cs ON cs.id = v.code_system_id
            WHERE cs.internal_code = $1 AND c.code = ANY($2::text[])`,
          [system, [...codes]],
        );
        for (const r of rows) cache.get(`${system}\0${r.code}`).push(r.id);
      }
    };
    const resolve = (system, code) => (codesOf(system) ? (codesOf(system).has(code) ? [md5uuid(`mantra:genetics:concept:${system}:${code}`)] : []) : cache.get(`${system}\0${code}`) ?? []);
    for (const p of plans) {
      const r = p.result;
      r.relationships = 0;
      r.maps = 0;
      r.planned.relationships = 0;
      r.planned.maps = 0;
      r.mapsByTarget = {};
      for await (const rows of chunks(p.path)) {
        await external(rows.flatMap((row) => row.maps.map((m) => [m.system, m.code])));
        const rels = rows.flatMap((row) => relationshipTuples(row, codesOf));
        const maps = rows.flatMap((row) => mapTuples(row, resolve));
        r.planned.relationships += rels.length;
        r.planned.maps += maps.length;
        for (const row of rows) for (const m of row.maps) if (resolve(m.system, m.code).length) r.mapsByTarget[m.system] = (r.mapsByTarget[m.system] ?? 0) + resolve(m.system, m.code).length;
        if (!client) continue;
        r.relationships += await insertMany(client, 'concept_relationships', ['id', 'source_concept_id', 'target_concept_id', 'relationship_type_concept_id', 'ordinal'], rels, ['uuid', 'uuid', 'uuid', 'uuid', null]);
        r.maps += await insertMany(client, 'concept_maps', ['id', 'source_concept_id', 'target_concept_id', 'equivalence_concept_id', 'context', 'version', 'state_concept_id'], maps, ['uuid', 'uuid', 'uuid', 'uuid', null, null, 'uuid']);
      }
      const total = client ? r.concepts + r.designations + r.properties + r.relationships + r.maps : 0;
      if (client && total > 0) {
        await client.query(
          `INSERT INTO terminology.catalog_import_batches (id, source_id, code_system_version_id, started_at, finished_at, total_read, total_inserted, total_errors, checksum, recorded_at)
           VALUES ($1::uuid, $2::uuid, $3::uuid, $4, now(), $5, $6, 0, $7, now())`,
          [md5uuid(`mantra:genetics:batch:${p.cs}:${r.startedAt.toISOString()}`), p.ids.sourceId, p.ids.versionId, r.startedAt, r.rows, total, p.info.sha256],
        );
      }
      console.log(`[load 2/2] ${p.cs}: ${JSON.stringify(client ? { relationships: r.relationships, maps: r.maps, mapsByTarget: r.mapsByTarget } : { relationships: r.planned.relationships, maps: r.planned.maps, mapsByTarget: r.mapsByTarget })}`);
      result.push({ codeSystem: p.cs, version: p.plan.version.version, rows: r.rows, ...(client ? { codeSystemReutilizado: r.codeSystemReused, versionPorDefecto: r.versionIsDefault, nuevas: { concepts: r.concepts, designations: r.designations, properties: r.properties, relationships: r.relationships, maps: r.maps } } : { planificadas: r.planned }), mapsByTarget: r.mapsByTarget });
    }
  } finally {
    await client?.end();
  }
  console.log(`\n=== RESUMEN ${apply ? '(filas NUEVAS; 0 en la segunda corrida = idempotente)' : '(plan; no se tocó ninguna base)'} ===`);
  console.log(JSON.stringify({ result, segundos: Math.round((Date.now() - t0) / 1000) }, null, 2));
}

if (basename(process.argv[1] ?? '') === 'load-genetics.mjs') {
  main().catch((err) => {
    console.error('ERROR FATAL en load-genetics:', err);
    process.exitCode = 1;
  });
}
