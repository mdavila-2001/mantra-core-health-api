import { jest } from '@jest/globals';
import type { TransactionOptions } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';

/**
 * Fake entity manager for specs of code that uses `withTenantRls` / `readWithSystemRls`
 * with `RLS_ENFORCE=true`: `txExtras` adds methods (e.g. `findOne`) to the transactional manager; records the `set_config` calls and the transaction options.
 */
export function rlsFixture(txExtras: Record<string, unknown> = {}) {
  const calls: string[] = [];
  const execute = jest.fn(async (sql: string, params?: unknown[]) => {
    calls.push(params ? `${sql} <- ${String(params)}` : sql);
    return [];
  });
  const tx = {
    execute,
    getTransactionContext: () => ({ isCommitted: false, isRolledBack: false }),
    getConnection: () => ({ rollback: jest.fn() }),
    ...txExtras,
  };
  const transactional = jest.fn(
    async (
      run: (tx: EntityManager) => Promise<unknown>,
      _options?: TransactionOptions,
    ) => run(tx as unknown as EntityManager),
  );
  const scoped = {
    transactional,
    getTransactionContext: () => undefined,
    isInTransaction: () => false,
  };
  const fork = jest.fn(
    (_options?: { keepTransactionContext?: boolean }) => scoped,
  );
  const em = { fork } as unknown as EntityManager;
  return { em, fork, scoped, transactional, calls, tx };
}
