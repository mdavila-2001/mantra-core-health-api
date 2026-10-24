import { describe, it, expect, jest } from '@jest/globals';
import { ROLES_KEY } from '../../../common/auth/roles.decorator';
import { LakehouseCollectionsController } from './lakehouse-collections.controller';

const handlers = LakehouseCollectionsController.prototype as unknown as Record<
  string,
  object
>;

describe('LakehouseCollectionsController', () => {
  it('listDatasetReleases exige PRINCIPAL_INVESTIGATOR, PLATFORM_ADMIN y delega en el servicio', async () => {
    expect(
      Reflect.getMetadata(ROLES_KEY, handlers.listDatasetReleases),
    ).toEqual(['PRINCIPAL_INVESTIGATOR', 'PLATFORM_ADMIN']);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listDatasetReleases: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new LakehouseCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listDatasetReleases(query)).resolves.toBe(page);
    expect(service.listDatasetReleases).toHaveBeenCalledWith(query);
  });

  it('listDatasets exige DATA_PLATFORM_ENGINEER, PLATFORM_ADMIN y delega en el servicio', async () => {
    expect(Reflect.getMetadata(ROLES_KEY, handlers.listDatasets)).toEqual([
      'DATA_PLATFORM_ENGINEER',
      'PLATFORM_ADMIN',
    ]);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listDatasets: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new LakehouseCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listDatasets(query)).resolves.toBe(page);
    expect(service.listDatasets).toHaveBeenCalledWith(query);
  });

  it('listQualityRuns exige DATA_STEWARD, SYSTEM, PLATFORM_ADMIN y delega en el servicio', async () => {
    expect(Reflect.getMetadata(ROLES_KEY, handlers.listQualityRuns)).toEqual([
      'DATA_STEWARD',
      'SYSTEM',
      'PLATFORM_ADMIN',
    ]);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listQualityRuns: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new LakehouseCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listQualityRuns('id-1', query)).resolves.toBe(page);
    expect(service.listQualityRuns).toHaveBeenCalledWith('id-1', query);
  });

  it('listRuns exige SYSTEM, TRANSFORMATION_WORKER, PLATFORM_ADMIN y delega en el servicio', async () => {
    expect(Reflect.getMetadata(ROLES_KEY, handlers.listRuns)).toEqual([
      'SYSTEM',
      'TRANSFORMATION_WORKER',
      'PLATFORM_ADMIN',
    ]);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = { listRuns: jest.fn(async (..._args: unknown[]) => page) };
    const controller = new LakehouseCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listRuns('defId-1', query)).resolves.toBe(page);
    expect(service.listRuns).toHaveBeenCalledWith('defId-1', query);
  });
});
