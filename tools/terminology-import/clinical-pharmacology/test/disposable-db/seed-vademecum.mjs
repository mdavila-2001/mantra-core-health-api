// Prerrequisito SÓLO para una base desechable de prueba: el code system `vademecum` que en una base real
// siembra la API al arrancar, tomado del mismo dataset del repo
// (src/common/seed/data/vademecum/vademecum.dataset.json) con sus ids. Sólo fuente, code system, versión y
// conceptos: lo necesario para que el cargador resuelva los `concept_maps` ATC 5 → vademecum.
// Nunca correr contra una base real.
//
//   DB_HOST=… DB_PORT=… DB_USER=… DB_NAME=… node tools/terminology-import/clinical-pharmacology/test/disposable-db/seed-vademecum.mjs
import pg from 'pg';

import { VADEMECUM_DATASET_PATH } from '../../lib/liname.mjs';
import { readFileSync } from 'node:fs';

const d = JSON.parse(readFileSync(VADEMECUM_DATASET_PATH, 'utf8'));
const c = new pg.Client({ host: process.env.DB_HOST, port: Number(process.env.DB_PORT ?? 5432), user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME });
await c.connect();
try {
  await c.query('BEGIN');
  for (const s of d.sources) {
    await c.query(`INSERT INTO terminology.terminology_sources (id, code, name, owner, official_url, license, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,now(),now()) ON CONFLICT DO NOTHING`, [s.id, s.code, s.name, s.owner, s.official_url, s.license]);
  }
  for (const s of d.codeSystem) {
    await c.query(`INSERT INTO terminology.code_systems (id, source_id, internal_code, name, canonical_url, oid, case_sensitive, supports_composition, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,now(),now()) ON CONFLICT DO NOTHING`, [s.id, s.source_id, s.internal_code, s.name, s.canonical_url, s.oid, s.case_sensitive, s.supports_composition]);
  }
  for (const v of d.codeSystemVersion) {
    await c.query(`INSERT INTO terminology.code_system_versions (id, code_system_id, version, published_at, is_default, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,now(),now()) ON CONFLICT DO NOTHING`, [v.id, v.code_system_id, v.version, v.published_at, v.is_default]);
  }
  let n = 0;
  for (const k of d.concepts) {
    const r = await c.query(`INSERT INTO terminology.catalog_concepts (id, code_system_version_id, code, display, definition, abstract, selectable, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,now(),now()) ON CONFLICT DO NOTHING`, [k.id, k.code_system_version_id, k.code, k.display, k.definition, k.abstract, k.selectable]);
    n += r.rowCount;
  }
  await c.query('COMMIT');
  console.log('vademecum concepts', n);
} catch (e) {
  await c.query('ROLLBACK');
  throw e;
} finally {
  await c.end();
}
