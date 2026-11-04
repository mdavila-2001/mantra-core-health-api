import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import type { EntityManager } from '@mikro-orm/postgresql';
import { Logger } from '@nestjs/common';
import { readWithSystemRls, withTenantRls } from './rls-transaction';
import { rlsFixture } from './rls-transaction.testing';

const TENANT = '11111111-1111-4111-8111-111111111111';

describe('rls transaction helper', () => {
  const previous = process.env.RLS_ENFORCE;
  beforeEach(() => {
    process.env.RLS_ENFORCE = 'true';
  });
  afterEach(() => {
    jest.restoreAllMocks();
    if (previous === undefined) delete process.env.RLS_ENFORCE;
    else process.env.RLS_ENFORCE = previous;
  });

  it('tenant: forks without the request transaction and sets both variables in interceptor order', async () => {
    const f = rlsFixture();
    const work = jest.fn(async (_tx: EntityManager) => 'rows');
    await expect(withTenantRls(f.em, TENANT, work)).resolves.toBe('rows');
    expect(f.fork).toHaveBeenCalledWith({ keepTransactionContext: false });
    expect(f.calls).toEqual([
      "select set_config('app.system_context', 'false', true)",
      `select set_config('app.current_tenant_id', ?, true) <- ${TENANT}`,
    ]);
    expect(work).toHaveBeenCalledWith(f.tx as unknown as EntityManager);
    expect(f.transactional.mock.calls[0][1]).toBeUndefined();
  });

  it('tenant: readOnly opens a READ ONLY transaction', async () => {
    const f = rlsFixture();
    await withTenantRls(f.em, TENANT, async () => 1, { readOnly: true });
    expect(f.transactional.mock.calls[0][1]).toEqual({ readOnly: true });
  });

  it('tenant: the work runs only after the variables are set', async () => {
    const f = rlsFixture();
    await withTenantRls(f.em, TENANT, async () => {
      expect(f.calls).toHaveLength(2);
    });
  });

  it('system: opens a READ ONLY transaction with system_context and no tenant', async () => {
    const f = rlsFixture();
    const work = jest.fn(async (_tx: EntityManager) => 'rows');
    await expect(readWithSystemRls(f.em, work)).resolves.toBe('rows');
    expect(f.fork).toHaveBeenCalledWith({ keepTransactionContext: false });
    expect(f.transactional.mock.calls[0][1]).toEqual({ readOnly: true });
    expect(f.calls).toEqual([
      "select set_config('app.system_context', 'true', true)",
    ]);
    expect(work).toHaveBeenCalledWith(f.tx as unknown as EntityManager);
  });

  it('propagates the work error', async () => {
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    const f = rlsFixture();
    const boom = new Error('boom');
    await expect(
      readWithSystemRls(f.em, async () => {
        throw boom;
      }),
    ).rejects.toBe(boom);
  });

  it.each([undefined, 'false'])(
    'RLS_ENFORCE=%s: runs on a plain fork, no transaction and no set_config',
    async (flag) => {
      if (flag === undefined) delete process.env.RLS_ENFORCE;
      else process.env.RLS_ENFORCE = flag;
      const f = rlsFixture();
      await withTenantRls(f.em, TENANT, async (tx) => {
        expect(tx).toBe(f.scoped);
      });
      await readWithSystemRls(f.em, async (tx) => {
        expect(tx).toBe(f.scoped);
      });
      expect(f.transactional).not.toHaveBeenCalled();
      expect(f.calls).toEqual([]);
    },
  );
});
