// Prerrequisito SÓLO para una base desechable de prueba: los conceptos internos que en una base real
// siembra la API al arrancar (mismos ids deterministas que `src/common/constants/concepts.ts`).
//   DB_HOST=… DB_PORT=… DB_USER=… DB_NAME=… DISPOSABLE_DB=1 node …/seed-scaffold.mjs
import pg from 'pg';
import { deterministicId } from '../../../lib/glossary-es/common.mjs';

if (process.env.DISPOSABLE_DB !== '1' || !/_test$/.test(process.env.DB_NAME ?? '') || !(process.env.DB_HOST ?? '').match(/^(\/|localhost$|127\.0\.0\.1$)/)) {
  console.error('seed-scaffold.mjs se niega: exige DISPOSABLE_DB=1, DB_NAME terminado en _test y DB_HOST local.');
  process.exit(4);
}
const KEYS = [
  'terminology:state:active',
  'terminology:language:en',
  'terminology:designation-type:preferred',
  'terminology:designation-type:synonym',
  'terminology:relationship:is-a',
  'terminology:relationship:part-of',
  // Sólo para poder cargar, en la MISMA base desechable, el catálogo de enfermedades (diseases/load-catalog.mjs --from-snapshot)
  // y probar los cruces de MedGen hacia MONDO, MeSH, Orphanet y NCIt contra destinos reales:
  'terminology:state:draft',
  'terminology:state:deprecated',
  'terminology:language:es',
  'terminology:equivalence:equivalent',
  'terminology:equivalence:wider',
  'terminology:equivalence:narrower',
  'terminology:equivalence:inexact',
];
// --with-dictionaries: además, los conceptos internos que exige `dictionaries/load-dictionaries.mjs` (se carga en la misma base para
// probar que `hgnc` y `sequence-ontology` conviven como un solo code system con dos versiones).
if (process.argv.includes('--with-dictionaries')) {
  KEYS.push('terminology:language:la', 'terminology:relationship:develops-from', 'terminology:relationship:located-in', 'terminology:relationship:infectious-agent', 'terminology:relationship:transmitted-by');
}
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
console.log(JSON.stringify({ internalConcepts: KEYS.length }));
await c.end();
