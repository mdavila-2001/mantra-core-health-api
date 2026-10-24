import { describe, it, expect, jest } from '@jest/globals';
import { ROLES_KEY } from '../../../common/auth/roles.decorator';
import { SystemOpsCollectionsController } from './system-ops-collections.controller';

const handlers = SystemOpsCollectionsController.prototype as unknown as Record<
  string,
  object
>;

describe('SystemOpsCollectionsController', () => {
  it('listDrafts exige SECURITY_ADMIN y delega en el servicio', async () => {
    expect(Reflect.getMetadata(ROLES_KEY, handlers.listDrafts)).toEqual([
      'SECURITY_ADMIN',
    ]);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listDrafts: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new SystemOpsCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listDrafts(query)).resolves.toBe(page);
    expect(service.listDrafts).toHaveBeenCalledWith(query);
  });

  it('listLegalHolds exige SECURITY_ADMIN y delega en el servicio', async () => {
    expect(Reflect.getMetadata(ROLES_KEY, handlers.listLegalHolds)).toEqual([
      'SECURITY_ADMIN',
    ]);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listLegalHolds: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new SystemOpsCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listLegalHolds(query)).resolves.toBe(page);
    expect(service.listLegalHolds).toHaveBeenCalledWith(query);
  });

  it('listRemediationPlans exige SECURITY_ADMIN y delega en el servicio', async () => {
    expect(
      Reflect.getMetadata(ROLES_KEY, handlers.listRemediationPlans),
    ).toEqual(['SECURITY_ADMIN']);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listRemediationPlans: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new SystemOpsCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listRemediationPlans('id-1', query)).resolves.toBe(
      page,
    );
    expect(service.listRemediationPlans).toHaveBeenCalledWith('id-1', query);
  });

  it('listCrossBorderTransfers exige SECURITY_ADMIN y delega en el servicio', async () => {
    expect(
      Reflect.getMetadata(ROLES_KEY, handlers.listCrossBorderTransfers),
    ).toEqual(['SECURITY_ADMIN']);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listCrossBorderTransfers: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new SystemOpsCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listCrossBorderTransfers(query)).resolves.toBe(
      page,
    );
    expect(service.listCrossBorderTransfers).toHaveBeenCalledWith(query);
  });

  it('listTenantResidencyBindings exige SECURITY_ADMIN y delega en el servicio', async () => {
    expect(
      Reflect.getMetadata(ROLES_KEY, handlers.listTenantResidencyBindings),
    ).toEqual(['SECURITY_ADMIN']);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listTenantResidencyBindings: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new SystemOpsCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listTenantResidencyBindings(query)).resolves.toBe(
      page,
    );
    expect(service.listTenantResidencyBindings).toHaveBeenCalledWith(query);
  });

  it('listWorkloadAssessments exige SECURITY_ADMIN y delega en el servicio', async () => {
    expect(
      Reflect.getMetadata(ROLES_KEY, handlers.listWorkloadAssessments),
    ).toEqual(['SECURITY_ADMIN']);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listWorkloadAssessments: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new SystemOpsCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listWorkloadAssessments(query)).resolves.toBe(page);
    expect(service.listWorkloadAssessments).toHaveBeenCalledWith(query);
  });

  it('listBackupPolicies exige SECURITY_ADMIN y delega en el servicio', async () => {
    expect(Reflect.getMetadata(ROLES_KEY, handlers.listBackupPolicies)).toEqual(
      ['SECURITY_ADMIN'],
    );
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listBackupPolicies: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new SystemOpsCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listBackupPolicies(query)).resolves.toBe(page);
    expect(service.listBackupPolicies).toHaveBeenCalledWith(query);
  });
});
