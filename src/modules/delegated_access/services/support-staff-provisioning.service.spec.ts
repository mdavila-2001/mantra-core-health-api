import { jest } from '@jest/globals';
import {
  ConflictException,
  DomainException,
  ResourceNotFoundException,
} from '../../../common';
import { SupportStaffProvisioningService } from './support-staff-provisioning.service';

const fn = jest.fn as unknown as (impl?: (...a: any[]) => any) => any;

describe('SupportStaffProvisioningService', () => {
  let service: SupportStaffProvisioningService;
  let mockEm: any;
  let mockIamSupportStaff: any;
  let mockProvisioningRepo: any;
  let mockSupportLinksRepo: any;
  let mockLogger: any;

  beforeEach(() => {
    mockEm = {
      fork: fn().mockReturnThis(),
      transactional: fn().mockImplementation(async (cb: any) => cb(mockEm)),
    };
    mockIamSupportStaff = {
      register: fn(),
    };
    mockProvisioningRepo = {
      findActiveRoleAssignmentOfPractitioner: fn(),
      createActivePractitionerLink: fn(),
      createActiveLocationLink: fn(),
      ensureActiveTenantMembership: fn(),
    };
    mockSupportLinksRepo = {
      isOrganizationAdmin: fn(),
      findSecretaryByNationalId: fn(),
      findLinks: fn().mockResolvedValue([]),
    };
    mockLogger = {
      setContext: fn(),
      info: fn(),
      warn: fn(),
      error: fn(),
    };

    service = new SupportStaffProvisioningService(
      mockEm,
      mockIamSupportStaff,
      mockProvisioningRepo,
      mockSupportLinksRepo,
      mockLogger,
    );
  });

  describe('provisionForPractitioner', () => {
    const actor = {
      id: 'doctor-user-1',
      practitionerProfileId: 'prac-prof-1',
      roles: ['PRACTITIONER'],
    } as any;

    const dto = {
      nationalId: '1234567',
      issuerAdministrativeAreaConceptId: 'sc-uuid',
      password: 'SecretPassword123!',
      name: 'Maria',
      lastName: 'Perez',
      email: 'maria.perez@example.com',
      phone: '+59171234567',
      practitionerRoleAssignmentId: 'role-assign-1',
    } as any;

    it('falla con 403 si el actor no tiene practitionerProfileId', async () => {
      await expect(
        service.provisionForPractitioner(dto, {
          ...actor,
          practitionerProfileId: undefined,
        }),
      ).rejects.toThrow(DomainException);
    });

    it('falla con 404 si la vinculación no existe o no pertenece al doctor', async () => {
      mockProvisioningRepo.findActiveRoleAssignmentOfPractitioner.mockResolvedValue(
        null,
      );

      await expect(
        service.provisionForPractitioner(dto, actor),
      ).rejects.toThrow(ResourceNotFoundException);
    });

    it('crea la cuenta y el vínculo activo de inmediato si todo es válido', async () => {
      mockProvisioningRepo.findActiveRoleAssignmentOfPractitioner.mockResolvedValue(
        {
          id: 'role-assign-1',
          tenantId: 'tenant-hospital-1',
          organizationName: 'Hospital Central',
        },
      );
      mockIamSupportStaff.register.mockResolvedValue({
        userId: 'sec-user-1',
        personId: 'sec-person-1',
        supportProfileId: 'sec-person-1',
      });
      mockProvisioningRepo.createActivePractitionerLink.mockResolvedValue({
        id: 'link-uuid-1',
      });

      const res = await service.provisionForPractitioner(dto, actor);

      expect(res).toEqual({
        userId: 'sec-user-1',
        personId: 'sec-person-1',
        supportProfileId: 'sec-person-1',
        linkId: 'link-uuid-1',
        status: 'ACTIVE',
        organizationName: 'Hospital Central',
      });
      expect(
        mockProvisioningRepo.createActivePractitionerLink,
      ).toHaveBeenCalledWith(
        mockEm,
        expect.objectContaining({
          practitionerRoleAssignmentId: 'role-assign-1',
          supportPersonId: 'sec-person-1',
          actorUserId: 'doctor-user-1',
        }),
      );
      expect(
        mockProvisioningRepo.ensureActiveTenantMembership,
      ).toHaveBeenCalledWith(
        mockEm,
        expect.objectContaining({
          userId: 'sec-user-1',
          tenantId: 'tenant-hospital-1',
          actorUserId: 'doctor-user-1',
        }),
      );
    });

    it('rechaza con 409 si la secretaria ya estaba vinculada a esa vinculación', async () => {
      mockProvisioningRepo.findActiveRoleAssignmentOfPractitioner.mockResolvedValue(
        {
          id: 'role-assign-1',
          tenantId: 'tenant-hospital-1',
        },
      );
      mockIamSupportStaff.register.mockResolvedValue({
        userId: 'sec-user-1',
        personId: 'sec-person-1',
        supportProfileId: 'sec-person-1',
      });
      mockSupportLinksRepo.findLinks.mockResolvedValue([
        { practitionerRoleAssignmentId: 'role-assign-1', status: 'ACTIVE' },
      ]);

      await expect(
        service.provisionForPractitioner(dto, actor),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('provisionForOrganization', () => {
    const actor = {
      id: 'admin-user-1',
      roles: ['USER'],
    } as any;

    const dto = {
      nationalId: '7654321',
      issuerAdministrativeAreaConceptId: 'lp-uuid',
      password: 'SecretPassword123!',
      name: 'Carla',
      lastName: 'Gomez',
      email: 'carla.gomez@example.com',
      phone: '+59172345678',
      practiceSiteId: 'site-uuid-1',
    } as any;

    it('falla con 403 si el actor no es admin de la organización', async () => {
      mockSupportLinksRepo.isOrganizationAdmin.mockResolvedValue(false);

      await expect(
        service.provisionForOrganization('tenant-hospital-1', dto, actor),
      ).rejects.toThrow(DomainException);
    });

    it('crea la cuenta y el vínculo activo de organización si es admin', async () => {
      mockSupportLinksRepo.isOrganizationAdmin.mockResolvedValue(true);
      mockIamSupportStaff.register.mockResolvedValue({
        userId: 'sec-user-2',
        personId: 'sec-person-2',
        supportProfileId: 'sec-person-2',
      });
      mockProvisioningRepo.ensureActiveTenantMembership.mockResolvedValue({
        id: 'membership-uuid-1',
      });
      mockProvisioningRepo.createActiveLocationLink.mockResolvedValue({
        id: 'link-org-uuid-1',
      });

      const res = await service.provisionForOrganization(
        'tenant-hospital-1',
        dto,
        actor,
      );

      expect(res).toEqual({
        userId: 'sec-user-2',
        personId: 'sec-person-2',
        supportProfileId: 'sec-person-2',
        linkId: 'link-org-uuid-1',
        status: 'ACTIVE',
      });
      expect(
        mockProvisioningRepo.ensureActiveTenantMembership,
      ).toHaveBeenCalledWith(
        mockEm,
        expect.objectContaining({
          userId: 'sec-user-2',
          tenantId: 'tenant-hospital-1',
        }),
      );
      expect(
        mockProvisioningRepo.createActiveLocationLink,
      ).toHaveBeenCalledWith(
        mockEm,
        expect.objectContaining({
          tenantId: 'tenant-hospital-1',
          tenantMembershipId: 'membership-uuid-1',
          practiceSiteId: 'site-uuid-1',
        }),
      );
    });
  });
});
