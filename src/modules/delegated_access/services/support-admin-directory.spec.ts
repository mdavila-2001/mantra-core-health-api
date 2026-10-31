import { jest } from '@jest/globals';
import { CONCEPTS } from '../../../common';
import { DIR } from '../../directory/directory.concepts';
import { DELEG } from '../delegated_access.concepts';
import { permissionAtomId } from '../domain';
import { AUTHZ } from '../../authz/authz.concepts';
import { STATUS } from './concept-maps';
import { SupportAdminDirectory } from './support-admin-directory';

/** Mock laxo: evita el tipado estricto `Mock<never>` del runtime de jest. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const NOW = new Date('2026-11-03T14:30:00Z');
const TENANT = 'org-1';

const ceiling = {
  allowAtoms: ['agenda.*'],
  templates: ['SECRETARY'],
  maxValidDays: 180,
};

/** Vínculo vivo de Sofía (jefa de Ecografía) con átomos `team.*` sobre un servicio. */
function sofia(overrides: { atoms?: string[] } = {}) {
  const atoms = overrides.atoms ?? [
    'team.members.view',
    'team.grants.assign',
    'team.engagement.suspend',
  ];
  const record = {
    assignment: {
      id: 'eng-sofia',
      statusConceptId: STATUS.ACTIVE,
      nextRecertificationAt: new Date('2027-05-01'),
    },
    tenantId: TENANT,
    userId: 'sofia',
    membershipStatusConceptId: DIR.MEMBERSHIP_ACTIVE,
  };
  const grant = {
    id: 'g-eco',
    organizationUserAssignmentId: 'eng-sofia',
    targetKindConceptId: DELEG.SUPPORT_TARGET_SERVICE,
    healthcareServiceId: 'svc-eco',
    expansionModeConceptId: DELEG.SUPPORT_EXPANSION_DYNAMIC,
    statusConceptId: DELEG.SUPPORT_GRANT_ACTIVE,
  };
  const actions = atoms.map((a) => ({
    permissionId: permissionAtomId(a),
    conditionJson:
      a === 'team.grants.assign'
        ? { schemaVersion: 1, delegationCeiling: ceiling }
        : undefined,
    conditionSchemaVersion: a === 'team.grants.assign' ? 1 : undefined,
    supersededAt: null,
  }));
  return {
    record,
    withActions: [
      { grant, permissionIds: actions.map((a) => a.permissionId), actions },
    ],
  };
}

function build(opts: {
  records?: any[];
  withActions?: any[];
  memberships?: any[];
  globalRoles?: any[];
  roleAssignmentsOfDoctor?: any[];
  profileOfUser?: string | undefined;
  rules?: any;
}) {
  const access = {
    findEngagements: mockFn().mockResolvedValue(opts.records ?? []),
    findGrantsWithActions: mockFn().mockResolvedValue(opts.withActions ?? []),
    findRoleAssignments: mockFn().mockResolvedValue(new Map()),
    findCareSpaces: mockFn().mockResolvedValue(new Map()),
    findRoleAssignmentsOfPractitioner: mockFn().mockResolvedValue(
      opts.roleAssignmentsOfDoctor ?? [],
    ),
  };
  const directory = {
    findPractitionerProfileIdOfUser: mockFn().mockResolvedValue(
      opts.profileOfUser,
    ),
  };
  const em = {
    find: mockFn(async (entity: { name: string }) =>
      entity.name === 'TenantMemberships'
        ? (opts.memberships ?? [])
        : (opts.globalRoles ?? []),
    ),
  };
  return {
    em,
    access,
    directory,
    service: new SupportAdminDirectory(
      access as any,
      directory as any,
      opts.rules,
    ),
  };
}

describe('SupportAdminDirectory', () => {
  it('administradores de seguridad: rol global activo Y membresía viva en la organización', async () => {
    const { service, em } = build({
      memberships: [
        { userId: 'gonzalo', statusConceptId: DIR.MEMBERSHIP_ACTIVE },
        { userId: 'ana', statusConceptId: DIR.MEMBERSHIP_ACTIVE },
      ],
      globalRoles: [
        { userId: 'gonzalo', roleConceptId: CONCEPTS.ROLE_SECURITY_ADMIN },
      ],
    });
    expect(await service.securityAdminUserIds(em as any, TENANT)).toEqual([
      'gonzalo',
    ]);
    expect(await service.isSecurityAdmin(em as any, 'gonzalo', TENANT)).toBe(
      true,
    );
    expect(await service.isSecurityAdmin(em as any, 'ana', TENANT)).toBe(false);
  });

  it('administrador delegado: alcance por átomo team.* y techo de team.grants.assign', async () => {
    const { record, withActions } = sofia();
    const { service, em } = build({ records: [record], withActions });
    const ctx = await service.delegatedAdminOf(em as any, 'sofia', TENANT, NOW);
    expect(ctx).not.toBeNull();
    expect(ctx!.engagementIds).toEqual(['eng-sofia']);
    expect([...ctx!.atoms].sort()).toEqual([
      'team.engagement.suspend',
      'team.grants.assign',
      'team.members.view',
    ]);
    expect(ctx!.targets.get('team.grants.assign')).toHaveLength(1);
    expect(ctx!.targets.get('team.grants.assign')![0]).toMatchObject({
      targetKind: 'SERVICE',
      healthcareServiceId: 'svc-eco',
    });
    expect(ctx!.assignGrants).toHaveLength(1);
    expect(ctx!.assignGrants[0].ceiling).toEqual(ceiling);
  });

  it('sin átomos team.* o sin vínculo vivo no es administrador delegado', async () => {
    const plain = sofia({ atoms: ['agenda.appointment.view'] });
    const a = build({
      records: [plain.record],
      withActions: plain.withActions,
    });
    expect(
      await a.service.delegatedAdminOf(a.em as any, 'sofia', TENANT, NOW),
    ).toBeNull();
    const dead = sofia();
    dead.record.assignment.statusConceptId = STATUS.SUSPENDED;
    const b = build({ records: [dead.record], withActions: dead.withActions });
    expect(
      await b.service.delegatedAdminOf(b.em as any, 'sofia', TENANT, NOW),
    ).toBeNull();
  });

  it('una concesión DENY o vencida no da alcance de administración', async () => {
    const { record, withActions } = sofia();
    (withActions[0].grant as any).validTo = new Date('2026-11-01');
    const a = build({ records: [record], withActions });
    expect(
      await a.service.delegatedAdminOf(a.em as any, 'sofia', TENANT, NOW),
    ).toBeNull();
  });

  it('candidato a dueño: seguridad, doctor de la organización o delegado vivo, con membresía viva', async () => {
    const { record, withActions } = sofia();
    const { service, em } = build({
      records: [record],
      withActions,
      memberships: [
        { userId: 'sofia', statusConceptId: DIR.MEMBERSHIP_ACTIVE },
      ],
      globalRoles: [],
    });
    const c = await service.ownerCandidate(em as any, 'sofia', TENANT, NOW);
    expect(c).toEqual({
      userId: 'sofia',
      membershipLive: true,
      isSecurityAdmin: false,
      isOrgDoctor: false,
      isLiveDelegatedAdmin: true,
    });
  });

  it('doctor de la organización: perfil profesional con asignación de rol vigente', async () => {
    const { service, em } = build({
      profileOfUser: 'prof-mendez',
      roleAssignmentsOfDoctor: [{ id: 'r1' }],
      memberships: [
        { userId: 'mendez', statusConceptId: DIR.MEMBERSHIP_ACTIVE },
      ],
    });
    expect(await service.isOrgDoctor(em as any, 'mendez', TENANT)).toBe(true);
    const none = build({ profileOfUser: undefined });
    expect(await none.service.isOrgDoctor(none.em as any, 'x', TENANT)).toBe(
      false,
    );
  });

  it('miembros vivos: solo los de membresía activa y sin fin vencido', async () => {
    const { service, em } = build({
      memberships: [
        { userId: 'ana', statusConceptId: DIR.MEMBERSHIP_ACTIVE },
        {
          userId: 'rosa',
          statusConceptId: DIR.MEMBERSHIP_ACTIVE,
          endDate: new Date('2026-10-01'),
        },
      ],
    });
    const live = await service.liveMemberUserIds(
      em as any,
      TENANT,
      ['ana', 'rosa', 'pablo'],
      NOW,
    );
    expect([...live]).toEqual(['ana']);
  });
});

describe('SEG A-A5: una sola función de administración (vigencia, DENY y reglas L1)', () => {
  /** Prohibición explícita del administrador de seguridad sobre un átomo, para toda la organización. */
  const denyOf = (atom: string) => ({
    grant: {
      id: `g-deny-${atom}`,
      organizationUserAssignmentId: 'eng-sofia',
      targetKindConceptId: DELEG.SUPPORT_TARGET_ALL,
      expansionModeConceptId: DELEG.SUPPORT_EXPANSION_DYNAMIC,
      statusConceptId: DELEG.SUPPORT_GRANT_ACTIVE,
      effectConceptId: AUTHZ.EFFECT_DENY,
    },
    permissionIds: [permissionAtomId(atom)],
    actions: [{ permissionId: permissionAtomId(atom), supersededAt: null }],
  });
  const rulesOf = (...rows: Array<Record<string, unknown>>) => ({
    findActiveForTenant: mockFn().mockResolvedValue(
      rows.map((r) => ({
        ruleKindConceptId: DELEG.GOV_RULE_DENY_PERMISSION,
        ...r,
      })),
    ),
  });

  it('una concesión DENY sobre team.grants.assign le quita ese átomo aunque la ALLOW siga viva', async () => {
    const { record, withActions } = sofia();
    const a = build({
      records: [record],
      withActions: [...withActions, denyOf('team.grants.assign')],
    });
    const ctx = await a.service.delegatedAdminOf(
      a.em as any,
      'sofia',
      TENANT,
      NOW,
    );
    expect(ctx).not.toBeNull();
    expect(ctx!.atoms.has('team.grants.assign')).toBe(false);
    expect(ctx!.atoms.has('team.members.view')).toBe(true);
    expect(ctx!.assignGrants).toEqual([]);
  });

  it('una regla L1 DENY_PERMISSION team.* la deja sin administración; la de otra plantilla no', async () => {
    const { record, withActions } = sofia();
    const all = build({
      records: [record],
      withActions,
      rules: rulesOf({ permissionPattern: 'team.*', roleTemplateCode: null }),
    });
    expect(
      await all.service.delegatedAdminOf(all.em as any, 'sofia', TENANT, NOW),
    ).toBeNull();
    const other = build({
      records: [record],
      withActions,
      rules: rulesOf({
        permissionPattern: 'team.*',
        roleTemplateCode: 'SECRETARY',
      }),
    });
    expect(
      await other.service.delegatedAdminOf(
        other.em as any,
        'sofia',
        TENANT,
        NOW,
      ),
    ).not.toBeNull();
  });

  it('gobernanza (resumen, explicar, reportes): un vínculo con la recertificación vencida o suspendido no lee', async () => {
    const { record, withActions } = sofia({
      atoms: ['team.members.view', 'audit.decisions.explain'],
    });
    const live = build({ records: [record], withActions });
    expect(
      await live.service.governanceTargets(
        live.em as any,
        'sofia',
        TENANT,
        'audit.decisions.explain',
        NOW,
      ),
    ).toHaveLength(1);
    const lapsed = sofia({ atoms: ['audit.decisions.explain'] });
    lapsed.record.assignment.nextRecertificationAt = new Date('2026-01-01');
    const a = build({
      records: [lapsed.record],
      withActions: lapsed.withActions,
    });
    expect(
      await a.service.governanceTargets(
        a.em as any,
        'sofia',
        TENANT,
        'audit.decisions.explain',
        NOW,
      ),
    ).toEqual([]);
    const suspended = sofia({ atoms: ['audit.decisions.explain'] });
    suspended.record.assignment.statusConceptId = STATUS.SUSPENDED;
    const b = build({
      records: [suspended.record],
      withActions: suspended.withActions,
    });
    expect(
      await b.service.governanceTargets(
        b.em as any,
        'sofia',
        TENANT,
        'audit.decisions.explain',
        NOW,
      ),
    ).toEqual([]);
  });

  it('elegibilidad como jefe de servicio: adminScopes excluye vínculos no vivos, prohibidos y con regla L1', async () => {
    const { record, withActions } = sofia();
    const live = build({ records: [record], withActions });
    const scopes = await live.service.adminScopes(
      live.em as any,
      TENANT,
      'team.grants.assign',
      NOW,
    );
    expect(scopes).toEqual([expect.objectContaining({ adminUserId: 'sofia' })]);
    const lapsed = sofia();
    lapsed.record.assignment.nextRecertificationAt = new Date('2026-01-01');
    const a = build({
      records: [lapsed.record],
      withActions: lapsed.withActions,
    });
    expect(
      await a.service.adminScopes(
        a.em as any,
        TENANT,
        'team.grants.assign',
        NOW,
      ),
    ).toEqual([]);
    const denied = build({
      records: [record],
      withActions: [...withActions, denyOf('team.grants.assign')],
    });
    expect(
      await denied.service.adminScopes(
        denied.em as any,
        TENANT,
        'team.grants.assign',
        NOW,
      ),
    ).toEqual([]);
    const ruled = build({
      records: [record],
      withActions,
      rules: rulesOf({ permissionPattern: 'team.grants.assign' }),
    });
    expect(
      await ruled.service.adminScopes(
        ruled.em as any,
        TENANT,
        'team.grants.assign',
        NOW,
      ),
    ).toEqual([]);
  });
});
