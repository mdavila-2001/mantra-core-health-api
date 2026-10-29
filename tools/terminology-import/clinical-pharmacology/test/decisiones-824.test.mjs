// Farmacología clínica · las cuatro decisiones del propietario (2026-10-26, issue 824).
//   1. Posología: audiencia `professional` en toda sección.
//   2. El corpus por producto (~2,2 GB) no entra en `data/`: sólo por principio activo.
//   3. eEML: sólo referencias (ids y enlaces), sin su texto.
//   4. Fichas de CIMA sin fecha: se cargan marcadas «sin fecha», no se descartan.
// Fixtures pequeños; sin red. Correr: node --test tools/terminology-import/clinical-pharmacology/test/

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { cimaProduct, cimaSections, referenceDocuments } from '../lib/cima.mjs';
import { EML_SOURCE, emlReferencesFromSections } from '../lib/eml.mjs';
import { PROPERTY, loadableMonograph, planFor } from '../lib/load-plan.mjs';
import { assertSection, atcNameIndex, buildMonograph, hasVersion } from '../lib/monograph.mjs';
import { openFdaSections, referenceLabels, labelIdentity } from '../lib/openfda.mjs';
import { GRANULARITIES, monographsOutputs } from '../lib/paths.mjs';
import { AUDIENCE_PROFESSIONAL, sectionPropertyCode } from '../lib/sections.mjs';
import { PACKABLE, assertPackable, assertRouteGranularity } from '../pack-data.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const CP_ROOT = join(HERE, '..');
const REPO_ROOT = join(HERE, '..', '..', '..', '..');
const read = (p) => JSON.parse(readFileSync(join(HERE, p), 'utf8'));
const WHEN = '2026-10-26T00:00:00.000Z';

const penicilina = read('../../test/fixtures/cima-vtm-449005.json');
const penicilinaProducts = penicilina.list.map((r) => cimaProduct(r, penicilina.detail[r.nregistro]));
const penicilinaDoc = Object.values(penicilina.sections).flat();
// La ficha real trae 4.1 y 4.3; se le agrega una 4.2 mínima para ejercitar la posología (el texto es de prueba).
const posologyItem = { seccion: '4.2', titulo: 'Posología y forma de administración', contenido: '<p>Dosis de prueba.</p>', orden: 3 };
const docWithPosology = [...penicilinaDoc, posologyItem];
const names = atcNameIndex({ products: penicilinaProducts });
const refDoc = referenceDocuments(penicilinaProducts)[0];

const monographOf = (sections, extra = {}) => buildMonograph({ code: 'J01CE09', names, cimaProducts: penicilinaProducts, sections, ...extra });
const propertiesOf = (plan, code) => plan.properties.filter((p) => p[2] === code).map((p) => JSON.parse(p[4]));

// --- 1. Posología `professional` -----------------------------------------------------------------

test('decisión 1: la posología de CIMA y la de openFDA salen marcadas `professional`', () => {
  const cima = cimaSections(docWithPosology, refDoc, WHEN).find((s) => s.key === 'posology');
  assert.ok(cima, 'la ficha trae 4.2');
  assert.equal(cima.audience, AUDIENCE_PROFESSIONAL);
  assert.equal(cima.audience, 'professional');

  const labels = read('fixtures/openfda-labels-real.json');
  const label = Object.values(labels).find((l) => l.dosage_and_administration);
  assert.ok(label, 'el fixture real trae dosage_and_administration');
  const ref = referenceLabels([labelIdentity(label)], labelIdentity(label).unii)[0];
  const fda = openFdaSections(label, ref, WHEN).find((s) => s.key === 'posology');
  assert.ok(fda);
  assert.equal(fda.audience, 'professional');
});

test('decisión 1: una sección sin audiencia `professional` (posología incluida) no se publica ni se carga', () => {
  const posology = cimaSections(docWithPosology, refDoc, WHEN).find((s) => s.key === 'posology');
  assert.doesNotThrow(() => assertSection(posology));
  for (const audience of [undefined, null, '', 'public', 'patient']) {
    const bad = { ...posology, audience };
    assert.throws(() => assertSection(bad), /sin audiencia «professional»/, `audiencia ${String(audience)}`);
    assert.throws(() => planFor([monographOf([bad])]), /sin audiencia «professional»/, `el plan de carga también la rechaza (${String(audience)})`);
  }
});

test('decisión 1: la fila de posología cargada lleva `audience: professional` en su value_json', () => {
  const sections = cimaSections(docWithPosology, refDoc, WHEN).map(assertSection);
  const plan = planFor([monographOf(sections)], '2026-10-26');
  const rows = propertiesOf(plan, sectionPropertyCode('posology'));
  assert.equal(rows.length, 1);
  assert.equal(rows[0].audience, 'professional');
  assert.equal(rows[0].text, 'Dosis de prueba.');
  assert.ok(propertiesOf(plan, sectionPropertyCode('indications')).every((r) => r.audience === 'professional'), 'toda sección, no sólo la posología');
});

// --- 2. Sin corpus por producto en data/ ---------------------------------------------------------

test('decisión 2: `--granularity product` escribe en out/product/, aparte del corpus por vía', () => {
  assert.deepEqual([...GRANULARITIES], ['route', 'product']);
  const route = monographsOutputs('route');
  const product = monographsOutputs('product');
  assert.match(route.ndjson, /[\\/]out[\\/]monographs\.ndjson$/);
  assert.match(product.ndjson, /[\\/]out[\\/]product[\\/]monographs\.product\.ndjson$/);
  assert.match(product.meta, /[\\/]out[\\/]product[\\/]monographs\.product\.meta\.json$/);
  assert.notEqual(route.ndjson, product.ndjson);
  assert.notEqual(route.meta, product.meta);
  assert.throws(() => monographsOutputs('producto'), /Granularidad desconocida/);
});

test('decisión 2: pack-data sólo empaqueta la lista cerrada y rechaza el corpus por producto', () => {
  assert.deepEqual([...PACKABLE], ['monographs', 'gsrs-entries']);
  for (const name of PACKABLE) assert.equal(assertPackable(name), name);
  for (const name of ['monographs.product', 'monographs-product', 'product/monographs', 'Monographs.Product']) assert.throws(() => assertPackable(name), /corpus por producto/, name);
  assert.throws(() => assertPackable('otro'), /no está en la lista/);
  assert.doesNotThrow(() => assertRouteGranularity({ granularity: 'route' }));
  assert.doesNotThrow(() => assertRouteGranularity(undefined));
  assert.throws(() => assertRouteGranularity({ granularity: 'product' }), /sólo se empaqueta la de vía/);
});

test('decisión 2: data/ versionada no contiene ningún archivo por producto, y .gitignore lo cierra', () => {
  const manifest = JSON.parse(readFileSync(join(CP_ROOT, 'data', 'MANIFEST.json'), 'utf8'));
  assert.ok(manifest.files.length > 0);
  const offenders = manifest.files.filter((f) => /product/i.test(f.name) || /product/i.test(f.from));
  assert.deepEqual(offenders, [], 'el MANIFEST no lista corpus por producto');
  assert.ok(manifest.files.every((f) => f.bytes < 45 * 1024 * 1024), 'ninguna parte supera el tope de 45 MB');
  assert.deepEqual(Object.keys(manifest.ndjson).sort(), [...PACKABLE].sort());
  const gitignore = readFileSync(join(REPO_ROOT, '.gitignore'), 'utf8');
  assert.match(gitignore, /^\/tools\/terminology-import\/clinical-pharmacology\/data\/\*product\*$/m);
  assert.match(gitignore, /^\/tools\/terminology-import\/clinical-pharmacology\/out\/$/m);
  assert.ok(!existsSync(join(CP_ROOT, 'data', 'monographs.product.ndjson.gz')));
});

// --- 3. eEML: sólo referencias -------------------------------------------------------------------

// Fila de la eEML tal como la escribía el corpus anterior a la decisión (recortada de la recomendación 349 real, consulta 2026-10-24).
const legacyEmlRow = (key, number, text, extra = {}) => ({
  key,
  source: EML_SOURCE,
  sourceName: 'WHO Electronic Essential Medicines List (eEML)',
  language: 'en',
  audience: 'professional',
  document: { type: 'eml-recommendation', id: '349', title: 'fluoride', version: null, effectiveDate: '2023-04-28', emlSection: '30. Dental medicines and preparations', list: 'CoreList', includedInEmlc: true, url: 'https://list.essentialmeds.org/recommendations/349', pageUrl: 'https://list.essentialmeds.org/recommendations/349', alsoIn: ['350'] },
  section: { number, title: null, url: 'https://list.essentialmeds.org/recommendations/349', apiUrl: 'https://list.essentialmeds.org/recommendations/349.jsonld' },
  html: null,
  text,
  tables: [],
  textSha256: 'f99bff195e3604a158b28fd91f73fab64cb04e0f8a0f01ba5a5796d2fc834448',
  retrievedAt: '2026-10-24T17:36:27.099Z',
  license: 'Atribución exigida por la OMS ...',
  citation: 'World Health Organization. ...',
  selection: { criterion: 'Todas las recomendaciones vigentes de la eEML con ese ATC 5 asignado por la propia OMS.', group: { atc: ['A01AA01'], atcRaw: ['A01AA01'] } },
  ...extra,
});
const legacyEml = () => [
  legacyEmlRow('indications', 'guidelineSubject.indication', 'Dental caries', { codes: [{ system: 'ICD-11', code: 'DA08.0', uri: 'http://id.who.int/icd/entity/1983306720' }] }),
  legacyEmlRow('pharmaceutical_form', 'drugUnit', 'Local > Dental > Gel: 2500 to 12500 ppm fluoride (any type)'),
];

test('decisión 3: un corpus con filas de texto de la eEML se carga como referencias, sin texto', () => {
  const cima = cimaSections(penicilinaDoc, refDoc, WHEN).map(assertSection);
  const m = { ...monographOf([...cima, ...legacyEml()]), code: 'J01CE09' };
  assert.ok(m.coverage[EML_SOURCE], 'el corpus anterior contaba la eEML como cobertura');

  const loaded = loadableMonograph(m);
  assert.equal(loaded.sections.some((s) => s.source === EML_SOURCE), false, 'ninguna sección de la eEML');
  assert.equal(loaded.sections.length, cima.length, 'las demás fuentes quedan intactas');
  assert.equal(EML_SOURCE in loaded.coverage, false);
  const refs = loaded.externalDocuments.filter((d) => d.source === EML_SOURCE);
  assert.deepEqual(refs.map((r) => r.document.id), ['349', '350'], 'la recomendación y la que repetía su texto (alsoIn)');
  assert.deepEqual(refs[0].atc5, ['A01AA01']);
  assert.deepEqual(refs[0].icd11, { code: 'DA08.0', uri: 'http://id.who.int/icd/entity/1983306720' });
  assert.equal(refs[0].document.url, 'https://list.essentialmeds.org/recommendations/349');
  assert.equal(refs[0].document.jsonUrl, 'https://list.essentialmeds.org/recommendations/349.jsonld');
  assert.equal(refs[0].document.effectiveDate, '2023-04-28');
  assert.equal(refs[1].document.url, 'https://list.essentialmeds.org/recommendations/350');
  const serialized = JSON.stringify(refs);
  for (const text of ['Dental caries', 'ppm fluoride', 'Dental medicines', 'fluoride']) assert.ok(!serialized.includes(text), `la referencia no debe contener «${text}»`);
  assert.deepEqual(emlReferencesFromSections(m.sections).map((r) => r.document.id), ['349', '350']);
});

test('decisión 3: el plan de carga no escribe filas de sección de la eEML y guarda las referencias', () => {
  const m = monographOf([...legacyEml()]);
  const plan = planFor([m], '2026-10-26');
  const sectionRows = plan.properties.filter((p) => p[2].startsWith('pharmacology_section_') && p[2] !== PROPERTY.COVERAGE);
  assert.equal(sectionRows.length, 0, 'sin secciones: la eEML sólo es referencia');
  const stored = propertiesOf(plan, PROPERTY.EXTERNAL_DOCUMENTS);
  assert.equal(stored.length, 1);
  assert.deepEqual(stored[0].map((r) => r.document.id), ['349', '350']);
  assert.ok(!plan.properties.some((p) => p[4].includes('Dental caries') || p[4].includes('ppm fluoride')), 'ninguna fila del plan contiene el texto de la OMS');
  const again = planFor([JSON.parse(JSON.stringify(m))], '2026-10-26');
  assert.deepEqual(plan.properties.map((p) => p[0]), again.properties.map((p) => p[0]), 'ids deterministas');
});

test('decisión 3: una monografía sin filas de la eEML no cambia al cargarse', () => {
  const cima = cimaSections(penicilinaDoc, refDoc, WHEN).map(assertSection);
  const m = monographOf(cima);
  assert.equal(loadableMonograph(m), m);
});

// --- 4. Fichas sin fecha: marcadas, no descartadas -----------------------------------------------

test('decisión 4: la ficha de CIMA sin fecha entra con marca de antigüedad desconocida y fecha de consulta', () => {
  const undated = { ...penicilinaProducts[0], fichaTecnicaDate: null };
  const rows = cimaSections(penicilinaDoc, { product: undated, criterion: 'prueba', group: {} }, WHEN);
  assert.ok(rows.length > 0, 'se generan sus secciones');
  for (const row of rows) {
    assert.equal(row.document.versionUnpublished, true);
    assert.equal(row.document.version, null);
    assert.equal(row.document.revisionDateInText, null);
    assert.match(row.document.versionNote, /no publica la fecha/);
    assert.match(row.citation, /sin fecha de versión publicada por CIMA/);
    assert.equal(row.retrievedAt, WHEN, 'vale la fecha de consulta');
    assert.equal(hasVersion(row), true, 'el filtro de versión del armado no la descarta');
    assert.doesNotThrow(() => assertSection(row));
  }
});

test('decisión 4: sin fecha de fuente ni de consulta sí queda fuera, y con fecha no se marca', () => {
  const undated = cimaSections(penicilinaDoc, { product: { ...penicilinaProducts[0], fichaTecnicaDate: null }, criterion: 'prueba', group: {} }, WHEN)[0];
  assert.equal(hasVersion({ ...undated, retrievedAt: null }), false, 'la marca sola no basta: hace falta la fecha de consulta');
  const dated = cimaSections(penicilinaDoc, refDoc, WHEN)[0];
  assert.equal(dated.document.versionUnpublished, undefined);
  assert.equal(hasVersion(dated), true);
});

test('decisión 4: la marca llega a la fila cargada (value_json) para que la lectura la exponga', () => {
  const undated = cimaSections(penicilinaDoc, { product: { ...penicilinaProducts[0], fichaTecnicaDate: null }, criterion: 'prueba', group: {} }, WHEN).map(assertSection);
  const dated = cimaSections(penicilinaDoc, refDoc, WHEN).map(assertSection);
  const plan = planFor([monographOf([...undated, ...dated])], '2026-10-26');
  const rows = propertiesOf(plan, sectionPropertyCode('indications'));
  assert.equal(rows.length, 2, 'una con fecha y otra sin fecha: las dos se cargan');
  assert.equal(rows.filter((r) => r.document.versionUnpublished === true).length, 1);
  assert.equal(rows.filter((r) => r.document.versionUnpublished === undefined).length, 1);
});
