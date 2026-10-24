import { describe, it, expect, jest } from '@jest/globals';
import { ROLES_KEY } from '../../../common/auth/roles.decorator';
import { PromotionsCollectionsController } from './promotions-collections.controller';

const handlers = PromotionsCollectionsController.prototype as unknown as Record<
  string,
  object
>;

describe('PromotionsCollectionsController', () => {
  it('listPromotions exige PROMOTIONS_ADMIN, MARKETING_MANAGER y delega en el servicio', async () => {
    expect(Reflect.getMetadata(ROLES_KEY, handlers.listPromotions)).toEqual([
      'PROMOTIONS_ADMIN',
      'MARKETING_MANAGER',
    ]);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listPromotions: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new PromotionsCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listPromotions(query)).resolves.toBe(page);
    expect(service.listPromotions).toHaveBeenCalledWith(query);
  });
});
