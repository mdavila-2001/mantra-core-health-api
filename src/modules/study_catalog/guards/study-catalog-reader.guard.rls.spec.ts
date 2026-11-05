import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';
import { CONCEPTS } from '../../../common';
import { rlsFixture } from '../../../common/tenant/rls-transaction.testing';
import { DIR } from '../../directory/directory.concepts';
import { StudyCatalogReaderGuard } from './study-catalog-reader.guard';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
const LAB = 'aaaaaaaa-0000-0000-0000-00000000000a';

function build(tenantType: string, member: boolean) {
  const f = rlsFixture({
    findOne: mockFn(async () => ({ id: LAB, tenantTypeConceptId: tenantType })),
  });
  const repo = {
    findActiveByUserTenant: mockFn(async () => (member ? { id: 'm' } : null)),
  };
  const guard = new StudyCatalogReaderGuard(f.em, repo as any);
  const ctx = (resolvedTenantId?: string) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({
          user: { id: 'lab-user', roles: ['USER'] },
          resolvedTenantId,
        }),
      }),
    }) as any;
  return { f, repo, guard, ctx };
}

describe('StudyCatalogReaderGuard under RLS', () => {
  const previous = process.env.RLS_ENFORCE;
  beforeEach(() => {
    process.env.RLS_ENFORCE = 'true';
  });
  afterEach(() => {
    if (previous === undefined) delete process.env.RLS_ENFORCE;
    else process.env.RLS_ENFORCE = previous;
  });

  it('reads the membership inside a read-only transaction under the resolved tenant', async () => {
    const { f, repo, guard, ctx } = build(
      CONCEPTS.TENANT_TYPE_DIAGNOSTIC_CENTER,
      true,
    );
    await expect(guard.canActivate(ctx(LAB))).resolves.toBe(true);
    expect(f.transactional.mock.calls[0][1]).toEqual({ readOnly: true });
    expect(f.calls).toEqual([
      "select set_config('app.system_context', 'false', true)",
      `select set_config('app.current_tenant_id', ?, true) <- ${LAB}`,
    ]);
    expect(repo.findActiveByUserTenant).toHaveBeenCalledWith(
      f.tx,
      'lab-user',
      LAB,
      DIR.MEMBERSHIP_ACTIVE,
    );
  });

  it('a member of a tenant that is not a diagnostic center stays rejected', async () => {
    const { guard, ctx, repo } = build(CONCEPTS.TENANT_TYPE_PROVIDER, true);
    await expect(guard.canActivate(ctx(LAB))).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(repo.findActiveByUserTenant).not.toHaveBeenCalled();
  });

  it('a non-member stays rejected', async () => {
    const { guard, ctx } = build(CONCEPTS.TENANT_TYPE_DIAGNOSTIC_CENTER, false);
    await expect(guard.canActivate(ctx(LAB))).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('without a resolved tenant it rejects without opening any transaction', async () => {
    const { f, guard, ctx } = build(
      CONCEPTS.TENANT_TYPE_DIAGNOSTIC_CENTER,
      true,
    );
    await expect(guard.canActivate(ctx(undefined))).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(f.fork).not.toHaveBeenCalled();
  });
});
