// TAREA-41 F3.3 (cierre) — Orphanet product9 → concept_properties.
// Fixtures: recortes de en_product9_ages.xml y en_product9_prev.xml sin tocar
// (test/fixtures/f3/orphanet-product9-*.cut.xml, citan su fuente).
// Correr: node --test tools/terminology-import/test/f3-orphanet-properties.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseOrphanetReleaseDate } from '../lib/glossary-es/orphanet.mjs';
import {
  ORPHANET_PROPERTY_CODES, orphanetPropertyId, orphanetPropertyRows, parseOrphanetAges, parseOrphanetPrevalence,
} from '../lib/glossary-es/orphanet-properties.mjs';

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'f3');
const agesXml = readFileSync(join(FIXTURES, 'orphanet-product9-ages.cut.xml'), 'utf8');
const prevXml = readFileSync(join(FIXTURES, 'orphanet-product9-prev.cut.xml'), 'utf8');
const ages = parseOrphanetAges(agesXml);
const prevalence = parseOrphanetPrevalence(prevXml);

const ALEXANDER = '55555555-5555-4555-8555-555555555555';
const MEDS = '66666666-6666-4666-8666-666666666666';
const resolveDisease = (curie) => ({ 'ORPHA:58': { conceptId: ALEXANDER }, 'ORPHA:166024': { conceptId: MEDS } })[curie] ?? { conceptId: null, reason: 'no-mondo-group' };
const build = (extra = {}) => orphanetPropertyRows({ ages, prevalence }, { resolveDisease, release: '2026-06-23', ...extra });
const valueOf = (rows, concept, code) => JSON.parse(rows.find((r) => r[1] === concept && r[2] === code)[4]);

test('la edad de inicio y la herencia se leen con sus etiquetas en inglés, tal cual', () => {
  assert.deepEqual(ages.get('58'), { ageOfOnset: ['All ages'], inheritance: ['Autosomal dominant'] });
  assert.deepEqual(ages.get('166024'), { ageOfOnset: ['Infancy', 'Neonatal'], inheritance: ['Autosomal recessive'] });
  assert.deepEqual(ages.get('166032').inheritance, [], 'un trastorno sin herencia declarada queda vacío, no inventado');
});

test('la prevalencia conserva tipo, calificación, clase, valor, zona, estado de validación y fuente', () => {
  const entries = prevalence.get('166024');
  assert.equal(entries.length, 2);
  assert.deepEqual(entries[1], {
    type: 'Point prevalence', qualification: 'Class only', class: '<1 / 1 000 000', meanValue: 0,
    geographic: 'Worldwide', validationStatus: 'Validated', source: 'ORPHANET_11389160[PMID]_9689990[PMID]',
  });
  assert.equal(entries[0].class, null, 'PrevalenceClass vacío → null');
  assert.equal(entries[0].meanValue, 4);
});

test('la fecha de release sale de la cabecera de cada archivo', () => {
  assert.equal(parseOrphanetReleaseDate(agesXml), '2026-06-23');
  assert.equal(parseOrphanetReleaseDate(prevXml), '2026-06-23');
});

test('las filas son (concepto, propiedad) json con id determinista y la fuente/licencia dentro del valor', () => {
  const { rows, stats } = build();
  assert.equal(stats.disorders, 3);
  assert.deepEqual(stats.unresolved, { 'no-mondo-group': 1 }, '166032 no tiene grupo MONDO');
  assert.equal(rows.length, 5, "58: inicio+herencia; 166024: inicio+herencia+prevalencia");
  for (const [id, concept, code, type, json] of rows) {
    assert.equal(id, orphanetPropertyId(concept, code));
    assert.equal(type, 'json');
    const value = JSON.parse(json);
    assert.equal(value.license, 'CC BY 4.0');
    assert.equal(value.release, '2026-06-23');
  }
  assert.deepEqual(valueOf(rows, ALEXANDER, ORPHANET_PROPERTY_CODES.inheritance).orphanet, [{ orphaCode: '58', values: ['Autosomal dominant'] }]);
  assert.equal(valueOf(rows, MEDS, ORPHANET_PROPERTY_CODES.prevalence).orphanet[0].entries.length, 2);
});

test('dos códigos ORPHA en el mismo concepto suman entradas, no se pisan', () => {
  const both = (curie) => (['ORPHA:58', 'ORPHA:166024'].includes(curie) ? { conceptId: ALEXANDER } : { conceptId: null, reason: 'no-mondo-group' });
  const { rows } = orphanetPropertyRows({ ages, prevalence }, { resolveDisease: both, release: '2026-06-23' });
  const onset = valueOf(rows, ALEXANDER, ORPHANET_PROPERTY_CODES.ageOfOnset).orphanet;
  assert.deepEqual(onset.map((e) => e.orphaCode), ['58', '166024']);
  assert.equal(new Set(rows.map((r) => r[0])).size, rows.length, 'ids únicos');
});

test('sin release el módulo se niega a producir filas', () => {
  assert.throws(() => orphanetPropertyRows({ ages, prevalence }, { resolveDisease }), /release/);
});
