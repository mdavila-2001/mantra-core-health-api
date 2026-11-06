import type { ForkOptions } from '@mikro-orm/core';
import { EntityManager as PostgreSqlEntityManager } from '@mikro-orm/postgresql';
import {
  isTransactionLive,
  rememberParentContext,
  type TransactionState,
} from './transaction-root.registry';

/**
 * EntityManager whose argument-less `fork()` joins the transaction of the caller.
 *
 * Under RLS the tenant lives in `set_config(..., true)` of the request
 * transaction. MikroORM's plain `fork()` drops that transaction, so the fork
 * runs on another pooled connection without tenant context and sees nothing.
 * Here `fork()` keeps the transaction context while it is still alive.
 *
 * Explicit options are never rewritten: `fork({ keepTransactionContext: false })`
 * is how a caller opts out and runs on its own connection.
 */
export class TransactionInheritingEntityManager extends PostgreSqlEntityManager {
  override fork(options?: ForkOptions): this {
    if (options !== undefined) {
      const child = super.fork(options);
      // `TransactionManager.createFork` forks the parent to open a savepoint:
      // remember which transaction the parent held (see the registry).
      const parentContext: object | undefined = this.getTransactionContext();
      if (parentContext) rememberParentContext(child, parentContext);
      return child;
    }
    return super.fork({
      keepTransactionContext: this.hasLiveTransactionContext(),
    });
  }

  /**
   * A fork created after COMMIT/ROLLBACK (fire-and-forget code still running in
   * the request async context) must not reuse the finished transaction: the
   * driver would throw "Transaction is already committed". For a savepoint the
   * root counts too, because the COMMIT of the root does not mark it.
   */
  private hasLiveTransactionContext(): boolean {
    const context: TransactionState | undefined = this.getTransactionContext();
    return context !== undefined && isTransactionLive(context);
  }
}
