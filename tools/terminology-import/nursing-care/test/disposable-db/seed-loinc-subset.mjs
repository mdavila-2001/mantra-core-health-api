// SÓLO para la base desechable: carga como code system `loinc` el subconjunto que baja `fetch-loinc-links.mjs`
// (los términos LOINC enlazados por los arquetipos), para demostrar que el cargador de enfermería resuelve los enlaces
// por código. No sustituye a `import-loinc.mjs` (109 325 términos): usa ids propios de prueba. Nunca contra una base real.
import pg from 'pg';
import { join } from 'node:path';
import { deterministicId, readNdjson } from '../../../lib/glossary-es/common.mjs';
import { NURSING_OUT } from '../../lib/paths.mjs';

const rows = readNdjson(join(NURSING_OUT, 'loinc-links.ndjson')).filter((r) => r.resolved);
const c = new pg.Client({ host: process.env.DB_HOST, port: Number(process.env.DB_PORT ?? 5432), user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME });
await c.connect();
const src = deterministicId('test:loinc-src');
const cs = deterministicId('test:loinc-cs');
const csv = deterministicId('test:loinc-csv');
await c.query(`INSERT INTO terminology.terminology_sources (id, code, name, created_at, updated_at) VALUES ($1,'TEST_LOINC_SUBSET','subconjunto de prueba',now(),now()) ON CONFLICT DO NOTHING`, [src]);
await c.query(`INSERT INTO terminology.code_systems (id, source_id, internal_code, name, canonical_url, created_at, updated_at) VALUES ($1,$2,'loinc','LOINC (subconjunto de prueba)','http://loinc.org',now(),now()) ON CONFLICT DO NOTHING`, [cs, src]);
await c.query(`INSERT INTO terminology.code_system_versions (id, code_system_id, version, created_at, updated_at) VALUES ($1,$2,'test-subset',now(),now()) ON CONFLICT DO NOTHING`, [csv, cs]);
let n = 0;
for (const r of rows) {
  const res = await c.query(`INSERT INTO terminology.catalog_concepts (id, code_system_version_id, code, display, created_at, updated_at) VALUES ($1,$2,$3,$4,now(),now()) ON CONFLICT DO NOTHING`, [deterministicId(`test:loinc:${r.loincNum}`), csv, r.loincNum, r.LONG_COMMON_NAME]);
  n += res.rowCount;
}
console.log('loinc concepts inserted', n, 'of', rows.length);
await c.end();
