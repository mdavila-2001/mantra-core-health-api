import { describe, it, expect, jest } from '@jest/globals';
import { ROLES_KEY } from '../../../common/auth/roles.decorator';
import { ObjectStorageCollectionsController } from './object-storage-collections.controller';

const handlers =
  ObjectStorageCollectionsController.prototype as unknown as Record<
    string,
    object
  >;

describe('ObjectStorageCollectionsController', () => {
  it('listLargePayloads exige SYSTEM, STORAGE_ADMIN y delega en el servicio', async () => {
    expect(Reflect.getMetadata(ROLES_KEY, handlers.listLargePayloads)).toEqual([
      'SYSTEM',
      'STORAGE_ADMIN',
    ]);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listLargePayloads: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new ObjectStorageCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listLargePayloads(query)).resolves.toBe(page);
    expect(service.listLargePayloads).toHaveBeenCalledWith(query);
  });

  it('listUploads exige STORAGE_CLIENT, SYSTEM, STORAGE_ADMIN y delega en el servicio', async () => {
    expect(Reflect.getMetadata(ROLES_KEY, handlers.listUploads)).toEqual([
      'STORAGE_CLIENT',
      'SYSTEM',
      'STORAGE_ADMIN',
    ]);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listUploads: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new ObjectStorageCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listUploads(query)).resolves.toBe(page);
    expect(service.listUploads).toHaveBeenCalledWith(query);
  });
});
