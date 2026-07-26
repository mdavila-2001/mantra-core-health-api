import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { DiagnosticPricingService } from './diagnostic-pricing.service';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { DUNIT } from '../diagnostic_units.concepts';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const unitsRepo = { findById: mockFn() };
  const schedulesRepo = { findById: mockFn(), findByCode: mockFn(), create: mockFn() };
  const offeringsRepo = { findById: mockFn() };
  const pricesRepo = {
    findById: mockFn(),
    findActive: mockFn().mockResolvedValue(null),
    maxVersion: mockFn().mockResolvedValue(0),
    create: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new DiagnosticPricingService(
    em as any,
    unitsRepo as any,
    schedulesRepo as any,
    offeringsRepo as any,
    pricesRepo as any,
    logger as any,
  );
  return { service, tx, unitsRepo, schedulesRepo, offeringsRepo, pricesRepo };
}

const activeUnit = { id: 'u1', statusConceptId: DUNIT.UNIT_ACTIVE };

describe('DiagnosticPricingService', () => {
  describe('createSchedule (UC-23-06)', () => {
    it('rejects a duplicate schedule code (conflict)', async () => {
      const d = build();
      d.unitsRepo.findById.mockResolvedValue(activeUnit);
      d.schedulesRepo.findByCode.mockResolvedValue({ id: 'e1' });
      await expect(
        d.service.createSchedule('u1', { code: 'PS-1' } as any, actor),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('creates a schedule for an active unit', async () => {
      const d = build();
      d.unitsRepo.findById.mockResolvedValue(activeUnit);
      d.schedulesRepo.findByCode.mockResolvedValue(null);
      d.schedulesRepo.create.mockReturnValue({ id: 'ps1', code: 'PS-1', statusConceptId: DUNIT.SCHEDULE_ACTIVE });
      const res = await d.service.createSchedule('u1', { code: 'PS-1' } as any, actor);
      expect(res).toEqual({ id: 'ps1', code: 'PS-1', status: DUNIT.SCHEDULE_ACTIVE });
    });
  });

  describe('addStudyPrice (UC-23-07)', () => {
    it('rejects when the offering belongs to another unit (precondition)', async () => {
      const d = build();
      d.schedulesRepo.findById.mockResolvedValue({ id: 'ps1', diagnosticUnitId: 'u1', statusConceptId: DUNIT.SCHEDULE_ACTIVE });
      d.offeringsRepo.findById.mockResolvedValue({ id: 'o1', diagnosticUnitId: 'other' });
      await expect(
        d.service.addStudyPrice('ps1', { diagnosticStudyOfferingId: 'o1', baseAmount: '10' } as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('versions append-only: closes current active and creates next version', async () => {
      const d = build();
      d.schedulesRepo.findById.mockResolvedValue({ id: 'ps1', diagnosticUnitId: 'u1', statusConceptId: DUNIT.SCHEDULE_ACTIVE });
      d.offeringsRepo.findById.mockResolvedValue({ id: 'o1', diagnosticUnitId: 'u1' });
      const current = { effectiveTo: undefined, statusConceptId: DUNIT.PRICE_ACTIVE };
      d.pricesRepo.findActive.mockResolvedValue(current);
      d.pricesRepo.maxVersion.mockResolvedValue(2);
      d.pricesRepo.create.mockReturnValue({ id: 'pr3', versionNumber: 3, statusConceptId: DUNIT.PRICE_ACTIVE, effectiveFrom: new Date() });

      const res = await d.service.addStudyPrice(
        'ps1',
        { diagnosticStudyOfferingId: 'o1', baseAmount: '120.00' } as any,
        actor,
      );
      expect(res.versionNumber).toBe(3);
      expect(current.statusConceptId).toBe(DUNIT.PRICE_SUPERSEDED);
      expect(current.effectiveTo).toBeDefined();
      expect(d.pricesRepo.create).toHaveBeenCalled();
    });

    it('throws when the schedule does not exist', async () => {
      const d = build();
      d.schedulesRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.addStudyPrice('missing', { diagnosticStudyOfferingId: 'o1', baseAmount: '10' } as any, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('closePrice (UC-23-08)', () => {
    it('rejects closing a price that is not active/open (precondition)', async () => {
      const d = build();
      d.pricesRepo.findById.mockResolvedValue({ id: 'pr1', statusConceptId: DUNIT.PRICE_ACTIVE, effectiveTo: new Date() });
      await expect(d.service.closePrice('pr1', actor)).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
    });

    it('closes an active open price (retires it, append-only)', async () => {
      const d = build();
      const price = { id: 'pr1', statusConceptId: DUNIT.PRICE_ACTIVE, effectiveTo: undefined };
      d.pricesRepo.findById.mockResolvedValue(price);
      const res = await d.service.closePrice('pr1', actor);
      expect(res).toEqual({ ok: true });
      expect(price.statusConceptId).toBe(DUNIT.PRICE_RETIRED);
      expect(price.effectiveTo).toBeDefined();
    });
  });
});
