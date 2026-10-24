// Andamio para la base de integración: agrega SÓLO los conceptos internos que
// faltan (los demás los sembró seed-internal.mjs de seed-diseases), colgados de
// la versión del code system interno que ya existe. No se commitea a la API.
import pg from '/home/user/mantra-core-health-api/node_modules/pg/lib/index.js';
import { deterministicId } from '/home/user/mantra-core-health-api/tools/terminology-import/lib/glossary-es/common.mjs';
import { valueSetId, valueSetVersionId } from '/home/user/mantra-core-health-api/tools/terminology-import/lib/glossary-es/load-plan.mjs';
const c = new pg.Client({ host: '127.0.0.1', port: 5544, user: 'mantra', database: process.argv[2] });
await c.connect();
const { rows: v } = await c.query(`SELECT v.id FROM terminology.code_system_versions v JOIN terminology.code_systems cs ON cs.id = v.code_system_id WHERE cs.internal_code = 'mantra-core-internal' LIMIT 1`);
const keys = [['terminology:state:active', 'TERM_ACTIVE'], ['terminology:language:es', 'ES'], ['terminology:language:en', 'EN'], ['terminology:designation-type:preferred', 'DESIG_PREFERRED'], ['terminology:designation-type:synonym', 'DESIG_SYNONYM'], ['terminology:relationship:is-a', 'IS_A'], ['terminology:relationship:symptom', 'REL_SYMPTOM'], ['terminology:relationship:symptom-excluded', 'REL_SYMPTOM_EXCLUDED']];
for (const [k, code] of keys) {
  const id = deterministicId(k);
  const { rowCount } = await c.query('SELECT 1 FROM terminology.catalog_concepts WHERE id = $1', [id]);
  if (rowCount) { console.log('ya estaba', code); continue; }
  await c.query(`INSERT INTO terminology.catalog_concepts (id, code_system_version_id, code, display, created_at, updated_at) VALUES ($1,$2,$3,$3,now(),now())`, [id, v[0].id, code]);
  console.log('agregado', code);
}
// Value sets del glosario que en un entorno real siembra GlossarySeedService.
for (const vs of ['glossary-all-terms', 'glossary-category-signs-symptoms']) {
  const r1 = await c.query(`INSERT INTO terminology.value_sets (id, internal_code, name, canonical_url, created_at, updated_at) VALUES ($1,$2,$2,$3,now(),now()) ON CONFLICT DO NOTHING`, [valueSetId(vs), vs, `https://mantracore.health/fhir/ValueSet/${vs}`]);
  const r2 = await c.query(`INSERT INTO terminology.value_set_versions (id, value_set_id, version, created_at, updated_at) VALUES ($1,$2,'1',now(),now()) ON CONFLICT DO NOTHING`, [valueSetVersionId(vs), valueSetId(vs)]);
  console.log(r1.rowCount + r2.rowCount ? 'agregado' : 'ya estaba', vs);
}
await c.end();
