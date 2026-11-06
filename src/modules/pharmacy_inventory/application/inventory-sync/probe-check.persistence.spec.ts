import { describe, expect, it, jest } from '@jest/globals';
import { TransactionPropagation } from '@mikro-orm/core';
import { ConfigureExternalSystemUseCase } from './configure-external-system.use-case';
import { ExternalCatalogUnavailableError } from '../../domain/sync/external-catalog';

/** Offline transaction-contract regression; real PostgreSQL is exercised by the HTTP QA runner. */
describe('saved probe telemetry outlives the enclosing request rollback', () => {
  it.each(['AUTH_REJECTED', 'UNREACHABLE', 'OK'] as const)(
    '%s remains committed when the request transaction rolls back',
    async (result) => {
      let committed = 'ACTIVE';
      const statements: unknown[][] = [];
      const parent = {
        pending: '',
        getTransactionContext: () => undefined,
        execute: jest.fn(async () => []),
      };
      const em = {
        getTransactionContext: () => undefined,
        isInTransaction: () => false,
        transactional: jest.fn(
          async (
            fn: (tx: typeof parent) => Promise<unknown>,
            options?: { propagation?: TransactionPropagation; clear?: boolean },
          ) => {
            if (options?.propagation !== TransactionPropagation.REQUIRES_NEW)
              return fn(parent);
            const tx = {
              getTransactionContext: () => undefined,
              pending: '',
              execute: jest.fn(async (...args: unknown[]) => {
                statements.push(args);
                return [];
              }),
            };
            const value = await fn(tx);
            committed = tx.pending;
            return value;
          },
        ),
      };
      const check = {
        connectionId: 'provider',
        credentialId: 'credential',
        configJson: {},
      };
      const client = {
        checkHealth: jest.fn(async () => {
          if (result === 'AUTH_REJECTED')
            throw new ExternalCatalogUnavailableError(
              'synthetic failure',
              result,
            );
        }),
      };
      const systems = {
        resolve: jest.fn(async () =>
          result === 'UNREACHABLE'
            ? { status: 'UNAVAILABLE', errorReason: result, check }
            : { status: 'READY', source: 'PHARMACY', client, check },
        ),
        recordCheck: jest.fn(
          async (tx: typeof parent, data: { result: string }) => {
            tx.pending = data.result;
          },
        ),
      };
      const useCase = new ConfigureExternalSystemUseCase(
        em as never,
        {
          requireManagedPharmacy: async () => ({
            tenantId: 'tenant-a',
            pharmacyId: 'pharmacy',
          }),
        } as never,
        { findConnection: async () => ({ connectionId: 'provider' }) } as never,
        systems as never,
      );
      const operation = useCase.probe(
        { pharmacyId: 'pharmacy', connectionId: 'link' },
        { id: 'actor' } as never,
      );
      if (result === 'OK')
        await expect(operation).resolves.toEqual({
          status: 'OK',
          source: 'PHARMACY',
        });
      else
        await expect(operation).rejects.toMatchObject({
          details: { errorReason: result },
        });
      parent.pending = ''; // The HTTP exception rolls back the enclosing request.
      expect(committed).toBe(result);
      expect(statements).toEqual([
        ["select set_config('app.system_context', 'false', true)"],
        ["select set_config('app.current_tenant_id', ?, true)", ['tenant-a']],
      ]);
      expect(em.transactional).toHaveBeenLastCalledWith(expect.any(Function), {
        propagation: TransactionPropagation.REQUIRES_NEW,
        clear: true,
      });
    },
  );
});
