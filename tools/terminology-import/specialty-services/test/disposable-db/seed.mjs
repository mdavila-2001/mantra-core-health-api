// SÓLO para la base desechable: lo que una base real recibe de la API al arrancar y del paquete del modelo.
//  - conceptos internos (estado, idioma, designación preferida, relación «especialidad»);
//  - `VS_MEDICAL_SPECIALTY` con las 63 especialidades de la foto del modelo (mismos ids);
//  - los conceptos del arancel boliviano (`VS_BO_MEDICAL_PROCEDURE`) que el corpus relaciona, con los ids y códigos de la API.
// Nunca correr contra una base real.
import pg from 'pg';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { deterministicId } from '../../../lib/glossary-es/common.mjs';
import { CONCEPT, RELATION_TYPE } from '../../../lib/glossary-es/load-plan.mjs';
import { CORPUS_PATH, REPO_DATA_DIR, readGzParts } from '../../lib/common.mjs';
import { loadModelSpecialties } from '../../lib/rules.mjs';
import { existsSync } from 'node:fs';

const c = new pg.Client({ host: process.env.DB_HOST, port: Number(process.env.DB_PORT ?? 5432), user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME });
await c.connect();
const ins = (sql, params) => c.query(sql, params);
const src = deterministicId('test:spec:src');
await ins(`INSERT INTO terminology.terminology_sources (id, code, name, created_at, updated_at) VALUES ($1,'TEST_INTERNAL','test',now(),now()) ON CONFLICT DO NOTHING`, [src]);
const mkSystem = async (key, internal, url) => {
  const cs = deterministicId(`test:spec:cs:${key}`);
  const csv = deterministicId(`test:spec:csv:${key}`);
  await ins(`INSERT INTO terminology.code_systems (id, source_id, internal_code, name, canonical_url, created_at, updated_at) VALUES ($1,$2,$3,$3,$4,now(),now()) ON CONFLICT DO NOTHING`, [cs, src, internal, url]);
  await ins(`INSERT INTO terminology.code_system_versions (id, code_system_id, version, created_at, updated_at) VALUES ($1,$2,'1',now(),now()) ON CONFLICT DO NOTHING`, [csv, cs]);
  return csv;
};
const concept = (id, csv, code, display) => ins(`INSERT INTO terminology.catalog_concepts (id, code_system_version_id, code, display, created_at, updated_at) VALUES ($1,$2,$3,$4,now(),now()) ON CONFLICT DO NOTHING`, [id, csv, code, display]);

const internal = await mkSystem('internal', 'mantra-core-internal', 'urn:test:internal');
for (const [id, code] of [[CONCEPT.TERM_ACTIVE, 'terminology:state:active'], [CONCEPT.LANG_ES, 'terminology:language:es'], [CONCEPT.DESIG_PREFERRED, 'terminology:designation-type:preferred'], [RELATION_TYPE.SPECIALTY, 'terminology:relationship:specialty']]) await concept(id, internal, code, code);

// VS_MEDICAL_SPECIALTY
const model = loadModelSpecialties();
const specCsv = await mkSystem('specialty', 'MEDICAL_SPECIALTY', 'urn:test:specialty');
const vsId = deterministicId('test:spec:vs');
const vsvId = deterministicId('test:spec:vsv');
await ins(`INSERT INTO terminology.value_sets (id, internal_code, name, canonical_url, state_concept_id, created_at, updated_at) VALUES ($1,'VS_MEDICAL_SPECIALTY','Especialidades médicas (foto del modelo)','urn:test:vs-specialty',$2,now(),now()) ON CONFLICT DO NOTHING`, [vsId, CONCEPT.TERM_ACTIVE]);
await ins(`INSERT INTO terminology.value_set_versions (id, value_set_id, version, is_default, state_concept_id, created_at, updated_at) VALUES ($1,$2,'1',true,$3,now(),now()) ON CONFLICT DO NOTHING`, [vsvId, vsId, CONCEPT.TERM_ACTIVE]);
for (const [i, s] of model.specialties.entries()) {
  await concept(s.conceptId, specCsv, s.code, s.display);
  await ins(`INSERT INTO terminology.value_set_members (id, value_set_version_id, concept_id, included, ordinal, created_at, updated_at) VALUES ($1,$2,$3,true,$4,now(),now()) ON CONFLICT DO NOTHING`, [deterministicId(`test:spec:vsm:${s.code}`), vsvId, s.conceptId, i]);
}

// Conceptos del arancel boliviano que el corpus relaciona
let records = [];
if (existsSync(CORPUS_PATH())) records = readFileSync(CORPUS_PATH(), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
else {
  const manifest = JSON.parse(readFileSync(join(REPO_DATA_DIR, 'MANIFEST.json'), 'utf8'));
  records = readGzParts(REPO_DATA_DIR, manifest.corpus).map((l) => JSON.parse(l));
}
const boCsv = await mkSystem('bo', 'VS_BO_MEDICAL_PROCEDURE', 'urn:test:bo');
let bo = 0;
for (const r of records.filter((x) => x.reuse)) { await concept(r.id, boCsv, r.code, r.display); bo += 1; }
console.log(JSON.stringify({ specialties: model.specialties.length, boConcepts: bo }));
await c.end();
