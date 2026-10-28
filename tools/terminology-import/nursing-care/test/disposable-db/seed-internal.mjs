// Prerrequisito SÓLO para una base desechable de prueba: los conceptos internos que una base real
// recibe de la API al arrancar (`seed:boot`), con los mismos ids deterministas. Nunca correr contra una base real.
//   DB_HOST=… DB_PORT=… DB_USER=… DB_NAME=… node tools/terminology-import/nursing-care/test/disposable-db/seed-internal.mjs
import pg from 'pg';
import { deterministicId } from '../../../lib/glossary-es/common.mjs';

const KEYS = [
  'terminology:state:active', 'terminology:state:draft', 'terminology:state:deprecated',
  'terminology:language:es', 'terminology:language:en',
  'terminology:designation-type:preferred', 'terminology:designation-type:synonym',
  'terminology:relationship:is-a', 'terminology:relationship:part-of',
  'terminology:equivalence:equivalent', 'terminology:equivalence:wider', 'terminology:equivalence:narrower', 'terminology:equivalence:inexact',
];
if (!/^desechable_[a-z0-9_]+$/.test(process.env.DB_NAME ?? '')) throw new Error(`ABORTA: DB_NAME='${process.env.DB_NAME}' no empieza con 'desechable_': estos scripts sólo corren contra una base desechable`);
const c = new pg.Client({ host: process.env.DB_HOST, port: Number(process.env.DB_PORT ?? 5432), user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME });
await c.connect();
const src = deterministicId('test:src');
const cs = deterministicId('test:cs');
const csv = deterministicId('test:csv');
await c.query(`INSERT INTO terminology.terminology_sources (id, code, name, created_at, updated_at) VALUES ($1,'TEST_INTERNAL','test',now(),now()) ON CONFLICT DO NOTHING`, [src]);
await c.query(`INSERT INTO terminology.code_systems (id, source_id, internal_code, name, canonical_url, created_at, updated_at) VALUES ($1,$2,'mantra-core-internal','internal','urn:test:internal',now(),now()) ON CONFLICT DO NOTHING`, [cs, src]);
await c.query(`INSERT INTO terminology.code_system_versions (id, code_system_id, version, created_at, updated_at) VALUES ($1,$2,'1',now(),now()) ON CONFLICT DO NOTHING`, [csv, cs]);
for (const k of KEYS) {
  await c.query(`INSERT INTO terminology.catalog_concepts (id, code_system_version_id, code, display, created_at, updated_at) VALUES ($1,$2,$3,$3,now(),now()) ON CONFLICT DO NOTHING`, [deterministicId(k), csv, k]);
}
console.log('ok', KEYS.length);
await c.end();
