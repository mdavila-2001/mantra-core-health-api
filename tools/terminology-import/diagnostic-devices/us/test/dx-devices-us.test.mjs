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
import { parseCsv, readPipeDelimited, streamOpenFdaResults, streamXmlElements, writeNdjsonParts, xmlBlocks, xmlTag, xmlText } from '../lib/io.mjs';
import {
  ProductCodeTable,
  classificationFromFdadata,
  classificationFromFoiclass,
  from510kLineage,
  fromAccessGudidDelimited,
  fromFdadataPma,
  fromFdadataPmn,
  fromGudidXml,
  fromLivd,
  fromMaudeDevices,
  fromOpenFdaUdi,
  fromRecall,
  fromRlFlat,
  parseFlatMap,
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
  assert.throws(() => makeRecord({ source: 'fda-510k', sourceRecordId: 'K1', sourceUrl: 'https://x.test', sourceVersion: 'v', retrievedAt: '2026-01-01T00:00:00Z' }), /manufacturerName vacío/);
  const r = makeRecord({ source: 'fda-510k', sourceRecordId: 'K1', sourceUrl: 'https://x.test/K1', sourceVersion: 'v', retrievedAt: '2026-01-01T00:00:00Z', manufacturerName: 'M' });
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

test('GUDID XML real (Full Release, espejo dental): UDI-DI, modelo, GMDN con código', async () => {
  const t = new ProductCodeTable();
  t.observe('EHD', { regulationNumber: '872.1800', panel: 'Dental', deviceClass: '2' });
  const els = [];
  await streamXmlElements(Readable.from(fixture('gudid-dental.sample.xml').match(/[\s\S]{1,4096}/g)), 'device', (x) => els.push(x));
  assert.equal(els.length, 1);
  const r = fromGudidXml(els[0], t, PROV, { xmlTag, xmlBlocks });
  assert.deepEqual(validateRecord(r), []);
  assert.equal(r.udiDi, '08904269400590');
  assert.equal(r.brandName, 'Imagescan HD');
  assert.equal(r.manufacturerName, 'SKANRAY TECHNOLOGIES LIMITED');
  assert.equal(r.authorizationId, 'K170967');
  assert.equal(r.deviceTypeCode, 'EHD');
  assert.ok(r.model);
  assert.equal(r.extra.deviceTypes[0].system, 'gmdn');
  assert.match(r.extra.deviceTypes[0].code, /^\d+$/);
  assert.equal(fromGudidXml(els[0].replace('<productCode>EHD</productCode>', '<productCode>HRS</productCode>'), t, PROV, { xmlTag, xmlBlocks }), null);
  assert.equal(xmlText('A &amp; B &#233;'), 'A & B é');
  assert.equal(xmlTag('<a><catalogNumber xsi:nil="true" /></a>', 'catalogNumber'), null);
});

test('cargador: plan determinista, sin product codes sin nombre', async () => {
  const { buildPlan, md5Uuid } = await import('../load-dx-device-types-us.mjs');
  assert.equal(md5Uuid('abc'), '90015098-3cd2-4fb0-d696-3f7d28e17f72');
  const pcs = [
    { productCode: 'IYN', deviceName: 'System, Imaging, Pulsed Doppler, Ultrasonic', panel: 'RA', deviceClass: '2', regulationNumber: '892.1550', include: true, rule: 'subpart:892.1', reason: 'r', url: 'https://x.test/IYN' },
    { productCode: 'QQQ', deviceName: null, include: true, rule: 'x', reason: 'r', url: 'https://x.test/QQQ' },
    { productCode: 'HRS', deviceName: 'Plate', include: false, rule: 'subpart:888.3', reason: 'r', url: 'https://x.test/HRS' },
  ];
  const rows = [{ source: 'fda-510k', deviceTypeCode: 'IYN', manufacturerName: 'A Inc.' }, { source: 'fda-pma', deviceTypeCode: 'IYN', manufacturerName: 'A, Inc' }];
  const a = buildPlan(pcs, rows, 'v1');
  const b = buildPlan(pcs, rows, 'v1');
  assert.deepEqual(a, b);
  assert.equal(a.included, 2);
  assert.equal(a.skippedWithoutName, 1);
  assert.deepEqual(a.concepts.map((c) => c[2]), ['IYN']);
  const props = Object.fromEntries(a.properties.map((p) => [p[2], JSON.parse(p[4])]));
  assert.equal(props.registry_record_count, 2);
  assert.equal(props.manufacturer_count, 1, 'misma razón social normalizada');
  assert.deepEqual(props.registry_records_by_source, { 'fda-510k': 1, 'fda-pma': 1 });
});

test('Registration & Listing (archivos planos reales 2024): una fila por registro, listado y product code', () => {
  const t = new ProductCodeTable();
  t.addClassification({ product_code: 'IGF', device_name: 'Solution, Formalin-Alcohol-Acetic Acid', medical_specialty: 'PA', device_class: '1', regulation_number: '864.4010' });
  const { reg, link, pcd, owner } = JSON.parse(fixture('rl-flat.sample.json'));
  const r = fromRlFlat({ reg, link, pcd: pcd[0], owner, estabTypes: ['1'] }, t, PROV);
  assert.deepEqual(validateRecord(r), []);
  assert.equal(r.source, 'fda-rl');
  assert.equal(r.sourceRecordId, `${reg.REGISTRATION_NUMBER}|1017221179|IGF`);
  assert.equal(r.sourceUrl, 'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfRL/rl.cfm?lid=1017221179&lpcd=IGF');
  assert.equal(r.manufacturerCountry, 'US');
  assert.equal(r.manufacturerRegistryId, `fda-reg:${reg.REGISTRATION_NUMBER}`);
  assert.equal(r.brandName, null, 'los archivos planos no traen nombres propietarios');
  assert.equal(r.extra.ownerOperator.name, 'Diversified Chemical Products, Inc.');
  assert.equal(fromRlFlat({ reg, link, pcd: { ...pcd[0], PRODUCT_CODE: 'HRS' }, owner, estabTypes: [] }, t, PROV), null);
});

test('LIVD SARS-CoV-2 real: un kit por Testkit Name ID; UDI-DI sólo si el tipo es DIT', () => {
  const rows = parseCsv(fixture('livd.sample.csv'));
  const out = fromLivd(rows, { ...PROV, fileUrl: 'https://github.com/CDCgov/routes/blob/x/LIVD.csv' });
  assert.equal(out.length, 2);
  for (const r of out) assert.deepEqual(validateRecord(r), []);
  const lucira = out.find((r) => r.sourceRecordId === '00810055970001');
  assert.equal(lucira.udiDi, '00810055970001');
  assert.equal(lucira.manufacturerName, 'Lucira Health, Inc.');
  const kit = out.find((r) => r.sourceRecordId !== '00810055970001');
  assert.equal(kit.udiDi, null);
  assert.equal(kit.extra.livdRows, rows.filter((x) => x['Testkit Name ID'] === kit.sourceRecordId).length);
  assert.ok(kit.extra.equipment.length >= 1);
});

test('MAUDE real: una fila por product code + fabricante + marca + modelo, id = informe más antiguo', () => {
  const t = new ProductCodeTable();
  t.addClassification({ product_code: 'DQA', device_name: 'Oximeter', medical_specialty: 'CV', device_class: '2', regulation_number: '870.2700' });
  t.addClassification({ product_code: 'MCM', device_name: 'Implant, Cochlear', medical_specialty: 'EN', device_class: '3', regulation_number: '874.3340' });
  const rows = parseCsv(fixture('maude-devices.sample.csv'));
  const out = fromMaudeDevices(rows, t, PROV);
  assert.equal(out.length, 1, 'el implante coclear queda fuera; las dos filas DQA son la misma combinación');
  const r = out[0];
  assert.deepEqual(validateRecord(r), []);
  assert.equal(r.source, 'fda-maude');
  assert.equal(r.brandName, 'EarlyVue VS30');
  assert.equal(r.extra.reportCount, 2);
  const minKey = Math.min(...rows.filter((x) => x.device_report_product_code === 'DQA').map((x) => Number(x.mdr_report_key)));
  assert.equal(r.sourceRecordId.split(':')[0], String(minKey));
  assert.match(r.sourceUrl, /cfmaude\/detail\.cfm\?mdrfoi__id=\d+&pc=DQA$/);
});

test('retiros reales (enforcement y recall): una fila por número Z, estado verbatim', () => {
  const t = new ProductCodeTable();
  t.addClassification({ product_code: 'DQA', device_name: 'Oximeter', medical_specialty: 'CV', device_class: '2', regulation_number: '870.2700' });
  const out = ndjson('recalls.sample.ndjson').map((r) => fromRecall(r, t, PROV));
  assert.equal(out.length, 3);
  for (const r of out) {
    assert.deepEqual(validateRecord(r), []);
    assert.equal(r.source, 'fda-recall');
    assert.match(r.sourceRecordId, /^Z-\d{4}-\d{4}$/);
    assert.ok(r.manufacturerName);
  }
  assert.equal(fromRecall({ ...ndjson('recalls.sample.ndjson')[0], product_code: 'HRS' }, t, PROV), null);
});

test('MAUDE aplanado como mapa de texto: sólo corta en claves conocidas', () => {
  const m = parseFlatMap('[{device_event_key=127, brand_name=HI-LO- TRACHEAL TUBE CUFFED, MURPHY EYE, model_number=86114, device_report_product_code=BSK}]', ['device_event_key', 'brand_name', 'model_number', 'device_report_product_code']);
  assert.equal(m.brand_name, 'HI-LO- TRACHEAL TUBE CUFFED, MURPHY EYE');
  assert.equal(m.model_number, '86114');
  assert.equal(m.device_report_product_code, 'BSK');
});

test('cargador: la versión del code system sale de la clasificación (oficial primero)', async () => {
  const { codeSystemVersion } = await import('../load-dx-device-types-us.mjs');
  const official = { official: [{ dest: 'openfda/device/classification/device-classification-0001-of-0001.json.zip', exportDate: '2026-10-21' }], inputs: [{ source: 'mirror ej86 foiclass.csv', version: 'FDA foiclass.zip espejo' }], files: [{ sourceVersion: 'Archivos masivos MAUDE' }] };
  assert.equal(codeSystemVersion(official), 'openFDA device/classification export 2026-10-21');
  assert.equal(codeSystemVersion({ inputs: official.inputs, files: official.files }), 'FDA foiclass.zip espejo', 'sin oficial: la del espejo de clasificación, nunca la de MAUDE');
  assert.equal(codeSystemVersion({}), 'desconocida');
});
