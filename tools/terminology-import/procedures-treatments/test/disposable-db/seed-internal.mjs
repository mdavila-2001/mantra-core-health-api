// SÓLO para una base desechable (nombre `desechable_*`): siembra los conceptos internos que en una
// base real crea la API al arrancar y que `lab-tests/load-lab-tests.mjs` exige (`assertPrerequisites`):
// estado activo, idioma es, tipos de designación y relaciones part-of / is-a.
// Nunca correr contra una base real.
import pg from 'pg';
import { deterministicId } from '../../../lib/glossary-es/common.mjs';
import { CONCEPT } from '../../../lib/glossary-es/load-plan.mjs';

if (!/^desechable_[a-z0-9_]+$/.test(process.env.DB_NAME ?? '')) throw new Error(`ABORTA: DB_NAME='${process.env.DB_NAME}' no empieza con 'desechable_'`);
const c = new pg.Client({ host: process.env.DB_HOST, port: Number(process.env.DB_PORT ?? 5432), user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME });
await c.connect();
const q = (sql, p) => c.query(sql, p);
const src = deterministicId('test:c3:src');
const cs = deterministicId('test:c3:cs');
const csv = deterministicId('test:c3:csv');
await q(`INSERT INTO terminology.terminology_sources (id, code, name, created_at, updated_at) VALUES ($1,'TEST_INTERNAL','test',now(),now()) ON CONFLICT DO NOTHING`, [src]);
await q(`INSERT INTO terminology.code_systems (id, source_id, internal_code, name, canonical_url, created_at, updated_at) VALUES ($1,$2,'mantra-core-internal','mantra-core-internal','urn:test:internal',now(),now()) ON CONFLICT DO NOTHING`, [cs, src]);
await q(`INSERT INTO terminology.code_system_versions (id, code_system_id, version, created_at, updated_at) VALUES ($1,$2,'1',now(),now()) ON CONFLICT DO NOTHING`, [csv, cs]);
const items = [
  [CONCEPT.TERM_ACTIVE, 'terminology:state:active'],
  [CONCEPT.LANG_ES, 'terminology:language:es'],
  [CONCEPT.DESIG_PREFERRED, 'terminology:designation-type:preferred'],
  [CONCEPT.DESIG_SYNONYM, 'terminology:designation-type:synonym'],
  [deterministicId('terminology:relationship:part-of'), 'terminology:relationship:part-of'],
  [deterministicId('terminology:relationship:is-a'), 'terminology:relationship:is-a'],
];
for (const [id, code] of items) await q(`INSERT INTO terminology.catalog_concepts (id, code_system_version_id, code, display, created_at, updated_at) VALUES ($1,$2,$3,$3,now(),now()) ON CONFLICT DO NOTHING`, [id, csv, code]);
console.log(JSON.stringify({ seeded: items.length }));
await c.end();
