import { ownedTransaction } from '../../../../common/tenant/owned-transaction';
import { TransactionPropagation } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  deferAfterTenantTransaction,
  hasTenantTransactionCompletion,
} from '../../../../common/tenant/tenant-transaction-completion';
import type { ExternalPharmacySystemPort } from '../ports/external-pharmacy-system.port';

/** Errors outlive rollback; successful telemetry remains atomic with the request without a second lease. */
export async function recordExternalSystemCheck(
  em: EntityManager,
  systems: Pick<ExternalPharmacySystemPort, 'recordCheck'>,
  data: Parameters<ExternalPharmacySystemPort['recordCheck']>[1],
  onFailure?: (error: unknown) => void,
): Promise<void> {
  const joinsRequest = data.result === 'OK' && hasTenantTransactionCompletion();
  const record = async () => {
    try {
      const write = async (tx: EntityManager) => {
        const previousContext = joinsRequest
          ? (
              await tx.execute<
                { system_context: string | null; tenant_id: string | null }[]
              >(
                "select current_setting('app.system_context', true) as system_context, current_setting('app.current_tenant_id', true) as tenant_id",
              )
            )[0]
          : undefined;
        if (joinsRequest && !previousContext)
          throw new Error('External check SQL context could not be read');
        await tx.execute(
          "select set_config('app.system_context', 'false', true)",
        );
        await tx.execute(
          "select set_config('app.current_tenant_id', ?, true)",
          [data.tenantId],
        );
        await systems.recordCheck(tx, data);
        if (previousContext) {
          // A custom GUC first created here cannot be removed; empty restores its unset semantics.
          // Restore tenant before system privileges, and only on success: an aborted tx must roll back.
          await tx.execute(
            "select set_config('app.current_tenant_id', ?, true)",
            [previousContext.tenant_id ?? ''],
          );
          await tx.execute("select set_config('app.system_context', ?, true)", [
            previousContext.system_context ?? '',
          ]);
        }
      };
      const options = {
        propagation: joinsRequest
          ? onFailure
            ? TransactionPropagation.NESTED
            : TransactionPropagation.REQUIRED
          : TransactionPropagation.REQUIRES_NEW,
        clear: true,
      };
      if (joinsRequest) await em.transactional(write, options);
      else await ownedTransaction(em, write, options);
    } catch (error) {
      if (!onFailure) throw error;
      onFailure(error);
    }
  };
  if (joinsRequest || !deferAfterTenantTransaction(record)) await record();
}
