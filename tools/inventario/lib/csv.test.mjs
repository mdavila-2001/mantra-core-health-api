import assert from 'node:assert/strict';
import test from 'node:test';
import { parseCsv, parseCsvConEncabezado } from './csv.mjs';

test('campos entre comillas con comas, saltos de línea y comillas dobles', () => {
  const filas = parseCsv(
    'a,b,c\n1,"x, y","línea 1\nlínea 2"\n2,"dijo ""hola""",\n',
  );
  assert.deepEqual(filas[1], ['1', 'x, y', 'línea 1\nlínea 2']);
  assert.deepEqual(filas[2], ['2', 'dijo "hola"', '']);
});

test('CRLF y última fila sin salto de línea', () => {
  assert.deepEqual(parseCsv('a,b\r\n1,2'), [
    ['a', 'b'],
    ['1', '2'],
  ]);
});

test('con encabezado: objetos por columna', () => {
  assert.deepEqual(parseCsvConEncabezado('x,y\n1,2\n'), [{ x: '1', y: '2' }]);
});

test('una fila con otro número de celdas es un error, no un dato torcido', () => {
  assert.throws(
    () => parseCsvConEncabezado('x,y\n1,2,3\n', 'prueba.csv'),
    /prueba\.csv: la fila 2 tiene 3 celdas/,
  );
});

test('comillas sin cerrar son un error', () => {
  assert.throws(() => parseCsv('a,b\n1,"2\n'), /comillas sin cerrar/);
});
