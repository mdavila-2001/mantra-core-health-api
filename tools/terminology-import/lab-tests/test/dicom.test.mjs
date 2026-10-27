// DICOM CID 29: recortes REALES de dicom.nema.org (descargados el 2026-10-27, edición PS3.16 2026d).
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { DICOM_CODE_SYSTEM, dicomRecords, parseCid29, parseDcmDefinitions, parseStandardEdition } from '../lib/dicom.mjs';
import { assertRecord } from '../lib/records.mjs';

const F = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'dicom');
const read = (n) => readFileSync(join(F, n), 'utf8');
const PROV = { sourceName: 'DICOM (prueba)', sourceVersion: 'PS3.16 2026d', sourceUrl: 'https://dicom.nema.org/', sourceFile: 'f', sourceSha256: 's', retrievedAt: '2026-10-27T00:00:00.000Z', license: '© NEMA' };

test('CID 29: el ValueSet oficial trae 51 modalidades DCM, sin repetidos, con la versión y el UID del Context Group', () => {
  const cid = parseCid29(read('ValueSet-dicom-cid-29-AcquisitionModality.json'));
  assert.equal(cid.members.length, 51);
  assert.equal(cid.uid, '1.2.840.10008.6.1.19');
  assert.equal(cid.version, '20231115');
  assert.deepEqual(cid.members.find((m) => m.code === 'CT'), { code: 'CT', display: 'Computed Tomography' });
  assert.ok(cid.members.some((m) => m.code === 'MR') && cid.members.some((m) => m.code === 'US'));
});

test('CID 29: un ValueSet con otro sistema o con otro id aborta (no se lee a ciegas)', () => {
  assert.throws(() => parseCid29(JSON.stringify({ resourceType: 'ValueSet', id: 'otro' })), /ValueSet inesperado/);
  const cid = JSON.parse(read('ValueSet-dicom-cid-29-AcquisitionModality.json'));
  cid.compose.include[0].system = 'http://loinc.org';
  assert.throws(() => parseCid29(cid), /debía incluir sólo/);
});

test('Annex D: significado, definición y notas verbatim; la edición sale del propio HTML', () => {
  const html = read('chapter_D.sample.html');
  assert.equal(parseStandardEdition(html), '2026d');
  const defs = parseDcmDefinitions(html, ['CT', 'OP', 'CS']);
  assert.deepEqual(defs.get('CT'), { meaning: 'Computed Tomography', definition: 'An acquisition device, process or method that performs computed tomography.', notes: null });
  assert.equal(defs.get('OP').meaning, 'Ophthalmic photography', 'el Annex D difiere del Context Group sólo en mayúsculas');
  assert.equal(defs.get('CS').notes, 'Retired');
  assert.equal(defs.size, 3, 'sólo los códigos pedidos');
});

test('Annex D: sin la edición el parser aborta', () => {
  assert.throws(() => parseStandardEdition('<html></html>'), /edición/);
});

test('registros: display del Context Group, definición del Annex D, dominio imagen, procedencia completa', () => {
  const cid = parseCid29(read('ValueSet-dicom-cid-29-AcquisitionModality.json'));
  const codes = ['CT', 'OP', 'BI', 'MR', 'US', 'ECG', 'BMD', 'NM'];
  const sub = { ...cid, members: cid.members.filter((m) => codes.includes(m.code)) };
  const { records, stats } = dicomRecords({ cid29: sub, definitions: parseDcmDefinitions(read('chapter_D.sample.html'), codes) }, PROV);
  assert.equal(records.length, 8);
  records.forEach(assertRecord);
  const op = records.find((r) => r.code === 'OP');
  assert.equal(op.display, 'Ophthalmic Photography');
  assert.equal(op.properties.dicom_dcm_meaning, 'Ophthalmic photography');
  assert.equal(stats.meaningDiffersInCase, 2);
  assert.equal(stats.retired, 0);
  for (const r of records) {
    assert.equal(r.codeSystem, DICOM_CODE_SYSTEM);
    assert.equal(r.domain, 'imaging');
    assert.equal(r.provenance.sourceId, `http://dicom.nema.org/resources/ontology/DCM#${r.code}`);
    assert.deepEqual(r.valueSets, ['lab-catalog-dicom-dcm', 'lab-catalog-dicom-dcm-cat-29', 'lab-catalog-domain-imaging']);
  }
});

test('registros: un miembro de CID 29 sin fila en el Annex D aborta, no se inventa la definición', () => {
  const cid = parseCid29(read('ValueSet-dicom-cid-29-AcquisitionModality.json'));
  assert.throws(() => dicomRecords({ cid29: cid, definitions: parseDcmDefinitions(read('chapter_D.sample.html'), ['CT']) }, PROV), /sin fila en el Annex D/);
});
