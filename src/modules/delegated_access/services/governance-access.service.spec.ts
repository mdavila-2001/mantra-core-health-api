import { GovernanceAccessService } from './governance-access.service';
import { DelegatedAccessErrorReason as Reason } from '../delegated_access.error-reasons';
import {
  engagement,
  fakeEm,
  grant,
  ids,
  mockFn,
  securityAdmin,
  staff,
  worldOf,
} from './governance-world.testing';

const T_OTHER = '99999999-9999-4999-8999-999999999999';

function build(engagements: any[]) {
  const loader = { load: mockFn().mockResolvedValue(worldOf(engagements)) };
  return {
    access: new GovernanceAccessService(loader as any),
    loader,
    em: fakeEm(),
  };
}
const sofiaGrant = (atoms: string[]) =>
  grant({ grantId: 'g-sofia', actions: atoms });

describe('GovernanceAccessService.authorize', () => {
  it('SECURITY_ADMIN de la organización ve todo, sin consultar a nadie', async () => {
    const { access, loader, em } = build([]);
    const a = await access.authorize(
      em,
      securityAdmin(),
      ids.tenant,
      'team.campaigns.manage',
    );
    expect(a).toEqual({ full: true, adminTargets: [], userId: ids.admin });
    expect(loader.load).not.toHaveBeenCalled();
  });

  it('un SECURITY_ADMIN con rol acotado a OTRA organización no es total aquí (AC-9)', async () => {
    const { access, em } = build([]);
    const scoped: any = {
      id: ids.admin,
      roles: ['SECURITY_ADMIN'],
      scopedRoles: { [T_OTHER]: ['SECURITY_ADMIN'] },
    };
    await expect(
      access.authorize(em, scoped, ids.tenant, 'team.campaigns.manage'),
    ).rejects.toMatchObject({
      reason: Reason.ADMIN_CEILING_EXCEEDED,
      status: 403,
    });
  });

  it('un administrador delegado con el átomo recibe sus objetivos', async () => {
    const { access, em } = build([
      engagement({
        engagementId: 'e1',
        subjectUserId: ids.sofia,
        grants: [sofiaGrant(['team.campaigns.manage'])],
      }),
    ]);
    const a = await access.authorize(
      em,
      staff(ids.sofia),
      ids.tenant,
      'team.campaigns.manage',
    );
    expect(a.full).toBe(false);
    expect(a.adminTargets.map((g: any) => g.grantId)).toEqual(['g-sofia']);
  });

  it.each([
    [
      'sin el átomo',
      [
        engagement({
          engagementId: 'e1',
          subjectUserId: ids.sofia,
          grants: [sofiaGrant(['agenda.appointment.view'])],
        }),
      ],
    ],
    ['sin vínculo en la organización', []],
    [
      'con el vínculo suspendido',
      [
        engagement({
          engagementId: 'e1',
          subjectUserId: ids.sofia,
          state: 'SUSPENDED',
          grants: [sofiaGrant(['team.campaigns.manage'])],
        }),
      ],
    ],
    [
      'con la concesión vencida',
      [
        engagement({
          engagementId: 'e1',
          subjectUserId: ids.sofia,
          grants: [
            grant({
              grantId: 'x',
              actions: ['team.campaigns.manage'],
              validTo: new Date('2020-01-01'),
            }),
          ],
        }),
      ],
    ],
    [
      'con el átomo solo en una concesión DENY',
      [
        engagement({
          engagementId: 'e1',
          subjectUserId: ids.sofia,
          grants: [
            grant({
              grantId: 'x',
              actions: ['team.campaigns.manage'],
              effect: 'DENY',
            }),
          ],
        }),
      ],
    ],
  ])('403 ADMIN_CEILING_EXCEEDED %s', async (_t, list) => {
    const { access, em } = build(list as any[]);
    await expect(
      access.authorize(
        em,
        staff(ids.sofia),
        ids.tenant,
        'team.campaigns.manage',
      ),
    ).rejects.toMatchObject({
      reason: Reason.ADMIN_CEILING_EXCEEDED,
    });
  });
});

describe('GovernanceAccessService.restrict', () => {
  const world = worldOf([
    engagement({
      engagementId: 'e-sofia',
      subjectUserId: ids.sofia,
      grants: [sofiaGrant(['team.campaigns.manage'])],
    }),
    engagement({
      engagementId: 'e-marcos',
      subjectUserId: ids.marcos,
      grants: [
        grant({ grantId: 'eco', actions: ['agenda.appointment.view'] }),
        grant({
          grantId: 'cardio',
          healthcareServiceId: ids.svcCardio,
          actions: ['agenda.appointment.view'],
        }),
      ],
    }),
    engagement({
      engagementId: 'e-ana',
      subjectUserId: ids.ana,
      grants: [
        grant({
          grantId: 'c2',
          healthcareServiceId: ids.svcCardio,
          actions: ['agenda.appointment.view'],
        }),
      ],
    }),
  ]);
  const { access } = build([]);

  it('quien ve todo recibe el mundo tal cual', () => {
    expect(
      access.restrict(world, {
        full: true,
        adminTargets: [],
        userId: ids.admin,
      }),
    ).toBe(world);
  });

  it('un jefe de servicio ve solo a quien tiene alguna concesión dentro de su alcance y solo esas concesiones; nunca a sí mismo', () => {
    const scope = [world.engagements[0].grants[0]];
    const r = access.restrict(world, {
      full: false,
      adminTargets: scope,
      userId: ids.sofia,
    });
    expect(r.engagements.map((e) => e.subjectUserId)).toEqual([ids.marcos]);
    expect(r.engagements[0].grants.map((g) => g.grantId)).toEqual(['eco']);
  });
});

describe('SEG A-A5: authorize aplica la función común (vigencia, DENY y reglas L1)', () => {
  const ask = async (list: any[], extra: Record<string, unknown> = {}) => {
    const loader = {
      load: mockFn().mockResolvedValue({ ...worldOf(list), ...extra }),
    };
    return new GovernanceAccessService(loader as any).authorize(
      fakeEm(),
      staff(ids.sofia),
      ids.tenant,
      'team.campaigns.manage',
    );
  };
  const sofia = (over: Record<string, unknown> = {}, grants?: any[]) =>
    engagement({
      engagementId: 'e1',
      subjectUserId: ids.sofia,
      grants: grants ?? [sofiaGrant(['team.campaigns.manage'])],
      ...over,
    });
  const denied = { reason: Reason.ADMIN_CEILING_EXCEEDED };

  it('con la recertificación vencida (aunque nadie la suspendió todavía) no administra ni lee', async () => {
    await expect(
      ask([sofia({ nextRecertificationAt: new Date('2020-01-01') })]),
    ).rejects.toMatchObject(denied);
  });

  it('con la membresía terminada o la vigencia del vínculo vencida tampoco', async () => {
    await expect(ask([sofia({ membershipLive: false })])).rejects.toMatchObject(
      denied,
    );
    await expect(
      ask([sofia({ validTo: new Date('2020-01-01') })]),
    ).rejects.toMatchObject(denied);
  });

  it('una concesión DENY sobre el átomo (en lo que se cruza) le quita el permiso aunque la ALLOW siga viva', async () => {
    await expect(
      ask([
        sofia({}, [
          sofiaGrant(['team.campaigns.manage']),
          grant({
            grantId: 'prohibido',
            actions: ['team.campaigns.manage'],
            effect: 'DENY',
          }),
        ]),
      ]),
    ).rejects.toMatchObject(denied);
  });

  it('una regla L1 DENY_PERMISSION (patrón team.campaigns.*) también', async () => {
    await expect(
      ask([sofia()], {
        denyRules: [{ permissionPattern: 'team.campaigns.*' }],
      }),
    ).rejects.toMatchObject(denied);
    // Una regla de otra plantilla no la toca.
    const ok = await ask([sofia()], {
      denyRules: [
        { permissionPattern: 'team.*', roleTemplateCode: 'FRONT_DESK' },
      ],
    });
    expect(ok.full).toBe(false);
  });

  it('con varios vínculos vivos suma lo que dan todos (no solo el primero)', async () => {
    const a = await ask([
      sofia({ engagementId: 'e1' }, [
        grant({ grantId: 'x', actions: ['agenda.appointment.view'] }),
      ]),
      sofia({ engagementId: 'e2' }, [sofiaGrant(['team.campaigns.manage'])]),
    ]);
    expect(a.adminTargets.map((g: any) => g.grantId)).toEqual(['g-sofia']);
  });
});
