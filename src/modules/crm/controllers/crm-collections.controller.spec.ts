import { describe, it, expect, jest } from '@jest/globals';
import { ROLES_KEY } from '../../../common/auth/roles.decorator';
import { CrmCollectionsController } from './crm-collections.controller';

const handlers = CrmCollectionsController.prototype as unknown as Record<
  string,
  object
>;

describe('CrmCollectionsController', () => {
  it('listLeads exige CRM_ADMIN, CRM_AGENT y delega en el servicio', async () => {
    expect(Reflect.getMetadata(ROLES_KEY, handlers.listLeads)).toEqual([
      'CRM_ADMIN',
      'CRM_AGENT',
    ]);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = { listLeads: jest.fn(async (..._args: unknown[]) => page) };
    const controller = new CrmCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listLeads(query)).resolves.toBe(page);
    expect(service.listLeads).toHaveBeenCalledWith(query);
  });

  it('listOpportunities exige CRM_ADMIN, CRM_AGENT y delega en el servicio', async () => {
    expect(Reflect.getMetadata(ROLES_KEY, handlers.listOpportunities)).toEqual([
      'CRM_ADMIN',
      'CRM_AGENT',
    ]);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listOpportunities: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new CrmCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listOpportunities(query)).resolves.toBe(page);
    expect(service.listOpportunities).toHaveBeenCalledWith(query);
  });

  it('listCases exige CRM_ADMIN, CRM_AGENT y delega en el servicio', async () => {
    expect(Reflect.getMetadata(ROLES_KEY, handlers.listCases)).toEqual([
      'CRM_ADMIN',
      'CRM_AGENT',
    ]);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = { listCases: jest.fn(async (..._args: unknown[]) => page) };
    const controller = new CrmCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listCases(query)).resolves.toBe(page);
    expect(service.listCases).toHaveBeenCalledWith(query);
  });

  it('listAccounts exige CRM_ADMIN, CRM_AGENT y delega en el servicio', async () => {
    expect(Reflect.getMetadata(ROLES_KEY, handlers.listAccounts)).toEqual([
      'CRM_ADMIN',
      'CRM_AGENT',
    ]);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listAccounts: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new CrmCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listAccounts(query)).resolves.toBe(page);
    expect(service.listAccounts).toHaveBeenCalledWith(query);
  });

  it('listActivities exige CRM_ADMIN, CRM_AGENT y delega en el servicio', async () => {
    expect(Reflect.getMetadata(ROLES_KEY, handlers.listActivities)).toEqual([
      'CRM_ADMIN',
      'CRM_AGENT',
    ]);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listActivities: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new CrmCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listActivities(query)).resolves.toBe(page);
    expect(service.listActivities).toHaveBeenCalledWith(query);
  });

  it('listPartnerships exige CRM_ADMIN y delega en el servicio', async () => {
    expect(Reflect.getMetadata(ROLES_KEY, handlers.listPartnerships)).toEqual([
      'CRM_ADMIN',
    ]);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listPartnerships: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new CrmCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listPartnerships(query)).resolves.toBe(page);
    expect(service.listPartnerships).toHaveBeenCalledWith(query);
  });
});
