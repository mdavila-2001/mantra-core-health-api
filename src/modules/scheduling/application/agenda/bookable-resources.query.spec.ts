import { jest } from '@jest/globals';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS, SEED } from '../../../../common';
import { findBookableResources } from './bookable-resources.query';

function emReturning(rows: unknown[], total: number) {
  const execute = jest
    .fn<(sql: string, params?: unknown[]) => Promise<unknown>>()
    .mockResolvedValueOnce(undefined)
    .mockResolvedValueOnce(rows)
    .mockResolvedValueOnce([{ total: String(total) }]);
  const em = {
    transactional: jest.fn((work: (tx: unknown) => unknown) =>
      work({ execute }),
    ),
  } as unknown as EntityManager;
  return { em, execute };
}

const ROW = {
  tenant_id: 't-1',
  organization_name: 'AloVida',
  resource_id: 'res-1',
  resource_ref_type: 'health_practitioner_profiles',
  resource_ref_id: 'person-1',
  label: 'Dra. Quispe',
};

const calls = (execute: ReturnType<typeof emReturning>['execute']) => ({
  page: execute.mock.calls[1] as [string, unknown[]],
  total: execute.mock.calls[2] as [string, unknown[]],
});

describe('findBookableResources', () => {
  it('runs in system context and maps one page with its total', async () => {
    const { em, execute } = emReturning([ROW], 37);

    await expect(findBookableResources(em, {})).resolves.toEqual({
      items: [
        {
          tenantId: 't-1',
          organizationName: 'AloVida',
          resourceId: 'res-1',
          resourceRefType: 'health_practitioner_profiles',
          resourceRefId: 'person-1',
          name: 'Dra. Quispe',
        },
      ],
      count: 1,
      total: 37,
    });
    expect(execute.mock.calls[0][0]).toContain("'app.system_context', 'true'");
  });

  it('binds one value per placeholder, pages with 20 from 0 by default', async () => {
    const { em, execute } = emReturning([], 0);

    await findBookableResources(em, {});

    const { page, total } = calls(execute);
    expect(page[1]).toHaveLength((page[0].match(/\?/g) ?? []).length);
    expect(total[1]).toHaveLength((total[0].match(/\?/g) ?? []).length);
    expect(page[1].slice(-2)).toEqual([20, 0]);
    expect(page[0]).toMatch(/LIMIT \? OFFSET \?/);
  });

  it('labels the seed tenant «AloVida» and lists practitioners unless ROOM is asked', async () => {
    const { em, execute } = emReturning([], 0);
    await findBookableResources(em, { limit: 5, offset: 10 });
    const practitioners = calls(execute).page;
    expect(practitioners[0]).toContain("THEN 'AloVida'");
    expect(practitioners[1][0]).toBe(SEED.tenantId);
    expect(practitioners[1]).toContain(CONCEPTS.RESOURCE_PRACTITIONER);
    expect(practitioners[1].slice(-2)).toEqual([5, 10]);

    const rooms = emReturning([], 0);
    await findBookableResources(rooms.em, { resourceType: 'ROOM' });
    expect(calls(rooms.execute).page[1]).toContain(CONCEPTS.RESOURCE_ROOM);
  });

  it('searches accent-insensitively, taking the typed wildcards literally', async () => {
    const { em, execute } = emReturning([], 0);

    await findBookableResources(em, { q: '  50%_off ' });

    const { page } = calls(execute);
    expect(page[0]).toContain(
      "translate(lower(label), 'áéíóúüñ', 'aeiouun') LIKE translate(lower(?), 'áéíóúüñ', 'aeiouun')",
    );
    expect(page[0]).toContain(
      "translate(lower(organization_name), 'áéíóúüñ', 'aeiouun') LIKE",
    );
    expect(page[1]).toContain('%50\\%\\_off%');
  });

  it('a blank search binds null and lists everyone', async () => {
    const { em, execute } = emReturning([], 0);

    await findBookableResources(em, { q: '   ' });

    const params = calls(execute).page[1];
    expect(params.slice(-5, -2)).toEqual([null, null, null]);
  });
});
