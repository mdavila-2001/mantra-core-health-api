import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { HttpStatus, Logger } from '@nestjs/common';
import { TransactionPropagation } from '@mikro-orm/core';
import { DomainException } from '../../../../common';
import { ExternalCatalogUnavailableError } from '../../domain/sync/external-catalog';
import { ConfigureExternalSystemUseCase } from './configure-external-system.use-case';
import { withTenantTransactionCompletion } from '../../../../common/tenant/tenant-transaction-completion';

type Stage = 'acquire' | 'write' | 'commit' | 'rollback';
type Probe = 'AUTH_REJECTED' | 'UNREACHABLE' | 'UNAVAILABLE' | 'OK';
const stages: Stage[] = ['acquire', 'write', 'commit', 'rollback'];
const failures = (
  ['AUTH_REJECTED', 'UNREACHABLE', 'UNAVAILABLE'] as const
).flatMap((probe) => stages.map((stage) => ({ probe, stage })));

function fixture(probe: Probe, stage: Stage) {
  const fault = new Error(`qa-private-key SQL synthetic telemetry ${stage}`);
  const writeFault = new Error('qa-private-key SQL synthetic failed write');
  let parentHeld = false;
  const telemetryStartedWithParent: boolean[] = [];
  const events: string[] = [];
  const tx = {
    getTransactionContext: () => undefined,
    execute: jest.fn(async (sql: string) =>
      sql.includes('current_setting')
        ? [{ system_context: 'false', tenant_id: 'tenant' }]
        : [],
    ),
  };
  const em = {
    getTransactionContext: () => undefined,
    isInTransaction: () => false,
    transactional: jest.fn(
      async (
        run: (em: typeof tx) => Promise<unknown>,
        options?: { propagation?: TransactionPropagation },
      ) => {
        const recording =
          options?.propagation === TransactionPropagation.REQUIRES_NEW ||
          options?.propagation === TransactionPropagation.REQUIRED;
        if (recording) telemetryStartedWithParent.push(parentHeld);
        if (recording && stage === 'acquire') {
          events.push('telemetry-failed');
          throw fault;
        }
        let value;
        try {
          value = await run(tx);
        } catch (error) {
          if (recording && stage === 'rollback') {
            events.push('telemetry-failed');
            throw fault;
          }
          throw error;
        }
        if (recording && stage === 'commit') {
          events.push('telemetry-failed');
          throw fault;
        }
        return value;
      },
    ),
  };
  const check = {
    connectionId: 'provider',
    credentialId: 'credential',
    configJson: {},
  };
  const systems = {
    resolve: async () =>
      probe === 'UNAVAILABLE'
        ? { status: 'UNAVAILABLE', errorReason: 'UNREACHABLE', check }
        : {
            status: 'READY',
            source: 'PHARMACY',
            check,
            client: {
              checkHealth: async () => {
                if (probe === 'AUTH_REJECTED' || probe === 'UNREACHABLE')
                  throw new ExternalCatalogUnavailableError(
                    'qa-private-key upstream details',
                    probe,
                  );
              },
            },
          },
    recordCheck: jest.fn(async () => {
      if (stage === 'write') {
        events.push('telemetry-failed');
        throw fault;
      }
      if (stage === 'rollback') throw writeFault;
    }),
  };
  const service = new ConfigureExternalSystemUseCase(
    em as never,
    {
      requireManagedPharmacy: async () => ({
        tenantId: 'tenant',
        pharmacyId: 'pharmacy',
      }),
    } as never,
    { findConnection: async () => ({ connectionId: 'provider' }) } as never,
    systems as never,
  );
  return {
    fault,
    writeFault,
    service,
    telemetryStartedWithParent,
    events,
    setParentHeld: (value: boolean) => {
      parentHeld = value;
    },
  };
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('saved ERP error survives failed telemetry', () => {
  it.each(failures)(
    '$probe remains classified after telemetry $stage fails',
    async ({ probe, stage }) => {
      const warning = jest
        .spyOn(Logger.prototype, 'warn')
        .mockImplementation(() => undefined);
      const { service } = fixture(probe, stage);
      const operation = service.probe(
        { pharmacyId: 'pharmacy', connectionId: 'link' },
        { id: 'actor' } as never,
      );
      let caught: unknown;
      try {
        await operation;
      } catch (error) {
        caught = error;
      }
      expect(caught).toBeInstanceOf(DomainException);
      const error = caught as DomainException;
      expect(error.getStatus()).toBe(HttpStatus.BAD_GATEWAY);
      expect(error.details?.errorReason).toBe(
        probe === 'UNAVAILABLE' ? 'UNREACHABLE' : probe,
      );
      expect(JSON.stringify(error.getResponse())).not.toContain(
        'qa-private-key',
      );
      expect(warning).toHaveBeenCalledTimes(1);
      expect(warning).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: 'pharmacy_inventory.external_system.check_status',
          connectionId: 'provider',
          errorReason: probe === 'UNAVAILABLE' ? 'UNREACHABLE' : probe,
          persistenceFailed: true,
        }),
      );
      expect(JSON.stringify(warning.mock.calls)).not.toContain(
        'qa-private-key',
      );
      expect(JSON.stringify(warning.mock.calls)).not.toContain('SQL');
    },
  );

  it.each(stages)(
    'does not turn an ERP success into success after telemetry %s fails',
    async (stage) => {
      const warning = jest
        .spyOn(Logger.prototype, 'warn')
        .mockImplementation(() => undefined);
      const { service, fault, writeFault } = fixture('OK', stage);
      const operation = service.probe(
        { pharmacyId: 'pharmacy', connectionId: 'link' },
        { id: 'actor' } as never,
      );
      await expect(operation).rejects.toBe(
        stage === 'rollback' ? writeFault : fault,
      );
      if (stage === 'rollback') await expect(operation).rejects.not.toBe(fault);
      expect(warning).not.toHaveBeenCalled();
    },
  );
});

describe('saved probe telemetry after the parent transaction completes', () => {
  it.each(failures)(
    '$probe keeps classification and scoped warning after deferred $stage failure',
    async ({ probe, stage }) => {
      const warning = jest
        .spyOn(Logger.prototype, 'warn')
        .mockImplementation(() => undefined);
      const f = fixture(probe, stage);
      f.setParentHeld(true);
      let caught: unknown;
      try {
        await withTenantTransactionCompletion(async () => {
          try {
            return await f.service.probe(
              { pharmacyId: 'pharmacy', connectionId: 'link' },
              { id: 'actor' } as never,
            );
          } finally {
            f.setParentHeld(false);
          }
        });
      } catch (error) {
        caught = error;
      }
      expect(caught).toBeInstanceOf(DomainException);
      expect((caught as DomainException).getStatus()).toBe(
        HttpStatus.BAD_GATEWAY,
      );
      expect((caught as DomainException).details?.errorReason).toBe(
        probe === 'UNAVAILABLE' ? 'UNREACHABLE' : probe,
      );
      expect(f.telemetryStartedWithParent).toEqual([false]);
      expect(warning).toHaveBeenCalledTimes(1);
      expect(warning).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: 'pharmacy_inventory.external_system.check_status',
          connectionId: 'provider',
          errorReason: probe === 'UNAVAILABLE' ? 'UNREACHABLE' : probe,
          persistenceFailed: true,
        }),
      );
      expect(JSON.stringify(warning.mock.calls)).not.toContain(
        'qa-private-key',
      );
      expect(JSON.stringify(warning.mock.calls)).not.toContain('SQL');
    },
  );

  it.each(stages)(
    'keeps the ERP OK result atomic when telemetry %s fails inside the parent',
    async (stage) => {
      const warning = jest
        .spyOn(Logger.prototype, 'warn')
        .mockImplementation(() => undefined);
      const f = fixture('OK', stage);
      f.setParentHeld(true);
      await expect(
        withTenantTransactionCompletion(async () => {
          try {
            return await f.service.probe(
              { pharmacyId: 'pharmacy', connectionId: 'link' },
              { id: 'actor' } as never,
            );
          } finally {
            // The parent is released only after the record operation rejects.
            f.events.push('parent-finally');
            f.setParentHeld(false);
          }
        }),
      ).rejects.toBe(f.fault);
      expect(f.telemetryStartedWithParent).toEqual([true]);
      expect(f.events).toEqual(['telemetry-failed', 'parent-finally']);
      expect(warning).not.toHaveBeenCalled();
    },
  );
});
