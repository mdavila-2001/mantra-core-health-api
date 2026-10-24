import { describe, it, expect, jest } from '@jest/globals';
import { ROLES_KEY } from '../../../common/auth/roles.decorator';
import { PolyglotStorageCollectionsController } from './polyglot-storage-collections.controller';

const handlers =
  PolyglotStorageCollectionsController.prototype as unknown as Record<
    string,
    object
  >;

describe('PolyglotStorageCollectionsController', () => {
  it('listStorageCostSnapshots exige SYSTEM, FINOPS_ANALYST, PLATFORM_ADMIN y delega en el servicio', async () => {
    expect(
      Reflect.getMetadata(ROLES_KEY, handlers.listStorageCostSnapshots),
    ).toEqual(['SYSTEM', 'FINOPS_ANALYST', 'PLATFORM_ADMIN']);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listStorageCostSnapshots: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new PolyglotStorageCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listStorageCostSnapshots(query)).resolves.toBe(
      page,
    );
    expect(service.listStorageCostSnapshots).toHaveBeenCalledWith(query);
  });

  it('listStorageBindings exige GOVERNANCE_ADMIN, PLATFORM_ADMIN y delega en el servicio', async () => {
    expect(
      Reflect.getMetadata(ROLES_KEY, handlers.listStorageBindings),
    ).toEqual(['GOVERNANCE_ADMIN', 'PLATFORM_ADMIN']);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listStorageBindings: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new PolyglotStorageCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(
      controller.listStorageBindings('tenantId-1', query),
    ).resolves.toBe(page);
    expect(service.listStorageBindings).toHaveBeenCalledWith(
      'tenantId-1',
      query,
    );
  });
});
