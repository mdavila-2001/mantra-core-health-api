import { describe, expect, it, jest } from '@jest/globals';
import { TransactionPropagation } from '@mikro-orm/core';
import { withTenantTransactionCompletion } from '../../../../common/tenant/tenant-transaction-completion';
import { recordExternalSystemCheck } from './record-external-system-check';

const data = {
  tenantId: '22222222-2222-4222-8222-222222222222',
  check: { connectionId: '33333333-3333-4333-8333-333333333333' },
  result: 'OK',
  actorUserId: '11111111-1111-4111-8111-111111111111',
} as Parameters<typeof recordExternalSystemCheck>[2];

describe('successful external check transaction isolation', () => {
  it('uses a same-connection savepoint for recoverable bookkeeping without aborting the parent', async () => {
    const failure = new Error('synthetic SQL failure');
    let aborted = false;
    const tx = {
      execute: jest.fn(async (sql: string) =>
        sql.includes('current_setting')
          ? [{ system_context: 'false', tenant_id: data.tenantId }]
          : [],
      ),
    };
    const em = {
      transactional: async (
        cb: (value: typeof tx) => Promise<void>,
        options: { propagation: TransactionPropagation },
      ) => {
        try {
          await cb(tx);
        } catch (error) {
          aborted = options.propagation !== TransactionPropagation.NESTED;
          throw error;
        }
      },
    };
    const onFailure = jest.fn();
    const systems = {
      recordCheck: jest.fn(async () => {
        throw failure;
      }),
    };
    await withTenantTransactionCompletion(async () => {
      await recordExternalSystemCheck(em as never, systems, data, onFailure);
      expect(aborted).toBe(false);
    });
    expect(onFailure).toHaveBeenCalledWith(failure);
    expect(systems.recordCheck).toHaveBeenCalledTimes(1);
  });

  it('propagates a required successful check failure so the parent cannot commit', async () => {
    const failure = new Error('synthetic SQL failure');
    const tx = {
      execute: jest.fn(async (sql: string) =>
        sql.includes('current_setting')
          ? [{ system_context: 'false', tenant_id: data.tenantId }]
          : [],
      ),
    };
    const em = {
      transactional: jest.fn(
        async (
          cb: (value: typeof tx) => Promise<void>,
          options: { propagation: TransactionPropagation },
        ) => {
          expect(options.propagation).toBe(TransactionPropagation.REQUIRED);
          await cb(tx);
        },
      ),
    };
    const systems = {
      recordCheck: jest.fn(async () => {
        throw failure;
      }),
    };
    await expect(
      withTenantTransactionCompletion(async () => {
        await recordExternalSystemCheck(em as never, systems, data);
      }),
    ).rejects.toBe(failure);
  });
});
