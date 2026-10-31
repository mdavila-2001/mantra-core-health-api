import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../../common/auth/roles.guard';
import { TenantScopeGuard } from '../../common/auth/tenant-scope.guard';
import type {
  AuthenticatedRequest,
  AuthenticatedUser,
} from '../../common/auth/authenticated-user.interface';
import { InsightsFactsController } from './controllers/insights-facts.controller';
import { InsightsWorkflowController } from './controllers/insights-workflow.controller';
import { InsightsWorkspaceController } from './controllers/insights-workspace.controller';

/**
 * Decisión D-7 de AloVida Insights, ejecutada de verdad: se corren
 * `TenantScopeGuard` y `RolesGuard` (en el orden de la cadena global) contra los
 * metadatos reales de `InsightsFactsController`, con actores que se parecen a un
 * token real. No se simula ningún guard.
 */
const T = '11111111-1111-1111-1111-111111111111';
const OTHER = '22222222-2222-2222-2222-222222222222';
const STRANGER = '33333333-3333-3333-3333-333333333333';

type Outcome =
  | { allowed: true; resolvedTenantId: string | undefined }
  | { allowed: false; status: number; reason: string | undefined; by: string };

const reflector = new Reflector();
const scopeGuard = new TenantScopeGuard(reflector);
const rolesGuard = new RolesGuard(reflector);

interface Target {
  readonly controller: object;
  readonly name: string;
}

function run(
  target: Target,
  user: AuthenticatedUser,
  headers: Record<string, string> = {},
): Outcome {
  const request = {
    user,
    headers,
    params: {},
    query: {},
    body: {},
  } as unknown as AuthenticatedRequest;
  const context = {
    getType: () => 'http',
    getClass: () => target.controller,
    getHandler: () =>
      (
        (target.controller as { prototype: unknown }).prototype as Record<
          string,
          object
        >
      )[target.name],
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;

  const attempt = (
    name: string,
    guard: { canActivate: (c: ExecutionContext) => unknown },
  ) => {
    try {
      guard.canActivate(context);
      return null;
    } catch (error) {
      const e = error as {
        getStatus: () => number;
        getResponse: () => { reason?: string };
      };
      return {
        allowed: false as const,
        status: e.getStatus(),
        reason: e.getResponse().reason,
        by: name,
      };
    }
  };
  return (
    attempt('TenantScopeGuard', scopeGuard) ??
    attempt('RolesGuard', rolesGuard) ?? {
      allowed: true,
      resolvedTenantId: request.resolvedTenantId,
    }
  );
}

/**
 * Todos los handlers de `/marketing/insights/*`: las lecturas de F3 y las
 * escrituras de F4. Se enumeran desde el prototipo para que un handler nuevo
 * sin metadatos no pase inadvertido.
 */
const controllers = [
  InsightsFactsController,
  InsightsWorkflowController,
  InsightsWorkspaceController,
] as const;
const handlers: Target[] = controllers.flatMap((controller) =>
  Object.getOwnPropertyNames(controller.prototype)
    .filter((name) => name !== 'constructor')
    .map((name) => ({ controller, name })),
);

/** MARKETING_MANAGER tal como lo siembra authz: rol de tenant, concedido en T. */
const manager = (over: Partial<AuthenticatedUser> = {}): AuthenticatedUser => ({
  id: 'u-mkt',
  roles: ['MARKETING_MANAGER'],
  scopedRoles: { [T]: ['MARKETING_MANAGER'] },
  tenantIds: [T],
  ...over,
});

it('la matriz D-7 cubre los 16 handlers de Insights (2 lecturas F3, 4 de alertas y reglas, 10 del espacio de trabajo)', () => {
  expect(handlers.map((h) => h.name).sort()).toEqual(
    [
      'campaignFacts',
      'catalog',
      'deleteReport',
      'deleteSavedView',
      'getNotificationPreferences',
      'getUserPreferences',
      'listReports',
      'listRules',
      'listSavedViews',
      'listWorkflow',
      'patchRule',
      'putNotificationPreferences',
      'putReport',
      'putSavedView',
      'putUserPreferences',
      'putWorkflow',
    ].sort(),
  );
});

describe.each(handlers)(
  'D-7 acceso a /marketing/insights ($controller.name · $name)',
  (handler) => {
    describe('(a) MARKETING_MANAGER con X-Tenant-Id de su tenant', () => {
      it('autoriza y deja resuelto ese tenant', () => {
        expect(run(handler, manager(), { 'x-tenant-id': T })).toEqual({
          allowed: true,
          resolvedTenantId: T,
        });
      });

      it('con una sola membresía autoriza también sin cabecera', () => {
        expect(run(handler, manager())).toEqual({
          allowed: true,
          resolvedTenantId: T,
        });
      });

      it('con varias membresías y el rol solo en T, autoriza con la cabecera de T', () => {
        const actor = manager({ tenantIds: [T, OTHER] });
        expect(run(handler, actor, { 'x-tenant-id': T }).allowed).toBe(true);
      });
    });

    describe('(b) el mismo actor con la cabecera de OTRO tenant', () => {
      it('es miembro del otro tenant pero sin el rol allí → 403 ROLE_INSUFFICIENT (RolesGuard)', () => {
        const actor = manager({ tenantIds: [T, OTHER] });
        expect(run(handler, actor, { 'x-tenant-id': OTHER })).toMatchObject({
          allowed: false,
          status: 403,
          by: 'RolesGuard',
          reason: 'ROLE_INSUFFICIENT',
        });
      });

      it('no es miembro del otro tenant → 403 TENANT_MEMBERSHIP_REQUIRED (TenantScopeGuard)', () => {
        expect(
          run(handler, manager(), { 'x-tenant-id': STRANGER }),
        ).toMatchObject({
          allowed: false,
          status: 403,
          by: 'TenantScopeGuard',
          reason: 'TENANT_MEMBERSHIP_REQUIRED',
        });
      });
    });

    describe('(c) el mismo actor sin cabecera', () => {
      it('con varias membresías → 403 TENANT_AMBIGUOUS', () => {
        const actor = manager({ tenantIds: [T, OTHER] });
        expect(run(handler, actor)).toMatchObject({
          allowed: false,
          status: 403,
          by: 'TenantScopeGuard',
          reason: 'TENANT_AMBIGUOUS',
        });
      });

      it('sin ninguna membresía → 403 TENANT_REQUIRED', () => {
        expect(run(handler, manager({ tenantIds: [] }))).toMatchObject({
          allowed: false,
          status: 403,
          reason: 'TENANT_REQUIRED',
        });
      });
    });

    describe('(d) roles de plataforma globales sin cabecera', () => {
      it.each(['PLATFORM_ADMIN', 'DATA_PLATFORM_ADMIN', 'SUPERADMIN'])(
        '%s global autoriza y no resuelve tenant',
        (role) => {
          const actor: AuthenticatedUser = { id: 'u-plat', roles: [role] };
          expect(run(handler, actor)).toEqual({
            allowed: true,
            resolvedTenantId: undefined,
          });
        },
      );

      it('PLATFORM_ADMIN global con varias membresías tampoco necesita cabecera', () => {
        const actor: AuthenticatedUser = {
          id: 'u-plat',
          roles: ['PLATFORM_ADMIN'],
          tenantIds: [T, OTHER],
        };
        expect(run(handler, actor).allowed).toBe(true);
      });

      it('un PLATFORM_ADMIN acotado a un tenant (scopedRoles) NO es de plataforma: sin cabecera y con varias membresías → TENANT_AMBIGUOUS', () => {
        const actor: AuthenticatedUser = {
          id: 'u-plat',
          roles: ['PLATFORM_ADMIN'],
          scopedRoles: { [T]: ['PLATFORM_ADMIN'] },
          tenantIds: [T, OTHER],
        };
        expect(run(handler, actor)).toMatchObject({
          allowed: false,
          reason: 'TENANT_AMBIGUOUS',
        });
      });
    });

    describe('(e) BUSINESS_ADMIN', () => {
      it('con cabecera y membresía → 403 ROLE_INSUFFICIENT', () => {
        const actor: AuthenticatedUser = {
          id: 'u-biz',
          roles: ['BUSINESS_ADMIN'],
          scopedRoles: { [T]: ['BUSINESS_ADMIN'] },
          tenantIds: [T],
        };
        expect(run(handler, actor, { 'x-tenant-id': T })).toMatchObject({
          allowed: false,
          status: 403,
          by: 'RolesGuard',
          reason: 'ROLE_INSUFFICIENT',
        });
      });

      it('global y sin cabecera tampoco entra (no es tenant-opcional)', () => {
        const actor: AuthenticatedUser = {
          id: 'u-biz',
          roles: ['BUSINESS_ADMIN'],
        };
        expect(run(handler, actor).allowed).toBe(false);
      });
    });

    describe('(f) sin roles', () => {
      it('con membresía y cabecera → 403 ROLE_INSUFFICIENT', () => {
        const actor: AuthenticatedUser = {
          id: 'u-none',
          roles: [],
          tenantIds: [T],
        };
        expect(run(handler, actor, { 'x-tenant-id': T })).toMatchObject({
          allowed: false,
          status: 403,
          reason: 'ROLE_INSUFFICIENT',
        });
      });

      it('sin membresía ni cabecera → rechazado', () => {
        const actor: AuthenticatedUser = { id: 'u-none', roles: [] };
        expect(run(handler, actor).allowed).toBe(false);
      });
    });
  },
);
