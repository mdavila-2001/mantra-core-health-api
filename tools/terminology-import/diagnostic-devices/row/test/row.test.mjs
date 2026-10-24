// Pruebas de los normalizadores ROW. Fixtures: extractos REALES de los espejos
// fijados en `sources.mjs` (ANVISA PROTAL y PRESERV EXTRA; ANVISA modelos
// TRIGLICERÍDEOS; PMDA オンコマイン Dx y フレスポイト; Health Canada ALINITY C
// PROTEINS ASSAY; TGA DAEN ARTG 125881, 282963 y 122873).
// Correr: node --test tools/terminology-import/diagnostic-devices/row/test/

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gunzipSync } from 'node:zlib';

import { parseCsv } from '../../../lib/medicine-catalog/common.mjs';
import {
  anvisaModelosRows,
  anvisaProdutosRows,
  anvisaUpdateStamp,
  splitSemicolonCsv,
} from '../lib/anvisa.mjs';
import { indexMdall, mdallRows } from '../lib/hc-mdall.mjs';
import { PartWriter } from '../lib/out.mjs';
import { pmdaRows } from '../lib/pmda.mjs';
import {
  REQUIRED_FIELDS,
  dmyToIso,
  makeRow,
  rowErrors,
  textOrNull,
} from '../lib/row.mjs';
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
