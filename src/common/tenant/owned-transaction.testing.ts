import { jest } from '@jest/globals';
import type { TransactionOptions } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';

type Handle = Parameters<
  ReturnType<EntityManager['getConnection']>['rollback']
>[0];
type Mode =
  | 'normal'
  | 'rollback-ack'
  | 'commit-ack'
  | 'after-commit'
  | 'after-rollback'
  | 'begin';
export function handle() {
  const state = { isCommitted: false, isRolledBack: false };
  return { state, context: state as unknown as Handle };
}
export function fixture(
  options: {
    mode?: Mode;
    parent?: Handle;
    child?: Handle;
    cleanupFails?: boolean;
    inTransaction?: boolean;
  } = {},
) {
  const child = options.child ?? handle().context;
  const failure = new Error('SYNTHETIC_PRIVATE_SQL_ORM_FAILURE');
  const cleanupFailure = new Error('SYNTHETIC_PRIVATE_SQL_CLEANUP_FAILURE');
  const cleanup = jest.fn<(context: Handle) => Promise<void>>(
    async (context) => {
      if (options.cleanupFails) throw cleanupFailure;
      Object.assign(context, { isRolledBack: true });
    },
  );
  const tx = {
    getTransactionContext: jest.fn<() => Handle | undefined>(() => child),
    getConnection: jest.fn(() => ({ rollback: cleanup })),
  };
  const txEm = tx as unknown as EntityManager;
  const transactional = jest.fn<
    (
      run: (tx: EntityManager) => Promise<unknown>,
      opts?: TransactionOptions,
    ) => Promise<unknown>
  >(async (run) => {
    if (options.mode === 'begin') throw failure;
    let value: unknown;
    try {
      value = await run(txEm);
    } catch (error) {
      if (options.mode === 'after-rollback')
        Object.assign(child, { isRolledBack: true });
      if (options.mode === 'rollback-ack' || options.mode === 'after-rollback')
        throw failure;
      throw error;
    }
    if (options.mode === 'commit-ack') throw failure;
    Object.assign(child, { isCommitted: true });
    if (options.mode === 'after-commit') throw failure;
    return value;
  });
  const em = {
    getTransactionContext: jest.fn<() => Handle | undefined>(
      () => options.parent,
    ),
    isInTransaction: jest.fn(
      () => options.inTransaction ?? Boolean(options.parent),
    ),
    transactional,
  } as unknown as EntityManager;
  return { em, child, cleanup, failure, cleanupFailure, transactional, tx };
}
