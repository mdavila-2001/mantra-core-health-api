import { describe, it, expect, jest } from '@jest/globals';
import { ROLES_KEY } from '../../../common/auth/roles.decorator';
import { WorkflowCollectionsController } from './workflow-collections.controller';

const handlers = WorkflowCollectionsController.prototype as unknown as Record<
  string,
  object
>;

describe('WorkflowCollectionsController', () => {
  it('listInstances exige CLINICIAN, BILLING_AGENT, SCHEDULER, SYSTEM, PLATFORM_ADMIN y delega en el servicio', async () => {
    expect(Reflect.getMetadata(ROLES_KEY, handlers.listInstances)).toEqual([
      'CLINICIAN',
      'BILLING_AGENT',
      'SCHEDULER',
      'SYSTEM',
      'PLATFORM_ADMIN',
    ]);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listInstances: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new WorkflowCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listInstances(query)).resolves.toBe(page);
    expect(service.listInstances).toHaveBeenCalledWith(query);
  });
});
