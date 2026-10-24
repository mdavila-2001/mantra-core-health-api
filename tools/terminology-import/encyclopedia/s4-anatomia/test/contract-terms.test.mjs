// Pruebas del contrato §12.3, la guarda de dosis y la resolución de `conceptRef`.
// Fixture: 10 filas REALES de la semilla del glosario (2026-10-01), sin editar.
// Correr: node --test tools/terminology-import/encyclopedia/s4-anatomia/test/

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { allowedKinds, looksLikeDose, validateFact, validateSection } from '../lib/contract.mjs';
import { cleanText } from '../lib/wikidata-sections.mjs';
import { buildUniverse, conceptRefOf, isS1Row, resolveConceptRef, wikidataIdOf } from '../lib/terms.mjs';

const FX = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');
const seedRows = JSON.parse(readFileSync(join(FX, 'seed-rows.json'), 'utf8'));
const bySlug = (slug) => seedRows.find((r) => r.slug === slug);

const provenance = {
  source: 'wikidata',
  sourceUrl: 'https://www.wikidata.org/wiki/Q9597',
  license: 'CC0 1.0 (Wikidata, dominio público)',
  retrievedAt: '2026-10-08',
  sourceVersion: 'revisión 1',
  locator: 'Descripción del ítem (es)',
};

test('catálogo cerrado de secciones por categoría (§12.3)', () => {
  assert.ok(allowedKinds('anatomy').includes('blood_supply'));
  assert.ok(!allowedKinds('anatomy').includes('symptoms'));
  assert.ok(allowedKinds('signs-symptoms').includes('red_flags'));
  assert.ok(allowedKinds('lab').includes('reference_values'));
  assert.ok(allowedKinds('specialty').includes('conditions_treated'));
  assert.ok(allowedKinds('treatment').includes('recovery'));
  assert.deepEqual(allowedKinds('inventada'), []);
});

test('una sección válida no tiene problemas y una sin los seis campos de procedencia sí', () => {
  const ok = { kind: 'definition', text: 'cavidad del cuerpo humano', lang: 'es', ...provenance };
  assert.deepEqual(validateSection(ok, 'anatomy'), []);
  for (const field of ['source', 'sourceUrl', 'license', 'retrievedAt', 'sourceVersion', 'locator']) {
    const broken = { ...ok, [field]: '' };
    assert.ok(validateSection(broken, 'anatomy').includes(`falta-${field}`), field);
  }
});

test('una sección con kind fuera del catálogo, idioma inválido o sin texto se rechaza', () => {
  const base = { text: 'x', lang: 'es', ...provenance };
  assert.ok(validateSection({ ...base, kind: 'symptoms' }, 'anatomy').includes('kind-fuera-de-catalogo:symptoms'));
  assert.ok(validateSection({ ...base, kind: 'definition', lang: 'fr' }, 'anatomy').includes('idioma-invalido:fr'));
  assert.ok(validateSection({ ...base, kind: 'definition', text: '  ' }, 'anatomy').includes('texto-vacio'));
});

test('la guarda de dosis atrapa cantidad+unidad, posología y la palabra dosis; no atrapa anatomía común', () => {
  assert.equal(looksLikeDose('Tomar 500 mg cada 8 horas'), true);
  assert.equal(looksLikeDose('1,5 mL por vía intravenosa'), true);
  assert.equal(looksLikeDose('10 UI/kg'), true);
  assert.equal(looksLikeDose('Posología habitual en adultos'), true);
  assert.equal(looksLikeDose('La dosis depende del peso'), true);
  assert.equal(looksLikeDose('cavidad del cuerpo humano, situada entre el tórax y la pelvis'), false);
  assert.equal(looksLikeDose('An abnormal elevation of body temperature, usually as a result of a pathologic process.'), false);
  assert.equal(looksLikeDose('Dolor abdominal y pélvico'), false);
});

test('una sección con posible dosis se rechaza aunque tenga toda la procedencia', () => {
  const section = { kind: 'definition', text: 'Se administra 20 mg al día', lang: 'es', ...provenance };
  assert.ok(validateSection(section, 'treatment').includes('posible-dosis'));
});

test('un fact exige etiqueta, valor, fuente y URL http(s)', () => {
  assert.deepEqual(validateFact({ label: 'TA98', value: 'A01.1.00.016', source: 'wikidata', sourceUrl: 'https://www.wikidata.org/wiki/Q9597#P1323' }), []);
  assert.ok(validateFact({ label: 'TA98', value: '', source: 'wikidata', sourceUrl: 'https://x' }).includes('fact-falta-value'));
  assert.ok(validateFact({ label: 'a', value: 'b', source: 'c', sourceUrl: 'ftp://x' }).includes('fact-sourceUrl-no-http'));
});

test('S1 se identifica por el codeSystem de la fila, no por la categoría', () => {
  assert.equal(isS1Row(bySlug('medlineplus-es-6356')), true);
  assert.equal(isS1Row(bySlug('medlineplus-lab-17-hidroxiprogesterona')), true);
  assert.equal(isS1Row(bySlug('wikidata-anatomia-q9597')), false);
  assert.equal(isS1Row(bySlug('cie10es-dx-r12')), false);
});

test('el Q-id sale de externalIds.wikidata o del propio código de un sistema wikidata-*', () => {
  assert.equal(wikidataIdOf(bySlug('wikidata-anatomia-q9597')), 'Q9597');
  assert.equal(wikidataIdOf(bySlug('cie10es-dx-r12')), 'Q537297');
  assert.equal(wikidataIdOf(bySlug('inlasa-lac-001')), null);
  assert.equal(wikidataIdOf(bySlug('cefalea')), null);
});

test('conceptRef = sistema + código + slug existentes; un término inexistente no resuelve', () => {
  const universe = buildUniverse(seedRows);
  assert.equal(universe.excludedS1.length, 2);
  assert.equal(universe.mine.length, seedRows.length - 2);
  const ref = conceptRefOf(bySlug('wikidata-anatomia-q9597'));
  assert.deepEqual(ref, { system: 'wikidata-anatomia', code: 'Q9597', slug: 'wikidata-anatomia-q9597' });
  assert.equal(resolveConceptRef(ref, universe)?.esName, 'Abdomen');
  assert.equal(resolveConceptRef({ ...ref, code: 'Q1' }, universe), null);
  assert.equal(resolveConceptRef({ ...ref, slug: 'no-existe' }, universe), null);
  assert.equal(resolveConceptRef({ system: 'medlineplus-es', code: '6356', slug: 'medlineplus-es-6356' }, universe), null);
});

test('cleanText quita caracteres de ancho cero reales de Wikidata sin tocar palabras', () => {
  // Q21120235: la descripción real de Wikidata empieza con U+200B y un espacio.
  assert.equal(cleanText('\u200b el color de orina distinto al amarillo pálido'), 'el color de orina distinto al amarillo pálido');
  assert.equal(cleanText('ciertos tipos de cáncer se asocian con la trombosis venosa\u200b y la hipercoagulabilidad'), 'ciertos tipos de cáncer se asocian con la trombosis venosa y la hipercoagulabilidad');
  assert.equal(cleanText(null), null);
});
