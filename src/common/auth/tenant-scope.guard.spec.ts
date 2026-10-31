import { jest } from '@jest/globals';
const fn = jest.fn as unknown as (impl?: (...a: any[]) => any) => any;
import { ForbiddenException } from '@nestjs/common';
import { TenantScopeGuard } from './tenant-scope.guard';
import type { AuthenticatedUser } from './authenticated-user.interface';

function contextFor(
  user: AuthenticatedUser | undefined,
  headers: Record<string, string> = {},
  isPublic = false,
  isTenantAgnostic = false,
) {
  const request: {
    user?: AuthenticatedUser;
    headers: Record<string, string>;
    resolvedTenantId?: string;
  } = { user, headers };
  return {
    request,
    context: {
      getType: () => 'http',
      switchToHttp: () => ({ getRequest: () => request }),
      getHandler: () => fn(),
      getClass: () => fn(),
    } as never,
    isPublic,
    isTenantAgnostic,
  };
}

function build(isPublic: boolean, isTenantAgnostic: boolean) {
  const reflector = {
    getAllAndOverride: fn((key: unknown) =>
      key === 'isTenantAgnostic' ? isTenantAgnostic : isPublic,
    ),
  };
  return new TenantScopeGuard(reflector as never);
}

describe('TenantScopeGuard (MCH-001)', () => {
  it('resuelve el único tenant del actor cuando no hay cabecera', () => {
    const guard = build(false, false);
    const { context, request } = contextFor({
      id: 'u1',
      roles: ['STORAGE_ADMIN'],
      tenantIds: ['tenant-A'],
    });

    expect(guard.canActivate(context)).toBe(true);
    expect(request.resolvedTenantId).toBe('tenant-A');
  });

  it('rechaza X-Tenant-Id de un tenant al que el actor no pertenece', () => {
    const guard = build(false, false);
    const { context } = contextFor(
      { id: 'u1', roles: [], tenantIds: ['tenant-A'] },
      { 'x-tenant-id': 'tenant-B' },
    );

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('does not make global SECURITY_ADMIN tenant-optional on undecorated routes', () => {
    const { context } = contextFor({ id: 'admin', roles: ['SECURITY_ADMIN'] });
    expect(() => build(false, false).canActivate(context)).toThrow(
      ForbiddenException,
    );
  });

  it('un actor sin usuario (ruta pública) pasa sin resolver nada', () => {
    const guard = build(false, false);
    const { context, request } = contextFor(undefined);

    expect(guard.canActivate(context)).toBe(true);
    expect(request.resolvedTenantId).toBeUndefined();
  });

  it('una ruta pública no resuelve tenant aunque haya usuario', () => {
    const guard = build(true, false);
    const { context, request } = contextFor({
      id: 'u1',
      roles: [],
      tenantIds: ['tenant-A'],
    });

    expect(guard.canActivate(context)).toBe(true);
    expect(request.resolvedTenantId).toBeUndefined();
  });
});

describe('TenantScopeGuard: @PlatformScopeOptional (H2)', () => {
  const guardFor = (marked: boolean) =>
    new TenantScopeGuard({
      getAllAndOverride: fn((key: unknown) =>
        key === 'platformScopeOptional'
          ? marked
          : key === 'requiredRoles'
            ? ['PLATFORM_ADMIN', 'GOVERNANCE_ADMIN']
            : false,
      ),
    } as never);
  const two = ['tenant-A', 'tenant-B'];

  it('plataforma global, 2 membresías, sin cabecera → pasa sin tenant', () => {
    const { context, request } = contextFor({
      id: 'p1',
      roles: ['PLATFORM_ADMIN'],
      tenantIds: two,
    });
    expect(guardFor(true).canActivate(context)).toBe(true);
    expect(request.resolvedTenantId).toBeUndefined();
  });

  it('GOVERNANCE_ADMIN global (rol que la ruta acepta) sin cabecera → pasa', () => {
    const { context } = contextFor({
      id: 'p1',
      roles: ['GOVERNANCE_ADMIN'],
      tenantIds: two,
    });
    expect(guardFor(true).canActivate(context)).toBe(true);
  });

  it('DATA_PLATFORM_ADMIN global que la ruta no acepta → sin alcance plataforma (TENANT_AMBIGUOUS)', () => {
    const { context } = contextFor({
      id: 'p1',
      roles: ['DATA_PLATFORM_ADMIN'],
      tenantIds: two,
    });
    expect(() => guardFor(true).canActivate(context)).toThrow(
      expect.objectContaining({
        response: expect.objectContaining({ reason: 'TENANT_AMBIGUOUS' }),
      }),
    );
  });

  it('rol de plataforma global ajeno a la ruta + rol de la ruta sólo acotado a un tenant → no hay alcance plataforma', () => {
    const { context } = contextFor({
      id: 'p1',
      roles: ['DATA_PLATFORM_ADMIN'],
      scopedRoles: { 'tenant-A': ['PLATFORM_ADMIN'] },
      tenantIds: two,
    } as never);
    expect(() => guardFor(true).canActivate(context)).toThrow(
      expect.objectContaining({
        response: expect.objectContaining({ reason: 'TENANT_AMBIGUOUS' }),
      }),
    );
  });

  it('con cabecera de tenant propio → resuelve ese tenant', () => {
    const { context, request } = contextFor(
      { id: 'p1', roles: ['PLATFORM_ADMIN'], tenantIds: two },
      { 'x-tenant-id': 'tenant-B' },
    );
    expect(guardFor(true).canActivate(context)).toBe(true);
    expect(request.resolvedTenantId).toBe('tenant-B');
  });

  it('con cabecera de tenant ajeno → TENANT_MEMBERSHIP_REQUIRED', () => {
    const { context } = contextFor(
      { id: 'p1', roles: ['PLATFORM_ADMIN'], tenantIds: two },
      { 'x-tenant-id': 'tenant-Z' },
    );
    try {
      guardFor(true).canActivate(context);
      throw new Error('debía lanzar');
    } catch (error) {
      expect(error).toBeInstanceOf(ForbiddenException);
      expect(
        ((error as ForbiddenException).getResponse() as { reason?: string })
          .reason,
      ).toBe('TENANT_MEMBERSHIP_REQUIRED');
    }
  });

  it('PLATFORM_ADMIN con ámbito de tenant (scopedRoles) → TENANT_AMBIGUOUS', () => {
    const { context } = contextFor({
      id: 'p1',
      roles: ['PLATFORM_ADMIN'],
      scopedRoles: { 'tenant-A': ['PLATFORM_ADMIN'] },
      tenantIds: two,
    });
    try {
      guardFor(true).canActivate(context);
      throw new Error('debía lanzar');
    } catch (error) {
      expect(
        ((error as ForbiddenException).getResponse() as { reason?: string })
          .reason,
      ).toBe('TENANT_AMBIGUOUS');
    }
  });

  it('BUSINESS_ADMIN con 2 membresías sin cabecera → TENANT_AMBIGUOUS', () => {
    const { context } = contextFor({
      id: 'b1',
      roles: ['BUSINESS_ADMIN'],
      tenantIds: two,
    });
    expect(() => guardFor(true).canActivate(context)).toThrow(
      ForbiddenException,
    );
  });

  it('ruta sin marcar: PLATFORM_ADMIN global sin cabecera sigue en 403', () => {
    const { context } = contextFor({
      id: 'p1',
      roles: ['PLATFORM_ADMIN'],
      tenantIds: two,
    });
    expect(() => guardFor(false).canActivate(context)).toThrow(
      ForbiddenException,
    );
  });
});
