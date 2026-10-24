import { describe, it, expect, jest } from '@jest/globals';
import { runWithTenant } from '../../../common/tenant/tenant-context';
import { GraphIntelligenceCollectionsService } from './graph-intelligence-collections.service';

const query = {
  page: 1,
  pageSize: 20,
  order: 'DESC' as const,
  sortBy: 'createdAt',
  offset: 0,
} as any;

/** `EntityManager` con `fork()` que devuelve un `findAndCount` espiable. */
function build(rows: object[] = []) {
  const findAndCount = jest.fn(
    async (..._args: unknown[]) => [rows, rows.length] as const,
  );
  const em = { fork: () => ({ findAndCount }) };
  return {
    service: new GraphIntelligenceCollectionsService(em as any),
    findAndCount,
  };
}

describe('GraphIntelligenceCollectionsService', () => {
  it('listAccessScopes acota al tenant del contexto y publica sólo lo mapeado', async () => {
    const row = {
      id: 'id-1',
      tenantId: 'tenantId-v',
      scopeCode: 'scopeCode-v',
      allowedNodeTypes: 'allowedNodeTypes-v',
      allowedRelationshipTypes: 'allowedRelationshipTypes-v',
      purposeOfUseCodes: 'purposeOfUseCodes-v',
      maxHops: 1,
      requiresPatientContext: true,
      state: 'state-v',
    };
    const { service, findAndCount } = build([row]);
    const page = await runWithTenant('t-1', () =>
      service.listAccessScopes(query),
    );
    expect(findAndCount.mock.calls[0]?.[1]).toEqual({ tenantId: 't-1' });
    expect(page.meta.total).toBe(1);
    expect(page.data[0]).not.toHaveProperty('rowVersion');
    expect(page.data[0]).not.toHaveProperty('createdByUserId');
    expect(page.data[0]).toHaveProperty('id', 'id-1');
  });

  it('listDeletionJobs acota al tenant del contexto y publica sólo lo mapeado', async () => {
    const row = {
      id: 'id-1',
      tenantId: 'tenantId-v',
      sourceEntityType: 'sourceEntityType-v',
      sourceEntityId: 'sourceEntityId-v',
      status: 'status-v',
      nodesDeleted: 1,
      edgesDeleted: 1,
      requestedAt: new Date('2026-10-24T10:00:00Z'),
      verifiedAt: new Date('2026-10-24T10:00:00Z'),
    };
    const { service, findAndCount } = build([row]);
    const page = await runWithTenant('t-1', () =>
      service.listDeletionJobs(query),
    );
    expect(findAndCount.mock.calls[0]?.[1]).toEqual({ tenantId: 't-1' });
    expect(page.meta.total).toBe(1);
    expect(page.data[0]).not.toHaveProperty('rowVersion');
    expect(page.data[0]).not.toHaveProperty('createdByUserId');
    expect(page.data[0]).toHaveProperty('id', 'id-1');
  });

  it('listDefinitionRuns acota al tenant del contexto y publica sólo lo mapeado', async () => {
    const row = {
      id: 'id-1',
      tenantId: 'tenantId-v',
      graphProjectionDefinitionId: 'graphProjectionDefinitionId-v',
      status: 'status-v',
      sourceCheckpoint: 'sourceCheckpoint-v',
      nodesWritten: 'nodesWritten-v',
      edgesWritten: 'edgesWritten-v',
      startedAt: new Date('2026-10-24T10:00:00Z'),
      completedAt: new Date('2026-10-24T10:00:00Z'),
    };
    const { service, findAndCount } = build([row]);
    const page = await runWithTenant('t-1', () =>
      service.listDefinitionRuns('id-1', query),
    );
    expect(findAndCount.mock.calls[0]?.[1]).toEqual({
      $and: [{ graphProjectionDefinitionId: 'id-1' }, { tenantId: 't-1' }],
    });
    expect(page.meta.total).toBe(1);
    expect(page.data[0]).not.toHaveProperty('rowVersion');
    expect(page.data[0]).not.toHaveProperty('createdByUserId');
    expect(page.data[0]).toHaveProperty('id', 'id-1');
  });

  it('listProjectionRuns acota al tenant del contexto y publica sólo lo mapeado', async () => {
    const row = {
      id: 'id-1',
      tenantId: 'tenantId-v',
      graphProjectionDefinitionId: 'graphProjectionDefinitionId-v',
      status: 'status-v',
      sourceCheckpoint: 'sourceCheckpoint-v',
      nodesWritten: 'nodesWritten-v',
      edgesWritten: 'edgesWritten-v',
      startedAt: new Date('2026-10-24T10:00:00Z'),
      completedAt: new Date('2026-10-24T10:00:00Z'),
    };
    const { service, findAndCount } = build([row]);
    const page = await runWithTenant('t-1', () =>
      service.listProjectionRuns(query),
    );
    expect(findAndCount.mock.calls[0]?.[1]).toEqual({ tenantId: 't-1' });
    expect(page.meta.total).toBe(1);
    expect(page.data[0]).not.toHaveProperty('rowVersion');
    expect(page.data[0]).not.toHaveProperty('createdByUserId');
    expect(page.data[0]).toHaveProperty('id', 'id-1');
  });

  it('listProjectionRuns suma el filtro graphProjectionDefinitionId sin soltar el tenant', async () => {
    const { service, findAndCount } = build();
    await runWithTenant('t-1', () =>
      service.listProjectionRuns({
        ...query,
        graphProjectionDefinitionId: 'f-1',
      }),
    );
    const where = findAndCount.mock.calls[0]?.[1] as unknown as {
      $and: unknown[];
    };
    expect(where.$and).toContainEqual({ tenantId: 't-1' });
    expect(where.$and[0]).toMatchObject({ graphProjectionDefinitionId: 'f-1' });
  });

  it('listRuleHits acota al tenant del contexto y publica sólo lo mapeado', async () => {
    const row = {
      id: 'id-1',
      tenantId: 'tenantId-v',
      graphRuleDefinitionId: 'graphRuleDefinitionId-v',
      primaryNodeId: 'primaryNodeId-v',
      relatedNodeIds: 'relatedNodeIds-v',
      evidenceEdgeIds: 'evidenceEdgeIds-v',
      status: 'status-v',
      detectedAt: new Date('2026-10-24T10:00:00Z'),
      resolvedAt: new Date('2026-10-24T10:00:00Z'),
    };
    const { service, findAndCount } = build([row]);
    const page = await runWithTenant('t-1', () => service.listRuleHits(query));
    expect(findAndCount.mock.calls[0]?.[1]).toEqual({ tenantId: 't-1' });
    expect(page.meta.total).toBe(1);
    expect(page.data[0]).not.toHaveProperty('rowVersion');
    expect(page.data[0]).not.toHaveProperty('createdByUserId');
    expect(page.data[0]).toHaveProperty('id', 'id-1');
  });

  it('listRuleHits suma el filtro graphRuleDefinitionId sin soltar el tenant', async () => {
    const { service, findAndCount } = build();
    await runWithTenant('t-1', () =>
      service.listRuleHits({ ...query, graphRuleDefinitionId: 'f-1' }),
    );
    const where = findAndCount.mock.calls[0]?.[1] as unknown as {
      $and: unknown[];
    };
    expect(where.$and).toContainEqual({ tenantId: 't-1' });
    expect(where.$and[0]).toMatchObject({ graphRuleDefinitionId: 'f-1' });
  });
});
