import { describe, expect, it } from '@jest/globals';
import { Configuration } from '@mikro-orm/core';
import { defineConfig } from '@mikro-orm/postgresql';
import { TransactionInheritingEntityManager } from './transaction-inheriting-entity-manager';
import { SavepointRootSubscriber } from './transaction-root.registry';

type Handle = { isCommitted: boolean; isRolledBack: boolean };

/** Builds the EntityManager the way Nest does, with no database. */
function buildEm(): TransactionInheritingEntityManager {
  const config = new Configuration(
    defineConfig({
      dbName: 'unit',
      entities: [],
      entityManager: TransactionInheritingEntityManager,
      discovery: { warnWhenNoEntities: false },
    }),
    false,
  );
  return config.getDriver().createEntityManager() as never;
}

function baseHandle(): Handle {
  return { isCommitted: false, isRolledBack: false };
}

function emInTransaction(state: Partial<Handle> = {}) {
  const em = buildEm();
  const handle: Handle = { isCommitted: false, isRolledBack: false, ...state };
  em.setTransactionContext(handle as never);
  return { em, handle };
}

describe('TransactionInheritingEntityManager', () => {
  it('builds the subclass as the driver entity manager', () => {
    expect(buildEm()).toBeInstanceOf(TransactionInheritingEntityManager);
  });

  it('fork() without arguments inherits the live transaction', () => {
    const { em, handle } = emInTransaction();

    const fork = em.fork();

    expect(fork.getTransactionContext()).toBe(handle);
    expect(fork).toBeInstanceOf(TransactionInheritingEntityManager);
  });

  it('forks of a fork inherit it too', () => {
    const { em, handle } = emInTransaction();

    expect(em.fork().fork().getTransactionContext()).toBe(handle);
  });

  it.each([
    ['fork({})', {}],
    ['fork({ clear: true })', { clear: true }],
    [
      'fork({ keepTransactionContext: false })',
      { keepTransactionContext: false },
    ],
  ])('%s does not inherit', (_label, options) => {
    const { em } = emInTransaction();

    expect(em.fork(options).getTransactionContext()).toBeUndefined();
  });

  it('fork({ keepTransactionContext: true }) still inherits', () => {
    const { em, handle } = emInTransaction();

    expect(
      em.fork({ keepTransactionContext: true }).getTransactionContext(),
    ).toBe(handle);
  });

  it('fork() without a transaction stays plain', () => {
    expect(buildEm().fork().getTransactionContext()).toBeUndefined();
  });

  it.each([
    ['committed', { isCommitted: true }],
    ['rolled back', { isRolledBack: true }],
  ])('fork() does not copy a %s transaction', (_label, state) => {
    const { em } = emInTransaction(state);

    expect(em.fork().getTransactionContext()).toBeUndefined();
  });

  it('does not rewrite the options it receives', () => {
    const { em } = emInTransaction();
    const options = { keepTransactionContext: false };

    em.fork(options);

    expect(options.keepTransactionContext).toBe(false);
  });

  describe('savepoints', () => {
    /** Opens a savepoint under `root` the way `TransactionManager` does. */
    function savepointUnder(root: Handle) {
      const { em: parent } = { em: buildEm() };
      parent.setTransactionContext(root as never);
      // `createFork` forks the parent with options and the event carries that fork.
      const child = parent.fork({ clear: true });
      const savepoint = { ...baseHandle(), savepointName: 'trx1' };
      new SavepointRootSubscriber().afterTransactionStart({
        em: child,
        transaction: savepoint as never,
      });
      const holder = buildEm();
      holder.setTransactionContext(savepoint as never);
      return { holder, savepoint };
    }

    it('a live savepoint under a live root is inherited', () => {
      const root = baseHandle();
      const { holder, savepoint } = savepointUnder(root);

      expect(holder.fork().getTransactionContext()).toBe(savepoint);
    });

    it('is not inherited once the root committed, though the savepoint is unmarked', () => {
      const root = baseHandle();
      const { holder, savepoint } = savepointUnder(root);
      root.isCommitted = true;

      expect(savepoint.isCommitted).toBe(false);
      expect(holder.fork().getTransactionContext()).toBeUndefined();
    });

    it('is not inherited once the root rolled back', () => {
      const root = baseHandle();
      const { holder } = savepointUnder(root);
      root.isRolledBack = true;

      expect(holder.fork().getTransactionContext()).toBeUndefined();
    });
  });
});
