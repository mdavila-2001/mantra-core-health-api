import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test, { before } from 'node:test';
import { buildSourceIndex } from './ast.mjs';
import {
  construirInventarioDeEndpoints,
  resumir,
} from './inventario-endpoints.mjs';
import { claveDeHandler } from './handlers.mjs';
import { renderModulo } from './markdown-endpoints.mjs';
import { loadContract } from './openapi.mjs';

// Se construye una sola vez (tarda ~20 s) contra el código y el modelo reales.
let endpoints;
before(() => {
  endpoints = construirInventarioDeEndpoints({ root: process.cwd() }).endpoints;
});

test('cardinalidad: todas las operaciones del contrato más todos los handlers del código', () => {
  const contrato = loadContract(process.cwd()).operations();
  const handlers = buildSourceIndex(process.cwd()).controllerMethods;
  assert.equal(
    endpoints.filter((e) => e.origen === 'CONTRATO').length,
    contrato.length,
  );
  // Un controlador con varias rutas base (`@Controller(['a', 'b'])`) publica cada handler
  // una vez por ruta (`Controlador_método[0]`, `[1]`): el handler es uno, las operaciones son
  // varias. Los handlers que el contrato no publica entran una vez como CONTRATO_AUSENTE.
  const publicados = new Set(
    contrato.map((c) => claveDeHandler(c.operation.operationId)),
  );
  const sinContrato = [...handlers.keys()].filter((k) => !publicados.has(k));
  assert.equal(
    endpoints.length,
    contrato.length + sinContrato.length,
    'cada operación del contrato está una vez, y cada handler que el contrato no publica también',
  );
  assert.deepEqual(
    new Set(
      endpoints.map((e) => `${e.codigo.controlador}_${e.codigo.handler}`),
    ),
    new Set(handlers.keys()),
    'ningún handler del código queda fuera del inventario',
  );
  assert.equal(
    new Set(endpoints.map((e) => e.id)).size,
    endpoints.length,
    'ids únicos',
  );
});

test('un controlador con varias rutas base publica cada handler por cada ruta y todas encuentran su handler', () => {
  assert.equal(
    claveDeHandler('InsuranceCampaignsController_list[1]'),
    'InsuranceCampaignsController_list',
  );
  assert.equal(
    claveDeHandler('IamAuthController_login__v2'),
    'IamAuthController_login',
  );
  const campanas = endpoints.filter((e) =>
    e.id.startsWith('InsuranceCampaignsController_list['),
  );
  assert.equal(campanas.length, 2, 'una operación por ruta base');
  for (const e of campanas) {
    assert.equal(e.origen, 'CONTRATO');
    assert.ok(e.codigo, `${e.id} encuentra su handler`);
  }
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
  assert.equal(e.bloque.nombre, 'Práctica y Agenda');
  assert.ok(e.pruebas.some((p) => p.tipo === 'INTEGRACION'));
  assert.equal(e.explicacion.negocio.estado, 'AUTO_DETECTADA');
});

test('los casos de uso salen de la tabla «UC → ruta» del README del módulo', () => {
  const e = endpoints.find(
    (x) =>
      x.metodo === 'POST' &&
      x.ruta === '/ads/business-managers/{bmId}/ad-accounts',
  );
  assert.equal(e.casosDeUso[0].id, 'UC-43-01');
  assert.match(e.casosDeUso[0].fuente, /^src\/modules\/ads\/README\.md:\d+$/);
  assert.equal(e.explicacion.negocio.estado, 'AUTO_DETECTADA');
});

test('una operación sólo-código se lee del código: cuerpo por @Body y ruta con {param}', () => {
  // Hoy el contrato publica todas las rutas del código, así que la lectura «sólo código» se
  // prueba con un repo mínimo: un controlador que el contrato (vacío) no publica.
  const root = fs.mkdtempSync(
    path.join(os.tmpdir(), 'inventario-solo-codigo-'),
  );
  const escribir = (ruta, texto) => {
    fs.mkdirSync(path.dirname(path.join(root, ruta)), { recursive: true });
    fs.writeFileSync(path.join(root, ruta), texto);
  };
  escribir(
    'openapi/openapi.json',
    JSON.stringify({
      openapi: '3.0.0',
      paths: {},
      components: { schemas: {} },
    }),
  );
  escribir(
    'src/modules/m/controllers/estado.controller.ts',
    `import { Body, Controller, Param, Put } from '@nestjs/common';
export class CambiarEstadoDto { estado!: string; }
@Controller('m/items')
export class EstadoController {
  @Put(':id/estado')
  cambiar(@Param('id') id: string, @Body() dto: CambiarEstadoDto) {
    return { id, estado: dto.estado };
  }
}
`,
  );
  const { endpoints: lista } = construirInventarioDeEndpoints({
    root,
    modelRoot: path.join(root, 'sin-modelo'),
  });
  const e = lista.find(
    (x) =>
      x.origen === 'CONTRATO_AUSENTE' &&
      x.metodo === 'PUT' &&
      x.ruta === '/m/items/{id}/estado',
  );
  assert.ok(
    e,
    'PUT /m/items/{id}/estado existe en el código y no en el contrato',
  );
  assert.equal(e.cuerpo?.dto, 'CambiarEstadoDto', 'el DTO se obtiene de @Body');
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
