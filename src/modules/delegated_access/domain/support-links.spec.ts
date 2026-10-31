import {
  awaitingPartyOf,
  buildSupportScope,
  initiatorOf,
  mayDecide,
  scopeCoversPractitioner,
  targetKindOf,
  type SupportLinkRow,
} from './support-links';

const SECRETARY = 'user-secretary';
const DOCTOR = 'user-doctor';
const ADMIN = 'user-admin';

function link(over: Partial<SupportLinkRow> = {}): SupportLinkRow {
  return {
    id: 'link-1',
    kind: 'LOCATION',
    tenantId: 'tenant-a',
    organizationName: 'Hospital A',
    supportUserId: SECRETARY,
    supportPersonId: 'person-secretary',
    supportName: 'Ana',
    status: 'PENDING',
    createdByUserId: SECRETARY,
    createdAt: new Date('2026-10-31T10:00:00Z'),
    practiceSiteId: null,
    clinicalUnitId: null,
    careSpaceId: null,
    practitionerRoleAssignmentId: null,
    practitionerProfileId: null,
    practitionerUserId: null,
    targetName: null,
    ...over,
  };
}

const NOBODY = {
  isSupportStaff: false,
  isOrganizationAdmin: false,
  isPractitioner: false,
};

describe('vínculos de la secretaria', () => {
  it('nombra el objetivo por la columna más específica', () => {
    expect(targetKindOf(link())).toBe('ORGANIZATION');
    expect(targetKindOf(link({ practiceSiteId: 's' }))).toBe('SITE');
    expect(targetKindOf(link({ clinicalUnitId: 'u' }))).toBe('SERVICE');
    expect(targetKindOf(link({ careSpaceId: 'f' }))).toBe('SPACE');
    expect(
      targetKindOf(link({ kind: 'PRACTITIONER', practiceSiteId: 's' })),
    ).toBe('PRACTITIONER');
  });

  it('lo pedido por la secretaria a un hospital lo decide el hospital, no ella', () => {
    const row = link();
    expect(initiatorOf(row)).toBe('SUPPORT_STAFF');
    expect(awaitingPartyOf(row)).toBe('ORGANIZATION');
    expect(mayDecide(row, { ...NOBODY, isSupportStaff: true })).toBe(false);
    expect(mayDecide(row, { ...NOBODY, isOrganizationAdmin: true })).toBe(true);
    expect(mayDecide(row, { ...NOBODY, isPractitioner: true })).toBe(false);
  });

  it('lo pedido a un doctor lo decide el doctor o el hospital', () => {
    const row = link({
      kind: 'PRACTITIONER',
      practitionerRoleAssignmentId: 'pra-1',
      practitionerUserId: DOCTOR,
    });
    expect(awaitingPartyOf(row)).toBe('PRACTITIONER');
    expect(mayDecide(row, { ...NOBODY, isPractitioner: true })).toBe(true);
    expect(mayDecide(row, { ...NOBODY, isOrganizationAdmin: true })).toBe(true);
    expect(mayDecide(row, { ...NOBODY, isSupportStaff: true })).toBe(false);
  });

  it('lo ofrecido por el hospital o el doctor lo decide sólo la secretaria', () => {
    const byOrg = link({ createdByUserId: ADMIN });
    expect(initiatorOf(byOrg)).toBe('ORGANIZATION');
    expect(awaitingPartyOf(byOrg)).toBe('SUPPORT_STAFF');
    expect(mayDecide(byOrg, { ...NOBODY, isOrganizationAdmin: true })).toBe(
      false,
    );
    expect(mayDecide(byOrg, { ...NOBODY, isSupportStaff: true })).toBe(true);

    const byDoctor = link({
      kind: 'PRACTITIONER',
      practitionerRoleAssignmentId: 'pra-1',
      practitionerUserId: DOCTOR,
      createdByUserId: DOCTOR,
    });
    expect(initiatorOf(byDoctor)).toBe('PRACTITIONER');
    expect(mayDecide(byDoctor, { ...NOBODY, isPractitioner: true })).toBe(
      false,
    );
    expect(mayDecide(byDoctor, { ...NOBODY, isSupportStaff: true })).toBe(true);
  });

  it('un vínculo ya decidido no espera a nadie', () => {
    for (const status of ['ACTIVE', 'REJECTED', 'ENDED'] as const) {
      const row = link({ status });
      expect(awaitingPartyOf(row)).toBeNull();
      expect(
        mayDecide(row, {
          isSupportStaff: true,
          isOrganizationAdmin: true,
          isPractitioner: true,
        }),
      ).toBe(false);
    }
  });

  it('el alcance sale sólo de los vínculos ACTIVOS, agrupados por hospital', () => {
    const scope = buildSupportScope([
      link({ id: 'a', status: 'ACTIVE', careSpaceId: 'floor-1' }),
      link({ id: 'b', status: 'ACTIVE', clinicalUnitId: 'unit-1' }),
      link({ id: 'c', status: 'PENDING', careSpaceId: 'floor-2' }),
      link({
        id: 'd',
        status: 'ACTIVE',
        kind: 'PRACTITIONER',
        practitionerRoleAssignmentId: 'pra-1',
        practitionerProfileId: 'doc-1',
        targetName: 'Dr. Pérez',
      }),
      link({ id: 'e', status: 'REJECTED', tenantId: 'tenant-b' }),
      link({ id: 'f', status: 'ACTIVE', tenantId: 'tenant-c' }),
    ]);
    expect(scope).toHaveLength(2);
    const a = scope.find((tenant) => tenant.tenantId === 'tenant-a');
    expect(a).toEqual({
      tenantId: 'tenant-a',
      organizationName: 'Hospital A',
      wholeOrganization: false,
      practiceSiteIds: [],
      clinicalUnitIds: ['unit-1'],
      careSpaceIds: ['floor-1'],
      practitioners: [
        {
          linkId: 'd',
          practitionerRoleAssignmentId: 'pra-1',
          practitionerProfileId: 'doc-1',
          name: 'Dr. Pérez',
        },
      ],
    });
    expect(
      scope.find((tenant) => tenant.tenantId === 'tenant-c')?.wholeOrganization,
    ).toBe(true);
    expect(scope.some((tenant) => tenant.tenantId === 'tenant-b')).toBe(false);
  });

  it('la agenda de un doctor exige un vínculo activo con ESE doctor en ESE hospital', () => {
    const scope = buildSupportScope([
      link({
        status: 'ACTIVE',
        kind: 'PRACTITIONER',
        practitionerRoleAssignmentId: 'pra-1',
      }),
      link({ id: 'x', status: 'ACTIVE', tenantId: 'tenant-b' }),
    ]);
    expect(scopeCoversPractitioner(scope, 'tenant-a', 'pra-1')).toBe(true);
    expect(scopeCoversPractitioner(scope, 'tenant-a', 'pra-2')).toBe(false);
    // Trabajar en el hospital B no da la agenda de sus doctores.
    expect(scopeCoversPractitioner(scope, 'tenant-b', 'pra-1')).toBe(false);
  });
});
