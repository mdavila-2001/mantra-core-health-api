import { describe, expect, it } from '@jest/globals';
import { CONCEPTS, type AuthenticatedUser } from '../../../common';
import { runWithTenant } from '../../../common/tenant/tenant-context';
import { AUTHZ } from '../authz.concepts';
import { Permissions, RolePermissions, Roles } from '../entities';
import {
  AuthzModulesCatalogService,
  MODULES_CATALOG_MAX_ROLES,
} from './authz-modules-catalog.service';
import type { ModuleRoute } from './authz-modules-route-inventory';

const TENANT_A = 'aaaaaaaa-0000-4000-8000-00000000000a';
const TENANT_B = 'bbbbbbbb-0000-4000-8000-00000000000b';
const PLATFORM = {
  id: 'admin-1',
  roles: ['SECURITY_ADMIN'],
} as unknown as AuthenticatedUser;
const SCOPED_A = {
  id: 'admin-a',
  roles: ['SECURITY_ADMIN'],
  scopedRoles: { [TENANT_A]: ['SECURITY_ADMIN'] },
} as unknown as AuthenticatedUser;

const route = (over: Partial<ModuleRoute>): ModuleRoute => ({
  module: 'pharma_lab',
  method: 'GET',
  template: '/pharma-labs/:id/products',
  controller: 'PharmaLabProductsController',
  handler: 'list',
  roles: ['PHARMA_LAB_ADMIN'],
  status: 'ROLE_ONLY',
  resource: 'products',
  action: 'list',
  mutating: false,
  ...over,
});

const ROUTES: ModuleRoute[] = [
  route({}),
  route({
    method: 'POST',
    template: '/pharma-labs/:id/products',
    handler: 'create',
    action: 'create',
    mutating: true,
    roles: ['PHARMA_LAB_ADMIN', 'SYSTEM'],
  }),
  route({
    method: 'POST',
    template: '/pharma-labs/notices/:id/read',
    handler: 'markRead',
    resource: 'notices',
    action: 'update',
    mutating: true,
    roles: [],
    status: 'UNDECLARED_AUTH',
  }),
  route({
    module: 'ops',
    template: '/ops/ping',
    resource: 'ping',
    action: 'read',
    roles: [],
    status: 'PUBLIC',
  }),
  route({
    module: 'billing',
    template: '/billing/invoices',
    resource: 'invoices',
    roles: ['FINANCE'],
  }),
];

const permission = (over: Partial<Permissions>): Permissions =>
  ({
    id: 'p-1',
    code: 'billing.invoices.list',
    name: 'Listar facturas (SINTÉTICO)',
    resource: 'invoices',
    actionConceptId: AUTHZ.ACTION_READ,
    stateConceptId: CONCEPTS.STATE_ACTIVE,
    isDangerous: false,
    ...over,
  }) as Permissions;

const role = (id: string, code: string, over: Partial<Roles> = {}): Roles =>
  ({
    id,
    code,
    name: `Rol ${code}`,
    isSystem: true,
    tenantId: undefined,
    stateConceptId: CONCEPTS.STATE_ACTIVE,
    ...over,
  }) as Roles;

const binding = (over: Partial<RolePermissions>): RolePermissions =>
  ({
    roleId: 'r-fin',
    permissionId: 'p-1',
    effectConceptId: AUTHZ.EFFECT_ALLOW,
    scopeConceptId: AUTHZ.SCOPE_TENANT,
    constraintJson: undefined,
    fieldValueSetId: undefined,
    stateConceptId: CONCEPTS.STATE_ACTIVE,
    ...over,
  }) as RolePermissions;

/** Aplica a mano el filtro de tenant que la consulta real le pide a la base. */
function matches(
  row: Record<string, unknown>,
  where: Record<string, unknown>,
): boolean {
  const or = where['$or'] as Record<string, unknown>[] | undefined;
  if (
    or &&
    !or.some((c) => Object.entries(c).every(([k, v]) => (row[k] ?? null) === v))
  )
    return false;
  const roleId = where['roleId'] as { $in?: string[] } | undefined;
  if (roleId?.$in && !roleId.$in.includes(row['roleId'] as string))
    return false;
  return true;
}

function build(data: {
  permissions?: Permissions[];
  roles?: Roles[];
  bindings?: RolePermissions[];
  routes?: ModuleRoute[];
}) {
  const em = {
    find: async (entity: unknown, where: Record<string, unknown> = {}) => {
      if (entity === Permissions) return data.permissions ?? [];
      if (entity === Roles)
        return (data.roles ?? [])
          .filter((r) => matches(r as never, where))
          .sort((a, b) => a.code.localeCompare(b.code));
      if (entity === RolePermissions)
        return (data.bindings ?? []).filter((b) => matches(b as never, where));
      return [];
    },
  };
  const inventory = { routes: () => data.routes ?? ROUTES };
  const service = new AuthzModulesCatalogService(
    em as never,
    inventory as never,
  );
  // Por omisión lee un actor de plataforma, como los casos que no tratan de alcance.
  return {
    catalog: (
      query: { module?: string } = {},
      actor: AuthenticatedUser = PLATFORM,
    ) => service.catalog(query, actor),
  };
}

describe('AuthzModulesCatalogService', () => {
  it('correcto: agrupa permisos por recurso y acción, con los roles que los tienen', async () => {
    const service = build({
      permissions: [permission({})],
      roles: [role('r-fin', 'FINANCE')],
      bindings: [binding({ constraintJson: { maxAmount: 100 } })],
    });
    const out = await service.catalog();
    const billing = out.modules.find((m) => m.key === 'billing')!;
    const invoices = billing.resources.find((r) => r.resource === 'invoices')!;
    expect(invoices.permissions[0]).toMatchObject({
      id: 'p-1',
      action: 'list',
      canonicalCode: true,
      grants: [
        {
          roleCode: 'FINANCE',
          effect: 'ALLOW',
          scope: 'TENANT',
          constraintJson: { maxAmount: 100 },
        },
      ],
    });
    const cell = invoices.cells.find((c) => c.action === 'list')!;
    expect(cell).toMatchObject({
      coverage: 'FINE_PERMISSION',
      permissionIds: ['p-1'],
      routeCount: 1,
      routeRoles: ['FINANCE'],
    });
    expect(billing.gaps).toEqual([]);
    expect(billing.grantCount).toBe(1);
  });

  it('huecos: sin permiso fino, cada grupo de rutas con sólo @Roles o sin autorización declarada es un hueco', async () => {
    const out = await build({}).catalog();
    const lab = out.modules.find((m) => m.key === 'pharma_lab')!;
    expect(lab.permissionCount).toBe(0);
    expect(lab.gaps[0]).toMatchObject({
      kind: 'UNDECLARED_AUTH',
      severity: 'HIGH',
      proposedCode: 'pharma_lab.notices.update',
      routeCount: 1,
    });
    expect(
      lab.gaps.some(
        (g) =>
          g.kind === 'MODULE_WITHOUT_FINE_PERMISSIONS' && g.routeCount === 3,
      ),
    ).toBe(true);
    const create = lab.gaps.find(
      (g) => g.proposedCode === 'pharma_lab.products.create',
    )!;
    expect(create).toMatchObject({
      kind: 'ROLE_ONLY',
      severity: 'MEDIUM',
      roles: ['PHARMA_LAB_ADMIN', 'SYSTEM'],
    });
    expect(create.sampleRoutes[0]).toMatchObject({
      method: 'POST',
      template: '/pharma-labs/:id/products',
    });
    expect(
      lab.gaps.find((g) => g.proposedCode === 'pharma_lab.products.list')!
        .severity,
    ).toBe('LOW');
  });

  it('límite: un módulo sólo con rutas públicas no es un hueco, y el resumen cuenta módulos sin permisos finos', async () => {
    const out = await build({
      permissions: [permission({})],
      roles: [role('r-fin', 'FINANCE')],
    }).catalog();
    expect(out.modules.find((m) => m.key === 'ops')!.gaps).toEqual([]);
    expect(out.summary.modulesWithoutFinePermissions).toBe(2); // pharma_lab y ops
    expect(out.summary.routes).toBe(5);
    expect(out.summary.permissions).toBe(1);
    expect(out.canonicalActions).toHaveLength(11);
    expect(out.notes.length).toBeGreaterThan(0);
  });

  it('límite: un permiso sembrado a mano cae en el módulo de su recurso, y EXECUTE queda como other sin código propuesto', async () => {
    const out = await build({
      routes: [],
      permissions: [
        permission({
          id: 'p-d',
          code: 'DIAGNOSTIC_RESULT_READ',
          resource: 'diagnostics.diagnostic_report',
        }),
        permission({
          id: 'p-x',
          code: 'RUN_THING',
          resource: 'ops.jobs',
          actionConceptId: AUTHZ.ACTION_EXECUTE,
        }),
        permission({ id: 'p-n', code: 'PATIENT_READ', resource: 'patient' }),
      ],
    }).catalog();
    const diag = out.modules.find((m) => m.key === 'diagnostics')!;
    expect(diag.resources[0]!.permissions[0]).toMatchObject({
      canonicalCode: false,
      legacyAction: 'READ',
      action: 'read',
    });
    const ops = out.modules.find((m) => m.key === 'ops')!;
    expect(ops.resources[0]!.cells[0]).toMatchObject({
      action: 'other',
      proposedCode: null,
    });
    expect(out.modules.find((m) => m.key === 'sin_modulo')).toBeDefined();
    expect(out.availableModules).toEqual(['diagnostics', 'ops', 'sin_modulo']);
  });

  it('límite: DENY y ámbito ausente viajan tal cual; un rol inactivo o desconocido no aparece', async () => {
    const out = await build({
      permissions: [permission({})],
      roles: [role('r-fin', 'FINANCE')],
      bindings: [
        binding({
          effectConceptId: AUTHZ.EFFECT_DENY,
          scopeConceptId: undefined,
        }),
        binding({ roleId: 'r-fantasma' }),
      ],
    }).catalog();
    const grants = out.modules.find((m) => m.key === 'billing')!.resources[0]!
      .permissions[0]!.grants;
    expect(grants).toEqual([
      expect.objectContaining({
        effect: 'DENY',
        scope: null,
        constraintJson: null,
        fieldValueSetId: null,
      }),
    ]);
  });

  it('el filtro por módulo acota la respuesta pero conserva la lista de módulos disponibles', async () => {
    const out = await build({}).catalog({ module: 'billing' });
    expect(out.modules.map((m) => m.key)).toEqual(['billing']);
    expect(out.availableModules).toContain('pharma_lab');
    expect((await build({}).catalog({ module: 'no_existe' })).modules).toEqual(
      [],
    );
  });

  it('inválido: superar el tope de lectura marca la respuesta como truncada', async () => {
    const roles = Array.from(
      { length: MODULES_CATALOG_MAX_ROLES + 1 },
      (_, i) => role(`r-${i}`, `R${i}`),
    );
    const out = await build({ roles }).catalog();
    expect(out.truncated).toBe(true);
    expect(out.roles).toHaveLength(MODULES_CATALOG_MAX_ROLES);
    expect((await build({}).catalog()).truncated).toBe(false);
  });

  describe('alcance de organización (no divulga roles ajenos)', () => {
    const data = () => ({
      permissions: [permission({})],
      roles: [
        role('r-sys', 'SYSTEM_ROLE'),
        role('r-a', 'ROL_A', { tenantId: TENANT_A }),
        role('r-b', 'ROL_B', { tenantId: TENANT_B }),
      ],
      bindings: [
        binding({ roleId: 'r-sys' }),
        binding({ roleId: 'r-a' }),
        binding({ roleId: 'r-b' }),
      ],
    });
    const grantsOf = (
      out: Awaited<ReturnType<ReturnType<typeof build>['catalog']>>,
    ) =>
      out.modules
        .find((m) => m.key === 'billing')!
        .resources[0]!.permissions[0]!.grants.map((g) => g.roleCode)
        .sort();

    it('un actor con alcance ve los roles de sistema y los de su organización, y ningún vínculo de otra', async () => {
      const out = await runWithTenant(TENANT_A, () =>
        build(data()).catalog({}, SCOPED_A),
      );
      expect(out.roles.map((r) => r.code)).toEqual(['ROL_A', 'SYSTEM_ROLE']);
      expect(grantsOf(out)).toEqual(['ROL_A', 'SYSTEM_ROLE']);
      expect(JSON.stringify(out)).not.toContain('ROL_B');
    });

    it('el alcance es el del tenant verificado: otro tenant ve otros roles', async () => {
      const out = await runWithTenant(TENANT_B, () =>
        build(data()).catalog({}, SCOPED_A),
      );
      expect(out.roles.map((r) => r.code)).toEqual(['ROL_B', 'SYSTEM_ROLE']);
      expect(JSON.stringify(out)).not.toContain('ROL_A');
    });

    it('un actor de plataforma ve los roles de todas las organizaciones', async () => {
      const out = await runWithTenant(TENANT_A, () =>
        build(data()).catalog({}, PLATFORM),
      );
      expect(out.roles.map((r) => r.code)).toEqual([
        'ROL_A',
        'ROL_B',
        'SYSTEM_ROLE',
      ]);
      expect(grantsOf(out)).toEqual(['ROL_A', 'ROL_B', 'SYSTEM_ROLE']);
    });

    it('SUPERADMIN también es de plataforma', async () => {
      const root = {
        id: 'root',
        roles: ['SUPERADMIN'],
      } as unknown as AuthenticatedUser;
      const out = await build(data()).catalog({}, root);
      expect(out.roles).toHaveLength(3);
    });

    it('inválido: un actor con alcance sin tenant activo falla cerrado, no cae a global', async () => {
      await expect(build(data()).catalog({}, SCOPED_A)).rejects.toMatchObject({
        response: expect.anything(),
      });
    });
  });
});
