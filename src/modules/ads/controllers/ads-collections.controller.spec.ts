import { describe, it, expect, jest } from '@jest/globals';
import { ROLES_KEY } from '../../../common/auth/roles.decorator';
import { AdsCollectionsController } from './ads-collections.controller';

const handlers = AdsCollectionsController.prototype as unknown as Record<
  string,
  object
>;

describe('AdsCollectionsController', () => {
  it('listEventDataPolicies exige DATA_PRIVACY_OFFICER, ADS_ADMIN y delega en el servicio', async () => {
    expect(
      Reflect.getMetadata(ROLES_KEY, handlers.listEventDataPolicies),
    ).toEqual(['DATA_PRIVACY_OFFICER', 'ADS_ADMIN']);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listEventDataPolicies: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new AdsCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listEventDataPolicies(query)).resolves.toBe(page);
    expect(service.listEventDataPolicies).toHaveBeenCalledWith(query);
  });

  it('listPlatformConnections exige ADS_ADMIN, BUSINESS_ADMIN y delega en el servicio', async () => {
    expect(
      Reflect.getMetadata(ROLES_KEY, handlers.listPlatformConnections),
    ).toEqual(['ADS_ADMIN', 'BUSINESS_ADMIN']);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listPlatformConnections: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new AdsCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listPlatformConnections(query)).resolves.toBe(page);
    expect(service.listPlatformConnections).toHaveBeenCalledWith(query);
  });
});
