// Andamio SOLO para la base desechable: imita el formato de #688 (omim/orphanet/decipher, code sin prefijo).
import pg from '/home/user/mantra-core-health-api/node_modules/pg/lib/index.js';
import { readNdjson } from '/home/user/mantra-core-health-api/tools/terminology-import/lib/glossary-es/common.mjs';
import { md5uuid } from '/home/user/mantra-core-health-api/tools/terminology-import/lib/glossary-es/load-plan.mjs';
const c = new pg.Client({ host: '127.0.0.1', port: 5544, user: 'mantra', database: 'symptoms_scratch' }); await c.connect();
const ids = { OMIM: new Set(), ORPHA: new Set(), DECIPHER: new Set() };
for (const r of readNdjson('/home/user/glossary-data-build/symptoms/ndjson/relations-hpoa.ndjson')) ids[r.disease.prefix]?.add(r.disease.id);
const ic = { OMIM: 'omim', ORPHA: 'orphanet', DECIPHER: 'decipher' };
for (const [p, set] of Object.entries(ids)) {
  const src = md5uuid(`scratch:${p}:src`), cs = md5uuid(`scratch:${p}:cs`), v = md5uuid(`scratch:${p}:v`);
  await c.query(`INSERT INTO terminology.terminology_sources (id, code, name, created_at, updated_at) VALUES ($1,$2,'scratch',now(),now()) ON CONFLICT DO NOTHING`, [src, `SCRATCH_${p}`]);
  await c.query(`INSERT INTO terminology.code_systems (id, source_id, internal_code, name, canonical_url, created_at, updated_at) VALUES ($1,$2,$3,$3,$4,now(),now()) ON CONFLICT DO NOTHING`, [cs, src, ic[p], `https://mantracore.health/fhir/CodeSystem/${ic[p]}`]);
  await c.query(`INSERT INTO terminology.code_system_versions (id, code_system_id, version, is_default, created_at, updated_at) VALUES ($1,$2,'scratch',true,now(),now()) ON CONFLICT DO NOTHING`, [v, cs]);
  const list = [...set];
  for (let i = 0; i < list.length; i += 1000) {
    const params = []; const vals = list.slice(i, i + 1000).map((code) => { params.push(md5uuid(`scratch:${p}:${code}`), v, code); const n = params.length; return `($${n - 2},$${n - 1},$${n},$${n},now(),now())`; });
    await c.query(`INSERT INTO terminology.catalog_concepts (id, code_system_version_id, code, display, created_at, updated_at) VALUES ${vals.join(',')} ON CONFLICT DO NOTHING`, params);
  }
  console.log(ic[p], list.length);
}
await c.end();
