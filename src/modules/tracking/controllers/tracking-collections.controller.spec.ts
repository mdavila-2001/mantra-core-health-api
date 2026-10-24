import { describe, it, expect, jest } from '@jest/globals';
import { ROLES_KEY } from '../../../common/auth/roles.decorator';
import { TrackingCollectionsController } from './tracking-collections.controller';

const handlers = TrackingCollectionsController.prototype as unknown as Record<
  string,
  object
>;

describe('TrackingCollectionsController', () => {
  it('listShipments exige LOGISTICS_OPERATOR, TRACKING_ADMIN y delega en el servicio', async () => {
    expect(Reflect.getMetadata(ROLES_KEY, handlers.listShipments)).toEqual([
      'LOGISTICS_OPERATOR',
      'TRACKING_ADMIN',
    ]);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listShipments: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new TrackingCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listShipments(query)).resolves.toBe(page);
    expect(service.listShipments).toHaveBeenCalledWith(query);
  });

  it('listMilestoneDefinitions exige TRACKING_ADMIN y delega en el servicio', async () => {
    expect(
      Reflect.getMetadata(ROLES_KEY, handlers.listMilestoneDefinitions),
    ).toEqual(['TRACKING_ADMIN']);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listMilestoneDefinitions: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new TrackingCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listMilestoneDefinitions(query)).resolves.toBe(
      page,
    );
    expect(service.listMilestoneDefinitions).toHaveBeenCalledWith(query);
  });

  it('listTrackableSubjects exige TRACKING_ADMIN, LOGISTICS_OPERATOR y delega en el servicio', async () => {
    expect(
      Reflect.getMetadata(ROLES_KEY, handlers.listTrackableSubjects),
    ).toEqual(['TRACKING_ADMIN', 'LOGISTICS_OPERATOR']);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listTrackableSubjects: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new TrackingCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listTrackableSubjects(query)).resolves.toBe(page);
    expect(service.listTrackableSubjects).toHaveBeenCalledWith(query);
  });
});
