// CUPS Colombia (laboratorio del PBS): filas REALES de datos.gov.co/resource/s5f2-yivs.json, 2026-10-27.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { cupsLabRecords } from '../lib/cups-co.mjs';
import { SOURCES } from '../lib/sources.mjs';
import { assertRecord } from '../lib/records.mjs';

const rows = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'cups', 'pospopuli-laboratorio.sample.json'), 'utf8'));
const PROV = { sourceName: 'CUPS (prueba)', sourceVersion: 'v', sourceUrl: 'https://www.datos.gov.co/d/s5f2-yivs', sourceFile: 'f', sourceSha256: 's', retrievedAt: '2026-10-27T00:00:00.000Z', license: SOURCES['cups-co'].license };

test('CUPS laboratorio: código de seis dígitos, nombre oficial verbatim en propiedad y definición llana de la fuente', () => {
  const { records, stats } = cupsLabRecords(rows, PROV);
  assert.equal(records.length, rows.length);
  records.forEach(assertRecord);
  const r = records.find((x) => x.code === '901001');
  assert.equal(r.properties.tariff_official_name, 'ANTIBIOGRAMA (DISCO)');
  assert.match(r.definition, /^ATB\. Análisis de sensibilidad a los antibióticos/);
  assert.equal(r.domain, 'laboratory');
  assert.equal(r.designations[0].lang, 'es');
  assert.ok(stats.withExplanation >= 1);
});

test('CUPS laboratorio: «Sin dato» no se escribe como valor; un código que no es de seis dígitos o repetido aborta', () => {
  const { records } = cupsLabRecords(rows, PROV);
  for (const r of records) for (const v of Object.values(r.properties)) assert.notEqual(v, 'Sin dato');
  assert.throws(() => cupsLabRecords([{ ...rows[0], codigocups: '1001' }], PROV), /seis dígitos/);
  assert.throws(() => cupsLabRecords([rows[0], rows[0]], PROV), /repetido/);
});

test('CUPS laboratorio: la licencia es CC BY-SA y la fuente queda marcada como compartir igual (no entra por omisión)', () => {
  assert.equal(SOURCES['cups-co'].shareAlike, true);
  assert.match(SOURCES['cups-co'].license, /CC BY-SA 4\.0/);
});
