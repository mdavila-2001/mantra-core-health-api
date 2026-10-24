import { describe, it, expect, jest } from '@jest/globals';
import { ROLES_KEY } from '../../../common/auth/roles.decorator';
import { PlatformOpsCollectionsController } from './platform-ops-collections.controller';

const handlers =
  PlatformOpsCollectionsController.prototype as unknown as Record<
    string,
    object
  >;

describe('PlatformOpsCollectionsController', () => {
  it('listDeployments exige RELEASE_MANAGER, DEPLOY_PIPELINE, PLATFORM_ADMIN y delega en el servicio', async () => {
    expect(Reflect.getMetadata(ROLES_KEY, handlers.listDeployments)).toEqual([
      'RELEASE_MANAGER',
      'DEPLOY_PIPELINE',
      'PLATFORM_ADMIN',
    ]);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listDeployments: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new PlatformOpsCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listDeployments(query)).resolves.toBe(page);
    expect(service.listDeployments).toHaveBeenCalledWith(query);
  });

  it('listArtifacts exige DEPLOY_PIPELINE, RELEASE_MANAGER, PLATFORM_ADMIN y delega en el servicio', async () => {
    expect(Reflect.getMetadata(ROLES_KEY, handlers.listArtifacts)).toEqual([
      'DEPLOY_PIPELINE',
      'RELEASE_MANAGER',
      'PLATFORM_ADMIN',
    ]);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listArtifacts: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new PlatformOpsCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listArtifacts(query)).resolves.toBe(page);
    expect(service.listArtifacts).toHaveBeenCalledWith(query);
  });

  it('listChangeRequests exige RELEASE_MANAGER, PLATFORM_ADMIN y delega en el servicio', async () => {
    expect(Reflect.getMetadata(ROLES_KEY, handlers.listChangeRequests)).toEqual(
      ['RELEASE_MANAGER', 'PLATFORM_ADMIN'],
    );
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listChangeRequests: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new PlatformOpsCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listChangeRequests(query)).resolves.toBe(page);
    expect(service.listChangeRequests).toHaveBeenCalledWith(query);
  });

  it('listIncidents exige INCIDENT_COMMANDER, SRE, PLATFORM_ADMIN y delega en el servicio', async () => {
    expect(Reflect.getMetadata(ROLES_KEY, handlers.listIncidents)).toEqual([
      'INCIDENT_COMMANDER',
      'SRE',
      'PLATFORM_ADMIN',
    ]);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listIncidents: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new PlatformOpsCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listIncidents(query)).resolves.toBe(page);
    expect(service.listIncidents).toHaveBeenCalledWith(query);
  });

  it('listResilienceExercises exige SRE, PLATFORM_ADMIN y delega en el servicio', async () => {
    expect(
      Reflect.getMetadata(ROLES_KEY, handlers.listResilienceExercises),
    ).toEqual(['SRE', 'PLATFORM_ADMIN']);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listResilienceExercises: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new PlatformOpsCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listResilienceExercises(query)).resolves.toBe(page);
    expect(service.listResilienceExercises).toHaveBeenCalledWith(query);
  });
});
