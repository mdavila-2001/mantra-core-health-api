import type { EntityManager } from '@mikro-orm/postgresql';
import { ownedTransaction } from './owned-transaction';

/** RLS is only enforced (and its session variables only needed) when this flag is on. */
export function isRlsEnforced(): boolean {
  return process.env.RLS_ENFORCE === 'true';
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
      await tx.execute(
        "select set_config('app.system_context', 'false', true)",
      );
      await tx.execute("select set_config('app.current_tenant_id', ?, true)", [
        tenantId,
      ]);
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
