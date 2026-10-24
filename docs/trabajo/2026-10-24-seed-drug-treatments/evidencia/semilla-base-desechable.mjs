// Semilla mínima para la base desechable de prueba (NO se versiona):
// el concepto «estado activo» que exige el cargador y dos code systems de
// destino con códigos reales tomados del propio NDJSON (RxCUI e ICD-10-CM),
// para probar el enlace por código exacto.
import { CONCEPT } from '/home/user/mantra-core-health-api/tools/terminology-import/lib/glossary-es/load-plan.mjs';
import { ndjsonPath, readNdjson } from '/home/user/mantra-core-health-api/tools/terminology-import/lib/glossary-es/common.mjs';

const rows = readNdjson(ndjsonPath('drug-treatments'));
const rx = new Set();
const icd = new Set();
for (const a of rows) {
  for (const c of [...a.drug.codes, ...a.crosswalk.drug]) if (c.system === 'RXCUI' && rx.size < 300) rx.add(c.code);
  for (const c of [...a.condition.codes, ...a.crosswalk.condition]) if (c.system === 'ICD10CM' && icd.size < 300) icd.add(c.code);
}
const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
const out = ['BEGIN;'];
out.push(`INSERT INTO terminology.terminology_sources (id, code, name, created_at, updated_at) VALUES ('00000000-0000-0000-0000-0000000000a1','TEST_INTERNAL','prueba',now(),now());`);
const cs = (n, ic) => {
  out.push(`INSERT INTO terminology.code_systems (id, source_id, internal_code, name, canonical_url, created_at, updated_at) VALUES ('00000000-0000-0000-0000-0000000000b${n}','00000000-0000-0000-0000-0000000000a1',${q(ic)},${q(ic)},${q('urn:test:' + ic)},now(),now());`);
  out.push(`INSERT INTO terminology.code_system_versions (id, code_system_id, version, created_at, updated_at) VALUES ('00000000-0000-0000-0000-0000000000c${n}','00000000-0000-0000-0000-0000000000b${n}','1',now(),now());`);
  return `00000000-0000-0000-0000-0000000000c${n}`;
};
const internal = cs(1, 'mantra-core-internal');
const rxv = cs(2, 'rxnorm_full');
const icdv = cs(3, 'icd10cm');
out.push(`INSERT INTO terminology.catalog_concepts (id, code_system_version_id, code, display, created_at, updated_at) VALUES (${q(CONCEPT.TERM_ACTIVE)},${q(internal)},'active','activo',now(),now());`);
for (const c of rx) out.push(`INSERT INTO terminology.catalog_concepts (id, code_system_version_id, code, display, created_at, updated_at) VALUES (gen_random_uuid(),${q(rxv)},${q(c)},${q('RxCUI ' + c)},now(),now());`);
for (const c of icd) out.push(`INSERT INTO terminology.catalog_concepts (id, code_system_version_id, code, display, created_at, updated_at) VALUES (gen_random_uuid(),${q(icdv)},${q(c)},${q('ICD-10-CM ' + c)},now(),now());`);
out.push('COMMIT;');
process.stdout.write(out.join('\n') + '\n');
