import { describe, it, expect, jest } from '@jest/globals';
import { runWithTenant } from '../../../common/tenant/tenant-context';
import { OrganizationExtensionsCollectionsService } from './organization-extensions-collections.service';

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
  return {
    service: new OrganizationExtensionsCollectionsService(em as any),
    findAndCount,
  };
}

describe('OrganizationExtensionsCollectionsService', () => {
  it('listFacilityLicenses acota al tenant del contexto y publica sólo lo mapeado', async () => {
    const row = {
      id: 'id-1',
      tenantId: 'tenantId-v',
      practiceSiteId: 'practiceSiteId-v',
      facilityTypeConceptId: 'facilityTypeConceptId-v',
      licenseTypeConceptId: 'licenseTypeConceptId-v',
      licenseNumber: 'licenseNumber-v',
      issuingAuthorityTenantId: 'issuingAuthorityTenantId-v',
      issuingAuthorityName: 'issuingAuthorityName-v',
      jurisdictionConceptId: 'jurisdictionConceptId-v',
      validFrom: new Date('2026-10-24T10:00:00Z'),
      validTo: new Date('2026-10-24T10:00:00Z'),
      evidenceFileId: 'evidenceFileId-v',
      verificationStatusConceptId: 'verificationStatusConceptId-v',
      createdAt: new Date('2026-10-24T10:00:00Z'),
      updatedAt: new Date('2026-10-24T10:00:00Z'),
      createdByUserId: 'createdByUserId-v',
      updatedByUserId: 'updatedByUserId-v',
      rowVersion: 1,
    };
    const { service, findAndCount } = build([row]);
    const page = await runWithTenant('t-1', () =>
      service.listFacilityLicenses(query),
    );
    expect(findAndCount.mock.calls[0]?.[1]).toEqual({ tenantId: 't-1' });
    expect(page.meta.total).toBe(1);
    expect(page.data[0]).not.toHaveProperty('rowVersion');
    expect(page.data[0]).not.toHaveProperty('createdByUserId');
    expect(page.data[0]).toHaveProperty('id', 'id-1');
  });

  it('listFacilityLicenses suma el filtro practiceSiteId sin soltar el tenant', async () => {
    const { service, findAndCount } = build();
    await runWithTenant('t-1', () =>
      service.listFacilityLicenses({ ...query, practiceSiteId: 'f-1' }),
    );
    const where = findAndCount.mock.calls[0]?.[1] as unknown as {
      $and: unknown[];
    };
    expect(where.$and).toContainEqual({ tenantId: 't-1' });
    expect(where.$and[0]).toMatchObject({ practiceSiteId: 'f-1' });
  });

  it('listHospitals acota al tenant del contexto y publica sólo lo mapeado', async () => {
    const row = {
      id: 'id-1',
      tenantId: 'tenantId-v',
      practiceId: 'practiceId-v',
      primaryPracticeSiteId: 'primaryPracticeSiteId-v',
      publicProfileId: 'publicProfileId-v',
      hospitalTypeConceptId: 'hospitalTypeConceptId-v',
      careLevelConceptId: 'careLevelConceptId-v',
      ownershipTypeConceptId: 'ownershipTypeConceptId-v',
      teachingStatusConceptId: 'teachingStatusConceptId-v',
      emergencyCapabilityConceptId: 'emergencyCapabilityConceptId-v',
      licensedBedCapacity: 1,
      operationalBedCapacity: 1,
      statusConceptId: 'statusConceptId-v',
      createdAt: new Date('2026-10-24T10:00:00Z'),
      updatedAt: new Date('2026-10-24T10:00:00Z'),
      createdByUserId: 'createdByUserId-v',
      updatedByUserId: 'updatedByUserId-v',
      rowVersion: 1,
    };
    const { service, findAndCount } = build([row]);
    const page = await runWithTenant('t-1', () => service.listHospitals(query));
    expect(findAndCount.mock.calls[0]?.[1]).toEqual({ tenantId: 't-1' });
    expect(page.meta.total).toBe(1);
    expect(page.data[0]).not.toHaveProperty('rowVersion');
    expect(page.data[0]).not.toHaveProperty('createdByUserId');
    expect(page.data[0]).toHaveProperty('id', 'id-1');
  });

  it('listHospitals suma el filtro statusConceptId sin soltar el tenant', async () => {
    const { service, findAndCount } = build();
    await runWithTenant('t-1', () =>
      service.listHospitals({ ...query, statusConceptId: 'f-1' }),
    );
    const where = findAndCount.mock.calls[0]?.[1] as unknown as {
      $and: unknown[];
    };
    expect(where.$and).toContainEqual({ tenantId: 't-1' });
    expect(where.$and[0]).toMatchObject({ statusConceptId: 'f-1' });
  });

  it('listDataBoundaries acota al tenant del contexto y publica sólo lo mapeado', async () => {
    const row = {
      id: 'id-1',
      tenantId: 'tenantId-v',
      boundaryTypeConceptId: 'boundaryTypeConceptId-v',
      dataControllerTenantId: 'dataControllerTenantId-v',
      dataProcessorTenantId: 'dataProcessorTenantId-v',
      jurisdictionConceptId: 'jurisdictionConceptId-v',
      residencyRegionConceptId: 'residencyRegionConceptId-v',
      allowedPurposeValueSetId: 'allowedPurposeValueSetId-v',
      isolationSchemaName: 'isolationSchemaName-v',
      isolationPolicyVersion: 'isolationPolicyVersion-v',
      statusConceptId: 'statusConceptId-v',
      effectiveFrom: new Date('2026-10-24T10:00:00Z'),
      effectiveTo: new Date('2026-10-24T10:00:00Z'),
      createdAt: new Date('2026-10-24T10:00:00Z'),
      updatedAt: new Date('2026-10-24T10:00:00Z'),
      createdByUserId: 'createdByUserId-v',
      updatedByUserId: 'updatedByUserId-v',
      rowVersion: 1,
    };
    const { service, findAndCount } = build([row]);
    const page = await runWithTenant('t-1', () =>
      service.listDataBoundaries(query),
    );
    expect(findAndCount.mock.calls[0]?.[1]).toEqual({ tenantId: 't-1' });
    expect(page.meta.total).toBe(1);
    expect(page.data[0]).not.toHaveProperty('rowVersion');
    expect(page.data[0]).not.toHaveProperty('createdByUserId');
    expect(page.data[0]).toHaveProperty('id', 'id-1');
  });

  it('listDataBoundaries suma el filtro statusConceptId sin soltar el tenant', async () => {
    const { service, findAndCount } = build();
    await runWithTenant('t-1', () =>
      service.listDataBoundaries({ ...query, statusConceptId: 'f-1' }),
    );
    const where = findAndCount.mock.calls[0]?.[1] as unknown as {
      $and: unknown[];
    };
    expect(where.$and).toContainEqual({ tenantId: 't-1' });
    expect(where.$and[0]).toMatchObject({ statusConceptId: 'f-1' });
  });
});
