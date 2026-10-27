// PAMI: recorte REAL (bytes ISO-8859-1, CRLF) de nomenclador-comun.csv de datos.pami.org.ar, 2026-10-27.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { arsToCents, parsePamiOriginal } from '../lib/pami-original.mjs';
import { pamiItems } from '../lib/tariffs.mjs';

const buf = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'pami', 'nomenclador-comun.sample.csv'));

test('arsToCents: importes con miles y coma decimal a centavos enteros; formato raro aborta', () => {
  assert.equal(arsToCents('$ 115,32'), 11532);
  assert.equal(arsToCents('$ 1.991,75'), 199175);
  assert.equal(arsToCents('$ 0,05'), 5);
  assert.throws(() => arsToCents('115.32'), /formato inesperado/);
});

test('PAMI original: título, módulo, código de 6 dígitos y nombre verbatim (con «?» donde el export perdió la letra)', () => {
  const { title, rows } = parsePamiOriginal(buf);
  assert.equal(title, 'NOMENCLADOR ESTRUCTURA UNIDADES FEBRERO 2019');
  assert.deepEqual(rows.get('427101'), { module: '1', officialName: 'CONSULTA MEDICO DE CABECERA', valueCents: 11532 });
  assert.equal(rows.get('340102').officialName.endsWith('TELEVISION'), true, 'se recortan los espacios finales');
  assert.match(rows.get('664606').officialName, /HCG O \?-HCG/);
  assert.equal(rows.get('773051').officialName, 'BETA LACTAMASA  (ß-LACTAMASA)', 'la ß de ISO-8859-1 se conserva');
  assert.equal(rows.get('145003').valueCents, 199175);
});

test('PAMI original: sin la cabecera esperada aborta', () => {
  assert.throws(() => parsePamiOriginal(Buffer.from('a;b;c\r\n1;2;3\r\n')), /no encontré la cabecera/);
});

test('pamiItems con el original: agrega módulo, valor y nombre oficial; si los códigos difieren aborta', () => {
  const original = parsePamiOriginal(buf);
  const npm = [...original.rows.keys()].map((c) => ({ code: Number(c), name: `n${c}` }));
  const items = pamiItems(npm, original);
  const it = items.find((i) => i.code === '427101');
  assert.equal(it.properties.pami_module, '1');
  assert.equal(it.properties.pami_official_name_csv, 'CONSULTA MEDICO DE CABECERA');
  assert.deepEqual(it.properties.reference_price, { currency: 'ARS', schedule: 'PAMI nomenclador — NOMENCLADOR ESTRUCTURA UNIDADES FEBRERO 2019', amount_cents: 11532 });
  assert.throws(() => pamiItems(npm.slice(1), original), /difieren \(solo en el CSV: 1; solo en npm: 0\)/);
  assert.throws(() => pamiItems([...npm, { code: 999999, name: 'x' }], original), /solo en npm: 1/);
});
