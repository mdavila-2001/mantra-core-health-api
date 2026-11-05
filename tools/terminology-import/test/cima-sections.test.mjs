// TAREA-41 F4 — completar un cima.ndjson con las secciones 4.5 y 4.6.
// Fixtures: respuestas reales de la API de CIMA (nº reg. 84740, 2026-10-29) y la
// fila Abacavir de cima.ndjson sin el HTML (test/fixtures/f3/cima-*).
// Correr: node --test tools/terminology-import/test/cima-sections.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { ForbiddenSectionError, sectionRequests, sectionUrl, toSection } from '../lib/glossary-es/cima.mjs';
import { missingSections, referenceOf } from '../lib/glossary-es/cima-sections.mjs';

const FX = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'f3');
const json = (name) => JSON.parse(readFileSync(join(FX, name), 'utf8'));
const { row } = json('cima-sections-row.cut.json');
const RETRIEVED = '2026-10-29T12:00:00.000Z';

test('el producto de referencia sale de la propia fila, sin volver a listar', () => {
  const ref = referenceOf(row);
  assert.equal(ref.nregistro, '84740');
  assert.match(ref.name, /^ABACAVIR TARBIS/);
  assert.equal(ref.fichaTecnicaUrl, 'https://cima.aemps.es/cima/dochtml/ft/84740/FT_84740.html');
  assert.equal(ref.fichaTecnicaDate, '2024-01-22T23:38:32.000Z');
});

test('una fila sin producto de referencia ni secciones no se completa', () => {
  assert.equal(referenceOf({ drugFacts: { sections: [] } }), null);
  assert.equal(referenceOf({}), null);
});

test('sólo se piden las secciones que faltan, en el orden pedido', () => {
  assert.deepEqual(missingSections(row, ['4.5', '4.6']), ['4.5', '4.6']);
  const withFiveFirst = { drugFacts: { sections: [...row.drugFacts.sections, { section: '4.5' }] } };
  assert.deepEqual(missingSections(withFiveFirst, ['4.5', '4.6']), ['4.6']);
});

test('la 4.2 (posología) no se puede pedir: ni como URL ni como petición de ficha', () => {
  assert.throws(() => sectionUrl('84740', '4.2'), ForbiddenSectionError);
  assert.ok(!sectionRequests('84740').some((r) => r.section === '4.2'));
  assert.deepEqual(sectionRequests('84740').map((r) => r.section).filter((s) => ['4.5', '4.6'].includes(s)), ['4.5', '4.6']);
});

test('la respuesta real de 4.5 y 4.6 se vuelve una sección con cita, enlace y fecha de la ficha', () => {
  const ref = referenceOf(row);
  for (const code of ['4.5', '4.6']) {
    const sec = toSection(code, json(`cima-84740-${code}.json`), ref, RETRIEVED);
    assert.equal(sec.section, code);
    assert.equal(sec.nregistro, '84740');
    assert.equal(sec.sourceUrl, `https://cima.aemps.es/cima/rest/docSegmentado/contenido/1?nregistro=84740&seccion=${code}`);
    assert.equal(sec.documentDate, '2024-01-22T23:38:32.000Z');
    assert.equal(sec.retrievedAt, RETRIEVED);
    assert.ok(sec.text.length > 50 && !/<[a-z]/i.test(sec.text), 'texto plano, sin etiquetas');
    assert.ok(sec.citation.includes(`sección ${code}`) && sec.citation.includes('versión del 2024-01-22'));
  }
});

test('una respuesta vacía no produce sección', () => {
  assert.equal(toSection('4.5', [], referenceOf(row), RETRIEVED), null);
  assert.equal(toSection('4.5', null, referenceOf(row), RETRIEVED), null);
});
