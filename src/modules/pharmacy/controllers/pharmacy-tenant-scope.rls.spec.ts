import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import { PharmacyTenantScopeGuard } from './pharmacy-tenant-scope.guard';

const originalRls = process.env.RLS_ENFORCE;
afterEach(() => {
  if (originalRls === undefined) delete process.env.RLS_ENFORCE;
  else process.env.RLS_ENFORCE = originalRls;
});
function setup({
  pharmacyId = 'ph-a',
  resolved = 'tenant-a',
  header = 'tenant-a',
  scoped = false,
}: {
  pharmacyId?: string;
  resolved?: string;
  header?: string;
  scoped?: boolean;
} = {}) {
  process.env.RLS_ENFORCE = 'true';
  let tenant: string | undefined;
  const execute = jest.fn(async (sql: string, values?: string[]) => {
    if (sql.includes('app.current_tenant_id')) tenant = values?.[0];
    return [];
  });
  const findOne = jest.fn(
    async (_entity: unknown, where: { id: string; tenantId?: string }) => {
      const owner = where.id === 'ph-a' ? 'tenant-a' : 'tenant-b';
      return tenant === owner && (!where.tenantId || where.tenantId === owner)
        ? { id: where.id, tenantId: owner }
        : null;
    },
  );
  const tx = { execute, findOne };
  const transactional = jest.fn(
    async (fn: (em: typeof tx) => Promise<unknown>) => {
      try {
        return await fn(tx);
      } finally {
        tenant = undefined;
      }
    },
  );
  const guard = new PharmacyTenantScopeGuard({
    fork: () => ({ findOne, transactional }),
  } as never);
  const user = scoped
    ? {
        id: 'owner',
        roles: ['SECURITY_ADMIN'],
        scopedRoles: { 'tenant-a': ['SECURITY_ADMIN'] },
        tenantIds: ['tenant-a'],
      }
    : { id: 'owner', roles: ['PHARMACY_STAFF'], tenantIds: ['tenant-a'] };
  const context = {
    switchToHttp: () => ({
      getRequest: () => ({
        user,
        resolvedTenantId: resolved || undefined,
        params: { pharmacyId },
        headers: { 'x-tenant-id': header || undefined },
      }),
    }),
  } as unknown as ExecutionContext;
  return { guard, context, execute, findOne, transactional };
}
describe('pharmacy scope guard before the RLS interceptor', () => {
  it('reads the own pharmacy under the verified tenant in a local transaction', async () => {
    const d = setup();
    await expect(d.guard.canActivate(d.context)).resolves.toBe(true);
    expect(d.transactional).toHaveBeenCalledTimes(1);
    expect(d.execute).toHaveBeenNthCalledWith(
      1,
      "select set_config('app.system_context', 'false', true)",
    );
    expect(d.execute).toHaveBeenNthCalledWith(
      2,
      "select set_config('app.current_tenant_id', ?, true)",
      ['tenant-a'],
    );
    expect(d.findOne).toHaveBeenCalledWith(expect.anything(), {
      id: 'ph-a',
      tenantId: 'tenant-a',
    });
  });
  it('keeps the peer pharmacy denied under RLS', async () => {
    const d = setup({ pharmacyId: 'ph-b' });
    await expect(d.guard.canActivate(d.context)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
  it('denies without a tenant already verified by the global guard', async () => {
    const d = setup({ resolved: '' });
    await expect(d.guard.canActivate(d.context)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(d.findOne).not.toHaveBeenCalled();
  });
  it('keeps a contradictory header denied', async () => {
    const d = setup({ header: 'tenant-b' });
    await expect(d.guard.canActivate(d.context)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
  it('retains tenant-scoped platform authorization without a global bypass', async () => {
    const d = setup({ scoped: true });
    await expect(d.guard.canActivate(d.context)).resolves.toBe(true);
    expect(d.execute).toHaveBeenCalledTimes(2);
  });
});
