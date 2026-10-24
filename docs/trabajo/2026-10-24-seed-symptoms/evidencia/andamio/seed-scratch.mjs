// Andamio SOLO para el Postgres desechable de prueba: siembra los conceptos
// internos que en un entorno real siembra la API (TerminologySeedService /
// GlossarySeedService). No se commitea.
import pg from '/home/user/mantra-core-health-api/node_modules/pg/lib/index.js';
import { deterministicId } from '/home/user/mantra-core-health-api/tools/terminology-import/lib/glossary-es/common.mjs';
import { valueSetId, valueSetVersionId } from '/home/user/mantra-core-health-api/tools/terminology-import/lib/glossary-es/load-plan.mjs';

const c = new pg.Client({ host: '127.0.0.1', port: 5544, user: 'mantra', database: process.argv[2] ?? 'symptoms_scratch' });
await c.connect();
const src = deterministicId('seed:source:mantra-core');
const cs = deterministicId('seed:code-system:mantra-core');
const csv = deterministicId('seed:code-system-version:mantra-core:1.0.0');
await c.query(`INSERT INTO terminology.terminology_sources (id, code, name, created_at, updated_at) VALUES ($1,'MANTRA_CORE','Mantra core',now(),now()) ON CONFLICT DO NOTHING`, [src]);
await c.query(`INSERT INTO terminology.code_systems (id, source_id, internal_code, name, canonical_url, created_at, updated_at) VALUES ($1,$2,'mantra-core-internal','internal','https://mantracore.health/fhir/CodeSystem/internal',now(),now()) ON CONFLICT DO NOTHING`, [cs, src]);
await c.query(`INSERT INTO terminology.code_system_versions (id, code_system_id, version, created_at, updated_at) VALUES ($1,$2,'1.0.0',now(),now()) ON CONFLICT DO NOTHING`, [csv, cs]);
const keys = [
  ['terminology:state:active', 'TERM_ACTIVE'], ['terminology:language:es', 'ES'], ['terminology:language:en', 'EN'],
  ['terminology:designation-type:preferred', 'DESIG_PREFERRED'], ['terminology:designation-type:synonym', 'DESIG_SYNONYM'],
  ['terminology:relationship:is-a', 'IS_A'], ['terminology:relationship:symptom', 'REL_SYMPTOM'],
  ...(process.argv.includes('--with-excluded') ? [['terminology:relationship:symptom-excluded', 'REL_SYMPTOM_EXCLUDED']] : []),
];
for (const [k, code] of keys) await c.query(`INSERT INTO terminology.catalog_concepts (id, code_system_version_id, code, display, created_at, updated_at) VALUES ($1,$2,$3,$3,now(),now()) ON CONFLICT DO NOTHING`, [deterministicId(k), csv, code]);
for (const vs of ['glossary-all-terms', 'glossary-category-signs-symptoms']) {
  await c.query(`INSERT INTO terminology.value_sets (id, internal_code, name, canonical_url, created_at, updated_at) VALUES ($1,$2,$2,$3,now(),now()) ON CONFLICT DO NOTHING`, [valueSetId(vs), vs, `https://mantracore.health/fhir/ValueSet/${vs}`]);
  await c.query(`INSERT INTO terminology.value_set_versions (id, value_set_id, version, created_at, updated_at) VALUES ($1,$2,'1',now(),now()) ON CONFLICT DO NOTHING`, [valueSetVersionId(vs), valueSetId(vs)]);
}
console.log('andamio sembrado');
await c.end();
