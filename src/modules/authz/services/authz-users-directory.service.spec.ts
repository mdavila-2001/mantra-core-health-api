import { jest } from '@jest/globals';
import type { AuthenticatedUser } from '../../../common';
import {
  decodeKeysetCursor,
  encodeKeysetCursor,
} from '../../../common/pagination/keyset-cursor';
import type {
  DirectoryUserRow,
  UsersDirectoryReadPort,
} from '../ports/users-directory-read.port';
import { AuthzUsersDirectoryService } from './authz-users-directory.service';

// `@jest/globals` types are stricter than this spec needs; loosen the factory only.
const fn = jest.fn as unknown as () => any;
const TENANT = '11111111-1111-4111-8111-111111111111';
const row = (
  n: number,
  userType: DirectoryUserRow['userType'] = 'PATIENT',
) => ({
  id: `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`,
  displayName: `User ${String(n).padStart(2, '0')}`,
  statusConceptId: 's',
  mfaStatusConceptId: null,
  lastLoginAt: null,
  userType,
});
const actor = (roles: string[], scopedRoles?: Record<string, string[]>) =>
  ({ id: 'actor', roles, scopedRoles }) as unknown as AuthenticatedUser;

function build(rows: DirectoryUserRow[]) {
  const port = {
    page: fn().mockResolvedValue(rows),
    roles: fn().mockResolvedValue([
      {
        userId: rows[0]?.id,
        assignmentId: 'a1',
        roleCode: 'BILLING',
        roleName: 'Billing',
        tenantId: TENANT,
        validTo: null,
      },
    ]),
    permissionSummary: fn().mockResolvedValue([
      {
        userId: rows[0]?.id,
        allowCount: 4,
        denyCount: 1,
        dangerousCount: 2,
        directGrantCount: 1,
      },
    ]),
    loginSubjects: fn().mockResolvedValue([
      { userId: rows[0]?.id, subject: 'ana@clinica.org' },
    ]),
  } satisfies UsersDirectoryReadPort;
  const tx = {};
  const em = {
    fork: () => ({ transactional: (fn: (t: unknown) => unknown) => fn(tx) }),
  };
  const audit = { record: fn().mockResolvedValue(undefined) };
  const service = new AuthzUsersDirectoryService(
    em as never,
    port,
    audit as never,
  );
  return { service, port, audit, tx };
}

describe('AuthzUsersDirectoryService', () => {
  it('holds a tenant-scoped SECURITY_ADMIN to the resolved organization', async () => {
    const { service, port } = build([row(1)]);
    const out = await service.list(actor(['SECURITY_ADMIN']), TENANT, {});
    expect(out.scope).toBe('TENANT');
    for (const call of [port.page, port.roles, port.permissionSummary])
      expect(call.mock.calls[0].at(-1)).toEqual({ tenantId: TENANT });
  });

  it('refuses a non-platform caller with no resolved organization', async () => {
    const { service, port, audit } = build([row(1)]);
    await expect(
      service.list(actor(['SECURITY_ADMIN']), undefined, {}),
    ).rejects.toMatchObject({ status: 403 });
    expect(port.page).not.toHaveBeenCalled();
    expect(audit.record).not.toHaveBeenCalled();
  });

  it('refuses a SUPERADMIN scoped to one tenant as if it were not platform', async () => {
    const { service } = build([row(1)]);
    await expect(
      service.list(
        actor(['SUPERADMIN'], { [TENANT]: ['SUPERADMIN'] }),
        undefined,
        {},
      ),
    ).rejects.toMatchObject({ status: 403 });
  });

  it('lets a platform SUPERADMIN cross organizations', async () => {
    const { service, port } = build([row(1)]);
    const out = await service.list(actor(['SUPERADMIN']), undefined, {});
    expect(out.scope).toBe('PLATFORM');
    expect(port.page.mock.calls[0].at(-1)).toEqual({});
  });

  it('seals every query in the audit trail inside the read transaction', async () => {
    const { service, audit, port, tx } = build([row(1)]);
    await service.list(actor(['SECURITY_ADMIN']), TENANT, { limit: 5 });
    expect(audit.record).toHaveBeenCalledTimes(1);
    expect(audit.record).toHaveBeenCalledWith(
      tx,
      expect.anything(),
      expect.objectContaining({
        action: 'USERS_DIRECTORY_QUERIED',
        tenantId: TENANT,
      }),
    );
    expect(port.page.mock.calls[0][0]).toBe(tx);
  });

  it('does not read anything if the audit seal fails', async () => {
    const { service, audit, port } = build([row(1)]);
    audit.record.mockRejectedValueOnce(new Error('audit down'));
    await expect(
      service.list(actor(['SECURITY_ADMIN']), TENANT, {}),
    ).rejects.toThrow('audit down');
    expect(port.page).not.toHaveBeenCalled();
  });

  it('asks each port method once per page, whatever the page size (no N+1)', async () => {
    const { service, port } = build(
      Array.from({ length: 30 }, (_, i) => row(i)),
    );
    await service.list(actor(['SECURITY_ADMIN']), TENANT, { limit: 25 });
    for (const call of [
      port.page,
      port.roles,
      port.permissionSummary,
      port.loginSubjects,
    ])
      expect(call).toHaveBeenCalledTimes(1);
    expect(port.roles.mock.calls[0][1]).toHaveLength(25);
  });

  it('pages by cursor: an extra row means a next cursor on the last returned row', async () => {
    const { service } = build([row(1), row(2), row(3)]);
    const out = await service.list(actor(['SECURITY_ADMIN']), TENANT, {
      limit: 2,
    });
    expect(out.items.map((i) => i.displayName)).toEqual(['User 01', 'User 02']);
    expect(decodeKeysetCursor(out.nextCursor as string)).toEqual({
      n: 'User 02',
      i: row(2).id,
    });
  });

  it('returns no cursor on the last page and passes the decoded cursor to the port', async () => {
    const { service, port } = build([row(1)]);
    const first = await service.list(actor(['SECURITY_ADMIN']), TENANT, {});
    expect(first.nextCursor).toBeNull();
    await service.list(actor(['SECURITY_ADMIN']), TENANT, {
      cursor: encodeKeysetCursor({ n: 'User 02', i: row(2).id }),
    });
    expect(port.page.mock.calls[1][1].after).toEqual({
      displayName: 'User 02',
      id: row(2).id,
    });
  });

  it('exposes only the contract: masked email, roles and a permission summary', async () => {
    const { service } = build([row(1, 'PRACTITIONER')]);
    const out = await service.list(actor(['SECURITY_ADMIN']), TENANT, {});
    expect(out.items[0]).toEqual({
      id: row(1).id,
      displayName: 'User 01',
      type: 'PRACTITIONER',
      statusConceptId: 's',
      mfaStatusConceptId: null,
      lastLoginAt: null,
      maskedEmail: 'a***@c***.org',
      roles: [
        {
          assignmentId: 'a1',
          roleCode: 'BILLING',
          roleName: 'Billing',
          tenantId: TENANT,
          validTo: null,
        },
      ],
      permissions: { allowed: 4, denied: 1, dangerous: 2, directGrants: 1 },
    });
    expect(JSON.stringify(out)).not.toContain('ana@clinica.org');
  });
});
