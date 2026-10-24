import { describe, it, expect, jest } from '@jest/globals';
import { runWithTenant } from '../../../common/tenant/tenant-context';
import { VectorRagCollectionsService } from './vector-rag-collections.service';

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
  return { service: new VectorRagCollectionsService(em as any), findAndCount };
}

describe('VectorRagCollectionsService', () => {
  it('listCollections acota al tenant del contexto y publica sólo lo mapeado', async () => {
    const row = {
      id: 'id-1',
      tenantId: 'tenantId-v',
      code: 'code-v',
      name: 'name-v',
      dimension: 1,
      distanceMetric: 'distanceMetric-v',
      embeddingModelVersionId: 'embeddingModelVersionId-v',
      containsPhi: true,
      accessPolicyId: 'accessPolicyId-v',
      lifecycleState: 'lifecycleState-v',
      createdAt: new Date('2026-10-24T10:00:00Z'),
    };
    const { service, findAndCount } = build([row]);
    const page = await runWithTenant('t-1', () =>
      service.listCollections(query),
    );
    expect(findAndCount.mock.calls[0]?.[1]).toEqual({ tenantId: 't-1' });
    expect(page.meta.total).toBe(1);
    expect(page.data[0]).not.toHaveProperty('rowVersion');
    expect(page.data[0]).not.toHaveProperty('createdByUserId');
    expect(page.data[0]).toHaveProperty('id', 'id-1');
  });

  it('listCollectionEmbeddingJobs acota al tenant del contexto y publica sólo lo mapeado', async () => {
    const row = {
      id: 'id-1',
      tenantId: 'tenantId-v',
      vectorCollectionId: 'vectorCollectionId-v',
      jobType: 'jobType-v',
      sourceScope: {},
      requestedByUserId: 'requestedByUserId-v',
      status: 'status-v',
      totalChunks: 1,
      completedChunks: 1,
      failedChunks: 1,
      createdAt: new Date('2026-10-24T10:00:00Z'),
      completedAt: new Date('2026-10-24T10:00:00Z'),
    };
    const { service, findAndCount } = build([row]);
    const page = await runWithTenant('t-1', () =>
      service.listCollectionEmbeddingJobs('id-1', query),
    );
    expect(findAndCount.mock.calls[0]?.[1]).toEqual({
      $and: [{ vectorCollectionId: 'id-1' }, { tenantId: 't-1' }],
    });
    expect(page.meta.total).toBe(1);
    expect(page.data[0]).not.toHaveProperty('rowVersion');
    expect(page.data[0]).not.toHaveProperty('createdByUserId');
    expect(page.data[0]).toHaveProperty('id', 'id-1');
  });

  it('listCollectionReconciliations acota al tenant del contexto y publica sólo lo mapeado', async () => {
    const row = {
      id: 'id-1',
      tenantId: 'tenantId-v',
      vectorCollectionId: 'vectorCollectionId-v',
      canonicalManifestHash: 'canonicalManifestHash-v',
      vectorManifestHash: 'vectorManifestHash-v',
      missingCount: 1,
      orphanCount: 1,
      mismatchedCount: 1,
      status: 'status-v',
      startedAt: new Date('2026-10-24T10:00:00Z'),
      completedAt: new Date('2026-10-24T10:00:00Z'),
    };
    const { service, findAndCount } = build([row]);
    const page = await runWithTenant('t-1', () =>
      service.listCollectionReconciliations('id-1', query),
    );
    expect(findAndCount.mock.calls[0]?.[1]).toEqual({
      $and: [{ vectorCollectionId: 'id-1' }, { tenantId: 't-1' }],
    });
    expect(page.meta.total).toBe(1);
    expect(page.data[0]).not.toHaveProperty('rowVersion');
    expect(page.data[0]).not.toHaveProperty('createdByUserId');
    expect(page.data[0]).toHaveProperty('id', 'id-1');
  });

  it('listRagAccessPolicies acota al tenant del contexto y publica sólo lo mapeado', async () => {
    const row = {
      id: 'id-1',
      tenantId: 'tenantId-v',
      code: 'code-v',
      allowedPrincipalTypes: 'allowedPrincipalTypes-v',
      allowedPurposeCodes: 'allowedPurposeCodes-v',
      allowedSecurityLabels: 'allowedSecurityLabels-v',
      patientScopeRequired: true,
      consentRequired: true,
      fieldRedactionProfile: 'fieldRedactionProfile-v',
      state: 'state-v',
    };
    const { service, findAndCount } = build([row]);
    const page = await runWithTenant('t-1', () =>
      service.listRagAccessPolicies(query),
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
      patientProfileId: 'patientProfileId-v',
      sourceDocumentId: 'sourceDocumentId-v',
      deletionReason: 'deletionReason-v',
      status: 'status-v',
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

  it('listEmbeddingJobs acota al tenant del contexto y publica sólo lo mapeado', async () => {
    const row = {
      id: 'id-1',
      tenantId: 'tenantId-v',
      vectorCollectionId: 'vectorCollectionId-v',
      jobType: 'jobType-v',
      sourceScope: {},
      requestedByUserId: 'requestedByUserId-v',
      status: 'status-v',
      totalChunks: 1,
      completedChunks: 1,
      failedChunks: 1,
      createdAt: new Date('2026-10-24T10:00:00Z'),
      completedAt: new Date('2026-10-24T10:00:00Z'),
    };
    const { service, findAndCount } = build([row]);
    const page = await runWithTenant('t-1', () =>
      service.listEmbeddingJobs(query),
    );
    expect(findAndCount.mock.calls[0]?.[1]).toEqual({ tenantId: 't-1' });
    expect(page.meta.total).toBe(1);
    expect(page.data[0]).not.toHaveProperty('rowVersion');
    expect(page.data[0]).not.toHaveProperty('createdByUserId');
    expect(page.data[0]).toHaveProperty('id', 'id-1');
  });

  it('listEmbeddingJobs suma el filtro vectorCollectionId sin soltar el tenant', async () => {
    const { service, findAndCount } = build();
    await runWithTenant('t-1', () =>
      service.listEmbeddingJobs({ ...query, vectorCollectionId: 'f-1' }),
    );
    const where = findAndCount.mock.calls[0]?.[1] as unknown as {
      $and: unknown[];
    };
    expect(where.$and).toContainEqual({ tenantId: 't-1' });
    expect(where.$and[0]).toMatchObject({ vectorCollectionId: 'f-1' });
  });
});
