import { describe, expect, it, jest } from '@jest/globals';
import { Logger } from '@nestjs/common';
import {
  deferAfterTenantTransaction,
  withTenantTransactionCompletion,
} from './tenant-transaction-completion';

describe('tenant transaction completion', () => {
  it.each(['commit', 'rollback'] as const)(
    'drains independent work only after %s releases the outer lease',
    async (outcome) => {
      const events: string[] = [];
      const original = new Error('original');
      const operation = withTenantTransactionCompletion(async () => {
        events.push('lease');
        expect(
          deferAfterTenantTransaction(async () => {
            events.push('independent');
          }),
        ).toBe(true);
        try {
          if (outcome === 'rollback') throw original;
          return 'ok';
        } finally {
          events.push('release');
        }
      });
      if (outcome === 'rollback')
        await expect(operation).rejects.toBe(original);
      else await expect(operation).resolves.toBe('ok');
      expect(events).toEqual(['lease', 'release', 'independent']);
    },
  );
  it('awaits queued persistence before resolving success and does not discard its failure', async () => {
    const failure = new Error('commit failed');
    await expect(
      withTenantTransactionCompletion(async () => {
        deferAfterTenantTransaction(async () => {
          throw failure;
        });
        return 'ERP_OK';
      }),
    ).rejects.toBe(failure);
  });
  it('preserves the original rejection, drains the rest and logs no exception contents', async () => {
    const spy = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);
    const original = new Error('AUTH_REJECTED'),
      secretFailure = new Error('SYNTHETIC_SECRET_SQL_DETAILS');
    const seen: string[] = [];
    try {
      await expect(
        withTenantTransactionCompletion(async () => {
          deferAfterTenantTransaction(async () => {
            throw secretFailure;
          });
          deferAfterTenantTransaction(async () => {
            seen.push('audit');
          });
          throw original;
        }),
      ).rejects.toBe(original);
      expect(seen).toEqual(['audit']);
      expect(spy).toHaveBeenCalledWith({
        operation: 'tenant.transaction.completion',
        result: 'PERSISTENCE_FAILED',
        failedTasks: 1,
      });
      expect(JSON.stringify(spy.mock.calls)).not.toContain(
        secretFailure.message,
      );
    } finally {
      spy.mockRestore();
    }
  });
  it('keeps concurrent request queues separate', async () => {
    const seen: string[] = [];
    let release!: () => void;
    const gate = new Promise<void>((r) => {
      release = r;
    });
    const a = withTenantTransactionCompletion(async () => {
      deferAfterTenantTransaction(async () => {
        seen.push('a');
      });
      await gate;
      return 'a';
    });
    await withTenantTransactionCompletion(async () => {
      deferAfterTenantTransaction(async () => {
        seen.push('b');
      });
      return 'b';
    });
    expect(seen).toEqual(['b']);
    release();
    await a;
    expect(seen).toEqual(['b', 'a']);
  });
  it('does not drain a nested boundary before the enclosing transaction finishes', async () => {
    const seen: string[] = [];
    await withTenantTransactionCompletion(async () => {
      await withTenantTransactionCompletion(async () => {
        deferAfterTenantTransaction(async () => {
          seen.push('task');
        });
      });
      expect(seen).toEqual([]);
      seen.push('outer-complete');
    });
    expect(seen).toEqual(['outer-complete', 'task']);
  });
  it('does not retain work outside a boundary or during draining', async () => {
    expect(deferAfterTenantTransaction(async () => undefined)).toBe(false);
    await withTenantTransactionCompletion(async () => {
      deferAfterTenantTransaction(async () => {
        expect(deferAfterTenantTransaction(async () => undefined)).toBe(false);
      });
    });
    expect(deferAfterTenantTransaction(async () => undefined)).toBe(false);
  });
});
