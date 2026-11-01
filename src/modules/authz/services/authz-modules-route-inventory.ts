import { Injectable, RequestMethod } from '@nestjs/common';
import {
  GUARDS_METADATA,
  METHOD_METADATA,
  PATH_METADATA,
} from '@nestjs/common/constants';
import { ModulesContainer } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../../../common/auth/public.decorator';
import { ROLES_KEY } from '../../../common/auth/roles.decorator';
import type { RouteAuthStatus } from '../dto/authz-modules-catalog.dto';
import {
  deriveRoute,
  moduleKeyFromClassName,
  type CanonicalAction,
} from './authz-modules-route-derivation';

/** Una ruta HTTP con lo que se necesita para ubicarla en la matriz y juzgar su autorización. */
export interface ModuleRoute {
  readonly module: string;
  readonly method: string;
  readonly template: string;
  readonly controller: string;
  readonly handler: string;
  readonly roles: readonly string[];
  readonly status: RouteAuthStatus;
  readonly resource: string;
  readonly action: CanonicalAction;
  readonly mutating: boolean;
}

const HTTP_METHODS: ReadonlySet<string> = new Set([
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
]);

function pathsOf(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(pathsOf);
  return [typeof value === 'string' ? value : ''];
}

/** El metadato del handler, o el del controlador si el handler no lo declara (como `RolesGuard`). */
function metadataOf<T>(
  key: string,
  handler: object,
  controller: object,
): T | undefined {
  return (Reflect.getMetadata(key, handler) ??
    Reflect.getMetadata(key, controller)) as T | undefined;
}

function joinTemplate(controllerPath: string, handlerPath: string): string {
  const parts = `${controllerPath}/${handlerPath}`
    .split('/')
    .filter((s) => s.length > 0);
  return `/${parts.join('/')}`;
}

/** Nombres de método del prototipo y de sus ancestros (sin `Object.prototype`). */
function methodNames(prototype: object | null): string[] {
  const names = new Set<string>();
  for (
    let p = prototype;
    p !== null && p !== Object.prototype;
    p = Object.getPrototypeOf(p) as object | null
  ) {
    for (const name of Object.getOwnPropertyNames(p)) {
      if (name !== 'constructor') names.add(name);
    }
  }
  return [...names];
}

/**
 * Inventario de las rutas HTTP registradas, leído de los decoradores en tiempo de ejecución.
 *
 * Recorre el `ModulesContainer` (disponible en cualquier módulo de Nest sin importar nada), así
 * que sabe a qué módulo pertenece cada controlador. No instancia ni ejecuta nada: sólo lee
 * metadatos. Las rutas no cambian después del arranque, así que se calcula una vez.
 */
@Injectable()
export class AuthzModulesRouteInventory {
  private cache: readonly ModuleRoute[] | null = null;

  constructor(private readonly modules: ModulesContainer) {}

  routes(): readonly ModuleRoute[] {
    this.cache ??= this.scan();
    return this.cache;
  }

  private scan(): readonly ModuleRoute[] {
    const found: ModuleRoute[] = [];
    for (const host of this.modules.values()) {
      const moduleKey = moduleKeyFromClassName(host.metatype?.name ?? '');
      if (moduleKey === '') continue;
      for (const wrapper of host.controllers.values()) {
        const controller = wrapper.metatype;
        if (typeof controller !== 'function') continue;
        const controllerPaths = pathsOf(
          Reflect.getMetadata(PATH_METADATA, controller),
        );
        for (const name of methodNames(controller.prototype as object)) {
          const handler: unknown = Reflect.get(controller.prototype, name);
          if (typeof handler !== 'function') continue;
          const code: unknown = Reflect.getMetadata(METHOD_METADATA, handler);
          if (typeof code !== 'number') continue;
          const method = RequestMethod[code];
          if (method === undefined || !HTTP_METHODS.has(method)) continue;

          const roles =
            metadataOf<string[]>(ROLES_KEY, handler, controller) ?? [];
          const isPublic =
            metadataOf<boolean>(IS_PUBLIC_KEY, handler, controller) === true;
          const guards = [
            ...((Reflect.getMetadata(GUARDS_METADATA, controller) as
              unknown[] | undefined) ?? []),
            ...((Reflect.getMetadata(GUARDS_METADATA, handler) as
              unknown[] | undefined) ?? []),
          ];
          for (const controllerPath of controllerPaths) {
            for (const handlerPath of pathsOf(
              Reflect.getMetadata(PATH_METADATA, handler),
            )) {
              const template = joinTemplate(controllerPath, handlerPath);
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
    }
    return found.sort(
      (a, b) =>
        a.module.localeCompare(b.module) ||
        a.template.localeCompare(b.template) ||
        a.method.localeCompare(b.method),
    );
  }
}
