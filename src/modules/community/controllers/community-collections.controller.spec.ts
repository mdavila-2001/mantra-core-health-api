import { describe, it, expect, jest } from '@jest/globals';
import { ROLES_KEY } from '../../../common/auth/roles.decorator';
import { CommunityCollectionsController } from './community-collections.controller';

const handlers = CommunityCollectionsController.prototype as unknown as Record<
  string,
  object
>;

describe('CommunityCollectionsController', () => {
  it('listPublicProfiles exige SECURITY_ADMIN y delega en el servicio', async () => {
    expect(Reflect.getMetadata(ROLES_KEY, handlers.listPublicProfiles)).toEqual(
      ['SECURITY_ADMIN'],
    );
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listPublicProfiles: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new CommunityCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listPublicProfiles(query)).resolves.toBe(page);
    expect(service.listPublicProfiles).toHaveBeenCalledWith(query);
  });
});
