import { describe, it, expect, jest } from '@jest/globals';
import { runWithTenant } from '../../../common/tenant/tenant-context';
import { CrmCollectionsService } from './crm-collections.service';

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
  return { service: new CrmCollectionsService(em as any), findAndCount };
}

describe('CrmCollectionsService', () => {
  it('listLeads acota al tenant del contexto y publica sólo lo mapeado', async () => {
    const row = {
      id: 'id-1',
      tenantId: 'tenantId-v',
      leadSourceConceptId: 'leadSourceConceptId-v',
      contactId: 'contactId-v',
      crmAccountId: 'crmAccountId-v',
      fullName: 'fullName-v',
      email: 'email-v',
      phone: 'phone-v',
      interestText: 'interestText-v',
      leadScore: 'leadScore-v',
      leadStatusConceptId: 'leadStatusConceptId-v',
      ownerUserId: 'ownerUserId-v',
      campaignRefId: 'campaignRefId-v',
      convertedOpportunityId: 'convertedOpportunityId-v',
      convertedAt: new Date('2026-10-24T10:00:00Z'),
      statusConceptId: 'statusConceptId-v',
      createdAt: new Date('2026-10-24T10:00:00Z'),
      updatedAt: new Date('2026-10-24T10:00:00Z'),
      createdByUserId: 'createdByUserId-v',
      updatedByUserId: 'updatedByUserId-v',
      rowVersion: 1,
    };
    const { service, findAndCount } = build([row]);
    const page = await runWithTenant('t-1', () => service.listLeads(query));
    expect(findAndCount.mock.calls[0]?.[1]).toEqual({ tenantId: 't-1' });
    expect(page.meta.total).toBe(1);
    expect(page.data[0]).not.toHaveProperty('rowVersion');
    expect(page.data[0]).not.toHaveProperty('createdByUserId');
    expect(page.data[0]).toHaveProperty('id', 'id-1');
  });

  it('listLeads suma el filtro statusConceptId sin soltar el tenant', async () => {
    const { service, findAndCount } = build();
    await runWithTenant('t-1', () =>
      service.listLeads({ ...query, statusConceptId: 'f-1' }),
    );
    const where = findAndCount.mock.calls[0]?.[1] as unknown as {
      $and: unknown[];
    };
    expect(where.$and).toContainEqual({ tenantId: 't-1' });
    expect(where.$and[0]).toMatchObject({ statusConceptId: 'f-1' });
  });

  it('listOpportunities acota al tenant del contexto y publica sólo lo mapeado', async () => {
    const row = {
      id: 'id-1',
      tenantId: 'tenantId-v',
      pipelineId: 'pipelineId-v',
      stageId: 'stageId-v',
      name: 'name-v',
      crmAccountId: 'crmAccountId-v',
      primaryContactId: 'primaryContactId-v',
      amount: 'amount-v',
      currencyConceptId: 'currencyConceptId-v',
      expectedCloseDate: new Date('2026-10-24T10:00:00Z'),
      probabilityPercent: 'probabilityPercent-v',
      ownerUserId: 'ownerUserId-v',
      contractId: 'contractId-v',
      salesOrderId: 'salesOrderId-v',
      lostReasonConceptId: 'lostReasonConceptId-v',
      wonAt: new Date('2026-10-24T10:00:00Z'),
      statusConceptId: 'statusConceptId-v',
      createdAt: new Date('2026-10-24T10:00:00Z'),
      updatedAt: new Date('2026-10-24T10:00:00Z'),
      createdByUserId: 'createdByUserId-v',
      updatedByUserId: 'updatedByUserId-v',
      rowVersion: 1,
    };
    const { service, findAndCount } = build([row]);
    const page = await runWithTenant('t-1', () =>
      service.listOpportunities(query),
    );
    expect(findAndCount.mock.calls[0]?.[1]).toEqual({ tenantId: 't-1' });
    expect(page.meta.total).toBe(1);
    expect(page.data[0]).not.toHaveProperty('rowVersion');
    expect(page.data[0]).not.toHaveProperty('createdByUserId');
    expect(page.data[0]).toHaveProperty('id', 'id-1');
  });

  it('listOpportunities suma el filtro statusConceptId sin soltar el tenant', async () => {
    const { service, findAndCount } = build();
    await runWithTenant('t-1', () =>
      service.listOpportunities({ ...query, statusConceptId: 'f-1' }),
    );
    const where = findAndCount.mock.calls[0]?.[1] as unknown as {
      $and: unknown[];
    };
    expect(where.$and).toContainEqual({ tenantId: 't-1' });
    expect(where.$and[0]).toMatchObject({ statusConceptId: 'f-1' });
  });

  it('listCases acota al tenant del contexto y publica sólo lo mapeado', async () => {
    const row = {
      id: 'id-1',
      tenantId: 'tenantId-v',
      caseNumber: 'caseNumber-v',
      subject: 'subject-v',
      description: 'description-v',
      crmAccountId: 'crmAccountId-v',
      primaryContactId: 'primaryContactId-v',
      businessPartnerId: 'businessPartnerId-v',
      contractId: 'contractId-v',
      invoiceId: 'invoiceId-v',
      caseTypeConceptId: 'caseTypeConceptId-v',
      originConceptId: 'originConceptId-v',
      priorityConceptId: 'priorityConceptId-v',
      ownerUserId: 'ownerUserId-v',
      parentCaseId: 'parentCaseId-v',
      openedAt: new Date('2026-10-24T10:00:00Z'),
      closedAt: new Date('2026-10-24T10:00:00Z'),
      statusConceptId: 'statusConceptId-v',
      createdAt: new Date('2026-10-24T10:00:00Z'),
      updatedAt: new Date('2026-10-24T10:00:00Z'),
      createdByUserId: 'createdByUserId-v',
      updatedByUserId: 'updatedByUserId-v',
      rowVersion: 1,
    };
    const { service, findAndCount } = build([row]);
    const page = await runWithTenant('t-1', () => service.listCases(query));
    expect(findAndCount.mock.calls[0]?.[1]).toEqual({ tenantId: 't-1' });
    expect(page.meta.total).toBe(1);
    expect(page.data[0]).not.toHaveProperty('rowVersion');
    expect(page.data[0]).not.toHaveProperty('createdByUserId');
    expect(page.data[0]).toHaveProperty('id', 'id-1');
  });

  it('listCases suma el filtro statusConceptId sin soltar el tenant', async () => {
    const { service, findAndCount } = build();
    await runWithTenant('t-1', () =>
      service.listCases({ ...query, statusConceptId: 'f-1' }),
    );
    const where = findAndCount.mock.calls[0]?.[1] as unknown as {
      $and: unknown[];
    };
    expect(where.$and).toContainEqual({ tenantId: 't-1' });
    expect(where.$and[0]).toMatchObject({ statusConceptId: 'f-1' });
  });

  it('listAccounts acota al tenant del contexto y publica sólo lo mapeado', async () => {
    const row = {
      id: 'id-1',
      tenantId: 'tenantId-v',
      name: 'name-v',
      accountTypeConceptId: 'accountTypeConceptId-v',
      industryConceptId: 'industryConceptId-v',
      parentAccountId: 'parentAccountId-v',
      website: 'website-v',
      taxId: 'taxId-v',
      linkedTenantId: 'linkedTenantId-v',
      businessPartnerId: 'businessPartnerId-v',
      linkedOrgRefType: 'linkedOrgRefType-v',
      linkedOrgRefId: 'linkedOrgRefId-v',
      ownerUserId: 'ownerUserId-v',
      annualValue: 'annualValue-v',
      currencyConceptId: 'currencyConceptId-v',
      statusConceptId: 'statusConceptId-v',
      createdAt: new Date('2026-10-24T10:00:00Z'),
      updatedAt: new Date('2026-10-24T10:00:00Z'),
      createdByUserId: 'createdByUserId-v',
      updatedByUserId: 'updatedByUserId-v',
      rowVersion: 1,
    };
    const { service, findAndCount } = build([row]);
    const page = await runWithTenant('t-1', () => service.listAccounts(query));
    expect(findAndCount.mock.calls[0]?.[1]).toEqual({ tenantId: 't-1' });
    expect(page.meta.total).toBe(1);
    expect(page.data[0]).not.toHaveProperty('rowVersion');
    expect(page.data[0]).not.toHaveProperty('createdByUserId');
    expect(page.data[0]).toHaveProperty('id', 'id-1');
  });

  it('listAccounts suma el filtro statusConceptId sin soltar el tenant', async () => {
    const { service, findAndCount } = build();
    await runWithTenant('t-1', () =>
      service.listAccounts({ ...query, statusConceptId: 'f-1' }),
    );
    const where = findAndCount.mock.calls[0]?.[1] as unknown as {
      $and: unknown[];
    };
    expect(where.$and).toContainEqual({ tenantId: 't-1' });
    expect(where.$and[0]).toMatchObject({ statusConceptId: 'f-1' });
  });

  it('listActivities acota al tenant del contexto y publica sólo lo mapeado', async () => {
    const row = {
      id: 'id-1',
      tenantId: 'tenantId-v',
      activityTypeConceptId: 'activityTypeConceptId-v',
      subjectTypeConceptId: 'subjectTypeConceptId-v',
      subjectRefId: 'subjectRefId-v',
      contactId: 'contactId-v',
      crmAccountId: 'crmAccountId-v',
      directionConceptId: 'directionConceptId-v',
      subject: 'subject-v',
      bodyText: 'bodyText-v',
      outcomeConceptId: 'outcomeConceptId-v',
      dueAt: new Date('2026-10-24T10:00:00Z'),
      completedAt: new Date('2026-10-24T10:00:00Z'),
      ownerUserId: 'ownerUserId-v',
      statusConceptId: 'statusConceptId-v',
      createdAt: new Date('2026-10-24T10:00:00Z'),
      updatedAt: new Date('2026-10-24T10:00:00Z'),
      createdByUserId: 'createdByUserId-v',
      updatedByUserId: 'updatedByUserId-v',
      rowVersion: 1,
    };
    const { service, findAndCount } = build([row]);
    const page = await runWithTenant('t-1', () =>
      service.listActivities(query),
    );
    expect(findAndCount.mock.calls[0]?.[1]).toEqual({ tenantId: 't-1' });
    expect(page.meta.total).toBe(1);
    expect(page.data[0]).not.toHaveProperty('rowVersion');
    expect(page.data[0]).not.toHaveProperty('createdByUserId');
    expect(page.data[0]).toHaveProperty('id', 'id-1');
  });

  it('listActivities suma el filtro statusConceptId sin soltar el tenant', async () => {
    const { service, findAndCount } = build();
    await runWithTenant('t-1', () =>
      service.listActivities({ ...query, statusConceptId: 'f-1' }),
    );
    const where = findAndCount.mock.calls[0]?.[1] as unknown as {
      $and: unknown[];
    };
    expect(where.$and).toContainEqual({ tenantId: 't-1' });
    expect(where.$and[0]).toMatchObject({ statusConceptId: 'f-1' });
  });

  it('listPartnerships acota al tenant del contexto y publica sólo lo mapeado', async () => {
    const row = {
      id: 'id-1',
      tenantId: 'tenantId-v',
      name: 'name-v',
      partnershipTypeConceptId: 'partnershipTypeConceptId-v',
      partnerRefType: 'partnerRefType-v',
      partnerRefId: 'partnerRefId-v',
      crmAccountId: 'crmAccountId-v',
      adPartnerId: 'adPartnerId-v',
      contractId: 'contractId-v',
      tierConceptId: 'tierConceptId-v',
      revenueSharePercent: 'revenueSharePercent-v',
      startDate: new Date('2026-10-24T10:00:00Z'),
      endDate: new Date('2026-10-24T10:00:00Z'),
      ownerUserId: 'ownerUserId-v',
      statusConceptId: 'statusConceptId-v',
      createdAt: new Date('2026-10-24T10:00:00Z'),
      updatedAt: new Date('2026-10-24T10:00:00Z'),
      createdByUserId: 'createdByUserId-v',
      updatedByUserId: 'updatedByUserId-v',
      rowVersion: 1,
    };
    const { service, findAndCount } = build([row]);
    const page = await runWithTenant('t-1', () =>
      service.listPartnerships(query),
    );
    expect(findAndCount.mock.calls[0]?.[1]).toEqual({ tenantId: 't-1' });
    expect(page.meta.total).toBe(1);
    expect(page.data[0]).not.toHaveProperty('rowVersion');
    expect(page.data[0]).not.toHaveProperty('createdByUserId');
    expect(page.data[0]).toHaveProperty('id', 'id-1');
  });

  it('listPartnerships suma el filtro statusConceptId sin soltar el tenant', async () => {
    const { service, findAndCount } = build();
    await runWithTenant('t-1', () =>
      service.listPartnerships({ ...query, statusConceptId: 'f-1' }),
    );
    const where = findAndCount.mock.calls[0]?.[1] as unknown as {
      $and: unknown[];
    };
    expect(where.$and).toContainEqual({ tenantId: 't-1' });
    expect(where.$and[0]).toMatchObject({ statusConceptId: 'f-1' });
  });
});
