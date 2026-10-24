import { describe, it, expect, jest } from '@jest/globals';
import { ROLES_KEY } from '../../../common/auth/roles.decorator';
import { MarketingCollectionsController } from './marketing-collections.controller';

const handlers = MarketingCollectionsController.prototype as unknown as Record<
  string,
  object
>;

describe('MarketingCollectionsController', () => {
  it('listJourneys exige MARKETING_MANAGER y delega en el servicio', async () => {
    expect(Reflect.getMetadata(ROLES_KEY, handlers.listJourneys)).toEqual([
      'MARKETING_MANAGER',
    ]);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listJourneys: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new MarketingCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listJourneys(query)).resolves.toBe(page);
    expect(service.listJourneys).toHaveBeenCalledWith(query);
  });

  it('listSegments exige MARKETING_MANAGER y delega en el servicio', async () => {
    expect(Reflect.getMetadata(ROLES_KEY, handlers.listSegments)).toEqual([
      'MARKETING_MANAGER',
    ]);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listSegments: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new MarketingCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listSegments(query)).resolves.toBe(page);
    expect(service.listSegments).toHaveBeenCalledWith(query);
  });

  it('listCampaigns exige MARKETING_MANAGER y delega en el servicio', async () => {
    expect(Reflect.getMetadata(ROLES_KEY, handlers.listCampaigns)).toEqual([
      'MARKETING_MANAGER',
    ]);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listCampaigns: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new MarketingCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listCampaigns(query)).resolves.toBe(page);
    expect(service.listCampaigns).toHaveBeenCalledWith(query);
  });
});
