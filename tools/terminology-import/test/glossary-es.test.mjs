// Pruebas del parseo/normalización de los importadores del glosario ES.
// Fixtures: recortes REALES de las fuentes (tablas de referencia CIE-10-ES 2026,
// respuestas de CIMA del 2026-09-30, XML de MedlinePlus del 2026-09-30, guía
// «17-hidroxiprogesterona»), salvo el CSV de LOINC, que es sintético y está
// marcado como tal (no hay archivo real sin cuenta de loinc.org).
// Correr: node --test tools/terminology-import/test/

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { assertRow, deterministicId, htmlToText, slugify } from '../lib/glossary-es/common.mjs';
import { dxParentCode, dxRows, pxRows } from '../lib/glossary-es/cie10es.mjs';
import { pickReferenceProduct, toProduct, toSection, toVtmRow } from '../lib/glossary-es/cima.mjs';
import { labPageRow, parseTopics, topicRows } from '../lib/glossary-es/medlineplus.mjs';
import { applyImage, indexImages } from '../lib/glossary-es/enrich.mjs';
import { commonsImageInfo, fileNameFromCommonsUrl } from '../lib/glossary-es/wikidata.mjs';
import { loincEsRows, parseCsv } from '../lib/glossary-es/loinc-es.mjs';
import { conceptId, membershipsFor, md5uuid, propertiesFor, valueSetVersionId } from '../lib/glossary-es/load-plan.mjs';
import { atcTags, dxTaxonomy, medlineplusTaxonomy, pcsTaxonomy } from '../lib/glossary-es/taxonomy.mjs';

const FX = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');
const fx = (f) => readFileSync(join(FX, f), 'utf8');
const PROV = { sourceUrl: 'https://example.invalid/src', retrievedAt: '2026-09-30T00:00:00.000Z', sourceName: 'fixture' };

test('deterministicId replica exacta de src/common/constants/concepts.ts', () => {
  // Valores obtenidos corriendo la función TypeScript original (node --experimental-strip-types).
  assert.equal(deterministicId('terminology:state:active'), 'beff218d-ac3a-5e2c-844b-d21461dbdf5a');
  assert.equal(deterministicId('terminology:language:es'), '1e0b7669-d4d8-5c0f-9544-182a5fe60651');
});

test('md5uuid equivale a md5(key)::uuid de Postgres', () => {
  // md5('abc') = 900150983cd24fb0d6963f7d28e17f72
  assert.equal(md5uuid('abc'), '90015098-3cd2-4fb0-d696-3f7d28e17f72');
});

test('slugify y htmlToText', () => {
  assert.equal(slugify('J45.909'), 'j45-909');
  assert.equal(slugify('Ácido Acetilsalicílico'), 'acido-acetilsalicilico');
  assert.equal(htmlToText('<p>Uno&#160;&amp; dos</p><ul><li>a</li></ul>'), 'Uno & dos\n\n• a');
});

test('CIE-10-ES diagnósticos: jerarquía, marcadores y categoría desde el capítulo', () => {
  const rows = dxRows(JSON.parse(fx('cie10es-dx-rows.json')), PROV).map(assertRow);
  const j45909 = rows.find((r) => r.code === 'J45.909');
  assert.ok(j45909, 'J45.909 presente');
  assert.equal(j45909.esName, 'Asma no especificada, sin complicaciones');
  assert.equal(j45909.definition, null, 'la fuente no trae definición y no se inventa');
  assert.equal(j45909.categoryKey, 'disease');
  assert.deepEqual(j45909.tagKeys, ['respiratory']);
  assert.deepEqual(j45909.hierarchy.map((h) => h.code), ['Cap.10', 'J40-J4A', 'J45', 'J45.9', 'J45.90']);
  assert.equal(j45909.flags.final, true);
  assert.ok(!rows.some((r) => r.code.startsWith('Cap.') || /-/.test(r.code)), 'capítulos y bloques no son términos');
  const o80 = rows.find((r) => r.code === 'O80');
  assert.ok(o80.tagKeys.includes('gyn-ob'));
  assert.equal(rows.find((r) => r.code === 'R05').categoryKey, 'signs-symptoms');
  assert.equal(dxParentCode('J45.909'), 'J45.90');
  assert.equal(dxParentCode('J45.9'), 'J45');
  assert.equal(dxParentCode('J45'), null);
});

test('CIE-10-ES procedimientos: categoría por sección ICD-10-PCS', () => {
  const rows = pxRows(JSON.parse(fx('cie10es-px-rows.json')), PROV).map(assertRow);
  const by = Object.fromEntries(rows.map((r) => [r.code[0] + (r.code[0] === 'F' ? r.code[1] : ''), r.categoryKey]));
  assert.equal(by['0'], 'procedure');
  assert.equal(by.B, 'imaging');
  assert.equal(by.F0, 'treatment');
  assert.equal(by.F1, 'diagnostic-test');
  assert.equal(by['3'], 'treatment');
  assert.equal(by['4'], 'diagnostic-test');
  assert.equal(pcsTaxonomy('BW03ZZZ').categoryKey, 'imaging');
});

test('taxonomías: ATC, capítulos y grupos MedlinePlus', () => {
  assert.deepEqual(atcTags(['N02BE01']), ['neurologic']);
  assert.deepEqual(atcTags(['N06AB03']), ['mental-health']);
  assert.deepEqual(atcTags(['A10BA02']), ['endocrine']);
  assert.deepEqual(dxTaxonomy('Z00.00').categoryKey, 'other');
  assert.equal(medlineplusTaxonomy(['Pruebas de diagnóstico', 'Sangre, corazón y circulación']).categoryKey, 'diagnostic-test');
  assert.equal(medlineplusTaxonomy(['Bienestar y estilo de vida']).categoryKey, 'other');
});

test('CIMA: un término por VTM, ficha técnica verbatim con cita, fotos y ATC', () => {
  const f = JSON.parse(fx('cima-vtm-449005.json'));
  const products = f.list.map((r) => toProduct(r, f.detail[r.nregistro]));
  const ref = pickReferenceProduct(products);
  assert.ok(ref, 'hay producto de referencia');
  const sections = Object.entries(f.sections).map(([s, resp]) => toSection(s, resp, ref, PROV.retrievedAt)).filter(Boolean);
  const row = assertRow(toVtmRow(f.list[0].vtm, products, sections, PROV.retrievedAt));
  assert.equal(row.slug, 'cima-vtm-449005');
  assert.equal(row.categoryKey, 'pharmacology');
  assert.ok(row.drugFacts.atc.some((a) => a.code === 'J01CE09'), 'ATC verbatim de CIMA');
  assert.deepEqual(row.tagKeys, ['infectious']);
  const s41 = row.drugFacts.sections.find((s) => s.section === '4.1');
  assert.ok(s41.text.startsWith('Procesos infecciosos producidos por microorganismos sensibles a la penicilina'));
  assert.match(s41.citation, /AEMPS\. CIMA\. Ficha técnica de .+ \(nº reg\. \d+\), sección 4\.1/);
  assert.equal(row.definition, s41.text, 'la definición es la 4.1 verbatim');
  assert.equal(row.drugFacts.productCount, f.list.length);
});

test('MedlinePlus: tema en español con resumen verbatim, sinónimos, MeSH del tema inglés', () => {
  const topics = parseTopics(fx('medlineplus-topics.xml'));
  const rows = topicRows(topics, { retrievedAt: PROV.retrievedAt, xmlUrl: 'x' }).map(assertRow);
  assert.equal(rows.length, 1);
  const r = rows[0];
  assert.equal(r.esName, 'Aborto');
  assert.ok(r.esSynonyms.includes('Aborto inducido'));
  assert.ok(r.definition.startsWith('Un aborto inducido es un procedimiento para terminar un embarazo.'));
  assert.ok(r.externalIds.mesh?.length > 0, 'MeSH tomado del tema inglés mapeado');
  assert.ok(r.tagKeys.includes('gyn-ob'));
});

test('MedlinePlus pruebas: «¿Qué es…?» verbatim, «Otros nombres» como sinónimos, categoría lab', () => {
  const url = 'https://medlineplus.gov/spanish/pruebas-de-laboratorio/17-hidroxiprogesterona/';
  const r = assertRow(labPageRow(url, fx('medlineplus-lab-17-hidroxiprogesterona.html'), { retrievedAt: PROV.retrievedAt }));
  assert.equal(r.esName, '17-hidroxiprogesterona');
  assert.ok(r.definition.startsWith('Una prueba de 17-hidroxiprogesterona mide la cantidad'));
  assert.ok(r.esSynonyms.includes('17-OHP'));
  assert.equal(r.categoryKey, 'lab');
  assert.equal(r.sourceUpdatedAt, '29 septiembre 2026');
});

test('Wikidata/Commons: atribución y licencia; unión sólo por código idéntico', () => {
  assert.equal(fileNameFromCommonsUrl('http://commons.wikimedia.org/wiki/Special:FilePath/Asthma%20attack.jpg'), 'Asthma attack.jpg');
  const info = commonsImageInfo({
    query: {
      pages: {
        1: {
          title: 'File:Asthma attack.jpg',
          imageinfo: [{ url: 'https://upload.wikimedia.org/a.jpg', thumburl: 'https://upload.wikimedia.org/t.jpg', descriptionurl: 'https://commons.wikimedia.org/wiki/File:Asthma_attack.jpg', extmetadata: { Artist: { value: '<a href="x">Autora</a>' }, LicenseShortName: { value: 'CC BY-SA 4.0' }, LicenseUrl: { value: 'https://creativecommons.org/licenses/by-sa/4.0' } } }],
        },
      },
    },
  });
  const im = info.get('Asthma attack.jpg');
  assert.equal(im.free, true);
  assert.equal(im.imageAttribution, 'Autora · CC BY-SA 4.0 · vía Wikimedia Commons');
  const idx = indexImages([
    { matchProperty: 'P4229', imageProperty: 'P18', code: 'J45.909', wikidataId: 'Q35869', file: 'a', matchPropertyName: 'ICD-10-CM', ...im, imageOrigin: 'wikimedia-commons' },
    { matchProperty: 'P4229', imageProperty: 'P18', code: 'J45.909', wikidataId: 'Q999999', file: 'b', matchPropertyName: 'ICD-10-CM', ...im, imageUrl: 'otra' },
  ]);
  const base = { codeSystem: 'cie10es-diagnosticos-2026', code: 'J45.909', imageUrl: null, externalIds: {} };
  const out = applyImage(base, idx);
  assert.equal(out.imageUrl, 'https://upload.wikimedia.org/a.jpg', 'gana el Q-id menor');
  assert.equal(out.externalIds.wikidata, 'Q35869');
  assert.equal(applyImage({ ...base, code: 'J45.90' }, idx).imageUrl, null, 'código distinto no se une');
});

test('LOINC ES (CSV SINTÉTICO): parser por cabecera y error explícito si faltan columnas', () => {
  assert.deepEqual(parseCsv('a,"b ""c""",d\n1,2,3\n'), [['a', 'b "c"', 'd'], ['1', '2', '3']]);
  const csv = 'LOINC_NUM,COMPONENT,CLASS,SHORTNAME,LONG_COMMON_NAME,RELATEDNAMES2\n0000-0,X,CHEM,Corto,Nombre largo de prueba sintética,Uno; Dos\n0001-0,Y,RAD,,Estudio sintético,\n';
  const rows = loincEsRows(csv, PROV).map(assertRow);
  assert.equal(rows.length, 2);
  assert.deepEqual(rows[0].esSynonyms, ['Corto', 'Uno', 'Dos']);
  assert.equal(rows[0].categoryKey, 'lab');
  assert.equal(rows[1].categoryKey, 'imaging');
  assert.throws(() => loincEsRows('CODE,NAME\n1,2\n', PROV), /Cabeceras encontradas: CODE, NAME/);
});

test('plan de carga: membresías a los value sets del glosario con los ids del backend', () => {
  const row = { slug: 'cie10es-dx-j45-909', categoryKey: 'disease', tagKeys: ['respiratory'], esName: 'Asma', esSynonyms: [], definition: null, source: 's', sourceName: 's', sourceUrl: 'u', sourceRetrievedAt: 'd', sourceLicense: 'l', reviewStatus: 'external-source', imageUrl: null, externalIds: {} };
  const m = membershipsFor(row);
  assert.deepEqual(m.map((x) => x.code), ['glossary-all-terms', 'glossary-category-disease', 'glossary-tag-respiratory']);
  assert.equal(m[0].versionId, valueSetVersionId('glossary-all-terms'));
  assert.equal(m[0].versionId, deterministicId('seed:value-set-version:glossary-all-terms:1'));
  assert.equal(m[0].conceptId, conceptId(row.slug));
  const props = propertiesFor(row).map((p) => p.code);
  assert.ok(props.includes('glossary-slug') && props.includes('glossary-provenance'));
  assert.ok(!props.includes('glossary-clinical-definition'), 'sin definición no se escribe la propiedad');
  assert.ok(propertiesFor(row).every((p) => p.value !== null && p.value !== undefined), 'value_json NOT NULL');
});

test('Anatomía Wikidata: verificación de dominio y de ids de propiedad', async () => {
  const { anatomyRow } = await import('../lib/glossary-es/wikidata-anatomy.mjs');
  const { assertEntityLabels, reachesClass } = await import('../lib/glossary-es/wikidata.mjs');
  const base = { q: 'Q3880559', esLabel: 'Canon EF 100-400mm', esDesc: null, enLabel: null, imgs: new Set(), aliases: new Set(), ta98: new Set(), ta2: new Set(['4.5']) };
  assert.throws(() => anatomyRow({ ...base, anatomyClassVerified: false }, new Map(), 'x'), /Fuera de dominio: Q3880559/);
  const ok = anatomyRow({ ...base, q: 'Q9612', esLabel: 'fémur', anatomyClassVerified: true }, new Map(), 'x');
  assert.equal(ok.categoryKey, 'anatomy');
  // Recorrido de clases con ciclo: lente → zoom lens → lens (no llega); hueso → … → estructura anatómica.
  const parents = new Map([['Q220310', ['Q192234']], ['Q192234', ['Q220310']], ['Q265868', ['Q4936952']]]);
  assert.equal(reachesClass(['Q220310'], 'Q4936952', parents), false);
  assert.equal(reachesClass(['Q265868'], 'Q4936952', parents), true);
  // P7863 es «aperture», no TA2: la verificación de etiquetas lo detecta.
  assert.throws(() => assertEntityLabels({ entities: { P7863: { labels: { en: { value: 'aperture' } } } } }, { P7863: 'TA2 ID' }), /P7863: esperado «TA2 ID», Wikidata dice «aperture»/);
});
