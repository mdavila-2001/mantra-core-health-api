// Andamio SOLO para la base desechable: simula lo que cargará la sesión hermana
// seed-diseases, con los MONDO reales de mondo.obo (code = «MONDO:nnnnnnn»).
// Sirve para medir la resolución por código del cargador de relaciones. No se commitea.
import pg from '/home/user/mantra-core-health-api/node_modules/pg/lib/index.js';
import { readObo } from '/home/user/mantra-core-health-api/tools/terminology-import/symptoms/lib/obo.mjs';
import { md5uuid } from '/home/user/mantra-core-health-api/tools/terminology-import/lib/glossary-es/load-plan.mjs';

const c = new pg.Client({ host: '127.0.0.1', port: 5544, user: 'mantra', database: 'symptoms_scratch' });
await c.connect();
const terms = [];
await readObo('/home/user/glossary-data-build/symptoms-sources/mondo/mondo.obo', (t) => { if (!t.obsolete && t.id.startsWith('MONDO:')) terms.push(t); });
const src = md5uuid('scratch:mondo:src'); const cs = md5uuid('scratch:mondo:cs'); const v = md5uuid('scratch:mondo:v');
await c.query(`INSERT INTO terminology.terminology_sources (id, code, name, created_at, updated_at) VALUES ($1,'SCRATCH_MONDO','scratch',now(),now()) ON CONFLICT DO NOTHING`, [src]);
await c.query(`INSERT INTO terminology.code_systems (id, source_id, internal_code, name, canonical_url, created_at, updated_at) VALUES ($1,$2,'mondo','Mondo (andamio)','http://purl.obolibrary.org/obo/mondo.owl',now(),now()) ON CONFLICT DO NOTHING`, [cs, src]);
await c.query(`INSERT INTO terminology.code_system_versions (id, code_system_id, version, is_default, created_at, updated_at) VALUES ($1,$2,'scratch',true,now(),now()) ON CONFLICT DO NOTHING`, [v, cs]);
for (let i = 0; i < terms.length; i += 1000) {
  const chunk = terms.slice(i, i + 1000);
  const params = []; const vals = chunk.map((t) => { params.push(md5uuid(`scratch:mondo:${t.id}`), v, t.id, t.name); const n = params.length; return `($${n - 3},$${n - 2},$${n - 1},$${n},now(),now())`; });
  await c.query(`INSERT INTO terminology.catalog_concepts (id, code_system_version_id, code, display, created_at, updated_at) VALUES ${vals.join(',')} ON CONFLICT DO NOTHING`, params);
}
console.log('mondo andamio', terms.length);
await c.end();
