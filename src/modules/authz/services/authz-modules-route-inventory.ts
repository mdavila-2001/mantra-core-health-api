import { Injectable } from '@nestjs/common';
import { RouteMetadataService } from '../../../observability/route-index/route-metadata.service';
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

/**
 * Inventario de las rutas HTTP registradas, agrupadas por módulo de Nest, para la matriz de RBAC.
 *
 * **No recorre decoradores por su cuenta**: lee {@link RouteMetadataService}, el único escaneo de
 * rutas de la API (método, plantilla, `@Roles` con la precedencia de `RolesGuard`, `@Public`,
 * `@UseGuards` y el módulo que declara cada controlador). Aquí sólo se clasifica cada ruta. Las
 * rutas no cambian después del arranque, así que se calcula una vez; si se pide antes de que el
 * servicio de metadatos haya construido su índice, no se cachea el vacío.
 */
@Injectable()
export class AuthzModulesRouteInventory {
  private cache: readonly ModuleRoute[] | null = null;

  constructor(private readonly metadata: RouteMetadataService) {}

  routes(): readonly ModuleRoute[] {
    if (this.cache) return this.cache;
    const built = this.build();
    if (built.length > 0) this.cache = built;
    return built;
  }

  private build(): readonly ModuleRoute[] {
    const found: ModuleRoute[] = [];
    for (const r of this.metadata.all()) {
      if (!HTTP_METHODS.has(r.method)) continue;
      const moduleKey = moduleKeyFromClassName(r.module ?? '');
      if (moduleKey === '') continue;
      const roles = r.roles ?? [];
      const derived = deriveRoute(r.method, r.template, moduleKey);
      found.push({
        module: moduleKey,
        method: r.method,
        template: r.template,
        controller: r.controller,
        handler: r.handler,
        roles,
        status: r.isPublic
          ? 'PUBLIC'
          : roles.length > 0
            ? 'ROLE_ONLY'
            : r.guarded
              ? 'GUARD_ONLY'
              : derived.selfService
                ? 'SELF_SERVICE'
                : 'UNDECLARED_AUTH',
        resource: derived.resource,
        action: derived.action,
        mutating: derived.mutating,
      });
    }
    return found.sort(
      (a, b) =>
        a.module.localeCompare(b.module) ||
        a.template.localeCompare(b.template) ||
        a.method.localeCompare(b.method),
    );
  }
}
