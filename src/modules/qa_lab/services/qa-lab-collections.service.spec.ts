import { describe, it, expect, jest } from '@jest/globals';
import { runWithTenant } from '../../../common/tenant/tenant-context';
import { QaLabCollectionsService } from './qa-lab-collections.service';

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
  return { service: new QaLabCollectionsService(em as any), findAndCount };
}

describe('QaLabCollectionsService', () => {
  it('listSchedules acota al tenant del contexto y publica sólo lo mapeado', async () => {
    const row = {
      id: 'id-1',
      suiteId: 'suiteId-v',
      environmentId: 'environmentId-v',
      tenantId: 'tenantId-v',
      code: 'code-v',
      name: 'name-v',
      cronExpression: 'cronExpression-v',
      timezone: 'timezone-v',
      triggerConceptId: 'triggerConceptId-v',
      concurrencyPolicyConceptId: 'concurrencyPolicyConceptId-v',
      isEnabled: true,
      lastRunId: 'lastRunId-v',
      lastRunAt: new Date('2026-10-24T10:00:00Z'),
      nextRunAt: new Date('2026-10-24T10:00:00Z'),
      notifyChannelConceptId: 'notifyChannelConceptId-v',
      stateConceptId: 'stateConceptId-v',
      createdAt: new Date('2026-10-24T10:00:00Z'),
      updatedAt: new Date('2026-10-24T10:00:00Z'),
      createdByUserId: 'createdByUserId-v',
      updatedByUserId: 'updatedByUserId-v',
      rowVersion: 1,
    };
    const { service, findAndCount } = build([row]);
    const page = await runWithTenant('t-1', () => service.listSchedules(query));
    expect(findAndCount.mock.calls[0]?.[1]).toEqual({ tenantId: 't-1' });
    expect(page.meta.total).toBe(1);
    expect(page.data[0]).not.toHaveProperty('rowVersion');
    expect(page.data[0]).not.toHaveProperty('createdByUserId');
    expect(page.data[0]).toHaveProperty('id', 'id-1');
  });

  it('listSchedules suma el filtro stateConceptId sin soltar el tenant', async () => {
    const { service, findAndCount } = build();
    await runWithTenant('t-1', () =>
      service.listSchedules({ ...query, stateConceptId: 'f-1' }),
    );
    const where = findAndCount.mock.calls[0]?.[1] as unknown as {
      $and: unknown[];
    };
    expect(where.$and).toContainEqual({ tenantId: 't-1' });
    expect(where.$and[0]).toMatchObject({ stateConceptId: 'f-1' });
  });
});
