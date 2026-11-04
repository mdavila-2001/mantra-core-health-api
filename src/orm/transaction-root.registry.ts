import type { EventSubscriber, TransactionEventArgs } from '@mikro-orm/core';

/** Minimal view of a driver transaction handle (Kysely `ControlledTransaction`). */
export type TransactionState = {
  isCommitted?: boolean;
  isRolledBack?: boolean;
};

/**
 * A savepoint is a Kysely `ControlledTransaction` with its own state: the COMMIT
 * of the root transaction does not mark it, and the connection goes back to the
 * pool. This registry links each savepoint to its root so a deferred `fork()`
 * can tell that the whole transaction is over.
 */
const rootOf = new WeakMap<object, object>();

/** Fork created from an EntityManager that held a transaction → that transaction. */
const parentContextOf = new WeakMap<object, object>();

function isFinished(context: TransactionState): boolean {
  return Boolean(context.isCommitted || context.isRolledBack);
}

/** Remembers the transaction the parent held when `child` was forked from it. */
export function rememberParentContext(child: object, context: object): void {
  parentContextOf.set(child, context);
}

/** `true` while neither the transaction nor its root has ended. */
export function isTransactionLive(context: TransactionState): boolean {
  if (isFinished(context)) return false;
  const root = rootOf.get(context);
  return !root || !isFinished(root);
}

/** Links every savepoint to the root of the transaction it was opened in. */
export class SavepointRootSubscriber implements EventSubscriber {
  afterTransactionStart(args: TransactionEventArgs): void {
    const savepoint = args.transaction as
      { savepointName?: string } | undefined;
    if (!savepoint || savepoint.savepointName === undefined) return;
    const parent = parentContextOf.get(args.em);
    if (parent) rootOf.set(savepoint, rootOf.get(parent) ?? parent);
  }
}
