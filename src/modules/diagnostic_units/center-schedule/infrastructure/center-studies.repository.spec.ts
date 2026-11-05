import { describe, expect, it, jest } from '@jest/globals';
import { CenterStudiesRepository } from './center-studies.repository';

describe('CenterStudiesRepository', () => {
  it('only offers studies switched on for today, in a center and across centers', async () => {
    const execute = (jest.fn as any)().mockResolvedValue([]);
    const repo = new CenterStudiesRepository();
    await repo.findForUnit({ execute } as never, 'u1');
    await repo.findPublishedByConcept({ execute } as never, 'c1');
    expect(execute).toHaveBeenCalledTimes(2);
    for (const [sql] of execute.mock.calls as [string][]) {
      expect(sql).toContain('o.status_concept_id = ? AND o.available');
    }
  });
});
