import { describe, it, expect, jest } from '@jest/globals';
import { runWithTenant } from '../../../common/tenant/tenant-context';
import { ConsentCollectionsService } from './consent-collections.service';

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
  return { service: new ConsentCollectionsService(em as any), findAndCount };
}

describe('ConsentCollectionsService', () => {
  it('listConsents acota al tenant del contexto y publica sólo lo mapeado', async () => {
    const row = {
      id: 'id-1',
      patientProfileId: 'patientProfileId-v',
      grantedByUserId: 'grantedByUserId-v',
      grantedByRelatedPersonId: 'grantedByRelatedPersonId-v',
      categoryConceptId: 'categoryConceptId-v',
      processingPurposeId: 'processingPurposeId-v',
      processingLegalBasisId: 'processingLegalBasisId-v',
      statusConceptId: 'statusConceptId-v',
      policyUri: 'policyUri-v',
      policyVersion: 'policyVersion-v',
      tenantId: 'tenantId-v',
      validFrom: new Date('2026-10-24T10:00:00Z'),
      validTo: new Date('2026-10-24T10:00:00Z'),
      withdrawalReasonConceptId: 'withdrawalReasonConceptId-v',
      withdrawnAt: new Date('2026-10-24T10:00:00Z'),
      createdAt: new Date('2026-10-24T10:00:00Z'),
      updatedAt: new Date('2026-10-24T10:00:00Z'),
      createdByUserId: 'createdByUserId-v',
      updatedByUserId: 'updatedByUserId-v',
      rowVersion: 1,
    };
    const { service, findAndCount } = build([row]);
    const page = await runWithTenant('t-1', () => service.listConsents(query));
    expect(findAndCount.mock.calls[0]?.[1]).toEqual({ tenantId: 't-1' });
    expect(page.meta.total).toBe(1);
    expect(page.data[0]).not.toHaveProperty('rowVersion');
    expect(page.data[0]).not.toHaveProperty('createdByUserId');
    expect(page.data[0]).toHaveProperty('id', 'id-1');
  });

  it('listConsents suma el filtro patientProfileId sin soltar el tenant', async () => {
    const { service, findAndCount } = build();
    await runWithTenant('t-1', () =>
      service.listConsents({ ...query, patientProfileId: 'f-1' }),
    );
    const where = findAndCount.mock.calls[0]?.[1] as unknown as {
      $and: unknown[];
    };
    expect(where.$and).toContainEqual({ tenantId: 't-1' });
    expect(where.$and[0]).toMatchObject({ patientProfileId: 'f-1' });
  });

  it('listHipaaAuthorizations acota al tenant del contexto y publica sólo lo mapeado', async () => {
    const row = {
      id: 'id-1',
      patientProfileId: 'patientProfileId-v',
      tenantId: 'tenantId-v',
      processingPurposeId: 'processingPurposeId-v',
      recipientDescription: 'recipientDescription-v',
      informationDescription: 'informationDescription-v',
      expirationTypeConceptId: 'expirationTypeConceptId-v',
      expiresAt: new Date('2026-10-24T10:00:00Z'),
      expirationEventText: 'expirationEventText-v',
      statusConceptId: 'statusConceptId-v',
      signedAt: new Date('2026-10-24T10:00:00Z'),
      revokedAt: new Date('2026-10-24T10:00:00Z'),
      createdAt: new Date('2026-10-24T10:00:00Z'),
      updatedAt: new Date('2026-10-24T10:00:00Z'),
      createdByUserId: 'createdByUserId-v',
      updatedByUserId: 'updatedByUserId-v',
      rowVersion: 1,
    };
    const { service, findAndCount } = build([row]);
    const page = await runWithTenant('t-1', () =>
      service.listHipaaAuthorizations(query),
    );
    expect(findAndCount.mock.calls[0]?.[1]).toEqual({ tenantId: 't-1' });
    expect(page.meta.total).toBe(1);
    expect(page.data[0]).not.toHaveProperty('rowVersion');
    expect(page.data[0]).not.toHaveProperty('createdByUserId');
    expect(page.data[0]).toHaveProperty('id', 'id-1');
  });

  it('listHipaaAuthorizations suma el filtro patientProfileId sin soltar el tenant', async () => {
    const { service, findAndCount } = build();
    await runWithTenant('t-1', () =>
      service.listHipaaAuthorizations({ ...query, patientProfileId: 'f-1' }),
    );
    const where = findAndCount.mock.calls[0]?.[1] as unknown as {
      $and: unknown[];
    };
    expect(where.$and).toContainEqual({ tenantId: 't-1' });
    expect(where.$and[0]).toMatchObject({ patientProfileId: 'f-1' });
  });

  it('listPatientObjections acota al tenant del contexto y publica sólo lo mapeado', async () => {
    const row = {
      id: 'id-1',
      patientProfileId: 'patientProfileId-v',
      tenantId: 'tenantId-v',
      processingPurposeId: 'processingPurposeId-v',
      objectionTypeConceptId: 'objectionTypeConceptId-v',
      reasonText: 'reasonText-v',
      statusConceptId: 'statusConceptId-v',
      raisedAt: new Date('2026-10-24T10:00:00Z'),
      resolvedAt: new Date('2026-10-24T10:00:00Z'),
      resolutionConceptId: 'resolutionConceptId-v',
      createdAt: new Date('2026-10-24T10:00:00Z'),
      updatedAt: new Date('2026-10-24T10:00:00Z'),
      createdByUserId: 'createdByUserId-v',
      updatedByUserId: 'updatedByUserId-v',
      rowVersion: 1,
    };
    const { service, findAndCount } = build([row]);
    const page = await runWithTenant('t-1', () =>
      service.listPatientObjections(query),
    );
    expect(findAndCount.mock.calls[0]?.[1]).toEqual({ tenantId: 't-1' });
    expect(page.meta.total).toBe(1);
    expect(page.data[0]).not.toHaveProperty('rowVersion');
    expect(page.data[0]).not.toHaveProperty('createdByUserId');
    expect(page.data[0]).toHaveProperty('id', 'id-1');
  });

  it('listPatientObjections suma el filtro patientProfileId sin soltar el tenant', async () => {
    const { service, findAndCount } = build();
    await runWithTenant('t-1', () =>
      service.listPatientObjections({ ...query, patientProfileId: 'f-1' }),
    );
    const where = findAndCount.mock.calls[0]?.[1] as unknown as {
      $and: unknown[];
    };
    expect(where.$and).toContainEqual({ tenantId: 't-1' });
    expect(where.$and[0]).toMatchObject({ patientProfileId: 'f-1' });
  });

  it('listPrivacyRestrictions acota al tenant del contexto y publica sólo lo mapeado', async () => {
    const row = {
      id: 'id-1',
      patientProfileId: 'patientProfileId-v',
      tenantId: 'tenantId-v',
      restrictionTypeConceptId: 'restrictionTypeConceptId-v',
      dataClassConceptId: 'dataClassConceptId-v',
      targetActorTypeConceptId: 'targetActorTypeConceptId-v',
      targetActorId: 'targetActorId-v',
      reasonText: 'reasonText-v',
      statusConceptId: 'statusConceptId-v',
      validFrom: new Date('2026-10-24T10:00:00Z'),
      validTo: new Date('2026-10-24T10:00:00Z'),
      createdAt: new Date('2026-10-24T10:00:00Z'),
      updatedAt: new Date('2026-10-24T10:00:00Z'),
      createdByUserId: 'createdByUserId-v',
      updatedByUserId: 'updatedByUserId-v',
      rowVersion: 1,
    };
    const { service, findAndCount } = build([row]);
    const page = await runWithTenant('t-1', () =>
      service.listPrivacyRestrictions(query),
    );
    expect(findAndCount.mock.calls[0]?.[1]).toEqual({ tenantId: 't-1' });
    expect(page.meta.total).toBe(1);
    expect(page.data[0]).not.toHaveProperty('rowVersion');
    expect(page.data[0]).not.toHaveProperty('createdByUserId');
    expect(page.data[0]).toHaveProperty('id', 'id-1');
  });

  it('listPrivacyRestrictions suma el filtro patientProfileId sin soltar el tenant', async () => {
    const { service, findAndCount } = build();
    await runWithTenant('t-1', () =>
      service.listPrivacyRestrictions({ ...query, patientProfileId: 'f-1' }),
    );
    const where = findAndCount.mock.calls[0]?.[1] as unknown as {
      $and: unknown[];
    };
    expect(where.$and).toContainEqual({ tenantId: 't-1' });
    expect(where.$and[0]).toMatchObject({ patientProfileId: 'f-1' });
  });

  it('listProcessingLegalBases acota al tenant del contexto y publica sólo lo mapeado', async () => {
    const row = {
      id: 'id-1',
      tenantId: 'tenantId-v',
      processingPurposeId: 'processingPurposeId-v',
      jurisdictionConceptId: 'jurisdictionConceptId-v',
      generalLegalBasisConceptId: 'generalLegalBasisConceptId-v',
      specialCategoryConditionConceptId: 'specialCategoryConditionConceptId-v',
      policyVersion: 'policyVersion-v',
      legalReferenceUri: 'legalReferenceUri-v',
      validFrom: new Date('2026-10-24T10:00:00Z'),
      validTo: new Date('2026-10-24T10:00:00Z'),
      statusConceptId: 'statusConceptId-v',
      createdAt: new Date('2026-10-24T10:00:00Z'),
      updatedAt: new Date('2026-10-24T10:00:00Z'),
      createdByUserId: 'createdByUserId-v',
      updatedByUserId: 'updatedByUserId-v',
      rowVersion: 1,
    };
    const { service, findAndCount } = build([row]);
    const page = await runWithTenant('t-1', () =>
      service.listProcessingLegalBases(query),
    );
    expect(findAndCount.mock.calls[0]?.[1]).toEqual({ tenantId: 't-1' });
    expect(page.meta.total).toBe(1);
    expect(page.data[0]).not.toHaveProperty('rowVersion');
    expect(page.data[0]).not.toHaveProperty('createdByUserId');
    expect(page.data[0]).toHaveProperty('id', 'id-1');
  });

  it('listProcessingLegalBases suma el filtro processingPurposeId sin soltar el tenant', async () => {
    const { service, findAndCount } = build();
    await runWithTenant('t-1', () =>
      service.listProcessingLegalBases({
        ...query,
        processingPurposeId: 'f-1',
      }),
    );
    const where = findAndCount.mock.calls[0]?.[1] as unknown as {
      $and: unknown[];
    };
    expect(where.$and).toContainEqual({ tenantId: 't-1' });
    expect(where.$and[0]).toMatchObject({ processingPurposeId: 'f-1' });
  });

  it('listTreatmentInformedConsents acota al tenant del contexto y publica sólo lo mapeado', async () => {
    const row = {
      id: 'id-1',
      patientProfileId: 'patientProfileId-v',
      tenantId: 'tenantId-v',
      encounterId: 'encounterId-v',
      procedureCodeConceptId: 'procedureCodeConceptId-v',
      informationVersion: 'informationVersion-v',
      interpreterUserId: 'interpreterUserId-v',
      witnessUserId: 'witnessUserId-v',
      decisionConceptId: 'decisionConceptId-v',
      statusConceptId: 'statusConceptId-v',
      signedAt: new Date('2026-10-24T10:00:00Z'),
      withdrawnAt: new Date('2026-10-24T10:00:00Z'),
      createdAt: new Date('2026-10-24T10:00:00Z'),
      updatedAt: new Date('2026-10-24T10:00:00Z'),
      createdByUserId: 'createdByUserId-v',
      updatedByUserId: 'updatedByUserId-v',
      rowVersion: 1,
    };
    const { service, findAndCount } = build([row]);
    const page = await runWithTenant('t-1', () =>
      service.listTreatmentInformedConsents(query),
    );
    expect(findAndCount.mock.calls[0]?.[1]).toEqual({ tenantId: 't-1' });
    expect(page.meta.total).toBe(1);
    expect(page.data[0]).not.toHaveProperty('rowVersion');
    expect(page.data[0]).not.toHaveProperty('createdByUserId');
    expect(page.data[0]).toHaveProperty('id', 'id-1');
  });

  it('listTreatmentInformedConsents suma el filtro patientProfileId sin soltar el tenant', async () => {
    const { service, findAndCount } = build();
    await runWithTenant('t-1', () =>
      service.listTreatmentInformedConsents({
        ...query,
        patientProfileId: 'f-1',
      }),
    );
    const where = findAndCount.mock.calls[0]?.[1] as unknown as {
      $and: unknown[];
    };
    expect(where.$and).toContainEqual({ tenantId: 't-1' });
    expect(where.$and[0]).toMatchObject({ patientProfileId: 'f-1' });
  });
});
