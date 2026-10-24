import { describe, it, expect, jest } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';
import { runWithTenant } from '../../../common/tenant/tenant-context';
import { PolyglotStorageCollectionsService } from './polyglot-storage-collections.service';

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
    service: new PolyglotStorageCollectionsService(em as any),
    findAndCount,
  };
}

describe('PolyglotStorageCollectionsService', () => {
  it('listStorageCostSnapshots acota al tenant del contexto y publica sólo lo mapeado', async () => {
    const row = {
      id: 'id-1',
      storageBackendRegionId: 'storageBackendRegionId-v',
      tenantId: 'tenantId-v',
      datasetDefinitionId: 'datasetDefinitionId-v',
      periodStart: new Date('2026-10-24T10:00:00Z'),
      periodEnd: new Date('2026-10-24T10:00:00Z'),
      storageBytes: 'storageBytes-v',
      readUnits: 'readUnits-v',
      writeUnits: 'writeUnits-v',
      egressBytes: 'egressBytes-v',
      estimatedCost: 'estimatedCost-v',
      currencyCode: 'currencyCode-v',
      createdAt: new Date('2026-10-24T10:00:00Z'),
    };
    const { service, findAndCount } = build([row]);
    const page = await runWithTenant('t-1', () =>
      service.listStorageCostSnapshots(query),
    );
    expect(findAndCount.mock.calls[0]?.[1]).toEqual({ tenantId: 't-1' });
    expect(page.meta.total).toBe(1);
    expect(page.data[0]).not.toHaveProperty('rowVersion');
    expect(page.data[0]).not.toHaveProperty('createdByUserId');
    expect(page.data[0]).toHaveProperty('id', 'id-1');
  });

  it('listStorageBindings acota al tenant del contexto y publica sólo lo mapeado', async () => {
    const row = {
      id: 'id-1',
      tenantId: 'tenantId-v',
      datasetDefinitionId: 'datasetDefinitionId-v',
      primaryPlacementId: 'primaryPlacementId-v',
      secondaryPlacementId: 'secondaryPlacementId-v',
      tenantPartitionKey: 'tenantPartitionKey-v',
      tenantEncryptionKeyRef: 'tenantEncryptionKeyRef-v',
      state: 'state-v',
      createdAt: new Date('2026-10-24T10:00:00Z'),
      updatedAt: new Date('2026-10-24T10:00:00Z'),
    };
    const { service, findAndCount } = build([row]);
    const page = await runWithTenant('t-1', () =>
      service.listStorageBindings('t-1', query),
    );
    expect(findAndCount.mock.calls[0]?.[1]).toEqual({ tenantId: 't-1' });
    expect(page.meta.total).toBe(1);
    expect(page.data[0]).not.toHaveProperty('rowVersion');
    expect(page.data[0]).not.toHaveProperty('createdByUserId');
    expect(page.data[0]).not.toHaveProperty('tenantEncryptionKeyRef');
    expect(page.data[0]).toHaveProperty('id', 'id-1');
  });

  it('listStorageBindings rechaza un tenant de ruta que no es el del contexto', async () => {
    const { service, findAndCount } = build();
    await expect(
      runWithTenant('t-1', () => service.listStorageBindings('t-2', query)),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(findAndCount).not.toHaveBeenCalled();
  });
});
