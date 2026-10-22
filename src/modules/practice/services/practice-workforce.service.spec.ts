import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { PracticeWorkforceService } from './practice-workforce.service';
import { PRAC } from '../practice.concepts';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const forked = { find: mockFn().mockResolvedValue([]) };
  const em = {
    transactional: mockFn((cb: any) => cb(tx)),
    fork: mockFn(() => forked),
  };
  const practicesRepo = { findById: mockFn() };
  const sitesRepo = { findById: mockFn() };
  const rolesRepo = {
    findById: mockFn(),
    create: mockFn(),
    findByPractitioner: mockFn(),
    findByPracticePage: mockFn().mockResolvedValue([]),
  };
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
  return {
    service,
    tx,
    forked,
    practicesRepo,
    sitesRepo,
    rolesRepo,
    supportRepo,
  };
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

  describe('listMyAssignments (Carril 18)', () => {
    const professional = { id: 'u1', practitionerProfileId: 'hp1' } as any;

    it('rejects when the actor has no practitioner profile', async () => {
      const d = build();
      await expect(
        d.service.listMyAssignments({ id: 'u1' } as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('attaches the organization logo from its public profile, keyed by practiceId', async () => {
      const d = build();
      d.rolesRepo.findByPractitioner.mockResolvedValue([
        {
          id: 'r1',
          practiceId: 'p1',
          roleConceptId: 'role-attending',
          statusConceptId: PRAC.ROLE_ASSIGNMENT_ACTIVE,
          isPrimary: true,
          createdAt: new Date('2026-01-01'),
        },
      ]);
      d.practicesRepo.findById.mockResolvedValue({
        id: 'p1',
        name: 'Hospital Central',
        typeConceptId: 'org-hospital',
      });
      d.forked.find.mockResolvedValue([
        { targetId: 'p1', avatarFileId: 'file-1' },
      ]);

      const [row] = await d.service.listMyAssignments(professional);

      expect(row.avatarUrl).toBe('/public/media/file-1');
    });

    it('has no logo when the organization never published a public profile', async () => {
      const d = build();
      d.rolesRepo.findByPractitioner.mockResolvedValue([
        {
          id: 'r1',
          practiceId: 'p1',
          roleConceptId: 'role-attending',
          statusConceptId: PRAC.ROLE_ASSIGNMENT_PENDING,
          isPrimary: false,
          createdAt: new Date('2026-01-01'),
        },
      ]);
      d.practicesRepo.findById.mockResolvedValue({
        id: 'p1',
        name: 'Hospital Central',
        typeConceptId: 'org-hospital',
      });
      d.forked.find.mockResolvedValue([]);

      const [row] = await d.service.listMyAssignments(professional);

      expect(row.avatarUrl).toBeNull();
    });
  });

  describe('listPracticeAssignments (CV-14)', () => {
    it('throws 404 without distinguishing "does not exist" from "another tenant" (isolation)', async () => {
      const d = build();
      d.practicesRepo.findById.mockResolvedValue({
        id: 'p1',
        tenantId: 'tenant-b',
      });
      await expect(
        d.service.listPracticeAssignments('p1', 'tenant-a', {}),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      expect(d.rolesRepo.findByPracticePage).not.toHaveBeenCalled();
    });

    it('lists a page scoped to the practice, with a cursor when there is more', async () => {
      const d = build();
      d.practicesRepo.findById.mockResolvedValue({
        id: 'p1',
        tenantId: 'tenant-a',
      });
      const row = (id: string) => ({
        id,
        practiceId: 'p1',
        practitionerProfileId: 'pp-1',
        statusConceptId: PRAC.ROLE_ASSIGNMENT_PENDING,
        createdAt: new Date('2026-01-01'),
      });
      d.rolesRepo.findByPracticePage.mockResolvedValue([row('a'), row('b')]);

      const res = await d.service.listPracticeAssignments('p1', 'tenant-a', {
        limit: 1,
      });

      expect(d.rolesRepo.findByPracticePage).toHaveBeenCalledWith(
        d.forked,
        'p1',
        undefined,
        undefined,
        2,
      );
      expect(res.items).toHaveLength(1);
      expect(res.nextCursor).not.toBeNull();
    });
  });
});
