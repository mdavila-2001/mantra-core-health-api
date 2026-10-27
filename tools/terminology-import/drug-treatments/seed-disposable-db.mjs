#!/usr/bin/env node
// =============================================================================
// SOLO PARA UN POSTGRES DESECHABLE (no tocar la base real del stack).
//
// Siembra lo mínimo que `load-drug-treatments.mjs` y `import-rxnorm-full.mjs` esperan
// encontrar y que en el producto siembra la API al arrancar:
//   - el concepto interno «estado activo» (CONCEPT.TERM_ACTIVE)
//   - la fuente RXNORM (la usa import-rxnorm-full.mjs y NO la crea)
// y, con las opciones, destinos PARCIALES para medir el enlace por código exacto:
//   --mesh    code system `mesh`    : los descriptores D de MeSH 2026 (código + encabezado principal),
//                                     de `cache/drug-treatments-http/mesh/concept-descriptor.tsv`. Sin árbol, sin SCR (C…).
//   --mondo   code system `mondo`   : los MONDO que aparecen como sujeto en mondo.sssom.tsv (código + etiqueta).
//   --atc     code system `atc-sample`: los códigos ATC de nivel 5 que publica RxClass (solo el código; el nombre
//                                     de la OMS no se guarda, `display` = código). NO es el `vademecum` del producto.
// Todo lo que carga es real pero PARCIAL: sirve para probar el mecanismo de enlace, no para medir cobertura contra
// los catálogos del producto.
//
// Uso (DB_HOST/DB_PORT/DB_USER/DB_NAME del entorno):
//   node tools/terminology-import/drug-treatments/seed-disposable-db.mjs [--mesh] [--mondo] [--atc]
// =============================================================================

import 'dotenv/config';
import pg from 'pg';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { cacheDir } from '../lib/glossary-es/common.mjs';
import { CONCEPT, md5uuid } from '../lib/glossary-es/load-plan.mjs';
import { CACHE } from './fetch-sources.mjs';
import { CROSSWALKS } from './lib/sources.mjs';
import { HTTP_CACHE } from './lib/http-files.mjs';
import { cloneDirName } from './lib/sources.mjs';

const args = new Set(process.argv.slice(2));
const config = {
  host: process.env.DB_HOST ?? '127.0.0.1',
  port: Number(process.env.DB_PORT ?? 55406),
  user: process.env.DB_USER ?? 'mantra',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME ?? 'c6',
};
if (!/^(127\.0\.0\.1|localhost)$/.test(config.host)) throw new Error('seed-disposable-db solo corre contra una base local desechable');

const id = (k) => md5uuid(`mantra:drug-treatments:seed-disposable:${k}`);

async function ensureSource(client, code, name, owner) {
  await client.query(
    `INSERT INTO terminology.terminology_sources (id, code, name, owner, created_at, updated_at, row_version) VALUES ($1::uuid, $2, $3, $4, now(), now(), 1) ON CONFLICT DO NOTHING`,
    [id(`source:${code}`), code, name, owner],
  );
  return (await client.query('SELECT id FROM terminology.terminology_sources WHERE code = $1', [code])).rows[0].id;
}

async function ensureCodeSystem(client, sourceId, internalCode, name, version) {
  await client.query(
    `INSERT INTO terminology.code_systems (id, source_id, internal_code, name, canonical_url, case_sensitive, supports_composition, created_at, updated_at, row_version)
     VALUES ($1::uuid, $2::uuid, $3, $4, $5, true, false, now(), now(), 1) ON CONFLICT DO NOTHING`,
    [id(`cs:${internalCode}`), sourceId, internalCode, name, `https://mantracore.health/fhir/CodeSystem/${internalCode}`],
  );
  const cs = (await client.query('SELECT id FROM terminology.code_systems WHERE internal_code = $1', [internalCode])).rows[0].id;
  await client.query(
    `INSERT INTO terminology.code_system_versions (id, code_system_id, version, published_at, is_default, created_at, updated_at, row_version)
     VALUES ($1::uuid, $2::uuid, $3, now(), true, now(), now(), 1) ON CONFLICT DO NOTHING`,
    [id(`csv:${internalCode}:${version}`), cs, version],
  );
  return (await client.query('SELECT id FROM terminology.code_system_versions WHERE code_system_id = $1 AND version = $2', [cs, version])).rows[0].id;
}

async function insertConcepts(client, versionId, internalCode, rows) {
  let inserted = 0;
  for (let i = 0; i < rows.length; i += 2000) {
    const chunk = rows.slice(i, i + 2000);
    const r = await client.query(
      `INSERT INTO terminology.catalog_concepts (id, code_system_version_id, code, display, abstract, selectable, state_concept_id, created_at, updated_at, row_version)
       SELECT md5('mantra:drug-treatments:seed-disposable:' || $1 || ':' || x.code)::uuid, $2::uuid, x.code, x.display, false, true, $3::uuid, now(), now(), 1
         FROM unnest($4::text[], $5::text[]) AS x(code, display) ON CONFLICT DO NOTHING`,
      [internalCode, versionId, CONCEPT.TERM_ACTIVE, chunk.map((x) => x[0]), chunk.map((x) => x[1])],
    );
    inserted += r.rowCount;
  }
  return inserted;
}

async function main() {
  const client = new pg.Client(config);
  await client.connect();
  const out = {};
  try {
    const internal = await ensureSource(client, 'MANTRA_INTERNAL', 'Conceptos internos (siembra mínima desechable)', 'Mantra Core Health');
    const internalVersion = await ensureCodeSystem(client, internal, 'mantra-internal', 'Conceptos internos', '1');
    await client.query(
      `INSERT INTO terminology.catalog_concepts (id, code_system_version_id, code, display, abstract, selectable, created_at, updated_at, row_version)
       VALUES ($1::uuid, $2::uuid, 'terminology:state:active', 'Activo', false, true, now(), now(), 1) ON CONFLICT DO NOTHING`,
      [CONCEPT.TERM_ACTIVE, internalVersion],
    );
    await ensureSource(client, 'RXNORM', 'RxNorm (NLM)', 'U.S. National Library of Medicine');
    out.internal = 'ok';

    if (args.has('--mesh')) {
      const text = readFileSync(join(HTTP_CACHE, CROSSWALKS['mesh-concepts'].files.concepts), 'utf8').split('\n').slice(1).filter(Boolean);
      const byDescriptor = new Map();
      for (const l of text) {
        const [, d, , name] = l.split('\t');
        if (name && !byDescriptor.has(d)) byDescriptor.set(d, name);
      }
      const src = await ensureSource(client, 'NLM_MESH_PARTIAL', 'MeSH 2026 — descriptores (parcial: sin árbol ni SCR)', 'U.S. National Library of Medicine');
      const v = await ensureCodeSystem(client, src, 'mesh', 'MeSH 2026 (descriptores, parcial)', '2026');
      out.mesh = await insertConcepts(client, v, 'mesh', [...byDescriptor].sort());
    }
    if (args.has('--mondo')) {
      const path = join(CACHE, cloneDirName('mondo'), 'src/ontology/mappings/mondo.sssom.tsv');
      const labels = new Map();
      let head = null;
      for (const line of readFileSync(path, 'utf8').split('\n')) {
        if (!line || line.startsWith('#')) continue;
        const c = line.split('\t');
        if (!head) {
          head = Object.fromEntries(c.map((x, i) => [x, i]));
          continue;
        }
        const s = c[head.subject_id];
        if (s.startsWith('MONDO:') && !labels.has(s)) labels.set(s, c[head.subject_label] || s);
      }
      const src = await ensureSource(client, 'MONARCH_MONDO_PARTIAL', 'MONDO (parcial: los MONDO del SSSOM publicado)', 'Monarch Initiative');
      const v = await ensureCodeSystem(client, src, 'mondo', 'MONDO (parcial)', 'a645ab57');
      out.mondo = await insertConcepts(client, v, 'mondo', [...labels].map(([k, n]) => [k.slice('MONDO:'.length), n]).sort());
    }
    if (args.has('--atc')) {
      const rows = readFileSync(join(HTTP_CACHE, CROSSWALKS['rxclass-atc'].files.atc), 'utf8').split('\n').slice(1).filter(Boolean).map((l) => l.split('\t')[2]);
      const codes = [...new Set(rows)].sort().map((c) => [c, c]);
      const src = await ensureSource(client, 'ATC_SAMPLE', 'Muestra de códigos ATC nivel 5 (solo código; NO es el vademecum)', 'Mantra Core Health (códigos de RxClass)');
      const v = await ensureCodeSystem(client, src, 'atc-sample', 'ATC nivel 5 — muestra de códigos', 'rxclass-2026-10-27');
      out.atc = await insertConcepts(client, v, 'atc-sample', codes);
    }
  } finally {
    await client.end();
  }
  console.log(JSON.stringify({ inserted: out }));
}

main().catch((err) => {
  console.error('ERROR FATAL en seed-disposable-db:', err);
  process.exitCode = 1;
});
