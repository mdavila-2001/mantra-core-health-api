import { fixture, handle } from './owned-transaction.testing';
import { afterEach, describe, expect, it, jest } from '@jest/globals';
import {
  TransactionPropagation,
  type TransactionOptions,
} from '@mikro-orm/core';
import { Logger } from '@nestjs/common';
import { ownedTransaction } from './owned-transaction';

const warn = () =>
  jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
afterEach(() => {
  jest.restoreAllMocks();
});

describe('owned transaction bounded resource cleanup', () => {
  it('cleans its own unfinished rollback once and preserves the callback error replaced by ORM', async () => {
    const warning = warn(),
      f = fixture({ mode: 'rollback-ack' });
    const original = new Error('SYNTHETIC_PRIVATE_SQL_CALLBACK');
    const callback = jest.fn<() => Promise<void>>(async () => {
      throw original;
    });
    await expect(ownedTransaction(f.em, callback)).rejects.toBe(original);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(f.transactional).toHaveBeenCalledTimes(1);
    expect(f.cleanup).toHaveBeenCalledTimes(1);
    expect(f.cleanup).toHaveBeenCalledWith(f.child);
    expect(warning).toHaveBeenCalledWith(
      expect.objectContaining({ cleanupAttempted: true, cleanupFailed: false }),
    );
    expect(JSON.stringify(warning.mock.calls)).not.toContain(
      'SYNTHETIC_PRIVATE_SQL',
    );
  });

  it('retains even an undefined callback rejection when the ORM rollback replaces it', async () => {
    warn();
    const f = fixture({ mode: 'rollback-ack' });
    await expect(
      ownedTransaction(f.em, async () => {
        throw undefined;
      }),
    ).rejects.toBeUndefined();
    expect(f.cleanup).toHaveBeenCalledTimes(1);
  });

  it('does not convert an uncertain commit into success or replay its callback', async () => {
    const warning = warn(),
      f = fixture({ mode: 'commit-ack' });
    const callback = jest.fn(async () => 'business-once');
    await expect(ownedTransaction(f.em, callback)).rejects.toBe(f.failure);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(f.cleanup).toHaveBeenCalledTimes(1);
    expect(warning).toHaveBeenCalledWith(
      expect.objectContaining({ businessOutcome: 'NOT_DETERMINED' }),
    );
  });

  it('stops after one additional cleanup failure, warns safely and preserves the primary failure', async () => {
    const warning = warn(),
      f = fixture({ mode: 'rollback-ack', cleanupFails: true });
    const original = new Error('SYNTHETIC_PRIVATE_SQL_PRIMARY');
    await expect(
      ownedTransaction(f.em, async () => {
        throw original;
      }),
    ).rejects.toBe(original);
    expect(f.cleanup).toHaveBeenCalledTimes(1);
    expect(warning).toHaveBeenCalledWith(
      expect.objectContaining({ cleanupAttempted: true, cleanupFailed: true }),
    );
    expect(JSON.stringify(warning.mock.calls)).not.toContain(
      'SYNTHETIC_PRIVATE_SQL',
    );
  });

  it.each(['after-commit', 'after-rollback'] as const)(
    'does not clean a finalized transaction (%s)',
    async (mode) => {
      warn();
      const f = fixture({ mode });
      const original = new Error('callback');
      const operation = ownedTransaction(f.em, async () => {
        if (mode === 'after-rollback') throw original;
        return 'ok';
      });
      await expect(operation).rejects.toBe(
        mode === 'after-rollback' ? original : f.failure,
      );
      expect(f.cleanup).not.toHaveBeenCalled();
    },
  );

  it.each([TransactionPropagation.REQUIRED, TransactionPropagation.NESTED])(
    'does not clean a borrowed parent under %s',
    async (propagation) => {
      warn();
      const parent = handle().context;
      const f = fixture({
        mode: 'rollback-ack',
        parent,
        child:
          propagation === TransactionPropagation.REQUIRED ? parent : undefined,
      });
      const original = new Error('borrowed operation');
      await expect(
        ownedTransaction(
          f.em,
          async () => {
            throw original;
          },
          { propagation },
        ),
      ).rejects.toBe(original);
      expect(f.cleanup).not.toHaveBeenCalled();
      expect(parent.isRolledBack).toBe(false);
    },
  );

  it('respects an explicitly borrowed options.ctx even when the EM has no parent', async () => {
    warn();
    const parent = handle().context,
      f = fixture({ mode: 'rollback-ack', child: parent });
    const original = new Error('explicit parent');
    await expect(
      ownedTransaction(
        f.em,
        async () => {
          throw original;
        },
        { ctx: parent, propagation: TransactionPropagation.NESTED },
      ),
    ).rejects.toBe(original);
    expect(f.cleanup).not.toHaveBeenCalled();
  });

  it('cleans only a new independent REQUIRES_NEW child while preserving its suspended parent', async () => {
    warn();
    const parent = handle().context,
      f = fixture({ mode: 'rollback-ack', parent });
    const original = new Error('child failure');
    await expect(
      ownedTransaction(
        f.em,
        async () => {
          throw original;
        },
        { propagation: TransactionPropagation.REQUIRES_NEW },
      ),
    ).rejects.toBe(original);
    expect(f.cleanup).toHaveBeenCalledWith(f.child);
    expect(f.child).not.toBe(parent);
    expect(parent.isRolledBack).toBe(false);
  });

  it('refuses to clean a captured parent even if REQUIRES_NEW was requested', async () => {
    warn();
    const parent = handle().context,
      f = fixture({ mode: 'rollback-ack', parent, child: parent });
    const original = new Error('invalid child boundary');
    await expect(
      ownedTransaction(
        f.em,
        async () => {
          throw original;
        },
        { propagation: TransactionPropagation.REQUIRES_NEW },
      ),
    ).rejects.toBe(original);
    expect(f.cleanup).not.toHaveBeenCalled();
  });

  it('does not invent a transaction handle when BEGIN failed before its callback', async () => {
    const warning = warn(),
      f = fixture({ mode: 'begin' });
    const callback = jest.fn(async () => 'never');
    await expect(ownedTransaction(f.em, callback)).rejects.toBe(f.failure);
    expect(callback).not.toHaveBeenCalled();
    expect(f.cleanup).not.toHaveBeenCalled();
    expect(warning).not.toHaveBeenCalled();
  });

  it('does not infer ownership when the EM reports an existing transaction without exposing its handle', async () => {
    warn();
    const f = fixture({ mode: 'rollback-ack', inTransaction: true });
    const original = new Error('unproven ownership');
    await expect(
      ownedTransaction(f.em, async () => {
        throw original;
      }),
    ).rejects.toBe(original);
    expect(f.cleanup).not.toHaveBeenCalled();
  });

  it('keeps concurrent transaction handles and primary errors separate', async () => {
    warn();
    const a = fixture({ mode: 'rollback-ack' }),
      b = fixture({ mode: 'rollback-ack' });
    const first = new Error('first'),
      second = new Error('second');
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const opA = ownedTransaction(a.em, async () => {
      await gate;
      throw first;
    });
    const opB = ownedTransaction(b.em, async () => {
      throw second;
    });
    await expect(opB).rejects.toBe(second);
    expect(a.cleanup).not.toHaveBeenCalled();
    release();
    await expect(opA).rejects.toBe(first);
    expect(a.cleanup).toHaveBeenCalledWith(a.child);
    expect(b.cleanup).toHaveBeenCalledWith(b.child);
    expect(a.cleanup.mock.calls[0][0]).toBe(a.child);
    expect(b.cleanup.mock.calls[0][0]).toBe(b.child);
    expect(a.cleanup.mock.calls[0][0]).not.toBe(b.child);
  });

  it('preserves the options and result without cleanup or warnings on the normal path', async () => {
    const warning = warn(),
      f = fixture();
    const options: TransactionOptions = {
      propagation: TransactionPropagation.REQUIRES_NEW,
      readOnly: true,
      clear: true,
    };
    await expect(
      ownedTransaction(f.em, async () => ({ result: 'ok' }), options),
    ).resolves.toEqual({ result: 'ok' });
    expect(f.transactional).toHaveBeenCalledWith(expect.any(Function), options);
    expect(f.cleanup).not.toHaveBeenCalled();
    expect(warning).not.toHaveBeenCalled();
  });

  it('does not let a logging failure replace the original rejection', async () => {
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {
      throw new Error('logger failed');
    });
    const f = fixture({ mode: 'rollback-ack' }),
      original = new Error('primary');
    await expect(
      ownedTransaction(f.em, async () => {
        throw original;
      }),
    ).rejects.toBe(original);
    expect(f.cleanup).toHaveBeenCalledTimes(1);
  });
});
