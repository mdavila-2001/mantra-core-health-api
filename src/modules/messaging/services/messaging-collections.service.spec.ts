import { describe, it, expect, jest } from '@jest/globals';
import { runWithTenant } from '../../../common/tenant/tenant-context';
import { MessagingCollectionsService } from './messaging-collections.service';

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
  return { service: new MessagingCollectionsService(em as any), findAndCount };
}

describe('MessagingCollectionsService', () => {
  it('listJobs acota al tenant del contexto y publica sólo lo mapeado', async () => {
    const row = {
      id: 'id-1',
      queueId: 'queueId-v',
      tenantId: 'tenantId-v',
      jobType: 'jobType-v',
      dedupeKey: 'dedupeKey-v',
      priority: 1,
      payloadJson: {},
      statusConceptId: 'statusConceptId-v',
      availableAt: new Date('2026-10-24T10:00:00Z'),
      startedAt: new Date('2026-10-24T10:00:00Z'),
      completedAt: new Date('2026-10-24T10:00:00Z'),
      attempts: 1,
      maxAttempts: 1,
      lockedBy: 'lockedBy-v',
      lockExpiresAt: new Date('2026-10-24T10:00:00Z'),
      lastErrorText: 'lastErrorText-v',
      resultJson: {},
      createdAt: new Date('2026-10-24T10:00:00Z'),
      updatedAt: new Date('2026-10-24T10:00:00Z'),
      createdByUserId: 'createdByUserId-v',
      updatedByUserId: 'updatedByUserId-v',
      rowVersion: 1,
    };
    const { service, findAndCount } = build([row]);
    const page = await runWithTenant('t-1', () => service.listJobs(query));
    expect(findAndCount.mock.calls[0]?.[1]).toEqual({ tenantId: 't-1' });
    expect(page.meta.total).toBe(1);
    expect(page.data[0]).not.toHaveProperty('rowVersion');
    expect(page.data[0]).not.toHaveProperty('createdByUserId');
    expect(page.data[0]).not.toHaveProperty('payloadJson');
    expect(page.data[0]).not.toHaveProperty('resultJson');
    expect(page.data[0]).not.toHaveProperty('lastErrorText');
    expect(page.data[0]).toHaveProperty('id', 'id-1');
  });

  it('listJobs suma el filtro queueId sin soltar el tenant', async () => {
    const { service, findAndCount } = build();
    await runWithTenant('t-1', () =>
      service.listJobs({ ...query, queueId: 'f-1' }),
    );
    const where = findAndCount.mock.calls[0]?.[1] as unknown as {
      $and: unknown[];
    };
    expect(where.$and).toContainEqual({ tenantId: 't-1' });
    expect(where.$and[0]).toMatchObject({ queueId: 'f-1' });
  });
});
