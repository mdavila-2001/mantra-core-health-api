import { describe, it, expect, jest } from '@jest/globals';
import { ROLES_KEY } from '../../../common/auth/roles.decorator';
import { MessagingCollectionsController } from './messaging-collections.controller';

const handlers = MessagingCollectionsController.prototype as unknown as Record<
  string,
  object
>;

describe('MessagingCollectionsController', () => {
  it('listJobs exige SYSTEM, MESSAGING_ADMIN y delega en el servicio', async () => {
    expect(Reflect.getMetadata(ROLES_KEY, handlers.listJobs)).toEqual([
      'SYSTEM',
      'MESSAGING_ADMIN',
    ]);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = { listJobs: jest.fn(async (..._args: unknown[]) => page) };
    const controller = new MessagingCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listJobs(query)).resolves.toBe(page);
    expect(service.listJobs).toHaveBeenCalledWith(query);
  });
});
