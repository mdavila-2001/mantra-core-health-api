import { Injectable, RequestMethod, type OnModuleInit } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { DiscoveryService, MetadataScanner } from '@nestjs/core';
import {
  AUDITED_KEY,
  NOT_AUDITED_KEY,
  joinRouteTemplate,
  type AuditedOptions,
} from '../../common/audit-trail';
import { IS_PUBLIC_KEY } from '../../common/auth/public.decorator';
import { ROLES_KEY } from '../../common/auth/roles.decorator';
import { normalizeTemplate } from './route-index.service';

/**
 * Metadatos de seguridad de cada ruta HTTP, leídos de los decoradores en tiempo de ejecución:
 * qué roles exige (`@Roles`), si es pública (`@Public`) y qué sello de bitácora declara
 * (`@Audited` / `@NotAudited`).
 *
 * Sirve a dos consumidores que no deben leer decoradores por su cuenta: la bitácora consultable
 * (para devolver la ruta de una acción de negocio, que el sello no guarda) y la deriva de
 * permisos (qué roles usa el código contra qué roles están sembrados).
 *
 * Complementa a {@link RouteIndexService}, que sólo conoce método, plantilla y `operationId`.
 */
export interface RouteSecurity {
  /** Verbo en mayúsculas; `ALL` si el handler acepta cualquiera. */
  readonly method: string;
  /** Plantilla con `:parámetro`, sin barra final. */
  readonly template: string;
  readonly controller: string;
  readonly handler: string;
  /** Roles de `@Roles(...)` (método o controlador); `null` si la ruta no declara ninguno. */
  readonly roles: readonly string[] | null;
  readonly isPublic: boolean;
  /** Acción de negocio de `@Audited`, o `null` si no la lleva. */
  readonly auditedAction: string | null;
  /** `true` si lleva `@NotAudited`. */
  readonly notAudited: boolean;
}

function pathsOf(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(pathsOf);
  return [typeof value === 'string' ? value : ''];
}

/** El metadato del handler, o el del controlador si el handler no lo declara. */
function metadataOf<T>(
  key: string,
  handler: object,
  controller: object,
): T | undefined {
  return (Reflect.getMetadata(key, handler) ??
    Reflect.getMetadata(key, controller)) as T | undefined;
}

@Injectable()
export class RouteMetadataService implements OnModuleInit {
  private entries: readonly RouteSecurity[] = [];

  constructor(
    private readonly discovery: DiscoveryService,
    private readonly scanner: MetadataScanner,
  ) {}

  onModuleInit(): void {
    this.build();
  }

  /** Recorre los controladores registrados y lee los metadatos de cada handler. */
  build(): void {
    const found: RouteSecurity[] = [];
    for (const wrapper of this.discovery.getControllers()) {
      const metatype = wrapper.metatype;
      const instance = wrapper.instance as object | null | undefined;
      if (typeof metatype !== 'function' || !instance) continue;
      const controllerPaths = pathsOf(
        Reflect.getMetadata(PATH_METADATA, metatype),
      );
      const prototype = Object.getPrototypeOf(instance) as object | null;
      for (const handlerName of this.scanner.getAllMethodNames(prototype)) {
        const target: unknown = Reflect.get(prototype ?? {}, handlerName);
        if (typeof target !== 'function') continue;
        const methodCode: unknown = Reflect.getMetadata(
          METHOD_METADATA,
          target,
        );
        if (typeof methodCode !== 'number') continue;
        const method = RequestMethod[methodCode];
        if (!method) continue;
        const roles = metadataOf<string[]>(ROLES_KEY, target, metatype);
        const audited = metadataOf<AuditedOptions>(
          AUDITED_KEY,
          target,
          metatype,
        );
        const security = {
          roles: roles ?? null,
          isPublic:
            metadataOf<boolean>(IS_PUBLIC_KEY, target, metatype) === true,
          auditedAction: audited?.action ?? null,
          notAudited:
            metadataOf<string>(NOT_AUDITED_KEY, target, metatype) !== undefined,
        };
        for (const controllerPath of controllerPaths)
          for (const handlerPath of pathsOf(
            Reflect.getMetadata(PATH_METADATA, target),
          ))
            found.push({
              method,
              template: normalizeTemplate(
                joinRouteTemplate(controllerPath, handlerPath),
              ),
              controller: metatype.name,
              handler: handlerName,
              ...security,
            });
      }
    }
    found.sort(
      (a, b) =>
        a.template.localeCompare(b.template) ||
        a.method.localeCompare(b.method) ||
        a.controller.localeCompare(b.controller),
    );
    this.entries = found;
  }

  /** Todas las rutas con sus metadatos de seguridad, ordenadas por plantilla y verbo. */
  all(): readonly RouteSecurity[] {
    return this.entries;
  }

  /**
   * Acción de negocio de `@Audited` → rutas que la sellan. Una acción puede estar en varias rutas
   * (p. ej. `CATALOG_ANNOTATION_SAVED` en la ficha del objeto y en la de la columna).
   */
  routesByAuditedAction(): ReadonlyMap<string, readonly RouteSecurity[]> {
    const mapa = new Map<string, RouteSecurity[]>();
    for (const ruta of this.entries) {
      if (!ruta.auditedAction) continue;
      mapa.set(ruta.auditedAction, [
        ...(mapa.get(ruta.auditedAction) ?? []),
        ruta,
      ]);
    }
    return mapa;
  }
}
