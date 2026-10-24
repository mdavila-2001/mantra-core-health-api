import { describe, it, expect, jest } from '@jest/globals';
import { ROLES_KEY } from '../../../common/auth/roles.decorator';
import { AuthProvidersCollectionsController } from './auth-providers-collections.controller';

const handlers =
  AuthProvidersCollectionsController.prototype as unknown as Record<
    string,
    object
  >;

describe('AuthProvidersCollectionsController', () => {
  it('listIdentityProviders exige IDENTITY_ADMIN y delega en el servicio', async () => {
    expect(
      Reflect.getMetadata(ROLES_KEY, handlers.listIdentityProviders),
    ).toEqual(['IDENTITY_ADMIN']);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listIdentityProviders: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new AuthProvidersCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listIdentityProviders(query)).resolves.toBe(page);
    expect(service.listIdentityProviders).toHaveBeenCalledWith(query);
  });

  it('listProvisioningRules exige IDENTITY_ADMIN y delega en el servicio', async () => {
    expect(
      Reflect.getMetadata(ROLES_KEY, handlers.listProvisioningRules),
    ).toEqual(['IDENTITY_ADMIN']);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listProvisioningRules: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new AuthProvidersCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listProvisioningRules('id-1', query)).resolves.toBe(
      page,
    );
    expect(service.listProvisioningRules).toHaveBeenCalledWith('id-1', query);
  });

  it('listTenantBindings exige IDENTITY_ADMIN y delega en el servicio', async () => {
    expect(Reflect.getMetadata(ROLES_KEY, handlers.listTenantBindings)).toEqual(
      ['IDENTITY_ADMIN'],
    );
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listTenantBindings: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new AuthProvidersCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listTenantBindings(query)).resolves.toBe(page);
    expect(service.listTenantBindings).toHaveBeenCalledWith(query);
  });
});
