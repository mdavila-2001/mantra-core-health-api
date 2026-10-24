import { describe, it, expect, jest } from '@jest/globals';
import { runWithTenant } from '../../../common/tenant/tenant-context';
import { IntegrationsCollectionsService } from './integrations-collections.service';

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
    service: new IntegrationsCollectionsService(em as any),
    findAndCount,
  };
}

describe('IntegrationsCollectionsService', () => {
  it('listConnections acota al tenant del contexto y publica sólo lo mapeado', async () => {
    const row = {
      id: 'id-1',
      providerId: 'providerId-v',
      tenantId: 'tenantId-v',
      environmentConceptId: 'environmentConceptId-v',
      configJson: {},
      credentialId: 'credentialId-v',
      stateConceptId: 'stateConceptId-v',
      validFrom: new Date('2026-10-24T10:00:00Z'),
      validTo: new Date('2026-10-24T10:00:00Z'),
      createdAt: new Date('2026-10-24T10:00:00Z'),
      updatedAt: new Date('2026-10-24T10:00:00Z'),
      createdByUserId: 'createdByUserId-v',
      updatedByUserId: 'updatedByUserId-v',
      rowVersion: 1,
    };
    const { service, findAndCount } = build([row]);
    const page = await runWithTenant('t-1', () =>
      service.listConnections(query),
    );
    expect(findAndCount.mock.calls[0]?.[1]).toEqual({ tenantId: 't-1' });
    expect(page.meta.total).toBe(1);
    expect(page.data[0]).not.toHaveProperty('rowVersion');
    expect(page.data[0]).not.toHaveProperty('createdByUserId');
    expect(page.data[0]).not.toHaveProperty('configJson');
    expect(page.data[0]).toHaveProperty('id', 'id-1');
  });

  it('listConnections suma el filtro providerId sin soltar el tenant', async () => {
    const { service, findAndCount } = build();
    await runWithTenant('t-1', () =>
      service.listConnections({ ...query, providerId: 'f-1' }),
    );
    const where = findAndCount.mock.calls[0]?.[1] as unknown as {
      $and: unknown[];
    };
    expect(where.$and).toContainEqual({ tenantId: 't-1' });
    expect(where.$and[0]).toMatchObject({ providerId: 'f-1' });
  });

  it('listProviderConnections acota al tenant del contexto y publica sólo lo mapeado', async () => {
    const row = {
      id: 'id-1',
      providerId: 'providerId-v',
      tenantId: 'tenantId-v',
      environmentConceptId: 'environmentConceptId-v',
      configJson: {},
      credentialId: 'credentialId-v',
      stateConceptId: 'stateConceptId-v',
      validFrom: new Date('2026-10-24T10:00:00Z'),
      validTo: new Date('2026-10-24T10:00:00Z'),
      createdAt: new Date('2026-10-24T10:00:00Z'),
      updatedAt: new Date('2026-10-24T10:00:00Z'),
      createdByUserId: 'createdByUserId-v',
      updatedByUserId: 'updatedByUserId-v',
      rowVersion: 1,
    };
    const { service, findAndCount } = build([row]);
    const page = await runWithTenant('t-1', () =>
      service.listProviderConnections('id-1', query),
    );
    expect(findAndCount.mock.calls[0]?.[1]).toEqual({
      $and: [{ providerId: 'id-1' }, { tenantId: 't-1' }],
    });
    expect(page.meta.total).toBe(1);
    expect(page.data[0]).not.toHaveProperty('rowVersion');
    expect(page.data[0]).not.toHaveProperty('createdByUserId');
    expect(page.data[0]).not.toHaveProperty('configJson');
    expect(page.data[0]).toHaveProperty('id', 'id-1');
  });

  it('listProviderConnections suma el filtro stateConceptId sin soltar el tenant', async () => {
    const { service, findAndCount } = build();
    await runWithTenant('t-1', () =>
      service.listProviderConnections('id-1', {
        ...query,
        stateConceptId: 'f-1',
      }),
    );
    const where = findAndCount.mock.calls[0]?.[1] as unknown as {
      $and: unknown[];
    };
    expect(where.$and).toContainEqual({ tenantId: 't-1' });
    expect(where.$and[0]).toMatchObject({ stateConceptId: 'f-1' });
  });

  it('listProviderWebhookSubscriptions acota al tenant del contexto y publica sólo lo mapeado', async () => {
    const row = {
      id: 'id-1',
      providerId: 'providerId-v',
      tenantId: 'tenantId-v',
      eventType: 'eventType-v',
      callbackUrl: 'callbackUrl-v',
      secretRef: 'secretRef-v',
      stateConceptId: 'stateConceptId-v',
      createdAt: new Date('2026-10-24T10:00:00Z'),
      updatedAt: new Date('2026-10-24T10:00:00Z'),
      createdByUserId: 'createdByUserId-v',
      updatedByUserId: 'updatedByUserId-v',
      rowVersion: 1,
    };
    const { service, findAndCount } = build([row]);
    const page = await runWithTenant('t-1', () =>
      service.listProviderWebhookSubscriptions('id-1', query),
    );
    expect(findAndCount.mock.calls[0]?.[1]).toEqual({
      $and: [{ providerId: 'id-1' }, { tenantId: 't-1' }],
    });
    expect(page.meta.total).toBe(1);
    expect(page.data[0]).not.toHaveProperty('rowVersion');
    expect(page.data[0]).not.toHaveProperty('createdByUserId');
    expect(page.data[0]).toHaveProperty('id', 'id-1');
  });

  it('listProviderWebhookSubscriptions suma el filtro stateConceptId sin soltar el tenant', async () => {
    const { service, findAndCount } = build();
    await runWithTenant('t-1', () =>
      service.listProviderWebhookSubscriptions('id-1', {
        ...query,
        stateConceptId: 'f-1',
      }),
    );
    const where = findAndCount.mock.calls[0]?.[1] as unknown as {
      $and: unknown[];
    };
    expect(where.$and).toContainEqual({ tenantId: 't-1' });
    expect(where.$and[0]).toMatchObject({ stateConceptId: 'f-1' });
  });
});
