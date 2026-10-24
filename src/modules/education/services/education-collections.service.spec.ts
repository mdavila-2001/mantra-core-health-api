import { describe, it, expect, jest } from '@jest/globals';
import { runWithTenant } from '../../../common/tenant/tenant-context';
import { EducationCollectionsService } from './education-collections.service';

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
  return { service: new EducationCollectionsService(em as any), findAndCount };
}

describe('EducationCollectionsService', () => {
  it('listCourses acota al tenant del contexto y publica sólo lo mapeado', async () => {
    const row = {
      id: 'id-1',
      tenantId: 'tenantId-v',
      code: 'code-v',
      title: 'title-v',
      description: 'description-v',
      courseTypeConceptId: 'courseTypeConceptId-v',
      specialtyConceptId: 'specialtyConceptId-v',
      levelConceptId: 'levelConceptId-v',
      languageConceptId: 'languageConceptId-v',
      coverFileId: 'coverFileId-v',
      isAccredited: true,
      cmeCreditHours: 'cmeCreditHours-v',
      accreditingBodyConceptId: 'accreditingBodyConceptId-v',
      price: 'price-v',
      currencyConceptId: 'currencyConceptId-v',
      durationMinutes: 1,
      currentVersion: 1,
      statusConceptId: 'statusConceptId-v',
      createdAt: new Date('2026-10-24T10:00:00Z'),
      updatedAt: new Date('2026-10-24T10:00:00Z'),
      createdByUserId: 'createdByUserId-v',
      updatedByUserId: 'updatedByUserId-v',
      rowVersion: 1,
    };
    const { service, findAndCount } = build([row]);
    const page = await runWithTenant('t-1', () => service.listCourses(query));
    expect(findAndCount.mock.calls[0]?.[1]).toEqual({ tenantId: 't-1' });
    expect(page.meta.total).toBe(1);
    expect(page.data[0]).not.toHaveProperty('rowVersion');
    expect(page.data[0]).not.toHaveProperty('createdByUserId');
    expect(page.data[0]).toHaveProperty('id', 'id-1');
  });

  it('listCourses suma el filtro statusConceptId sin soltar el tenant', async () => {
    const { service, findAndCount } = build();
    await runWithTenant('t-1', () =>
      service.listCourses({ ...query, statusConceptId: 'f-1' }),
    );
    const where = findAndCount.mock.calls[0]?.[1] as unknown as {
      $and: unknown[];
    };
    expect(where.$and).toContainEqual({ tenantId: 't-1' });
    expect(where.$and[0]).toMatchObject({ statusConceptId: 'f-1' });
  });
});
