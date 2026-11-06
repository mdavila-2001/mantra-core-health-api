import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { ResourceNotFoundException } from '../../../common';
import type { AuthenticatedUser } from '../../../common';
import { rlsFixture } from '../../../common/tenant/rls-transaction.testing';
import { PractitionerGovernanceService } from './practitioner-governance.service';
import { SupportStaffProvisioningService } from './support-staff-provisioning.service';
import { SupportStaffService } from './support-staff.service';

// Loose typing: avoids the 'never' that @jest/globals infers for jest.fn() in ESM.
const fn = jest.fn as unknown as (impl?: (...a: any[]) => any) => any;

const SYSTEM = "select set_config('app.system_context', 'true', true)";
const TENANT_OFF = "select set_config('app.system_context', 'false', true)";
const tenantSet = (id: string) =>
  `select set_config('app.current_tenant_id', ?, true) <- ${id}`;

const SECRETARY = {
  id: 'u-sec',
  roles: ['SUPPORT_STAFF'],
} as unknown as AuthenticatedUser;
const DOCTOR = {
  id: 'u-doc',
  roles: ['PRACTITIONER'],
  practitionerProfileId: 'pp-1',
} as unknown as AuthenticatedUser;

const NO_PROFILE = { id: 'u', roles: [] } as unknown as AuthenticatedUser;

describe('Mi equipo and secretary reads under RLS', () => {
  const previous = process.env.RLS_ENFORCE;
  beforeEach(() => {
    process.env.RLS_ENFORCE = 'true';
  });
  afterEach(() => {
    if (previous === undefined) delete process.env.RLS_ENFORCE;
    else process.env.RLS_ENFORCE = previous;
  });

  describe('SupportStaffService', () => {
    const activeLink = {
      id: 'l-1',
      kind: 'PRACTITIONER',
      tenantId: 'tenant-a',
      supportUserId: SECRETARY.id,
      practitionerRoleAssignmentId: 'pra-1',
      status: 'ACTIVE',
    };
    function build(f: ReturnType<typeof rlsFixture>, links: unknown[] = []) {
      const repo = {
        findLinks: fn().mockResolvedValue(links),
        findActiveMembershipTenantIds: fn().mockResolvedValue([]),
        findActiveRoleAssignmentInTenant: fn().mockResolvedValue({
          practitionerProfileId: 'doc-profile',
        }),
        findPractitionerAgenda: fn().mockResolvedValue([]),
      };
      const logger = { setContext: fn() };
      const service = new SupportStaffService(
        f.em as any,
        repo as any,
        logger as any,
      );
      return { service, repo };
    }

    it('listMine reads in a read-only system transaction bound to the actor', async () => {
      const f = rlsFixture();
      const { service, repo } = build(f);
      await service.listMine(SECRETARY);
      expect(f.transactional.mock.calls[0][1]).toEqual({ readOnly: true });
      expect(f.calls).toEqual([SYSTEM]);
      expect(repo.findLinks).toHaveBeenCalledWith(f.tx, {
        supportUserId: SECRETARY.id,
      });
    });

    it('myAccess reads scope and memberships in one read-only system transaction', async () => {
      const f = rlsFixture();
      const { service, repo } = build(f);
      await service.myAccess(SECRETARY);
      expect(f.transactional).toHaveBeenCalledTimes(1);
      expect(f.calls).toEqual([SYSTEM]);
      expect(repo.findActiveMembershipTenantIds).toHaveBeenCalledWith(
        f.tx,
        SECRETARY.id,
      );
    });

    it('practitionerTeam reads in system, bound to the practitioner profile', async () => {
      const f = rlsFixture();
      const { service, repo } = build(f);
      await service.practitionerTeam(DOCTOR);
      expect(f.calls).toEqual([SYSTEM]);
      expect(repo.findLinks).toHaveBeenCalledWith(f.tx, {
        practitionerProfileId: 'pp-1',
        statuses: ['ACTIVE', 'PENDING'],
      });
    });

    it('practitionerTeam without a profile opens no transaction', async () => {
      const f = rlsFixture();
      const { service } = build(f);
      await service.practitionerTeam(NO_PROFILE);
      expect(f.fork).not.toHaveBeenCalled();
    });

    const query = {
      tenantId: 'tenant-a',
      practitionerRoleAssignmentId: 'pra-1',
      from: '2026-11-01T00:00:00Z',
      to: '2026-11-08T00:00:00Z',
    };

    it('agenda reads the scope in system but the bookings only under the validated tenant', async () => {
      const f = rlsFixture();
      const { service, repo } = build(f, [activeLink]);
      let setBeforeBookings: string[] = [];
      repo.findPractitionerAgenda.mockImplementation(async () => {
        setBeforeBookings = [...f.calls];
        return [];
      });
      await service.agenda(query, SECRETARY);
      expect(f.transactional.mock.calls.map((c) => c[1])).toEqual([
        { readOnly: true },
        { readOnly: true },
      ]);
      expect(setBeforeBookings).toEqual([
        SYSTEM,
        TENANT_OFF,
        tenantSet('tenant-a'),
      ]);
      expect(repo.findPractitionerAgenda).toHaveBeenCalledWith(
        f.tx,
        'tenant-a',
        'doc-profile',
        new Date(query.from),
        new Date(query.to),
        501,
      );
    });

    it('agenda outside the scope is denied without opening the tenant', async () => {
      const f = rlsFixture();
      const { service, repo } = build(f, []);
      await expect(service.agenda(query, SECRETARY)).rejects.toMatchObject({
        reason: 'SUPPORT_SCOPE_DENIED',
      });
      expect(f.calls).toEqual([SYSTEM]);
      expect(repo.findPractitionerAgenda).not.toHaveBeenCalled();
    });
  });

  describe('PractitionerGovernanceService', () => {
    function build(f: ReturnType<typeof rlsFixture>) {
      const repo = {
        countPendingReviews: fn().mockResolvedValue(2),
        findOpenAnomalies: fn().mockResolvedValue([]),
        findPendingForDoctor: fn().mockResolvedValue([]),
      };
      const links = {
        findLinks: fn().mockResolvedValue([
          {
            supportUserId: 'u-ana',
            supportName: 'Ana',
            tenantId: 't-1',
            kind: 'PRACTITIONER',
            practitionerProfileId: 'pp-1',
          },
        ]),
      };
      const service = new PractitionerGovernanceService(
        f.em,
        repo as any,
        links as any,
      );
      return { service, repo, links };
    }

    it('panel runs every query in one read-only system transaction', async () => {
      const f = rlsFixture();
      const { service, repo, links } = build(f);
      const panel = await service.panel(DOCTOR);
      expect(panel.pendingReviews).toBe(2);
      expect(f.transactional).toHaveBeenCalledTimes(1);
      expect(f.transactional.mock.calls[0][1]).toEqual({ readOnly: true });
      expect(f.calls).toEqual([SYSTEM]);
      expect(links.findLinks).toHaveBeenCalledWith(f.tx, expect.anything());
      expect(repo.countPendingReviews).toHaveBeenCalledWith(f.tx, DOCTOR.id);
      expect(repo.findOpenAnomalies).toHaveBeenCalledWith(
        f.tx,
        [{ userId: 'u-ana', tenantId: 't-1' }],
        expect.any(Number),
      );
    });

    it('pendingApprovals bounds the read to the doctor and his own team', async () => {
      const f = rlsFixture();
      const { service, repo } = build(f);
      await service.pendingApprovals(DOCTOR, {});
      expect(f.calls).toEqual([SYSTEM]);
      expect(repo.findPendingForDoctor).toHaveBeenCalledWith(
        f.tx,
        expect.objectContaining({
          doctorUserId: DOCTOR.id,
          team: [{ userId: 'u-ana', tenantId: 't-1' }],
        }),
      );
    });

    it('a doctor without a practitioner profile has an empty team', async () => {
      const f = rlsFixture();
      const { service, repo } = build(f);
      await service.pendingApprovals(NO_PROFILE, {});
      expect(repo.findPendingForDoctor).toHaveBeenCalledWith(
        f.tx,
        expect.objectContaining({ team: [] }),
      );
    });
  });

  describe('SupportStaffProvisioningService', () => {
    it('reads the practitioner role assignment in a read-only system transaction', async () => {
      const f = rlsFixture();
      const provisioningRepo = {
        findActiveRoleAssignmentOfPractitioner: fn().mockResolvedValue(null),
      };
      const service = new SupportStaffProvisioningService(
        f.em,
        {} as any,
        provisioningRepo as any,
        {} as any,
        { setContext: fn() } as any,
      );
      await expect(
        service.provisionForPractitioner(
          { practitionerRoleAssignmentId: 'pra-1' } as any,
          DOCTOR,
        ),
      ).rejects.toThrow(ResourceNotFoundException);
      expect(f.transactional.mock.calls[0][1]).toEqual({ readOnly: true });
      expect(f.calls).toEqual([SYSTEM]);
      expect(
        provisioningRepo.findActiveRoleAssignmentOfPractitioner,
      ).toHaveBeenCalledWith(f.tx, 'pp-1', 'pra-1');
    });
  });
});
