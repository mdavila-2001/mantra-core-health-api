import {
  TransactionPropagation,
  type TransactionOptions,
} from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import { Logger } from '@nestjs/common';

type TransactionHandle = Parameters<
  ReturnType<EntityManager['getConnection']>['rollback']
>[0];

const logger = new Logger('OwnedTransaction');

/**
 * Preserves the transaction result/error and attempts one resource cleanup only for an owned handle.
 * A cleanup acknowledgment does not establish whether an earlier uncertain COMMIT took effect.
 * Borrowed transactions/savepoints, BEGIN without a handle and permanent cleanup failures are not repaired here.
 */
export async function ownedTransaction<T>(
  em: EntityManager,
  callback: (tx: EntityManager) => T | Promise<T>,
  options?: TransactionOptions,
): Promise<T> {
  const parent: unknown =
    options?.ctx ?? em.getTransactionContext<TransactionHandle>();
  const ownsBoundary =
    options?.propagation === TransactionPropagation.REQUIRES_NEW ||
    (!parent && !em.isInTransaction());
  let captured: { em: EntityManager; context: TransactionHandle } | undefined;
  let callbackFailure: { error: unknown } | undefined;
  try {
    return await em.transactional(async (tx) => {
      const context = tx.getTransactionContext<TransactionHandle>();
      if (context) captured = { em: tx, context };
      try {
        return await callback(tx);
      } catch (error) {
        callbackFailure = { error };
        throw error;
      }
    }, options);
  } catch (transactionError) {
    const primaryError = callbackFailure
      ? callbackFailure.error
      : transactionError;
    let cleanupAttempted = false;
    let cleanupFailed = false;
    const ownContext = ownsBoundary && captured && captured.context !== parent;
    if (
      captured &&
      ownContext &&
      !captured.context.isCommitted &&
      !captured.context.isRolledBack
    ) {
      cleanupAttempted = true;
      try {
        await captured.em.getConnection().rollback(captured.context);
      } catch {
        cleanupFailed = true;
      }
    }
    if (cleanupAttempted) {
      try {
        logger.warn({
          operation: 'tenant.transaction.cleanup',
          cleanupAttempted,
          cleanupFailed,
          transactionOwned: Boolean(ownContext),
          contextCaptured: Boolean(captured),
          isCommitted: captured?.context.isCommitted ?? null,
          isRolledBack: captured?.context.isRolledBack ?? null,
          businessOutcome: 'NOT_DETERMINED',
        });
      } catch {
        // Observability must never replace the operation's primary rejection.
      }
    }
    throw primaryError;
  }
}
