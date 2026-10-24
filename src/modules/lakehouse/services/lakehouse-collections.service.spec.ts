import { describe, it, expect, jest } from '@jest/globals';
import { runWithTenant } from '../../../common/tenant/tenant-context';
import { LakehouseCollectionsService } from './lakehouse-collections.service';

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
  return { service: new LakehouseCollectionsService(em as any), findAndCount };
}

describe('LakehouseCollectionsService', () => {
  it('listDatasetReleases acota al tenant del contexto y publica sólo lo mapeado', async () => {
    const row = {
      id: 'id-1',
      tenantId: 'tenantId-v',
      researchProjectId: 'researchProjectId-v',
      dataProductVersionId: 'dataProductVersionId-v',
      cohortDefinitionId: 'cohortDefinitionId-v',
      purposeOfUseCode: 'purposeOfUseCode-v',
      requestedByUserId: 'requestedByUserId-v',
      requestedAt: new Date('2026-10-24T10:00:00Z'),
      status: 'status-v',
    };
    const { service, findAndCount } = build([row]);
    const page = await runWithTenant('t-1', () =>
      service.listDatasetReleases(query),
    );
    expect(findAndCount.mock.calls[0]?.[1]).toEqual({ tenantId: 't-1' });
    expect(page.meta.total).toBe(1);
    expect(page.data[0]).not.toHaveProperty('rowVersion');
    expect(page.data[0]).not.toHaveProperty('createdByUserId');
    expect(page.data[0]).toHaveProperty('id', 'id-1');
  });

  it('listDatasets acota al tenant del contexto y publica sólo lo mapeado', async () => {
    const row = {
      id: 'id-1',
      tenantId: 'tenantId-v',
      dataProductVersionId: 'dataProductVersionId-v',
      dataLakeZoneId: 'dataLakeZoneId-v',
      lakehouseCatalogId: 'lakehouseCatalogId-v',
      databaseName: 'databaseName-v',
      tableName: 'tableName-v',
      storageFormat: 'storageFormat-v',
      partitionSpecJson: {},
      sourceDatasetCode: 'sourceDatasetCode-v',
      lifecycleState: 'lifecycleState-v',
    };
    const { service, findAndCount } = build([row]);
    const page = await runWithTenant('t-1', () => service.listDatasets(query));
    expect(findAndCount.mock.calls[0]?.[1]).toEqual({ tenantId: 't-1' });
    expect(page.meta.total).toBe(1);
    expect(page.data[0]).not.toHaveProperty('rowVersion');
    expect(page.data[0]).not.toHaveProperty('createdByUserId');
    expect(page.data[0]).toHaveProperty('id', 'id-1');
  });

  it('listQualityRuns acota al tenant del contexto y publica sólo lo mapeado', async () => {
    const row = {
      id: 'id-1',
      tenantId: 'tenantId-v',
      lakehouseDatasetId: 'lakehouseDatasetId-v',
      transformationRunId: 'transformationRunId-v',
      status: 'status-v',
      evaluatedRecordCount: 'evaluatedRecordCount-v',
      failedRecordCount: 'failedRecordCount-v',
      startedAt: new Date('2026-10-24T10:00:00Z'),
      completedAt: new Date('2026-10-24T10:00:00Z'),
    };
    const { service, findAndCount } = build([row]);
    const page = await runWithTenant('t-1', () =>
      service.listQualityRuns('id-1', query),
    );
    expect(findAndCount.mock.calls[0]?.[1]).toEqual({
      $and: [{ lakehouseDatasetId: 'id-1' }, { tenantId: 't-1' }],
    });
    expect(page.meta.total).toBe(1);
    expect(page.data[0]).not.toHaveProperty('rowVersion');
    expect(page.data[0]).not.toHaveProperty('createdByUserId');
    expect(page.data[0]).toHaveProperty('id', 'id-1');
  });

  it('listRuns acota al tenant del contexto y publica sólo lo mapeado', async () => {
    const row = {
      id: 'id-1',
      transformationDefinitionId: 'transformationDefinitionId-v',
      tenantId: 'tenantId-v',
      sourceCheckpoint: 'sourceCheckpoint-v',
      status: 'status-v',
      inputRecordCount: 'inputRecordCount-v',
      outputRecordCount: 'outputRecordCount-v',
      rejectedRecordCount: 'rejectedRecordCount-v',
      startedAt: new Date('2026-10-24T10:00:00Z'),
      completedAt: new Date('2026-10-24T10:00:00Z'),
    };
    const { service, findAndCount } = build([row]);
    const page = await runWithTenant('t-1', () =>
      service.listRuns('defId-1', query),
    );
    expect(findAndCount.mock.calls[0]?.[1]).toEqual({
      $and: [{ transformationDefinitionId: 'defId-1' }, { tenantId: 't-1' }],
    });
    expect(page.meta.total).toBe(1);
    expect(page.data[0]).not.toHaveProperty('rowVersion');
    expect(page.data[0]).not.toHaveProperty('createdByUserId');
    expect(page.data[0]).toHaveProperty('id', 'id-1');
  });
});
