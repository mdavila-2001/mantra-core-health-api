import { describe, it, expect, jest } from '@jest/globals';
import { runWithTenant } from '../../../common/tenant/tenant-context';
import { ReportingCollectionsService } from './reporting-collections.service';

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
  return { service: new ReportingCollectionsService(em as any), findAndCount };
}

describe('ReportingCollectionsService', () => {
  it('listDefinitions acota al tenant del contexto y publica sólo lo mapeado', async () => {
    const row = {
      id: 'id-1',
      tenantId: 'tenantId-v',
      code: 'code-v',
      name: 'name-v',
      description: 'description-v',
      categoryConceptId: 'categoryConceptId-v',
      dataSourceId: 'dataSourceId-v',
      querySpecJson: {},
      defaultOutputFormatConceptId: 'defaultOutputFormatConceptId-v',
      requiredPermissionId: 'requiredPermissionId-v',
      isPublic: true,
      currentVersion: 1,
      stateConceptId: 'stateConceptId-v',
      createdAt: new Date('2026-10-24T10:00:00Z'),
      updatedAt: new Date('2026-10-24T10:00:00Z'),
      createdByUserId: 'createdByUserId-v',
      updatedByUserId: 'updatedByUserId-v',
      rowVersion: 1,
    };
    const { service, findAndCount } = build([row]);
    const page = await runWithTenant('t-1', () =>
      service.listDefinitions(query),
    );
    expect(findAndCount.mock.calls[0]?.[1]).toEqual({ tenantId: 't-1' });
    expect(page.meta.total).toBe(1);
    expect(page.data[0]).not.toHaveProperty('rowVersion');
    expect(page.data[0]).not.toHaveProperty('createdByUserId');
    expect(page.data[0]).toHaveProperty('id', 'id-1');
  });

  it('listDefinitions suma el filtro stateConceptId sin soltar el tenant', async () => {
    const { service, findAndCount } = build();
    await runWithTenant('t-1', () =>
      service.listDefinitions({ ...query, stateConceptId: 'f-1' }),
    );
    const where = findAndCount.mock.calls[0]?.[1] as unknown as {
      $and: unknown[];
    };
    expect(where.$and).toContainEqual({ tenantId: 't-1' });
    expect(where.$and[0]).toMatchObject({ stateConceptId: 'f-1' });
  });

  it('listDefinitionExecutions acota al tenant del contexto y publica sólo lo mapeado', async () => {
    const row = {
      id: 'id-1',
      reportDefinitionId: 'reportDefinitionId-v',
      reportVersionId: 'reportVersionId-v',
      scheduleId: 'scheduleId-v',
      tenantId: 'tenantId-v',
      triggerConceptId: 'triggerConceptId-v',
      requestedByUserId: 'requestedByUserId-v',
      parametersJson: {},
      statusConceptId: 'statusConceptId-v',
      startedAt: new Date('2026-10-24T10:00:00Z'),
      finishedAt: new Date('2026-10-24T10:00:00Z'),
      rowCount: 'rowCount-v',
      outputFormatConceptId: 'outputFormatConceptId-v',
      outputFileId: 'outputFileId-v',
      errorText: 'errorText-v',
      createdAt: new Date('2026-10-24T10:00:00Z'),
      updatedAt: new Date('2026-10-24T10:00:00Z'),
      createdByUserId: 'createdByUserId-v',
      updatedByUserId: 'updatedByUserId-v',
      rowVersion: 1,
    };
    const { service, findAndCount } = build([row]);
    const page = await runWithTenant('t-1', () =>
      service.listDefinitionExecutions('id-1', query),
    );
    expect(findAndCount.mock.calls[0]?.[1]).toEqual({
      $and: [{ reportDefinitionId: 'id-1' }, { tenantId: 't-1' }],
    });
    expect(page.meta.total).toBe(1);
    expect(page.data[0]).not.toHaveProperty('rowVersion');
    expect(page.data[0]).not.toHaveProperty('createdByUserId');
    expect(page.data[0]).toHaveProperty('id', 'id-1');
  });

  it('listDefinitionExecutions suma el filtro statusConceptId sin soltar el tenant', async () => {
    const { service, findAndCount } = build();
    await runWithTenant('t-1', () =>
      service.listDefinitionExecutions('id-1', {
        ...query,
        statusConceptId: 'f-1',
      }),
    );
    const where = findAndCount.mock.calls[0]?.[1] as unknown as {
      $and: unknown[];
    };
    expect(where.$and).toContainEqual({ tenantId: 't-1' });
    expect(where.$and[0]).toMatchObject({ statusConceptId: 'f-1' });
  });

  it('listSchedules acota al tenant del contexto y publica sólo lo mapeado', async () => {
    const row = {
      id: 'id-1',
      reportDefinitionId: 'reportDefinitionId-v',
      tenantId: 'tenantId-v',
      name: 'name-v',
      cronExpression: 'cronExpression-v',
      timeZone: 'timeZone-v',
      parametersJson: {},
      outputFormatConceptId: 'outputFormatConceptId-v',
      isEnabled: true,
      nextRunAt: new Date('2026-10-24T10:00:00Z'),
      lastRunAt: new Date('2026-10-24T10:00:00Z'),
      stateConceptId: 'stateConceptId-v',
      createdAt: new Date('2026-10-24T10:00:00Z'),
      updatedAt: new Date('2026-10-24T10:00:00Z'),
      createdByUserId: 'createdByUserId-v',
      updatedByUserId: 'updatedByUserId-v',
      rowVersion: 1,
    };
    const { service, findAndCount } = build([row]);
    const page = await runWithTenant('t-1', () =>
      service.listSchedules('id-1', query),
    );
    expect(findAndCount.mock.calls[0]?.[1]).toEqual({
      $and: [{ reportDefinitionId: 'id-1' }, { tenantId: 't-1' }],
    });
    expect(page.meta.total).toBe(1);
    expect(page.data[0]).not.toHaveProperty('rowVersion');
    expect(page.data[0]).not.toHaveProperty('createdByUserId');
    expect(page.data[0]).toHaveProperty('id', 'id-1');
  });

  it('listSchedules suma el filtro stateConceptId sin soltar el tenant', async () => {
    const { service, findAndCount } = build();
    await runWithTenant('t-1', () =>
      service.listSchedules('id-1', { ...query, stateConceptId: 'f-1' }),
    );
    const where = findAndCount.mock.calls[0]?.[1] as unknown as {
      $and: unknown[];
    };
    expect(where.$and).toContainEqual({ tenantId: 't-1' });
    expect(where.$and[0]).toMatchObject({ stateConceptId: 'f-1' });
  });

  it('listExecutions acota al tenant del contexto y publica sólo lo mapeado', async () => {
    const row = {
      id: 'id-1',
      reportDefinitionId: 'reportDefinitionId-v',
      reportVersionId: 'reportVersionId-v',
      scheduleId: 'scheduleId-v',
      tenantId: 'tenantId-v',
      triggerConceptId: 'triggerConceptId-v',
      requestedByUserId: 'requestedByUserId-v',
      parametersJson: {},
      statusConceptId: 'statusConceptId-v',
      startedAt: new Date('2026-10-24T10:00:00Z'),
      finishedAt: new Date('2026-10-24T10:00:00Z'),
      rowCount: 'rowCount-v',
      outputFormatConceptId: 'outputFormatConceptId-v',
      outputFileId: 'outputFileId-v',
      errorText: 'errorText-v',
      createdAt: new Date('2026-10-24T10:00:00Z'),
      updatedAt: new Date('2026-10-24T10:00:00Z'),
      createdByUserId: 'createdByUserId-v',
      updatedByUserId: 'updatedByUserId-v',
      rowVersion: 1,
    };
    const { service, findAndCount } = build([row]);
    const page = await runWithTenant('t-1', () =>
      service.listExecutions(query),
    );
    expect(findAndCount.mock.calls[0]?.[1]).toEqual({ tenantId: 't-1' });
    expect(page.meta.total).toBe(1);
    expect(page.data[0]).not.toHaveProperty('rowVersion');
    expect(page.data[0]).not.toHaveProperty('createdByUserId');
    expect(page.data[0]).toHaveProperty('id', 'id-1');
  });

  it('listExecutions suma el filtro reportDefinitionId sin soltar el tenant', async () => {
    const { service, findAndCount } = build();
    await runWithTenant('t-1', () =>
      service.listExecutions({ ...query, reportDefinitionId: 'f-1' }),
    );
    const where = findAndCount.mock.calls[0]?.[1] as unknown as {
      $and: unknown[];
    };
    expect(where.$and).toContainEqual({ tenantId: 't-1' });
    expect(where.$and[0]).toMatchObject({ reportDefinitionId: 'f-1' });
  });

  it('listDashboards acota al tenant del contexto y publica sólo lo mapeado', async () => {
    const row = {
      id: 'id-1',
      tenantId: 'tenantId-v',
      code: 'code-v',
      name: 'name-v',
      description: 'description-v',
      layoutJson: {},
      requiredPermissionId: 'requiredPermissionId-v',
      stateConceptId: 'stateConceptId-v',
      createdAt: new Date('2026-10-24T10:00:00Z'),
      updatedAt: new Date('2026-10-24T10:00:00Z'),
      createdByUserId: 'createdByUserId-v',
      updatedByUserId: 'updatedByUserId-v',
      rowVersion: 1,
    };
    const { service, findAndCount } = build([row]);
    const page = await runWithTenant('t-1', () =>
      service.listDashboards(query),
    );
    expect(findAndCount.mock.calls[0]?.[1]).toEqual({ tenantId: 't-1' });
    expect(page.meta.total).toBe(1);
    expect(page.data[0]).not.toHaveProperty('rowVersion');
    expect(page.data[0]).not.toHaveProperty('createdByUserId');
    expect(page.data[0]).toHaveProperty('id', 'id-1');
  });

  it('listDashboards suma el filtro stateConceptId sin soltar el tenant', async () => {
    const { service, findAndCount } = build();
    await runWithTenant('t-1', () =>
      service.listDashboards({ ...query, stateConceptId: 'f-1' }),
    );
    const where = findAndCount.mock.calls[0]?.[1] as unknown as {
      $and: unknown[];
    };
    expect(where.$and).toContainEqual({ tenantId: 't-1' });
    expect(where.$and[0]).toMatchObject({ stateConceptId: 'f-1' });
  });

  it('listDataSources acota al tenant del contexto y publica sólo lo mapeado', async () => {
    const row = {
      id: 'id-1',
      tenantId: 'tenantId-v',
      code: 'code-v',
      name: 'name-v',
      sourceTypeConceptId: 'sourceTypeConceptId-v',
      readModelDefinitionId: 'readModelDefinitionId-v',
      viewName: 'viewName-v',
      specJson: {},
      rowSecurityJson: {},
      stateConceptId: 'stateConceptId-v',
      createdAt: new Date('2026-10-24T10:00:00Z'),
      updatedAt: new Date('2026-10-24T10:00:00Z'),
      createdByUserId: 'createdByUserId-v',
      updatedByUserId: 'updatedByUserId-v',
      rowVersion: 1,
    };
    const { service, findAndCount } = build([row]);
    const page = await runWithTenant('t-1', () =>
      service.listDataSources(query),
    );
    expect(findAndCount.mock.calls[0]?.[1]).toEqual({ tenantId: 't-1' });
    expect(page.meta.total).toBe(1);
    expect(page.data[0]).not.toHaveProperty('rowVersion');
    expect(page.data[0]).not.toHaveProperty('createdByUserId');
    expect(page.data[0]).toHaveProperty('id', 'id-1');
  });

  it('listDataSources suma el filtro stateConceptId sin soltar el tenant', async () => {
    const { service, findAndCount } = build();
    await runWithTenant('t-1', () =>
      service.listDataSources({ ...query, stateConceptId: 'f-1' }),
    );
    const where = findAndCount.mock.calls[0]?.[1] as unknown as {
      $and: unknown[];
    };
    expect(where.$and).toContainEqual({ tenantId: 't-1' });
    expect(where.$and[0]).toMatchObject({ stateConceptId: 'f-1' });
  });
});
