// Pruebas de la vía OFICIAL de ROW (2026-10-27). Fixtures: recortes de los
// archivos reales descargados hoy: TFDA `68_2.csv`, INVIMA (Socrata y4qt-w6tk,
// sin roles de personas físicas) y la API de MDALL de Health Canada.
// Correr: node --test tools/terminology-import/diagnostic-devices/row/test/
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import { parseCsv } from '../../../lib/medicine-catalog/common.mjs';
import { indexMdall, mdallRows } from '../lib/hc-mdall.mjs';
import { INVIMA_COUNTRY_ISO, invimaRows } from '../lib/invima.mjs';
import { TFDA_HEADER, assertTfdaHeader, tfdaRows, tfdaType } from '../lib/tfda.mjs';

const FX = new URL('./fixtures/official/', import.meta.url);
const text = (n) => readFileSync(new URL(n, FX), 'utf8');
const json = (n) => JSON.parse(text(n));
const CTX = {
  sourceUrl: 'https://example.invalid/archivo-oficial',
  sourceVersion: 'prueba',
  retrievedAt: '2026-10-27T23:00:00.000Z',
  official: { url: 'https://example.invalid/archivo-oficial', sha256: 'h' },
  officialPortal: 'https://example.invalid/',
};

test('TFDA: el encabezado real tiene las 34 columnas esperadas', () => {
  const records = parseCsv(text('tfda-rows.csv'));
  assert.equal(TFDA_HEADER.length, 34);
  assert.doesNotThrow(() => assertTfdaHeader(Object.keys(records[0])));
  assert.throws(() => assertTfdaHeader(['許可證字號']), /faltan columnas/);
});

test('TFDA: tipo con sistema propio, fabricante y país verbatim, licencia repetida con #n', () => {
  const records = parseCsv(text('tfda-rows.csv'));
  const stats = {};
  const rows = tfdaRows(records, CTX, stats);
  assert.equal(rows.length, 4);
  const [first, d1, d2, ivd] = rows;
  assert.equal(first.source, 'tfda-licences');
  assert.equal(first.deviceTypeSystem, 'tw:tfda-classification');
  assert.equal(first.deviceTypeCode, 'E.1250');
  assert.equal(first.deviceTypeName, '經皮導管');
  assert.equal(first.manufacturerName, 'APT Medical Inc.');
  assert.equal(first.manufacturerCountry, 'CN');
  assert.equal(first.riskClass, 'tw:2');
  assert.equal(first.authorizationDate, '2022-10-05');
  assert.equal(first.brandName, '“APT”Hydromarch Hydrophilic Guiding Catheter'.trim());
  assert.equal(first.status, null); // sin 註銷狀態no se inventa «vigente»
  assert.equal(d1.sourceRecordId, d1.authorizationId);
  assert.equal(d2.sourceRecordId, `${d2.authorizationId}#2`);
  assert.equal(stats.duplicateLicenceNumbers, 1);
  assert.equal(ivd.extra.mainCategory.startsWith('A '), true);
  assert.equal(ivd.deviceTypeSystem, 'tw:tfda-classification');
});

test('TFDA: código de la clasificación anterior de 4 dígitos va en otro sistema', () => {
  assert.deepEqual(tfdaType('0399 其他人工機能代用器'), {
    code: '0399',
    name: '其他人工機能代用器',
    system: 'tw:tfda-classification-legacy',
    verbatim: '0399 其他人工機能代用器',
  });
  assert.equal(tfdaType(''), null);
  assert.equal(tfdaType('texto libre sin código').system, null);
});

test('INVIMA: una fila por registro, fabricante = rol FABRICANTE, grupo publicado como tipo', () => {
  const stats = {};
  const rows = invimaRows(json('invima-rows.json'), CTX, stats);
  assert.equal(rows.length, 2);
  const [ivd, md] = rows;
  assert.equal(ivd.source, 'invima-registros');
  assert.equal(ivd.deviceTypeSystem, 'co:invima-grupo');
  assert.equal(ivd.deviceTypeName, 'REACTIVO DIAGNOSTICO');
  assert.equal(ivd.manufacturerName, 'ORTHO CLINICAL DIAGNOSTICS INC.');
  assert.equal(ivd.extra.otherManufacturers[0].name, 'ORTHO CLINICAL DIAGNOSTICS');
  assert.equal(ivd.authorizationId, 'INVIMA 2015RD-0000028-R2');
  assert.equal(ivd.brandName, 'ORTHO');
  // sin rol FABRICANTE: el titular, marcado
  assert.equal(md.extra.manufacturerNameFrom, 'titular');
  assert.equal(stats.withoutManufacturerRole, 1);
});

test('INVIMA: «null» textual es ausencia y el nombre del producto reemplaza a la marca con aviso', () => {
  const base = json('invima-rows.json').slice(0, 1).map((r) => ({ ...r, rol: 'FABRICANTE', marca: 'null', prodcuto: 'PRUEBA X', pais_rol: 'ALEMANIA' }));
  const [row] = invimaRows(base, CTX);
  assert.equal(row.brandName, 'PRUEBA X');
  assert.equal(row.extra.brandFrom, 'prodcuto');
  assert.equal(row.manufacturerCountry, 'DE');
  assert.equal(INVIMA_COUNTRY_ISO['ESTADOS UNIDOS DE AMÉRICA'], 'US');
});

test('INVIMA: ningún campo de salida contiene nombre_rol de roles de personas (no vienen en la entrada)', () => {
  const personRoles = new Set(['APODERADO', 'REPRESENTANTE LEGAL', 'REPRESENTANTE LEGAL PARALELO', 'QUIMICO FARMACEUTICO', 'RESPONSABLE']);
  assert.equal(json('invima-rows.json').some((r) => personRoles.has(r.rol)), false);
});

test('Health Canada oficial: la marca es el trade_name del dispositivo y el nombre de la licencia queda aparte', () => {
  const api = json('hc-mdall-api.json');
  const index = indexMdall({
    activeLicences: api.active_license,
    archiveLicences: [],
    companies: api.company,
    devices: api.active_device,
  });
  const stats = {};
  const rows = [...mdallRows(index, api.active_device_identifier, CTX, stats)];
  assert.equal(rows.length, 3);
  const glove = rows.find((r) => r.brandName === 'BLACK NITRILE GLOVES');
  assert.ok(glove);
  assert.equal(glove.extra.licenceName, '6 MIL NITRILE GLOVES');
  assert.equal(glove.riskClass, 'ca:II');
  assert.equal(glove.extra.licenceType, 'Device Family');
  assert.match(glove.manufacturerRegistryId, /^hc-company:\d+$/);
  assert.equal(stats.withDeviceTradeName, 3);
});
