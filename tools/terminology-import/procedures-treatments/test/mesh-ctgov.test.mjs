// MeSH 2026 (extracto real de desc2026.gz) y ClinicalTrials.gov (filas reales de la API v2, 2026-10-27).
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { compactStudy } from '../fetch-ctgov.mjs';
import { RELATION_TYPES } from '../lib/relation-types.mjs';
import { CTGOV_TYPE, ctgovAssertions, pairQueryUrl } from '../lib/sources/ctgov.mjs';
import { isProcedureTree, meshProcedureRecords, parseDescriptorRecord } from '../lib/sources/mesh.mjs';

const FIX = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');
const meta = (source) => ({ source, version: 'test', retrievedAt: '2026-10-27T00:00:00.000Z', license: 'Dominio público', fileUrl: `https://example.invalid/${source}`, sha256: 'x' });
const records = () => [...readFileSync(join(FIX, 'mesh-desc2026.excerpt.xml'), 'utf8').matchAll(/<DescriptorRecord [\s\S]*?<\/DescriptorRecord>/g)].map((m) => parseDescriptorRecord(m[0]));

test('MeSH: el árbol decide qué es procedimiento; la farmacoterapia (E02.319) y lo que no es del árbol E quedan afuera', () => {
  assert.equal(isProcedureTree('E02.815'), true);
  assert.equal(isProcedureTree('E04.520.050'), true);
  assert.equal(isProcedureTree('E02.319'), false);
  assert.equal(isProcedureTree('E02.319.300'), false);
  assert.equal(isProcedureTree('E05.200'), false, 'técnicas de investigación');
  assert.equal(isProcedureTree('C04.557'), false);
  assert.equal(isProcedureTree('E0'), false);
});

test('MeSH: descriptor real con número de árbol y nota de alcance verbatim', () => {
  const d = records().find((x) => x.ui === 'D011878');
  assert.equal(d.name, 'Radiotherapy');
  assert.deepEqual(d.trees, ['E02.815']);
  assert.equal(d.scopeNote, 'The use of IONIZING RADIATION to treat malignant NEOPLASMS and some benign conditions.');
  assert.equal(parseDescriptorRecord('<x/>'), null);
});

test('MeSH: registros de concepto sólo para procedimientos; el resto se cuenta', () => {
  const ds = records();
  const { procedures, stats } = meshProcedureRecords(ds, meta('mesh-desc-2026'), 'https://id.nlm.nih.gov/mesh/');
  const codes = procedures.map((p) => p.code);
  assert.ok(codes.includes('D011878') && codes.includes('D000028'));
  assert.ok(!codes.includes('D004358'), 'Drug Therapy (E02.319) es farmacológico');
  assert.ok(!codes.includes('D000001'), 'Calcimycin no está en el árbol E');
  assert.equal(stats.included, procedures.length);
  const r = procedures.find((p) => p.code === 'D011878');
  assert.equal(r.system, 'mesh-procedures');
  assert.equal(r.definition, 'The use of IONIZING RADIATION to treat malignant NEOPLASMS and some benign conditions.');
  assert.deepEqual(r.properties.mesh_procedure_tree_numbers, ['E02.815']);
  assert.equal(r.provenance.uri, 'https://id.nlm.nih.gov/mesh/D011878');
});

test('ClinicalTrials.gov: el estudio crudo de la API se compacta; sin MeSH de intervención o condición se descarta', () => {
  const api = JSON.parse(readFileSync(join(FIX, 'ctgov-api.sample.json'), 'utf8'));
  const compact = api.studies.map(compactStudy);
  assert.equal(compact[0].nct, 'NCT05127616');
  assert.deepEqual(compact[0].interventionMeshes.map((m) => m.id), ['D010353', 'D010166']);
  assert.deepEqual(compact[0].interventionTypes, ['BEHAVIORAL']);
  assert.equal(compact[1], null, 'NCT06421116 no trae MeSH de intervención');
});

test('ClinicalTrials.gov: un par = un procedimiento MeSH y una condición MeSH del mismo estudio, con estado y fase publicados', () => {
  const studies = readFileSync(join(FIX, 'ctgov-studies.excerpt.ndjson'), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
  const { assertions, stats } = ctgovAssertions(studies, new Set(['D011878', 'D000028']), meta('clinicaltrials-gov'));
  assert.ok(assertions.length > 0);
  assert.equal(stats.studiesRead, studies.length);
  for (const a of assertions) {
    assert.equal(a.relationType.code, CTGOV_TYPE);
    assert.equal(a.relationType.assertion, 'investigational');
    assert.equal(a.subject.system, 'mesh-procedures');
    assert.equal(a.object.system, 'mesh');
    assert.equal(a.evidence.studyCount, a.evidence.studies.length);
    assert.equal(Object.values(a.evidence.byStatus).reduce((x, y) => x + y, 0), a.evidence.studyCount);
    for (const s of a.evidence.studies) assert.match(s.nct, /^NCT\d{8}$/);
  }
  const first = assertions[0];
  assert.equal(first.provenance.uri, pairQueryUrl(first.subject.code, first.object.code));
  assert.match(decodeURIComponent(first.provenance.uri), /AREA\[InterventionMeshId\]D\d+ AND AREA\[ConditionMeshId\]D\d+/);
});

test('ClinicalTrials.gov: un descriptor de intervención que no es procedimiento (farmacoterapia) no genera pares', () => {
  const studies = readFileSync(join(FIX, 'ctgov-studies.excerpt.ndjson'), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
  const { assertions, stats } = ctgovAssertions(studies, new Set(['D011878']), meta('clinicaltrials-gov'));
  assert.ok(stats.interventionMeshesDropped > 0);
  assert.ok(!assertions.some((a) => a.subject.code === 'D004358'));
});

test('ClinicalTrials.gov: la etiqueta dice «en estudio», no «indicado», y aclara que no es una indicación', () => {
  const t = RELATION_TYPES[CTGOV_TYPE];
  assert.match(t.label, /En estudio/);
  assert.match(t.label, /no es una indicación/);
  assert.doesNotMatch(t.label, /(^|[^a-z])indicad/i);
});
