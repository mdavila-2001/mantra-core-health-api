import type { EntityManager } from '@mikro-orm/postgresql';
import { ownedTransaction } from './owned-transaction';

/** RLS is only enforced (and its session variables only needed) when this flag is on. */
export function isRlsEnforced(): boolean {
  return process.env.RLS_ENFORCE === 'true';
}

/**
 * Sets the RLS session variables of `tenantId` on a transaction the caller already opened.
 *
 * Same `set_config` order as `TenantContextInterceptor`. For writes outside the request
 * transaction that must stay atomic when `RLS_ENFORCE` is off too (where `withTenantRls`
 * runs without a transaction): open `em.transactional` and call this first when
 * `isRlsEnforced()`. The tenant must already be verified by the caller.
 *
 * @param tx - Transactional entity manager (the variables are `SET LOCAL`).
 * @param tenantId - Verified tenant that scopes the rest of the transaction.
 */
export async function applyTenantRls(
  tx: EntityManager,
  tenantId: string,
): Promise<void> {
  await tx.execute("select set_config('app.system_context', 'false', true)");
  await tx.execute("select set_config('app.current_tenant_id', ?, true)", [
    tenantId,
  ]);
}

/**
 * Runs `work` in its own short transaction with `app.current_tenant_id` set for RLS.
 *
 * Meant for code that runs outside the request transaction (guards, which precede
 * the tenant interceptor, and `@TenantAgnostic` routes). The tenant must already be
 * verified by the caller (e.g. `request.resolvedTenantId`, or a tenant checked
 * against the actor's scope). The fork never inherits a request transaction or
 * savepoint, so the boundary is the same whether or not the plain fork is made to.
 *
 * Same `set_config` order as `TenantContextInterceptor`. With `RLS_ENFORCE` off,
 * `work` runs on a plain fork without a transaction.
 *
 * @param em - Entity manager to fork from.
 * @param tenantId - Verified tenant that scopes every query in `work`.
 * @param work - Reads (or writes, unless `readOnly`) using the given transactional manager.
 * @param options - `readOnly` opens `START TRANSACTION READ ONLY`.
 */
export function withTenantRls<T>(
  em: EntityManager,
  tenantId: string,
  work: (tx: EntityManager) => Promise<T>,
  options?: { readOnly?: boolean },
): Promise<T> {
  const scoped = em.fork({ keepTransactionContext: false });
  if (!isRlsEnforced()) return work(scoped);
  return ownedTransaction(
    scoped,
    async (tx) => {
      await applyTenantRls(tx, tenantId);
      return work(tx);
    },
    options?.readOnly ? { readOnly: true } : undefined,
  );
}

/**
 * Runs `work` with `app.system_context = 'true'` in its own short READ ONLY transaction.
 *
 * `system_context` opens every tenant while it lasts, so it is only for queries that
 * are already bound to the actor in their own predicate (own user id, own
 * practitioner profile, keys derived from those). Never pass a client-chosen id as
 * the only filter. The read-only access mode is not optional: no write can run here.
 * With `RLS_ENFORCE` off, `work` runs on a plain fork without a transaction.
 *
 * @param em - Entity manager to fork from.
 * @param work - Actor-bound reads using the given transactional manager.
 */
export function readWithSystemRls<T>(
  em: EntityManager,
  work: (tx: EntityManager) => Promise<T>,
): Promise<T> {
  const scoped = em.fork({ keepTransactionContext: false });
  if (!isRlsEnforced()) return work(scoped);
  return ownedTransaction(
    scoped,
    async (tx) => {
      await tx.execute("select set_config('app.system_context', 'true', true)");
      return work(tx);
    },
    { readOnly: true },
  );
}

/**
 * Runs `work` with `app.system_context = 'true'` INSIDE a transaction the caller already opened.
 *
 * For one bounded system step in the middle of a request transaction (for example
 * claiming a pre-uploaded file that still lives in the DEFAULT tenant, which the
 * request tenant cannot see). Unlike `readWithSystemRls` it neither forks nor opens a
 * transaction, and it is not read-only, so the writes in `work` share the caller's
 * unit of work. `app.current_tenant_id` is never touched.
 *
 * The previous `app.system_context` is read first and restored in a `finally` (or set
 * back to `'false'` when it was unset or empty), so the rest of the transaction keeps
 * its tenant scope even if `work` throws. If `work` already failed and the restore
 * fails too (an aborted transaction), the original error wins.
 *
 * `system_context` opens every tenant while it lasts: `work` must filter by the ids
 * and ownership conditions of the step itself, never by a client-chosen id alone.
 * With `RLS_ENFORCE` off, `work` runs untouched.
 *
 * @param tx - Entity manager already inside a transaction (the variable is `SET LOCAL`).
 * @param work - The bounded system step.
 * @throws Error if `RLS_ENFORCE` is on and `tx` is not in a transaction: a local
 *   `set_config` outside one is lost at the end of its own statement, and opening a
 *   nested transaction here would commit the step apart from the caller's unit of work.
 */
export async function withSystemRlsInTransaction<T>(
  tx: EntityManager,
  work: () => Promise<T>,
): Promise<T> {
  if (!isRlsEnforced()) return work();
  if (!tx.isInTransaction()) {
    throw new Error(
      'withSystemRlsInTransaction requires an open transaction: open it before calling',
    );
  }
  const [row] = await tx.execute<{ value: string | null }[]>(
    "select current_setting('app.system_context', true) as value",
  );
  const previous = row?.value ? row.value : 'false';
  await tx.execute("select set_config('app.system_context', 'true', true)");
  let result: T;
  try {
    result = await work();
  } catch (error) {
    // A failed `work` may have aborted the transaction: the restore is best effort
    // and must not hide the original error.
    await restoreSystemContext(tx, previous).catch(() => undefined);
    throw error;
  }
  await restoreSystemContext(tx, previous);
  return result;
}

/** Puts `app.system_context` back to `value` for the rest of the transaction. */
async function restoreSystemContext(
  tx: EntityManager,
  value: string,
): Promise<void> {
  await tx.execute("select set_config('app.system_context', ?, true)", [value]);
}
