// Prerrequisito SÓLO para una base desechable de prueba: los conceptos internos
// que en una base real siembra la API al arrancar (`seed:boot`), con los mismos
// ids deterministas, los que usa load-dictionaries.mjs (idiomas, tipos de
// designación, equivalencia y los seis tipos de relación). Nunca correr contra
// una base real.
//   DB_HOST=… DB_PORT=… DB_USER=… DB_NAME=… node tools/terminology-import/dictionaries/test/disposable-db/seed-internal.mjs
import pg from 'pg';
import { deterministicId } from '../../../lib/glossary-es/common.mjs';
import { CONCEPT, RELATION_TYPE } from '../../lib/load-plan.mjs';

const KEYS = [
  'terminology:state:active', 'terminology:language:en', 'terminology:language:es', 'terminology:language:la',
  'terminology:designation-type:preferred', 'terminology:designation-type:synonym', 'terminology:equivalence:equivalent',
  'terminology:relationship:is-a', 'terminology:relationship:part-of', 'terminology:relationship:develops-from',
  'terminology:relationship:located-in', 'terminology:relationship:infectious-agent', 'terminology:relationship:transmitted-by',
];
const expected = new Set([...Object.values(CONCEPT), ...Object.values(RELATION_TYPE)]);
const seeded = new Set(KEYS.map(deterministicId));
for (const id of expected) if (!seeded.has(id)) throw new Error(`El cargador usa un concepto interno (${id}) que este seed no siembra`);

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
