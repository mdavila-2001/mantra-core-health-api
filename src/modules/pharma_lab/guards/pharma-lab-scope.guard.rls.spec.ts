import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { Reflector } from '@nestjs/core';
import { ResourceNotFoundException } from '../../../common';
import { rlsFixture } from '../../../common/tenant/rls-transaction.testing';
import { PharmaLabScopeGuard } from './pharma-lab-scope.guard';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
const LAB = 'aaaaaaaa-0000-0000-0000-000000000001';
const TENANT = 'aaaaaaaa-1111-1111-1111-111111111111';
const handler = () => undefined;

function build(administers: boolean) {
  const f = rlsFixture();
  const access = {
    requireAdministeredLab: mockFn(async () => {
      if (!administers) throw new ResourceNotFoundException('no', {});
    }),
    requireVisitorOperable: mockFn(),
  };
  const visitorsRepo = { findVisitorByUser: mockFn(async () => null) };
  const guard = new PharmaLabScopeGuard(
    new Reflector(),
    f.em,
    access as any,
    visitorsRepo as any,
  );
  const ctx = (resolvedTenantId?: string) =>
    ({
      getHandler: () => handler,
      getClass: () => PharmaLabScopeGuard,
      switchToHttp: () => ({
        getRequest: () => ({
          user: { id: 'lab-admin', roles: ['USER'] },
          params: { pharmaLabId: LAB },
          resolvedTenantId,
        }),
      }),
    }) as any;
  return { f, access, guard, ctx };
}

describe('PharmaLabScopeGuard under RLS', () => {
  const previous = process.env.RLS_ENFORCE;
  beforeEach(() => {
    process.env.RLS_ENFORCE = 'true';
  });
  afterEach(() => {
    if (previous === undefined) delete process.env.RLS_ENFORCE;
    else process.env.RLS_ENFORCE = previous;
  });

  it('reads the lab inside a read-only transaction under the resolved tenant', async () => {
    const { f, access, guard, ctx } = build(true);
    await expect(guard.canActivate(ctx(TENANT))).resolves.toBe(true);
    expect(f.transactional.mock.calls[0][1]).toEqual({ readOnly: true });
    expect(f.calls).toEqual([
      "select set_config('app.system_context', 'false', true)",
      `select set_config('app.current_tenant_id', ?, true) <- ${TENANT}`,
    ]);
    expect(access.requireAdministeredLab).toHaveBeenCalledWith(
      f.tx,
      LAB,
      expect.objectContaining({ id: 'lab-admin' }),
    );
  });

  it('a lab the actor does not administer stays 404', async () => {
    const { guard, ctx } = build(false);
    await expect(guard.canActivate(ctx(TENANT))).rejects.toBeInstanceOf(
      ResourceNotFoundException,
    );
  });

  it('without a resolved tenant the read is not widened: plain fork, no set_config', async () => {
    const { f, access, guard, ctx } = build(false);
    await expect(guard.canActivate(ctx(undefined))).rejects.toBeInstanceOf(
      ResourceNotFoundException,
    );
    expect(f.transactional).not.toHaveBeenCalled();
    expect(f.calls).toEqual([]);
    expect(access.requireAdministeredLab).toHaveBeenCalledWith(
      f.scoped,
      LAB,
      expect.anything(),
    );
  });
});
