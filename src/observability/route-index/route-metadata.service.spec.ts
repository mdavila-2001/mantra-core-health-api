import { describe, expect, it } from '@jest/globals';
import { Controller, Get, Post } from '@nestjs/common';
import { MetadataScanner, type DiscoveryService } from '@nestjs/core';
import { Audited, NotAudited } from '../../common/audit-trail';
import { Public } from '../../common/auth/public.decorator';
import { Roles } from '../../common/auth/roles.decorator';
import { RouteMetadataService } from './route-metadata.service';

type Ctor = new (...args: never[]) => object;

function metadataOf(...controllers: Ctor[]): RouteMetadataService {
  const discovery = {
    getControllers: () =>
      controllers.map((metatype) => ({
        metatype,
        instance: Object.create(metatype.prototype) as object,
      })),
  } as unknown as DiscoveryService;
  const service = new RouteMetadataService(discovery, new MetadataScanner());
  service.build();
  return service;
}

@Controller('demo')
@Roles('DEMO_ADMIN')
class ClassRolesController {
  @Get('items')
  list() {}

  @Audited({ action: 'ITEM_CREATED', entity: 'item' })
  @Post('items')
  @Roles('DEMO_WRITER')
  create() {}
}

@Controller('open')
class OpenController {
  @Public()
  @Get('ping')
  ping() {}

  @NotAudited('plomería')
  @Post('tick')
  tick() {}

  @Get('whoami')
  whoami() {}
}

@Controller('demo')
class SameActionController {
  @Audited({ action: 'ITEM_CREATED', entity: 'item' })
  @Post('items/:id/copy')
  copy() {}
}

describe('RouteMetadataService', () => {
  const index = metadataOf(
    ClassRolesController,
    OpenController,
    SameActionController,
  );
  const ruta = (method: string, template: string) =>
    index.all().find((r) => r.method === method && r.template === template);

  it('toma los roles del handler y, si no los declara, los del controlador', () => {
    expect(ruta('GET', '/demo/items')?.roles).toEqual(['DEMO_ADMIN']);
    expect(ruta('POST', '/demo/items')?.roles).toEqual(['DEMO_WRITER']);
  });

  it('una ruta sin @Roles tiene roles null; una pública, isPublic', () => {
    expect(ruta('GET', '/open/whoami')).toMatchObject({
      roles: null,
      isPublic: false,
    });
    expect(ruta('GET', '/open/ping')).toMatchObject({ isPublic: true });
  });

  it('lee el sello de bitácora de cada ruta', () => {
    expect(ruta('POST', '/demo/items')).toMatchObject({
      auditedAction: 'ITEM_CREATED',
      notAudited: false,
    });
    expect(ruta('POST', '/open/tick')).toMatchObject({
      auditedAction: null,
      notAudited: true,
    });
  });

  it('acción de negocio → todas las rutas que la sellan', () => {
    const rutas = index.routesByAuditedAction().get('ITEM_CREATED') ?? [];
    expect(rutas.map((r) => r.template).sort()).toEqual([
      '/demo/items',
      '/demo/items/:id/copy',
    ]);
  });

  it('ordena por plantilla y verbo', () => {
    const claves = index.all().map((r) => `${r.template} ${r.method}`);
    expect(claves).toEqual([...claves].sort((a, b) => a.localeCompare(b)));
  });
});
