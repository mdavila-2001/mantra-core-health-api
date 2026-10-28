// TAREA-41 F3.1 (identidad MONDO) y F3.2 (HPO → filas de bulk-copy).
// Fixtures recortados de los archivos reales; cada uno cita su fuente y las
// líneas originales en la cabecera (test/fixtures/f3/).
// Correr: node --test tools/terminology-import/test/f3-identity-hpo.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { STAGE_COLUMNS } from '../lib/bulk-copy.mjs';
import { slugify } from '../lib/glossary-es/common.mjs';
import { conceptId as glossaryConceptId, RELATION_TYPE } from '../lib/glossary-es/load-plan.mjs';
import { GROUP_STATUS, buildIdentity, duplicateLabelRate, normalizeCurie, parseMondoSssom } from '../lib/glossary-es/identity.mjs';
import {
  ONSET_AGE_DAYS,
  frequencyFromPercent,
  hpoPhenotypeConceptId,
  hpoaToRelationshipRows,
  normalizeHpoFrequency,
  onsetAgeRange,
  parseBabelonOfficialLabels,
} from '../lib/glossary-es/hpo.mjs';
import { conceptId as diseaseCatalogConceptId } from '../diseases/lib/code-systems.mjs';
import { parseHpoa } from '../symptoms/lib/annotations.mjs';
import { strengthOf } from '../lib/glossary-es/strength.mjs';

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'f3');
const read = (name) => readFileSync(join(FIXTURES, name), 'utf8');

const sssom = parseMondoSssom(read('mondo.sssom.cut.tsv'));
const hpoa = parseHpoa(read('phenotype.hpoa.cut'), { retrievedAt: '2026-10-26T00:00:00Z', license: 'HPO' });
const identity = buildIdentity(sssom, { glossaryIcd10Codes: new Set(['K28', 'K28.0']) });
const plan = hpoaToRelationshipRows(hpoa.rows, { resolveDisease: identity.resolve, validFrom: hpoa.header.version });
const rowsFor = (omim, hpo) =>
  plan.rows.filter((r) => r.sourceConceptId === identity.resolve(omim).conceptId && r.targetConceptId === hpoPhenotypeConceptId(hpo));

// --- F3.1 identidad ---------------------------------------------------------

test('SSSOM: sólo exactMatch con sujeto MONDO; prefijos canónicos', () => {
  assert.equal(sssom.length, 39);
  assert.ok(sssom.every((e) => e.via === 'skos:exactMatch' && e.mondo.startsWith('MONDO:')));
  assert.equal(normalizeCurie('Orphanet:34515'), 'ORPHA:34515');
  assert.equal(normalizeCurie('mesh:C565738'), 'MESH:C565738');
  assert.equal(normalizeCurie('SCTID:123'), null, 'SNOMED no es equivalencia aceptada en F3.1');
});

test('grupo MONDO: OMIM y ORPHA del mismo grupo resuelven al mismo concepto (pivote del catálogo #688)', () => {
  const omim = identity.resolve('OMIM:607155');
  const orpha = identity.resolve('ORPHA:34515');
  assert.equal(omim.mondo, 'MONDO:0011787');
  assert.equal(omim.conceptId, orpha.conceptId);
  assert.equal(omim.conceptId, diseaseCatalogConceptId('mondo', 'MONDO:0011787'));
  assert.equal(identity.groups.get('MONDO:0011787').status, GROUP_STATUS.CREATED);
});

test('código sin grupo MONDO no se inventa: DECIPHER:16 queda sin resolver', () => {
  assert.deepEqual(identity.resolve('DECIPHER:16'), { conceptId: null, mondo: null, reason: 'no-mondo-group' });
});

test('reuso del glosario por código CIE-10: una sola ficha → se reusa su id', () => {
  const single = buildIdentity(sssom, { glossaryIcd10Codes: new Set(['K28']) });
  const g = single.groups.get('MONDO:0001155');
  assert.equal(g.status, GROUP_STATUS.REUSED);
  assert.equal(g.conceptId, glossaryConceptId(`cie10es-dx-${slugify('K28')}`));
  assert.equal(single.resolve('DOID:10927').conceptId, g.conceptId);
  assert.equal(single.report.reused, 1);
});

test('conflicto real: MONDO:0001155 abarca K28 y K28.0 del glosario → revisión, sin concepto', () => {
  const g = identity.groups.get('MONDO:0001155');
  assert.equal(g.status, GROUP_STATUS.REVIEW);
  assert.equal(g.conceptId, null);
  assert.deepEqual(identity.resolve('ICD10CM:K28'), { conceptId: null, mondo: 'MONDO:0001155', reason: 'group-in-review' });
  assert.deepEqual(identity.report.conflicts, [{ kind: 'group-spans-several-glossary-concepts', mondo: 'MONDO:0001155', glossaryCodes: ['K28', 'K28.0'] }]);
});

test('conflicto de código en dos grupos (lógica, entrada mínima): el código no resuelve', () => {
  const r = buildIdentity([
    { mondo: 'MONDO:0000001', curie: 'OMIM:100' },
    { mondo: 'MONDO:0000002', curie: 'OMIM:100' },
    { mondo: 'MONDO:0000002', curie: 'OMIM:200' },
  ]);
  assert.equal(r.resolve('OMIM:100').reason, 'code-in-several-groups');
  assert.equal(r.resolve('OMIM:200').mondo, 'MONDO:0000002');
  assert.equal(r.report.conflicts[0].kind, 'code-in-several-groups');
});

test('tasa de duplicados por etiqueta, total y entre categorías', () => {
  const r = duplicateLabelRate([
    { conceptId: 'a', label: 'Fiebre', category: 'signs-symptoms' },
    { conceptId: 'b', label: 'fiebre', category: 'disease' },
    { conceptId: 'c', label: 'Tos', category: 'signs-symptoms' },
    { conceptId: 'd', label: 'Tós', category: 'signs-symptoms' },
  ]);
  assert.equal(r.totalConcepts, 4);
  assert.equal(r.duplicateConcepts, 2);
  assert.equal(r.acrossCategoryDuplicates, 1);
  assert.equal(r.acrossCategoryRate, 0.25);
});

// --- F3.2 HPO ---------------------------------------------------------------

test('frecuencia: término HP, n/m (con numerador) y % (sin numerador)', () => {
  assert.deepEqual(normalizeHpoFrequency('HP:0040283'), { frequency: 'OCCASIONAL', numerator: null, denominator: null, problem: null });
  assert.deepEqual(normalizeHpoFrequency('1/2'), { frequency: 'FREQUENT', numerator: 1, denominator: 2, problem: null });
  assert.deepEqual(normalizeHpoFrequency('25%'), { frequency: 'OCCASIONAL', numerator: null, denominator: null, problem: null });
  assert.equal(normalizeHpoFrequency('0/2').frequency, 'EXCLUDED');
  assert.equal(normalizeHpoFrequency('3/3').frequency, 'OBLIGATE');
  assert.equal(normalizeHpoFrequency('').frequency, null, 'sin frecuencia en la fuente, sin frecuencia en la fila');
  assert.equal(normalizeHpoFrequency('3/2').problem, 'invalid-ratio');
  assert.equal(frequencyFromPercent(0.5), null, 'HPO no define grado entre 0 y 1 %');
  assert.equal(frequencyFromPercent(79.5), 'FREQUENT');
});

test('inicio: sólo rangos definidos por el término HPO', () => {
  assert.deepEqual(onsetAgeRange('HP:0003577'), { ageMinDays: 0, ageMaxDays: 0, known: true });
  assert.deepEqual(onsetAgeRange('HP:0003623'), { ageMinDays: 0, ageMaxDays: 28, known: true });
  assert.equal(ONSET_AGE_DAYS['HP:0003581'].max, null);
  assert.deepEqual(onsetAgeRange('HP:0030674'), { ageMinDays: null, ageMaxDays: null, known: false }, 'prenatal: sin edad');
});

test('filtros: aspecto I fuera, ORPHA fuera (entra por Orphanet en F3.3), DECIPHER sin grupo', () => {
  assert.equal(plan.stats.read, 14);
  assert.equal(plan.stats.notPhenotypeAspect, 1);
  assert.equal(plan.stats.skippedDatabase, 1);
  assert.deepEqual(plan.unresolvedDiseases, { 'no-mondo-group': 1 });
  assert.equal(plan.rows.length, 11);
});

test('filas: forma de bulk-copy, tipo SYMPTOM, sin ordinal, sentido enfermedad → fenotipo', () => {
  const [row] = rowsFor('OMIM:619340', 'HP:0011097');
  assert.equal(row.relationshipTypeConceptId, RELATION_TYPE.SYMPTOM);
  assert.equal(row.evidenceTier, 'CURATED_REFERENCE');
  assert.equal(row.frequency, 'FREQUENT');
  assert.equal(row.frequencyNumerator, 1);
  assert.equal(row.frequencyDenominator, 2);
  assert.equal(row.sourceReference, 'PMID:31675180 @OMIM:619340');
  assert.equal(row.validFrom, '2026-09-02');
  assert.ok(!('ordinal' in row), 'ordinal es de la relación, no de la evidencia');
  const stageFields = new Set(STAGE_COLUMNS.map(([name]) => name));
  assert.ok(stageFields.has('source_reference'));
});

test('nivel: sin PMID (referencia = registro OMIM) queda T3; PMID múltiple es T2', () => {
  const [omimRef] = rowsFor('OMIM:614102', 'HP:0002014');
  assert.equal(omimRef.evidenceTier, 'COLLABORATIVE_KNOWLEDGE');
  assert.equal(omimRef.frequency, 'OCCASIONAL');
  assert.equal(omimRef.frequencyNumerator, null);
  const [multi] = rowsFor('OMIM:612229', 'HP:0003003');
  assert.equal(multi.evidenceTier, 'CURATED_REFERENCE');
  assert.equal(multi.frequency, null);
  assert.equal(multi.sourceReference, 'PMID:18372901,PMID:17934461,PMID:18372905 @OMIM:612229');
});

test('0/2 → EXCLUDED: strengthOf la descarta', () => {
  const [row] = rowsFor('OMIM:609153', 'HP:0001878');
  assert.equal(row.frequency, 'EXCLUDED');
  assert.equal(row.frequencyNumerator, 0);
  const s = strengthOf([{ tier: 'T2', sourceId: 'hpo', frequency: row.frequency }]);
  assert.equal(s.excluded, true);
  assert.equal(s.score, 0);
});

test('sexo e inicio: el sexo no se inventa (sin mapa queda null y se cuenta); con mapa se resuelve', () => {
  const [male] = rowsFor('OMIM:605231', 'HP:0000047');
  assert.equal(male.sexConceptId, null);
  assert.equal(male.sexCode, 'MALE');
  assert.equal(male.sourceReference, 'PMID:10973238 @OMIM:605231 [sex=MALE]');
  assert.equal(plan.stats.sexUnresolved, 1);
  const withSex = hpoaToRelationshipRows(hpoa.rows, {
    resolveDisease: identity.resolve,
    validFrom: '2026-09-02',
    sexConceptIds: new Map([['MALE', '00000000-0000-5000-8000-000000000001']]),
  });
  assert.equal(withSex.stats.sexResolved, 1);
  const [congenital] = rowsFor('OMIM:619354', 'HP:0000365');
  assert.equal(congenital.ageMinDays, 0);
  assert.equal(congenital.ageMaxDays, 0);
  assert.equal(congenital.frequency, 'OBLIGATE');
});

test('mismo PMID con distinta población (inicio) → dos evidencias, no una', () => {
  const rows = rowsFor('OMIM:613646', 'HP:0012120');
  assert.equal(rows.length, 2);
  assert.deepEqual(rows.map((r) => r.sourceReference).sort(), ['PMID:20524213 @OMIM:613646', 'PMID:20524213 @OMIM:613646 [onset=HP:0003623]']);
  assert.deepEqual(rows.map((r) => r.ageMaxDays).sort(), [28, null]);
});

test('mismo PMID y población, distinta frecuencia (líneas 45561/45562) → sufijo estable, no colapsa', () => {
  const rows = rowsFor('OMIM:609285', 'HP:0001288');
  assert.equal(rows.length, 2);
  assert.deepEqual(rows.map((r) => r.sourceReference).sort(), [
    'PMID:23378224 @OMIM:609285 [frequency=1/1; evidence=PCS]',
    'PMID:23378224 @OMIM:609285 [frequency=2/2; evidence=PCS]',
  ]);
  assert.equal(plan.stats.referenceCollisions, 2);
  const keys = plan.rows.map((r) => `${r.sourceConceptId}|${r.targetConceptId}|${r.sourceReference}`);
  assert.equal(new Set(keys).size, keys.length, 'la clave natural de evidencia es única en el lote');
});

test('babelon: sólo rdfs:label OFFICIAL en castellano', () => {
  const labels = parseBabelonOfficialLabels(read('hp-es.babelon.cut.tsv'));
  assert.equal(labels.get('HP:0000365'), 'Discapacidad auditiva/hipoacusia');
  const notApproved = parseBabelonOfficialLabels(
    'source_language\ttranslation_language\tsubject_id\tsource_value\tpredicate_id\ttranslation_value\ttranslation_status\nen\tes\tHP:1\tX\trdfs:label\tY\tCANDIDATE\n',
  );
  assert.equal(notApproved.size, 0);
});
