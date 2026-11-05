import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { beforeAll, describe, expect, it } from '@jest/globals';
import {
  Controller,
  Delete,
  Get,
  Post,
  RequestMethod,
  UseGuards,
} from '@nestjs/common';
import {
  GUARDS_METADATA,
  METHOD_METADATA,
  MODULE_METADATA,
  PATH_METADATA,
} from '@nestjs/common/constants';
import {
  type DiscoveryService,
  MetadataScanner,
  type ModulesContainer,
} from '@nestjs/core';
import { IS_PUBLIC_KEY, Public } from '../../../common/auth/public.decorator';
import { ROLES_KEY, Roles } from '../../../common/auth/roles.decorator';
import { RouteMetadataService } from '../../../observability/route-index/route-metadata.service';
import {
  AuthzModulesRouteInventory,
  type ModuleRoute,
} from './authz-modules-route-inventory';
import {
  deriveRoute,
  moduleKeyFromClassName,
} from './authz-modules-route-derivation';

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

/**
 * Lo que Nest le da a `RouteMetadataService` (`DiscoveryService.getControllers()`), armado desde el
 * mismo contenedor: cada controlador con su instancia y el módulo que lo declara (`host`).
 */
function metadataFrom(modules: ModulesContainer): RouteMetadataService {
  const wrappers = [...modules.values()].flatMap((host: any) =>
    [...host.controllers.values()].map((w: any) => ({
      metatype: w.metatype,
      instance: Object.create(w.metatype.prototype as object),
      host,
    })),
  );
  const discovery = {
    getControllers: () => wrappers,
  } as unknown as DiscoveryService;
  const service = new RouteMetadataService(discovery, new MetadataScanner());
  service.build();
  return service;
}

const inventoryFrom = (modules: ModulesContainer) =>
  new AuthzModulesRouteInventory(metadataFrom(modules));

// ---- el escaneo de ANTES, congelado, para comparar la salida ---------------------------------
// Copia literal (salvo el formato) del `scan()` que `AuthzModulesRouteInventory` tenía antes de
// pasar a `RouteMetadataService` (commit 6ea0a8bf). No se usa en producción: es la referencia.

function legacyPathsOf(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(legacyPathsOf);
  return [typeof value === 'string' ? value : ''];
}
function legacyMetadataOf<T>(key: string, handler: object, controller: object) {
  return (Reflect.getMetadata(key, handler) ??
    Reflect.getMetadata(key, controller)) as T | undefined;
}
function legacyJoin(controllerPath: string, handlerPath: string): string {
  const parts = `${controllerPath}/${handlerPath}`
    .split('/')
    .filter((x) => x.length > 0);
  return `/${parts.join('/')}`;
}
function legacyMethodNames(prototype: object | null): string[] {
  const names = new Set<string>();
  for (
    let p = prototype;
    p !== null && p !== Object.prototype;
    p = Object.getPrototypeOf(p) as object | null
  )
    for (const name of Object.getOwnPropertyNames(p))
      if (name !== 'constructor') names.add(name);
  return [...names];
}
const LEGACY_HTTP = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
function legacyScan(modules: ModulesContainer): ModuleRoute[] {
  const found: ModuleRoute[] = [];
  for (const host of modules.values()) {
    const moduleKey = moduleKeyFromClassName(host.metatype?.name ?? '');
    if (moduleKey === '') continue;
    for (const wrapper of host.controllers.values()) {
      const controller = wrapper.metatype;
      if (typeof controller !== 'function') continue;
      const controllerPaths = legacyPathsOf(
        Reflect.getMetadata(PATH_METADATA, controller),
      );
      for (const name of legacyMethodNames(controller.prototype as object)) {
        const handler: unknown = Reflect.get(controller.prototype, name);
        if (typeof handler !== 'function') continue;
        const code: unknown = Reflect.getMetadata(METHOD_METADATA, handler);
        if (typeof code !== 'number') continue;
        const method = RequestMethod[code];
        if (method === undefined || !LEGACY_HTTP.has(method)) continue;
        const roles =
          legacyMetadataOf<string[]>(ROLES_KEY, handler, controller) ?? [];
        const isPublic =
          legacyMetadataOf<boolean>(IS_PUBLIC_KEY, handler, controller) ===
          true;
        const guards = [
          ...((Reflect.getMetadata(GUARDS_METADATA, controller) as
            unknown[] | undefined) ?? []),
          ...((Reflect.getMetadata(GUARDS_METADATA, handler) as
            unknown[] | undefined) ?? []),
        ];
        for (const controllerPath of controllerPaths)
          for (const handlerPath of legacyPathsOf(
            Reflect.getMetadata(PATH_METADATA, handler),
          )) {
            const template = legacyJoin(controllerPath, handlerPath);
            const derived = deriveRoute(method, template, moduleKey);
            found.push({
              module: moduleKey,
              method,
              template,
              controller: controller.name,
              handler: name,
              roles,
              status: isPublic
                ? 'PUBLIC'
                : roles.length > 0
                  ? 'ROLE_ONLY'
                  : guards.length > 0
                    ? 'GUARD_ONLY'
                    : derived.selfService
                      ? 'SELF_SERVICE'
                      : 'UNDECLARED_AUTH',
              resource: derived.resource,
              action: derived.action,
              mutating: derived.mutating,
            });
          }
      }
    }
  }
  return found;
}

/** Orden total (el de producción empata en módulo+plantilla+verbo cuando dos handlers coinciden). */
const canonical = (rs: readonly ModuleRoute[]) =>
  [...rs].map((r) => JSON.stringify(r)).sort((a, b) => a.localeCompare(b));

describe('AuthzModulesRouteInventory', () => {
  const routes = inventoryFrom(container()).routes();
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
    const inventory = inventoryFrom(container());
    expect(inventory.routes()).toBe(inventory.routes());
    expect(inventory.routes().every((r) => r.module !== '')).toBe(true);
  });

  it('si el índice de rutas todavía está vacío no cachea el vacío', () => {
    const vacio = {
      all: () => [] as never[],
    } as unknown as RouteMetadataService;
    const inventory = new AuthzModulesRouteInventory(vacio);
    expect(inventory.routes()).toEqual([]);
    (vacio as any).all = () => metadataFrom(container()).all();
    expect(inventory.routes().length).toBeGreaterThan(0);
  });

  it('antes/después en los casos de prueba: misma salida que el escaneo duplicado', () => {
    expect(canonical(routes)).toEqual(canonical(legacyScan(container())));
  });
});

/**
 * Antes/después sobre la API REAL: cada `*.module.ts` de `src/modules` con los controladores que
 * declara en `@Module({ controllers })`. Se importan las clases (no se arranca Nest ni se toca la
 * base): es el mismo universo de metadatos que ve la app al arrancar.
 */
describe('AuthzModulesRouteInventory · antes/después sobre todos los módulos reales', () => {
  let real: ModulesContainer;
  beforeAll(async () => {
    // Jest corre desde la raíz del repo (con ESM no hay `__dirname`).
    const raiz = join(process.cwd(), 'src', 'modules');
    const archivos = (readdirSync(raiz, { recursive: true }) as string[])
      .filter((f) => f.endsWith('.module.ts'))
      .sort();
    const hosts = new Map<string, unknown>();
    for (const f of archivos) {
      const mod = (await import(pathToFileURL(join(raiz, f)).href)) as Record<
        string,
        unknown
      >;
      for (const exp of Object.values(mod)) {
        if (typeof exp !== 'function') continue;
        const controllers = Reflect.getMetadata(
          MODULE_METADATA.CONTROLLERS,
          exp,
        ) as unknown[] | undefined;
        if (!controllers?.length || hosts.has(exp.name)) continue;
        hosts.set(exp.name, {
          metatype: exp,
          controllers: new Map(controllers.map((c, i) => [i, { metatype: c }])),
        });
      }
    }
    real = hosts as unknown as ModulesContainer;
  }, 240_000);

  it('misma lista de rutas (módulo, verbo, plantilla, roles, estado, recurso, acción)', () => {
    const despues = inventoryFrom(real).routes();
    const antes = legacyScan(real);
    // Una base de tamaño real: si el import fallara en silencio, compararíamos dos vacíos.
    expect(antes.length).toBeGreaterThan(1500);
    expect(new Set(antes.map((r) => r.module)).size).toBeGreaterThan(50);
    console.log(
      `antes/después: ${antes.length} rutas en ${new Set(antes.map((r) => r.module)).size} módulos`,
    );
    expect(despues).toHaveLength(antes.length);
    expect(canonical(despues)).toEqual(canonical(antes));
  });
});
