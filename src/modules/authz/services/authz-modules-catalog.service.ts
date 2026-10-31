import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS, type AuthenticatedUser } from '../../../common';
import { AUTHZ } from '../authz.concepts';
import { Permissions, RolePermissions, Roles } from '../entities';
import { resolveGovernanceScope } from './authz-user-lifecycle.service';
import type {
  CellCoverage,
  GapSeverity,
  ModuleCellDto,
  ModuleEntryDto,
  ModuleGapDto,
  ModuleGrantDto,
  ModulePermissionDto,
  ModuleResourceDto,
  ModuleRoleRefDto,
  ModuleRouteStatsDto,
  ModulesCatalogDto,
  ModulesCatalogQueryDto,
} from '../dto/authz-modules-catalog.dto';
import {
  CANONICAL_ACTIONS,
  OTHER_ACTION,
  UNASSIGNED_MODULE,
  placePermission,
  proposedPermissionCode,
  isCanonicalAction,
} from './authz-modules-route-derivation';
import {
  AuthzModulesRouteInventory,
  type ModuleRoute,
} from './authz-modules-route-inventory';

/** Topes de lectura: un catálogo mayor se declara truncado, no se recorta en silencio. */
export const MODULES_CATALOG_MAX_PERMISSIONS = 5000;
export const MODULES_CATALOG_MAX_ROLES = 1000;
export const MODULES_CATALOG_MAX_GRANTS = 50000;
const SAMPLE_ROUTES = 3;

const LEGACY_ACTION: Readonly<Record<string, string>> = {
  [AUTHZ.ACTION_READ]: 'READ',
  [AUTHZ.ACTION_WRITE]: 'WRITE',
  [AUTHZ.ACTION_CREATE]: 'CREATE',
  [AUTHZ.ACTION_DELETE]: 'DELETE',
  [AUTHZ.ACTION_EXECUTE]: 'EXECUTE',
  [AUTHZ.ACTION_APPROVE]: 'APPROVE',
};
const SCOPE_CODE: Readonly<Record<string, string>> = {
  [AUTHZ.SCOPE_SELF]: 'SELF',
  [AUTHZ.SCOPE_BRANCH]: 'BRANCH',
  [AUTHZ.SCOPE_TENANT]: 'TENANT',
  [AUTHZ.SCOPE_GLOBAL]: 'GLOBAL',
};

/** Lo que esta lectura NO demuestra. Va en la respuesta para que ninguna pantalla lo omita. */
export const MODULES_CATALOG_NOTES: readonly string[] = [
  'Los controladores autorizan con `@Roles(...)` (códigos de rol). Ningún controlador evalúa un permiso fino: el catálogo de permisos lo consumen el PDP (`/authz/decisions/evaluate`, acceso clínico) y la capa de vistas (read_models).',
  'Asignar un permiso a un rol no cambia hoy lo que un endpoint permite: lo hace el `@Roles` de la ruta. Un permiso sólo vale donde un PDP o una vista lo evalúa.',
  'Los códigos propuestos (`<modulo>.<recurso>.<accion>`) se derivan de las rutas reales y NO están sembrados. Sembrarlos es una decisión humana.',
  'Una ruta con autorización no declarada (`UNDECLARED_AUTH`) puede estar autorizada en el servicio por pertenencia o propiedad; los metadatos del controlador no lo demuestran.',
];

interface PlacedPermission {
  readonly dto: ModulePermissionDto;
  /** Recurso donde cae el permiso, ya normalizado. */
  readonly resource: string;
}

interface ModuleAcc {
  routes: ModuleRoute[];
  permissions: PlacedPermission[];
}

const ACTION_ORDER: readonly string[] = [...CANONICAL_ACTIONS, OTHER_ACTION];
const SEVERITY_ORDER: Readonly<Record<GapSeverity, number>> = {
  HIGH: 0,
  MEDIUM: 1,
  LOW: 2,
};

function statsOf(routes: readonly ModuleRoute[]): ModuleRouteStatsDto {
  const count = (pred: (r: ModuleRoute) => boolean): number =>
    routes.filter(pred).length;
  return {
    total: routes.length,
    publicRoutes: count((r) => r.status === 'PUBLIC'),
    roleOnly: count((r) => r.status === 'ROLE_ONLY'),
    guardOnly: count((r) => r.status === 'GUARD_ONLY'),
    selfService: count((r) => r.status === 'SELF_SERVICE'),
    undeclaredAuth: count((r) => r.status === 'UNDECLARED_AUTH'),
    mutating: count((r) => r.mutating),
    mutatingRoleOnly: count((r) => r.mutating && r.status === 'ROLE_ONLY'),
  };
}

function coverageOf(
  hasPermission: boolean,
  routes: readonly ModuleRoute[],
): CellCoverage {
  if (hasPermission) return 'FINE_PERMISSION';
  if (routes.some((r) => r.status === 'UNDECLARED_AUTH'))
    return 'UNDECLARED_AUTH';
  if (routes.some((r) => r.status === 'ROLE_ONLY')) return 'ROLE_ONLY';
  if (routes.some((r) => r.status === 'GUARD_ONLY')) return 'GUARD_ONLY';
  return 'NOT_APPLICABLE';
}

const sorted = (values: Iterable<string>): string[] =>
  [...new Set(values)].sort((a, b) => a.localeCompare(b));

/**
 * `GET /authz/catalog/modules`: por módulo, los permisos finos agrupados por recurso y acción,
 * quién los tiene, y los HUECOS — grupos de rutas protegidas sólo por un rol grueso (o sin
 * autorización declarada) para los que no existe un permiso fino.
 *
 * Sólo lee: nada se siembra ni se escribe. Las rutas salen del inventario en vivo; los permisos
 * y sus vínculos con roles, de `authz.*`.
 */
@Injectable()
export class AuthzModulesCatalogService {
  constructor(
    private readonly em: EntityManager,
    private readonly inventory: AuthzModulesRouteInventory,
  ) {}

  /**
   * @param query - Filtro opcional por módulo.
   * @param actor - Quien lee. Un actor de plataforma ve todos los roles; uno con alcance de
   *   organización sólo los de sistema (sin tenant) y los de SU organización. Un actor con alcance
   *   sin tenant activo falla cerrado (`TENANT_REQUIRED`), nunca cae a «global».
   */
  async catalog(
    query: ModulesCatalogQueryDto,
    actor: AuthenticatedUser,
  ): Promise<ModulesCatalogDto> {
    const scope = resolveGovernanceScope(actor);
    const [permissionRows, roleRows] = await Promise.all([
      this.em.find(
        Permissions,
        {},
        {
          orderBy: { code: 'ASC' },
          limit: MODULES_CATALOG_MAX_PERMISSIONS + 1,
        },
      ),
      this.em.find(
        Roles,
        {
          stateConceptId: CONCEPTS.STATE_ACTIVE,
          ...(scope === undefined
            ? {}
            : { $or: [{ tenantId: null }, { tenantId: scope }] }),
        },
        { orderBy: { code: 'ASC' }, limit: MODULES_CATALOG_MAX_ROLES + 1 },
      ),
    ]);
    // Los vínculos se acotan a los roles ya visibles: un actor con alcance no lee, ni siquiera de
    // pasada, los permisos de un rol de otra organización.
    const visibleRoleIds = roleRows
      .slice(0, MODULES_CATALOG_MAX_ROLES)
      .map((r) => r.id);
    const bindingRows = await this.em.find(
      RolePermissions,
      {
        stateConceptId: CONCEPTS.STATE_ACTIVE,
        ...(scope === undefined ? {} : { roleId: { $in: visibleRoleIds } }),
      },
      { limit: MODULES_CATALOG_MAX_GRANTS + 1 },
    );
    const truncated =
      permissionRows.length > MODULES_CATALOG_MAX_PERMISSIONS ||
      roleRows.length > MODULES_CATALOG_MAX_ROLES ||
      bindingRows.length > MODULES_CATALOG_MAX_GRANTS;
    const permissions = permissionRows.slice(
      0,
      MODULES_CATALOG_MAX_PERMISSIONS,
    );
    const roles = roleRows.slice(0, MODULES_CATALOG_MAX_ROLES);
    const bindings = bindingRows.slice(0, MODULES_CATALOG_MAX_GRANTS);

    const roleById = new Map(roles.map((r) => [r.id, r]));
    const grantsByPermission = new Map<string, ModuleGrantDto[]>();
    for (const b of bindings) {
      const role = roleById.get(b.roleId);
      if (!role) continue;
      const effect =
        b.effectConceptId === AUTHZ.EFFECT_DENY
          ? 'DENY'
          : b.effectConceptId === AUTHZ.EFFECT_ALLOW
            ? 'ALLOW'
            : null;
      if (effect === null) continue;
      const grant: ModuleGrantDto = {
        roleId: role.id,
        roleCode: role.code,
        roleName: role.name,
        effect,
        scope: b.scopeConceptId ? (SCOPE_CODE[b.scopeConceptId] ?? null) : null,
        constraintJson:
          (b.constraintJson as Record<string, unknown> | null | undefined) ??
          null,
        fieldValueSetId: b.fieldValueSetId ?? null,
      };
      const list = grantsByPermission.get(b.permissionId);
      if (list) list.push(grant);
      else grantsByPermission.set(b.permissionId, [grant]);
    }

    const acc = new Map<string, ModuleAcc>();
    const slot = (key: string): ModuleAcc => {
      let m = acc.get(key);
      if (!m) {
        m = { routes: [], permissions: [] };
        acc.set(key, m);
      }
      return m;
    };
    for (const route of this.inventory.routes())
      slot(route.module).routes.push(route);
    for (const p of permissions) {
      const place = placePermission({
        code: p.code,
        resource: p.resource,
        legacyAction: LEGACY_ACTION[p.actionConceptId] ?? null,
      });
      slot(place.module).permissions.push({
        resource: place.resource,
        dto: {
          id: p.id,
          code: p.code,
          name: p.name,
          resource: p.resource,
          legacyAction: LEGACY_ACTION[p.actionConceptId] ?? null,
          action: place.action,
          canonicalCode: place.canonical,
          isDangerous: p.isDangerous === true,
          isActive: p.stateConceptId === CONCEPTS.STATE_ACTIVE,
          grants: grantsByPermission.get(p.id) ?? [],
        },
      });
    }

    const availableModules = sorted(acc.keys());
    const wanted = query.module;
    const entries = availableModules
      .filter((key) => wanted === undefined || key === wanted)
      .map((key) => this.entry(key, acc.get(key)!));

    const allRoutes = entries.reduce((n, e) => n + e.routes.total, 0);
    return {
      generatedAt: new Date().toISOString(),
      canonicalActions: [...CANONICAL_ACTIONS],
      notes: [...MODULES_CATALOG_NOTES],
      truncated,
      availableModules,
      summary: {
        modules: entries.length,
        permissions: entries.reduce((n, e) => n + e.permissionCount, 0),
        routes: allRoutes,
        roleOnlyRoutes: entries.reduce((n, e) => n + e.routes.roleOnly, 0),
        undeclaredAuthRoutes: entries.reduce(
          (n, e) => n + e.routes.undeclaredAuth,
          0,
        ),
        gaps: entries.reduce((n, e) => n + e.gaps.length, 0),
        modulesWithoutFinePermissions: entries.filter(
          (e) => e.routes.total > 0 && e.permissionCount === 0,
        ).length,
      },
      roles: roles.map((r): ModuleRoleRefDto => ({
        id: r.id,
        code: r.code,
        name: r.name,
        isSystem: r.isSystem,
        tenantId: r.tenantId ?? null,
      })),
      modules: entries,
    };
  }

  private entry(key: string, m: ModuleAcc): ModuleEntryDto {
    const resources = new Map<
      string,
      {
        permissions: ModulePermissionDto[];
        routes: Map<string, ModuleRoute[]>;
        permissionsByAction: Map<string, ModulePermissionDto[]>;
      }
    >();
    const resourceSlot = (name: string) => {
      let r = resources.get(name);
      if (!r) {
        r = {
          permissions: [],
          routes: new Map(),
          permissionsByAction: new Map(),
        };
        resources.set(name, r);
      }
      return r;
    };
    for (const route of m.routes) {
      const r = resourceSlot(route.resource);
      const list = r.routes.get(route.action);
      if (list) list.push(route);
      else r.routes.set(route.action, [route]);
    }
    for (const { dto: p, resource } of m.permissions) {
      const r = resourceSlot(resource);
      r.permissions.push(p);
      const list = r.permissionsByAction.get(p.action);
      if (list) list.push(p);
      else r.permissionsByAction.set(p.action, [p]);
    }

    const gaps: ModuleGapDto[] = [];
    const resourceDtos: ModuleResourceDto[] = [];
    for (const name of sorted(resources.keys())) {
      const r = resources.get(name)!;
      const actions = [
        ...new Set([...r.routes.keys(), ...r.permissionsByAction.keys()]),
      ].sort((a, b) => ACTION_ORDER.indexOf(a) - ACTION_ORDER.indexOf(b));
      const cells: ModuleCellDto[] = actions.map((action) => {
        const routes = r.routes.get(action) ?? [];
        const perms = r.permissionsByAction.get(action) ?? [];
        const canonical = isCanonicalAction(action);
        const coverage = coverageOf(perms.length > 0, routes);
        if (!canonical || perms.length > 0) {
          // sin hueco: tiene permiso fino, o la acción no es canónica
        } else {
          this.pushGaps(gaps, key, name, action, routes);
        }
        return {
          action,
          proposedCode: canonical
            ? proposedPermissionCode(key, name, action)
            : null,
          coverage,
          permissionIds: perms.map((p) => p.id),
          routeCount: routes.length,
          mutatingRouteCount: routes.filter((x) => x.mutating).length,
          undeclaredRouteCount: routes.filter(
            (x) => x.status === 'UNDECLARED_AUTH',
          ).length,
          publicRouteCount: routes.filter((x) => x.status === 'PUBLIC').length,
          routeRoles: sorted(
            routes
              .filter((x) => x.status === 'ROLE_ONLY')
              .flatMap((x) => x.roles),
          ),
        };
      });
      resourceDtos.push({
        resource: name,
        permissions: r.permissions,
        cells,
      });
    }

    const stats = statsOf(m.routes);
    if (
      m.routes.length > 0 &&
      m.permissions.length === 0 &&
      key !== UNASSIGNED_MODULE
    ) {
      const authorizable = m.routes.filter((x) => x.status !== 'PUBLIC');
      if (authorizable.length > 0) {
        gaps.unshift({
          kind: 'MODULE_WITHOUT_FINE_PERMISSIONS',
          severity: 'MEDIUM',
          module: key,
          resource: null,
          action: null,
          proposedCode: null,
          routeCount: authorizable.length,
          sampleRoutes: [],
          roles: sorted(authorizable.flatMap((x) => x.roles)),
        });
      }
    }
    gaps.sort(
      (a, b) =>
        SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] ||
        (a.resource ?? '').localeCompare(b.resource ?? '') ||
        ACTION_ORDER.indexOf(a.action ?? '') -
          ACTION_ORDER.indexOf(b.action ?? ''),
    );
    return {
      key,
      routes: stats,
      permissionCount: m.permissions.length,
      grantCount: m.permissions.reduce((n, p) => n + p.dto.grants.length, 0),
      roleCodesInCode: sorted(
        m.routes
          .filter((x) => x.status === 'ROLE_ONLY')
          .flatMap((x) => x.roles),
      ),
      resources: resourceDtos,
      gaps,
    };
  }

  /** Un hueco por (estado, recurso, acción): las rutas protegidas sólo por rol y las sin declarar. */
  private pushGaps(
    gaps: ModuleGapDto[],
    module: string,
    resource: string,
    action: string,
    routes: readonly ModuleRoute[],
  ): void {
    const code = proposedPermissionCode(
      module,
      resource,
      action as (typeof CANONICAL_ACTIONS)[number],
    );
    const groups: readonly [
      ModuleGapDto['kind'],
      (r: ModuleRoute) => boolean,
    ][] = [
      ['UNDECLARED_AUTH', (r) => r.status === 'UNDECLARED_AUTH'],
      ['ROLE_ONLY', (r) => r.status === 'ROLE_ONLY'],
      ['GUARD_ONLY', (r) => r.status === 'GUARD_ONLY'],
    ];
    for (const [kind, test] of groups) {
      const subset = routes.filter(test);
      if (subset.length === 0) continue;
      const mutating = subset.some((r) => r.mutating);
      gaps.push({
        kind,
        severity:
          kind === 'UNDECLARED_AUTH'
            ? mutating
              ? 'HIGH'
              : 'MEDIUM'
            : kind === 'ROLE_ONLY'
              ? mutating
                ? 'MEDIUM'
                : 'LOW'
              : 'LOW',
        module,
        resource,
        action,
        proposedCode: code,
        routeCount: subset.length,
        sampleRoutes: subset.slice(0, SAMPLE_ROUTES).map((r) => ({
          method: r.method,
          template: r.template,
          controller: r.controller,
          handler: r.handler,
          roles: [...r.roles],
        })),
        roles: sorted(subset.flatMap((r) => r.roles)),
      });
    }
  }
}
