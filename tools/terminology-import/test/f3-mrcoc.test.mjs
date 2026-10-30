// TAREA-41 F3.5 — MRCOC → relaciones enfermedad → síntoma T4 (lift).
// Fixtures: recortes de los archivos reales descargados el 2026-10-29
// (test/fixtures/f3/mrcoc-pairs.cut.tsv, mh-freq-counts.cut.txt, wikidata-mesh-hpo.cut.tsv).
// Correr: node --test tools/terminology-import/test/f3-mrcoc.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { STAGE_COLUMNS } from '../lib/bulk-copy.mjs';
import { RELATION_TYPE } from '../lib/glossary-es/load-plan.mjs';
import { hpoPhenotypeConceptId } from '../lib/glossary-es/hpo.mjs';
import { strengthOf } from '../lib/glossary-es/strength.mjs';
import {
  MEDLINE_CITATIONS, MIN_ARTICLES, MIN_LIFT, MRCOC_TIER,
  liftOf, mrcocToRelationshipRows, parseMeshFrequencies, parseMeshHpoCrosswalk, parseMrcocPairs,
} from '../lib/glossary-es/mrcoc.mjs';

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'f3');
const read = (name) => readFileSync(join(FIXTURES, name), 'utf8');
const pairs = parseMrcocPairs(read('mrcoc-pairs.cut.tsv'));
const meshFrequency = parseMeshFrequencies(read('mh-freq-counts.cut.txt'));
const meshToHpo = parseMeshHpoCrosswalk(read('wikidata-mesh-hpo.cut.tsv'));

const PARKINSON = '22222222-2222-4222-8222-222222222222';
const CHOLESTEATOMA = '33333333-3333-4333-8333-333333333333';
const CARCINOMA = '44444444-4444-4444-8444-444444444444';
const MONDO_OF = { 'MESH:D010300': PARKINSON, 'MESH:D018424': CHOLESTEATOMA, 'MESH:D002277': CARCINOMA };
const resolveDisease = (curie) => (MONDO_OF[curie] ? { conceptId: MONDO_OF[curie] } : { conceptId: null, reason: 'no-mondo-group' });
const build = (extra = {}) => mrcocToRelationshipRows(pairs, { meshFrequency, meshToHpo, resolveDisease, validFrom: '2024-01-01', ...extra });

test('los umbrales por defecto son 20 artículos y lift 3, y el denominador es el de MEDLINE 2024', () => {
  assert.equal(MIN_ARTICLES, 20);
  assert.equal(MIN_LIFT, 3);
  assert.equal(MEDLINE_CITATIONS, 36_555_430);
});

test('los parsers leen pares, frecuencias y el cruce MeSH ↔ HPO tal como vienen', () => {
  assert.equal(pairs.length, 5);
  assert.deepEqual(pairs[0], { symptom: 'D004401', disease: 'D010300', articles: 335 });
  assert.equal(meshFrequency.get('D010300'), 83509);
  assert.deepEqual(meshToHpo.get('D009436'), ['HP:0045005', 'HP:0002144']);
});

test('el lift es observado / esperado por azar (disartria × Parkinson = 52,54)', () => {
  const lift = liftOf({ articles: 335, diseaseTotal: 83509, symptomTotal: 2791 });
  assert.equal(lift.toFixed(2), '52.54');
  assert.equal(liftOf({ articles: 5, diseaseTotal: 0, symptomTotal: 10 }), null);
});

test('con los umbrales por defecto entran disartria × Parkinson y la hipoacusia × colesteatoma, T4 con su lift', () => {
  const { rows, stats } = build();
  assert.equal(rows.length, 2);
  const parkinson = rows.find((r) => r.sourceConceptId === PARKINSON);
  assert.equal(parkinson.targetConceptId, hpoPhenotypeConceptId('HP:0001260'));
  assert.equal(parkinson.statisticValue, 52.5416);
  assert.equal(parkinson.evidenceTier, MRCOC_TIER);
  assert.equal(parkinson.relationshipTypeConceptId, RELATION_TYPE.SYMPTOM);
  assert.equal(parkinson.sourceReference, 'mrcoc-2024 articles=335');
  assert.ok(!('frequency' in parkinson) && !('ordinal' in parkinson), 'la coocurrencia no es prevalencia ni orden de ficha');
  assert.equal(stats.belowMinArticles, 1);
  assert.equal(stats.belowMinLift, 1, 'hirsutismo × carcinoma (lift 2,0) no llega a 3');
});

test('con el umbral de la ficha original (lift 2) también entra hirsutismo × carcinoma', () => {
  const { rows } = build({ minLift: 2 });
  assert.equal(rows.length, 3);
  assert.ok(rows.some((r) => r.sourceConceptId === CARCINOMA));
});

test('una enfermedad sin grupo MONDO no se carga y se cuenta por motivo (fiebre × defectos del tubo neural)', () => {
  const { rows, stats, unresolvedDiseases } = build();
  assert.ok(!rows.some((r) => r.targetConceptId === hpoPhenotypeConceptId('HP:0001945')));
  assert.equal(stats.diseaseUnresolved, 1);
  assert.deepEqual(unresolvedDiseases, { 'no-mondo-group': 1 });
});

test('un síntoma sin HPO declarado por Wikidata no se adivina por nombre', () => {
  const { rows, stats } = build({ meshToHpo: new Map() });
  assert.equal(rows.length, 0);
  assert.equal(stats.symptomWithoutHpo, 3);
});

test('varios descriptores sobre el mismo par de conceptos suman observadas y esperadas antes del lift', () => {
  const twice = [...pairs.filter((p) => p.disease === 'D010300'), { symptom: 'D004401', disease: 'D010300', articles: 100 }];
  const { rows } = mrcocToRelationshipRows(twice, { meshFrequency, meshToHpo, resolveDisease, validFrom: '2024-01-01' });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].sourceReference, 'mrcoc-2024 articles=435');
  const expected = (83509 * 2791) / MEDLINE_CITATIONS;
  assert.equal(rows[0].statisticValue, Number((435 / (2 * expected)).toFixed(4)));
});

test('las filas usan sólo columnas conocidas del cargador y la fuerza T4 respeta su techo', () => {
  const { rows } = build();
  const known = new Set(['sourceConceptId', 'targetConceptId', 'relationshipTypeConceptId', 'evidenceTier', 'sourceReference', 'validFrom', 'statisticValue', 'meshPairs']);
  for (const row of rows) for (const key of Object.keys(row)) assert.ok(known.has(key), `columna inesperada ${key}`);
  assert.ok(STAGE_COLUMNS.some(([name]) => name === 'statistic_value'));
  const { score, bestTier } = strengthOf([{ tier: 'T4', sourceId: 'mrcoc', statistic: rows[0].statisticValue }]);
  assert.equal(bestTier, 'T4');
  assert.ok(score > 0 && score < 0.25, `fuerza T4 ${score}`);
});

test('sin validFrom el módulo se niega a producir filas', () => {
  assert.throws(() => mrcocToRelationshipRows([], { meshFrequency, meshToHpo, resolveDisease }), /validFrom/);
});
