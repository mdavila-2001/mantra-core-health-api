import { describe, it, expect, jest } from '@jest/globals';
import { ROLES_KEY } from '../../../common/auth/roles.decorator';
import { QaLabCollectionsController } from './qa-lab-collections.controller';

const handlers = QaLabCollectionsController.prototype as unknown as Record<
  string,
  object
>;

describe('QaLabCollectionsController', () => {
  it('listSchedules exige QA_ADMIN, QA_ENGINEER y delega en el servicio', async () => {
    expect(Reflect.getMetadata(ROLES_KEY, handlers.listSchedules)).toEqual([
      'QA_ADMIN',
      'QA_ENGINEER',
    ]);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listSchedules: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new QaLabCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listSchedules(query)).resolves.toBe(page);
    expect(service.listSchedules).toHaveBeenCalledWith(query);
  });
});
