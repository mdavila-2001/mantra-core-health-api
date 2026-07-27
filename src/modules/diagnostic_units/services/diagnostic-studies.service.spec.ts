import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { DiagnosticStudiesService } from './diagnostic-studies.service';
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
  const offeringsRepo = {
    findById: mockFn(),
    findByStudyCode: mockFn(),
    create: mockFn(),
  };
  const componentsRepo = { create: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new DiagnosticStudiesService(
    em as any,
    unitsRepo as any,
    offeringsRepo,
    componentsRepo,
    logger as any,
  );
  return { service, tx, unitsRepo, offeringsRepo, componentsRepo };
}

const activeUnit = { id: 'u1', statusConceptId: DUNIT.UNIT_ACTIVE };

describe('DiagnosticStudiesService', () => {
  describe('createOffering (UC-23-05)', () => {
    it('rejects when the unit does not exist', async () => {
      const d = build();
      d.unitsRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.createOffering(
          'missing',
          { studyCode: 'S', studyConceptId: 'c', displayName: 'x' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rejects a duplicate study code (conflict)', async () => {
      const d = build();
      d.unitsRepo.findById.mockResolvedValue(activeUnit);
      d.offeringsRepo.findByStudyCode.mockResolvedValue({ id: 'e1' });
      await expect(
        d.service.createOffering(
          'u1',
          { studyCode: 'S', studyConceptId: 'c', displayName: 'x' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('creates the offering, flushes before components and returns count', async () => {
      const d = build();
      d.unitsRepo.findById.mockResolvedValue(activeUnit);
      d.offeringsRepo.findByStudyCode.mockResolvedValue(null);
      d.offeringsRepo.create.mockReturnValue({
        id: 'o1',
        studyCode: 'S',
        statusConceptId: DUNIT.OFFERING_ACTIVE,
      });
      const res = await d.service.createOffering(
        'u1',
        {
          studyCode: 'S',
          studyConceptId: 'c',
          displayName: 'x',
          components: [{ componentOfferingId: 'o2' }],
        },
        actor,
      );
      expect(res.componentCount).toBe(1);
      expect(d.tx.flush).toHaveBeenCalledTimes(1);
      expect(d.componentsRepo.create).toHaveBeenCalledTimes(1);
    });

    it('rejects a self-referencing panel component (precondition)', async () => {
      const d = build();
      d.unitsRepo.findById.mockResolvedValue(activeUnit);
      d.offeringsRepo.findByStudyCode.mockResolvedValue(null);
      d.offeringsRepo.create.mockReturnValue({
        id: 'o1',
        studyCode: 'S',
        statusConceptId: DUNIT.OFFERING_ACTIVE,
      });
      await expect(
        d.service.createOffering(
          'u1',
          {
            studyCode: 'S',
            studyConceptId: 'c',
            displayName: 'x',
            components: [{ componentOfferingId: 'o1' }],
          } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('retireOffering (UC-23-08)', () => {
    it('throws when the offering does not exist', async () => {
      const d = build();
      d.offeringsRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.retireOffering('missing', actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('soft-retires an active offering', async () => {
      const d = build();
      const offering = {
        id: 'o1',
        statusConceptId: DUNIT.OFFERING_ACTIVE,
        updatedAt: new Date(),
      };
      d.offeringsRepo.findById.mockResolvedValue(offering);
      const res = await d.service.retireOffering('o1', actor);
      expect(res).toEqual({ ok: true });
      expect(offering.statusConceptId).toBe(DUNIT.OFFERING_RETIRED);
    });

    it('rejects retiring an already-retired offering (conflict)', async () => {
      const d = build();
      d.offeringsRepo.findById.mockResolvedValue({
        id: 'o1',
        statusConceptId: DUNIT.OFFERING_RETIRED,
      });
      await expect(
        d.service.retireOffering('o1', actor),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });
});
