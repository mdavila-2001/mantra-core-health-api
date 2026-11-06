import { describe, expect, it, jest } from '@jest/globals';
import { PreconditionFailedException } from '../../../common';
import { DIR } from '../../directory/directory.concepts';
import { PROF } from '../../profiles/profiles.concepts';
import {
  HealthPractitionerProfiles,
  JurisdictionAuthorizations,
  PersonAccountLinks,
  Persons,
} from '../../profiles/entities';
import { TenantMemberships } from '../../directory/entities';
import { ReportSignersService } from './report-signers.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

function em() {
  const rows = new Map<any, any[]>([
    [TenantMemberships, [{ userId: 'u-tech' }, { userId: 'u-bio' }]],
    [
      PersonAccountLinks,
      [
        { userId: 'u-bio', personId: 'p-bio' },
        { userId: 'u-tech', personId: 'p-tech' },
      ],
    ],
    [
      HealthPractitionerProfiles,
      [
        { profileId: 'p-bio', signatureFileId: 'sig', sealFileId: null },
        { profileId: 'p-doc' },
      ],
    ],
    [
      Persons,
      [
        { id: 'p-bio', displayName: 'Bioq. Zapata' },
        { id: 'p-doc', name: 'Ana', lastName: 'Arce' },
      ],
    ],
    [
      JurisdictionAuthorizations,
      [
        {
          practitionerProfileId: 'p-bio',
          jurisdictionConceptId: PROF.JURISDICTION_NATIONAL,
          licenseNumber: 'MP-77',
          stateConceptId: PROF.AUTH_ACTIVE,
        },
      ],
    ],
  ]);
  return { find: mockFn(async (cls: any) => rows.get(cls) ?? []) };
}

describe('ReportSignersService', () => {
  it('lists active members linked to a practitioner profile, plus the actor practitioner', async () => {
    const e = em();
    const list = await new ReportSignersService().list(e as any, 't1', {
      id: 'u-doc',
      practitionerProfileId: 'p-doc',
    } as any);
    expect(e.find).toHaveBeenCalledWith(TenantMemberships, {
      tenantId: 't1',
      statusConceptId: DIR.MEMBERSHIP_ACTIVE,
    });
    expect(e.find).toHaveBeenCalledWith(PersonAccountLinks, {
      userId: { $in: ['u-tech', 'u-bio'] },
      statusConceptId: PROF.ACCOUNT_LINK_ACTIVE,
    });
    expect(
      list.map((s) => [
        s.profileId,
        s.name,
        s.registration,
        s.hasSignature,
        s.hasSeal,
      ]),
    ).toEqual([
      ['p-doc', 'Ana Arce', null, false, false],
      ['p-bio', 'Bioq. Zapata', 'MP-77', true, false],
    ]);
  });

  it('assertSigner refuses a profile outside the list with 422', async () => {
    await expect(
      new ReportSignersService().assertSigner(
        em() as any,
        't1',
        { id: 'u' } as any,
        'p-tech',
      ),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
  });
});
