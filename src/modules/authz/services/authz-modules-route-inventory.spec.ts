import { describe, expect, it } from '@jest/globals';
import { Controller, Delete, Get, Post, UseGuards } from '@nestjs/common';
import type { ModulesContainer } from '@nestjs/core';
import { Public } from '../../../common/auth/public.decorator';
import { Roles } from '../../../common/auth/roles.decorator';
import { AuthzModulesRouteInventory } from './authz-modules-route-inventory';

class DemoGuard {
  canActivate(): boolean {
    return true;
  }
}

@Controller('widgets')
@Roles('WIDGET_ADMIN')
class WidgetsController {
  @Get()
  list() {}

  @Get(':id')
  @Roles('WIDGET_READER', 'WIDGET_ADMIN')
  read() {}

  @Post()
  create() {}

  @Delete(':id')
  remove() {}
}

@Controller('open')
class OpenController {
  @Public()
  @Get('ping')
  ping() {}

  @Get('me/profile')
  mine() {}

  @Post('claims')
  undeclared() {}

  @UseGuards(DemoGuard)
  @Post('guarded')
  guarded() {}

  helper() {}
}

class WidgetsModule {}
class PharmaLabModule {}

function container(): ModulesContainer {
  const mod = (metatype: unknown, controllers: unknown[]) => ({
    metatype,
    controllers: new Map(controllers.map((c, i) => [i, { metatype: c }])),
  });
  return new Map([
    ['a', mod(WidgetsModule, [WidgetsController])],
    ['b', mod(PharmaLabModule, [OpenController])],
    ['c', mod(undefined, [OpenController])],
  ]) as unknown as ModulesContainer;
}

describe('AuthzModulesRouteInventory', () => {
  const routes = new AuthzModulesRouteInventory(container()).routes();
  const find = (module: string, method: string, template: string) =>
    routes.find(
      (r) =>
        r.module === module && r.method === method && r.template === template,
    );

  it('ubica cada controlador en el módulo que lo declara y lee sus rutas', () => {
    expect(routes.filter((r) => r.module === 'widgets')).toHaveLength(4);
    expect(routes.filter((r) => r.module === 'pharma_lab')).toHaveLength(4);
  });

  it('el @Roles del método manda sobre el del controlador, como RolesGuard', () => {
    expect(find('widgets', 'GET', '/widgets')).toMatchObject({
      roles: ['WIDGET_ADMIN'],
      status: 'ROLE_ONLY',
    });
    expect(find('widgets', 'GET', '/widgets/:id')).toMatchObject({
      roles: ['WIDGET_READER', 'WIDGET_ADMIN'],
    });
  });

  it('clasifica pública, autoservicio, con guard y sin autorización declarada', () => {
    expect(find('pharma_lab', 'GET', '/open/ping')?.status).toBe('PUBLIC');
    expect(find('pharma_lab', 'GET', '/open/me/profile')?.status).toBe(
      'SELF_SERVICE',
    );
    expect(find('pharma_lab', 'POST', '/open/guarded')?.status).toBe(
      'GUARD_ONLY',
    );
    expect(find('pharma_lab', 'POST', '/open/claims')).toMatchObject({
      status: 'UNDECLARED_AUTH',
      roles: [],
      mutating: true,
    });
  });

  it('deriva recurso y acción de cada ruta y no toma métodos sin verbo HTTP por rutas', () => {
    expect(find('widgets', 'DELETE', '/widgets/:id')).toMatchObject({
      resource: 'widgets',
      action: 'delete',
    });
    expect(routes.some((r) => r.handler === 'helper')).toBe(false);
  });

  it('inválido: un módulo sin nombre se ignora y el resultado se calcula una sola vez', () => {
    const inventory = new AuthzModulesRouteInventory(container());
    expect(inventory.routes()).toBe(inventory.routes());
    expect(inventory.routes().every((r) => r.module !== '')).toBe(true);
  });
});
