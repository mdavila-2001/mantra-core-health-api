// Prerrequisito SÓLO para una base desechable de prueba: lo que en una base real
// pone la API al arrancar y el sembrador de seeds del repo del modelo.
//   1. Conceptos internos de la API (mismos ids deterministas que concepts.ts).
//      REL_SYMPTOM_EXCLUDED sólo con --with-excluded: `concepts.ts` todavía no
//      lo declara (propuesta en docs/seed-research/symptoms.md).
//   2. Los miembros de vs_evidence_tier y vs_relationship_frequency, COPIADOS de
//      los seeds reales del modelo (seedsGenerales/modules/03_terminology.seeds.json),
//      con sus ids reales. No se inventa ninguno.
//   3. (DOBLE, regla 65) con --glossary-double: fichas `wikidata-sintoma` mínimas
//      (código = QID) que el glosario crea desde Wikidata P780. El corpus real del
//      glosario no está en git; el contrato que el cruce usa es (code system
//      `wikidata-sintoma`, code = QID).
//
//   DB_HOST=… DB_PORT=… DB_USER=… DB_NAME=… MODEL_REPO=… node …/seed-scaffold.mjs [--with-excluded] [--glossary-double Q1,Q2]
import pg from 'pg';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { deterministicId } from '../../../lib/glossary-es/common.mjs';

const args = process.argv.slice(2);
const KEYS = [
  'terminology:state:active',
  'terminology:state:draft',
  'terminology:state:deprecated',
  'terminology:language:es',
  'terminology:language:en',
  'terminology:designation-type:preferred',
  'terminology:designation-type:synonym',
  'terminology:relationship:is-a',
  'terminology:relationship:symptom',
  ...(args.includes('--with-excluded') ? ['terminology:relationship:symptom-excluded'] : []),
  'terminology:equivalence:equivalent',
  'terminology:equivalence:wider',
  'terminology:equivalence:narrower',
  'terminology:equivalence:inexact',
];
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

// --- value sets de evidencia, de los seeds reales del modelo ---
const seedsPath = join(process.env.MODEL_REPO ?? '/home/user/mantra-core-health-model', 'seedsGenerales/modules/03_terminology.seeds.json');
const boot = JSON.parse(readFileSync(seedsPath, 'utf8')).boot.records;
const WANT = ['1.0.0-vs_evidence_tier', '1.0.0-vs_relationship_frequency'];
const versions = boot.code_system_versions.filter((v) => WANT.includes(v.version));
if (versions.length !== WANT.length) throw new Error(`Los seeds del modelo no traen las versiones ${WANT.join(', ')}`);
const codeSystem = boot.code_systems.find((x) => x.id === versions[0].code_system_id);
const source = boot.terminology_sources.find((x) => x.id === codeSystem.source_id);
await c.query(`INSERT INTO terminology.terminology_sources (id, code, name, created_at, updated_at) VALUES ($1,$2,$3,now(),now()) ON CONFLICT DO NOTHING`, [source.id, source.code, source.name]);
await c.query(`INSERT INTO terminology.code_systems (id, source_id, internal_code, name, canonical_url, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,now(),now()) ON CONFLICT DO NOTHING`, [codeSystem.id, source.id, codeSystem.internal_code, codeSystem.name, codeSystem.canonical_url]);
let nConcepts = 0;
for (const v of versions) {
  await c.query(`INSERT INTO terminology.code_system_versions (id, code_system_id, version, created_at, updated_at) VALUES ($1,$2,$3,now(),now()) ON CONFLICT DO NOTHING`, [v.id, v.code_system_id, v.version]);
  for (const k of boot.catalog_concepts.filter((x) => x.code_system_version_id === v.id)) {
    await c.query(`INSERT INTO terminology.catalog_concepts (id, code_system_version_id, code, display, created_at, updated_at) VALUES ($1,$2,$3,$4,now(),now()) ON CONFLICT DO NOTHING`, [k.id, v.id, k.code, k.display]);
    nConcepts++;
  }
}

// --- doble del glosario (opcional) ---
let doubles = 0;
const gl = args.includes('--glossary-double') ? args[args.indexOf('--glossary-double') + 1].split(',') : [];
if (gl.length) {
  const gsrc = deterministicId('test:glossary-src');
  const gcs = deterministicId('test:glossary-cs');
  const gcsv = deterministicId('test:glossary-csv');
  await c.query(`INSERT INTO terminology.terminology_sources (id, code, name, created_at, updated_at) VALUES ($1,'TEST_GLOSSARY_DOUBLE','DOBLE del glosario (prueba)',now(),now()) ON CONFLICT DO NOTHING`, [gsrc]);
  await c.query(`INSERT INTO terminology.code_systems (id, source_id, internal_code, name, canonical_url, created_at, updated_at) VALUES ($1,$2,'wikidata-sintoma','DOBLE de wikidata-sintoma (prueba)','https://mantracore.health/fhir/CodeSystem/wikidata-sintoma',now(),now()) ON CONFLICT DO NOTHING`, [gcs, gsrc]);
  await c.query(`INSERT INTO terminology.code_system_versions (id, code_system_id, version, created_at, updated_at) VALUES ($1,$2,'doble',now(),now()) ON CONFLICT DO NOTHING`, [gcsv, gcs]);
  for (const q of gl) {
    await c.query(`INSERT INTO terminology.catalog_concepts (id, code_system_version_id, code, display, created_at, updated_at) VALUES ($1,$2,$3,$3,now(),now()) ON CONFLICT DO NOTHING`, [deterministicId(`test:glossary:${q}`), gcsv, q]);
    doubles++;
  }
}
console.log(JSON.stringify({ internalConcepts: KEYS.length, evidenceValueSetConcepts: nConcepts, glossaryDoubles: doubles }));
await c.end();
