import { describe, it, expect, jest } from '@jest/globals';
import { runWithTenant } from '../../../common/tenant/tenant-context';
import { PaymentsCollectionsService } from './payments-collections.service';

const query = {
  page: 1,
  pageSize: 20,
  order: 'DESC' as const,
  sortBy: 'createdAt',
  offset: 0,
} as any;

/** `EntityManager` con `fork()` que devuelve un `findAndCount` espiable. */
function build(rows: object[] = []) {
  const findAndCount = jest.fn(
    async (..._args: unknown[]) => [rows, rows.length] as const,
  );
  const em = { fork: () => ({ findAndCount }) };
  return { service: new PaymentsCollectionsService(em as any), findAndCount };
}

describe('PaymentsCollectionsService', () => {
  it('listCheckoutSessions acota al tenant del contexto y publica sólo lo mapeado', async () => {
    const row = {
      id: 'id-1',
      tenantId: 'tenantId-v',
      gatewayConnectionId: 'gatewayConnectionId-v',
      paymentDebtId: 'paymentDebtId-v',
      paymentIntentId: 'paymentIntentId-v',
      sessionTokenHash: 'sessionTokenHash-v',
      externalTransactionId: 'externalTransactionId-v',
      redirectUrl: 'redirectUrl-v',
      successReturnUrl: 'successReturnUrl-v',
      failureReturnUrl: 'failureReturnUrl-v',
      callbackEndpointId: 'callbackEndpointId-v',
      expiresAt: new Date('2026-10-24T10:00:00Z'),
      statusConceptId: 'statusConceptId-v',
      openedAt: new Date('2026-10-24T10:00:00Z'),
      completedAt: new Date('2026-10-24T10:00:00Z'),
      createdAt: new Date('2026-10-24T10:00:00Z'),
      updatedAt: new Date('2026-10-24T10:00:00Z'),
      createdByUserId: 'createdByUserId-v',
      updatedByUserId: 'updatedByUserId-v',
      rowVersion: 1,
    };
    const { service, findAndCount } = build([row]);
    const page = await runWithTenant('t-1', () =>
      service.listCheckoutSessions(query),
    );
    expect(findAndCount.mock.calls[0]?.[1]).toEqual({ tenantId: 't-1' });
    expect(page.meta.total).toBe(1);
    expect(page.data[0]).not.toHaveProperty('rowVersion');
    expect(page.data[0]).not.toHaveProperty('createdByUserId');
    expect(page.data[0]).toHaveProperty('id', 'id-1');
  });

  it('listCheckoutSessions suma el filtro statusConceptId sin soltar el tenant', async () => {
    const { service, findAndCount } = build();
    await runWithTenant('t-1', () =>
      service.listCheckoutSessions({ ...query, statusConceptId: 'f-1' }),
    );
    const where = findAndCount.mock.calls[0]?.[1] as unknown as {
      $and: unknown[];
    };
    expect(where.$and).toContainEqual({ tenantId: 't-1' });
    expect(where.$and[0]).toMatchObject({ statusConceptId: 'f-1' });
  });

  it('listFeeSchedules acota al tenant del contexto y publica sólo lo mapeado', async () => {
    const row = {
      id: 'id-1',
      tenantId: 'tenantId-v',
      code: 'code-v',
      name: 'name-v',
      feeTypeConceptId: 'feeTypeConceptId-v',
      calculationMethodConceptId: 'calculationMethodConceptId-v',
      percentage: 'percentage-v',
      fixedAmount: 'fixedAmount-v',
      currencyConceptId: 'currencyConceptId-v',
      minAmount: 'minAmount-v',
      maxAmount: 'maxAmount-v',
      appliesToConceptId: 'appliesToConceptId-v',
      validFrom: new Date('2026-10-24T10:00:00Z'),
      validTo: new Date('2026-10-24T10:00:00Z'),
      stateConceptId: 'stateConceptId-v',
      createdAt: new Date('2026-10-24T10:00:00Z'),
      updatedAt: new Date('2026-10-24T10:00:00Z'),
      createdByUserId: 'createdByUserId-v',
      updatedByUserId: 'updatedByUserId-v',
      rowVersion: 1,
    };
    const { service, findAndCount } = build([row]);
    const page = await runWithTenant('t-1', () =>
      service.listFeeSchedules(query),
    );
    expect(findAndCount.mock.calls[0]?.[1]).toEqual({ tenantId: 't-1' });
    expect(page.meta.total).toBe(1);
    expect(page.data[0]).not.toHaveProperty('rowVersion');
    expect(page.data[0]).not.toHaveProperty('createdByUserId');
    expect(page.data[0]).toHaveProperty('id', 'id-1');
  });

  it('listFeeSchedules suma el filtro stateConceptId sin soltar el tenant', async () => {
    const { service, findAndCount } = build();
    await runWithTenant('t-1', () =>
      service.listFeeSchedules({ ...query, stateConceptId: 'f-1' }),
    );
    const where = findAndCount.mock.calls[0]?.[1] as unknown as {
      $and: unknown[];
    };
    expect(where.$and).toContainEqual({ tenantId: 't-1' });
    expect(where.$and[0]).toMatchObject({ stateConceptId: 'f-1' });
  });

  it('listIntents acota al tenant del contexto y publica sólo lo mapeado', async () => {
    const row = {
      id: 'id-1',
      tenantId: 'tenantId-v',
      practiceId: 'practiceId-v',
      gatewayId: 'gatewayId-v',
      gatewayConnectionId: 'gatewayConnectionId-v',
      paymentMethodId: 'paymentMethodId-v',
      purposeConceptId: 'purposeConceptId-v',
      invoiceId: 'invoiceId-v',
      sourceRefType: 'sourceRefType-v',
      sourceRefId: 'sourceRefId-v',
      amount: 'amount-v',
      currencyConceptId: 'currencyConceptId-v',
      idempotencyKey: 'idempotencyKey-v',
      gatewayIntentRef: 'gatewayIntentRef-v',
      statusConceptId: 'statusConceptId-v',
      clientSecretRef: 'clientSecretRef-v',
      expiresAt: new Date('2026-10-24T10:00:00Z'),
      createdAt: new Date('2026-10-24T10:00:00Z'),
      updatedAt: new Date('2026-10-24T10:00:00Z'),
      createdByUserId: 'createdByUserId-v',
      updatedByUserId: 'updatedByUserId-v',
      rowVersion: 1,
    };
    const { service, findAndCount } = build([row]);
    const page = await runWithTenant('t-1', () => service.listIntents(query));
    expect(findAndCount.mock.calls[0]?.[1]).toEqual({ tenantId: 't-1' });
    expect(page.meta.total).toBe(1);
    expect(page.data[0]).not.toHaveProperty('rowVersion');
    expect(page.data[0]).not.toHaveProperty('createdByUserId');
    expect(page.data[0]).not.toHaveProperty('idempotencyKey');
    expect(page.data[0]).toHaveProperty('id', 'id-1');
  });

  it('listIntents suma el filtro practiceId sin soltar el tenant', async () => {
    const { service, findAndCount } = build();
    await runWithTenant('t-1', () =>
      service.listIntents({ ...query, practiceId: 'f-1' }),
    );
    const where = findAndCount.mock.calls[0]?.[1] as unknown as {
      $and: unknown[];
    };
    expect(where.$and).toContainEqual({ tenantId: 't-1' });
    expect(where.$and[0]).toMatchObject({ practiceId: 'f-1' });
  });

  it('listPayouts acota al tenant del contexto y publica sólo lo mapeado', async () => {
    const row = {
      id: 'id-1',
      tenantId: 'tenantId-v',
      practiceId: 'practiceId-v',
      payeeTypeConceptId: 'payeeTypeConceptId-v',
      payeeRefId: 'payeeRefId-v',
      gatewayId: 'gatewayId-v',
      amount: 'amount-v',
      currencyConceptId: 'currencyConceptId-v',
      periodStart: new Date('2026-10-24T10:00:00Z'),
      periodEnd: new Date('2026-10-24T10:00:00Z'),
      statusConceptId: 'statusConceptId-v',
      scheduledAt: new Date('2026-10-24T10:00:00Z'),
      executedAt: new Date('2026-10-24T10:00:00Z'),
      destinationRef: 'destinationRef-v',
      gatewayPayoutRef: 'gatewayPayoutRef-v',
      journalTransactionId: 'journalTransactionId-v',
      createdAt: new Date('2026-10-24T10:00:00Z'),
      updatedAt: new Date('2026-10-24T10:00:00Z'),
      createdByUserId: 'createdByUserId-v',
      updatedByUserId: 'updatedByUserId-v',
      rowVersion: 1,
    };
    const { service, findAndCount } = build([row]);
    const page = await runWithTenant('t-1', () => service.listPayouts(query));
    expect(findAndCount.mock.calls[0]?.[1]).toEqual({ tenantId: 't-1' });
    expect(page.meta.total).toBe(1);
    expect(page.data[0]).not.toHaveProperty('rowVersion');
    expect(page.data[0]).not.toHaveProperty('createdByUserId');
    expect(page.data[0]).toHaveProperty('id', 'id-1');
  });

  it('listPayouts suma el filtro statusConceptId sin soltar el tenant', async () => {
    const { service, findAndCount } = build();
    await runWithTenant('t-1', () =>
      service.listPayouts({ ...query, statusConceptId: 'f-1' }),
    );
    const where = findAndCount.mock.calls[0]?.[1] as unknown as {
      $and: unknown[];
    };
    expect(where.$and).toContainEqual({ tenantId: 't-1' });
    expect(where.$and[0]).toMatchObject({ statusConceptId: 'f-1' });
  });

  it('listReconciliationRuns acota al tenant del contexto y publica sólo lo mapeado', async () => {
    const row = {
      id: 'id-1',
      tenantId: 'tenantId-v',
      gatewayId: 'gatewayId-v',
      periodStart: new Date('2026-10-24T10:00:00Z'),
      periodEnd: new Date('2026-10-24T10:00:00Z'),
      statusConceptId: 'statusConceptId-v',
      totalGateway: 'totalGateway-v',
      totalLedger: 'totalLedger-v',
      totalBank: 'totalBank-v',
      matchedCount: 1,
      unmatchedCount: 1,
      startedAt: new Date('2026-10-24T10:00:00Z'),
      finishedAt: new Date('2026-10-24T10:00:00Z'),
      createdAt: new Date('2026-10-24T10:00:00Z'),
      updatedAt: new Date('2026-10-24T10:00:00Z'),
      createdByUserId: 'createdByUserId-v',
      updatedByUserId: 'updatedByUserId-v',
      rowVersion: 1,
    };
    const { service, findAndCount } = build([row]);
    const page = await runWithTenant('t-1', () =>
      service.listReconciliationRuns(query),
    );
    expect(findAndCount.mock.calls[0]?.[1]).toEqual({ tenantId: 't-1' });
    expect(page.meta.total).toBe(1);
    expect(page.data[0]).not.toHaveProperty('rowVersion');
    expect(page.data[0]).not.toHaveProperty('createdByUserId');
    expect(page.data[0]).toHaveProperty('id', 'id-1');
  });

  it('listReconciliationRuns suma el filtro statusConceptId sin soltar el tenant', async () => {
    const { service, findAndCount } = build();
    await runWithTenant('t-1', () =>
      service.listReconciliationRuns({ ...query, statusConceptId: 'f-1' }),
    );
    const where = findAndCount.mock.calls[0]?.[1] as unknown as {
      $and: unknown[];
    };
    expect(where.$and).toContainEqual({ tenantId: 't-1' });
    expect(where.$and[0]).toMatchObject({ statusConceptId: 'f-1' });
  });
});
