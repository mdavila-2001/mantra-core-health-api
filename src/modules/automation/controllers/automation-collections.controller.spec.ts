import { describe, it, expect, jest } from '@jest/globals';
import { ROLES_KEY } from '../../../common/auth/roles.decorator';
import { AutomationCollectionsController } from './automation-collections.controller';

const handlers = AutomationCollectionsController.prototype as unknown as Record<
  string,
  object
>;

describe('AutomationCollectionsController', () => {
  it('listAgents exige AUTOMATION_ENGINEER, PLATFORM_ADMIN y delega en el servicio', async () => {
    expect(Reflect.getMetadata(ROLES_KEY, handlers.listAgents)).toEqual([
      'AUTOMATION_ENGINEER',
      'PLATFORM_ADMIN',
    ]);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listAgents: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new AutomationCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listAgents(query)).resolves.toBe(page);
    expect(service.listAgents).toHaveBeenCalledWith(query);
  });

  it('listTriggers exige AUTOMATION_ENGINEER, PLATFORM_ADMIN y delega en el servicio', async () => {
    expect(Reflect.getMetadata(ROLES_KEY, handlers.listTriggers)).toEqual([
      'AUTOMATION_ENGINEER',
      'PLATFORM_ADMIN',
    ]);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listTriggers: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new AutomationCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listTriggers(query)).resolves.toBe(page);
    expect(service.listTriggers).toHaveBeenCalledWith(query);
  });

  it('listWorkflows exige AUTOMATION_ENGINEER, PLATFORM_ADMIN y delega en el servicio', async () => {
    expect(Reflect.getMetadata(ROLES_KEY, handlers.listWorkflows)).toEqual([
      'AUTOMATION_ENGINEER',
      'PLATFORM_ADMIN',
    ]);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listWorkflows: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new AutomationCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listWorkflows(query)).resolves.toBe(page);
    expect(service.listWorkflows).toHaveBeenCalledWith(query);
  });
});
