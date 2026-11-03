import { jest } from '@jest/globals';
import { ConflictException, type AuthenticatedUser } from '../../../common';
import { PROF } from '../../profiles/profiles.concepts';
import { AFF_INV } from '../../directory/affiliation-invitation.concepts';
import type { AffiliationInvitationRow } from '../repositories/affiliation-invitations.repository';
import { hashInvitationCode } from './affiliation-invitations.service';
import { RedeemAffiliationInvitationService } from './redeem-affiliation-invitation.service';

// Loosely typed alias: avoids the 'never' that @jest/globals infers for jest.fn() in ESM.
const fn = jest.fn as unknown as (impl?: (...a: any[]) => any) => any;

const CODE = 'CODIGO-DE-PRUEBA-1234';
const DOCTOR: AuthenticatedUser = {
  id: 'user-doctor',
  roles: ['USER', 'PRACTITIONER'],
};
const SECRETARY: AuthenticatedUser = {
  id: 'user-secretary',
  roles: ['USER', 'SUPPORT_STAFF'],
};

function invitation(
  over: Partial<AffiliationInvitationRow> = {},
): AffiliationInvitationRow {
  return {
    id: 'inv-1',
    tenant_id: 'tenant-a',
    kind_concept_id: AFF_INV.KIND_PRACTITIONER,
    target_person_id: null,
    max_uses: 10,
    uses_count: 0,
    expires_at: new Date(Date.now() + 86_400_000),
    status_concept_id: AFF_INV.STATUS_ACTIVE,
    created_at: new Date(),
    ...over,
  };
}

function build(
  row: AffiliationInvitationRow | null,
  person: { personId: string; practitionerProfileId: string | null } | null,
) {
  const tx = {};
  const em = { transactional: fn((cb: (t: unknown) => unknown) => cb(tx)) };
  const repo = {
    findByTokenHash: fn(async (_tx: unknown, hash: string) =>
      hash === hashInvitationCode(CODE) ? row : null,
    ),
    findPersonOfUser: fn().mockResolvedValue(person),
    findFirstActiveSite: fn().mockResolvedValue('site-1'),
    claimUse: fn().mockResolvedValue(true),
    releaseUse: fn().mockResolvedValue(undefined),
    recordUse: fn().mockResolvedValue(undefined),
  };
  const links = { findOrganizationName: fn().mockResolvedValue('Hospital A') };
  const practitioners = {
    addOwnAffiliation: fn().mockResolvedValue({
      id: 'aff-1',
      statusKind: 'pendiente',
    }),
  };
  const support = {
    request: fn().mockResolvedValue({
      id: 'link-1',
      tenantId: 'tenant-a',
      items: [],
    }),
  };
  const logger = { setContext: fn(), info: fn(), warn: fn() };
  const service = new RedeemAffiliationInvitationService(
    em as never,
    repo as never,
    links as never,
    practitioners as never,
    support as never,
    logger as never,
  );
  return { service, repo, practitioners, support };
}

describe('RedeemAffiliationInvitationService', () => {
  it('a practitioner code leaves a pending affiliation on the organization site', async () => {
    const { service, repo, practitioners } = build(invitation(), {
      personId: 'p-1',
      practitionerProfileId: 'p-1',
    });

    const result = await service.redeem({ code: ` ${CODE} ` }, DOCTOR);

    expect(result).toEqual({
      kind: 'PRACTITIONER',
      tenantId: 'tenant-a',
      organizationName: 'Hospital A',
      roleAssignmentId: 'aff-1',
      pendingApproval: true,
    });
    expect(practitioners.addOwnAffiliation).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationName: 'Hospital A',
        practiceSiteId: 'site-1',
      }),
      DOCTOR,
    );
    expect(repo.claimUse).toHaveBeenCalledWith({}, 'inv-1');
    expect(repo.recordUse).toHaveBeenCalledWith(
      {},
      expect.anything(),
      DOCTOR.id,
      AFF_INV.USE_ACCEPTED,
    );
  });

  it('a support code leaves a pending support request for the whole organization', async () => {
    const row = invitation({ kind_concept_id: AFF_INV.KIND_SUPPORT_STAFF });
    const { service, support } = build(row, {
      personId: 'p-2',
      practitionerProfileId: null,
    });

    const result = await service.redeem({ code: CODE }, SECRETARY);

    expect(result).toMatchObject({
      kind: 'SUPPORT_STAFF',
      requestId: 'link-1',
      pendingApproval: true,
    });
    expect(support.request).toHaveBeenCalledWith(
      {
        tenantId: 'tenant-a',
        roleTemplateCode: 'SECRETARY',
        items: [{ targetKind: 'ORGANIZATION' }],
      },
      SECRETARY,
    );
  });

  it.each([
    ['unknown', null],
    ['expired', invitation({ expires_at: new Date(Date.now() - 1000) })],
    ['revoked', invitation({ status_concept_id: AFF_INV.STATUS_REVOKED })],
    ['spent', invitation({ uses_count: 10 })],
    ['for someone else', invitation({ target_person_id: 'other-person' })],
  ])(
    'a %s code gets the same opaque 422 and affiliates nothing',
    async (_label, row) => {
      const { service, practitioners, repo } = build(row, {
        personId: 'p-1',
        practitionerProfileId: 'p-1',
      });

      await expect(
        service.redeem({ code: CODE }, DOCTOR),
      ).rejects.toMatchObject({
        reason: 'SUPPORT_INVITATION_INVALID',
      });
      expect(practitioners.addOwnAffiliation).not.toHaveBeenCalled();
      expect(repo.claimUse).not.toHaveBeenCalled();
    },
  );

  it('a practitioner code without a practitioner profile says why and spends no use', async () => {
    const { service, repo } = build(invitation(), {
      personId: 'p-2',
      practitionerProfileId: null,
    });

    await expect(
      service.redeem({ code: CODE }, SECRETARY),
    ).rejects.toMatchObject({
      reason: 'SUPPORT_PRACTITIONER_PROFILE_REQUIRED',
    });
    expect(repo.claimUse).not.toHaveBeenCalled();
  });

  it('gives the use back when the affiliation step fails', async () => {
    const { service, repo, practitioners } = build(invitation(), {
      personId: 'p-1',
      practitionerProfileId: 'p-1',
    });
    practitioners.addOwnAffiliation.mockRejectedValue(
      new Error('Ya pidió vincularse a esa sede'),
    );

    await expect(service.redeem({ code: CODE }, DOCTOR)).rejects.toThrow(
      'Ya pidió vincularse a esa sede',
    );
    expect(repo.releaseUse).toHaveBeenCalledWith({}, 'inv-1');
  });
});

describe('RedeemAffiliationInvitationService · already requested', () => {
  it('redeeming again after asking to join is not an error: it says the request is pending and gives the use back', async () => {
    const { service, repo, practitioners } = build(invitation(), {
      personId: 'p-1',
      practitionerProfileId: 'p-1',
    });
    practitioners.addOwnAffiliation.mockRejectedValue(
      new ConflictException(
        'Ya pidió vincularse a esa sede',
        { statusConceptId: PROF.AFFILIATION_PENDING },
        'AFFILIATION_SITE_ALREADY_REQUESTED',
      ),
    );

    const result = await service.redeem({ code: CODE }, DOCTOR);

    expect(result).toMatchObject({
      kind: 'PRACTITIONER',
      pendingApproval: true,
    });
    expect(repo.releaseUse).toHaveBeenCalledWith({}, 'inv-1');
  });
});
