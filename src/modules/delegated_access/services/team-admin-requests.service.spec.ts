import { jest } from '@jest/globals';
import { runWithTenant } from '../../../common';
import { DELEG } from '../delegated_access.concepts';
import { DelegatedAccessErrorReason as Reason } from '../delegated_access.error-reasons';
import type { GrantTargetFacts } from '../domain';
import { DelegationScopeService } from './delegation-scope.service';
import { TeamAdminPolicy } from './team-admin.policy';
import { TeamAdminRequestsService } from './team-admin-requests.service';
import { memoryEm } from './lifecycle.testing';

/** Mock laxo: evita el tipado estricto `Mock<never>` del runtime de jest. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const TENANT = 'org-1';
const DAY = 86_400_000;
const ROJAS: GrantTargetFacts = {
  targetKind: 'PRACTITIONER',
  practitionerProfileId: 'prof-rojas',
  practitionerRoleAssignmentId: 'role-rojas',
};
const CEILING = {
  allowAtoms: ['agenda.*', 'patients.search.exact'],
  templates: ['SECRETARY', 'FRONT_DESK'],
  maxValidDays: 180,
};
const sofia = {
  id: 'sofia',
  roles: ['SUPPORT_STAFF'],
  scopedRoles: { [TENANT]: ['SUPPORT_STAFF'] },
} as any;
const gonzalo = { id: 'gonzalo', roles: ['SECURITY_ADMIN'] } as any;

const item = (id: string, roleId: string, actions: string[]): any => ({
  id,
  targetKind: 'PRACTITIONER',
  practitionerRoleAssignmentId: roleId,
  proposedActions: actions,
  decision: 'PENDING',
});

function build() {
  const { em } = memoryEm(mockFn, {
    RoleTemplates: [{ id: 'tpl-sec', code: 'SECRETARY' }],
  });
  const ctx: any = {
    userId: 'sofia',
    tenantId: TENANT,
    engagementIds: ['e-sofia'],
    atoms: new Set([
      'team.requests.decide',
      'team.invitations.create',
      'team.members.view',
    ]),
    targets: new Map([
      ['team.requests.decide', [ROJAS]],
      ['team.invitations.create', [ROJAS]],
      ['team.members.view', [ROJAS]],
    ]),
    assignGrants: [{ target: ROJAS, ceiling: CEILING }],
  };
  const directory = {
    delegatedAdminOf: mockFn(async (_e: any, u: string, t: string) =>
      u === 'sofia' && t === TENANT ? ctx : null,
    ),
    isSecurityAdmin: mockFn(async (_e: any, u: string) => u === 'gonzalo'),
    liveGrantsOf: mockFn().mockResolvedValue([]),
  };
  const access = {
    findEngagements: mockFn().mockResolvedValue([]),
    findRoleAssignments: mockFn().mockResolvedValue(
      new Map([
        [
          'role-rojas',
          {
            id: 'role-rojas',
            practitionerProfileId: 'prof-rojas',
            tenantId: TENANT,
          },
        ],
        [
          'role-suarez',
          {
            id: 'role-suarez',
            practitionerProfileId: 'prof-suarez',
            tenantId: TENANT,
          },
        ],
      ]),
    ),
    findCareSpaces: mockFn().mockResolvedValue(new Map()),
  };
  const policy = new TeamAdminPolicy(
    directory as any,
    access as any,
    { findActiveForTenant: mockFn().mockResolvedValue([]) } as any,
  );
  const requests = {
    decide: mockFn().mockResolvedValue({
      requestId: 'req-1',
      status: 'PENDING',
      pendingItemIds: ['i2'],
      grantIds: ['g1'],
    }),
    listForTenant: mockFn().mockResolvedValue({
      items: [
        {
          id: 'req-1',
          tenantId: TENANT,
          requesterUserId: 'user-ana',
          roleTemplateId: 'tpl-sec',
          roleTemplateCode: 'SECRETARY',
          status: 'PENDING',
          items: [
            item('i1', 'role-rojas', ['agenda.appointment.view']),
            item('i2', 'role-suarez', ['agenda.appointment.view']),
          ],
        },
        {
          id: 'req-2',
          tenantId: TENANT,
          requesterUserId: 'user-x',
          roleTemplateId: 'tpl-sec',
          roleTemplateCode: 'SECRETARY',
          status: 'PENDING',
          items: [item('i3', 'role-suarez', ['agenda.appointment.view'])],
        },
      ],
      count: 2,
      nextCursor: null,
    }),
  };
  const requestsRepo = {
    findById: mockFn().mockResolvedValue({
      id: 'req-1',
      tenantId: TENANT,
      roleTemplateId: 'tpl-sec',
    }),
    findItems: mockFn().mockResolvedValue([
      {
        id: 'i1',
        targetKindConceptId: DELEG.SUPPORT_TARGET_PRACTITIONER,
        practitionerRoleAssignmentId: 'role-rojas',
        proposedActionsJson: ['agenda.appointment.view'],
      },
      {
        id: 'i2',
        targetKindConceptId: DELEG.SUPPORT_TARGET_PRACTITIONER,
        practitionerRoleAssignmentId: 'role-suarez',
        proposedActionsJson: ['agenda.appointment.view'],
      },
    ]),
  };
  const invitations = {
    create: mockFn().mockResolvedValue({
      id: 'inv-1',
      code: 'abc',
      maxUses: 1,
      expiresAt: new Date(),
    }),
  };
  const templates = {
    findById: mockFn().mockResolvedValue({ id: 'tpl-sec', code: 'SECRETARY' }),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new TeamAdminRequestsService(
    em,
    policy,
    requests as any,
    requestsRepo as any,
    invitations as any,
    templates as any,
    new DelegationScopeService({} as any, {} as any, {} as any, {} as any),
    logger as any,
  );
  const inTenant = <T>(fn: () => T): T => runWithTenant(TENANT, fn);
  return {
    service,
    requests,
    requestsRepo,
    invitations,
    directory,
    ctx,
    inTenant,
  };
}

describe('TeamAdminRequestsService · invitaciones (caso 37)', () => {
  it('invita personal de apoyo con una plantilla de su techo', async () => {
    const t = build();
    const dto: any = { kind: 'SUPPORT_STAFF', roleTemplateCode: 'SECRETARY' };
    await t.inTenant(() => t.service.invite(dto, sofia));
    expect(t.invitations.create).toHaveBeenCalledWith(dto, sofia);
  });

  it('una plantilla fuera del techo es 403 ADMIN_CEILING_EXCEEDED', async () => {
    const t = build();
    const err: any = await t
      .inTenant(() =>
        t.service.invite(
          { kind: 'SUPPORT_STAFF', roleTemplateCode: 'ORG_MANAGEMENT' } as any,
          sofia,
        ),
      )
      .catch((e) => e);
    expect(err.getStatus()).toBe(403);
    expect(err.reason).toBe(Reason.ADMIN_CEILING_EXCEEDED);
    expect(t.invitations.create).not.toHaveBeenCalled();
  });

  it('un delegado no afilia doctores: 403 ADMIN_CEILING_EXCEEDED', async () => {
    const t = build();
    await expect(
      t.inTenant(() =>
        t.service.invite({ kind: 'PRACTITIONER' } as any, sofia),
      ),
    ).rejects.toMatchObject({ reason: Reason.ADMIN_CEILING_EXCEEDED });
  });

  it('SECURITY_ADMIN invita con alcance total', async () => {
    const t = build();
    await t.inTenant(() =>
      t.service.invite({ kind: 'PRACTITIONER' } as any, gonzalo),
    );
    expect(t.invitations.create).toHaveBeenCalled();
  });
});

describe('TeamAdminRequestsService · solicitudes por alcance', () => {
  it('lista solo los ítems dentro de su alcance; una solicitud sin ítems propios no aparece', async () => {
    const t = build();
    const out = await t.inTenant(() => t.service.listRequests(sofia));
    expect(out.items.map((r: any) => r.id)).toEqual(['req-1']);
    expect(out.items[0].items.map((i: any) => i.id)).toEqual(['i1']);
    expect(out.items[0].otherItems).toBe(1);
  });

  it('decide por alcance: pasa a la solicitud el alcance y el techo de Sofía; el resto queda pendiente', async () => {
    const t = build();
    const dto: any = { items: [{ itemId: 'i1', decision: 'APPROVED' }] };
    const out = await t.inTenant(() => t.service.decide('req-1', dto, sofia));
    expect(out.pendingItemIds).toEqual(['i2']);
    const [, , , options] = t.requests.decide.mock.calls[0];
    const [mine, theirs] =
      (await t.requestsRepo.findItems.mock.results[0]?.value) ??
      (await t.requestsRepo.findItems());
    expect(await options.scope.inScope(mine)).toBe(true);
    expect(await options.scope.inScope(theirs)).toBe(false);
    const in30 = new Date(Date.now() + 30 * DAY).toISOString();
    await expect(
      options.scope.assertCeiling(mine, {
        itemId: 'i1',
        decision: 'APPROVED',
        validTo: in30,
      }),
    ).resolves.toBeUndefined();
    // Sin fecha de fin el permiso nacería sin límite: rebasa maxValidDays (180).
    await expect(
      options.scope.assertCeiling(mine, { itemId: 'i1', decision: 'APPROVED' }),
    ).rejects.toMatchObject({ reason: Reason.ADMIN_CEILING_EXCEEDED });
    await expect(
      options.scope.assertCeiling(mine, {
        itemId: 'i1',
        decision: 'APPROVED',
        actions: ['billing.payment.collect'],
        validTo: in30,
      }),
    ).rejects.toMatchObject({ reason: Reason.ADMIN_CEILING_EXCEEDED });
    await expect(
      options.scope.assertCeiling(mine, {
        itemId: 'i1',
        decision: 'APPROVED',
        validTo: new Date(Date.now() + 200 * DAY).toISOString(),
      }),
    ).rejects.toMatchObject({ reason: Reason.ADMIN_CEILING_EXCEEDED });
  });

  it('B-A3: el techo se mide sobre lo que se EMITE: APPROVED ignora el ajuste y emite todas las acciones propuestas', async () => {
    const t = build();
    await t.inTenant(() =>
      t.service.decide(
        'req-1',
        { items: [{ itemId: 'i1', decision: 'APPROVED' }] } as any,
        sofia,
      ),
    );
    const [, , , options] = t.requests.decide.mock.calls[0];
    const greedy: any = {
      id: 'i1',
      targetKindConceptId: DELEG.SUPPORT_TARGET_PRACTITIONER,
      practitionerRoleAssignmentId: 'role-rojas',
      proposedActionsJson: [
        'agenda.appointment.view',
        'billing.payment.collect',
      ],
    };
    const validTo = new Date(Date.now() + 30 * DAY).toISOString();
    // APPROVED + ajuste «inocente»: emitGrant concede lo propuesto, no el ajuste.
    await expect(
      options.scope.assertCeiling(greedy, {
        itemId: 'i1',
        decision: 'APPROVED',
        validTo,
        adjustment: {
          targetKind: 'PRACTITIONER',
          practitionerRoleAssignmentId: 'role-rojas',
          actions: ['agenda.appointment.view'],
        },
      }),
    ).rejects.toMatchObject({ reason: Reason.ADMIN_CEILING_EXCEEDED });
    // ADJUSTED sí emite el ajuste: ahí el ajuste es lo que se mide.
    await expect(
      options.scope.assertCeiling(greedy, {
        itemId: 'i1',
        decision: 'ADJUSTED',
        comment: 'solo lectura',
        validTo,
        adjustment: {
          targetKind: 'PRACTITIONER',
          practitionerRoleAssignmentId: 'role-rojas',
          actions: ['agenda.appointment.view'],
        },
      }),
    ).resolves.toBeUndefined();
  });

  it('B-B7 (GP-6): un delegado no decide la solicitud de otro administrador (aprobación cruzada): 403 GUARDRAIL_PEER_ADMIN', async () => {
    const t = build();
    t.requestsRepo.findById.mockResolvedValue({
      id: 'req-1',
      tenantId: TENANT,
      roleTemplateId: 'tpl-sec',
      requesterUserId: 'ricardo', // otro delegado
    });
    t.directory.delegatedAdminOf.mockImplementation(
      async (_e: any, u: string, tn: string) =>
        tn === TENANT && (u === 'sofia' || u === 'ricardo') ? t.ctx : null,
    );
    const err: any = await t
      .inTenant(() =>
        t.service.decide(
          'req-1',
          { items: [{ itemId: 'i1', decision: 'APPROVED' }] } as any,
          sofia,
        ),
      )
      .catch((e) => e);
    expect(err.reason).toBe(Reason.GUARDRAIL_PEER_ADMIN);
    expect(t.requests.decide).not.toHaveBeenCalled();
  });

  it('B-B7: la misma regla para quien solicita siendo SECURITY_ADMIN; y SECURITY_ADMIN sí decide la de un delegado', async () => {
    const t = build();
    t.requestsRepo.findById.mockResolvedValue({
      id: 'req-1',
      tenantId: TENANT,
      roleTemplateId: 'tpl-sec',
      requesterUserId: 'gonzalo',
    });
    await expect(
      t.inTenant(() => t.service.decide('req-1', { items: [] } as any, sofia)),
    ).rejects.toMatchObject({ reason: Reason.GUARDRAIL_PEER_ADMIN });
    t.requestsRepo.findById.mockResolvedValue({
      id: 'req-1',
      tenantId: TENANT,
      roleTemplateId: 'tpl-sec',
      requesterUserId: 'sofia',
    });
    await t.inTenant(() =>
      t.service.decide('req-1', { items: [] } as any, gonzalo),
    );
    expect(t.requests.decide).toHaveBeenCalledTimes(1);
  });

  it('SECURITY_ADMIN por /org/team conserva la regla actual: sin alcance, decide todo', async () => {
    const t = build();
    const dto: any = { items: [] };
    await t.inTenant(() => t.service.decide('req-1', dto, gonzalo));
    expect(t.requests.decide).toHaveBeenCalledWith('req-1', dto, gonzalo);
  });

  it('sin el átomo team.requests.decide un delegado recibe 403', async () => {
    const t = build();
    const other = { ...sofia, id: 'otro' };
    await expect(
      t.inTenant(() => t.service.decide('req-1', { items: [] } as any, other)),
    ).rejects.toMatchObject({ reason: Reason.ADMIN_SCOPE_EXCEEDED });
  });
});
