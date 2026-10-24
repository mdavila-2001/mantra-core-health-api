import { describe, it, expect, jest } from '@jest/globals';
import { ROLES_KEY } from '../../../common/auth/roles.decorator';
import { AccountingCollectionsController } from './accounting-collections.controller';

const handlers = AccountingCollectionsController.prototype as unknown as Record<
  string,
  object
>;

describe('AccountingCollectionsController', () => {
  it('listClearingDocuments exige SECURITY_ADMIN y delega en el servicio', async () => {
    expect(
      Reflect.getMetadata(ROLES_KEY, handlers.listClearingDocuments),
    ).toEqual(['SECURITY_ADMIN']);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listClearingDocuments: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new AccountingCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listClearingDocuments(query)).resolves.toBe(page);
    expect(service.listClearingDocuments).toHaveBeenCalledWith(query);
  });
});
