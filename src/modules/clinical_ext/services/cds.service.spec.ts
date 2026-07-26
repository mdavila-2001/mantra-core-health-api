import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { CdsService } from './cds.service';
import { ConflictException, PreconditionFailedException, ResourceNotFoundException } from '../../../common';
import { CEXT } from '../clinical_ext.concepts';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const rulesRepo = { findById: mockFn(), findByCode: mockFn(), findActive: mockFn(), create: mockFn() };
  const alertsRepo = { create: mockFn() };
  const interactionsRepo = { findByPair: mockFn(), create: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new CdsService(em as any, rulesRepo as any, alertsRepo as any, interactionsRepo as any, logger as any);
  return { service, tx, rulesRepo, alertsRepo, interactionsRepo };
}

describe('CdsService', () => {
  describe('createRule', () => {
    it('creates a draft rule', async () => {
      const d = build();
      d.rulesRepo.findByCode.mockResolvedValue(null);
      d.rulesRepo.create.mockReturnValue({ id: 'r1', code: 'C1', version: 1, isActive: false, statusConceptId: CEXT.CDS_RULE_DRAFT });
      const res = await d.service.createRule({ code: 'C1', name: 'Rule' } as any, actor);
      expect(res.statusConceptId).toBe(CEXT.CDS_RULE_DRAFT);
    });

    it('rejects a duplicated code (conflict)', async () => {
      const d = build();
      d.rulesRepo.findByCode.mockResolvedValue({ id: 'r0' });
      await expect(d.service.createRule({ code: 'C1', name: 'Rule' } as any, actor)).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('publishVersion (UC-18-13)', () => {
    it('bumps version and activates the rule', async () => {
      const d = build();
      const rule = { id: 'r1', code: 'C1', version: 1, isActive: false, statusConceptId: CEXT.CDS_RULE_DRAFT, updatedAt: new Date() };
      d.rulesRepo.findById.mockResolvedValue(rule);
      const res = await d.service.publishVersion('r1', {} as any, actor);
      expect(res.version).toBe(2);
      expect(rule.isActive).toBe(true);
      expect(rule.statusConceptId).toBe(CEXT.CDS_RULE_ACTIVE);
    });

    it('throws when the rule is missing', async () => {
      const d = build();
      d.rulesRepo.findById.mockResolvedValue(null);
      await expect(d.service.publishVersion('r1', {} as any, actor)).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('rollbackVersion (UC-18-13)', () => {
    it('retires an active rule', async () => {
      const d = build();
      const rule = { id: 'r1', code: 'C1', version: 2, isActive: true, statusConceptId: CEXT.CDS_RULE_ACTIVE, updatedAt: new Date() };
      d.rulesRepo.findById.mockResolvedValue(rule);
      await d.service.rollbackVersion('r1', actor);
      expect(rule.isActive).toBe(false);
      expect(rule.statusConceptId).toBe(CEXT.CDS_RULE_RETIRED);
    });

    it('rejects rollback of a non-active rule (precondition)', async () => {
      const d = build();
      d.rulesRepo.findById.mockResolvedValue({ id: 'r1', statusConceptId: CEXT.CDS_RULE_DRAFT });
      await expect(d.service.rollbackVersion('r1', actor)).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('evaluate (UC-18-03)', () => {
    it('generates one alert per active rule, atomically', async () => {
      const d = build();
      d.rulesRepo.findActive.mockResolvedValue([
        { id: 'r1', name: 'R1', severityConceptId: CEXT.SEVERITY_HIGH, messageTemplate: 'msg' },
        { id: 'r2', name: 'R2', severityConceptId: CEXT.SEVERITY_LOW },
      ]);
      d.alertsRepo.create.mockImplementation((_tx: any, data: any) => ({ id: `a-${data.ruleId}`, ...data }));

      const res = await d.service.evaluate({ patientProfileId: 'p1' } as any, actor);

      expect(res.count).toBe(2);
      expect(d.alertsRepo.create).toHaveBeenCalledTimes(2);
      expect(d.tx.flush).toHaveBeenCalledTimes(1);
    });
  });

  describe('checkInteractions (UC-18-04)', () => {
    it('raises an alert only for pairs with a known interaction', async () => {
      const d = build();
      d.interactionsRepo.findByPair.mockImplementation((_tx: any, a: string, b: string) =>
        a === 's1' && b === 's2' ? { id: 'i1', severityConceptId: CEXT.SEVERITY_HIGH, mechanismText: 'm', managementText: 'g' } : null,
      );
      d.alertsRepo.create.mockImplementation((_tx: any, data: any) => ({ id: 'a1', ...data }));

      const res = await d.service.checkInteractions({ patientProfileId: 'p1', substanceConceptIds: ['s1', 's2', 's3'] } as any, actor);

      expect(res.count).toBe(1);
    });

    it('returns no alerts when there are no known interactions', async () => {
      const d = build();
      d.interactionsRepo.findByPair.mockResolvedValue(null);
      const res = await d.service.checkInteractions({ patientProfileId: 'p1', substanceConceptIds: ['s1', 's2'] } as any, actor);
      expect(res.count).toBe(0);
      expect(d.alertsRepo.create).not.toHaveBeenCalled();
    });
  });
});
