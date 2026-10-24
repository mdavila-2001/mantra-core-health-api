import { describe, it, expect, jest } from '@jest/globals';
import { ROLES_KEY } from '../../../common/auth/roles.decorator';
import { VectorRagCollectionsController } from './vector-rag-collections.controller';

const handlers = VectorRagCollectionsController.prototype as unknown as Record<
  string,
  object
>;

describe('VectorRagCollectionsController', () => {
  it('listCollections exige RAG_COLLECTION_ADMIN, PLATFORM_ADMIN y delega en el servicio', async () => {
    expect(Reflect.getMetadata(ROLES_KEY, handlers.listCollections)).toEqual([
      'RAG_COLLECTION_ADMIN',
      'PLATFORM_ADMIN',
    ]);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listCollections: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new VectorRagCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listCollections(query)).resolves.toBe(page);
    expect(service.listCollections).toHaveBeenCalledWith(query);
  });

  it('listCollectionEmbeddingJobs exige RAG_COLLECTION_ADMIN, PLATFORM_ADMIN y delega en el servicio', async () => {
    expect(
      Reflect.getMetadata(ROLES_KEY, handlers.listCollectionEmbeddingJobs),
    ).toEqual(['RAG_COLLECTION_ADMIN', 'PLATFORM_ADMIN']);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listCollectionEmbeddingJobs: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new VectorRagCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(
      controller.listCollectionEmbeddingJobs('id-1', query),
    ).resolves.toBe(page);
    expect(service.listCollectionEmbeddingJobs).toHaveBeenCalledWith(
      'id-1',
      query,
    );
  });

  it('listCollectionReconciliations exige SYSTEM, RECONCILIATION_WORKER, PLATFORM_ADMIN y delega en el servicio', async () => {
    expect(
      Reflect.getMetadata(ROLES_KEY, handlers.listCollectionReconciliations),
    ).toEqual(['SYSTEM', 'RECONCILIATION_WORKER', 'PLATFORM_ADMIN']);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listCollectionReconciliations: jest.fn(
        async (..._args: unknown[]) => page,
      ),
    };
    const controller = new VectorRagCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(
      controller.listCollectionReconciliations('id-1', query),
    ).resolves.toBe(page);
    expect(service.listCollectionReconciliations).toHaveBeenCalledWith(
      'id-1',
      query,
    );
  });

  it('listRagAccessPolicies exige PRIVACY_OFFICER, DPO, PLATFORM_ADMIN y delega en el servicio', async () => {
    expect(
      Reflect.getMetadata(ROLES_KEY, handlers.listRagAccessPolicies),
    ).toEqual(['PRIVACY_OFFICER', 'DPO', 'PLATFORM_ADMIN']);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listRagAccessPolicies: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new VectorRagCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listRagAccessPolicies(query)).resolves.toBe(page);
    expect(service.listRagAccessPolicies).toHaveBeenCalledWith(query);
  });

  it('listDeletionJobs exige PRIVACY_OFFICER, DPO, SYSTEM, PLATFORM_ADMIN y delega en el servicio', async () => {
    expect(Reflect.getMetadata(ROLES_KEY, handlers.listDeletionJobs)).toEqual([
      'PRIVACY_OFFICER',
      'DPO',
      'SYSTEM',
      'PLATFORM_ADMIN',
    ]);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listDeletionJobs: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new VectorRagCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listDeletionJobs(query)).resolves.toBe(page);
    expect(service.listDeletionJobs).toHaveBeenCalledWith(query);
  });

  it('listEmbeddingJobs exige SYSTEM, EMBEDDING_WORKER, PLATFORM_ADMIN y delega en el servicio', async () => {
    expect(Reflect.getMetadata(ROLES_KEY, handlers.listEmbeddingJobs)).toEqual([
      'SYSTEM',
      'EMBEDDING_WORKER',
      'PLATFORM_ADMIN',
    ]);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listEmbeddingJobs: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new VectorRagCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listEmbeddingJobs(query)).resolves.toBe(page);
    expect(service.listEmbeddingJobs).toHaveBeenCalledWith(query);
  });
});
