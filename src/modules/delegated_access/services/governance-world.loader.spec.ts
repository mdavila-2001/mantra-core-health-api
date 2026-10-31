import { GovernanceWorldLoader, toSodRule } from './governance-world.loader';
import { STATUS } from './concept-maps';
import { DELEG } from '../delegated_access.concepts';
import { DIR } from '../../directory/directory.concepts';
import { permissionAtomId, supportPermissionId } from '../domain';
import { NOW, DAY, fakeEm, ids, mockFn } from './governance-world.testing';

const PRA = 'bbbbbbbb-0000-4000-8000-0000000000b1';
const PRA_GONE = 'bbbbbbbb-0000-4000-8000-0000000000b2';
const SPACE = 'cccccccc-0000-4000-8000-0000000000c1';

function grantRow(over: Partial<any> = {}): any {
  return {
    id: 'g1',
    tenantId: ids.tenant,
    organizationUserAssignmentId: 'e1',
    targetKindConceptId: DELEG.SUPPORT_TARGET_PRACTITIONER,
    practitionerRoleAssignmentId: PRA,
    expansionModeConceptId: DELEG.SUPPORT_EXPANSION_DYNAMIC,
    statusConceptId: DELEG.SUPPORT_GRANT_ACTIVE,
    effectConceptId: undefined,
    createdAt: new Date(NOW.getTime() - 30 * DAY),
    createdByUserId: ids.admin,
    approvedByUserId: ids.admin2,
    ...over,
  };
}

function build(
  opts: { grants?: any[]; livePras?: string[]; delegations?: any[] } = {},
) {
  const em = fakeEm();
  em.find = mockFn().mockResolvedValue([{ id: 'tpl', code: 'SECRETARY' }]);
  const record = {
    assignment: {
      id: 'e1',
      statusConceptId: STATUS.ACTIVE,
      roleTemplateId: 'tpl',
      supervisorUserId: ids.perez,
      createdAt: new Date(NOW.getTime() - 200 * DAY),
      lastCertifiedAt: new Date(NOW.getTime() - 20 * DAY),
      nextRecertificationAt: new Date('2026-11-23T14:30:00Z'),
      recertifyEveryMonths: 6,
    },
    tenantId: ids.tenant,
    userId: ids.ana,
    membershipStatusConceptId: DIR.MEMBERSHIP_ACTIVE,
  };
  const access: any = {
    findEngagements: mockFn().mockResolvedValue([record]),
    findGrantsWithActions: mockFn().mockResolvedValue(
      (opts.grants ?? [grantRow()]).map((g) => ({
        grant: g,
        permissionIds: [supportPermissionId('schedule.view')],
        actions: [
          {
            permissionId: supportPermissionId('schedule.view'),
            supersededAt: null,
          },
        ],
      })),
    ),
    findRoleAssignments: mockFn().mockResolvedValue(
      new Map([
        [PRA, { id: PRA, practitionerProfileId: ids.perez }],
        [PRA_GONE, { id: PRA_GONE, practitionerProfileId: 'otro-doctor' }],
      ]),
    ),
    findCareSpaces: mockFn().mockResolvedValue(
      new Map([
        [
          SPACE,
          {
            id: SPACE,
            practiceSiteId: 'site-1',
            locationPath: `/site-1/${SPACE}/`,
            tenantId: ids.tenant,
          },
        ],
      ]),
    ),
    findRoleAssignmentsOfTenant: mockFn().mockResolvedValue(
      (opts.livePras ?? [PRA]).map((id) => ({ id })),
    ),
    findDelegationsOfEngagements: mockFn().mockResolvedValue(
      opts.delegations ?? [
        {
          delegate: {
            delegateUserAssignmentId: 'e1',
            acceptedAt: new Date(NOW.getTime() - DAY),
            statusConceptId: STATUS.ACTIVE,
          },
          practitionerProfileId: ids.perez,
        },
      ],
    ),
  };
  const usage: any = {
    lastUsedByGrant: mockFn().mockResolvedValue(
      new Map([['g1', new Date(NOW.getTime() - 2 * DAY)]]),
    ),
  };
  const sod: any = {
    findRulesVisible: mockFn().mockResolvedValue([]),
    findActiveExceptions: mockFn().mockResolvedValue([]),
  };
  const rules: any = { findActiveForTenant: mockFn().mockResolvedValue([]) };
  return {
    loader: new GovernanceWorldLoader(access, usage, sod, rules),
    em,
    access,
    sod,
    rules,
  };
}

describe('GovernanceWorldLoader.load', () => {
  it('arma el vínculo con plantilla, estado, dueño, certificación y aceptación del doctor', async () => {
    const { loader, em } = build();
    const w = await loader.load(em, ids.tenant, NOW);
    expect(w.tenantId).toBe(ids.tenant);
    const e = w.engagements[0];
    expect(e).toMatchObject({
      engagementId: 'e1',
      subjectUserId: ids.ana,
      supervisorUserId: ids.perez,
      templateCode: 'SECRETARY',
      state: 'ACTIVE',
      recertifyEveryMonths: 6,
      acceptedPractitionerProfileIds: [ids.perez],
    });
    expect(e.lastCertifiedAt).toEqual(new Date(NOW.getTime() - 20 * DAY));
  });

  it('cada concesión trae quién la otorgó y aprobó, su uso, el doctor y la ubicación', async () => {
    const { loader, em } = build({
      grants: [
        grantRow({
          targetKindConceptId: DELEG.SUPPORT_TARGET_LOCATION,
          careSpaceId: SPACE,
          practitionerRoleAssignmentId: undefined,
        }),
      ],
    });
    const g = (await loader.load(em, ids.tenant, NOW)).engagements[0].grants[0];
    expect(g).toMatchObject({
      grantId: 'g1',
      grantedByUserId: ids.admin,
      approvedByUserIds: [ids.admin2],
      careSpacePath: `/site-1/${SPACE}/`,
      careSpaceSiteId: 'site-1',
    });
    expect(g.lastUsedAt).toEqual(new Date(NOW.getTime() - 2 * DAY));
    expect(g.actions).toContain('schedule.view');
  });

  it('una concesión a un doctor cuya asignación ya no rige se marca doctorGone', async () => {
    const { loader, em } = build({
      grants: [grantRow({ practitionerRoleAssignmentId: PRA_GONE })],
      livePras: [PRA],
    });
    const g = (await loader.load(em, ids.tenant, NOW)).engagements[0].grants[0];
    expect(g.doctorGone).toBe(true);
    expect(g.practitionerRoleAssignmentId).toBe(PRA_GONE);
  });

  it('marca la concesión sobre el techo de su plantilla (alias que expande a un átomo fuera del techo)', async () => {
    const { loader, em, access } = build();
    access.findGrantsWithActions.mockResolvedValue([
      {
        grant: grantRow(),
        permissionIds: [permissionAtomId('billing.receipt.void')],
        actions: [
          {
            permissionId: permissionAtomId('billing.receipt.void'),
            supersededAt: null,
          },
        ],
      },
    ]);
    const g = (await loader.load(em, ids.tenant, NOW)).engagements[0].grants[0];
    expect(g.aboveCeiling).toBe(true);
  });

  it('una concesión dentro del techo no se marca', async () => {
    const { loader, em } = build();
    expect(
      (await loader.load(em, ids.tenant, NOW)).engagements[0].grants[0]
        .aboveCeiling,
    ).toBe(false);
  });

  it('un vínculo suspendido o terminado conserva su estado', async () => {
    const { loader, em, access } = build();
    const rec = (await access.findEngagements())[0];
    rec.assignment.statusConceptId = STATUS.SUSPENDED;
    expect((await loader.load(em, ids.tenant, NOW)).engagements[0].state).toBe(
      'SUSPENDED',
    );
    rec.assignment.statusConceptId = STATUS.REVOKED;
    expect((await loader.load(em, ids.tenant, NOW)).engagements[0].state).toBe(
      'ENDED',
    );
  });

  it('un vínculo solo se carga en su organización (filtro de tenant e ids)', async () => {
    const { loader, em, access } = build();
    await loader.load(em, ids.tenant, NOW, ['e1']);
    expect(access.findEngagements).toHaveBeenCalledWith(em, {
      tenantId: ids.tenant,
      ids: ['e1'],
    });
  });
});

describe('toSodRule', () => {
  const row: any = {
    id: 'r2',
    code: 'SOD-X',
    name: 'Regla X',
    baseRuleId: 'r1',
    atomsAJson: ['billing.*', 7],
    atomsBJson: ['billing.receipt.void'],
    scopeConceptId: DELEG.SOD_SCOPE_PERSON_OVERLAP,
    actionConceptId: DELEG.SOD_ACTION_REQUIRE_APPROVAL,
    isHard: false,
    maxExceptionDays: 30,
    rationaleText: 'Porque sí',
  };
  it('mapea conceptos a códigos y listas de átomos', () => {
    expect(toSodRule(row, new Map([['r1', 'SOD-BASE']]))).toEqual({
      id: 'r2',
      code: 'SOD-X',
      name: 'Regla X',
      atomsA: ['billing.*'],
      atomsB: ['billing.receipt.void'],
      scope: 'PERSON_OVERLAP',
      action: 'REQUIRE_APPROVAL',
      isHard: false,
      maxExceptionDays: 30,
      rationale: 'Porque sí',
      baseRuleCode: 'SOD-BASE',
    });
  });
  it('un concepto desconocido falla cerrado: la acción más estricta', () => {
    const r = toSodRule(
      {
        ...row,
        actionConceptId: 'raro',
        scopeConceptId: 'raro',
        baseRuleId: null,
      },
      new Map(),
    );
    expect(r).toMatchObject({ action: 'BLOCK', scope: 'PERSON' });
    expect(r.baseRuleCode).toBeUndefined();
  });
});
