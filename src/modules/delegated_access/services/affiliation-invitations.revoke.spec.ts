import { jest } from '@jest/globals';
import { RequestMethod } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import {
  DomainException,
  ResourceNotFoundException,
  runWithTenant,
  type AuthenticatedUser,
} from '../../../common';
import { AUDITED_KEY } from '../../../common/audit-trail/audit-trail.decorators';
import { AFF_INV } from '../../directory/affiliation-invitation.concepts';
import { AffiliationInvitationsController } from '../controllers/affiliation-invitations.controller';
import {
  AffiliationInvitationsRepository,
  type AffiliationInvitationRow,
} from '../repositories/affiliation-invitations.repository';
import { AffiliationInvitationsService } from './affiliation-invitations.service';

// Loosely typed alias: avoids the 'never' that @jest/globals infers for jest.fn() in ESM.
const fn = jest.fn as unknown as (impl?: (...a: any[]) => any) => any;

const TENANT = 'tenant-a';
const ID = '11111111-1111-4111-8111-111111111111';
const ADMIN: AuthenticatedUser = { id: 'user-admin', roles: ['USER'] };
const STRANGER: AuthenticatedUser = { id: 'user-x', roles: ['USER'] };

function revokedRow(): AffiliationInvitationRow {
  return {
    id: ID,
    tenant_id: TENANT,
    kind_concept_id: AFF_INV.KIND_PRACTITIONER,
    target_person_id: null,
    max_uses: 5,
    uses_count: 2,
    expires_at: new Date(Date.now() + 86_400_000),
    status_concept_id: AFF_INV.STATUS_REVOKED,
    created_at: new Date(),
  };
}

function build(opts: {
  isAdmin: boolean;
  row: AffiliationInvitationRow | null;
}) {
  const tx = {};
  const em = { transactional: fn((cb: (t: unknown) => unknown) => cb(tx)) };
  const repo = { revoke: fn().mockResolvedValue(opts.row) };
  const links = { isOrganizationAdmin: fn().mockResolvedValue(opts.isAdmin) };
  const service = new AffiliationInvitationsService(
    em as never,
    repo as never,
    links as never,
  );
  return { service, repo, links, tx };
}

describe('AffiliationInvitationsService.revoke', () => {
  it('an organization admin turns the code off inside the active tenant', async () => {
    const { service, repo, tx } = build({ isAdmin: true, row: revokedRow() });

    const view = await service.revoke(TENANT, ID, ADMIN);

    expect(repo.revoke).toHaveBeenCalledWith(tx, TENANT, ID, ADMIN.id);
    expect(view).toMatchObject({ id: ID, status: 'REVOKED', usesCount: 2 });
    expect(view).not.toHaveProperty('code');
  });

  it('a non-admin gets 403 and nothing is revoked', async () => {
    const { service, repo } = build({ isAdmin: false, row: revokedRow() });

    const failure = await service.revoke(TENANT, ID, STRANGER).catch((e) => e);

    expect(failure).toBeInstanceOf(DomainException);
    expect(failure.getStatus()).toBe(403);
    expect(repo.revoke).not.toHaveBeenCalled();
  });

  it('an unknown id and an id of another tenant answer the same 404', async () => {
    const { service } = build({ isAdmin: true, row: null });

    const failure = await service.revoke(TENANT, ID, ADMIN).catch((e) => e);

    expect(failure).toBeInstanceOf(ResourceNotFoundException);
    // Same body whether the id does not exist or belongs to someone else.
    const other = await service
      .revoke(TENANT, '22222222-2222-4222-8222-222222222222', ADMIN)
      .catch((e) => e);
    expect(other.getResponse()).toEqual(failure.getResponse());
  });
});

describe('AffiliationInvitationsRepository.revoke', () => {
  it('updates by id AND tenant, so another tenant code never matches', async () => {
    const execute = fn().mockResolvedValue([revokedRow()]);
    const row = await new AffiliationInvitationsRepository().revoke(
      { execute } as never,
      TENANT,
      ID,
      ADMIN.id,
    );

    const [sql, params] = execute.mock.calls[0] as [string, unknown[]];
    expect(sql).toMatch(/UPDATE directory\.affiliation_invitations/);
    expect(sql).toMatch(/WHERE id = \? AND tenant_id = \?/);
    expect(sql).toMatch(/RETURNING/);
    expect(params).toEqual([AFF_INV.STATUS_REVOKED, ADMIN.id, ID, TENANT]);
    expect(row?.status_concept_id).toBe(AFF_INV.STATUS_REVOKED);
  });

  it('answers null when no row matches', async () => {
    const execute = fn().mockResolvedValue([]);
    await expect(
      new AffiliationInvitationsRepository().revoke(
        { execute } as never,
        TENANT,
        ID,
        ADMIN.id,
      ),
    ).resolves.toBeNull();
  });
});

describe('AffiliationInvitationsController.revoke (route contract)', () => {
  const handler = (AffiliationInvitationsController.prototype as any).revoke;

  it('is POST org/affiliation-invitations/:id/revoke and is audited by its :id', () => {
    expect(Reflect.getMetadata(PATH_METADATA, handler)).toBe(
      'org/affiliation-invitations/:id/revoke',
    );
    expect(Reflect.getMetadata(METHOD_METADATA, handler)).toBe(
      RequestMethod.POST,
    );
    expect(Reflect.getMetadata(AUDITED_KEY, handler)).toEqual({
      action: 'AFFILIATION_INVITATION_REVOKED',
      entity: 'affiliation_invitation',
      entityId: 'param:id',
    });
  });

  it('delegates to the service with the active tenant, the id and the actor', async () => {
    const service = { revoke: fn().mockResolvedValue({ id: ID }) };
    const controller = new AffiliationInvitationsController(
      service as never,
      {} as never,
    );

    await runWithTenant(TENANT, () => controller.revoke(ID, ADMIN));

    expect(service.revoke).toHaveBeenCalledWith(TENANT, ID, ADMIN);
  });
});
