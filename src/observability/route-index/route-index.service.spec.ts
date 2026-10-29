import { describe, expect, it } from '@jest/globals';
import { Controller, Get, Post, All } from '@nestjs/common';
import { MetadataScanner, type DiscoveryService } from '@nestjs/core';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { AdminCatalogController } from '../../modules/data_catalog/controllers/admin-catalog.controller';
import { OpsConsoleController } from '../../modules/ops_console/presentation/controllers/ops-console.controller';
import { QaLabReadController } from '../../modules/qa_lab/presentation/controllers/qa-lab-read.controller';
import { RouteIndexService, normalizeTemplate } from './route-index.service';

type Ctor = new (...args: never[]) => object;

/** Descubridor falso: entrega la clase con un prototipo, sin armar la inyección. */
function indexOf(...controllers: Ctor[]): RouteIndexService {
  const discovery = {
    getControllers: () =>
      controllers.map((metatype) => ({
        metatype,
        instance: Object.create(metatype.prototype) as object,
      })),
  } as unknown as DiscoveryService;
  const service = new RouteIndexService(discovery, new MetadataScanner());
  service.build();
  return service;
}

@Controller('admin/demo')
class DemoController {
  @Get('items')
  list() {}

  @Get('items/:itemId')
  detail() {}

  @Post('items/:itemId/close')
  close() {}

  helper() {}
}

@Controller()
class RootController {
  @Get('ping')
  ping() {}

  @Get(['uno', 'dos'])
  twoPaths() {}
}

@Controller('legacy')
class AnyVerbController {
  @All('echo')
  echo() {}
}

@Controller('admin/demo')
class DuplicateController {
  @Get('items')
  other() {}
}

describe('normalizeTemplate', () => {
  it.each([
    ['/a/{id}/b', '/a/:id/b'],
    ['/a/b/', '/a/b'],
    ['/a//', '/a'],
    ['', '/'],
    ['/', '/'],
  ])('%s → %s', (input, expected) => {
    expect(normalizeTemplate(input)).toBe(expected);
  });
});

describe('RouteIndexService', () => {
  it('une controlador y handler en una plantilla con :parámetros', () => {
    const index = indexOf(DemoController);

    expect(index.lookup('GET', '/admin/demo/items')?.operationId).toBe(
      'DemoController_list',
    );
    expect(index.lookup('GET', '/admin/demo/items/:itemId')?.handler).toBe(
      'detail',
    );
    expect(
      index.lookup('POST', '/admin/demo/items/:itemId/close')?.controller,
    ).toBe('DemoController');
  });

  it('distingue el verbo: la misma plantilla con otro verbo no existe', () => {
    const index = indexOf(DemoController);

    expect(index.lookup('DELETE', '/admin/demo/items')).toBeNull();
    expect(index.lookup('get', '/admin/demo/items')).not.toBeNull();
  });

  it('una ruta que la API no declara devuelve null', () => {
    const index = indexOf(DemoController);

    expect(index.lookup('GET', '/no/existe')).toBeNull();
  });

  it('no indexa los métodos sin decorador de verbo', () => {
    const index = indexOf(DemoController);

    expect(index.all().map((entry) => entry.handler)).not.toContain('helper');
  });

  it('acepta la plantilla en estilo OpenAPI o con barra final', () => {
    const index = indexOf(DemoController);

    expect(index.lookup('GET', '/admin/demo/items/{itemId}')).not.toBeNull();
    expect(index.lookup('GET', '/admin/demo/items/')).not.toBeNull();
  });

  it('un controlador sin ruta propia cuelga de la raíz', () => {
    const index = indexOf(RootController);

    expect(index.lookup('GET', '/ping')?.operationId).toBe(
      'RootController_ping',
    );
  });

  it('un handler con varias rutas produce una entrada por ruta', () => {
    const index = indexOf(RootController);

    expect(index.lookup('GET', '/uno')?.handler).toBe('twoPaths');
    expect(index.lookup('GET', '/dos')?.handler).toBe('twoPaths');
  });

  it('un handler @All() responde a cualquier verbo', () => {
    const index = indexOf(AnyVerbController);

    expect(index.lookup('GET', '/legacy/echo')?.method).toBe('ALL');
    expect(index.lookup('PATCH', '/legacy/echo')?.operationId).toBe(
      'AnyVerbController_echo',
    );
  });

  it('si dos handlers declaran la misma ruta gana el de menor operationId, sin depender del orden de descubrimiento', () => {
    const first = indexOf(DemoController, DuplicateController);
    const second = indexOf(DuplicateController, DemoController);

    expect(first.lookup('GET', '/admin/demo/items')?.operationId).toBe(
      'DemoController_list',
    );
    expect(second.lookup('GET', '/admin/demo/items')?.operationId).toBe(
      'DemoController_list',
    );
  });

  it('all() sale ordenado por plantilla y verbo', () => {
    const index = indexOf(DemoController);
    const keys = index.all().map((e) => `${e.template} ${e.method}`);

    expect(keys).toEqual([...keys].sort());
  });

  it('ignora lo que no es un controlador instanciado', () => {
    const discovery = {
      getControllers: () => [
        { metatype: undefined, instance: {} },
        { metatype: DemoController, instance: null },
      ],
    } as unknown as DiscoveryService;
    const service = new RouteIndexService(discovery, new MetadataScanner());

    service.build();

    expect(service.all()).toEqual([]);
  });
});

/**
 * El `operationId` del índice tiene que ser el del contrato publicado: es lo que
 * permite al portal nombrar una ruta con el mismo identificador que ve quien lee
 * `openapi.json`. Se comprueba ruta por ruta en los controladores que usa el
 * portal.
 */
describe('RouteIndexService contra openapi.json', () => {
  const openapi = JSON.parse(
    readFileSync(join(process.cwd(), 'openapi', 'openapi.json'), 'utf8'),
  ) as {
    paths: Record<string, Record<string, { operationId?: string }>>;
  };
  const operationIdOf = (method: string, template: string) =>
    openapi.paths[template.replace(/:(\w+)/g, '{$1}')]?.[method.toLowerCase()]
      ?.operationId;

  it.each([
    ['AdminCatalogController', AdminCatalogController],
    ['OpsConsoleController', OpsConsoleController],
    ['QaLabReadController', QaLabReadController],
  ])('%s: cada ruta coincide con su operationId publicado', (_name, cls) => {
    const entries = indexOf(cls as unknown as Ctor).all();
    const distinto = entries
      .map((entry) => ({
        entry,
        publicado: operationIdOf(entry.method, entry.template),
      }))
      .filter(({ entry, publicado }) => publicado !== entry.operationId)
      .map(
        ({ entry, publicado }) =>
          `${entry.method} ${entry.template}: índice=${entry.operationId} contrato=${publicado ?? 'AUSENTE'}`,
      );

    expect(entries.length).toBeGreaterThan(5);
    expect(distinto).toEqual([]);
  });

  it('el ejemplo del plan: GET /admin/catalog/schemas', () => {
    const index = indexOf(AdminCatalogController);

    expect(index.lookup('GET', '/admin/catalog/schemas')?.operationId).toBe(
      'AdminCatalogController_schemas',
    );
  });
});
