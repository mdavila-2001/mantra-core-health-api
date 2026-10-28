// Bootstrap de la base DESECHABLE del carril C10 (Postgres 16 propio, puerto 55410; no es el stack real).
// Reproduce lo mínimo que siembra la API al arrancar y que `load-taxonomy.mjs` exige como
// prerrequisito (assertPrerequisites): los conceptos internos de estado, idioma, tipo de
// designación y relación is-a. Los ids salen de las MISMAS funciones del importador.
import pg from '../../../../../tools/terminology-import/diagnostic-devices/node_modules/pg/lib/index.js';
import { INTERNAL } from '../../../../../tools/terminology-import/diagnostic-devices/master/lib/load-plan.mjs';
import { md5uuid } from '../../../../../tools/terminology-import/lib/glossary-es/load-plan.mjs';

const c = new pg.Client({ host: '127.0.0.1', port: 55410, user: 'postgres', database: 'c10' });
await c.connect();
const src = md5uuid('c10:bootstrap:source'), cs = md5uuid('c10:bootstrap:cs'), csv = md5uuid('c10:bootstrap:csv');
await c.query(`INSERT INTO terminology.terminology_sources (id,code,name,created_at,updated_at,row_version) VALUES ($1,'MANTRA_CORE_BOOTSTRAP','bootstrap C10 (desechable)',now(),now(),1) ON CONFLICT DO NOTHING`, [src]);
await c.query(`INSERT INTO terminology.code_systems (id,source_id,internal_code,name,canonical_url,created_at,updated_at,row_version) VALUES ($1,$2,'mantra-core','bootstrap','https://mantracore.health/fhir/CodeSystem/mantra-core',now(),now(),1) ON CONFLICT DO NOTHING`, [cs, src]);
await c.query(`INSERT INTO terminology.code_system_versions (id,code_system_id,version,is_default,created_at,updated_at,row_version) VALUES ($1,$2,'1',true,now(),now(),1) ON CONFLICT DO NOTHING`, [csv, cs]);
for (const [k, id] of Object.entries(INTERNAL))
  await c.query(`INSERT INTO terminology.catalog_concepts (id,code_system_version_id,code,display,created_at,updated_at,row_version) VALUES ($1,$2,$3,$3,now(),now(),1) ON CONFLICT DO NOTHING`, [id, csv, k]);
const { rows } = await c.query('select count(*) cc from terminology.catalog_concepts');
console.log('bootstrap listo', JSON.stringify(rows[0]));
await c.end();
