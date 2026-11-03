import { jest } from '@jest/globals';
import { SupportStaffService } from './support-staff.service';
import type { SupportLinkRow } from '../domain/support-links';
import type { AuthenticatedUser } from '../../../common';

// Alias con tipado laxo: evita el 'never' que @jest/globals infiere para jest.fn() en ESM.
const fn = jest.fn as unknown as (impl?: (...a: any[]) => any) => any;

const SECRETARY: AuthenticatedUser = {
  id: 'user-secretary',
  roles: ['USER', 'SUPPORT_STAFF'],
};
const ADMIN: AuthenticatedUser = { id: 'user-admin', roles: ['USER'] };
const DOCTOR: AuthenticatedUser = {
  id: 'user-doctor',
  roles: ['USER', 'PRACTITIONER'],
  practitionerProfileId: 'doc-profile',
};

function row(over: Partial<SupportLinkRow> = {}): SupportLinkRow {
  return {
    id: 'link-1',
    kind: 'LOCATION',
    tenantId: 'tenant-a',
    organizationName: 'Hospital A',
    supportUserId: SECRETARY.id,
    supportPersonId: 'person-secretary',
    supportName: 'Ana',
    status: 'PENDING',
    createdByUserId: SECRETARY.id,
    initiatedBy: 'SUPPORT_STAFF',
    createdAt: new Date('2026-10-31T10:00:00Z'),
    practiceSiteId: null,
    clinicalUnitId: null,
    careSpaceId: 'floor-1',
    practitionerRoleAssignmentId: null,
    practitionerProfileId: null,
    practitionerUserId: null,
    targetName: 'Piso 1',
    ...over,
  };
}

function build(links: SupportLinkRow[] = []) {
  const tx = { flush: fn().mockResolvedValue(undefined) };
  const em = {
    fork: fn(() => tx),
    transactional: fn((cb: (t: unknown) => unknown) => cb(tx)),
  };
  const repo = {
    findLinks: fn(async (_em: unknown, filter: any) =>
      links.filter(
        (link) =>
          (!filter.id || link.id === filter.id) &&
          (!filter.supportUserId ||
            link.supportUserId === filter.supportUserId) &&
          (!filter.tenantId || link.tenantId === filter.tenantId) &&
          (!filter.practitionerProfileId ||
            link.practitionerProfileId === filter.practitionerProfileId) &&
          (!filter.statuses || filter.statuses.includes(link.status)),
      ),
    ),
    findSecretaryPersonId: fn().mockResolvedValue('person-secretary'),
    findSecretaryByNationalId: fn().mockResolvedValue({
      userId: SECRETARY.id,
      personId: 'person-secretary',
    }),
    isOrganizationAdmin: fn(
      async (_em: unknown, tenantId: string, userId: string) =>
        tenantId === 'tenant-a' && userId === ADMIN.id,
    ),
    findOrganizationName: fn(async (_em: unknown, tenantId: string) =>
      tenantId === 'tenant-a' ? 'Hospital A' : undefined,
    ),
    findSiteInTenant: fn().mockResolvedValue(null),
    findUnitInTenant: fn().mockResolvedValue(null),
    findSpaceInTenant: fn(
      async (_em: unknown, tenantId: string, spaceId: string) =>
        tenantId === 'tenant-a' && spaceId === 'floor-2'
          ? {
              practiceId: 'pr-1',
              practiceSiteId: 'site-1',
              clinicalUnitId: null,
            }
          : null,
    ),
    findActiveRoleAssignmentInTenant: fn(
      async (_em: unknown, tenantId: string, id: string) =>
        tenantId === 'tenant-a' && id === 'pra-1'
          ? { practitionerProfileId: 'doc-profile' }
          : null,
    ),
    findActiveRoleAssignmentsOfPractitioner: fn().mockResolvedValue([
      { id: 'pra-1', tenantId: 'tenant-a' },
    ]),
    findCatalog: fn().mockResolvedValue({
      sites: [],
      services: [],
      floors: [],
      practitioners: [],
    }),
    findPractitionerAgenda: fn().mockResolvedValue([]),
    findActiveMembershipTenantIds: fn().mockResolvedValue([]),
    findOrCreateMembership: fn().mockResolvedValue({ id: 'membership-1' }),
    activateMembership: fn().mockResolvedValue(undefined),
    closeMembershipIfUnused: fn().mockResolvedValue(undefined),
    createLocationLink: fn(async () => ({ id: 'new-location' })),
    createPractitionerLink: fn(async () => ({ id: 'new-practitioner' })),
    setStatus: fn().mockResolvedValue(undefined),
  };
  const logger = { setContext: fn(), info: fn(), warn: fn() };
  const service = new SupportStaffService(
    em as any,
    repo as any,
    logger as any,
  );
  return { service, repo };
}

describe('SupportStaffService', () => {
  describe('la secretaria pide', () => {
    it('sin perfil de secretaria responde 403 y no escribe nada', async () => {
      const { service, repo } = build();
      repo.findSecretaryPersonId.mockResolvedValue(null);
      await expect(
        service.request(
          {
            tenantId: 'tenant-a',
            items: [{ targetKind: 'SPACE', careSpaceId: 'floor-2' }],
          },
          SECRETARY,
        ),
      ).rejects.toMatchObject({ reason: 'SUPPORT_PROFILE_REQUIRED' });
      expect(repo.createLocationLink).not.toHaveBeenCalled();
    });

    it('un piso de otro hospital responde 404 como uno inexistente', async () => {
      const { service, repo } = build();
      await expect(
        service.request(
          {
            tenantId: 'tenant-a',
            items: [{ targetKind: 'SPACE', careSpaceId: 'floor-de-otro' }],
          },
          SECRETARY,
        ),
      ).rejects.toMatchObject({ reason: 'SUPPORT_TARGET_NOT_FOUND' });
      expect(repo.findOrCreateMembership).not.toHaveBeenCalled();
    });

    it('crea un vínculo PENDING por objetivo, con su membresía todavía cerrada', async () => {
      const { service, repo } = build();
      await service.request(
        {
          tenantId: 'tenant-a',
          items: [
            { targetKind: 'SPACE', careSpaceId: 'floor-2' },
            {
              targetKind: 'PRACTITIONER',
              practitionerRoleAssignmentId: 'pra-1',
            },
          ],
        },
        SECRETARY,
      );
      expect(repo.findOrCreateMembership).toHaveBeenCalledWith(
        expect.anything(),
        SECRETARY.id,
        'tenant-a',
        SECRETARY.id,
      );
      expect(repo.createLocationLink).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          tenantId: 'tenant-a',
          tenantMembershipId: 'membership-1',
          careSpaceId: 'floor-2',
          practiceSiteId: undefined,
          initiatedBy: 'SUPPORT_STAFF',
          actorUserId: SECRETARY.id,
        }),
      );
      expect(repo.createPractitionerLink).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          practitionerRoleAssignmentId: 'pra-1',
          supportPersonId: 'person-secretary',
        }),
      );
      expect(repo.activateMembership).not.toHaveBeenCalled();
    });

    it('no repite un objetivo que ya tiene un vínculo vivo', async () => {
      const { service } = build([row({ careSpaceId: 'floor-2' })]);
      await expect(
        service.request(
          {
            tenantId: 'tenant-a',
            items: [{ targetKind: 'SPACE', careSpaceId: 'floor-2' }],
          },
          SECRETARY,
        ),
      ).rejects.toMatchObject({ reason: 'SUPPORT_LINK_DUPLICATE' });
    });

    it('no puede aceptar su propio pedido', async () => {
      const { service, repo } = build([row()]);
      await expect(
        service.confirmMine('link-1', SECRETARY),
      ).rejects.toMatchObject({ reason: 'SUPPORT_LINK_NOT_AWAITING_YOU' });
      expect(repo.setStatus).not.toHaveBeenCalled();
    });
  });

  describe('el hospital decide', () => {
    it('aceptar activa el vínculo y abre la membresía', async () => {
      const { service, repo } = build([row()]);
      const view = await service.decideForOrganization(
        'tenant-a',
        'link-1',
        { decision: 'APPROVED' },
        ADMIN,
      );
      expect(view.status).toBe('ACTIVE');
      expect(view.awaiting).toBeNull();
      expect(repo.setStatus).toHaveBeenCalledWith(
        expect.anything(),
        'LOCATION',
        'link-1',
        'ACTIVE',
        ADMIN.id,
      );
      expect(repo.activateMembership).toHaveBeenCalledWith(
        expect.anything(),
        SECRETARY.id,
        'tenant-a',
        ADMIN.id,
      );
    });

    it('rechazar no abre nada y cierra la membresía si quedó sin uso', async () => {
      const { service, repo } = build([row()]);
      await service.decideForOrganization(
        'tenant-a',
        'link-1',
        { decision: 'REJECTED' },
        ADMIN,
      );
      expect(repo.activateMembership).not.toHaveBeenCalled();
      expect(repo.closeMembershipIfUnused).toHaveBeenCalled();
    });

    it('un miembro que no administra no puede invitar: no queda vínculo «del hospital»', async () => {
      const { service, repo } = build();
      await expect(
        service.inviteForOrganization(
          'tenant-a',
          {
            nationalId: '7654321',
            items: [{ targetKind: 'SPACE', careSpaceId: 'floor-2' }],
          },
          DOCTOR,
        ),
      ).rejects.toMatchObject({
        reason: 'SUPPORT_ORGANIZATION_ADMIN_REQUIRED',
      });
      expect(repo.createLocationLink).not.toHaveBeenCalled();
    });

    it('la invitación del administrador queda guardada como ORGANIZATION', async () => {
      const { service, repo } = build();
      await service.inviteForOrganization(
        'tenant-a',
        {
          nationalId: '7654321',
          items: [{ targetKind: 'SPACE', careSpaceId: 'floor-2' }],
        },
        ADMIN,
      );
      expect(repo.createLocationLink).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ initiatedBy: 'ORGANIZATION' }),
      );
    });

    it('quien no administra el hospital recibe 403', async () => {
      const { service, repo } = build([row()]);
      await expect(
        service.decideForOrganization(
          'tenant-a',
          'link-1',
          { decision: 'APPROVED' },
          DOCTOR,
        ),
      ).rejects.toMatchObject({
        reason: 'SUPPORT_ORGANIZATION_ADMIN_REQUIRED',
      });
      expect(repo.setStatus).not.toHaveBeenCalled();
    });

    it('un vínculo de otro hospital responde 404', async () => {
      const { service } = build([row({ tenantId: 'tenant-b' })]);
      await expect(
        service.decideForOrganization(
          'tenant-a',
          'link-1',
          { decision: 'APPROVED' },
          ADMIN,
        ),
      ).rejects.toMatchObject({ reason: 'SUPPORT_LINK_NOT_FOUND' });
    });

    it('lo que invitó el hospital lo acepta la secretaria, no el hospital', async () => {
      const invited = row({
        createdByUserId: ADMIN.id,
        initiatedBy: 'ORGANIZATION',
      });
      const { service, repo } = build([invited]);
      await expect(
        service.decideForOrganization(
          'tenant-a',
          'link-1',
          { decision: 'APPROVED' },
          ADMIN,
        ),
      ).rejects.toMatchObject({ reason: 'SUPPORT_LINK_NOT_AWAITING_YOU' });
      const view = await service.confirmMine('link-1', SECRETARY);
      expect(view.status).toBe('ACTIVE');
      expect(repo.activateMembership).toHaveBeenCalled();
    });
  });

  describe('el doctor decide', () => {
    const pending = row({
      kind: 'PRACTITIONER',
      careSpaceId: null,
      practitionerRoleAssignmentId: 'pra-1',
      practitionerProfileId: 'doc-profile',
      practitionerUserId: DOCTOR.id,
    });

    it('acepta a la secretaria que pidió asistirlo', async () => {
      const { service, repo } = build([pending]);
      const view = await service.acceptForPractitioner('link-1', DOCTOR);
      expect(view.status).toBe('ACTIVE');
      expect(repo.setStatus).toHaveBeenCalledWith(
        expect.anything(),
        'PRACTITIONER',
        'link-1',
        'ACTIVE',
        DOCTOR.id,
      );
    });

    it('la aceptación del doctor solo NO mete a la secretaria en el hospital', async () => {
      const { service, repo } = build([pending]);
      await service.acceptForPractitioner('link-1', DOCTOR);
      expect(repo.activateMembership).not.toHaveBeenCalled();
      expect(repo.findOrCreateMembership).not.toHaveBeenCalled();
    });

    it('tampoco cuando la invitó el doctor y ella aceptó', async () => {
      const { service, repo } = build([
        { ...pending, createdByUserId: DOCTOR.id, initiatedBy: 'PRACTITIONER' },
      ]);
      const view = await service.confirmMine('link-1', SECRETARY);
      expect(view.status).toBe('ACTIVE');
      expect(repo.activateMembership).not.toHaveBeenCalled();
    });

    it('si la acepta la administración del hospital, sí abre la membresía', async () => {
      const { service, repo } = build([pending]);
      await service.decideForOrganization(
        'tenant-a',
        'link-1',
        { decision: 'APPROVED' },
        ADMIN,
      );
      expect(repo.activateMembership).toHaveBeenCalledWith(
        expect.anything(),
        SECRETARY.id,
        'tenant-a',
        ADMIN.id,
      );
    });

    it('otro doctor no la ve: 404', async () => {
      const { service } = build([pending]);
      await expect(
        service.acceptForPractitioner('link-1', {
          ...DOCTOR,
          id: 'otro',
          practitionerProfileId: 'otro-profile',
        }),
      ).rejects.toMatchObject({ reason: 'SUPPORT_LINK_NOT_FOUND' });
    });
  });

  describe('alcance', () => {
    it('la agenda de un doctor sin vínculo activo responde 403', async () => {
      const { service, repo } = build([
        row({
          kind: 'PRACTITIONER',
          careSpaceId: null,
          practitionerRoleAssignmentId: 'pra-1',
          status: 'PENDING',
        }),
      ]);
      await expect(
        service.agenda(
          {
            tenantId: 'tenant-a',
            practitionerRoleAssignmentId: 'pra-1',
            from: '2026-11-01T00:00:00Z',
            to: '2026-11-08T00:00:00Z',
          },
          SECRETARY,
        ),
      ).rejects.toMatchObject({ reason: 'SUPPORT_SCOPE_DENIED' });
      expect(repo.findPractitionerAgenda).not.toHaveBeenCalled();
    });

    it('con vínculo activo lee la agenda de ese doctor', async () => {
      const { service, repo } = build([
        row({
          kind: 'PRACTITIONER',
          careSpaceId: null,
          practitionerRoleAssignmentId: 'pra-1',
          status: 'ACTIVE',
        }),
      ]);
      await service.agenda(
        {
          tenantId: 'tenant-a',
          practitionerRoleAssignmentId: 'pra-1',
          from: '2026-11-01T00:00:00Z',
          to: '2026-11-08T00:00:00Z',
        },
        SECRETARY,
      );
      expect(repo.findPractitionerAgenda).toHaveBeenCalledWith(
        expect.anything(),
        'tenant-a',
        'doc-profile',
        new Date('2026-11-01T00:00:00Z'),
        new Date('2026-11-08T00:00:00Z'),
      );
    });

    it('un rango de más de 31 días se rechaza', async () => {
      const { service } = build();
      await expect(
        service.agenda(
          {
            tenantId: 'tenant-a',
            practitionerRoleAssignmentId: 'pra-1',
            from: '2026-11-01T00:00:00Z',
            to: '2026-12-15T00:00:00Z',
          },
          SECRETARY,
        ),
      ).rejects.toMatchObject({ reason: 'SUPPORT_AGENDA_RANGE_INVALID' });
    });

    it('/me/support-access sólo cuenta vínculos activos', async () => {
      const { service } = build([
        row({ id: 'a', status: 'ACTIVE', careSpaceId: 'floor-1' }),
        row({ id: 'b', status: 'PENDING', careSpaceId: 'floor-9' }),
      ]);
      const access = await service.myAccess(SECRETARY);
      expect(access.tenants).toHaveLength(1);
      expect(access.tenants[0].careSpaceIds).toEqual(['floor-1']);
      expect(access.tenants[0].organizationAccess).toBe(false);
    });

    it('terminar un vínculo cierra la membresía si fue el último', async () => {
      const { service, repo } = build([row({ status: 'ACTIVE' })]);
      const view = await service.leaveMine('link-1', SECRETARY);
      expect(view.status).toBe('ENDED');
      expect(repo.closeMembershipIfUnused).toHaveBeenCalledWith(
        expect.anything(),
        SECRETARY.id,
        'tenant-a',
        SECRETARY.id,
      );
    });
  });
});
