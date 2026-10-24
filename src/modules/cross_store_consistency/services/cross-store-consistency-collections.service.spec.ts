import { describe, it, expect, jest } from '@jest/globals';
import { runWithTenant } from '../../../common/tenant/tenant-context';
import { CrossStoreConsistencyCollectionsService } from './cross-store-consistency-collections.service';

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
    service: new CrossStoreConsistencyCollectionsService(em as any),
    findAndCount,
  };
}

describe('CrossStoreConsistencyCollectionsService', () => {
  it('listDataMovementJobs acota al tenant del contexto y publica sólo lo mapeado', async () => {
    const row = {
      id: 'id-1',
      tenantId: 'tenantId-v',
      datasetId: 'datasetId-v',
      sourcePlacementId: 'sourcePlacementId-v',
      targetPlacementId: 'targetPlacementId-v',
      movementMode: 'movementMode-v',
      manifestHash: 'manifestHash-v',
      status: 'status-v',
      startedAt: new Date('2026-10-24T10:00:00Z'),
      completedAt: new Date('2026-10-24T10:00:00Z'),
    };
    const { service, findAndCount } = build([row]);
    const page = await runWithTenant('t-1', () =>
      service.listDataMovementJobs(query),
    );
    expect(findAndCount.mock.calls[0]?.[1]).toEqual({ tenantId: 't-1' });
    expect(page.meta.total).toBe(1);
    expect(page.data[0]).not.toHaveProperty('rowVersion');
    expect(page.data[0]).not.toHaveProperty('createdByUserId');
    expect(page.data[0]).toHaveProperty('id', 'id-1');
  });

  it('listDeletionRequests acota al tenant del contexto y publica sólo lo mapeado', async () => {
    const row = {
      id: 'id-1',
      tenantId: 'tenantId-v',
      subjectType: 'subjectType-v',
      subjectId: 'subjectId-v',
      reasonCode: 'reasonCode-v',
      legalBasisCode: 'legalBasisCode-v',
      requestedByUserId: 'requestedByUserId-v',
      requestedAt: new Date('2026-10-24T10:00:00Z'),
      state: 'state-v',
      dueAt: new Date('2026-10-24T10:00:00Z'),
    };
    const { service, findAndCount } = build([row]);
    const page = await runWithTenant('t-1', () =>
      service.listDeletionRequests(query),
    );
    expect(findAndCount.mock.calls[0]?.[1]).toEqual({ tenantId: 't-1' });
    expect(page.meta.total).toBe(1);
    expect(page.data[0]).not.toHaveProperty('rowVersion');
    expect(page.data[0]).not.toHaveProperty('createdByUserId');
    expect(page.data[0]).toHaveProperty('id', 'id-1');
  });

  it('listDeadLetters acota al tenant del contexto y publica sólo lo mapeado', async () => {
    const row = {
      id: 'id-1',
      projectionDeliveryAttemptId: 'projectionDeliveryAttemptId-v',
      tenantId: 'tenantId-v',
      reasonCode: 'reasonCode-v',
      payloadObjectId: 'payloadObjectId-v',
      state: 'state-v',
      createdAt: new Date('2026-10-24T10:00:00Z'),
      resolvedAt: new Date('2026-10-24T10:00:00Z'),
    };
    const { service, findAndCount } = build([row]);
    const page = await runWithTenant('t-1', () =>
      service.listDeadLetters(query),
    );
    expect(findAndCount.mock.calls[0]?.[1]).toEqual({ tenantId: 't-1' });
    expect(page.meta.total).toBe(1);
    expect(page.data[0]).not.toHaveProperty('rowVersion');
    expect(page.data[0]).not.toHaveProperty('createdByUserId');
    expect(page.data[0]).toHaveProperty('id', 'id-1');
  });

  it('listRepairJobs acota al tenant del contexto y publica sólo lo mapeado', async () => {
    const row = {
      id: 'id-1',
      tenantId: 'tenantId-v',
      projectionDriftEventId: 'projectionDriftEventId-v',
      repairAction: 'repairAction-v',
      idempotencyKey: 'idempotencyKey-v',
      status: 'status-v',
      requestedAt: new Date('2026-10-24T10:00:00Z'),
      completedAt: new Date('2026-10-24T10:00:00Z'),
    };
    const { service, findAndCount } = build([row]);
    const page = await runWithTenant('t-1', () =>
      service.listRepairJobs('id-1', query),
    );
    expect(findAndCount.mock.calls[0]?.[1]).toEqual({
      $and: [{ projectionDriftEventId: 'id-1' }, { tenantId: 't-1' }],
    });
    expect(page.meta.total).toBe(1);
    expect(page.data[0]).not.toHaveProperty('rowVersion');
    expect(page.data[0]).not.toHaveProperty('createdByUserId');
    expect(page.data[0]).not.toHaveProperty('idempotencyKey');
    expect(page.data[0]).toHaveProperty('id', 'id-1');
  });

  it('listInvalidations acota al tenant del contexto y publica sólo lo mapeado', async () => {
    const row = {
      id: 'id-1',
      tenantId: 'tenantId-v',
      datasetId: 'datasetId-v',
      entityId: 'entityId-v',
      entityVersion: 'entityVersion-v',
      cacheScope: 'cacheScope-v',
      status: 'status-v',
      createdAt: new Date('2026-10-24T10:00:00Z'),
      completedAt: new Date('2026-10-24T10:00:00Z'),
    };
    const { service, findAndCount } = build([row]);
    const page = await runWithTenant('t-1', () =>
      service.listInvalidations(query),
    );
    expect(findAndCount.mock.calls[0]?.[1]).toEqual({ tenantId: 't-1' });
    expect(page.meta.total).toBe(1);
    expect(page.data[0]).not.toHaveProperty('rowVersion');
    expect(page.data[0]).not.toHaveProperty('createdByUserId');
    expect(page.data[0]).toHaveProperty('id', 'id-1');
  });

  it('listWorkerDeletionRequests acota al tenant del contexto y publica sólo lo mapeado', async () => {
    const row = {
      id: 'id-1',
      tenantId: 'tenantId-v',
      subjectType: 'subjectType-v',
      subjectId: 'subjectId-v',
      reasonCode: 'reasonCode-v',
      legalBasisCode: 'legalBasisCode-v',
      requestedByUserId: 'requestedByUserId-v',
      requestedAt: new Date('2026-10-24T10:00:00Z'),
      state: 'state-v',
      dueAt: new Date('2026-10-24T10:00:00Z'),
    };
    const { service, findAndCount } = build([row]);
    const page = await runWithTenant('t-1', () =>
      service.listWorkerDeletionRequests(query),
    );
    expect(findAndCount.mock.calls[0]?.[1]).toEqual({ tenantId: 't-1' });
    expect(page.meta.total).toBe(1);
    expect(page.data[0]).not.toHaveProperty('rowVersion');
    expect(page.data[0]).not.toHaveProperty('createdByUserId');
    expect(page.data[0]).toHaveProperty('id', 'id-1');
  });

  it('listWorkerDeadLetters acota al tenant del contexto y publica sólo lo mapeado', async () => {
    const row = {
      id: 'id-1',
      projectionDeliveryAttemptId: 'projectionDeliveryAttemptId-v',
      tenantId: 'tenantId-v',
      reasonCode: 'reasonCode-v',
      payloadObjectId: 'payloadObjectId-v',
      state: 'state-v',
      createdAt: new Date('2026-10-24T10:00:00Z'),
      resolvedAt: new Date('2026-10-24T10:00:00Z'),
    };
    const { service, findAndCount } = build([row]);
    const page = await runWithTenant('t-1', () =>
      service.listWorkerDeadLetters(query),
    );
    expect(findAndCount.mock.calls[0]?.[1]).toEqual({ tenantId: 't-1' });
    expect(page.meta.total).toBe(1);
    expect(page.data[0]).not.toHaveProperty('rowVersion');
    expect(page.data[0]).not.toHaveProperty('createdByUserId');
    expect(page.data[0]).toHaveProperty('id', 'id-1');
  });
});
