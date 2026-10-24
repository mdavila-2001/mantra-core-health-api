import { describe, it, expect, jest } from '@jest/globals';
import { ROLES_KEY } from '../../../common/auth/roles.decorator';
import { AuthzCollectionsController } from './authz-collections.controller';

const handlers = AuthzCollectionsController.prototype as unknown as Record<
  string,
  object
>;

describe('AuthzCollectionsController', () => {
  it('listClinicalAccessGrants exige CLINICAL_APPROVER, SECURITY_ADMIN y delega en el servicio', async () => {
    expect(
      Reflect.getMetadata(ROLES_KEY, handlers.listClinicalAccessGrants),
    ).toEqual(['CLINICAL_APPROVER', 'SECURITY_ADMIN']);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listClinicalAccessGrants: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new AuthzCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listClinicalAccessGrants(query)).resolves.toBe(
      page,
    );
    expect(service.listClinicalAccessGrants).toHaveBeenCalledWith(query);
  });

  it('listResourceScopeGrants exige SECURITY_ADMIN y delega en el servicio', async () => {
    expect(
      Reflect.getMetadata(ROLES_KEY, handlers.listResourceScopeGrants),
    ).toEqual(['SECURITY_ADMIN']);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listResourceScopeGrants: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new AuthzCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listResourceScopeGrants(query)).resolves.toBe(page);
    expect(service.listResourceScopeGrants).toHaveBeenCalledWith(query);
  });

  it('listAccessPolicies exige SECURITY_ADMIN y delega en el servicio', async () => {
    expect(Reflect.getMetadata(ROLES_KEY, handlers.listAccessPolicies)).toEqual(
      ['SECURITY_ADMIN'],
    );
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listAccessPolicies: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new AuthzCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(
      controller.listAccessPolicies('tenantId-1', query),
    ).resolves.toBe(page);
    expect(service.listAccessPolicies).toHaveBeenCalledWith(
      'tenantId-1',
      query,
    );
  });

  it('listUserPermissionGrants exige SECURITY_ADMIN y delega en el servicio', async () => {
    expect(
      Reflect.getMetadata(ROLES_KEY, handlers.listUserPermissionGrants),
    ).toEqual(['SECURITY_ADMIN']);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listUserPermissionGrants: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new AuthzCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(
      controller.listUserPermissionGrants('userId-1', query),
    ).resolves.toBe(page);
    expect(service.listUserPermissionGrants).toHaveBeenCalledWith(
      'userId-1',
      query,
    );
  });
});
