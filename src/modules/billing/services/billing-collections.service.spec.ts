import { describe, it, expect, jest } from '@jest/globals';
import { runWithTenant } from '../../../common/tenant/tenant-context';
import { BillingCollectionsService } from './billing-collections.service';

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
  return { service: new BillingCollectionsService(em as any), findAndCount };
}

describe('BillingCollectionsService', () => {
  it('listDocuments acota al tenant del contexto y publica sólo lo mapeado', async () => {
    const row = {
      id: 'id-1',
      tenantId: 'tenantId-v',
      invoiceId: 'invoiceId-v',
      billId: 'billId-v',
      contractId: 'contractId-v',
      salesOrderId: 'salesOrderId-v',
      purchaseOrderId: 'purchaseOrderId-v',
      claimId: 'claimId-v',
      encounterId: 'encounterId-v',
      relationTypeConceptId: 'relationTypeConceptId-v',
      createdAt: new Date('2026-10-24T10:00:00Z'),
      createdByUserId: 'createdByUserId-v',
    };
    const { service, findAndCount } = build([row]);
    const page = await runWithTenant('t-1', () => service.listDocuments(query));
    expect(findAndCount.mock.calls[0]?.[1]).toEqual({ tenantId: 't-1' });
    expect(page.meta.total).toBe(1);
    expect(page.data[0]).not.toHaveProperty('rowVersion');
    expect(page.data[0]).not.toHaveProperty('createdByUserId');
    expect(page.data[0]).toHaveProperty('id', 'id-1');
  });

  it('listDocuments suma el filtro invoiceId sin soltar el tenant', async () => {
    const { service, findAndCount } = build();
    await runWithTenant('t-1', () =>
      service.listDocuments({ ...query, invoiceId: 'f-1' }),
    );
    const where = findAndCount.mock.calls[0]?.[1] as unknown as {
      $and: unknown[];
    };
    expect(where.$and).toContainEqual({ tenantId: 't-1' });
    expect(where.$and[0]).toMatchObject({ invoiceId: 'f-1' });
  });
});
