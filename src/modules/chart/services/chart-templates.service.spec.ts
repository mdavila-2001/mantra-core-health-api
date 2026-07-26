import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { ChartTemplatesService } from './chart-templates.service';
import { CHART } from '../chart.concepts';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const templatesRepo = {
    findTemplateById: mockFn(),
    findActiveDefaults: mockFn().mockResolvedValue([]),
    createAssignment: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn() };
  const service = new ChartTemplatesService(em as any, templatesRepo as any, logger as any);
  return { service, tx, templatesRepo };
}

describe('ChartTemplatesService', () => {
  describe('assignTemplate (UC-15-12)', () => {
    it('creates a non-default assignment without touching prior defaults', async () => {
      const d = build();
      d.templatesRepo.createAssignment.mockReturnValue({ id: 'as1', templateId: 't1', isDefault: false, statusConceptId: CHART.ASSIGNMENT_ACTIVE });

      const res = await d.service.assignTemplate('t1', { practiceId: 'pr1' } as any, actor);
      expect(d.templatesRepo.findActiveDefaults).not.toHaveBeenCalled();
      expect(res.isDefault).toBe(false);
      expect(res.statusConceptId).toBe(CHART.ASSIGNMENT_ACTIVE);
    });

    it('clears prior defaults in scope before inserting a new default', async () => {
      const d = build();
      const prior: any = { id: 'as0', isDefault: true, updatedAt: new Date() };
      d.templatesRepo.findActiveDefaults.mockResolvedValue([prior]);
      d.templatesRepo.createAssignment.mockReturnValue({ id: 'as1', templateId: 't1', isDefault: true, statusConceptId: CHART.ASSIGNMENT_ACTIVE });

      const res = await d.service.assignTemplate('t1', { practiceId: 'pr1', isDefault: true } as any, actor);
      expect(d.templatesRepo.findActiveDefaults).toHaveBeenCalledWith(
        d.tx,
        CHART.ASSIGNMENT_ACTIVE,
        { practiceId: 'pr1', practitionerProfileId: undefined },
      );
      expect(prior.isDefault).toBe(false);
      expect(res.isDefault).toBe(true);
    });
  });
});
