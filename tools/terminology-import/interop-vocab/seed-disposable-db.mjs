#!/usr/bin/env node
// =============================================================================
// SOLO PARA UN POSTGRES DESECHABLE (no tocar la base real del stack).
//
// Siembra los conceptos internos que `load-interop-vocab.mjs` exige y que en el producto siembra la API al arrancar
// (ids = deterministicId de `src/common/constants/concepts.ts`): estados, idiomas EN/ES, tipos de designación,
// relaciones is-a / part-of, tipo de contenido «complete» y las cinco equivalencias de ConceptMap.
// Se niega a correr contra un host que no sea local.
//
//   DB_HOST=127.0.0.1 DB_PORT=55451 DB_USER=mantra DB_NAME=c11 node tools/terminology-import/interop-vocab/seed-disposable-db.mjs
// =============================================================================

import 'dotenv/config';
import pg from 'pg';
import { deterministicId } from '../lib/glossary-es/common.mjs';
import { md5uuid } from './lib/model.mjs';

const config = {
  host: process.env.DB_HOST ?? '127.0.0.1',
  port: Number(process.env.DB_PORT ?? 55451),
  user: process.env.DB_USER ?? 'mantra',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME ?? 'c11',
};
if (!/^(127\.0\.0\.1|localhost)$/.test(config.host)) throw new Error('seed-disposable-db sólo corre contra una base local desechable');

const KEYS = [
  ['terminology:state:active', 'Active'],
  ['terminology:state:draft', 'Draft'],
  ['terminology:state:retired', 'Retired'],
  ['terminology:state:deprecated', 'Deprecated'],
  ['terminology:language:en', 'English'],
  ['terminology:language:es', 'Spanish'],
  ['terminology:designation-type:preferred', 'Preferred designation'],
  ['terminology:designation-type:synonym', 'Synonym'],
  ['terminology:relationship:is-a', 'Is a'],
  ['terminology:relationship:part-of', 'Part of'],
  ['terminology:content-type:complete', 'Complete'],
  ['terminology:equivalence:equivalent', 'Equivalent'],
  ['terminology:equivalence:wider', 'Wider'],
  ['terminology:equivalence:narrower', 'Narrower'],
  ['terminology:equivalence:inexact', 'Inexact'],
  ['terminology:equivalence:unmatched', 'Unmatched'],
];

const client = new pg.Client(config);
await client.connect();
try {
  await client.query('BEGIN');
  await client.query(
    `INSERT INTO terminology.terminology_sources (id, code, name, owner, created_at, updated_at, row_version) VALUES ($1::uuid, 'MANTRA_INTERNAL', 'Conceptos internos (siembra mínima desechable)', 'Mantra Core Health', now(), now(), 1) ON CONFLICT DO NOTHING`,
    [md5uuid('mantra:interop-vocab:seed-disposable:source')],
  );
  const src = (await client.query(`SELECT id FROM terminology.terminology_sources WHERE code = 'MANTRA_INTERNAL'`)).rows[0].id;
  await client.query(
    `INSERT INTO terminology.code_systems (id, source_id, internal_code, name, canonical_url, case_sensitive, supports_composition, created_at, updated_at, row_version)
     VALUES ($1::uuid, $2::uuid, 'mantra-internal', 'Conceptos internos', 'https://mantracore.health/fhir/CodeSystem/mantra-internal', true, false, now(), now(), 1) ON CONFLICT DO NOTHING`,
    [md5uuid('mantra:interop-vocab:seed-disposable:cs'), src],
  );
  const cs = (await client.query(`SELECT id FROM terminology.code_systems WHERE internal_code = 'mantra-internal'`)).rows[0].id;
  await client.query(
    `INSERT INTO terminology.code_system_versions (id, code_system_id, version, is_default, created_at, updated_at, row_version) VALUES ($1::uuid, $2::uuid, '1', true, now(), now(), 1) ON CONFLICT DO NOTHING`,
    [md5uuid('mantra:interop-vocab:seed-disposable:csv'), cs],
  );
  const csv = (await client.query(`SELECT id FROM terminology.code_system_versions WHERE code_system_id = $1 AND version = '1'`, [cs])).rows[0].id;
  let n = 0;
  for (const [key, display] of KEYS) {
    const r = await client.query(
      `INSERT INTO terminology.catalog_concepts (id, code_system_version_id, code, display, abstract, selectable, created_at, updated_at, row_version) VALUES ($1::uuid, $2::uuid, $3, $4, false, true, now(), now(), 1) ON CONFLICT DO NOTHING`,
      [deterministicId(key), csv, key, display],
    );
    n += r.rowCount;
  }
  await client.query('COMMIT');
  console.log(`Siembra mínima lista: ${n} conceptos internos nuevos de ${KEYS.length}`);
} catch (err) {
  await client.query('ROLLBACK').catch(() => {});
  throw err;
} finally {
  await client.end();
}
