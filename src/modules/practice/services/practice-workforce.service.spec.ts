import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { PracticeWorkforceService } from './practice-workforce.service';
import { PRAC } from '../practice.concepts';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const practicesRepo = { findById: mockFn() };
  const sitesRepo = { findById: mockFn() };
  const rolesRepo = { findById: mockFn(), create: mockFn() };
  const supportRepo = { create: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new PracticeWorkforceService(
    em as any,
    practicesRepo as any,
    sitesRepo as any,
    rolesRepo as any,
    supportRepo as any,
    logger as any,
  );
  return { service, tx, practicesRepo, sitesRepo, rolesRepo, supportRepo };
}

describe('PracticeWorkforceService', () => {
  describe('assignRole (UC-14-08)', () => {
    it('rejects when the practice is not active', async () => {
      const d = build();
      d.practicesRepo.findById.mockResolvedValue({
        id: 'p1',
        statusConceptId: 'other',
      });
      await expect(
        d.service.assignRole(
          'p1',
          { practitionerProfileId: 'hp1' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('creates an active role assignment', async () => {
      const d = build();
      d.practicesRepo.findById.mockResolvedValue({
        id: 'p1',
        statusConceptId: PRAC.PRACTICE_ACTIVE,
      });
      const created = {
        id: 'r1',
        practiceId: 'p1',
        practitionerProfileId: 'hp1',
        statusConceptId: PRAC.ROLE_ASSIGNMENT_ACTIVE,
        createdAt: new Date(),
      };
      d.rolesRepo.create.mockReturnValue(created);
      const res = await d.service.assignRole(
        'p1',
        { practitionerProfileId: 'hp1' },
        actor,
      );
      expect(res.status).toBe(PRAC.ROLE_ASSIGNMENT_ACTIVE);
    });
  });

  describe('attachSupport (UC-14-09)', () => {
    it('throws when the parent role is missing', async () => {
      const d = build();
      d.rolesRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.attachSupport(
          'r1',
          { supportProfileId: 'sp1' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rejects when the parent role is not active', async () => {
      const d = build();
      d.rolesRepo.findById.mockResolvedValue({
        id: 'r1',
        statusConceptId: PRAC.ROLE_ASSIGNMENT_ENDED,
      });
      await expect(
        d.service.attachSupport(
          'r1',
          { supportProfileId: 'sp1' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('attaches support to an active role', async () => {
      const d = build();
      d.rolesRepo.findById.mockResolvedValue({
        id: 'r1',
        statusConceptId: PRAC.ROLE_ASSIGNMENT_ACTIVE,
      });
      const created = {
        id: 'sa1',
        practitionerRoleAssignmentId: 'r1',
        statusConceptId: PRAC.SUPPORT_ACTIVE,
        createdAt: new Date(),
      };
      d.supportRepo.create.mockReturnValue(created);
      const res = await d.service.attachSupport(
        'r1',
        { supportProfileId: 'sp1' },
        actor,
      );
      expect(res.status).toBe(PRAC.SUPPORT_ACTIVE);
    });
  });
});
