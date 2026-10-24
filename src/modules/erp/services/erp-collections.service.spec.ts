import { describe, it, expect, jest } from '@jest/globals';
import { runWithTenant } from '../../../common/tenant/tenant-context';
import { ErpCollectionsService } from './erp-collections.service';

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
  return { service: new ErpCollectionsService(em as any), findAndCount };
}

describe('ErpCollectionsService', () => {
  it('listBusinessPartners acota al tenant del contexto y publica sólo lo mapeado', async () => {
    const row = {
      id: 'id-1',
      tenantId: 'tenantId-v',
      partnerNumber: 'partnerNumber-v',
      partnerCategoryConceptId: 'partnerCategoryConceptId-v',
      displayName: 'displayName-v',
      legalName: 'legalName-v',
      taxId: 'taxId-v',
      countryConceptId: 'countryConceptId-v',
      linkedTenantId: 'linkedTenantId-v',
      linkedPersonId: 'linkedPersonId-v',
      statusConceptId: 'statusConceptId-v',
      createdAt: new Date('2026-10-24T10:00:00Z'),
      updatedAt: new Date('2026-10-24T10:00:00Z'),
      createdByUserId: 'createdByUserId-v',
      updatedByUserId: 'updatedByUserId-v',
      rowVersion: 1,
    };
    const { service, findAndCount } = build([row]);
    const page = await runWithTenant('t-1', () =>
      service.listBusinessPartners(query),
    );
    expect(findAndCount.mock.calls[0]?.[1]).toEqual({ tenantId: 't-1' });
    expect(page.meta.total).toBe(1);
    expect(page.data[0]).not.toHaveProperty('rowVersion');
    expect(page.data[0]).not.toHaveProperty('createdByUserId');
    expect(page.data[0]).toHaveProperty('id', 'id-1');
  });

  it('listBusinessPartners suma el filtro statusConceptId sin soltar el tenant', async () => {
    const { service, findAndCount } = build();
    await runWithTenant('t-1', () =>
      service.listBusinessPartners({ ...query, statusConceptId: 'f-1' }),
    );
    const where = findAndCount.mock.calls[0]?.[1] as unknown as {
      $and: unknown[];
    };
    expect(where.$and).toContainEqual({ tenantId: 't-1' });
    expect(where.$and[0]).toMatchObject({ statusConceptId: 'f-1' });
  });

  it('listContracts acota al tenant del contexto y publica sólo lo mapeado', async () => {
    const row = {
      id: 'id-1',
      tenantId: 'tenantId-v',
      contractNumber: 'contractNumber-v',
      contractTypeConceptId: 'contractTypeConceptId-v',
      title: 'title-v',
      description: 'description-v',
      counterpartyTypeConceptId: 'counterpartyTypeConceptId-v',
      counterpartyRefType: 'counterpartyRefType-v',
      counterpartyRefId: 'counterpartyRefId-v',
      counterpartyName: 'counterpartyName-v',
      startDate: new Date('2026-10-24T10:00:00Z'),
      endDate: new Date('2026-10-24T10:00:00Z'),
      renewalTypeConceptId: 'renewalTypeConceptId-v',
      noticePeriodDays: 1,
      totalValue: 'totalValue-v',
      currencyConceptId: 'currencyConceptId-v',
      governingJurisdictionConceptId: 'governingJurisdictionConceptId-v',
      ownerUserId: 'ownerUserId-v',
      primaryBusinessPartnerId: 'primaryBusinessPartnerId-v',
      currentVersionId: 'currentVersionId-v',
      parentContractId: 'parentContractId-v',
      masterAgreementId: 'masterAgreementId-v',
      owningDepartmentId: 'owningDepartmentId-v',
      owningCostCenterId: 'owningCostCenterId-v',
      owningProfitCenterId: 'owningProfitCenterId-v',
      approvalStatusConceptId: 'approvalStatusConceptId-v',
      signatureStatusConceptId: 'signatureStatusConceptId-v',
      statusConceptId: 'statusConceptId-v',
      createdAt: new Date('2026-10-24T10:00:00Z'),
      updatedAt: new Date('2026-10-24T10:00:00Z'),
      createdByUserId: 'createdByUserId-v',
      updatedByUserId: 'updatedByUserId-v',
      rowVersion: 1,
    };
    const { service, findAndCount } = build([row]);
    const page = await runWithTenant('t-1', () => service.listContracts(query));
    expect(findAndCount.mock.calls[0]?.[1]).toEqual({ tenantId: 't-1' });
    expect(page.meta.total).toBe(1);
    expect(page.data[0]).not.toHaveProperty('rowVersion');
    expect(page.data[0]).not.toHaveProperty('createdByUserId');
    expect(page.data[0]).toHaveProperty('id', 'id-1');
  });

  it('listContracts suma el filtro statusConceptId sin soltar el tenant', async () => {
    const { service, findAndCount } = build();
    await runWithTenant('t-1', () =>
      service.listContracts({ ...query, statusConceptId: 'f-1' }),
    );
    const where = findAndCount.mock.calls[0]?.[1] as unknown as {
      $and: unknown[];
    };
    expect(where.$and).toContainEqual({ tenantId: 't-1' });
    expect(where.$and[0]).toMatchObject({ statusConceptId: 'f-1' });
  });

  it('listPurchaseOrders acota al tenant del contexto y publica sólo lo mapeado', async () => {
    const row = {
      id: 'id-1',
      tenantId: 'tenantId-v',
      purchaseOrderNumber: 'purchaseOrderNumber-v',
      supplierBusinessPartnerId: 'supplierBusinessPartnerId-v',
      contractId: 'contractId-v',
      purchaseRequisitionId: 'purchaseRequisitionId-v',
      orderingDepartmentId: 'orderingDepartmentId-v',
      buyerEmployeeId: 'buyerEmployeeId-v',
      orderDate: new Date('2026-10-24T10:00:00Z'),
      expectedDeliveryDate: new Date('2026-10-24T10:00:00Z'),
      currencyConceptId: 'currencyConceptId-v',
      paymentTermsConceptId: 'paymentTermsConceptId-v',
      incotermConceptId: 'incotermConceptId-v',
      approvalStatusConceptId: 'approvalStatusConceptId-v',
      statusConceptId: 'statusConceptId-v',
      createdAt: new Date('2026-10-24T10:00:00Z'),
      updatedAt: new Date('2026-10-24T10:00:00Z'),
      createdByUserId: 'createdByUserId-v',
      updatedByUserId: 'updatedByUserId-v',
      rowVersion: 1,
    };
    const { service, findAndCount } = build([row]);
    const page = await runWithTenant('t-1', () =>
      service.listPurchaseOrders(query),
    );
    expect(findAndCount.mock.calls[0]?.[1]).toEqual({ tenantId: 't-1' });
    expect(page.meta.total).toBe(1);
    expect(page.data[0]).not.toHaveProperty('rowVersion');
    expect(page.data[0]).not.toHaveProperty('createdByUserId');
    expect(page.data[0]).toHaveProperty('id', 'id-1');
  });

  it('listPurchaseOrders suma el filtro statusConceptId sin soltar el tenant', async () => {
    const { service, findAndCount } = build();
    await runWithTenant('t-1', () =>
      service.listPurchaseOrders({ ...query, statusConceptId: 'f-1' }),
    );
    const where = findAndCount.mock.calls[0]?.[1] as unknown as {
      $and: unknown[];
    };
    expect(where.$and).toContainEqual({ tenantId: 't-1' });
    expect(where.$and[0]).toMatchObject({ statusConceptId: 'f-1' });
  });

  it('listGoodsReceipts acota al tenant del contexto y publica sólo lo mapeado', async () => {
    const row = {
      id: 'id-1',
      tenantId: 'tenantId-v',
      receiptNumber: 'receiptNumber-v',
      purchaseOrderId: 'purchaseOrderId-v',
      receivingBranchId: 'receivingBranchId-v',
      receivedByEmployeeId: 'receivedByEmployeeId-v',
      receivedAt: new Date('2026-10-24T10:00:00Z'),
      supplierDeliveryReference: 'supplierDeliveryReference-v',
      statusConceptId: 'statusConceptId-v',
      createdAt: new Date('2026-10-24T10:00:00Z'),
      updatedAt: new Date('2026-10-24T10:00:00Z'),
      createdByUserId: 'createdByUserId-v',
      updatedByUserId: 'updatedByUserId-v',
      rowVersion: 1,
    };
    const { service, findAndCount } = build([row]);
    const page = await runWithTenant('t-1', () =>
      service.listGoodsReceipts('id-1', query),
    );
    expect(findAndCount.mock.calls[0]?.[1]).toEqual({
      $and: [{ purchaseOrderId: 'id-1' }, { tenantId: 't-1' }],
    });
    expect(page.meta.total).toBe(1);
    expect(page.data[0]).not.toHaveProperty('rowVersion');
    expect(page.data[0]).not.toHaveProperty('createdByUserId');
    expect(page.data[0]).toHaveProperty('id', 'id-1');
  });

  it('listGoodsReceipts suma el filtro statusConceptId sin soltar el tenant', async () => {
    const { service, findAndCount } = build();
    await runWithTenant('t-1', () =>
      service.listGoodsReceipts('id-1', { ...query, statusConceptId: 'f-1' }),
    );
    const where = findAndCount.mock.calls[0]?.[1] as unknown as {
      $and: unknown[];
    };
    expect(where.$and).toContainEqual({ tenantId: 't-1' });
    expect(where.$and[0]).toMatchObject({ statusConceptId: 'f-1' });
  });

  it('listServiceEntrySheets acota al tenant del contexto y publica sólo lo mapeado', async () => {
    const row = {
      id: 'id-1',
      tenantId: 'tenantId-v',
      sheetNumber: 'sheetNumber-v',
      purchaseOrderId: 'purchaseOrderId-v',
      supplierBusinessPartnerId: 'supplierBusinessPartnerId-v',
      performedFrom: new Date('2026-10-24T10:00:00Z'),
      performedTo: new Date('2026-10-24T10:00:00Z'),
      acceptedByEmployeeId: 'acceptedByEmployeeId-v',
      approvalStatusConceptId: 'approvalStatusConceptId-v',
      statusConceptId: 'statusConceptId-v',
      createdAt: new Date('2026-10-24T10:00:00Z'),
      updatedAt: new Date('2026-10-24T10:00:00Z'),
      createdByUserId: 'createdByUserId-v',
      updatedByUserId: 'updatedByUserId-v',
      rowVersion: 1,
    };
    const { service, findAndCount } = build([row]);
    const page = await runWithTenant('t-1', () =>
      service.listServiceEntrySheets('id-1', query),
    );
    expect(findAndCount.mock.calls[0]?.[1]).toEqual({
      $and: [{ purchaseOrderId: 'id-1' }, { tenantId: 't-1' }],
    });
    expect(page.meta.total).toBe(1);
    expect(page.data[0]).not.toHaveProperty('rowVersion');
    expect(page.data[0]).not.toHaveProperty('createdByUserId');
    expect(page.data[0]).toHaveProperty('id', 'id-1');
  });

  it('listServiceEntrySheets suma el filtro statusConceptId sin soltar el tenant', async () => {
    const { service, findAndCount } = build();
    await runWithTenant('t-1', () =>
      service.listServiceEntrySheets('id-1', {
        ...query,
        statusConceptId: 'f-1',
      }),
    );
    const where = findAndCount.mock.calls[0]?.[1] as unknown as {
      $and: unknown[];
    };
    expect(where.$and).toContainEqual({ tenantId: 't-1' });
    expect(where.$and[0]).toMatchObject({ statusConceptId: 'f-1' });
  });

  it('listSalesOrders acota al tenant del contexto y publica sólo lo mapeado', async () => {
    const row = {
      id: 'id-1',
      tenantId: 'tenantId-v',
      salesOrderNumber: 'salesOrderNumber-v',
      customerBusinessPartnerId: 'customerBusinessPartnerId-v',
      contractId: 'contractId-v',
      opportunityId: 'opportunityId-v',
      orderDate: new Date('2026-10-24T10:00:00Z'),
      requestedServiceDate: new Date('2026-10-24T10:00:00Z'),
      currencyConceptId: 'currencyConceptId-v',
      paymentTermsConceptId: 'paymentTermsConceptId-v',
      ownerEmployeeId: 'ownerEmployeeId-v',
      statusConceptId: 'statusConceptId-v',
      createdAt: new Date('2026-10-24T10:00:00Z'),
      updatedAt: new Date('2026-10-24T10:00:00Z'),
      createdByUserId: 'createdByUserId-v',
      updatedByUserId: 'updatedByUserId-v',
      rowVersion: 1,
    };
    const { service, findAndCount } = build([row]);
    const page = await runWithTenant('t-1', () =>
      service.listSalesOrders(query),
    );
    expect(findAndCount.mock.calls[0]?.[1]).toEqual({ tenantId: 't-1' });
    expect(page.meta.total).toBe(1);
    expect(page.data[0]).not.toHaveProperty('rowVersion');
    expect(page.data[0]).not.toHaveProperty('createdByUserId');
    expect(page.data[0]).toHaveProperty('id', 'id-1');
  });

  it('listSalesOrders suma el filtro statusConceptId sin soltar el tenant', async () => {
    const { service, findAndCount } = build();
    await runWithTenant('t-1', () =>
      service.listSalesOrders({ ...query, statusConceptId: 'f-1' }),
    );
    const where = findAndCount.mock.calls[0]?.[1] as unknown as {
      $and: unknown[];
    };
    expect(where.$and).toContainEqual({ tenantId: 't-1' });
    expect(where.$and[0]).toMatchObject({ statusConceptId: 'f-1' });
  });
});
