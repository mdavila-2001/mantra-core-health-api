import { jest } from '@jest/globals';
import { runWithTenant } from '../../../common';
import { DIR } from '../../directory/directory.concepts';
import { DelegatedAccessErrorReason as Reason } from '../delegated_access.error-reasons';
import type { GrantTargetFacts } from '../domain';
import { STATUS } from './concept-maps';
import { DelegationScopeService } from './delegation-scope.service';
import { memoryEm } from './lifecycle.testing';
import { TeamAdminPolicy } from './team-admin.policy';
import { TeamAdminService } from './team-admin.service';

/** Mock laxo: evita el tipado estricto `Mock<never>` del runtime de jest. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const TENANT = 'org-1';
const OTHER_TENANT = 'org-2';
const DAY = 86_400_000;

const ECO: GrantTargetFacts = {
  targetKind: 'SERVICE',
  healthcareServiceId: 'svc-eco',
};
const CARDIO: GrantTargetFacts = {
  targetKind: 'SERVICE',
  healthcareServiceId: 'svc-cardio',
};
const NORTE: GrantTargetFacts = {
  targetKind: 'PRACTITIONER_LOCATION',
  practitionerProfileId: 'prof-suarez',
  practitionerRoleAssignmentId: 'role-suarez',
  careSpaceId: 'space-norte',
  careSpacePath: '/s1/a/p1/norte/',
  careSpaceSiteId: 's1',
};
const FIXED_WIDE: GrantTargetFacts = {
  targetKind: 'ALL_SERVICES',
  expansionMode: 'FIXED',
  snapshot: { rows: [{ healthcareServiceId: 'svc-eco' }] },
};
const ROJAS: GrantTargetFacts = {
  targetKind: 'PRACTITIONER',
  practitionerProfileId: 'prof-rojas',
  practitionerRoleAssignmentId: 'role-rojas',
};

const view = (
  grantId: string,
  engagementId: string,
  target: GrantTargetFacts,
  atoms: string[],
): any => ({ grantId, engagementId, target, atoms, effect: 'ALLOW' });

const CEILING = {
  allowAtoms: [
    'agenda.*',
    'patients.search.exact',
    'patients.profile.view_basic',
    'messages.inbox.view',
    'messages.conversation.reply_on_behalf',
    'messages.template.use',
  ],
  templates: [
    'SECRETARY',
    'MEDICAL_ASSISTANT',
    'NURSING',
    'FRONT_DESK',
    'CALL_CENTER',
  ],
  maxValidDays: 180,
};

const sofia = {
  id: 'sofia',
  roles: ['SUPPORT_STAFF'],
  scopedRoles: { [TENANT]: ['SUPPORT_STAFF'] },
} as any;
const gonzalo = { id: 'gonzalo', roles: ['SECURITY_ADMIN'] } as any;

const TEAM_ATOMS = new Set([
  'team.members.view',
  'team.grants.assign',
  'team.grants.revoke',
  'team.engagement.suspend',
  'team.engagement.recertify',
  'team.handover.execute',
  'team.engagement.end',
  'team.invitations.create',
  'team.requests.decide',
]);

const rec = (id: string, userId: string, tpl: string): any => ({
  assignment: {
    id,
    statusConceptId: STATUS.ACTIVE,
    roleTemplateId: tpl,
    tenantMembershipId: `m-${id}`,
  },
  tenantId: TENANT,
  userId,
  membershipStatusConceptId: DIR.MEMBERSHIP_ACTIVE,
});

function build() {
  const records = [
    rec('e-marcos', 'marcos', 'tpl-cc'),
    rec('e-ana', 'ana', 'tpl-sec'),
    rec('e-lucia', 'lucia', 'tpl-front'),
    rec('e-ricardo', 'ricardo', 'tpl-org'),
    rec('e-sofia', 'sofia', 'tpl-org'),
    rec('e-nuevo', 'nuevo', 'tpl-sec'),
    rec('e-bruno', 'bruno', 'tpl-sec'),
  ];
  const grants: Record<string, any[]> = {
    'e-marcos': [
      view('g-m-eco', 'e-marcos', ECO, ['agenda.appointment.view']),
      view('g-m-norte', 'e-marcos', NORTE, ['agenda.appointment.view']),
    ],
    'e-ana': [
      view('g-a-rojas', 'e-ana', ROJAS, [
        'agenda.appointment.view',
        'agenda.appointment.create',
      ]),
    ],
    'e-lucia': [
      view('g-l-cardio', 'e-lucia', CARDIO, ['agenda.appointment.view']),
    ],
    'e-ricardo': [
      view('g-r-eco', 'e-ricardo', ECO, [
        'team.members.view',
        'team.grants.assign',
      ]),
    ],
    'e-sofia': [
      view('g-s-eco', 'e-sofia', ECO, [
        'team.members.view',
        'team.grants.assign',
      ]),
    ],
    'e-bruno': [
      // B-A2: «FIXED» cuya foto hoy solo trae Ecografía, pero que es de TODOS los servicios.
      {
        ...view('g-b-fixed', 'e-bruno', FIXED_WIDE, [
          'agenda.appointment.view',
        ]),
      },
      // B-M1: prohibición puesta por el administrador, dentro del alcance de Sofía.
      {
        ...view('g-b-deny', 'e-bruno', ECO, ['agenda.appointment.cancel']),
        effect: 'DENY',
      },
      // B-M1: permiso con condición puesta por el administrador.
      {
        ...view('g-b-cond', 'e-bruno', ECO, ['agenda.appointment.cancel']),
        validTo: new Date(Date.now() + 30 * DAY),
        rawActionConditions: {
          'agenda.appointment.cancel': {
            schemaVersion: 1,
            limits: { actions: [{ per: 'DAY', max: 20 }] },
          },
        },
        rawCondition: {
          schemaVersion: 1,
          time: { windows: [{ days: [1], from: '08:00', to: '12:00' }] },
        },
      },
    ],
    'e-nuevo': [],
  };
  const { em, tables } = memoryEm(mockFn, {
    RoleTemplates: [
      { id: 'tpl-cc', code: 'CALL_CENTER' },
      { id: 'tpl-sec', code: 'SECRETARY' },
      { id: 'tpl-front', code: 'FRONT_DESK' },
      { id: 'tpl-org', code: 'ORG_MANAGEMENT' },
    ],
  });
  const access = {
    findEngagements: mockFn(async (_e: any, f: any) =>
      records.filter(
        (r) =>
          (!f.ids || f.ids.includes(r.assignment.id)) &&
          (!f.tenantId || f.tenantId === r.tenantId),
      ),
    ),
  };
  const adminCtx = (userId: string): any => ({
    userId,
    tenantId: TENANT,
    engagementIds: [`e-${userId}`],
    atoms: TEAM_ATOMS,
    targets: new Map([...TEAM_ATOMS].map((a) => [a, [ECO]])),
    assignGrants: [{ target: ECO, ceiling: CEILING }],
  });
  const directory = {
    liveGrantsOf: mockFn(async (_e: any, recs: any[]) =>
      recs.flatMap((r) => grants[r.assignment.id] ?? []),
    ),
    delegatedAdminOf: mockFn(
      async (_e: any, userId: string, tenantId: string) =>
        tenantId === TENANT && (userId === 'sofia' || userId === 'ricardo')
          ? adminCtx(userId)
          : null,
    ),
    isSecurityAdmin: mockFn(
      async (_e: any, userId: string) => userId === 'gonzalo',
    ),
  };
  const rules = { findActiveForTenant: mockFn().mockResolvedValue([]) };
  const policy = new TeamAdminPolicy(
    directory as any,
    access as any,
    rules as any,
  );
  const engagements = {
    addGrant: mockFn().mockResolvedValue({
      id: 'g-new',
      status: 'x',
      createdAt: new Date(),
    }),
    updateGrant: mockFn().mockResolvedValue({ ok: true }),
    recertify: mockFn().mockResolvedValue({ ok: true }),
  };
  const validator = { validate: mockFn().mockResolvedValue([]) };
  const suspension = {
    suspend: mockFn(
      async (_id: string, _dto: any, _actor: any, _now: any, guard: any) => {
        if (guard) await guard({ tenantId: TENANT, em });
        return { ok: true };
      },
    ),
    reactivate: mockFn(
      async (_id: string, _dto: any, _actor: any, _now: any, guard: any) => {
        if (guard) await guard({ tenantId: TENANT, em });
        return { status: 'PENDING_APPROVAL', approvalId: 'ap-1' };
      },
    ),
  };
  const handover = {
    offboard: mockFn(
      async (_id: string, _dto: any, _actor: any, guard: any) => {
        if (guard) await guard({ tenantId: TENANT, em });
        return { ok: true };
      },
    ),
    preview: mockFn(async (_id: string, guard: any) => {
      if (guard) await guard({ tenantId: TENANT, em });
      return { items: [] };
    }),
  };
  const lifecycle = {};
  const stepUp = { assertFresh: mockFn().mockResolvedValue(undefined) };
  const names = {
    userNames: mockFn().mockResolvedValue(
      new Map([
        ['marcos', 'Marcos'],
        ['ana', 'Ana'],
        ['lucia', 'Lucía'],
      ]),
    ),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new TeamAdminService(
    em,
    policy,
    engagements as any,
    validator as any,
    suspension as any,
    handover as any,
    lifecycle as any,
    stepUp as any,
    names as any,
    new DelegationScopeService({} as any, {} as any, {} as any, {} as any),
    logger as any,
  );
  const inTenant = <T>(fn: () => T, tenant = TENANT): T =>
    runWithTenant(tenant, fn);
  return {
    service,
    em,
    tables,
    directory,
    engagements,
    validator,
    suspension,
    handover,
    stepUp,
    inTenant,
  };
}

const ecoGrant = (extra: Record<string, unknown> = {}): any => ({
  targetKind: 'SERVICE',
  healthcareServiceId: 'svc-eco',
  actions: ['agenda.appointment.view', 'agenda.appointment.create'],
  validTo: new Date(Date.now() + 90 * DAY).toISOString(),
  ...extra,
});

describe('TeamAdminService · otorgar con techo (D-01, caso 37)', () => {
  it('Sofía otorga agenda sobre Ecografía a un nuevo colaborador: 201 y exige el paso extra', async () => {
    const t = build();
    const out = await t.inTenant(() =>
      t.service.addGrant('e-nuevo', ecoGrant(), sofia),
    );
    expect((out as { id?: string }).id).toBe('g-new');
    expect(t.stepUp.assertFresh).toHaveBeenCalled();
    expect(t.engagements.addGrant).toHaveBeenCalledWith(
      'e-nuevo',
      expect.objectContaining({ healthcareServiceId: 'svc-eco' }),
      sofia,
    );
    // Corre la validación común (barandillas, condiciones, funciones) como delegada.
    expect(t.validator.validate.mock.calls[0][1].actor).toEqual({
      delegatedAdmin: true,
    });
  });

  it('cobrar está fuera del techo: 403 ADMIN_CEILING_EXCEEDED y no se escribe nada', async () => {
    const t = build();
    const err: any = await t
      .inTenant(() =>
        t.service.addGrant(
          'e-nuevo',
          ecoGrant({ actions: ['billing.payment.collect'] }),
          sofia,
        ),
      )
      .catch((e) => e);
    expect(err.getStatus()).toBe(403);
    expect(err.reason).toBe(Reason.ADMIN_CEILING_EXCEEDED);
    expect(err.details.offendingAtoms).toContain('billing.payment.collect');
    expect(t.engagements.addGrant).not.toHaveBeenCalled();
  });

  it('los mismos átomos sobre Cardiología quedan fuera de su alcance: 403 ADMIN_SCOPE_EXCEEDED', async () => {
    const t = build();
    const err: any = await t
      .inTenant(() =>
        t.service.addGrant(
          'e-nuevo',
          ecoGrant({ healthcareServiceId: 'svc-cardio' }),
          sofia,
        ),
      )
      .catch((e) => e);
    expect(err.getStatus()).toBe(403);
    expect(err.reason).toBe(Reason.ADMIN_SCOPE_EXCEEDED);
    expect(t.engagements.addGrant).not.toHaveBeenCalled();
  });

  it('con vigencia de 200 días se rebasa maxValidDays (180): 403 ADMIN_CEILING_EXCEEDED', async () => {
    const t = build();
    const err: any = await t
      .inTenant(() =>
        t.service.addGrant(
          'e-nuevo',
          ecoGrant({ validTo: new Date(Date.now() + 200 * DAY).toISOString() }),
          sofia,
        ),
      )
      .catch((e) => e);
    expect(err.reason).toBe(Reason.ADMIN_CEILING_EXCEEDED);
    expect(err.details.maxValidDays).toBe(180);
  });

  it('un error de barandilla, condición o funciones lo devuelve la validación común en 422', async () => {
    const t = build();
    t.validator.validate.mockResolvedValue([
      {
        code: 'SOD_CONFLICT_BLOCKED',
        httpStatus: 422,
        grantIndex: 0,
        message: 'Conflicto de funciones',
      },
    ]);
    const err: any = await t
      .inTenant(() => t.service.addGrant('e-nuevo', ecoGrant(), sofia))
      .catch((e) => e);
    expect(err.getStatus()).toBe(422);
    expect(err.reason).toBe('SOD_CONFLICT_BLOCKED');
    expect(t.engagements.addGrant).not.toHaveBeenCalled();
  });

  it('SECURITY_ADMIN usa las mismas rutas con alcance total: sin techo ni alcance', async () => {
    const t = build();
    await t.inTenant(() =>
      t.service.addGrant(
        'e-nuevo',
        ecoGrant({
          healthcareServiceId: 'svc-cardio',
          actions: ['billing.payment.collect'],
        }),
        gonzalo,
      ),
    );
    expect(t.engagements.addGrant).toHaveBeenCalled();
    expect(t.validator.validate.mock.calls[0][1].actor).toEqual({
      delegatedAdmin: false,
    });
  });
});

describe('TeamAdminService · alcance y barandillas (D-02, caso 38)', () => {
  it('lista solo la población administrable y, de cada persona, solo la parte de su alcance', async () => {
    const t = build();
    const out = await t.inTenant(() => t.service.listMembers(sofia));
    const ids = out.items.map((m) => m.engagementId).sort();
    expect(ids).toEqual(['e-bruno', 'e-marcos', 'e-ricardo']); // Ana, Lucía y la propia Sofía no figuran
    const marcos = out.items.find((m) => m.engagementId === 'e-marcos')!;
    expect(marcos.grants.map((g) => g.id)).toEqual(['g-m-eco']);
    expect(marcos.otherFunctions).toBe(1);
    expect(marcos.personName).toBe('Marcos');
  });

  it('una persona de otra parte del hospital responde como inexistente (404 uniforme)', async () => {
    const t = build();
    const err: any = await t
      .inTenant(() => t.service.getMember('e-ana', sofia))
      .catch((e) => e);
    expect(err.getStatus()).toBe(404);
    expect(err.reason).toBe(Reason.SUPPORT_ENGAGEMENT_NOT_FOUND);
  });

  it('suspender a Marcos afecta a toda la persona: 403 ADMIN_SCOPE_EXCEEDED con lo que queda fuera (1)', async () => {
    const t = build();
    const err: any = await t
      .inTenant(() =>
        t.service.suspend('e-marcos', { reasonCode: 'MANUAL' }, sofia),
      )
      .catch((e) => e);
    expect(err.getStatus()).toBe(403);
    expect(err.reason).toBe(Reason.ADMIN_SCOPE_EXCEEDED);
    expect(err.details.outOfScope).toBe(1);
  });

  it('puede quitarle solo su concesión de Ecografía con team.grants.revoke', async () => {
    const t = build();
    const out = await t.inTenant(() =>
      t.service.updateGrant(
        'e-marcos',
        { grantId: 'g-m-eco', revoke: true },
        sofia,
      ),
    );
    expect((out as { ok?: boolean }).ok).toBe(true);
    expect(t.engagements.updateGrant).toHaveBeenCalledWith(
      'e-marcos',
      { grantId: 'g-m-eco', revoke: true },
      sofia,
    );
  });

  it('una concesión mixta (se cruza con algo fuera de su alcance) se puede quitar', async () => {
    const t = build();
    await t.inTenant(() =>
      t.service.updateGrant(
        'e-marcos',
        { grantId: 'g-m-norte', revoke: true },
        sofia,
      ),
    );
    expect(t.engagements.updateGrant).toHaveBeenCalled();
  });

  it('pero no se puede ampliar ni editar: fuera de su alcance es 403 ADMIN_SCOPE_EXCEEDED', async () => {
    const t = build();
    const err: any = await t
      .inTenant(() =>
        t.service.updateGrant(
          'e-marcos',
          { grantId: 'g-m-norte', actions: ['agenda.appointment.view'] } as any,
          sofia,
        ),
      )
      .catch((e) => e);
    expect(err.reason).toBe(Reason.ADMIN_SCOPE_EXCEEDED);
    expect(t.engagements.updateGrant).not.toHaveBeenCalled();
  });

  it('con solo team.grants.revoke no puede editar: únicamente quitar', async () => {
    const t = build();
    t.directory.delegatedAdminOf.mockResolvedValue({
      userId: 'sofia',
      tenantId: TENANT,
      engagementIds: ['e-sofia'],
      atoms: new Set(['team.grants.revoke']),
      targets: new Map([['team.grants.revoke', [ECO]]]),
      assignGrants: [],
    });
    await expect(
      t.inTenant(() =>
        t.service.updateGrant(
          'e-marcos',
          { grantId: 'g-m-eco', actions: ['agenda.appointment.view'] } as any,
          sofia,
        ),
      ),
    ).rejects.toMatchObject({ reason: Reason.ADMIN_CEILING_EXCEEDED });
  });

  it('Sofía no se otorga nada a sí misma (GP-6): 403 GUARDRAIL_SELF_ADMIN', async () => {
    const t = build();
    const err: any = await t
      .inTenant(() => t.service.addGrant('e-sofia', ecoGrant(), sofia))
      .catch((e) => e);
    expect(err.getStatus()).toBe(403);
    expect(err.reason).toBe(Reason.GUARDRAIL_SELF_ADMIN);
  });

  it('ni a otro administrador delegado (GP-6): 403 GUARDRAIL_PEER_ADMIN', async () => {
    const t = build();
    const err: any = await t
      .inTenant(() => t.service.addGrant('e-ricardo', ecoGrant(), sofia))
      .catch((e) => e);
    expect(err.getStatus()).toBe(403);
    expect(err.reason).toBe(Reason.GUARDRAIL_PEER_ADMIN);
  });

  it('con el encabezado de otra organización responde 403 de ámbito: ahí no es administradora', async () => {
    const t = build();
    const err: any = await t
      .inTenant(() => t.service.listMembers(sofia), OTHER_TENANT)
      .catch((e) => e);
    expect(err.getStatus()).toBe(403);
    expect(err.reason).toBe(Reason.ADMIN_SCOPE_EXCEEDED);
  });

  it('un administrador delegado sin el átomo de la operación recibe 403 ADMIN_CEILING_EXCEEDED', async () => {
    const t = build();
    t.directory.delegatedAdminOf.mockResolvedValue({
      userId: 'sofia',
      tenantId: TENANT,
      engagementIds: ['e-sofia'],
      atoms: new Set(['team.members.view']),
      targets: new Map([['team.members.view', [ECO]]]),
      assignGrants: [],
    });
    const err: any = await t
      .inTenant(() =>
        t.service.suspend('e-marcos', { reasonCode: 'MANUAL' }, sofia),
      )
      .catch((e) => e);
    expect(err.reason).toBe(Reason.ADMIN_CEILING_EXCEEDED);
    expect(t.suspension.suspend).not.toHaveBeenCalled();
  });

  it('SECURITY_ADMIN suspende sin alcance acotado', async () => {
    const t = build();
    await t.inTenant(() =>
      t.service.suspend('e-marcos', { reasonCode: 'MANUAL' }, gonzalo),
    );
    expect(t.suspension.suspend).toHaveBeenCalled();
  });
});

describe('TeamAdminService · baja y traspaso por alcance', () => {
  it('dar de baja exige que toda la persona esté en su alcance (Lucía, de Cardiología, no lo está: 404 uniforme)', async () => {
    const t = build();
    const err: any = await t
      .inTenant(() =>
        t.service.offboard('e-lucia', { reason: 'x', handover: null }, sofia),
      )
      .catch((e) => e);
    expect(err.getStatus()).toBe(404);
    expect(t.handover.offboard).not.toHaveBeenCalled();
  });

  it('Marcos tiene funciones fuera de su alcance: 403 ADMIN_SCOPE_EXCEEDED y la baja ni empieza', async () => {
    const t = build();
    const err: any = await t
      .inTenant(() =>
        t.service.offboard('e-marcos', { reason: 'x', handover: null }, sofia),
      )
      .catch((e) => e);
    expect(err.reason).toBe(Reason.ADMIN_SCOPE_EXCEEDED);
    expect(err.details.outOfScope).toBe(1);
  });

  it('la vista previa del traspaso también exige alcance', async () => {
    const t = build();
    await expect(
      t.inTenant(() => t.service.handoverPreview('e-marcos', sofia)),
    ).rejects.toMatchObject({ reason: Reason.ADMIN_SCOPE_EXCEEDED });
  });
});

describe('TeamAdminService · editar permisos: lo que un delegado NO puede aflojar (B-A2, B-M1, B-M2)', () => {
  it('B-A2: pasar un FIXED más ancho que su alcance a DYNAMIC se mide con el alcance DESPUÉS del cambio: 403 ADMIN_SCOPE_EXCEEDED', async () => {
    const t = build();
    const err: any = await t
      .inTenant(() =>
        t.service.updateGrant(
          'e-bruno',
          { grantId: 'g-b-fixed', expansionMode: 'DYNAMIC' } as any,
          sofia,
        ),
      )
      .catch((e) => e);
    expect(err.reason).toBe(Reason.ADMIN_SCOPE_EXCEEDED);
    expect(t.engagements.updateGrant).not.toHaveBeenCalled();
  });

  it('B-A2: el cambio a DYNAMIC (y todo cambio que no sea quitar) pide el paso extra', async () => {
    const t = build();
    t.stepUp.assertFresh.mockRejectedValueOnce(
      Object.assign(new Error('x'), { reason: 'STEP_UP_REQUIRED' }),
    );
    await expect(
      t.inTenant(() =>
        t.service.updateGrant(
          'e-bruno',
          { grantId: 'g-b-fixed', expansionMode: 'FIXED' } as any,
          sofia,
        ),
      ),
    ).rejects.toMatchObject({ reason: 'STEP_UP_REQUIRED' });
    expect(t.engagements.updateGrant).not.toHaveBeenCalled();
  });

  it('B-A2: mantener FIXED (o estrechar) dentro de su alcance sigue permitido', async () => {
    const t = build();
    await t.inTenant(() =>
      t.service.updateGrant(
        'e-bruno',
        {
          grantId: 'g-b-fixed',
          expansionMode: 'FIXED',
          validTo: new Date(Date.now() + 30 * DAY).toISOString(),
        } as any,
        sofia,
      ),
    );
    expect(t.engagements.updateGrant).toHaveBeenCalled();
  });

  it('B-M1: un delegado no revoca ni edita una prohibición DENY del administrador', async () => {
    const t = build();
    for (const dto of [
      { grantId: 'g-b-deny', revoke: true },
      {
        grantId: 'g-b-deny',
        validTo: new Date(Date.now() + DAY).toISOString(),
      },
    ]) {
      const err: any = await t
        .inTenant(() => t.service.updateGrant('e-bruno', dto as any, sofia))
        .catch((e) => e);
      expect(err.reason).toBe(Reason.ADMIN_CEILING_EXCEEDED);
      expect(err.details.breach).toBe('DENY_GRANT');
    }
    expect(t.engagements.updateGrant).not.toHaveBeenCalled();
  });

  it('B-M1: SECURITY_ADMIN sí puede revocar una prohibición', async () => {
    const t = build();
    await t.inTenant(() =>
      t.service.updateGrant(
        'e-bruno',
        { grantId: 'g-b-deny', revoke: true },
        gonzalo,
      ),
    );
    expect(t.engagements.updateGrant).toHaveBeenCalled();
  });

  it('B-M1: un delegado no quita ni afloja las condiciones del administrador', async () => {
    const t = build();
    for (const dto of [
      { grantId: 'g-b-cond', condition: { schemaVersion: 1 } },
      { grantId: 'g-b-cond', actionConditions: {} },
      {
        grantId: 'g-b-cond',
        condition: {
          schemaVersion: 1,
          time: { windows: [{ days: [1, 2, 3], from: '00:00', to: '23:59' }] },
        },
      },
    ]) {
      const err: any = await t
        .inTenant(() => t.service.updateGrant('e-bruno', dto as any, sofia))
        .catch((e) => e);
      expect(err.reason).toBe(Reason.ADMIN_CEILING_EXCEEDED);
      expect(err.details.breach).toBe('CONDITION_LOOSENED');
    }
    expect(t.engagements.updateGrant).not.toHaveBeenCalled();
  });

  it('B-M1: sí puede AGREGAR una restricción que conserva la del administrador', async () => {
    const t = build();
    await t.inTenant(() =>
      t.service.updateGrant(
        'e-bruno',
        {
          grantId: 'g-b-cond',
          condition: {
            schemaVersion: 1,
            time: {
              windows: [{ days: [1], from: '08:00', to: '12:00' }],
            },
            network: 'ORG_RULES',
          },
        } as any,
        sofia,
      ),
    );
    expect(t.engagements.updateGrant).toHaveBeenCalled();
  });
});
