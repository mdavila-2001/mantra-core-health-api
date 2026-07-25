import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { DirectoryMembershipsService } from './directory-memberships.service';
import { DIR } from '../directory.concepts';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const membershipsRepo = {
    findActiveByUserTenant: mockFn(),
    findByIdInTenant: mockFn(),
    create: mockFn(),
  };
  const branchMembershipsRepo = {
    findByMembershipBranchStatus: mockFn(),
    findByMembershipAndStatus: mockFn().mockResolvedValue([]),
    create: mockFn(),
  };
  const branchesRepo = { findById: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new DirectoryMembershipsService(
    em as any,
    membershipsRepo as any,
    branchMembershipsRepo as any,
    branchesRepo as any,
    logger as any,
  );
  return { service, tx, membershipsRepo, branchMembershipsRepo, branchesRepo };
}

const activeMembership = (over: any = {}) => ({
  id: 'm1',
  userId: 'u1',
  tenantId: 't1',
  tenantRoleConceptId: DIR.ROLE_STAFF,
  accessScopeConceptId: DIR.SCOPE_ALL_TENANT,
  statusConceptId: DIR.MEMBERSHIP_ACTIVE,
  startDate: new Date(),
  updatedAt: new Date(),
  ...over,
});

describe('DirectoryMembershipsService', () => {
  describe('invite (UC-04-05)', () => {
    it('rejects a duplicated active membership (conflict)', async () => {
      const d = build();
      d.membershipsRepo.findActiveByUserTenant.mockResolvedValue({ id: 'm0' });
      await expect(
        d.service.invite('t1', { userId: 'u1' } as any, actor),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('creates an active membership with defaults', async () => {
      const d = build();
      d.membershipsRepo.findActiveByUserTenant.mockResolvedValue(null);
      d.membershipsRepo.create.mockReturnValue(activeMembership());

      const res = await d.service.invite('t1', { userId: 'u1' } as any, actor);

      expect(res.id).toBe('m1');
      expect(d.membershipsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          tenantRoleConceptId: DIR.ROLE_STAFF,
          accessScopeConceptId: DIR.SCOPE_ALL_TENANT,
          statusConceptId: DIR.MEMBERSHIP_ACTIVE,
        }),
      );
    });
  });

  describe('assignBranch (UC-04-06)', () => {
    it('throws when the membership is missing', async () => {
      const d = build();
      d.membershipsRepo.findByIdInTenant.mockResolvedValue(null);
      await expect(
        d.service.assignBranch('t1', 'm1', { branchId: 'b1' } as any, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rejects a branch of another tenant (precondition)', async () => {
      const d = build();
      d.membershipsRepo.findByIdInTenant.mockResolvedValue(activeMembership());
      d.branchesRepo.findById.mockResolvedValue({ id: 'b1', tenantId: 'OTHER' });
      await expect(
        d.service.assignBranch('t1', 'm1', { branchId: 'b1' } as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('assigns the branch and sets it as primary when it is the first', async () => {
      const d = build();
      const membership = activeMembership({ primaryBranchId: undefined });
      d.membershipsRepo.findByIdInTenant.mockResolvedValue(membership);
      d.branchesRepo.findById.mockResolvedValue({ id: 'b1', tenantId: 't1' });
      d.branchMembershipsRepo.findByMembershipBranchStatus.mockResolvedValue(null);
      d.branchMembershipsRepo.create.mockReturnValue({
        id: 'bm1',
        tenantMembershipId: 'm1',
        branchId: 'b1',
        localRoleConceptId: DIR.LOCAL_ROLE_STAFF,
        statusConceptId: DIR.BRANCH_MEMBERSHIP_ACTIVE,
      });

      const res = await d.service.assignBranch('t1', 'm1', { branchId: 'b1' } as any, actor);

      expect(res.id).toBe('bm1');
      expect(membership.primaryBranchId).toBe('b1');
      expect(d.tx.flush).toHaveBeenCalledTimes(1);
    });

    it('rejects a duplicated active assignment (conflict)', async () => {
      const d = build();
      d.membershipsRepo.findByIdInTenant.mockResolvedValue(activeMembership());
      d.branchesRepo.findById.mockResolvedValue({ id: 'b1', tenantId: 't1' });
      d.branchMembershipsRepo.findByMembershipBranchStatus.mockResolvedValue({ id: 'bm0' });
      await expect(
        d.service.assignBranch('t1', 'm1', { branchId: 'b1' } as any, actor),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('transfer (UC-04-07)', () => {
    it('closes the source assignment, opens the destination and moves primary', async () => {
      const d = build();
      const membership = activeMembership({ primaryBranchId: 'b1' });
      d.membershipsRepo.findByIdInTenant.mockResolvedValue(membership);
      d.branchesRepo.findById.mockResolvedValue({ id: 'b1', tenantId: 't1' });
      const source = { statusConceptId: DIR.BRANCH_MEMBERSHIP_ACTIVE, localRoleConceptId: 'lr', updatedAt: new Date() };
      d.branchMembershipsRepo.findByMembershipBranchStatus.mockResolvedValue(source);

      const res = await d.service.transfer(
        't1',
        'm1',
        { fromBranchId: 'b1', toBranchId: 'b2' } as any,
        actor,
      );

      expect(res).toEqual({ ok: true });
      expect(source.statusConceptId).toBe(DIR.BRANCH_MEMBERSHIP_ENDED);
      expect(membership.primaryBranchId).toBe('b2');
      expect(d.branchMembershipsRepo.create).toHaveBeenCalled();
    });

    it('throws when there is no active assignment on the source branch', async () => {
      const d = build();
      d.membershipsRepo.findByIdInTenant.mockResolvedValue(activeMembership());
      d.branchesRepo.findById.mockResolvedValue({ id: 'b', tenantId: 't1' });
      d.branchMembershipsRepo.findByMembershipBranchStatus.mockResolvedValue(null);
      await expect(
        d.service.transfer('t1', 'm1', { fromBranchId: 'b1', toBranchId: 'b2' } as any, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('changeRole (UC-04-08)', () => {
    it('rejects when neither role nor scope are provided (precondition)', async () => {
      const d = build();
      await expect(
        d.service.changeRole('t1', 'm1', {} as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('updates the role and scope of an active membership', async () => {
      const d = build();
      const membership = activeMembership();
      d.membershipsRepo.findByIdInTenant.mockResolvedValue(membership);

      const res = await d.service.changeRole(
        't1',
        'm1',
        { role: 'ADMIN', accessScope: 'BRANCH' } as any,
        actor,
      );

      expect(membership.tenantRoleConceptId).toBe(DIR.ROLE_ADMIN);
      expect(membership.accessScopeConceptId).toBe(DIR.SCOPE_BRANCH);
      expect(res.tenantRole).toBe(DIR.ROLE_ADMIN);
    });
  });

  describe('offboard (UC-04-09)', () => {
    it('ends the membership and cascades to its active branch assignments', async () => {
      const d = build();
      const membership = activeMembership();
      d.membershipsRepo.findByIdInTenant.mockResolvedValue(membership);
      const assignment = { statusConceptId: DIR.BRANCH_MEMBERSHIP_ACTIVE, updatedAt: new Date() };
      d.branchMembershipsRepo.findByMembershipAndStatus.mockResolvedValue([assignment]);

      const res = await d.service.offboard('t1', 'm1', actor);

      expect(res).toEqual({ ok: true });
      expect(membership.statusConceptId).toBe(DIR.MEMBERSHIP_ENDED);
      expect(membership.endDate).toBeInstanceOf(Date);
      expect(assignment.statusConceptId).toBe(DIR.BRANCH_MEMBERSHIP_ENDED);
    });

    it('rejects offboarding a non-active membership (precondition)', async () => {
      const d = build();
      d.membershipsRepo.findByIdInTenant.mockResolvedValue(
        activeMembership({ statusConceptId: DIR.MEMBERSHIP_ENDED }),
      );
      await expect(d.service.offboard('t1', 'm1', actor)).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
    });
  });
});
