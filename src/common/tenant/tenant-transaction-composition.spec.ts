import { describe, expect, it, jest } from '@jest/globals';
import { Controller, Post, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TransactionPropagation } from '@mikro-orm/core';
import { lastValueFrom, of, throwError } from 'rxjs';
import { TenantContextInterceptor } from './tenant-context.interceptor';
import { deferAfterTenantTransaction } from './tenant-transaction-completion';
import { AuditTrailInterceptor } from '../../modules/audit/interceptors/audit-trail.interceptor';
import { getAuditRequestContext } from '../audit-trail';

@Controller('qa-transaction')
class BoundaryController {
  @Post() submit(this: void): void {}
}
const tenant = '22222222-2222-4222-8222-222222222222';

describe('tenant and audit interceptor composition', () => {
  it.each(['success', 'failure', 'commit-failure'] as const)(
    '%s preserves audit atomicity and does not hold an outer lease for independent work',
    async (outcome) => {
      const previous = process.env.RLS_ENFORCE;
      process.env.RLS_ENFORCE = 'true';
      let held = false;
      let commitFailure: Error | undefined;
      const events: string[] = [],
        captured: unknown[] = [];
      const tx = {
        getTransactionContext: () => undefined,
        execute: jest.fn(async () => []),
      };
      const em = {
        getTransactionContext: () => undefined,
        isInTransaction: () => held,
        execute: tx.execute,
        transactional: async (fn: (value: typeof tx) => Promise<unknown>) => {
          held = true;
          try {
            const result = await fn(tx);
            if (commitFailure) throw commitFailure;
            return result;
          } finally {
            held = false;
            events.push('release-outer');
          }
        },
        fork: () => ({
          isInTransaction: () => held,
          transactional: async (
            fn: (value: typeof tx) => Promise<unknown>,
            options?: { propagation?: TransactionPropagation },
          ) => {
            if (options?.propagation === TransactionPropagation.REQUIRES_NEW)
              expect(held).toBe(false);
            return fn(tx);
          },
        }),
      };
      const repo = {
        append: async () => {
          events.push(held ? 'audit-in-transaction' : 'audit-after-release');
          captured.push(getAuditRequestContext());
        },
      };
      const user = {
        id: '11111111-1111-4111-8111-111111111111',
        roles: ['USER'],
        tenantIds: [tenant],
        sessionId: '44444444-4444-4444-8444-444444444444',
      };
      const request = {
        user,
        headers: { 'x-tenant-id': tenant },
        resolvedTenantId: tenant,
        params: {},
        body: {},
        query: {},
        ip: '127.0.0.1',
        method: 'POST',
      };
      const context = {
        getType: () => 'http',
        getClass: () => BoundaryController,
        getHandler: () => BoundaryController.prototype.submit,
        switchToHttp: () => ({ getRequest: () => request }),
      } as unknown as ExecutionContext;
      try {
        const scope = new TenantContextInterceptor(
          em as never,
          new Reflector(),
        );
        const audit = new AuditTrailInterceptor(
          em as never,
          new Reflector(),
          repo as never,
          {} as never,
        );
        const original = new Error('original rejection');
        if (outcome === 'commit-failure') commitFailure = original;
        const handler = {
          handle: () => {
            expect(held).toBe(true);
            deferAfterTenantTransaction(async () => {
              expect(held).toBe(false);
              events.push('telemetry-after-release');
            });
            return outcome === 'failure'
              ? throwError(() => original)
              : of('ok');
          },
        };
        const operation = lastValueFrom(
          scope.intercept(context, {
            handle: () => audit.intercept(context, handler),
          }),
        );
        if (outcome !== 'success')
          await expect(operation).rejects.toBe(original);
        else await expect(operation).resolves.toBe('ok');
        expect(events).toEqual(
          outcome === 'commit-failure'
            ? [
                'audit-in-transaction',
                'release-outer',
                'telemetry-after-release',
                'audit-after-release',
              ]
            : outcome === 'failure'
              ? [
                  'release-outer',
                  'telemetry-after-release',
                  'audit-after-release',
                ]
              : [
                  'audit-in-transaction',
                  'release-outer',
                  'telemetry-after-release',
                ],
        );
        expect(captured).toHaveLength(outcome === 'commit-failure' ? 2 : 1);
        expect(captured[0]).toMatchObject({
          actorUserId: user.id,
          sessionId: user.sessionId,
          ip: '127.0.0.1',
        });
      } finally {
        if (previous === undefined) delete process.env.RLS_ENFORCE;
        else process.env.RLS_ENFORCE = previous;
      }
    },
  );
});
