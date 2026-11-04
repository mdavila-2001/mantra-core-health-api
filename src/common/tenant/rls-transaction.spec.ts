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
import {
  readWithSystemRls,
  withSystemRlsInTransaction,
  withTenantRls,
} from './rls-transaction';
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

describe('withSystemRlsInTransaction', () => {
  const previous = process.env.RLS_ENFORCE;
  const READ = "select current_setting('app.system_context', true) as value";
  const SET_TRUE = "select set_config('app.system_context', 'true', true)";
  const RESTORE = "select set_config('app.system_context', ?, true)";

  /** Transacción simulada: `previousValue` es lo que devuelve `current_setting`. */
  function inTx(previousValue: string | null, inTransaction = true) {
    const calls: string[] = [];
    const tx = {
      isInTransaction: () => inTransaction,
      execute: jest.fn(async (sql: string, params?: unknown[]) => {
        calls.push(params ? `${sql} <- ${String(params)}` : sql);
        return sql === READ ? [{ value: previousValue }] : [];
      }),
    };
    return { tx: tx as unknown as EntityManager, execute: tx.execute, calls };
  }

  beforeEach(() => {
    process.env.RLS_ENFORCE = 'true';
  });
  afterEach(() => {
    if (previous === undefined) delete process.env.RLS_ENFORCE;
    else process.env.RLS_ENFORCE = previous;
  });

  it('sets system_context, runs the work and restores the previous value', async () => {
    const f = inTx('false');
    const work = jest.fn(async () => {
      expect(f.calls).toEqual([READ, SET_TRUE]);
      return 'done';
    });
    await expect(withSystemRlsInTransaction(f.tx, work)).resolves.toBe('done');
    expect(f.calls).toEqual([READ, SET_TRUE, `${RESTORE} <- false`]);
  });

  it.each([null, ''])(
    'restores to false when the previous value was %p',
    async (value) => {
      const f = inTx(value);
      await withSystemRlsInTransaction(f.tx, async () => 1);
      expect(f.calls.at(-1)).toBe(`${RESTORE} <- false`);
    },
  );

  it('restores a previous true instead of forcing false', async () => {
    const f = inTx('true');
    await withSystemRlsInTransaction(f.tx, async () => 1);
    expect(f.calls.at(-1)).toBe(`${RESTORE} <- true`);
  });

  it('restores the previous value and rethrows when the work throws', async () => {
    const f = inTx('false');
    const boom = new Error('boom');
    await expect(
      withSystemRlsInTransaction(f.tx, async () => {
        throw boom;
      }),
    ).rejects.toBe(boom);
    expect(f.calls).toEqual([READ, SET_TRUE, `${RESTORE} <- false`]);
  });

  it('never touches app.current_tenant_id', async () => {
    const f = inTx('false');
    await withSystemRlsInTransaction(f.tx, async () => 1);
    expect(f.calls.join('\n')).not.toContain('current_tenant_id');
  });

  it('keeps the work error when the restore fails too', async () => {
    const f = inTx('false');
    const boom = new Error('boom');
    f.execute.mockImplementation(async (sql: string) => {
      if (sql === RESTORE) throw new Error('aborted transaction');
      return sql === READ ? [{ value: 'false' }] : [];
    });
    await expect(
      withSystemRlsInTransaction(f.tx, async () => {
        throw boom;
      }),
    ).rejects.toBe(boom);
  });

  it('fails clearly outside a transaction without executing anything', async () => {
    const f = inTx('false', false);
    const work = jest.fn(async () => 1);
    await expect(withSystemRlsInTransaction(f.tx, work)).rejects.toThrow(
      /requires an open transaction/,
    );
    expect(work).not.toHaveBeenCalled();
    expect(f.calls).toEqual([]);
  });

  it.each([undefined, 'false'])(
    'RLS_ENFORCE=%s: runs the work and sets nothing',
    async (flag) => {
      if (flag === undefined) delete process.env.RLS_ENFORCE;
      else process.env.RLS_ENFORCE = flag;
      const f = inTx('false', false);
      await expect(
        withSystemRlsInTransaction(f.tx, async () => 7),
      ).resolves.toBe(7);
      expect(f.calls).toEqual([]);
    },
  );
});
