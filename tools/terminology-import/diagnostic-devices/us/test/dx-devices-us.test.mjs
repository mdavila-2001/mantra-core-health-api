// Tests del importador FDA de equipos de diagnóstico.
//   node --test tools/terminology-import/diagnostic-devices/us/test/
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { test } from 'node:test';
import { gunzipSync } from 'node:zlib';
import { FIELDS, fdaRiskClass, isoDate, makeRecord, manufacturerKey, validateRecord } from '../lib/format.mjs';
import { parseCsv, readPipeDelimited, streamOpenFdaResults, writeNdjsonParts } from '../lib/io.mjs';
import {
  ProductCodeTable,
  classificationFromFdadata,
  classificationFromFoiclass,
  from510kLineage,
  fromAccessGudidDelimited,
  fromFdadataPma,
  fromFdadataPmn,
  fromOpenFdaUdi,
  regulationFromNumber,
} from '../lib/normalize.mjs';
import { classifyScope, panelCode, parseRegulation } from '../lib/scope.mjs';

const FIX = new URL('./fixtures/', import.meta.url);
const fixture = (name) => readFileSync(new URL(name, FIX), 'utf8');

const PROV = { sourceVersion: 'test', retrievedAt: '2026-08-17T20:39:37.000Z', via: { kind: 'mirror' } };

test('scope: subpartes diagnósticas dentro, terapéuticas y prostéticas fuera', () => {
  const s = (regulationNumber, productCode = 'XXX', panel = null) => classifyScope({ productCode, regulationNumber, panel });
  assert.equal(s('870.1130').include, true, 'tensiómetro no invasivo (870 Subpart B)');
  assert.equal(s('870.2700').include, true, 'oxímetro (870 Subpart C, monitoreo)');
  assert.equal(s('870.3450').include, false, 'injerto vascular (Subpart D, prostético)');
  assert.equal(s('892.1550').include, true, 'ecógrafo');
  assert.equal(s('892.2050').include, true, 'PACS / procesamiento de imagen (892.2xxx sigue en Subpart B)');
  assert.equal(s('892.5050').include, false, 'radioterapia (Subpart F)');
  assert.equal(s('892.6500').include, false, 'blindaje radiológico');
  assert.equal(s('862.1345').include, true, 'glucómetro');
  assert.equal(s('864.3700').include, true, 'patología digital (whole slide imaging)');
  assert.equal(s('880.2910').include, true, 'termómetro electrónico');
  assert.equal(s('880.2800').include, false, 'indicador de esterilización');
  assert.equal(s('874.4770').include, true, 'otoscopio (excepción explícita en Subpart E)');
  assert.equal(s('874.4420').include, false, 'instrumental quirúrgico ORL');
  assert.equal(s('864.9100').include, false, 'bolsa de sangre (Subpart J)');
  assert.equal(s('864.9300').include, true, 'Coombs automatizado (excepción en Subpart J)');
  assert.equal(s('878.4580', 'PSN').include, true, 'PSN: dermatoscopios');
  assert.equal(s('876.1500', 'NAY').include, false, 'robot quirúrgico bajo 876.1500');
  assert.equal(s('892.8200').include, false, 'subparte sin verificar → fuera');
  assert.match(s('892.8200').rule, /unverified/);
  assert.equal(s('', 'ZZZ', 'Microbiology').include, true, 'sin regulación, panel IVD');
  assert.equal(s('', 'ZZZ', 'Orthopedic').include, false, 'sin regulación, panel no IVD');
});

test('scope: helpers', () => {
  assert.deepEqual(parseRegulation('870.1130'), { part: '870', subpart: '1', section: '870.1130' });
  assert.equal(parseRegulation('abc'), null);
  assert.equal(panelCode('Clinical Chemistry'), 'CH');
  assert.equal(panelCode('ra'), 'RA');
  assert.equal(panelCode('Unknown'), null);
});

test('format: clase, fechas, claves', () => {
  assert.equal(fdaRiskClass('2'), 'fda:2');
  assert.equal(fdaRiskClass('U'), 'fda:U');
  assert.equal(fdaRiskClass('f'), 'fda:f');
  assert.equal(fdaRiskClass(''), null);
  assert.equal(isoDate('20250804'), '2025-08-04');
  assert.equal(isoDate('8/4/2025'), '2025-08-04');
  assert.equal(isoDate('2025-08-04T00:00:00Z'), '2025-08-04');
  assert.equal(manufacturerKey('Shenzhen Mindray Bio-Medical Electronics Co., Ltd.'), 'SHENZHEN MINDRAY BIO MEDICAL ELECTRONICS');
  assert.equal(manufacturerKey('GE Healthcare, Inc.'), manufacturerKey('GE HEALTHCARE INC'));
});

test('format: makeRecord exige procedencia y las 18 claves', () => {
  assert.throws(() => makeRecord({ source: 'fda-510k', sourceRecordId: 'K1' }), /sourceUrl vacío/);
  const r = makeRecord({ source: 'fda-510k', sourceRecordId: 'K1', sourceUrl: 'https://x.test/K1', sourceVersion: 'v', retrievedAt: '2026-01-01T00:00:00Z' });
  assert.deepEqual(Object.keys(r), FIELDS);
  assert.deepEqual(validateRecord({ ...r, riskClass: 'FDA:II' }).length, 1);
});

test('510(k) espejo: filas reales → formato común, sólo las de alcance diagnóstico', () => {
  const rows = parseCsv(fixture('510k-lineage-devices.sample.csv'));
  const table = new ProductCodeTable();
  for (const r of rows) table.observe(r.product_code, { regulationNumber: r.regulation_number, panel: r.review_panel, deviceClass: r.device_class });
  const out = rows.map((r) => from510kLineage(r, table, PROV)).filter(Boolean);
  const ids = out.map((r) => r.sourceRecordId).sort();
  assert.deepEqual(ids, ['DEN990008', 'K000126', 'K110326', 'K152872', 'K192829', 'K200001']);
  for (const r of out) assert.deepEqual(validateRecord(r), []);
  const us = out.find((r) => r.sourceRecordId === 'K200001');
  assert.equal(us.source, 'fda-510k');
  assert.equal(us.deviceTypeCode, 'IYN');
  assert.equal(us.deviceTypeSystem, 'fda-product-code');
  assert.equal(us.manufacturerName, 'Shenzhen Mindray Bio-Medical Electronics Co., Ltd.');
  assert.equal(us.riskClass, 'fda:2');
  assert.equal(us.authorizationDate, '2020-04-09');
  assert.equal(us.sourceUrl, 'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpmn/pmn.cfm?ID=K200001');
  assert.equal(us.status, null);
  assert.equal(us.extra.panel, 'RA');
  const den = out.find((r) => r.sourceRecordId === 'DEN990008');
  assert.equal(den.source, 'fda-denovo');
  assert.match(den.sourceUrl, /denovo\.cfm\?ID=DEN990008$/);
});

test('io: streamOpenFdaResults recorre `results` sin cargar el archivo entero', async () => {
  // Forma de un archivo de openFDA (meta + results); el contenido es de prueba.
  const json = JSON.stringify({ meta: { last_updated: '2026-10-01', results: { total: 2 } }, results: [{ a: '{"x":[1]}' }, { b: { c: ['}', '"'] } }] });
  const chunks = json.match(/.{1,7}/gs);
  const got = [];
  const { count, meta } = await streamOpenFdaResults(Readable.from(chunks), (r) => got.push(r));
  assert.equal(count, 2);
  assert.equal(meta.last_updated, '2026-10-01');
  assert.deepEqual(got, [{ a: '{"x":[1]}' }, { b: { c: ['}', '"'] } }]);
});

test('io: readPipeDelimited con cabecera', async () => {
  const rows = [];
  const n = await readPipeDelimited(Readable.from(['PrimaryDI|productCode\n0001|IYN\n', '0002|DQA\n']), (r) => rows.push(r));
  assert.equal(n, 2);
  assert.deepEqual(rows[1], { PrimaryDI: '0002', productCode: 'DQA' });
});

test('io: writeNdjsonParts es determinista y parte por tamaño', () => {
  const dir = mkdtempSync(join(tmpdir(), 'dxus-'));
  try {
    const rows = Array.from({ length: 50 }, (_, i) => ({ i, pad: 'x'.repeat(100) }));
    const a = writeNdjsonParts(dir, 'fda-510k', rows, { maxBytes: 2000 });
    const b = writeNdjsonParts(dir, 'fda-510k', rows, { maxBytes: 2000 });
    assert.ok(a.length > 1);
    assert.deepEqual(a, b);
    assert.deepEqual(readdirSync(dir).sort(), a.map((p) => p.file).sort());
    assert.match(a[0].file, /^fda-510k-0001\.ndjson\.gz$/);
    const back = a.flatMap((p) => gunzipSync(readFileSync(join(dir, p.file))).toString().trim().split('\n').map(JSON.parse));
    assert.deepEqual(back, rows);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('GUDID: openFDA device/udi y AccessGUDID delimitado → formato común', () => {
  const table = new ProductCodeTable();
  table.observe('DQA', { regulationNumber: '870.2700', panel: 'Cardiovascular', deviceClass: '2', name: 'Oximeter' });
  table.observe('HRS', { regulationNumber: '888.3030', panel: 'Orthopedic', deviceClass: '2' });
  // Estructura de openFDA device/udi; valores de prueba (no son un equipo real).
  const udi = {
    identifiers: [{ id: '00000000000001', type: 'Primary', issuing_agency: 'GS1' }],
    product_codes: [{ code: 'DQA', name: 'Oximeter', openfda: { device_class: '2' } }],
    premarket_submissions: [{ submission_number: 'k000126' }],
    gmdn_terms: [{ name: 'Pulse oximeter', definition: 'def' }],
    brand_name: ' Marca ',
    version_or_model_number: 'M-1',
    company_name: 'Empresa de prueba',
    labeler_duns_number: '123456789',
    commercial_distribution_status: 'In Commercial Distribution',
  };
  const r = fromOpenFdaUdi(udi, table, PROV);
  assert.deepEqual(validateRecord(r), []);
  assert.equal(r.source, 'fda-gudid');
  assert.equal(r.udiDi, '00000000000001');
  assert.equal(r.brandName, 'Marca');
  assert.equal(r.model, 'M-1');
  assert.equal(r.authorizationId, 'K000126');
  assert.equal(r.manufacturerRegistryId, 'duns:123456789');
  assert.equal(r.status, 'In Commercial Distribution');
  assert.deepEqual(r.extra.deviceTypes, [{ system: 'gmdn-pt', code: null, name: 'Pulse oximeter', definition: 'def' }]);
  assert.equal(fromOpenFdaUdi({ ...udi, product_codes: [{ code: 'HRS' }] }, table, PROV), null, 'implante fuera de alcance');

  const d = fromAccessGudidDelimited(
    { PrimaryDI: '00000000000002', brandName: 'B', versionModelNumber: 'V', companyName: 'C', dunsNumber: '1', deviceCommDistributionStatus: 'In Commercial Distribution' },
    { productCodes: [{ productCode: 'HRS' }, { productCode: 'DQA' }], submissions: [{ submissionNumber: 'K000126' }], gmdn: [{ gmdnPTName: 'Pulse oximeter' }] },
    table,
    PROV,
  );
  assert.equal(d.deviceTypeCode, 'DQA', 'toma el primer product code en alcance');
  assert.deepEqual(d.extra.productCodes, ['HRS', 'DQA']);
});

test('tabla de product codes: la clasificación oficial pisa lo observado', () => {
  const t = new ProductCodeTable();
  t.observe('XYZ', { regulationNumber: '888.3030', panel: 'Orthopedic', deviceClass: '2' });
  assert.equal(t.scope('XYZ').include, false);
  t.addClassification({ product_code: 'XYZ', device_name: 'Analyzer', medical_specialty: 'CH', device_class: '2', regulation_number: '862.2160' });
  t.observe('XYZ', { regulationNumber: '888.3030', panel: 'Orthopedic', deviceClass: '2' });
  assert.equal(t.get('XYZ').regulationNumber, '862.2160');
  assert.equal(t.scope('XYZ').include, true);
  assert.equal(t.rows()[0].deviceName, 'Analyzer');
});

const ndjson = (name) => fixture(name).split('\n').filter(Boolean).map(JSON.parse);

function realTable() {
  const t = new ProductCodeTable();
  return readPipeDelimited(Readable.from([fixture('foiclass.sample.txt')]), (r) => t.addClassification(classificationFromFoiclass(r))).then(() => {
    for (const r of ndjson('fdadata-product-codes.sample.ndjson')) {
      const c = classificationFromFdadata(r);
      if (!t.get(c.product_code)) t.addClassification(c);
    }
    return t;
  });
}

test('clasificación: foiclass real y fdadata (regulación numérica con 4 decimales)', async () => {
  assert.equal(regulationFromNumber(868.582), '868.5820');
  assert.equal(regulationFromNumber('862.1118'), '862.1118');
  assert.equal(regulationFromNumber(null), null);
  const t = await realTable();
  assert.equal(t.get('ERA').name, 'Otoscope');
  assert.equal(t.get('DQA').panel, 'CV', 'medical specialty manda sobre review panel');
  assert.equal(t.scope('ERA').include, true);
  assert.equal(t.scope('HRS').include, false);
  assert.equal(t.get('MZP').classificationSource, 'fdadata:product_codes');
  assert.equal(t.scope('MZP').include, true);
});

test('fdadata pmn real: país ISO, estado verbatim, dirección', async () => {
  const t = await realTable();
  const out = ndjson('fdadata-pmn.sample.ndjson').map((r) => fromFdadataPmn(r, t, PROV)).filter(Boolean);
  assert.deepEqual(out.map((r) => r.sourceRecordId).sort(), ['DEN990008', 'K200001']);
  const k = out.find((r) => r.sourceRecordId === 'K200001');
  assert.deepEqual(validateRecord(k), []);
  assert.equal(k.manufacturerCountry, 'CN');
  assert.equal(k.status, 'Substantially Equivalent');
  assert.equal(k.deviceTypeName, 'System, Imaging, Pulsed Doppler, Ultrasonic');
  assert.match(k.extra.address, /Shenzhen/);
});

test('fdadata pma real: una fila por PMA y nombre comercial, suplementos contados', async () => {
  const t = await realTable();
  const rows = ndjson('fdadata-pma.sample.ndjson');
  const out = fromFdadataPma(rows, t, PROV);
  for (const r of out) assert.deepEqual(validateRecord(r), []);
  const v = (x) => (x === '<NA>' || x === null ? null : x.trim() || null);
  const names = new Set(rows.map((r) => (v(r.device) ?? v(r.generic_name) ?? '').toUpperCase()));
  assert.equal(out.length, names.size);
  const first = out.find((r) => r.sourceRecordId === 'P000010');
  assert.equal(first.manufacturerName, 'Roche Molecular Systems, Inc.');
  assert.equal(first.authorizationId, 'P000010');
  assert.equal(first.manufacturerCountry, null, 'el país de pma.zip no se usa (fdadata lo rellena)');
  assert.ok(out.reduce((n, r) => n + r.extra.recordsWithThisName, 0) === rows.length);
});
