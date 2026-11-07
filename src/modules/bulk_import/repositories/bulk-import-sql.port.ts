import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';

/** Minimal SQL surface used by the batch repository. Placeholders are `?`. */
export interface BulkImportSql {
  query<T>(sql: string, params?: readonly unknown[]): Promise<T[]>;
}

/** Runs work inside one transaction scoped to a single organization. */
export interface BulkImportSqlRunner {
  inTenant<R>(
    tenantId: string,
    work: (sql: BulkImportSql) => Promise<R>,
  ): Promise<R>;
}

/** Injection token of the runner. */
export const BULK_IMPORT_SQL_RUNNER = Symbol('BULK_IMPORT_SQL_RUNNER');

/**
 * Runner over the application `EntityManager`. Each call uses its own fork and
 * transaction and sets `app.current_tenant_id` locally, so the `tenant_isolation`
 * RLS policy of `system_ops.bulk_import_*` applies when RLS is enforced. The
 * processor runs outside any HTTP request, hence no request-scoped context.
 */
@Injectable()
export class MikroBulkImportSqlRunner implements BulkImportSqlRunner {
  constructor(private readonly em: EntityManager) {}

  inTenant<R>(
    tenantId: string,
    work: (sql: BulkImportSql) => Promise<R>,
  ): Promise<R> {
    return this.em
      .fork({ keepTransactionContext: false })
      .transactional(async (tx) => {
        await tx.execute(
          "select set_config('app.current_tenant_id', ?, true)",
          [tenantId],
        );
        return work({
          query: <T>(sql: string, params: readonly unknown[] = []) =>
            tx.execute<T[]>(sql, [...params], 'all'),
        });
      });
  }
}
