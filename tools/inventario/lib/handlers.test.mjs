import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { buildHandlerTable, DELEGACION } from './handlers.mjs';

const CONTROLADOR = `
import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Post, Put } from '@nestjs/common';
import { Public, Roles, RequiresVerifiedIdentity } from '../../common';

@Controller('widgets')
export class WidgetsController {
  constructor(
    private readonly service: WidgetsService,
    private readonly sinTipo,
  ) {}

  /** Lista widgets. */
  @Get()
  @Roles('WIDGET_ADMIN', 'WIDGET_READER')
  list() {
    return this.service.list();
  }

  @Post(':id/activate')
  @HttpCode(HttpStatus.OK)
  @RequiresVerifiedIdentity()
  @Roles('WIDGET_ADMIN')
  activate(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.activate(id);
  }

  @Public()
  @Get('public')
  publico() {
    return { ok: true };
  }

  @Get('raro')
  raro() {
    return this.sinTipo.hacer();
  }

  @Put(':id')
  @Roles('WIDGET_ADMIN')
  soloCodigo(@Param('id') id: string) {
    return this.service.update(id);
  }
}
`;

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'inventario-handlers-'));
  const dir = path.join(root, 'src', 'modules', 'widgets', 'controllers');
  fs.mkdirSync(dir, { recursive: true });
  fs.mkdirSync(path.join(root, 'openapi'));
  fs.writeFileSync(path.join(dir, 'widgets.controller.ts'), CONTROLADOR);
  const op = (operationId, security = [{ bearer: [] }]) => ({
    operationId,
    security,
  });
  fs.writeFileSync(
    path.join(root, 'openapi', 'openapi.json'),
    JSON.stringify({
      paths: {
        '/widgets': { get: op('WidgetsController_list') },
        '/widgets/{id}/activate': { post: op('WidgetsController_activate') },
        '/widgets/public': { get: op('WidgetsController_publico', []) },
        '/widgets/raro': { get: op('WidgetsController_raro') },
        '/widgets/fantasma': { get: op('OtroController_noExiste') },
      },
    }),
  );
  return root;
}

test('resuelve roles, identidad verificada, HttpCode y servicio de cada handler', () => {
  const { filas } = buildHandlerTable({ root: fixture() });
  const porId = Object.fromEntries(filas.map((f) => [f.operationId, f]));

  const lista = porId.WidgetsController_list;
  assert.equal(lista.encontrado, true);
  assert.equal(lista.modulo, 'widgets');
  assert.deepEqual(lista.roles, ['WIDGET_ADMIN', 'WIDGET_READER']);
  assert.deepEqual(lista.servicios, ['WidgetsService.list']);
  assert.equal(lista.delegacion, DELEGACION.SERVICIO);
  assert.match(
    lista.fuente,
    /^src\/modules\/widgets\/controllers\/widgets\.controller\.ts:\d+$/,
  );

  const activar = porId.WidgetsController_activate;
  assert.equal(activar.httpCode, 'HttpStatus.OK');
  assert.equal(activar.identidadVerificada, true);
  assert.deepEqual(activar.servicios, ['WidgetsService.activate']);

  assert.equal(porId.WidgetsController_publico.publica, true);
  assert.equal(
    porId.WidgetsController_publico.delegacion,
    DELEGACION.SIN_LLAMADAS,
  );
});

test('una llamada sobre una dependencia sin tipo queda NO_RESUELTA, no inventada', () => {
  const { filas } = buildHandlerTable({ root: fixture() });
  const raro = filas.find((f) => f.operationId === 'WidgetsController_raro');
  assert.equal(raro.delegacion, DELEGACION.NO_RESUELTA);
  assert.deepEqual(raro.servicios, []);
  assert.deepEqual(raro.sinResolver, ['this.sinTipo.hacer']);
});

test('una operación del contrato sin handler en el código se marca no encontrada', () => {
  const { filas } = buildHandlerTable({ root: fixture() });
  const fantasma = filas.find(
    (f) => f.operationId === 'OtroController_noExiste',
  );
  assert.equal(fantasma.encontrado, false);
  assert.equal(fantasma.fuente, null);
  assert.equal(fantasma.delegacion, null);
});

test('un handler del código sin operación en el contrato sale como huérfano con su ruta', () => {
  const { huerfanas } = buildHandlerTable({ root: fixture() });
  assert.equal(huerfanas.length, 1);
  assert.equal(huerfanas[0].clave, 'WidgetsController_soloCodigo');
  assert.equal(huerfanas[0].metodo, 'PUT');
  assert.equal(huerfanas[0].ruta, '/widgets/:id');
  assert.equal(huerfanas[0].excluidaDelContrato, false);
});

test('el filtro por módulo deja fuera lo demás', () => {
  const root = fixture();
  assert.equal(buildHandlerTable({ root, modulos: ['otro'] }).filas.length, 0);
  // sin handler ni tags, la operación no tiene módulo conocido
  assert.equal(
    buildHandlerTable({ root, modulos: ['sin-clasificar'] }).filas.length,
    1,
  );
  assert.equal(
    buildHandlerTable({ root, modulos: ['widgets'] }).filas.length,
    4,
  );
});

test('@Roles(...CONSTANTE) se resuelve al arreglo declarado; un nombre ambiguo no se adivina', () => {
  const root = fixture();
  const dir = path.join(root, 'src', 'modules', 'widgets');
  fs.writeFileSync(
    path.join(dir, 'widgets.constants.ts'),
    "export const ROLES_LECTURA = ['WIDGET_ADMIN', 'WIDGET_AUDITOR'] as const;\nexport const ROLES_REPETIDOS = ['A'] as const;\n",
  );
  fs.writeFileSync(
    path.join(dir, 'otro.constants.ts'),
    "export const ROLES_REPETIDOS = ['B'] as const;\n",
  );
  fs.writeFileSync(
    path.join(dir, 'controllers', 'spread.controller.ts'),
    `import { Controller, Get } from '@nestjs/common';
import { Roles } from '../../../common';
import { ROLES_LECTURA, ROLES_REPETIDOS } from '../widgets.constants';

@Controller('spread')
export class SpreadController {
  @Get('lectura')
  @Roles(...ROLES_LECTURA)
  lectura() {
    return 1;
  }

  @Get('repetidos')
  @Roles(...ROLES_REPETIDOS)
  repetidos() {
    return 1;
  }

  @Get('mezcla')
  @Roles('EXTRA', ...ROLES_LECTURA)
  mezcla() {
    return 1;
  }
}
`,
  );
  const contrato = path.join(root, 'openapi', 'openapi.json');
  const doc = JSON.parse(fs.readFileSync(contrato, 'utf8'));
  for (const nombre of ['lectura', 'repetidos', 'mezcla'])
    doc.paths[`/spread/${nombre}`] = {
      get: {
        operationId: `SpreadController_${nombre}`,
        security: [{ bearer: [] }],
      },
    };
  fs.writeFileSync(contrato, JSON.stringify(doc));
  const { filas } = buildHandlerTable({ root });
  const rolesDe = (id) => filas.find((f) => f.operationId === id)?.roles;
  assert.deepEqual(rolesDe('SpreadController_lectura'), [
    'WIDGET_ADMIN',
    'WIDGET_AUDITOR',
  ]);
  assert.deepEqual(rolesDe('SpreadController_mezcla'), [
    'EXTRA',
    'WIDGET_ADMIN',
    'WIDGET_AUDITOR',
  ]);
  assert.deepEqual(rolesDe('SpreadController_repetidos'), [
    '...ROLES_REPETIDOS',
  ]);
});
