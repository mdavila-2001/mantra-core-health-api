// Pruebas de los normalizadores ROW. Fixtures: extractos REALES de los espejos
// fijados en `sources.mjs` (ANVISA PROTAL y PRESERV EXTRA; ANVISA modelos
// TRIGLICERÍDEOS; PMDA オンコマイン Dx y フレスポイト; Health Canada ALINITY C
// PROTEINS ASSAY; TGA DAEN ARTG 125881, 282963 y 122873).
// Correr: node --test tools/terminology-import/diagnostic-devices/row/test/

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { TextDecoder } from 'node:util';
import { gunzipSync } from 'node:zlib';

import { parseCsv } from '../../../lib/medicine-catalog/common.mjs';
import {
  addPetitionLine,
  anvisaModelosRows,
  anvisaProdutosRows,
  anvisaUpdateStamp,
  freezePetitionIndex,
  splitSemicolonCsv,
} from '../lib/anvisa.mjs';
import { readDelimitedRows } from '../lib/lines.mjs';
import { cdscoRows, expandShowMore, parseCdscoLicence } from '../lib/cdsco.mjs';
import { indexMdall, mdallRows } from '../lib/hc-mdall.mjs';
import { PartWriter } from '../lib/out.mjs';
import { parseJmdnHeadline, parseJmdnPage } from '../lib/jmdn.mjs';
import { pmdaRows } from '../lib/pmda.mjs';
import {
  REQUIRED_FIELDS,
  dmyToIso,
  makeRow,
  rowErrors,
  textOrNull,
} from '../lib/row.mjs';
import { invimaDate, invimaRows, invimaText } from '../lib/invima.mjs';
import { whoPqRows } from '../lib/who-pq.mjs';
import { hsaClassARows, hsaDate, hsaText, smdrRows } from '../lib/hsa.mjs';
import { nmpaUdiRows, parseUdidXml } from '../lib/nmpa-udi.mjs';
import { sahpraRows } from '../lib/sahpra.mjs';
import {
  cdscoOfficialRows,
  parseOfficialLicence,
  withoutContacts,
} from '../lib/cdsco-official.mjs';
import {
  splitTfdaCategory,
  tfdaDate,
  tfdaRows,
  tudidRows,
} from '../lib/tfda.mjs';
import { daenDate, daenRows } from '../lib/tga-daen.mjs';

const FIXTURES = new URL('./fixtures/', import.meta.url);
const fixture = (name) => readFileSync(new URL(name, FIXTURES), 'utf8');
const CTX = {
  sourceUrl: 'https://github.com/example/mirror/blob/0000000/file',
  sourceVersion: 'prueba',
  retrievedAt: '2026-10-24T03:40:00.000Z',
  mirror: {
    repo: 'https://github.com/example/mirror',
    commit: '0000000',
    path: 'file',
    pin: null,
  },
  officialPortal: 'https://example.org/',
};

test('fila común: trae los 18 campos y rechaza una fila sin cita', () => {
  const row = makeRow({
    source: 's',
    sourceRecordId: '1',
    sourceUrl: 'u',
    sourceVersion: 'v',
    retrievedAt: CTX.retrievedAt,
    manufacturerName: 'M',
  });
  assert.deepEqual(Object.keys(row), REQUIRED_FIELDS);
  assert.equal(row.model, null);
  assert.throws(
    () =>
      makeRow({
        source: 's',
        sourceRecordId: '1',
        sourceUrl: 'u',
        sourceVersion: 'v',
        retrievedAt: CTX.retrievedAt,
      }),
    /manufacturerName vacío/,
  );
  assert.deepEqual(rowErrors({ ...row, authorizationDate: '29/02/1996' }), [
    'authorizationDate no es aaaa-mm-dd',
  ]);
});

test('texto verbatim: solo recorta extremos y conserva el espacio de ancho completo', () => {
  assert.equal(textOrNull('  オンコマイン　Dx  '), 'オンコマイン　Dx');
  assert.equal(textOrNull('   '), null);
  assert.equal(dmyToIso('29/02/1996'), '1996-02-29');
  assert.equal(dmyToIso('31/02/1996'), null);
  assert.equal(anvisaUpdateStamp('06/17/2025 19:00:01'), '2025-06-17T19:00:01');
});

test('ANVISA registros: una fila por registro; el segundo fabricante vacío no duplica', () => {
  const rows = anvisaProdutosRows(
    splitSemicolonCsv(fixture('anvisa-produtos.csv')),
    CTX,
  );
  assert.equal(rows.length, 2);
  const preserv = rows.find((r) => r.sourceRecordId === '10163770014');
  assert.equal(preserv.brandName, 'PRESERV EXTRA');
  assert.equal(preserv.manufacturerName, 'SURETEX LIMITED');
  assert.equal(preserv.manufacturerCountry, 'TH');
  assert.equal(
    preserv.manufacturerRegistryId,
    null,
    'el CNPJ es del titular, no del fabricante',
  );
  assert.equal(preserv.extra.holder.cnpj, '58430828000160');
  assert.equal(preserv.riskClass, 'br:III');
  assert.equal(preserv.authorizationDate, '2000-05-26');
  assert.equal(preserv.status, '26/05/2035');
  assert.equal(preserv.extra.otherManufacturers, undefined);
  const protal = rows.find((r) => r.sourceRecordId === '10246810016');
  assert.equal(protal.deviceTypeSystem, 'br:anvisa-nome-tecnico');
  assert.equal(protal.deviceTypeName, 'PROTEÍNA TOTAL');
  assert.equal(
    protal.manufacturerRegistryId,
    'cnpj:72807043000194',
    'fabricante = titular, misma razón social',
  );
  assert.equal(protal.status, 'VIGENTE');
});

test('ANVISA modelos: el modelo va verbatim y forma parte del id', () => {
  const [row] = anvisaModelosRows(
    splitSemicolonCsv(fixture('anvisa-produtos-modelos.csv')),
    CTX,
  );
  assert.equal(row.source, 'anvisa-produtos-modelos');
  assert.equal(
    row.model,
    'Kit para 90 testes - Padrão: 1 x 4 ml, Reativo Enzimático: 3 x 30 ml, Tampão: 1 x 90 ml.',
  );
  assert.equal(row.sourceRecordId, `10246810001|${row.model}`);
  assert.equal(row.deviceTypeName, 'TRIGLICERÍDEO');
  assert.equal(row.extra.dataUpdatedAt, '2020-12-25T04:00:01');
});

test('ANVISA: una línea con columnas de menos hace fallar el parseo', () => {
  assert.throws(
    () => splitSemicolonCsv('A;B;C\n1;2\n'),
    /2 columnas, se esperaban 3/,
  );
});

test('PMDA: JMDN en japonés, mismo trámite en dos listados queda una fila con las dos citas', () => {
  const dataset = JSON.parse(fixture('pmda-dataset.json'));
  const { rows, duplicates, withoutManufacturer } = pmdaRows(dataset, CTX);
  assert.equal(rows.length, 2);
  assert.equal(duplicates, 1);
  assert.equal(withoutManufacturer, 0);
  const cdx = rows.find((r) => r.authorizationId === '23000BZX00089000');
  assert.equal(
    cdx.brandName,
    'オンコマイン　Dx　Target　Test　マルチ　CDxシステム',
  );
  assert.equal(cdx.deviceTypeSystem, 'jmdn');
  assert.equal(
    cdx.deviceTypeName,
    '体細胞遺伝子変異解析システム（抗悪性腫瘍薬適応判定用）',
  );
  assert.equal(cdx.sourceUrl, 'https://www.pmda.go.jp/files/000268378.xlsx');
  assert.deepEqual(cdx.extra.alsoListedIn, [
    {
      category: '後発医療機器',
      sourceUrl: 'https://www.pmda.go.jp/files/000268379.xlsx',
    },
  ]);
  assert.equal(cdx.riskClass, null);
  assert.equal(cdx.manufacturerCountry, null);
  const cert = rows.find((r) => r.authorizationId === '217AIBZX00001000');
  assert.equal(
    cert.manufacturerRegistryId,
    'jp-corporate-number:5080101011388',
  );
  assert.equal(cert.status, '整理済');
  assert.equal(cert.extra.category, '認証品目');
});

test('Health Canada: una fila por identificador, clase en romanos y país de la compañía', () => {
  const data = JSON.parse(fixture('hc-mdall.json'));
  const stats = {};
  const rows = [...mdallRows(indexMdall(data), data.identifiers, CTX, stats)];
  assert.equal(rows.length, 2);
  assert.equal(stats.licencesWithoutDevices, 0);
  const [first] = rows;
  assert.equal(first.sourceRecordId, '103935:1016948:08P6701');
  assert.equal(first.brandName, 'ALINITY C PROTEINS ASSAY');
  assert.equal(first.model, '08P6701');
  assert.equal(first.manufacturerName, 'BIOKIT S.A.');
  assert.equal(first.manufacturerCountry, 'ES');
  assert.equal(first.manufacturerRegistryId, 'hc-company:111693');
  assert.equal(first.riskClass, 'ca:II');
  assert.equal(first.authorizationDate, '2019-11-22');
  assert.equal(first.extra.licenceType, 'Test Kit');
  assert.equal(first.deviceTypeCode, null);
});

test('Health Canada: licencia sin identificadores sale con model null; sin compañía no sale', () => {
  const data = JSON.parse(fixture('hc-mdall.json'));
  const stats = {};
  const rows = [...mdallRows(indexMdall(data), [], CTX, stats)];
  assert.equal(rows.length, 1);
  assert.equal(rows[0].sourceRecordId, '103935::');
  assert.equal(rows[0].model, null);
  const orphan = [
    ...mdallRows(
      indexMdall({ ...data, companies: [] }),
      data.identifiers,
      CTX,
      stats,
    ),
  ];
  assert.equal(orphan.length, 0);
  // Los dos identificadores se descartan; la licencia ya tuvo identificadores y no sale aparte.
  assert.equal(stats.withoutCompany, 2);
});

test('TGA DAEN: «-» es vacío, el GMDN va como gmdn-pt y los pares ya cubiertos no se repiten', () => {
  const full = fixture('tga-daen-reports.jsonl')
    .split('\n')
    .filter(Boolean)
    .map((l) => JSON.parse(l));
  const { rows } = daenRows(
    full,
    parseCsv(fixture('tga-daen-summary.csv')),
    CTX,
  );
  assert.equal(daenDate('6/12/2018'), '2018-12-06');
  const ensite = rows.filter((r) => r.authorizationId === '125881');
  assert.equal(ensite.length, 1);
  assert.equal(ensite[0].model, null);
  assert.equal(ensite[0].riskClass, 'au:Class IIa');
  assert.equal(ensite[0].deviceTypeSystem, 'gmdn-pt');
  assert.equal(ensite[0].deviceTypeName, 'Computer, cardiac physiology');
  assert.equal(ensite[0].extra.sponsor, 'Abbott Medical Australia Pty Ltd');
  const bard = rows.filter((r) => r.authorizationId === '122873');
  assert.equal(bard.length, 2, 'dos nombres comerciales del mismo ARTG');
  assert.equal(rows.length, 4);
});

test('salida: partes gzip legibles, filas completas y sha256 en el manifiesto', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'dx-row-'));
  try {
    const writer = new PartWriter(dir, 'anvisa-produtos', 'prueba');
    const rows = anvisaProdutosRows(
      splitSemicolonCsv(fixture('anvisa-produtos.csv')),
      CTX,
    );
    for (const row of rows) writer.add(row);
    const [file] = await writer.finish();
    assert.equal(file.path, 'anvisa-produtos.ndjson.gz');
    assert.equal(file.rows, 2);
    assert.match(file.sha256, /^[0-9a-f]{64}$/);
    const lines = gunzipSync(readFileSync(join(dir, file.path)))
      .toString('utf8')
      .trim()
      .split('\n');
    assert.deepEqual(
      lines.map((l) => JSON.parse(l).sourceRecordId),
      rows.map((r) => r.sourceRecordId),
    );
    assert.throws(
      () => writer.add({ ...rows[0], source: 'otra' }),
      /fila de otra en el archivo de anvisa-produtos/,
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('CDSCO: fabricante legal y país del sitio, «Show More» resuelto y clase A–D', () => {
  const sheet = fixture('cdsco-md-medical-devices.jsonl')
    .split('\n')
    .filter(Boolean)
    .map((l) => JSON.parse(l));
  const { rows, skipped } = cdscoRows(sheet, CTX);
  assert.equal(rows.length, 4);
  assert.deepEqual(skipped, { badLicence: 0, withoutManufacturer: 0 });
  const [bandage, valve, , needles] = rows;
  assert.equal(bandage.sourceRecordId, 'IMP/MD/2018/000001#1');
  assert.equal(bandage.authorizationDate, '2018-03-16');
  assert.equal(bandage.manufacturerName, 'Facet Technologies,LLC');
  assert.equal(bandage.manufacturerCountry, 'US');
  assert.equal(bandage.riskClass, 'in:B');
  assert.equal(bandage.model, '85200 - Sureseal XL Pressure Bandage');
  assert.equal(
    valve.manufacturerName,
    'Cardiamed B V',
    'el sitio legal gana aunque aparezca segundo',
  );
  assert.equal(valve.manufacturerCountry, 'NL');
  assert.deepEqual(
    valve.extra.manufacturingSites.map((s) => [s.role, s.name, s.country]),
    [
      ['actual', 'ZAO NPP MedEng', 'RU'],
      ['legal', 'Cardiamed B V', 'NL'],
    ],
  );
  assert.ok(
    !valve.model.includes('Show More') &&
      valve.model.endsWith('diameters 21mm'),
  );
  assert.equal(needles.model, null, '«NIL» es vacío');
  assert.equal(needles.manufacturerName, 'M/s Novo Nordisk A/S');
});

test('CDSCO: licencia y artefacto de la página', () => {
  assert.deepEqual(
    parseCdscoLicence('Licence no: IMP/MD/2018/000005 Issued on: 18-SEP-2023'),
    { number: 'IMP/MD/2018/000005', date: '2023-09-18' },
  );
  assert.equal(parseCdscoLicence('IMP/MD/2018/000005'), null);
  assert.equal(expandShowMore('A, B... Show MoreA, B, C Show Less'), 'A, B, C');
  assert.equal(expandShowMore('sin botón'), 'sin botón');
});

test('lectura por streaming: windows-1252 decodifica el guion largo y los acentos', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'dx-row-cp1252-'));
  try {
    const path = join(dir, 'x.csv');
    // «IVD – Notificação» en windows-1252: 0x96 es «–», 0xE7 «ç», 0xE3 «ã».
    writeFileSync(
      path,
      Buffer.from([
        0x41, 0x3b, 0x42, 0x0d, 0x0a, 0x49, 0x56, 0x44, 0x20, 0x96, 0x20, 0x4e,
        0x6f, 0x74, 0x69, 0x66, 0x69, 0x63, 0x61, 0xe7, 0xe3, 0x6f, 0x3b, 0x31,
        0x0a,
      ]),
    );
    const rows = [];
    for await (const r of readDelimitedRows(path, { encoding: 'windows-1252' }))
      rows.push(r);
    assert.deepEqual(rows, [{ A: 'IVD – Notificação', B: '1' }]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('ANVISA: las áreas y asuntos de las peticiones se unen por número de proceso exacto', async () => {
  const index = new Map();
  for await (const line of readDelimitedRows(
    new URL('anvisa-peticoes.csv', FIXTURES),
    { strict: false },
  ))
    addPetitionLine(index, line);
  const petitionsByProcess = freezePetitionIndex(index);
  assert.deepEqual(petitionsByProcess.get('25351077398202075'), {
    areas: ['Dispositivos Médicos para Diagnóstico in Vitro'],
    primarySubjects: ['IVD – Notificação de produto Classe I'],
  });
  const rows = anvisaProdutosRows(
    splitSemicolonCsv(fixture('anvisa-produtos.csv')),
    { ...CTX, petitionsByProcess },
  );
  const protal = rows.find((r) => r.sourceRecordId === '10246810016');
  assert.deepEqual(
    protal.extra.anvisaPetitions,
    {
      areas: ['Dispositivos Médicos para Diagnóstico in Vitro'],
      primarySubjects: [],
    },
    'solo peticiones secundarias (revalidación): sin asunto primario',
  );
  const preserv = rows.find((r) => r.sourceRecordId === '10163770014');
  assert.equal(
    preserv.extra.anvisaPetitions,
    undefined,
    'proceso sin peticiones publicadas: sin marca',
  );
  const [modelo] = anvisaModelosRows(
    splitSemicolonCsv(fixture('anvisa-produtos-modelos.csv')),
    {
      ...CTX,
      petitionsByProcess,
      processByRegistro: new Map([['10246810001', '250000000659575']]),
    },
  );
  assert.equal(modelo.extra.processNumber, '250000000659575');
  assert.equal(modelo.extra.processNumberFrom, 'TA_PRODUTO_SAUDE_SITE');
  assert.deepEqual(modelo.extra.anvisaPetitions.areas, [
    'Dispositivos Médicos para Diagnóstico in Vitro',
  ]);
});

test('TFDA: una fila por licencia, clasificación con código, clase y fabricantes adicionales', () => {
  const { rows, stats } = tfdaRows(parseCsv(fixture('tfda-68.csv')), CTX);
  assert.equal(stats.withoutManufacturer, 0);
  assert.equal(
    rows.length,
    2,
    'la licencia con dos líneas (dos fabricantes) queda en una fila',
  );
  const stent = rows.find(
    (r) => r.sourceRecordId === '衛部醫器陸輸字第001888號',
  );
  assert.equal(stent.deviceTypeSystem, 'tw:tfda-classification');
  assert.equal(stent.deviceTypeCode, 'E.9999');
  assert.equal(stent.manufacturerCountry, 'CN');
  assert.equal(stent.riskClass, 'tw:2');
  assert.equal(stent.authorizationDate, '2026-02-25');
  assert.equal(stent.extra.otherManufacturers.length, 1);
  const lh = rows.find(
    (r) => r.sourceRecordId === '衛部醫器陸輸壹字第002718號',
  );
  assert.equal(lh.deviceTypeCode, 'A.1485');
  assert.equal(lh.deviceTypeName, '黃體激素試驗系統');
  assert.deepEqual(lh.extra.deviceTypes, [
    { system: 'tw:tfda-category', code: 'A', name: '臨床化學及臨床毒理學' },
  ]);
  assert.equal(lh.brandName, '“以樂” 排卵快速檢測試紙 (未滅菌)');
  assert.equal(lh.extra.holder.taxId, '24355038');
  assert.deepEqual(splitTfdaCategory('J.2910 臨床電子體溫計'), {
    code: 'J.2910',
    name: '臨床電子體溫計',
  });
  assert.equal(tfdaDate('2031/02/25'), '2031-02-25');
});

test('TUDID: una fila por UDI-DI y modelo; fabricante y clase de la licencia; licencia desconocida no sale', () => {
  const { rows: licences } = tfdaRows(parseCsv(fixture('tfda-68.csv')), CTX);
  const byLicence = new Map(licences.map((r) => [r.authorizationId, r]));
  const { rows, stats } = tudidRows(
    parseCsv(fixture('tfda-tudid-197.csv')),
    byLicence,
    CTX,
  );
  assert.equal(rows.length, 2);
  assert.equal(stats.withoutLicence, 1);
  const [first] = rows;
  assert.equal(first.source, 'tfda-tudid');
  assert.equal(first.udiDi, '06938370136019');
  assert.equal(first.model, 'LT-FIS-20G8F035B');
  assert.equal(
    first.sourceRecordId,
    '06938370136019|LT-FIS-20G8F035B|衛部醫器陸輸字第001888號',
  );
  assert.equal(
    first.manufacturerName,
    byLicence.get('衛部醫器陸輸字第001888號').manufacturerName,
  );
  assert.equal(first.riskClass, 'tw:2');
  assert.equal(first.extra.udiIssuingAgency, 'GS1');
  assert.equal(first.extra.licenceFrom, 'tfda-devices');
});

test('JMDN: la ficha de PMDA (Shift_JIS) se parte en código, clase, 類別, 中分類 y definición', () => {
  const html = new TextDecoder('shift_jis').decode(
    readFileSync(new URL('pmda-jmdn-resr.html', FIXTURES)),
  );
  const entries = parseJmdnPage(html);
  assert.equal(entries.length, 2);
  const [probe] = entries;
  assert.equal(probe.name, '中枢神経・中心循環系手術向け超音波診断用プローブ');
  assert.equal(probe.code, '40770004');
  assert.equal(probe.class, 'Ⅳ');
  assert.equal(probe.annex, '別表1-1');
  assert.deepEqual(probe.category, { code: '器12', name: '理学診療用器具' });
  assert.equal(probe.subcategory, '超音波画像診断装置');
  assert.equal(probe.maintenance.qms, '該当');
  assert.ok(probe.productGroups.length > 1);
  assert.deepEqual(
    parseJmdnHeadline(
      '　　 別表2-160, クラスⅡ, コード：14032010, GHTFルール：10-③',
    ),
    {
      annex: '別表2-160',
      class: 'Ⅱ',
      code: '14032010',
      ghtfRule: '10-③',
    },
  );
  const dataset = JSON.parse(fixture('pmda-dataset.json'));
  const byName = new Map(entries.map((e) => [e.name, e]));
  const { rows } = pmdaRows(dataset, { ...CTX, jmdnByName: byName });
  assert.ok(
    rows.every((r) => r.riskClass === null && r.deviceTypeCode === null),
    'la unión por nombre no rellena campos principales',
  );
});

test('INVIMA: grupo y nivel de riesgo propios, fabricante por rol y titular si no hay fabricante', () => {
  const { rows, stats } = invimaRows(parseCsv(fixture('invima-y4qt.csv')), CTX);
  const roche = rows.find((r) => r.authorizationId === 'INVIMA 2018RD-0004850');
  assert.equal(roche.deviceTypeSystem, 'co:invima-grupo');
  assert.equal(roche.deviceTypeName, 'REACTIVO DIAGNOSTICO');
  assert.equal(roche.manufacturerName, 'ROCHE DIAGNOSTICS GMBH');
  assert.equal(roche.manufacturerCountry, 'DE');
  assert.equal(roche.riskClass, 'co:II');
  assert.equal(
    roche.brandName,
    null,
    'el literal «null» de la exportación es vacío',
  );
  assert.equal(roche.extra.productName, 'ELECSYS B-AMYLOID (1-42) CSF');
  assert.equal(roche.extra.validUntil, '2028-03-26');
  assert.ok(roche.extra.roles.some((r) => r.role === 'IMPORTADOR'));
  const fromHolder = rows.filter(
    (r) => r.extra.manufacturerNameFrom === 'TITULAR',
  );
  assert.equal(fromHolder.length, stats.manufacturerFromHolder);
  assert.ok(fromHolder.length >= 1);
  assert.equal(fromHolder[0].manufacturerName, fromHolder[0].extra.holder.name);
  assert.equal(invimaDate('07/18/2029 12:00:00 AM'), '2029-07-18');
  assert.equal(invimaText('null'), null);
});

test('OMS PQ: una fila por código de producto, formato de ensayo y patógeno', () => {
  const { rows } = whoPqRows(parseCsv(fixture('who-pq-ivd.csv')), CTX);
  assert.equal(rows.length, 3);
  const [first] = rows;
  assert.equal(first.sourceRecordId, '13641-013-00|7D3442SET');
  assert.equal(first.brandName, 'Determine Syphilis Advanced');
  assert.equal(first.model, '7D3442SET');
  assert.equal(first.deviceTypeSystem, 'who:assay-format');
  assert.equal(first.deviceTypeName, 'Immunochromatographic (lateral flow)');
  assert.equal(first.extra.target, 'Syphilis');
  assert.equal(first.extra.inVitroDiagnostic, true);
  assert.equal(first.authorizationDate, null, 'la lista solo publica el año');
});

test('HSA SMDR: área de especialidad, clase y titular; «NOT_GENERATED» no es un número de registro', () => {
  const { rows, stats } = smdrRows(parseCsv(fixture('hsa-smdr.csv')), CTX);
  assert.equal(stats.withoutRegistration, 1);
  assert.equal(rows.length, 2);
  const [eye, chem] = rows;
  assert.equal(eye.sourceRecordId, 'MDPR260520Z0003');
  assert.equal(eye.riskClass, 'sg:B');
  assert.equal(eye.authorizationDate, '2026-05-20');
  assert.equal(eye.manufacturerName, 'PPM Medical Pte Ltd');
  assert.equal(eye.extra.registrant.name, 'PPM MEDICAL PTE. LTD.');
  assert.ok(eye.extra.modelNames.startsWith('Stallard scissors'));
  assert.equal(chem.deviceTypeSystem, 'sg:hsa-speciality');
  assert.equal(chem.deviceTypeName, 'Clinical chemistry');
  assert.equal(hsaDate('9/3/2018 14:38'), '2018-03-09');
});

test('HSA clase A: una notificación con varios dispositivos da una fila por dispositivo', () => {
  const rows = [...hsaClassARows(parseCsv(fixture('hsa-class-a.csv')), CTX)];
  assert.equal(rows.length, 4);
  const ids = new Set(rows.map((r) => r.sourceRecordId));
  assert.equal(ids.size, 4);
  assert.equal(
    rows.filter((r) => r.authorizationId === 'MDES00011792979').length,
    2,
  );
  assert.equal(rows[0].riskClass, 'sg:A');
  assert.equal(rows[0].manufacturerName, 'Bionic Medizintechnik GmbH');
  assert.equal(rows[0].extra.dealer.name, 'JMS SINGAPORE PTE LTD');
  assert.equal(hsaText('NA'), null);
});

test('NMPA UDID: una fila por UDI-DI, sin contactos, sin clase ni país deducidos', () => {
  const { header, devices } = parseUdidXml(fixture('nmpa-udi.xml'));
  assert.equal(header.numberRecordsDatabase, '6293777');
  assert.equal(devices.length, 4);
  const stats = {};
  const rows = [...nmpaUdiRows([...devices, devices[0]], CTX, stats)];
  assert.equal(rows.length, 4);
  assert.equal(stats.duplicates, 1);
  for (const row of rows) assert.deepEqual(rowErrors(row), []);
  const [ivd, tube, ma, sheath] = rows;
  assert.equal(ivd.udiDi, '06978273730037');
  assert.equal(ivd.sourceRecordId, '06978273730037');
  assert.equal(ivd.deviceTypeSystem, 'cn:nmpa-classification');
  assert.equal(ivd.deviceTypeCode, '6840-000');
  assert.equal(ivd.deviceTypeName, null);
  assert.equal(ivd.extra.qxlb, '体外诊断试剂');
  assert.equal(
    ivd.extra.genericName,
    '钙卫蛋白测定试剂盒（胶乳增强免疫比浊法）',
  );
  assert.equal(ivd.manufacturerName, '湖南和锐生物科技有限公司');
  assert.equal(ivd.authorizationId, '湘械注准20212401609');
  assert.equal(ivd.riskClass, null);
  assert.equal(ivd.manufacturerCountry, null);
  assert.equal(tube.brandName, null);
  assert.equal(
    tube.model,
    '血清管（CAT）促凝剂 凝胶，16x100，8ml，红盖黄环，直拔',
  );
  assert.equal(tube.extra.catalogNumber, '455071');
  assert.deepEqual(tube.extra.packages[0], {
    di: '39120017573044',
    level: '箱',
    quantity: '24',
    containsDi: '29120017573047',
  });
  assert.equal(tube.extra.manufacturerRegistryId, undefined);
  assert.equal(ma.extra.diSystem, 'MA码（IDcode）');
  assert.equal(ma.extra.cplb, '设备');
  assert.equal(sheath.extra.packages.length, 2);
  assert.equal(sheath.extra.clinicalSizes[0].type, '直径');
  assert.equal(sheath.extra.recordVersion.status, '新增');
  assert.ok(!JSON.stringify(rows).includes('qylx'));
});

test('SAHPRA: una fila por línea de cada lista, con fabricante original y titular local', () => {
  const lists = Object.entries(JSON.parse(fixture('sahpra-lists.json'))).map(
    ([key, list]) => ({ key, sheet: list.sheet, rows: list.rows, ctx: CTX }),
  );
  const { rows } = sahpraRows(lists);
  assert.equal(rows.length, 4);
  for (const row of rows) assert.deepEqual(rowErrors(row), []);
  const [abbott, , self] = rows;
  assert.equal(abbott.sourceRecordId, 'molecular|1');
  assert.equal(abbott.manufacturerName, 'Abbott Molecular Inc');
  assert.equal(abbott.brandName, 'Abbott RealTime SARS-CoV-2  Assay');
  assert.equal(abbott.deviceTypeName, 'Molecular Tests');
  assert.equal(abbott.authorizationDate, '2020-03-30');
  assert.equal(abbott.extra.applicationDate, '2020-03-25');
  assert.equal(
    abbott.extra.licenceHolder,
    'Abbott Laboratories South Africa (Pty) Ltd',
  );
  assert.equal(abbott.authorizationId, null);
  assert.equal(self.sourceRecordId, 'antigen-self-test|1');
  assert.equal(self.extra.applicationDate, undefined);
});

test('CDSCO oficial: importación y fabricación, MD e IVD; sin teléfonos ni correos', () => {
  const lists = JSON.parse(fixture('cdsco-approved.json'));
  const ctx = {
    ...CTX,
    officialFiles: {
      md: { import: 'md-i', manufacturing: 'md-m' },
      ivd: { import: 'ivd-i', manufacturing: 'ivd-m' },
    },
  };
  const { rows, stats } = cdscoOfficialRows(lists, ctx);
  assert.equal(rows.length, 5);
  assert.equal(stats.duplicates, 1);
  for (const row of rows) assert.deepEqual(rowErrors(row), []);
  const [mdImport, mdMfg, ivdImport, ivdDup, ivdMfg] = rows;
  assert.equal(mdImport.manufacturerName, 'Facet Technologies,LLC');
  assert.equal(mdImport.manufacturerCountry, 'US');
  assert.equal(mdImport.authorizationId, 'IMP/MD/2018/000001');
  assert.equal(mdImport.authorizationDate, '2018-03-16');
  assert.equal(mdImport.riskClass, 'in:B');
  assert.equal(mdImport.extra.cdscoCategory, 'md');
  assert.equal(mdImport.extra.officialFile, 'md-i');
  assert.equal(mdMfg.manufacturerName, 'GPC Medical Limited');
  assert.equal(mdMfg.manufacturerCountry, 'IN');
  assert.equal(mdMfg.authorizationId, '02/SCof2018');
  assert.equal(mdMfg.authorizationDate, '2018-01-09');
  assert.equal(mdMfg.extra.issuingAuthority, 'SLA - Uttar Pradesh');
  assert.equal(
    ivdImport.manufacturerName,
    'Siemens Healthcare Diagnostics Inc.',
  );
  assert.equal(ivdImport.model, null);
  assert.equal(ivdImport.extra.cdscoCategory, 'ivd');
  assert.equal(ivdDup.extra.otherIntendedUses.length, 1);
  assert.equal(ivdMfg.brandName, null);
  assert.equal(ivdMfg.extra.officialFile, 'ivd-m');
  const text = JSON.stringify(rows);
  assert.ok(!text.includes('@'));
  assert.ok(!/Telephone|Contact Number/.test(text));
  assert.equal(
    parseOfficialLicence('Licence no: X\nIssued on: 31-FEB-2020').date,
    null,
  );
  assert.equal(
    withoutContacts(
      'M/s. Manik Medicaids ,105, MP Mall ,110034 ,India( manikmedicaids@yahoo.com ) Delhi Pincode: 110034 email: x@y.in',
    ),
    'M/s. Manik Medicaids ,105, MP Mall ,110034 ,India Delhi Pincode: 110034',
  );
});
