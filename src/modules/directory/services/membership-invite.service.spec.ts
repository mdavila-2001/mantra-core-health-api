import { describe, expect, it, jest } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';
import { ConflictException } from '../../../common';
import { CONCEPTS } from '../../../common/constants/concepts';
import { DirectoryTenantClaimsAdapter } from '../../iam/infrastructure/adapters/directory-tenant-claims.adapter';
import { DIR } from '../directory.concepts';
import { TenantMembershipsRepository } from '../repositories';
import { DirectoryMembershipsService } from './directory-memberships.service';
import { MembershipInvitationsService } from './membership-invitations.service';
import { MembershipInviteService } from './membership-invite.service';
import { TenantAdministrationService } from './tenant-administration.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
const ADMIN = { id: 'admin-1', roles: [] } as any;
const GUEST = { id: 'guest-1', roles: [] } as any;
const TENANT = 't-1';

type Row = Record<string, any>;

/** Minimal in-memory `tenant_memberships` that honours `$ne` and `$in`. */
function store(seed: Row[] = []) {
  const rows: Row[] = [...seed];
  const matches = (row: Row, where: Record<string, any>) =>
    Object.entries(where).every(([key, cond]) => {
      if (cond && typeof cond === 'object' && '$ne' in cond)
        return row[key] !== cond.$ne;
      if (cond && typeof cond === 'object' && '$in' in cond)
        return cond.$in.includes(row[key]);
      return row[key] === cond;
    });
  const em: any = {
    rows,
    execute: mockFn(async () => []),
    flush: mockFn(async () => undefined),
    find: mockFn(async (_e: unknown, where: any) =>
      rows.filter((r) => matches(r, where)),
    ),
    findOne: mockFn(
      async (_e: unknown, where: any) =>
        rows.find((r) => matches(r, where)) ?? null,
    ),
    create: mockFn((_e: unknown, data: Row) => {
      const row = {
        createdAt: new Date(),
        id: `m-${rows.length + 1}`,
        ...data,
      };
      rows.push(row);
      return row;
    }),
    transactional: async (cb: any) => cb(em),
    fork: () => em,
  };
  return em;
}

/** The real invite + repo + authorization services over one in-memory store. */
function build(seed: Row[] = [], canAdminister = true) {
  const em = store(seed);
  const repo = new TenantMembershipsRepository();
  const tenantAdmin = {
    assertCanAdminister: mockFn(async () => {
      if (!canAdminister) throw new ForbiddenException('no');
    }),
    assertCanChangeOwnership: mockFn(async () => undefined),
  };
  const logger = { setContext: mockFn(), info: mockFn() };
  const invite = new MembershipInviteService(
    em,
    repo,
    tenantAdmin as any,
    logger as any,
  );
  return { em, repo, invite, tenantAdmin, rows: em.rows as Row[] };
}

const row = (over: Row = {}): Row => ({
  id: 'x-1',
  userId: GUEST.id,
  tenantId: TENANT,
  tenantRoleConceptId: DIR.ROLE_STAFF,
  statusConceptId: DIR.MEMBERSHIP_INVITED,
  createdAt: new Date('2026-11-01T10:00:00Z'),
  ...over,
});

describe('MembershipInviteService', () => {
  it('creates the membership INVITED by default, with STAFF / ALL_TENANT', async () => {
    const d = build();

    const m = await d.invite.invite(TENANT, { userId: GUEST.id }, ADMIN);

    expect(m.statusConceptId).toBe(DIR.MEMBERSHIP_INVITED);
    expect(d.rows[0]).toEqual(
      expect.objectContaining({
        userId: GUEST.id,
        tenantId: TENANT,
        tenantRoleConceptId: DIR.ROLE_STAFF,
        accessScopeConceptId: DIR.SCOPE_ALL_TENANT,
        invitedByUserId: ADMIN.id,
      }),
    );
    expect(d.em.flush).toHaveBeenCalledTimes(1);
  });

  it('the public path (DirectoryMembershipsService.invite) is always pending', async () => {
    const d = build();
    const facade = new DirectoryMembershipsService(
      d.em,
      d.repo,
      {} as any,
      {} as any,
      d.tenantAdmin as any,
      { setContext: mockFn() } as any,
      d.invite,
    );

    const res = await facade.invite(TENANT, { userId: GUEST.id }, ADMIN);

    expect(res.status).toBe(DIR.MEMBERSHIP_INVITED);
  });

  it('{ activate: true } creates it ACTIVE with the fixed id (internal callers)', async () => {
    const d = build();

    const m = await d.invite.invite(
      TENANT,
      { userId: GUEST.id, role: 'ADMIN' },
      ADMIN,
      { activate: true, membershipId: 'fixed-id' },
    );

    expect(m).toEqual(
      expect.objectContaining({
        id: 'fixed-id',
        statusConceptId: DIR.MEMBERSHIP_ACTIVE,
        tenantRoleConceptId: DIR.ROLE_ADMIN,
      }),
    );
  });

  it('is a 409 when the user is already active, with or without activate', async () => {
    const d = build([row({ statusConceptId: DIR.MEMBERSHIP_ACTIVE })]);

    await expect(
      d.invite.invite(TENANT, { userId: GUEST.id }, ADMIN),
    ).rejects.toBeInstanceOf(ConflictException);
    await expect(
      d.invite.invite(TENANT, { userId: GUEST.id }, ADMIN, { activate: true }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(d.rows).toHaveLength(1);
  });

  it('re-inviting a pending invitee is a 409 carrying the pending id', async () => {
    const d = build([row({ id: 'pending-1' })]);

    await expect(
      d.invite.invite(TENANT, { userId: GUEST.id }, ADMIN),
    ).rejects.toMatchObject({
      message: expect.stringContaining('invitación pendiente'),
    });
    expect(d.rows).toHaveLength(1);
  });

  it('a pending support-staff row is not an invitation and does not block', async () => {
    const d = build([row({ tenantRoleConceptId: DIR.ROLE_SUPPORT })]);

    const m = await d.invite.invite(TENANT, { userId: GUEST.id }, ADMIN);

    expect(m.statusConceptId).toBe(DIR.MEMBERSHIP_INVITED);
    expect(d.rows).toHaveLength(2);
  });

  it('a declined (ENDED) invitation can be sent again', async () => {
    const d = build([row({ statusConceptId: DIR.MEMBERSHIP_ENDED })]);

    const m = await d.invite.invite(TENANT, { userId: GUEST.id }, ADMIN);

    expect(m.statusConceptId).toBe(DIR.MEMBERSHIP_INVITED);
  });

  it('keeps the inviter authorization: nothing is created without it', async () => {
    const d = build([], false);

    await expect(
      d.invite.invite(TENANT, { userId: GUEST.id }, ADMIN),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(d.rows).toHaveLength(0);
  });

  it('inviting an OWNER still requires the ownership check', async () => {
    const d = build();

    await d.invite.invite(TENANT, { userId: GUEST.id, role: 'OWNER' }, ADMIN);

    expect(d.tenantAdmin.assertCanChangeOwnership).toHaveBeenCalled();
  });
});

describe('an INVITED membership grants no access; accepting does', () => {
  const claims = new DirectoryTenantClaimsAdapter();

  it('invite -> not in token claims, not an admin, not even a reader -> accept -> all of it', async () => {
    const d = build();
    const tenantAdmin = new TenantAdministrationService(d.repo);
    const invitations = new MembershipInvitationsService(d.em);
    await d.invite.invite(TENANT, { userId: GUEST.id, role: 'ADMIN' }, ADMIN);
    const id = d.rows[0].id;

    // Pending: visible in the invitee's list, invisible to every access check.
    const list = await invitations.list(GUEST);
    expect(list.items).toEqual([
      expect.objectContaining({ id, role: 'ADMIN' }),
    ]);
    expect(await claims.listActiveTenantIds(d.em, GUEST.id)).toEqual([]);
    expect(await tenantAdmin.belongsByMembership(d.em, TENANT, GUEST)).toBe(
      false,
    );
    expect(await tenantAdmin.administersByMembership(d.em, TENANT, GUEST)).toBe(
      false,
    );
    await expect(
      tenantAdmin.assertCanRead(d.em, TENANT, GUEST),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      tenantAdmin.assertCanAdminister(d.em, TENANT, GUEST),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(
      await d.repo.findActiveByUserTenant(
        d.em,
        GUEST.id,
        TENANT,
        DIR.MEMBERSHIP_ACTIVE,
      ),
    ).toBeNull();

    // Accepted: the membership is active and everything opens.
    await expect(invitations.accept(id, GUEST)).resolves.toMatchObject({
      status: 'ACTIVE',
    });
    expect(d.rows[0].startDate).toBeInstanceOf(Date);
    expect(await claims.listActiveTenantIds(d.em, GUEST.id)).toEqual([TENANT]);
    expect(await tenantAdmin.administersByMembership(d.em, TENANT, GUEST)).toBe(
      true,
    );
    expect((await invitations.list(GUEST)).items).toEqual([]);
  });

  it('decline ends the invitation: still no access, and it can be re-sent', async () => {
    const d = build();
    const invitations = new MembershipInvitationsService(d.em);
    await d.invite.invite(TENANT, { userId: GUEST.id }, ADMIN);
    const id = d.rows[0].id;

    await expect(invitations.decline(id, GUEST)).resolves.toMatchObject({
      status: 'DECLINED',
    });

    expect(d.rows[0].statusConceptId).toBe(DIR.MEMBERSHIP_ENDED);
    expect(await claims.listActiveTenantIds(d.em, GUEST.id)).toEqual([]);
    await expect(
      d.invite.invite(TENANT, { userId: GUEST.id }, ADMIN),
    ).resolves.toMatchObject({ statusConceptId: DIR.MEMBERSHIP_INVITED });
  });

  it('the promotions-era ACTIVE concept still opens the token, INVITED never does', async () => {
    const d = build([
      row({
        id: 'a',
        tenantId: 'legacy',
        statusConceptId: CONCEPTS.MEMBERSHIP_ACTIVE,
      }),
      row({ id: 'b', tenantId: 'pending' }),
    ]);

    expect(await claims.listActiveTenantIds(d.em, GUEST.id)).toEqual([
      'legacy',
    ]);
  });
});
