import { jest } from '@jest/globals';

// Loose-typed mock factory: keeps runtime 'jest' but avoids @jest/globals' strict typings.
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { DiagnosticUnitsService } from './diagnostic-units.service';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { DUNIT } from '../diagnostic_units.concepts';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = {
    transactional: mockFn((cb: any) => cb(tx)),
    fork: mockFn(() => em),
  };
  const unitsRepo = {
    findById: mockFn(),
    findByCode: mockFn(),
    create: mockFn(),
  };
  const sitesRepo = {
    findById: mockFn(),
    countActiveForUnit: mockFn(),
    create: mockFn(),
  };
  const specialtiesRepo = {
    findOpenForUnit: mockFn().mockResolvedValue([]),
    findOpenByConcept: mockFn().mockResolvedValue(null),
    create: mockFn(),
    verifyOpenForUnit: mockFn().mockResolvedValue(0),
  };
  const accreditationsRepo = {
    findById: mockFn(),
    create: mockFn(),
    verifyOpenForUnit: mockFn().mockResolvedValue(0),
  };
  const assignmentsRepo = {
    findActiveOverlap: mockFn().mockResolvedValue(null),
    create: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new DiagnosticUnitsService(
    em as any,
    unitsRepo,
    sitesRepo,
    specialtiesRepo,
    accreditationsRepo,
    assignmentsRepo as any,
    logger as any,
  );
  return {
    service,
    tx,
    em,
    unitsRepo,
    sitesRepo,
    specialtiesRepo,
    accreditationsRepo,
    assignmentsRepo,
  };
}

const activeUnit = () => ({
  id: 'u1',
  code: 'DU-1',
  name: 'Lab',
  statusConceptId: DUNIT.UNIT_ACTIVE,
  verificationStatusConceptId: DUNIT.VERIFICATION_PENDING,
  publicProfileId: undefined,
  updatedAt: new Date(),
});

describe('DiagnosticUnitsService', () => {
  describe('create (UC-23-01)', () => {
    it('creates the unit, flushes parent before children and returns counts', async () => {
      const d = build();
      d.unitsRepo.findByCode.mockResolvedValue(null);
      const unit = activeUnit();
      d.unitsRepo.create.mockReturnValue(unit);

      const res = await d.service.create(
        {
          tenantId: 't1',
          code: 'DU-1',
          name: 'Lab',
          sites: [{ practiceSiteId: 'ps1' }],
          accreditations: [{ accreditationConceptId: 'acc1' }],
        },
        actor,
      );

      expect(res.id).toBe('u1');
      expect(res.siteCount).toBe(1);
      expect(res.accreditationCount).toBe(1);
      expect(d.tx.flush).toHaveBeenCalledTimes(1);
      expect(d.sitesRepo.create).toHaveBeenCalledTimes(1);
      expect(d.accreditationsRepo.create).toHaveBeenCalledTimes(1);
    });

    it('rejects a duplicate code in the tenant (conflict)', async () => {
      const d = build();
      d.unitsRepo.findByCode.mockResolvedValue({ id: 'existing' });
      await expect(
        d.service.create(
          { tenantId: 't1', code: 'DU-1', name: 'Lab' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(d.unitsRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('addSite (UC-23-02)', () => {
    it('throws when the unit does not exist', async () => {
      const d = build();
      d.unitsRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.addSite('missing', { practiceSiteId: 'ps1' } as any, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('creates a site for an active unit', async () => {
      const d = build();
      d.unitsRepo.findById.mockResolvedValue(activeUnit());
      d.sitesRepo.create.mockReturnValue({
        id: 's1',
        statusConceptId: DUNIT.SITE_ACTIVE,
      });
      const res = await d.service.addSite(
        'u1',
        { practiceSiteId: 'ps1' },
        actor,
      );
      expect(res).toEqual({
        id: 's1',
        diagnosticUnitId: 'u1',
        status: DUNIT.SITE_ACTIVE,
      });
    });
  });

  describe('verifyAndPublish (UC-23-03)', () => {
    it('rejects when the unit has no active site (precondition 422)', async () => {
      const d = build();
      d.unitsRepo.findById.mockResolvedValue(activeUnit());
      d.sitesRepo.countActiveForUnit.mockResolvedValue(0);
      await expect(
        d.service.verifyAndPublish('u1', actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('verifies and assigns a public profile id', async () => {
      const d = build();
      const unit = activeUnit();
      d.unitsRepo.findById.mockResolvedValue(unit);
      d.sitesRepo.countActiveForUnit.mockResolvedValue(2);
      const res = await d.service.verifyAndPublish('u1', actor);
      expect(unit.verificationStatusConceptId).toBe(
        DUNIT.VERIFICATION_VERIFIED,
      );
      expect(res.publicProfileId).toBeDefined();
      expect(d.specialtiesRepo.verifyOpenForUnit).toHaveBeenCalled();
      expect(d.accreditationsRepo.verifyOpenForUnit).toHaveBeenCalled();
    });
  });

  describe('setSpecialties (UC-23-04)', () => {
    it('rejects more than one primary specialty', async () => {
      const d = build();
      await expect(
        d.service.setSpecialties(
          'u1',
          {
            specialties: [
              { specialtyConceptId: 'a', isPrimary: true },
              { specialtyConceptId: 'b', isPrimary: true },
            ],
          } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('closes removed specialties and creates new ones', async () => {
      const d = build();
      d.unitsRepo.findById.mockResolvedValue(activeUnit());
      d.specialtiesRepo.findOpenForUnit.mockResolvedValue([
        { specialtyConceptId: 'old', validTo: null, updatedAt: new Date() },
      ]);
      d.specialtiesRepo.findOpenByConcept.mockResolvedValue(null);

      const res = await d.service.setSpecialties(
        'u1',
        {
          specialties: [{ specialtyConceptId: 'new', isPrimary: true }],
        },
        actor,
      );
      expect(res).toEqual({ active: 1, closed: 1 });
      expect(d.specialtiesRepo.create).toHaveBeenCalled();
    });
  });

  describe('assignPractitioner (UC-23-10)', () => {
    it('rejects an overlapping active assignment (conflict)', async () => {
      const d = build();
      d.unitsRepo.findById.mockResolvedValue(activeUnit());
      d.assignmentsRepo.findActiveOverlap.mockResolvedValue({ id: 'a1' });
      await expect(
        d.service.assignPractitioner(
          'u1',
          { practitionerRoleAssignmentId: 'pra1' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('creates the assignment and registers a new specialty', async () => {
      const d = build();
      d.unitsRepo.findById.mockResolvedValue(activeUnit());
      d.assignmentsRepo.create.mockReturnValue({
        id: 'a1',
        statusConceptId: DUNIT.ASSIGNMENT_ACTIVE,
      });
      d.specialtiesRepo.findOpenByConcept.mockResolvedValue(null);
      const res = await d.service.assignPractitioner(
        'u1',
        {
          practitionerRoleAssignmentId: 'pra1',
          specialtyConceptId: 'spec1',
        },
        actor,
      );
      expect(res).toEqual({ id: 'a1', status: DUNIT.ASSIGNMENT_ACTIVE });
      expect(d.specialtiesRepo.create).toHaveBeenCalled();
    });
  });

  describe('renewAccreditation (UC-23-11)', () => {
    it('throws when the accreditation does not exist', async () => {
      const d = build();
      d.accreditationsRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.renewAccreditation('missing', {} as any, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('closes the previous and creates a verified renewal', async () => {
      const d = build();
      const prev: any = {
        id: 'acc1',
        diagnosticUnitId: 'u1',
        accreditationConceptId: 'c1',
        updatedAt: new Date(),
      };
      d.accreditationsRepo.findById.mockResolvedValue(prev);
      d.accreditationsRepo.create.mockReturnValue({
        id: 'acc2',
        verificationStatusConceptId: '',
      });
      const res = await d.service.renewAccreditation('acc1', {}, actor);
      expect(prev.validTo).toBeDefined();
      expect(res.verificationStatus).toBe(DUNIT.VERIFICATION_VERIFIED);
    });
  });

  describe('reproject (UC-23-12)', () => {
    it('reports projected=true only for a verified unit with a public profile', async () => {
      const d = build();
      d.unitsRepo.findById.mockResolvedValue({
        id: 'u1',
        verificationStatusConceptId: DUNIT.VERIFICATION_VERIFIED,
        publicProfileId: 'pp1',
      });
      const res = await d.service.reproject('u1', actor);
      expect(res).toEqual({ diagnosticUnitId: 'u1', projected: true });
    });

    it('throws when the unit does not exist', async () => {
      const d = build();
      d.unitsRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.reproject('missing', actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });
});
