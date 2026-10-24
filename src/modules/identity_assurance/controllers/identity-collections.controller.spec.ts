import { describe, it, expect, jest } from '@jest/globals';
import { ROLES_KEY } from '../../../common/auth/roles.decorator';
import { IdentityCollectionsController } from './identity-collections.controller';

const handlers = IdentityCollectionsController.prototype as unknown as Record<
  string,
  object
>;

describe('IdentityCollectionsController', () => {
  it('listAuthorities exige SECURITY_ADMIN y delega en el servicio', async () => {
    expect(Reflect.getMetadata(ROLES_KEY, handlers.listAuthorities)).toEqual([
      'SECURITY_ADMIN',
    ]);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listAuthorities: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new IdentityCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listAuthorities(query)).resolves.toBe(page);
    expect(service.listAuthorities).toHaveBeenCalledWith(query);
  });
});
