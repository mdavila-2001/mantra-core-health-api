import { describe, it, expect, jest } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';
import { runWithTenant } from '../../../common/tenant/tenant-context';
import { TerminologyCollectionsService } from './terminology-collections.service';

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
    service: new TerminologyCollectionsService(em as any),
    findAndCount,
  };
}

describe('TerminologyCollectionsService', () => {
  it('listCatalogPolicies acota al tenant del contexto y publica sólo lo mapeado', async () => {
    const row = {
      id: 'id-1',
      tenantId: 'tenantId-v',
      valueSetId: 'valueSetId-v',
      modeConceptId: 'modeConceptId-v',
      allowSubset: true,
      allowAlias: true,
      allowLocalConcepts: true,
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
      service.listCatalogPolicies('t-1', query),
    );
    expect(findAndCount.mock.calls[0]?.[1]).toEqual({ tenantId: 't-1' });
    expect(page.meta.total).toBe(1);
    expect(page.data[0]).not.toHaveProperty('rowVersion');
    expect(page.data[0]).not.toHaveProperty('createdByUserId');
    expect(page.data[0]).toHaveProperty('id', 'id-1');
  });

  it('listCatalogPolicies suma el filtro valueSetId sin soltar el tenant', async () => {
    const { service, findAndCount } = build();
    await runWithTenant('t-1', () =>
      service.listCatalogPolicies('t-1', { ...query, valueSetId: 'f-1' }),
    );
    const where = findAndCount.mock.calls[0]?.[1] as unknown as {
      $and: unknown[];
    };
    expect(where.$and).toContainEqual({ tenantId: 't-1' });
    expect(where.$and[0]).toMatchObject({ valueSetId: 'f-1' });
  });

  it('listCatalogPolicies rechaza un tenant de ruta que no es el del contexto', async () => {
    const { service, findAndCount } = build();
    await expect(
      runWithTenant('t-1', () => service.listCatalogPolicies('t-2', query)),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(findAndCount).not.toHaveBeenCalled();
  });
});
