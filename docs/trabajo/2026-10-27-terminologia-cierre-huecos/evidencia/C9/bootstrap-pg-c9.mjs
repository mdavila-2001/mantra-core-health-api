// Bootstrap de la base DESECHABLE del carril C9 (no es parte del repo de producción).
// Reproduce lo mínimo que siembra la API al arrancar (GlossarySeedService + concepts.ts) y que
// `load-glossary-es.mjs` exige como prerrequisito: value sets glosario-* con su versión y los
// conceptos internos (estado activo, idioma ES, tipos de designación, tipos de relación).
// Los ids salen de las MISMAS funciones del importador (deterministicId); nombres/códigos de la
// taxonomía salen de lib/glossary-es/taxonomy.mjs (espejo de glossary-taxonomy.ts, 12+21).
import pg from 'pg';
import { CATEGORY_KEYS, CATEGORY_NAMES, TAG_NAMES } from '../../../../../tools/terminology-import/lib/glossary-es/taxonomy.mjs';
import { CONCEPT, RELATION_TYPE, md5uuid, valueSetId, valueSetVersionId } from '../../../../../tools/terminology-import/lib/glossary-es/load-plan.mjs';

const c = new pg.Client({ host: '127.0.0.1', port: 55409, user: 'postgres', database: process.env.BOOT_DB ?? 'c9' });
await c.connect();
const now = 'now()';
const src = md5uuid('c9:bootstrap:source'), cs = md5uuid('c9:bootstrap:cs'), csv = md5uuid('c9:bootstrap:csv');
await c.query(`INSERT INTO terminology.terminology_sources (id,code,name,created_at,updated_at,row_version) VALUES ($1,'MANTRA_CORE_BOOTSTRAP','bootstrap C9 (desechable)',now(),now(),1) ON CONFLICT DO NOTHING`, [src]);
await c.query(`INSERT INTO terminology.code_systems (id,source_id,internal_code,name,canonical_url,created_at,updated_at,row_version) VALUES ($1,$2,'mantra-core','bootstrap','https://mantracore.health/fhir/CodeSystem/mantra-core',now(),now(),1) ON CONFLICT DO NOTHING`, [cs, src]);
await c.query(`INSERT INTO terminology.code_system_versions (id,code_system_id,version,is_default,created_at,updated_at,row_version) VALUES ($1,$2,'1',true,now(),now(),1) ON CONFLICT DO NOTHING`, [csv, cs]);
const concepts = { ...CONCEPT, ...RELATION_TYPE };
for (const [k, id] of Object.entries(concepts)) {
  await c.query(`INSERT INTO terminology.catalog_concepts (id,code_system_version_id,code,display,created_at,updated_at,row_version) VALUES ($1,$2,$3,$3,now(),now(),1) ON CONFLICT DO NOTHING`, [id, csv, k]);
}
const entries = [
  ['glossary-all-terms', 'Glosario médico — todos los términos'],
  ...CATEGORY_KEYS.map((k) => [`glossary-category-${k}`, CATEGORY_NAMES[k]]),
  ...Object.entries(TAG_NAMES).map(([k, n]) => [`glossary-tag-${k}`, n]),
];
for (const [code, name] of entries) {
  await c.query(`INSERT INTO terminology.value_sets (id,internal_code,name,canonical_url,state_concept_id,created_at,updated_at,row_version) VALUES ($1,$2,$3,$4,$5,now(),now(),1) ON CONFLICT DO NOTHING`, [valueSetId(code), code, name, `https://mantracore.health/fhir/ValueSet/${code}`, CONCEPT.TERM_ACTIVE]);
  await c.query(`INSERT INTO terminology.value_set_versions (id,value_set_id,version,valid_from,is_default,state_concept_id,created_at,updated_at,row_version) VALUES ($1,$2,'1',now(),true,$3,now(),now(),1) ON CONFLICT DO NOTHING`, [valueSetVersionId(code), valueSetId(code), CONCEPT.TERM_ACTIVE]);
}
const { rows } = await c.query('select (select count(*) from terminology.value_sets) vs, (select count(*) from terminology.catalog_concepts) cc');
console.log('bootstrap listo', JSON.stringify(rows[0]));
await c.end();
