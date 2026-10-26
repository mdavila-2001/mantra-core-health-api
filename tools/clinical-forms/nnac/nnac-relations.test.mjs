// Correr: node --test tools/clinical-forms/nnac/nnac-relations.test.mjs
//
// Fixtures: tres fichas REALES del repo (no copias): una NNAC 2012, una NNAC
// 2025 y una sin `examenes_solicitados`. El índice de designaciones es el
// único dato armado a mano, y sólo con textos que aparecen en esas fichas.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  NNAC_2012_VALID_FROM,
  RELATION_TYPE_CONCEPT_ID,
  buildDesignationIndex,
  coverageByField,
  csvLine,
  editionOf,
  icd10CodesOf,
  icd10ConceptId,
  nnacRelations,
  normalizeOption,
  resolveOption,
} from './lib/nnac-relations.mjs';

const FORMS = join(dirname(fileURLToPath(import.meta.url)), '../../../src/common/seed/data/clinical-forms');
const read = (path) => JSON.parse(readFileSync(join(FORMS, path), 'utf8'));

const nac2025 = read('medicina-interna/nnac25-mi-21-neumonia-adquirida-comunidad.json');
const nac2012 = read('neumologia/nnac-u13-09-neumonia-adquirida-comunidad.json');
const tep2012 = read('cardiologia/nnac-u12-03-trombo-embolismo-pulmonar.json');

const options = (form, code) => form.fields.find((f) => f.code === code)?.options ?? [];

test('las tres fixtures son lo que dicen ser', () => {
  assert.equal(editionOf(nac2025).edition, '2025');
  assert.equal(editionOf(nac2012).edition, '2012');
  assert.equal(options(tep2012, 'examenes_solicitados').length, 0);
});

test('vigencia: 2025 sale de la RM de la nota; 2012 de la fecha fijada para la edición', () => {
  assert.deepEqual(
    { ...editionOf(nac2025), locator: undefined },
    { edition: '2025', resolution: 'RM 0456', validFrom: '2025-09-30', validTo: null, locator: undefined },
  );
  assert.equal(editionOf(nac2025).locator, 'NNAC 2025 (RM 0456, 30/09/2025), capítulo 21, pág. 199');
  assert.equal(editionOf(nac2012).validFrom, NNAC_2012_VALID_FROM);
  assert.equal(editionOf(nac2012).validTo, null);
});

test('una ficha sin fecha legible no se carga: va a bloqueantes', () => {
  const sinNota = { ...nac2025, provenance: { ...nac2025.provenance, note: 'NNAC 2025, capítulo 21' } };
  const out = nnacRelations(sinNota, buildDesignationIndex([{ conceptId: icd10ConceptId('J18'), text: 'x', categoryKey: 'disease' }]));
  assert.equal(out.blocker, 'sin-fecha-de-vigencia');
  assert.equal(out.rows.length, 0);
});

test('códigos CIE-10 en el orden de la ficha, más el de la nota', () => {
  assert.equal(icd10CodesOf(nac2025)[0], 'J18');
  assert.ok(icd10CodesOf(nac2012).includes('J15'));
});

test('normalización: tildes, mayúsculas, espacios y puntuación final', () => {
  assert.equal(normalizeOption('  Hemograma   COMPLETO. '), 'hemograma completo');
  assert.equal(normalizeOption('Neumonía'), 'neumonia');
});

const disease = icd10ConceptId('J18');
const hemograma = 'c0000000-0000-4000-8000-000000000001';
const rxTorax = 'c0000000-0000-4000-8000-000000000002';
const fiebre = 'c0000000-0000-4000-8000-000000000003';
const fiebreHomonima = 'c0000000-0000-4000-8000-000000000004';
const medInterna = 'c0000000-0000-4000-8000-000000000005';
const index = buildDesignationIndex([
  { conceptId: disease, text: 'Neumonía, organismo no especificado', categoryKey: 'disease' },
  { conceptId: hemograma, text: 'Hemograma completo', categoryKey: 'lab' },
  { conceptId: rxTorax, text: 'Radiografía de tórax', categoryKey: 'imaging' },
  { conceptId: fiebre, text: 'Fiebre alta', categoryKey: 'signs-symptoms' },
  { conceptId: fiebreHomonima, text: 'Fiebre alta', categoryKey: 'other' },
  { conceptId: medInterna, text: 'Medicina interna', categoryKey: 'specialty' },
]);

test('mapeo exacto, ambigüedad a revisión y estudio por prefijo', () => {
  assert.deepEqual(resolveOption(index, 'Hemograma completo', 'REQUIRED_TEST'), { conceptId: hemograma, matchedBy: 'exact' });
  assert.equal(resolveOption(index, 'Fiebre alta', 'DIAGNOSTIC_CRITERION').reason, 'ambiguous');
  assert.deepEqual(
    resolveOption(index, 'Radiografía de tórax: condensación homogénea y bien delimitada en un lóbulo/ patrón alveolar', 'DIAGNOSTIC_CRITERION'),
    { conceptId: rxTorax, matchedBy: 'study-prefix' },
  );
  // El prefijo sólo vale si es un estudio y para los campos donde tiene sentido.
  assert.equal(resolveOption(index, 'Radiografía de tórax: algo', 'COMPLICATION').reason, 'no-match');
  // Nunca por similitud: «Hemograma» a secas no es «Hemograma completo».
  assert.equal(resolveOption(index, 'Hemograma', 'REQUIRED_TEST').reason, 'no-match');
});

test('NNAC 2025: filas T1 con cita literal, ubicación y vigencia', () => {
  const out = nnacRelations(nac2025, index);
  assert.equal(out.blocker, null);
  assert.equal(out.diseaseConceptId, disease);
  const test = out.rows.find((r) => r.targetConceptId === hemograma);
  assert.deepEqual(test, {
    sourceConceptId: disease,
    targetConceptId: hemograma,
    relationshipTypeConceptId: RELATION_TYPE_CONCEPT_ID.REQUIRED_TEST,
    evidenceTier: 'NATIONAL_STANDARD',
    sourceReference: `NNAC25_MI_21_NEUMONIA_ADQUIRIDA_COMUNIDAD#examenes_solicitados#${options(nac2025, 'examenes_solicitados').indexOf('Hemograma completo') + 1}`,
    citationText: 'Hemograma completo',
    citationLocator: 'NNAC 2025 (RM 0456, 30/09/2025), capítulo 21, pág. 199 · examenes_solicitados',
    validFrom: '2025-09-30',
    validTo: null,
  });
  assert.ok(out.rows.some((r) => r.relationshipTypeConceptId === RELATION_TYPE_CONCEPT_ID.SPECIALTY && r.targetConceptId === medInterna));
  // Toda opción no mapeada queda en la cola con su campo; ninguna se pierde.
  const clinical = Object.keys({ criterios_clinicos: 1, examenes_solicitados: 1, complicaciones: 1, factores_de_riesgo: 1, criterios_de_referencia: 1 });
  const total = clinical.reduce((n, c) => n + options(nac2025, c).length, 0);
  const mappedClinical = out.rows.filter((r) => !r.sourceReference.includes('#specialty#')).length;
  const ambiguousOrDup = out.unmapped.filter((u) => u.field !== 'specialty').length;
  assert.ok(mappedClinical + ambiguousOrDup <= total && mappedClinical + ambiguousOrDup >= total - 1);
});

test('el factor de riesgo apunta a la enfermedad, no al revés', () => {
  const factor = options(nac2025, 'factores_de_riesgo')[0];
  const factorId = 'c0000000-0000-4000-8000-000000000009';
  const out = nnacRelations(nac2025, buildDesignationIndex([...withDisease(), { conceptId: factorId, text: factor, categoryKey: 'other' }]));
  const row = out.rows.find((r) => r.relationshipTypeConceptId === RELATION_TYPE_CONCEPT_ID.RISK_FACTOR);
  assert.equal(row.sourceConceptId, factorId);
  assert.equal(row.targetConceptId, disease);
});

function withDisease() {
  return [{ conceptId: disease, text: 'Neumonía, organismo no especificado', categoryKey: 'disease' }];
}

test('sin concepto CIE-10 cargado la ficha no produce filas', () => {
  const out = nnacRelations(tep2012, buildDesignationIndex([]));
  assert.equal(out.blocker, 'sin-concepto-cie10');
});

test('ficha sin exámenes: sin REQUIRED_TEST y cobertura por campo coherente', () => {
  const tepDisease = icd10CodesOf(tep2012).map(icd10ConceptId)[0];
  const out = nnacRelations(tep2012, buildDesignationIndex([{ conceptId: tepDisease, text: 'TEP', categoryKey: 'disease' }]));
  assert.equal(out.blocker, null);
  assert.ok(!out.rows.some((r) => r.relationshipTypeConceptId === RELATION_TYPE_CONCEPT_ID.REQUIRED_TEST));
  const coverage = coverageByField([out]);
  assert.equal(coverage.examenes_solicitados, undefined);
  assert.equal(coverage.criterios_clinicos.unmapped, options(tep2012, 'criterios_clinicos').length);
  assert.equal(coverage.criterios_clinicos.percent, 0);
});

test('CSV escapa comillas', () => {
  assert.equal(csvLine(['a', 'dice "no"', null]), '"a","dice ""no""",""');
});
