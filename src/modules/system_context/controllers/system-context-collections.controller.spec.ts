import { describe, it, expect, jest } from '@jest/globals';
import { ROLES_KEY } from '../../../common/auth/roles.decorator';
import { SystemContextCollectionsController } from './system-context-collections.controller';

const handlers =
  SystemContextCollectionsController.prototype as unknown as Record<
    string,
    object
  >;

describe('SystemContextCollectionsController', () => {
  it('listContexts exige PLATFORM_ADMIN, GOVERNANCE y delega en el servicio', async () => {
    expect(Reflect.getMetadata(ROLES_KEY, handlers.listContexts)).toEqual([
      'PLATFORM_ADMIN',
      'GOVERNANCE',
    ]);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listContexts: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new SystemContextCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listContexts(query)).resolves.toBe(page);
    expect(service.listContexts).toHaveBeenCalledWith(query);
  });

  it('listDynamicEnumDefinitions exige TERMINOLOGY_ENGINEER, PLATFORM_ADMIN y delega en el servicio', async () => {
    expect(
      Reflect.getMetadata(ROLES_KEY, handlers.listDynamicEnumDefinitions),
    ).toEqual(['TERMINOLOGY_ENGINEER', 'PLATFORM_ADMIN']);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listDynamicEnumDefinitions: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new SystemContextCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listDynamicEnumDefinitions(query)).resolves.toBe(
      page,
    );
    expect(service.listDynamicEnumDefinitions).toHaveBeenCalledWith(query);
  });
});
