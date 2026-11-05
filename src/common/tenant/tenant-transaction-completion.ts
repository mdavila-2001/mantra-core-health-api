import { AsyncLocalStorage } from 'node:async_hooks';
import { Logger } from '@nestjs/common';

interface CompletionContext {
  collecting: boolean;
  tasks: Array<() => Promise<void>>;
  failureTasks: Array<() => Promise<void>>;
}
const storage = new AsyncLocalStorage<CompletionContext>();
const logger = new Logger('TenantTransactionCompletion');

/** Queues independent bookkeeping until the enclosing transaction releases its connection. */
export function deferAfterTenantTransaction(
  task: () => Promise<void>,
): boolean {
  const context = storage.getStore();
  if (!context?.collecting) return false;
  context.tasks.push(task);
  return true;
}

/** Whether the caller is still inside the enclosing transaction boundary. */
export function hasTenantTransactionCompletion(): boolean {
  return storage.getStore()?.collecting === true;
}

/** Registers failure bookkeeping for a transaction that fails after its handler returned. */
export function deferAfterTenantTransactionFailure(
  task: () => Promise<void>,
): boolean {
  const context = storage.getStore();
  if (!context?.collecting) return false;
  context.failureTasks.push(task);
  return true;
}

/** Waits for independent bookkeeping after commit/rollback, before completing the HTTP result. */
export async function withTenantTransactionCompletion<T>(
  transaction: () => Promise<T>,
): Promise<T> {
  if (storage.getStore()?.collecting) return transaction();
  return storage.run(
    { collecting: true, tasks: [], failureTasks: [] },
    async () => {
      const context = storage.getStore()!;
      let outcome: { ok: true; value: T } | { ok: false; error: unknown };
      try {
        outcome = { ok: true, value: await transaction() };
      } catch (error) {
        outcome = { ok: false, error };
      }
      context.collecting = false;
      const failures: unknown[] = [];
      for (const task of [
        ...context.tasks,
        ...(outcome.ok ? [] : context.failureTasks),
      ]) {
        try {
          await task();
        } catch (error) {
          failures.push(error);
        }
      }
      if (!outcome.ok) {
        if (failures.length)
          logger.warn({
            operation: 'tenant.transaction.completion',
            result: 'PERSISTENCE_FAILED',
            failedTasks: failures.length,
          });
        throw outcome.error;
      }
      if (failures.length) throw failures[0];
      return outcome.value;
    },
  );
}
