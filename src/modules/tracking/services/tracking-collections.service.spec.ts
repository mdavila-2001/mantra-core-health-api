import { describe, it, expect, jest } from '@jest/globals';
import { runWithTenant } from '../../../common/tenant/tenant-context';
import { TrackingCollectionsService } from './tracking-collections.service';

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
  return { service: new TrackingCollectionsService(em as any), findAndCount };
}

describe('TrackingCollectionsService', () => {
  it('listShipments acota al tenant del contexto y publica sólo lo mapeado', async () => {
    const row = {
      id: 'id-1',
      trackableSubjectId: 'trackableSubjectId-v',
      carrierId: 'carrierId-v',
      tenantId: 'tenantId-v',
      shipmentNumber: 'shipmentNumber-v',
      originAddressId: 'originAddressId-v',
      destinationAddressId: 'destinationAddressId-v',
      assignedCourierUserId: 'assignedCourierUserId-v',
      trackedSubjectId: 'trackedSubjectId-v',
      statusConceptId: 'statusConceptId-v',
      dispatchedAt: new Date('2026-10-24T10:00:00Z'),
      estimatedArrivalAt: new Date('2026-10-24T10:00:00Z'),
      deliveredAt: new Date('2026-10-24T10:00:00Z'),
      distanceM: 'distanceM-v',
      temperatureControlled: true,
      createdAt: new Date('2026-10-24T10:00:00Z'),
      updatedAt: new Date('2026-10-24T10:00:00Z'),
      createdByUserId: 'createdByUserId-v',
      updatedByUserId: 'updatedByUserId-v',
      rowVersion: 1,
    };
    const { service, findAndCount } = build([row]);
    const page = await runWithTenant('t-1', () => service.listShipments(query));
    expect(findAndCount.mock.calls[0]?.[1]).toEqual({ tenantId: 't-1' });
    expect(page.meta.total).toBe(1);
    expect(page.data[0]).not.toHaveProperty('rowVersion');
    expect(page.data[0]).not.toHaveProperty('createdByUserId');
    expect(page.data[0]).toHaveProperty('id', 'id-1');
  });

  it('listShipments suma el filtro statusConceptId sin soltar el tenant', async () => {
    const { service, findAndCount } = build();
    await runWithTenant('t-1', () =>
      service.listShipments({ ...query, statusConceptId: 'f-1' }),
    );
    const where = findAndCount.mock.calls[0]?.[1] as unknown as {
      $and: unknown[];
    };
    expect(where.$and).toContainEqual({ tenantId: 't-1' });
    expect(where.$and[0]).toMatchObject({ statusConceptId: 'f-1' });
  });

  it('listMilestoneDefinitions acota al tenant del contexto y publica sólo lo mapeado', async () => {
    const row = {
      id: 'id-1',
      tenantId: 'tenantId-v',
      subjectTypeConceptId: 'subjectTypeConceptId-v',
      code: 'code-v',
      name: 'name-v',
      milestoneStatusConceptId: 'milestoneStatusConceptId-v',
      ordinal: 1,
      isTerminal: true,
      slaMinutes: 1,
      stateConceptId: 'stateConceptId-v',
      createdAt: new Date('2026-10-24T10:00:00Z'),
      updatedAt: new Date('2026-10-24T10:00:00Z'),
      createdByUserId: 'createdByUserId-v',
      updatedByUserId: 'updatedByUserId-v',
      rowVersion: 1,
    };
    const { service, findAndCount } = build([row]);
    const page = await runWithTenant('t-1', () =>
      service.listMilestoneDefinitions(query),
    );
    expect(findAndCount.mock.calls[0]?.[1]).toEqual({ tenantId: 't-1' });
    expect(page.meta.total).toBe(1);
    expect(page.data[0]).not.toHaveProperty('rowVersion');
    expect(page.data[0]).not.toHaveProperty('createdByUserId');
    expect(page.data[0]).toHaveProperty('id', 'id-1');
  });

  it('listMilestoneDefinitions suma el filtro stateConceptId sin soltar el tenant', async () => {
    const { service, findAndCount } = build();
    await runWithTenant('t-1', () =>
      service.listMilestoneDefinitions({ ...query, stateConceptId: 'f-1' }),
    );
    const where = findAndCount.mock.calls[0]?.[1] as unknown as {
      $and: unknown[];
    };
    expect(where.$and).toContainEqual({ tenantId: 't-1' });
    expect(where.$and[0]).toMatchObject({ stateConceptId: 'f-1' });
  });

  it('listTrackableSubjects acota al tenant del contexto y publica sólo lo mapeado', async () => {
    const row = {
      id: 'id-1',
      tenantId: 'tenantId-v',
      subjectTypeConceptId: 'subjectTypeConceptId-v',
      subjectRefType: 'subjectRefType-v',
      subjectRefId: 'subjectRefId-v',
      trackingNumber: 'trackingNumber-v',
      currentStatusConceptId: 'currentStatusConceptId-v',
      currentMilestoneId: 'currentMilestoneId-v',
      priorityConceptId: 'priorityConceptId-v',
      openedAt: new Date('2026-10-24T10:00:00Z'),
      closedAt: new Date('2026-10-24T10:00:00Z'),
      stateConceptId: 'stateConceptId-v',
      createdAt: new Date('2026-10-24T10:00:00Z'),
      updatedAt: new Date('2026-10-24T10:00:00Z'),
      createdByUserId: 'createdByUserId-v',
      updatedByUserId: 'updatedByUserId-v',
      rowVersion: 1,
    };
    const { service, findAndCount } = build([row]);
    const page = await runWithTenant('t-1', () =>
      service.listTrackableSubjects(query),
    );
    expect(findAndCount.mock.calls[0]?.[1]).toEqual({ tenantId: 't-1' });
    expect(page.meta.total).toBe(1);
    expect(page.data[0]).not.toHaveProperty('rowVersion');
    expect(page.data[0]).not.toHaveProperty('createdByUserId');
    expect(page.data[0]).toHaveProperty('id', 'id-1');
  });

  it('listTrackableSubjects suma el filtro stateConceptId sin soltar el tenant', async () => {
    const { service, findAndCount } = build();
    await runWithTenant('t-1', () =>
      service.listTrackableSubjects({ ...query, stateConceptId: 'f-1' }),
    );
    const where = findAndCount.mock.calls[0]?.[1] as unknown as {
      $and: unknown[];
    };
    expect(where.$and).toContainEqual({ tenantId: 't-1' });
    expect(where.$and[0]).toMatchObject({ stateConceptId: 'f-1' });
  });
});
