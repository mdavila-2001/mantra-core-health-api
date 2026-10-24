import { describe, it, expect, jest } from '@jest/globals';
import { ROLES_KEY } from '../../../common/auth/roles.decorator';
import { GraphIntelligenceCollectionsController } from './graph-intelligence-collections.controller';

const handlers =
  GraphIntelligenceCollectionsController.prototype as unknown as Record<
    string,
    object
  >;

describe('GraphIntelligenceCollectionsController', () => {
  it('listAccessScopes exige DATA_GOVERNANCE_ADMIN, COMPLIANCE_OFFICER, PLATFORM_ADMIN y delega en el servicio', async () => {
    expect(Reflect.getMetadata(ROLES_KEY, handlers.listAccessScopes)).toEqual([
      'DATA_GOVERNANCE_ADMIN',
      'COMPLIANCE_OFFICER',
      'PLATFORM_ADMIN',
    ]);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listAccessScopes: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new GraphIntelligenceCollectionsController(
      service as any,
    );
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listAccessScopes(query)).resolves.toBe(page);
    expect(service.listAccessScopes).toHaveBeenCalledWith(query);
  });

  it('listDeletionJobs exige DATA_GOVERNANCE_ADMIN, SYSTEM, PLATFORM_ADMIN y delega en el servicio', async () => {
    expect(Reflect.getMetadata(ROLES_KEY, handlers.listDeletionJobs)).toEqual([
      'DATA_GOVERNANCE_ADMIN',
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
    const controller = new GraphIntelligenceCollectionsController(
      service as any,
    );
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listDeletionJobs(query)).resolves.toBe(page);
    expect(service.listDeletionJobs).toHaveBeenCalledWith(query);
  });

  it('listDefinitionRuns exige SYSTEM, GRAPH_ANALYST, PLATFORM_ADMIN y delega en el servicio', async () => {
    expect(Reflect.getMetadata(ROLES_KEY, handlers.listDefinitionRuns)).toEqual(
      ['SYSTEM', 'GRAPH_ANALYST', 'PLATFORM_ADMIN'],
    );
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listDefinitionRuns: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new GraphIntelligenceCollectionsController(
      service as any,
    );
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listDefinitionRuns('id-1', query)).resolves.toBe(
      page,
    );
    expect(service.listDefinitionRuns).toHaveBeenCalledWith('id-1', query);
  });

  it('listProjectionRuns exige SYSTEM, GRAPH_PROJECTION_WORKER, PLATFORM_ADMIN y delega en el servicio', async () => {
    expect(Reflect.getMetadata(ROLES_KEY, handlers.listProjectionRuns)).toEqual(
      ['SYSTEM', 'GRAPH_PROJECTION_WORKER', 'PLATFORM_ADMIN'],
    );
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listProjectionRuns: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new GraphIntelligenceCollectionsController(
      service as any,
    );
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listProjectionRuns(query)).resolves.toBe(page);
    expect(service.listProjectionRuns).toHaveBeenCalledWith(query);
  });

  it('listRuleHits exige COMPLIANCE_OFFICER, GRAPH_ANALYST, PLATFORM_ADMIN y delega en el servicio', async () => {
    expect(Reflect.getMetadata(ROLES_KEY, handlers.listRuleHits)).toEqual([
      'COMPLIANCE_OFFICER',
      'GRAPH_ANALYST',
      'PLATFORM_ADMIN',
    ]);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listRuleHits: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new GraphIntelligenceCollectionsController(
      service as any,
    );
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listRuleHits(query)).resolves.toBe(page);
    expect(service.listRuleHits).toHaveBeenCalledWith(query);
  });
});
