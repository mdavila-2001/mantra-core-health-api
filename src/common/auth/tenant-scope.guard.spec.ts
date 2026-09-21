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
