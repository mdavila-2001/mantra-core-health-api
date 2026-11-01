import { jest } from '@jest/globals';
import { OrganizationUserAssignmentsRepository } from './organization-user-assignments.repository';
import { OrganizationUserAssignments } from '../entities';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

describe('OrganizationUserAssignmentsRepository', () => {
  const repo = new OrganizationUserAssignmentsRepository();

  describe('findMembershipTenantId', () => {
    it('reads the tenant from directory.tenant_memberships', async () => {
      const em = { execute: mockFn().mockResolvedValue([{ tenant_id: 't1' }]) };
      await expect(repo.findMembershipTenantId(em as any, 'm1')).resolves.toBe(
        't1',
      );
      expect(em.execute).toHaveBeenCalledWith(
        'SELECT tenant_id FROM directory.tenant_memberships WHERE id = ?',
        ['m1'],
        'all',
      );
    });

    it('returns null when the membership does not exist', async () => {
      const em = { execute: mockFn().mockResolvedValue([]) };
      await expect(
        repo.findMembershipTenantId(em as any, 'missing'),
      ).resolves.toBeNull();
    });
  });

  describe('create', () => {
    it('maps tenantId onto the entity', () => {
      const em = { create: mockFn((_e: unknown, data: unknown) => data) };
      repo.create(em as any, {
        tenantId: 't1',
        tenantMembershipId: 'm1',
        assignmentRoleConceptId: 'role',
        accessScopeConceptId: 'scope',
        statusConceptId: 'active',
        actorUserId: 'u1',
      });
      expect(em.create).toHaveBeenCalledWith(
        OrganizationUserAssignments,
        expect.objectContaining({ tenantId: 't1', tenantMembershipId: 'm1' }),
        { partial: true },
      );
    });
  });
});
