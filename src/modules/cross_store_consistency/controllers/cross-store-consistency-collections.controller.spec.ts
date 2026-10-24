import { describe, it, expect, jest } from '@jest/globals';
import { ROLES_KEY } from '../../../common/auth/roles.decorator';
import { CrossStoreConsistencyCollectionsController } from './cross-store-consistency-collections.controller';

const handlers =
  CrossStoreConsistencyCollectionsController.prototype as unknown as Record<
    string,
    object
  >;

describe('CrossStoreConsistencyCollectionsController', () => {
  it('listDataMovementJobs exige DATA_GOVERNANCE_ADMIN, PLATFORM_ADMIN y delega en el servicio', async () => {
    expect(
      Reflect.getMetadata(ROLES_KEY, handlers.listDataMovementJobs),
    ).toEqual(['DATA_GOVERNANCE_ADMIN', 'PLATFORM_ADMIN']);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listDataMovementJobs: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new CrossStoreConsistencyCollectionsController(
      service as any,
    );
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listDataMovementJobs(query)).resolves.toBe(page);
    expect(service.listDataMovementJobs).toHaveBeenCalledWith(query);
  });

  it('listDeletionRequests exige PRIVACY_OFFICER, DPO, PLATFORM_ADMIN y delega en el servicio', async () => {
    expect(
      Reflect.getMetadata(ROLES_KEY, handlers.listDeletionRequests),
    ).toEqual(['PRIVACY_OFFICER', 'DPO', 'PLATFORM_ADMIN']);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listDeletionRequests: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new CrossStoreConsistencyCollectionsController(
      service as any,
    );
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listDeletionRequests(query)).resolves.toBe(page);
    expect(service.listDeletionRequests).toHaveBeenCalledWith(query);
  });

  it('listDeadLetters exige DATA_GOVERNANCE_ADMIN, PLATFORM_ADMIN y delega en el servicio', async () => {
    expect(Reflect.getMetadata(ROLES_KEY, handlers.listDeadLetters)).toEqual([
      'DATA_GOVERNANCE_ADMIN',
      'PLATFORM_ADMIN',
    ]);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listDeadLetters: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new CrossStoreConsistencyCollectionsController(
      service as any,
    );
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listDeadLetters(query)).resolves.toBe(page);
    expect(service.listDeadLetters).toHaveBeenCalledWith(query);
  });

  it('listRepairJobs exige DATA_GOVERNANCE_ADMIN, SYSTEM, PLATFORM_ADMIN y delega en el servicio', async () => {
    expect(Reflect.getMetadata(ROLES_KEY, handlers.listRepairJobs)).toEqual([
      'DATA_GOVERNANCE_ADMIN',
      'SYSTEM',
      'PLATFORM_ADMIN',
    ]);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listRepairJobs: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new CrossStoreConsistencyCollectionsController(
      service as any,
    );
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listRepairJobs('id-1', query)).resolves.toBe(page);
    expect(service.listRepairJobs).toHaveBeenCalledWith('id-1', query);
  });

  it('listInvalidations exige SYSTEM, MAINTENANCE_WORKER, PLATFORM_ADMIN y delega en el servicio', async () => {
    expect(Reflect.getMetadata(ROLES_KEY, handlers.listInvalidations)).toEqual([
      'SYSTEM',
      'MAINTENANCE_WORKER',
      'PLATFORM_ADMIN',
    ]);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listInvalidations: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new CrossStoreConsistencyCollectionsController(
      service as any,
    );
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listInvalidations(query)).resolves.toBe(page);
    expect(service.listInvalidations).toHaveBeenCalledWith(query);
  });

  it('listWorkerDeletionRequests exige SYSTEM, DELETION_WORKER, PLATFORM_ADMIN y delega en el servicio', async () => {
    expect(
      Reflect.getMetadata(ROLES_KEY, handlers.listWorkerDeletionRequests),
    ).toEqual(['SYSTEM', 'DELETION_WORKER', 'PLATFORM_ADMIN']);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listWorkerDeletionRequests: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new CrossStoreConsistencyCollectionsController(
      service as any,
    );
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listWorkerDeletionRequests(query)).resolves.toBe(
      page,
    );
    expect(service.listWorkerDeletionRequests).toHaveBeenCalledWith(query);
  });

  it('listWorkerDeadLetters exige SYSTEM, PROJECTION_WORKER, PLATFORM_ADMIN y delega en el servicio', async () => {
    expect(
      Reflect.getMetadata(ROLES_KEY, handlers.listWorkerDeadLetters),
    ).toEqual(['SYSTEM', 'PROJECTION_WORKER', 'PLATFORM_ADMIN']);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listWorkerDeadLetters: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new CrossStoreConsistencyCollectionsController(
      service as any,
    );
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listWorkerDeadLetters(query)).resolves.toBe(page);
    expect(service.listWorkerDeadLetters).toHaveBeenCalledWith(query);
  });
});
