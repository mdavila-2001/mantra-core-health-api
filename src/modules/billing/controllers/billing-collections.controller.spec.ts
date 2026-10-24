import { describe, it, expect, jest } from '@jest/globals';
import { ROLES_KEY } from '../../../common/auth/roles.decorator';
import { BillingCollectionsController } from './billing-collections.controller';

const handlers = BillingCollectionsController.prototype as unknown as Record<
  string,
  object
>;

describe('BillingCollectionsController', () => {
  it('listDocuments exige SECURITY_ADMIN y delega en el servicio', async () => {
    expect(Reflect.getMetadata(ROLES_KEY, handlers.listDocuments)).toEqual([
      'SECURITY_ADMIN',
    ]);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listDocuments: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new BillingCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listDocuments(query)).resolves.toBe(page);
    expect(service.listDocuments).toHaveBeenCalledWith(query);
  });
});
