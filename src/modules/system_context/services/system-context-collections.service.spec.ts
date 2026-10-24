import { describe, it, expect, jest } from '@jest/globals';
import { runWithTenant } from '../../../common/tenant/tenant-context';
import { SystemContextCollectionsService } from './system-context-collections.service';

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
    service: new SystemContextCollectionsService(em as any),
    findAndCount,
  };
}

describe('SystemContextCollectionsService', () => {
  it('listContexts acota al tenant del contexto y publica sólo lo mapeado', async () => {
    const row = {
      id: 'id-1',
      code: 'code-v',
      name: 'name-v',
      description: 'description-v',
      contextTypeConceptId: 'contextTypeConceptId-v',
      scopeTypeConceptId: 'scopeTypeConceptId-v',
      tenantId: 'tenantId-v',
      countryConceptId: 'countryConceptId-v',
      localeConceptId: 'localeConceptId-v',
      currentVersionId: 'currentVersionId-v',
      refreshPolicyConceptId: 'refreshPolicyConceptId-v',
      statusConceptId: 'statusConceptId-v',
      createdAt: new Date('2026-10-24T10:00:00Z'),
      updatedAt: new Date('2026-10-24T10:00:00Z'),
      createdByUserId: 'createdByUserId-v',
      updatedByUserId: 'updatedByUserId-v',
      rowVersion: 1,
    };
    const { service, findAndCount } = build([row]);
    const page = await runWithTenant('t-1', () => service.listContexts(query));
    expect(findAndCount.mock.calls[0]?.[1]).toEqual({
      $or: [{ tenantId: 't-1' }, { tenantId: null }],
    });
    expect(page.meta.total).toBe(1);
    expect(page.data[0]).not.toHaveProperty('rowVersion');
    expect(page.data[0]).not.toHaveProperty('createdByUserId');
    expect(page.data[0]).toHaveProperty('id', 'id-1');
  });

  it('listContexts suma el filtro statusConceptId sin soltar el tenant', async () => {
    const { service, findAndCount } = build();
    await runWithTenant('t-1', () =>
      service.listContexts({ ...query, statusConceptId: 'f-1' }),
    );
    const where = findAndCount.mock.calls[0]?.[1] as unknown as {
      $and: unknown[];
    };
    expect(where.$and).toContainEqual({
      $or: [{ tenantId: 't-1' }, { tenantId: null }],
    });
    expect(where.$and[0]).toMatchObject({ statusConceptId: 'f-1' });
  });

  it('listDynamicEnumDefinitions acota al tenant del contexto y publica sólo lo mapeado', async () => {
    const row = {
      id: 'id-1',
      code: 'code-v',
      name: 'name-v',
      description: 'description-v',
      valueSetId: 'valueSetId-v',
      scopeTypeConceptId: 'scopeTypeConceptId-v',
      tenantId: 'tenantId-v',
      countryConceptId: 'countryConceptId-v',
      selectionModeConceptId: 'selectionModeConceptId-v',
      allowTenantExtension: true,
      allowCustomValue: true,
      statusConceptId: 'statusConceptId-v',
      createdAt: new Date('2026-10-24T10:00:00Z'),
      updatedAt: new Date('2026-10-24T10:00:00Z'),
      createdByUserId: 'createdByUserId-v',
      updatedByUserId: 'updatedByUserId-v',
      rowVersion: 1,
    };
    const { service, findAndCount } = build([row]);
    const page = await runWithTenant('t-1', () =>
      service.listDynamicEnumDefinitions(query),
    );
    expect(findAndCount.mock.calls[0]?.[1]).toEqual({
      $or: [{ tenantId: 't-1' }, { tenantId: null }],
    });
    expect(page.meta.total).toBe(1);
    expect(page.data[0]).not.toHaveProperty('rowVersion');
    expect(page.data[0]).not.toHaveProperty('createdByUserId');
    expect(page.data[0]).toHaveProperty('id', 'id-1');
  });

  it('listDynamicEnumDefinitions suma el filtro statusConceptId sin soltar el tenant', async () => {
    const { service, findAndCount } = build();
    await runWithTenant('t-1', () =>
      service.listDynamicEnumDefinitions({ ...query, statusConceptId: 'f-1' }),
    );
    const where = findAndCount.mock.calls[0]?.[1] as unknown as {
      $and: unknown[];
    };
    expect(where.$and).toContainEqual({
      $or: [{ tenantId: 't-1' }, { tenantId: null }],
    });
    expect(where.$and[0]).toMatchObject({ statusConceptId: 'f-1' });
  });
});
