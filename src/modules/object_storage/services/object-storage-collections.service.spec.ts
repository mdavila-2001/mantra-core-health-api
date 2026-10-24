import { describe, it, expect, jest } from '@jest/globals';
import { runWithTenant } from '../../../common/tenant/tenant-context';
import { ObjectStorageCollectionsService } from './object-storage-collections.service';

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
    service: new ObjectStorageCollectionsService(em as any),
    findAndCount,
  };
}

describe('ObjectStorageCollectionsService', () => {
  it('listLargePayloads acota al tenant del contexto y publica sólo lo mapeado', async () => {
    const row = {
      id: 'id-1',
      tenantId: 'tenantId-v',
      payloadType: 'payloadType-v',
      sourceEntityType: 'sourceEntityType-v',
      sourceEntityId: 'sourceEntityId-v',
      objectManifestId: 'objectManifestId-v',
      contentHash: 'contentHash-v',
      containsPhi: true,
      createdAt: new Date('2026-10-24T10:00:00Z'),
    };
    const { service, findAndCount } = build([row]);
    const page = await runWithTenant('t-1', () =>
      service.listLargePayloads(query),
    );
    expect(findAndCount.mock.calls[0]?.[1]).toEqual({ tenantId: 't-1' });
    expect(page.meta.total).toBe(1);
    expect(page.data[0]).not.toHaveProperty('rowVersion');
    expect(page.data[0]).not.toHaveProperty('createdByUserId');
    expect(page.data[0]).toHaveProperty('id', 'id-1');
  });

  it('listUploads acota al tenant del contexto y publica sólo lo mapeado', async () => {
    const row = {
      id: 'id-1',
      tenantId: 'tenantId-v',
      namespaceId: 'namespaceId-v',
      providerUploadId: 'providerUploadId-v',
      targetObjectKey: 'targetObjectKey-v',
      expectedSizeBytes: 'expectedSizeBytes-v',
      receivedSizeBytes: 'receivedSizeBytes-v',
      status: 'status-v',
      expiresAt: new Date('2026-10-24T10:00:00Z'),
      createdAt: new Date('2026-10-24T10:00:00Z'),
    };
    const { service, findAndCount } = build([row]);
    const page = await runWithTenant('t-1', () => service.listUploads(query));
    expect(findAndCount.mock.calls[0]?.[1]).toEqual({ tenantId: 't-1' });
    expect(page.meta.total).toBe(1);
    expect(page.data[0]).not.toHaveProperty('rowVersion');
    expect(page.data[0]).not.toHaveProperty('createdByUserId');
    expect(page.data[0]).toHaveProperty('id', 'id-1');
  });

  it('listUploads suma el filtro namespaceId sin soltar el tenant', async () => {
    const { service, findAndCount } = build();
    await runWithTenant('t-1', () =>
      service.listUploads({ ...query, namespaceId: 'f-1' }),
    );
    const where = findAndCount.mock.calls[0]?.[1] as unknown as {
      $and: unknown[];
    };
    expect(where.$and).toContainEqual({ tenantId: 't-1' });
    expect(where.$and[0]).toMatchObject({ namespaceId: 'f-1' });
  });
});
