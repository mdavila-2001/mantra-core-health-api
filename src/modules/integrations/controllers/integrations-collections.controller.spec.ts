import { describe, it, expect, jest } from '@jest/globals';
import { ROLES_KEY } from '../../../common/auth/roles.decorator';
import { IntegrationsCollectionsController } from './integrations-collections.controller';

const handlers =
  IntegrationsCollectionsController.prototype as unknown as Record<
    string,
    object
  >;

describe('IntegrationsCollectionsController', () => {
  it('listConnections exige SECURITY_ADMIN y delega en el servicio', async () => {
    expect(Reflect.getMetadata(ROLES_KEY, handlers.listConnections)).toEqual([
      'SECURITY_ADMIN',
    ]);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listConnections: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new IntegrationsCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listConnections(query)).resolves.toBe(page);
    expect(service.listConnections).toHaveBeenCalledWith(query);
  });

  it('listProviderConnections exige SECURITY_ADMIN y delega en el servicio', async () => {
    expect(
      Reflect.getMetadata(ROLES_KEY, handlers.listProviderConnections),
    ).toEqual(['SECURITY_ADMIN']);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listProviderConnections: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new IntegrationsCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(
      controller.listProviderConnections('id-1', query),
    ).resolves.toBe(page);
    expect(service.listProviderConnections).toHaveBeenCalledWith('id-1', query);
  });

  it('listProviderWebhookSubscriptions exige SECURITY_ADMIN y delega en el servicio', async () => {
    expect(
      Reflect.getMetadata(ROLES_KEY, handlers.listProviderWebhookSubscriptions),
    ).toEqual(['SECURITY_ADMIN']);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listProviderWebhookSubscriptions: jest.fn(
        async (..._args: unknown[]) => page,
      ),
    };
    const controller = new IntegrationsCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(
      controller.listProviderWebhookSubscriptions('id-1', query),
    ).resolves.toBe(page);
    expect(service.listProviderWebhookSubscriptions).toHaveBeenCalledWith(
      'id-1',
      query,
    );
  });
});
