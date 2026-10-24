import { describe, it, expect, jest } from '@jest/globals';
import { ROLES_KEY } from '../../../common/auth/roles.decorator';
import { GeoCollectionsController } from './geo-collections.controller';

const handlers = GeoCollectionsController.prototype as unknown as Record<
  string,
  object
>;

describe('GeoCollectionsController', () => {
  it('listTrackedSubjects exige SECURITY_ADMIN y delega en el servicio', async () => {
    expect(
      Reflect.getMetadata(ROLES_KEY, handlers.listTrackedSubjects),
    ).toEqual(['SECURITY_ADMIN']);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listTrackedSubjects: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new GeoCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listTrackedSubjects(query)).resolves.toBe(page);
    expect(service.listTrackedSubjects).toHaveBeenCalledWith(query);
  });

  it('listGeofences exige SECURITY_ADMIN y delega en el servicio', async () => {
    expect(Reflect.getMetadata(ROLES_KEY, handlers.listGeofences)).toEqual([
      'SECURITY_ADMIN',
    ]);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listGeofences: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new GeoCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listGeofences(query)).resolves.toBe(page);
    expect(service.listGeofences).toHaveBeenCalledWith(query);
  });
});
