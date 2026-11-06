import { jest } from '@jest/globals';
import {
  ConflictException,
  DomainException,
  ResourceNotFoundException,
} from '../../../common';
import { DelegatedAccessErrorReason as Reason } from '../delegated_access.error-reasons';
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

    it('con RLS, fija el tenant de la vinculación antes de crear la membresía', async () => {
      const previous = process.env.RLS_ENFORCE;
      process.env.RLS_ENFORCE = 'true';
      try {
        const calls: string[] = [];
        mockEm.execute = fn().mockImplementation(
          async (sql: string, params?: unknown[]) => {
            calls.push(params ? `${sql} <- ${String(params)}` : sql);
            return [];
          },
        );
        mockEm.getTransactionContext = () => undefined;
        mockEm.isInTransaction = () => false;
        mockProvisioningRepo.findActiveRoleAssignmentOfPractitioner.mockResolvedValue(
          { id: 'role-assign-1', tenantId: 'tenant-hospital-1' },
        );
        mockIamSupportStaff.register.mockResolvedValue({
          userId: 'sec-user-1',
          personId: 'sec-person-1',
          supportProfileId: 'sec-person-1',
        });
        mockProvisioningRepo.ensureActiveTenantMembership.mockImplementation(
          async () => {
            calls.push('membership');
          },
        );
        mockProvisioningRepo.createActivePractitionerLink.mockResolvedValue({
          id: 'link-uuid-1',
        });

        await service.provisionForPractitioner(dto, actor);

        const membership = calls.indexOf('membership');
        expect(calls.slice(membership - 2, membership)).toEqual([
          "select set_config('app.system_context', 'false', true)",
          "select set_config('app.current_tenant_id', ?, true) <- tenant-hospital-1",
        ]);
      } finally {
        if (previous === undefined) delete process.env.RLS_ENFORCE;
        else process.env.RLS_ENFORCE = previous;
      }
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
  describe('D-1: la administración se contrasta con la organización del contexto', () => {
    const dto = {
      nationalId: '7654321',
      password: 'SecretPassword123!',
      practiceSiteId: 'site-uuid-1',
    } as any;
    const registered = () => {
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
    };

    it('un SECURITY_ADMIN acotado a la organización A no da de alta en B (aunque sea miembro de B)', async () => {
      mockSupportLinksRepo.isOrganizationAdmin.mockResolvedValue(false);
      registered();
      const actor = {
        id: 'admin-a',
        roles: ['SECURITY_ADMIN'],
        scopedRoles: { 'tenant-A': ['SECURITY_ADMIN'] },
      } as any;

      await expect(
        service.provisionForOrganization('tenant-B', dto, actor),
      ).rejects.toMatchObject({
        reason: Reason.SUPPORT_ORGANIZATION_ADMIN_REQUIRED,
      });
      expect(mockIamSupportStaff.register).not.toHaveBeenCalled();
      expect(
        mockProvisioningRepo.createActiveLocationLink,
      ).not.toHaveBeenCalled();
    });

    it('un SUPERADMIN acotado a A tampoco alcanza B', async () => {
      mockSupportLinksRepo.isOrganizationAdmin.mockResolvedValue(false);
      registered();
      const actor = {
        id: 'sa-a',
        roles: ['SUPERADMIN'],
        scopedRoles: { 'tenant-A': ['SUPERADMIN'] },
      } as any;

      await expect(
        service.provisionForOrganization('tenant-B', dto, actor),
      ).rejects.toThrow(DomainException);
      expect(mockIamSupportStaff.register).not.toHaveBeenCalled();
    });

    it('un SECURITY_ADMIN acotado a B da de alta en B', async () => {
      mockSupportLinksRepo.isOrganizationAdmin.mockResolvedValue(false);
      registered();
      const actor = {
        id: 'admin-b',
        roles: ['SECURITY_ADMIN'],
        scopedRoles: { 'tenant-B': ['SECURITY_ADMIN'] },
      } as any;

      const res = await service.provisionForOrganization(
        'tenant-B',
        dto,
        actor,
      );
      expect(res.linkId).toBe('link-org-uuid-1');
    });

    it('un SECURITY_ADMIN global (sin ámbito) sigue dando de alta', async () => {
      mockSupportLinksRepo.isOrganizationAdmin.mockResolvedValue(false);
      registered();
      const actor = { id: 'admin-g', roles: ['SECURITY_ADMIN'] } as any;

      const res = await service.provisionForOrganization(
        'tenant-B',
        dto,
        actor,
      );
      expect(res.linkId).toBe('link-org-uuid-1');
    });

    it('un SECURITY_ADMIN acotado a A que es OWNER/ADMIN de B por su membresía da de alta en B', async () => {
      mockSupportLinksRepo.isOrganizationAdmin.mockResolvedValue(true);
      registered();
      const actor = {
        id: 'admin-a',
        roles: ['SECURITY_ADMIN'],
        scopedRoles: { 'tenant-A': ['SECURITY_ADMIN'] },
      } as any;

      const res = await service.provisionForOrganization(
        'tenant-B',
        dto,
        actor,
      );
      expect(res.linkId).toBe('link-org-uuid-1');
      expect(mockSupportLinksRepo.isOrganizationAdmin).toHaveBeenCalledWith(
        mockEm,
        'tenant-B',
        'admin-a',
      );
    });
  });
});
