import { describe, expect, it, jest } from '@jest/globals';
import { TransactionPropagation } from '@mikro-orm/core';
import { withTenantTransactionCompletion } from '../../../../common/tenant/tenant-transaction-completion';
import { recordExternalSystemCheck } from './record-external-system-check';

type Context = { system_context: string | null; tenant_id: string | null };
function fixture(context: Context, failure?: 'write' | 'snapshot' | 'restore') {
  const state = { ...context };
  const calls: string[] = [];
  const writes: Context[] = [];
  const fault = new Error('synthetic context failure');
  let recorded = false;
  const tx = {
    execute: jest.fn(
      async (sql: string, params?: unknown[]): Promise<Context[]> => {
        calls.push(sql);
        if (sql.includes('current_setting')) {
          if (failure === 'snapshot') throw fault;
          return [{ ...state }];
        }
        if (recorded && failure === 'restore') throw fault;
        if (sql.includes("set_config('app.system_context'"))
          state.system_context = params ? String(params[0]) : 'false';
        if (sql.includes("set_config('app.current_tenant_id'"))
          state.tenant_id = String(params?.[0]);
        return [];
      },
    ),
  };
  const em = {
    transactional: jest.fn(
      async (
        run: (em: typeof tx) => Promise<void>,
        options: { propagation: TransactionPropagation; clear?: boolean },
      ) => {
        const saved = { ...state };
        try {
          await run(tx);
        } catch (error) {
          if (options.propagation === TransactionPropagation.NESTED)
            Object.assign(state, saved); // Simulated savepoint rollback, not PostgreSQL evidence.
          throw error;
        }
      },
    ),
  };
  const systems = {
    recordCheck: jest.fn(async () => {
      writes.push({ ...state });
      recorded = true;
      if (failure === 'write') throw fault;
    }),
  };
  const data = {
    tenantId: 'tenant-b',
    check: {
      connectionId: 'provider',
      credentialId: 'credential',
      configJson: {},
    },
    result: 'OK' as const,
    actorUserId: 'actor',
  };
  return { state, calls, writes, fault, em, systems, data };
}

/** Offline contract regression. The coordinator verifies actual PostgreSQL GUC/savepoint behavior. */
describe('successful joined check preserves the parent SQL context', () => {
  it.each([
    { system: 'true', optional: false },
    { system: 'false', optional: false },
    { system: 'true', optional: true },
    { system: 'false', optional: true },
  ])(
    'restores tenant-a/system=$system after writing tenant-b with optional=$optional',
    async ({ system, optional }) => {
      const f = fixture({ system_context: system, tenant_id: 'tenant-a' });
      const failed = jest.fn();
      await withTenantTransactionCompletion(() =>
        recordExternalSystemCheck(
          f.em as never,
          f.systems as never,
          f.data,
          optional ? failed : undefined,
        ),
      );
      expect(f.writes).toEqual([
        { system_context: 'false', tenant_id: 'tenant-b' },
      ]);
      expect(f.state).toEqual({
        system_context: system,
        tenant_id: 'tenant-a',
      });
      expect(failed).not.toHaveBeenCalled();
      expect(f.em.transactional).toHaveBeenCalledTimes(1);
      expect(f.em.transactional).toHaveBeenCalledWith(expect.any(Function), {
        propagation: optional
          ? TransactionPropagation.NESTED
          : TransactionPropagation.REQUIRED,
        clear: true,
      });
      expect(f.calls[0]).toContain('current_setting');
    },
  );

  it.each([null, ''])(
    'restores absent/empty custom GUCs as empty strings (%s)',
    async (value) => {
      const f = fixture({ system_context: value, tenant_id: value });
      await withTenantTransactionCompletion(() =>
        recordExternalSystemCheck(f.em as never, f.systems as never, f.data),
      );
      expect(f.writes).toEqual([
        { system_context: 'false', tenant_id: 'tenant-b' },
      ]);
      expect(f.state).toEqual({ system_context: '', tenant_id: '' });
    },
  );

  it('keeps the original REQUIRED write error and never runs restoration SQL in an aborted transaction', async () => {
    const f = fixture(
      { system_context: 'true', tenant_id: 'tenant-a' },
      'write',
    );
    await expect(
      withTenantTransactionCompletion(() =>
        recordExternalSystemCheck(f.em as never, f.systems as never, f.data),
      ),
    ).rejects.toBe(f.fault);
    expect(f.calls).toHaveLength(3); // Snapshot and two scope settings; no finally SQL.
    expect(f.writes).toEqual([
      { system_context: 'false', tenant_id: 'tenant-b' },
    ]);
  });

  it('lets the NESTED rollback restore context before the optional failure callback', async () => {
    const initial = { system_context: 'true', tenant_id: 'tenant-a' };
    const f = fixture(initial, 'write');
    const failed = jest.fn((error: unknown) => {
      expect(error).toBe(f.fault);
      expect(f.state).toEqual(initial);
    });
    await withTenantTransactionCompletion(() =>
      recordExternalSystemCheck(
        f.em as never,
        f.systems as never,
        f.data,
        failed,
      ),
    );
    expect(failed).toHaveBeenCalledWith(f.fault);
    expect(f.calls).toHaveLength(3);
  });

  it('propagates a snapshot failure before changing context or writing', async () => {
    const initial = { system_context: 'false', tenant_id: 'tenant-a' };
    const f = fixture(initial, 'snapshot');
    await expect(
      withTenantTransactionCompletion(() =>
        recordExternalSystemCheck(f.em as never, f.systems as never, f.data),
      ),
    ).rejects.toBe(f.fault);
    expect(f.state).toEqual(initial);
    expect(f.systems.recordCheck).not.toHaveBeenCalled();
  });

  it('propagates a restoration failure instead of certifying a successful check', async () => {
    const f = fixture(
      { system_context: 'true', tenant_id: 'tenant-a' },
      'restore',
    );
    await expect(
      withTenantTransactionCompletion(() =>
        recordExternalSystemCheck(f.em as never, f.systems as never, f.data),
      ),
    ).rejects.toBe(f.fault);
    expect(f.systems.recordCheck).toHaveBeenCalledTimes(1);
  });
});
