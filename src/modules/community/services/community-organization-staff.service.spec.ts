import { jest } from '@jest/globals';
import { CONCEPTS } from '../../../common';
import { COMM } from '../community.concepts';
import { DIR } from '../../directory/directory.concepts';
import { CommunityOrganizationStaffService } from './community-organization-staff.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

function build(tenantRows: number) {
  const em = { count: mockFn(async () => tenantRows) };
  const membershipsRepo = {
    findActiveByUserTenant: mockFn(async () => null),
    findByTenantAndStatus: mockFn(async () => []),
  };
  const service = new CommunityOrganizationStaffService(membershipsRepo as any);
  return { em, membershipsRepo, service };
}

const organization = (type = COMM.PROFILE_TARGET_PHARMACY) => ({
  targetId: 'tenant-1',
  targetTypeConceptId: type,
  statusConceptId: CONCEPTS.STATE_ACTIVE,
});

describe('CommunityOrganizationStaffService', () => {
  describe('isTenantBacked', () => {
    it('una vitrina de organización cuyo target_id es un tenant', async () => {
      const d = build(1);
      await expect(
        d.service.isTenantBacked(d.em as any, organization()),
      ).resolves.toBe(true);
    });

    it('una de tipo organización cuyo target_id no es un tenant (SupportAdmin, unidad diagnóstica)', async () => {
      const d = build(0);
      await expect(
        d.service.isTenantBacked(
          d.em as any,
          organization(COMM.PROFILE_TARGET_ORGANIZATION),
        ),
      ).resolves.toBe(false);
    });

    it('el perfil de una persona no consulta tenants', async () => {
      const d = build(1);
      await expect(
        d.service.isTenantBacked(
          d.em as any,
          organization(COMM.PROFILE_TARGET_USER),
        ),
      ).resolves.toBe(false);
      expect(d.em.count).not.toHaveBeenCalled();
    });
  });

  describe('canAdminister', () => {
    it.each([
      [DIR.ROLE_OWNER, true],
      [DIR.ROLE_ADMIN, true],
      [DIR.ROLE_STAFF, false],
      [DIR.ROLE_PRACTITIONER, false],
    ])('rol %s → %s', async (role, expected) => {
      const d = build(1);
      d.membershipsRepo.findActiveByUserTenant.mockResolvedValue({
        tenantRoleConceptId: role,
      });
      await expect(
        d.service.canAdminister(d.em as any, organization(), {
          id: 'u',
          roles: [],
        } as any),
      ).resolves.toBe(expected);
    });

    it('sin membresía activa, no', async () => {
      const d = build(1);
      await expect(
        d.service.canAdminister(d.em as any, organization(), {
          id: 'u',
          roles: [],
        } as any),
      ).resolves.toBe(false);
      expect(d.membershipsRepo.findActiveByUserTenant).toHaveBeenCalledWith(
        d.em,
        'u',
        'tenant-1',
        DIR.MEMBERSHIP_ACTIVE,
      );
    });
  });
});
