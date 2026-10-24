import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import test, { before } from 'node:test';
import { buildSourceIndex } from './ast.mjs';
import {
  construirInventarioDeEndpoints,
  resumir,
} from './inventario-endpoints.mjs';
import { renderModulo } from './markdown-endpoints.mjs';
import { loadContract } from './openapi.mjs';

// Se construye una sola vez (tarda ~20 s) contra el código y el modelo reales.
let endpoints;
before(() => {
  endpoints = construirInventarioDeEndpoints({ root: process.cwd() }).endpoints;
});

test('cardinalidad: todas las operaciones del contrato más todos los handlers del código', () => {
  const contrato = loadContract(process.cwd()).operations();
  const handlers = buildSourceIndex(process.cwd()).controllerMethods.size;
  assert.equal(
    endpoints.filter((e) => e.origen === 'CONTRATO').length,
    contrato.length,
  );
  assert.equal(
    endpoints.length,
    handlers,
    'cada handler del código está exactamente una vez',
  );
  assert.equal(
    new Set(endpoints.map((e) => e.id)).size,
    endpoints.length,
    'ids únicos',
  );
});

test('ninguna operación queda sin requerimientos, ni con el handler sin localizar', () => {
  assert.deepEqual(
    endpoints.filter((e) => !e.requerimientos.length).map((e) => e.id),
    [],
  );
  assert.deepEqual(
    endpoints.filter((e) => !e.codigo).map((e) => e.id),
    [],
  );
});

test('trinquete: una operación sin tablas siempre dice por qué (o declara SIN_DETERMINAR a la vista)', () => {
  const sinTablas = endpoints.filter((e) => !e.tablas.length);
  assert.ok(
    sinTablas.every((e) => e.sinTablas),
    'todas traen el objeto sinTablas',
  );
  const sinDeterminar = sinTablas.filter(
    (e) => e.sinTablas.revision === 'SIN_DETERMINAR',
  );
  // Si aparece una operación nueva que no toca tablas y nadie explicó por qué, esta
  // prueba falla: hay que agregarla a tools/inventario/curado/sin-tablas.json.
  assert.deepEqual(
    sinDeterminar.map((e) => `${e.metodo} ${e.ruta}`),
    [],
  );
});

test('el riesgo es coherente con lo que la operación hace', () => {
  for (const e of endpoints) {
    const escribe = e.tablas.some((t) => t.operacion !== 'LEE');
    const borra = e.tablas.some((t) => t.operacion === 'BORRA');
    if (borra) assert.equal(e.riesgo.nivel, 'ALTO', e.id);
    if (e.autenticacion.publica && escribe)
      assert.equal(e.riesgo.nivel, 'ALTO', e.id);
    if (!escribe) assert.equal(e.riesgo.nivel, 'BAJO', e.id);
  }
});

test('los datos personales NO están clasificados: el inventario no finge una clasificación que el modelo no tiene', () => {
  assert.ok(endpoints.every((e) => e.datosPersonales.estado === 'SIN_FUENTE'));
});

test('el caso de punta a punta: reservar un cupo', () => {
  const e = endpoints.find(
    (x) => x.metodo === 'POST' && x.ruta === '/scheduling/slots/{id}/holds',
  );
  const tablas = e.tablas.map((t) => `${t.schema}.${t.tabla}:${t.detalle}`);
  assert.ok(tablas.includes('scheduling.slot_holds:CREA'));
  assert.ok(tablas.includes('scheduling.bookable_slots:ACTUALIZA'));
  assert.equal(e.cuerpo.dto, 'CreateHoldDto');
  assert.deepEqual(e.cuerpo.payloadMinimo, {});
  assert.equal(e.casosDeUso[0].id, 'UC-41-05');
  assert.equal(e.bloque.nombre, 'Práctica y Agenda');
  assert.ok(e.pruebas.some((p) => p.tipo === 'INTEGRACION'));
  assert.equal(e.explicacion.negocio.estado, 'AUTO_DETECTADA');
});

test('una operación sólo-código se lee del código: cuerpo por @Body y ruta con {param}', () => {
  const e = endpoints.find(
    (x) =>
      x.origen === 'CONTRATO_AUSENTE' &&
      x.metodo === 'PUT' &&
      x.ruta === '/scheduling/bookings/{id}/payment-state',
  );
  assert.ok(
    e,
    'PUT /scheduling/bookings/{id}/payment-state existe en el código y no en el contrato',
  );
  assert.ok(e.cuerpo?.dto, 'el DTO se obtiene de @Body');
  assert.ok(e.parametros.some((p) => p.nombre === 'id' && p.en === 'path'));
});

test('resumir cuenta lo mismo que se ve', () => {
  const r = resumir(endpoints);
  assert.equal(r.total, endpoints.length);
  assert.equal(
    r.porRiesgo.ALTO + r.porRiesgo.MEDIO + r.porRiesgo.BAJO,
    endpoints.length,
  );
  assert.equal(r.conTablas, endpoints.filter((e) => e.tablas.length).length);
});

test('el markdown de un módulo incluye cada operación, y escapa lo que rompería una tabla', () => {
  const lista = endpoints.filter((e) => e.modulo === 'audit');
  const texto = renderModulo('audit', lista);
  for (const e of lista)
    assert.ok(texto.includes(`${e.metodo} ${e.ruta}`), e.id);
  const raro = { ...lista[0], nombre: 'tiene | una barra\ny un salto' };
  const tabla = renderModulo('audit', [raro])
    .split('\n')
    .find((l) => l.includes('tiene'));
  assert.ok(tabla.includes('tiene \\| una barra y un salto'), tabla);
});

test('lo escrito en disco está al día con el código (si falla: node tools/inventario/endpoints.mjs)', () => {
  const salida = execFileSync(
    'node',
    ['tools/inventario/endpoints.mjs', '--verificar'],
    { encoding: 'utf8' },
  );
  assert.match(salida, /Inventario al día: \d+ operaciones/);
  assert.ok(fs.existsSync('inventario/endpoints/indice.json'));
});
