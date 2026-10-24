import { describe, it, expect, jest } from '@jest/globals';
import { runWithTenant } from '../../../common/tenant/tenant-context';
import { PlatformOpsCollectionsService } from './platform-ops-collections.service';

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
    service: new PlatformOpsCollectionsService(em as any),
    findAndCount,
  };
}

describe('PlatformOpsCollectionsService', () => {
  it('listDeployments acota al tenant del contexto y publica sólo lo mapeado', async () => {
    const row = {
      id: 'id-1',
      tenantId: 'tenantId-v',
      serviceComponentId: 'serviceComponentId-v',
      artifactId: 'artifactId-v',
      environmentConceptId: 'environmentConceptId-v',
      deploymentNumber: 'deploymentNumber-v',
      strategyConceptId: 'strategyConceptId-v',
      statusConceptId: 'statusConceptId-v',
      deployedByUserId: 'deployedByUserId-v',
      gitRef: 'gitRef-v',
      startedAt: new Date('2026-10-24T10:00:00Z'),
      finishedAt: new Date('2026-10-24T10:00:00Z'),
      isCurrent: true,
      rollbackOfDeploymentId: 'rollbackOfDeploymentId-v',
      createdAt: new Date('2026-10-24T10:00:00Z'),
      updatedAt: new Date('2026-10-24T10:00:00Z'),
      createdByUserId: 'createdByUserId-v',
      updatedByUserId: 'updatedByUserId-v',
      rowVersion: 1,
    };
    const { service, findAndCount } = build([row]);
    const page = await runWithTenant('t-1', () =>
      service.listDeployments(query),
    );
    expect(findAndCount.mock.calls[0]?.[1]).toEqual({ tenantId: 't-1' });
    expect(page.meta.total).toBe(1);
    expect(page.data[0]).not.toHaveProperty('rowVersion');
    expect(page.data[0]).not.toHaveProperty('createdByUserId');
    expect(page.data[0]).toHaveProperty('id', 'id-1');
  });

  it('listDeployments suma el filtro statusConceptId sin soltar el tenant', async () => {
    const { service, findAndCount } = build();
    await runWithTenant('t-1', () =>
      service.listDeployments({ ...query, statusConceptId: 'f-1' }),
    );
    const where = findAndCount.mock.calls[0]?.[1] as unknown as {
      $and: unknown[];
    };
    expect(where.$and).toContainEqual({ tenantId: 't-1' });
    expect(where.$and[0]).toMatchObject({ statusConceptId: 'f-1' });
  });

  it('listArtifacts acota al tenant del contexto y publica sólo lo mapeado', async () => {
    const row = {
      id: 'id-1',
      tenantId: 'tenantId-v',
      serviceComponentId: 'serviceComponentId-v',
      producedByToolId: 'producedByToolId-v',
      artifactRef: 'artifactRef-v',
      artifactTypeConceptId: 'artifactTypeConceptId-v',
      name: 'name-v',
      version: 'version-v',
      semver: 'semver-v',
      gitRef: 'gitRef-v',
      commitSha: 'commitSha-v',
      contentHash: 'contentHash-v',
      storageUri: 'storageUri-v',
      fileId: 'fileId-v',
      sizeBytes: 1,
      isImmutable: true,
      builtAt: new Date('2026-10-24T10:00:00Z'),
      stateConceptId: 'stateConceptId-v',
      createdAt: new Date('2026-10-24T10:00:00Z'),
      updatedAt: new Date('2026-10-24T10:00:00Z'),
      createdByUserId: 'createdByUserId-v',
      updatedByUserId: 'updatedByUserId-v',
      rowVersion: 1,
    };
    const { service, findAndCount } = build([row]);
    const page = await runWithTenant('t-1', () => service.listArtifacts(query));
    expect(findAndCount.mock.calls[0]?.[1]).toEqual({ tenantId: 't-1' });
    expect(page.meta.total).toBe(1);
    expect(page.data[0]).not.toHaveProperty('rowVersion');
    expect(page.data[0]).not.toHaveProperty('createdByUserId');
    expect(page.data[0]).toHaveProperty('id', 'id-1');
  });

  it('listArtifacts suma el filtro stateConceptId sin soltar el tenant', async () => {
    const { service, findAndCount } = build();
    await runWithTenant('t-1', () =>
      service.listArtifacts({ ...query, stateConceptId: 'f-1' }),
    );
    const where = findAndCount.mock.calls[0]?.[1] as unknown as {
      $and: unknown[];
    };
    expect(where.$and).toContainEqual({ tenantId: 't-1' });
    expect(where.$and[0]).toMatchObject({ stateConceptId: 'f-1' });
  });

  it('listChangeRequests acota al tenant del contexto y publica sólo lo mapeado', async () => {
    const row = {
      id: 'id-1',
      tenantId: 'tenantId-v',
      serviceComponentId: 'serviceComponentId-v',
      deploymentId: 'deploymentId-v',
      changeNumber: 'changeNumber-v',
      title: 'title-v',
      description: 'description-v',
      changeTypeConceptId: 'changeTypeConceptId-v',
      riskLevelConceptId: 'riskLevelConceptId-v',
      statusConceptId: 'statusConceptId-v',
      requestedByUserId: 'requestedByUserId-v',
      plannedStartAt: new Date('2026-10-24T10:00:00Z'),
      plannedEndAt: new Date('2026-10-24T10:00:00Z'),
      rollbackPlanText: 'rollbackPlanText-v',
      validationPlanText: 'validationPlanText-v',
      maintenanceWindowId: 'maintenanceWindowId-v',
      implementedAt: new Date('2026-10-24T10:00:00Z'),
      closedAt: new Date('2026-10-24T10:00:00Z'),
      createdAt: new Date('2026-10-24T10:00:00Z'),
      updatedAt: new Date('2026-10-24T10:00:00Z'),
      createdByUserId: 'createdByUserId-v',
      updatedByUserId: 'updatedByUserId-v',
      rowVersion: 1,
    };
    const { service, findAndCount } = build([row]);
    const page = await runWithTenant('t-1', () =>
      service.listChangeRequests(query),
    );
    expect(findAndCount.mock.calls[0]?.[1]).toEqual({ tenantId: 't-1' });
    expect(page.meta.total).toBe(1);
    expect(page.data[0]).not.toHaveProperty('rowVersion');
    expect(page.data[0]).not.toHaveProperty('createdByUserId');
    expect(page.data[0]).toHaveProperty('id', 'id-1');
  });

  it('listChangeRequests suma el filtro statusConceptId sin soltar el tenant', async () => {
    const { service, findAndCount } = build();
    await runWithTenant('t-1', () =>
      service.listChangeRequests({ ...query, statusConceptId: 'f-1' }),
    );
    const where = findAndCount.mock.calls[0]?.[1] as unknown as {
      $and: unknown[];
    };
    expect(where.$and).toContainEqual({ tenantId: 't-1' });
    expect(where.$and[0]).toMatchObject({ statusConceptId: 'f-1' });
  });

  it('listIncidents acota al tenant del contexto y publica sólo lo mapeado', async () => {
    const row = {
      id: 'id-1',
      tenantId: 'tenantId-v',
      serviceComponentId: 'serviceComponentId-v',
      healthCheckId: 'healthCheckId-v',
      incidentNumber: 'incidentNumber-v',
      severityConceptId: 'severityConceptId-v',
      statusConceptId: 'statusConceptId-v',
      title: 'title-v',
      detectedByRunId: 'detectedByRunId-v',
      openedAt: new Date('2026-10-24T10:00:00Z'),
      acknowledgedAt: new Date('2026-10-24T10:00:00Z'),
      resolvedAt: new Date('2026-10-24T10:00:00Z'),
      rootCauseText: 'rootCauseText-v',
      resolutionText: 'resolutionText-v',
      createdAt: new Date('2026-10-24T10:00:00Z'),
      updatedAt: new Date('2026-10-24T10:00:00Z'),
      createdByUserId: 'createdByUserId-v',
      updatedByUserId: 'updatedByUserId-v',
      rowVersion: 1,
    };
    const { service, findAndCount } = build([row]);
    const page = await runWithTenant('t-1', () => service.listIncidents(query));
    expect(findAndCount.mock.calls[0]?.[1]).toEqual({ tenantId: 't-1' });
    expect(page.meta.total).toBe(1);
    expect(page.data[0]).not.toHaveProperty('rowVersion');
    expect(page.data[0]).not.toHaveProperty('createdByUserId');
    expect(page.data[0]).toHaveProperty('id', 'id-1');
  });

  it('listIncidents suma el filtro statusConceptId sin soltar el tenant', async () => {
    const { service, findAndCount } = build();
    await runWithTenant('t-1', () =>
      service.listIncidents({ ...query, statusConceptId: 'f-1' }),
    );
    const where = findAndCount.mock.calls[0]?.[1] as unknown as {
      $and: unknown[];
    };
    expect(where.$and).toContainEqual({ tenantId: 't-1' });
    expect(where.$and[0]).toMatchObject({ statusConceptId: 'f-1' });
  });

  it('listResilienceExercises acota al tenant del contexto y publica sólo lo mapeado', async () => {
    const row = {
      id: 'id-1',
      tenantId: 'tenantId-v',
      serviceComponentId: 'serviceComponentId-v',
      exerciseTypeConceptId: 'exerciseTypeConceptId-v',
      scenarioName: 'scenarioName-v',
      hypothesisText: 'hypothesisText-v',
      plannedAt: new Date('2026-10-24T10:00:00Z'),
      startedAt: new Date('2026-10-24T10:00:00Z'),
      endedAt: new Date('2026-10-24T10:00:00Z'),
      resultConceptId: 'resultConceptId-v',
      observedRtoSeconds: 'observedRtoSeconds-v',
      observedRpoSeconds: 'observedRpoSeconds-v',
      evidenceUri: 'evidenceUri-v',
      findingsJson: {},
      createdAt: new Date('2026-10-24T10:00:00Z'),
      updatedAt: new Date('2026-10-24T10:00:00Z'),
      createdByUserId: 'createdByUserId-v',
      updatedByUserId: 'updatedByUserId-v',
      rowVersion: 1,
    };
    const { service, findAndCount } = build([row]);
    const page = await runWithTenant('t-1', () =>
      service.listResilienceExercises(query),
    );
    expect(findAndCount.mock.calls[0]?.[1]).toEqual({ tenantId: 't-1' });
    expect(page.meta.total).toBe(1);
    expect(page.data[0]).not.toHaveProperty('rowVersion');
    expect(page.data[0]).not.toHaveProperty('createdByUserId');
    expect(page.data[0]).toHaveProperty('id', 'id-1');
  });
});
