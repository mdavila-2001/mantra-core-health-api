// Normalizadores de las fuentes OFICIALES (openFDA export 2026-10-21 y AccessGUDID Delimited
// Full Release 20261001) con filas reales copiadas de esos archivos. De R&L y UDI se quitaron
// los datos de contacto (corresponsal, agente en EE. UU., teléfonos y correos), que no se usan.
//   node --test "tools/terminology-import/diagnostic-devices/us/test/*.test.mjs"

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Readable } from 'node:stream';
import { test } from 'node:test';
import { validateRecord } from '../lib/format.mjs';
import { readPipeDelimited, streamOpenFdaResults } from '../lib/io.mjs';
import { ProductCodeTable, fromAccessGudidDelimited, fromOpenFda510k, fromOpenFdaPma, fromOpenFdaRegistrationListing, fromOpenFdaUdi } from '../lib/normalize.mjs';

const FIX = new URL('./fixtures/', import.meta.url);
const fixture = (name) => readFileSync(new URL(name, FIX), 'utf8');
const PROV = { sourceVersion: 'openFDA test', retrievedAt: '2026-10-24T14:29:00.000Z', via: { kind: 'official' } };

/** Resultados de un JSON de openFDA leídos con el mismo lector en streaming que usa build.mjs. */
async function results(name) {
  const out = [];
  await streamOpenFdaResults(Readable.from(fixture(name).match(/[\s\S]{1,1024}/g)), (r) => out.push(r));
  return out;
}

async function officialTable() {
  const t = new ProductCodeTable();
  for (const r of await results('openfda-classification.sample.json')) t.addClassification(r);
  return t;
}

test('openFDA device/510k real: K y De Novo en alcance, fuera de alcance → null', async () => {
  const table = await officialTable();
  const [k, den, out] = (await results('openfda-510k.sample.json')).map((r) => fromOpenFda510k(r, table, PROV));
  assert.deepEqual(validateRecord(k), []);
  assert.equal(k.source, 'fda-510k');
  assert.equal(k.sourceRecordId, 'K241978');
  assert.equal(k.deviceTypeCode, 'LCX');
  assert.equal(k.manufacturerName, 'Hangzhou AllTest Biotech Co., Ltd.');
  assert.equal(k.manufacturerCountry, 'CN');
  assert.equal(k.brandName, 'Shinetell Digital Pregnancy Test');
  assert.equal(k.riskClass, 'fda:2');
  assert.equal(k.authorizationDate, '2024-08-13');
  assert.equal(k.status, 'Substantially Equivalent');
  assert.equal(den.source, 'fda-denovo');
  assert.equal(den.sourceRecordId, 'DEN140025');
  assert.match(den.sourceUrl, /denovo\.cfm\?ID=DEN140025$/);
  assert.equal(out, null, 'EKY (872.4200, dental terapéutico) queda fuera');
});

test('openFDA device/pma real: misma clave que el espejo, suplemento sin product code hereda el del PMA', async () => {
  const table = await officialTable();
  const rows = fromOpenFdaPma(await results('openfda-pma.sample.json'), table, PROV);
  rows.forEach((r) => assert.deepEqual(validateRecord(r), []));
  assert.deepEqual(rows.map((r) => r.sourceRecordId).sort(), ['P200014', 'P200014/S008'], 'P…[/S…] como fromFdadataPma, sin el nombre');
  const orig = rows.find((r) => r.sourceRecordId === 'P200014');
  assert.equal(orig.brandName, 'cobas® EZH2 Mutation Test');
  assert.equal(orig.authorizationDate, '2020-06-18', 'el original es la decisión más antigua');
  assert.equal(orig.deviceTypeCode, 'OWD');
  assert.equal(orig.riskClass, 'fda:3');
  assert.equal(orig.extra.supplementsSameName, 9, 'incluye S004, que no publica product code');
  assert.equal(rows.find((r) => r.sourceRecordId === 'P200014/S008').brandName, 'Roche cobas® EZH2 Mutation Test');
});

test('openFDA device/registrationlisting real: nombres y K a nivel del listado; sin registro ni FEI usa owner/operator', async () => {
  const table = await officialTable();
  const [multi, noReg] = await results('openfda-registrationlisting.sample.json');
  const rows = fromOpenFdaRegistrationListing(multi, table, PROV);
  rows.forEach((r) => assert.deepEqual(validateRecord(r), []));
  assert.equal(rows.length, 4, '2 product codes (GKZ, KPA) × 2 nombres propietarios');
  const gkz = rows.find((r) => r.deviceTypeCode === 'GKZ' && r.brandName === 'Alinity hq Processing Module (LN 09P6801)');
  assert.equal(gkz.sourceRecordId, '3006412379|GKZ|Alinity hq Processing Module (LN 09P6801)');
  assert.equal(gkz.authorizationId, 'K220031');
  assert.equal(gkz.manufacturerName, 'ABBOTT LABORATORIES');
  assert.equal(gkz.manufacturerCountry, 'SG');
  assert.equal(gkz.manufacturerRegistryId, 'fda-reg:3006412379');
  assert.equal(gkz.riskClass, 'fda:2');
  assert.equal(gkz.sourceUrl, 'https://api.fda.gov/device/registrationlisting.json?search=registration.registration_number:%223006412379%22+AND+products.product_code:%22GKZ%22');

  const [p] = fromOpenFdaRegistrationListing(noReg, table, PROV);
  assert.deepEqual(validateRecord(p), []);
  assert.equal(p.sourceRecordId, 'oo:10096364|PHP|SimpleScreen CRC');
  assert.equal(p.manufacturerRegistryId, null);
  assert.equal(p.authorizationId, 'P250029');
  assert.match(p.sourceUrl, /search=registration\.owner_operator\.owner_operator_number:%2210096364%22\+AND\+products\.product_code:%22PHP%22$/);
});

test('openFDA device/udi y AccessGUDID delimitado reales: el mismo UDI-DI da la misma fila', async () => {
  const table = await officialTable();
  const [udi] = await results('openfda-udi.sample.json');
  const a = fromOpenFdaUdi(udi, table, PROV);
  assert.deepEqual(validateRecord(a), []);

  const read = async (name) => {
    const rows = [];
    await readPipeDelimited(Readable.from([fixture(`accessgudid-${name}.sample.txt`)]), (r) => rows.push(r));
    return rows;
  };
  const [device] = await read('device');
  const b = fromAccessGudidDelimited(device, { productCodes: await read('productCodes'), submissions: await read('premarketSubmissions'), gmdn: await read('gmdnTerms') }, table, PROV);
  assert.deepEqual(validateRecord(b), []);

  for (const r of [a, b]) {
    assert.equal(r.sourceRecordId, '00192896007024');
    assert.equal(r.udiDi, '00192896007024');
    assert.equal(r.deviceTypeCode, 'GCJ');
    assert.equal(r.manufacturerName, 'SONTEC INSTRUMENTS, INC.');
    assert.equal(r.manufacturerRegistryId, 'duns:040729840');
    assert.equal(r.brandName, 'HEARTLINE MINI COOLEY SCISSORS');
    assert.equal(r.model, '2800-236');
    assert.equal(r.authorizationId, 'K152400');
    assert.equal(r.status, 'In Commercial Distribution');
    assert.equal(r.riskClass, 'fda:2');
    assert.deepEqual(r.extra.deviceTypes.map((g) => [g.system, g.code, g.name]), [['gmdn', '44354', 'Vascular scissors']]);
  }
});
