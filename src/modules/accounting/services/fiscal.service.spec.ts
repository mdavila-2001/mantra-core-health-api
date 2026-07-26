import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { FiscalService } from './fiscal.service';
import { ACCT } from '../accounting.concepts';
import { ConflictException, PreconditionFailedException, ResourceNotFoundException } from '../../../common';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const fiscalRepo = {
    findYearByCode: mockFn().mockResolvedValue(null),
    createYear: mockFn((_em: any, d: any) => ({ id: 'y1', code: d.code, statusConceptId: d.statusConceptId })),
    createPeriod: mockFn(() => ({ id: `per-${Math.random()}` })),
    findPeriodById: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn() };
  const service = new FiscalService(em as any, fiscalRepo as any, logger as any);
  return { service, tx, fiscalRepo };
}

describe('FiscalService', () => {
  describe('openFiscalYear (UC-16-04)', () => {
    const dto = {
      practiceId: 'p1',
      code: 'FY2026',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      periods: [
        { code: '2026-01', startDate: '2026-01-01', endDate: '2026-01-31' },
        { code: '2026-02', startDate: '2026-02-01', endDate: '2026-02-28' },
      ],
    };

    it('crea el ejercicio y sus periodos', async () => {
      const d = build();
      const res = await d.service.openFiscalYear(dto as any, actor);
      expect(res.status).toBe(ACCT.YEAR_OPEN);
      expect(res.periodIds).toHaveLength(2);
      expect(d.fiscalRepo.createPeriod).toHaveBeenCalledTimes(2);
    });

    it('rechaza (409) un código de ejercicio duplicado', async () => {
      const d = build();
      d.fiscalRepo.findYearByCode.mockResolvedValue({ id: 'dup' });
      await expect(d.service.openFiscalYear(dto as any, actor)).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('lockPeriod (UC-16-05)', () => {
    it('lanza 404 si el periodo no existe', async () => {
      const d = build();
      d.fiscalRepo.findPeriodById.mockResolvedValue(null);
      await expect(d.service.lockPeriod('x', {}, actor)).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rechaza bloquear un periodo no ABIERTO', async () => {
      const d = build();
      d.fiscalRepo.findPeriodById.mockResolvedValue({ id: 'per1', statusConceptId: ACCT.PERIOD_LOCKED });
      await expect(d.service.lockPeriod('per1', {}, actor)).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
    });

    it('bloquea un periodo ABIERTO', async () => {
      const d = build();
      const period = { id: 'per1', statusConceptId: ACCT.PERIOD_OPEN, updatedAt: new Date() };
      d.fiscalRepo.findPeriodById.mockResolvedValue(period);
      const res = await d.service.lockPeriod('per1', {}, actor);
      expect(res).toEqual({ ok: true, id: 'per1' });
      expect(period.statusConceptId).toBe(ACCT.PERIOD_LOCKED);
    });
  });
});
