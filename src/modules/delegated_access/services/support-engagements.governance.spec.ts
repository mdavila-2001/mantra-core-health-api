import { jest } from '@jest/globals';
import { runWithTenant } from '../../../common';
import { AUTHZ } from '../../authz/authz.concepts';
import { DELEG } from '../delegated_access.concepts';
import { permissionAtomId, supportPermissionId } from '../domain';
import { DelegatedAccessErrorReason as Reason } from '../delegated_access.error-reasons';
import { simulationTokenOf } from './access-explain.support';
import { DelegationScopeService } from './delegation-scope.service';
import { STATUS } from './concept-maps';
import { namesRepoDouble } from './support-names.testing';
import { SupportEngagementsService } from './support-engagements.service';
import { SupportAdminDirectory } from './support-admin-directory';
import { TeamAdminPolicy } from './team-admin.policy';
import { DIR } from '../../directory/directory.concepts';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
const TENANT = 'tenant-1';
const ADMIN = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/** Servicio con el guardián de escritura del gobierno inyectado (las suites anteriores no lo traen). */
function build(
  guard?: any,
  audit?: any,
  stepUp?: any,
  fourEyes?: any,
  held: any[] = [],
  /** Quién es quien pidió HOY (N-2): por defecto sigue siendo administrador de seguridad. */
  who: { securityAdmin?: boolean; delegated?: any } = {},
) {
  const assignment: any = {
    id: 'eng-1',
    statusConceptId: STATUS.ACTIVE,
    recertifyEveryMonths: 12,
    nextRecertificationAt: new Date('2027-01-01'),
    roleTemplateId: 'tpl',
    tenantMembershipId: 'mem-1',
    rowVersion: 0,
  };
  const record = {
    assignment,
    tenantId: TENANT,
    userId: 'user-ana',
    membershipStatusConceptId: DIR.MEMBERSHIP_ACTIVE,
  };
  const tx: any = {
    flush: mockFn().mockResolvedValue(undefined),
    execute: mockFn(),
  };
  const em: any = {
    transactional: mockFn((cb: any) => cb(tx)),
    fork: mockFn().mockReturnValue(tx),
  };
  const grantRow: any = {
    id: 'g1',
    organizationUserAssignmentId: 'eng-1',
    statusConceptId: DELEG.SUPPORT_GRANT_ACTIVE,
    targetKindConceptId: DELEG.SUPPORT_TARGET_ALL,
    effectConceptId: AUTHZ.EFFECT_ALLOW,
  };
  const grants = {
    findById: mockFn(async (_tx: any, id: string) =>
      id === 'g-held'
        ? {
            ...held[0]?.grant,
            validTo: held[0]?.grant.validTo,
            practitionerRoleAssignmentId:
              held[0]?.grant.practitionerRoleAssignmentId,
          }
        : grantRow,
    ),
    create: mockFn().mockReturnValue({
      id: 'g-new',
      statusConceptId: DELEG.SUPPORT_GRANT_ACTIVE,
      createdAt: new Date(),
    }),
    addActions: mockFn(),
    findActions: mockFn().mockResolvedValue([]),
    findLiveActions: mockFn().mockResolvedValue([
      {
        permissionId: supportPermissionId('schedule.view'),
        conditionJson: null,
      },
    ]),
    removeActions: mockFn(),
  };
  const templates = {
    findById: mockFn().mockResolvedValue({ code: 'SECRETARY' }),
  };
  const scope = new DelegationScopeService(
    {} as any,
    {} as any,
    {} as any,
    {} as any,
  );
  const access = {
    findEngagements: mockFn().mockResolvedValue([record]),
    findGrantsWithActions: mockFn().mockResolvedValue(held),
    findRoleAssignments: mockFn().mockResolvedValue(new Map()),
    findCareSpaces: mockFn().mockResolvedValue(new Map()),
  };
  const isSecurityAdmin = mockFn().mockResolvedValue(who.securityAdmin ?? true);
  const directory = Object.assign(
    new SupportAdminDirectory(access as any, {} as any),
    {
      isSecurityAdmin,
      isPlatformAdmin: mockFn().mockResolvedValue(false),
      delegatedAdminOf: mockFn().mockResolvedValue(who.delegated ?? null),
    },
  );
  const policy = new TeamAdminPolicy(
    directory,
    access as any,
    {
      findActiveForTenant: mockFn().mockResolvedValue([]),
    } as any,
  );
  const service = new SupportEngagementsService(
    em,
    access as any,
    { findDelegations: mockFn().mockResolvedValue([]) } as any,
    grants as any,
    { findByRequester: mockFn().mockResolvedValue([]) } as any,
    templates as any,
    { record: mockFn() } as any,
    {
      assertTarget: mockFn().mockResolvedValue({}),
      buildSnapshot: mockFn(),
    } as any,
    { refreshTenant: mockFn().mockResolvedValue({}) } as any,
    scope,
    { setContext: mockFn(), info: mockFn(), warn: mockFn() } as any,
    namesRepoDouble(mockFn) as any,
    undefined,
    guard,
    audit,
    stepUp,
    fourEyes,
    policy,
    directory,
  );
  const inTenant = <T>(fn: () => T): T => runWithTenant(TENANT, fn);
  return {
    service,
    grants,
    grantRow,
    templates,
    tx,
    inTenant,
    directory,
    isSecurityAdmin,
    policy,
  };
}

const guardOk = () => ({
  assertCanWrite: mockFn().mockResolvedValue({ sodWarnings: [] }),
});

describe('sellos de auditoría con nombre propio (pendiente 31)', () => {
  const sealer = () => ({ seal: mockFn().mockResolvedValue(undefined) });
  const actions = (a: any) =>
    a.seal.mock.calls.map((c: any[]) => c[3] as string);

  it('crear una concesión DENY sella SUPPORT_GRANT_DENY_CREATED con el id de la concesión', async () => {
    const audit = sealer();
    const d = build(guardOk(), audit);
    await d.inTenant(() =>
      d.service.addGrant(
        'eng-1',
        {
          targetKind: 'ALL',
          actions: ['agenda.appointment.view.reason'],
          effect: 'DENY',
        } as any,
        ADMIN,
      ),
    );
    expect(actions(audit)).toContain('SUPPORT_GRANT_DENY_CREATED');
    const call = audit.seal.mock.calls.find(
      (c: any[]) => c[3] === 'SUPPORT_GRANT_DENY_CREATED',
    );
    expect(call[1]).toBe(ADMIN);
    expect(call[2]).toBe(TENANT);
    expect(call[4]).toBe('support_scope_grant');
    expect(call[5]).toBe('g-new');
  });

  it('una concesión ALLOW normal no sella el nombre de DENY', async () => {
    const audit = sealer();
    const d = build(guardOk(), audit);
    await d.inTenant(() =>
      d.service.addGrant(
        'eng-1',
        { targetKind: 'ALL', actions: ['agenda.appointment.view'] } as any,
        ADMIN,
      ),
    );
    expect(actions(audit)).not.toContain('SUPPORT_GRANT_DENY_CREATED');
  });

  it('cambiar las condiciones de una concesión sella SUPPORT_GRANT_CONDITIONS_UPDATED', async () => {
    const audit = sealer();
    const d = build(guardOk(), audit);
    await d.inTenant(() =>
      d.service.updateGrant(
        'eng-1',
        {
          grantId: 'g1',
          condition: { schemaVersion: 1, patients: { scope: 'ALL' } },
        } as any,
        ADMIN,
      ),
    );
    expect(actions(audit)).toContain('SUPPORT_GRANT_CONDITIONS_UPDATED');
  });

  it('editar solo la vigencia o dar de baja no sella el nombre de condiciones', async () => {
    const audit = sealer();
    const d = build(guardOk(), audit);
    await d.inTenant(() =>
      d.service.updateGrant(
        'eng-1',
        { grantId: 'g1', revoke: true } as any,
        ADMIN,
      ),
    );
    expect(actions(audit)).not.toContain('SUPPORT_GRANT_CONDITIONS_UPDATED');
  });
});

describe('SupportEngagementsService.addGrant con el gobierno de accesos', () => {
  const dto = {
    targetKind: 'ALL',
    actions: ['agenda.appointment.view', 'agenda.appointment.cancel'],
  } as any;

  it('antes de crear pregunta al guardián con la plantilla del vínculo y el permiso propuesto', async () => {
    const guard = guardOk();
    const d = build(guard);
    await d.inTenant(() => d.service.addGrant('eng-1', dto, ADMIN));
    expect(guard.assertCanWrite).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        tenantId: TENANT,
        engagementId: 'eng-1',
        userId: 'user-ana',
        templateCode: 'SECRETARY',
        actor: ADMIN,
        grant: expect.objectContaining({
          targetKind: 'ALL',
          actions: dto.actions,
        }),
      }),
    );
    expect(guard.assertCanWrite.mock.invocationCallOrder[0]).toBeLessThan(
      d.grants.create.mock.invocationCallOrder[0],
    );
  });

  it('si el guardián rechaza (techo, SoD…) no se crea nada', async () => {
    const guard = {
      assertCanWrite: mockFn().mockRejectedValue(
        Object.assign(new Error('x'), { reason: 'GUARDRAIL_CEILING_EXCEEDED' }),
      ),
    };
    const d = build(guard);
    await expect(
      d.inTenant(() => d.service.addGrant('eng-1', dto, ADMIN)),
    ).rejects.toMatchObject({
      reason: 'GUARDRAIL_CEILING_EXCEEDED',
    });
    expect(d.grants.create).not.toHaveBeenCalled();
    expect(d.grants.addActions).not.toHaveBeenCalled();
  });

  it('guarda los permisos atómicos con su id, y los alias heredados con el suyo (no se expanden al escribir)', async () => {
    const d = build(guardOk());
    await d.inTenant(() =>
      d.service.addGrant(
        'eng-1',
        { ...dto, actions: ['agenda.appointment.view', 'schedule.cancel'] },
        ADMIN,
      ),
    );
    const [[, , rows]] = d.grants.addActions.mock.calls;
    expect(rows).toEqual([
      permissionAtomId('agenda.appointment.view'),
      supportPermissionId('schedule.cancel'),
    ]);
  });

  it('una prohibición (DENY) y su condición se guardan con el efecto y la versión del esquema', async () => {
    const d = build(guardOk());
    const condition = {
      schemaVersion: 1,
      patients: { flags: { anyOf: ['CONFIDENTIAL'] } },
    };
    await d.inTenant(() =>
      d.service.addGrant('eng-1', { ...dto, effect: 'DENY', condition }, ADMIN),
    );
    const [[, data]] = d.grants.create.mock.calls;
    expect(data.effectConceptId).toBe(AUTHZ.EFFECT_DENY);
    expect(data.condition).toEqual(condition);
    expect(data.conditionSchemaVersion).toBe(1);
  });

  it('un permiso ALLOW sin condición nace como siempre (sin efecto ni condición explícitos)', async () => {
    const d = build(guardOk());
    await d.inTenant(() => d.service.addGrant('eng-1', dto, ADMIN));
    const [[, data]] = d.grants.create.mock.calls;
    expect(data).not.toHaveProperty('effectConceptId');
    expect(data).not.toHaveProperty('condition');
  });

  it('la condición propia de un átomo viaja con su fila de acción', async () => {
    const d = build(guardOk());
    const condition = {
      schemaVersion: 1,
      appointment: {
        leadTime: { minHours: 24, onViolation: 'REQUIRE_APPROVAL' },
      },
    };
    await d.inTenant(() =>
      d.service.addGrant(
        'eng-1',
        {
          ...dto,
          actionConditions: { 'agenda.appointment.cancel': condition },
        },
        ADMIN,
      ),
    );
    const [[, , rows]] = d.grants.addActions.mock.calls;
    expect(rows).toEqual([
      permissionAtomId('agenda.appointment.view'),
      {
        permissionId: permissionAtomId('agenda.appointment.cancel'),
        condition,
        conditionSchemaVersion: 1,
      },
    ]);
  });

  describe('simulationToken (409 SIMULATION_STALE)', () => {
    const draftOf = (actions: string[]) => ({
      mode: 'PATCH',
      grants: [{ effect: 'ALLOW', actions, targetKind: 'ALL' }],
      removeGrantIds: [],
    });

    it('lo simulado es lo que se guarda: pasa', async () => {
      const d = build(guardOk());
      const token = simulationTokenOf(
        'eng-1',
        draftOf(dto.actions) as any,
        new Date(),
      );
      await expect(
        d.inTenant(() =>
          d.service.addGrant(
            'eng-1',
            { ...dto, simulationToken: token },
            ADMIN,
          ),
        ),
      ).resolves.toBeDefined();
    });

    it('lo que se guarda no es lo simulado: 409 y no se crea nada', async () => {
      const d = build(guardOk());
      const token = simulationTokenOf(
        'eng-1',
        draftOf(['agenda.appointment.view']) as any,
        new Date(),
      );
      const err: any = await d
        .inTenant(() =>
          d.service.addGrant(
            'eng-1',
            { ...dto, simulationToken: token },
            ADMIN,
          ),
        )
        .catch((e: unknown) => e);
      expect(err.getStatus()).toBe(409);
      expect(err.reason).toBe('SIMULATION_STALE');
      expect(d.grants.create).not.toHaveBeenCalled();
    });

    it('sin token el cliente de API sigue guardando como siempre', async () => {
      const d = build(guardOk());
      await expect(
        d.inTenant(() => d.service.addGrant('eng-1', dto, ADMIN)),
      ).resolves.toBeDefined();
    });
  });
});

describe('SupportEngagementsService.updateGrant con el gobierno de accesos', () => {
  it('cambiar las acciones pasa por el guardián con lo que se reemplaza', async () => {
    const guard = guardOk();
    const d = build(guard);
    await d.inTenant(() =>
      d.service.updateGrant(
        'eng-1',
        { grantId: 'g1', actions: ['agenda.appointment.view'] } as any,
        ADMIN,
      ),
    );
    expect(guard.assertCanWrite).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        replacesGrantId: 'g1',
        grant: expect.objectContaining({
          actions: ['agenda.appointment.view'],
          effect: 'ALLOW',
        }),
      }),
    );
  });

  it('solo cambiar la condición también se comprueba y se guarda con su versión', async () => {
    const guard = guardOk();
    const d = build(guard);
    const condition = {
      schemaVersion: 1,
      time: { windows: [{ days: [1], from: '08:00', to: '18:00' }] },
    };
    await d.inTenant(() =>
      d.service.updateGrant(
        'eng-1',
        { grantId: 'g1', condition } as any,
        ADMIN,
      ),
    );
    expect(guard.assertCanWrite).toHaveBeenCalled();
    expect(d.grantRow.conditionJson).toEqual(condition);
    expect(d.grantRow.conditionSchemaVersion).toBe(1);
  });

  it('revocar no pasa por el guardián (siempre se puede quitar)', async () => {
    const guard = guardOk();
    const d = build(guard);
    await d.inTenant(() =>
      d.service.updateGrant(
        'eng-1',
        { grantId: 'g1', revoke: true } as any,
        ADMIN,
      ),
    );
    expect(guard.assertCanWrite).not.toHaveBeenCalled();
    expect(d.grantRow.statusConceptId).toBe(DELEG.SUPPORT_GRANT_REVOKED);
  });

  it('el guardián rechaza: el permiso queda como estaba', async () => {
    const guard = {
      assertCanWrite: mockFn().mockRejectedValue(
        Object.assign(new Error('x'), { reason: 'SOD_CONFLICT_BLOCKED' }),
      ),
    };
    const d = build(guard);
    await expect(
      d.inTenant(() =>
        d.service.updateGrant(
          'eng-1',
          { grantId: 'g1', actions: ['billing.receipt.void'] } as any,
          ADMIN,
        ),
      ),
    ).rejects.toMatchObject({ reason: 'SOD_CONFLICT_BLOCKED' });
    expect(d.grants.removeActions).not.toHaveBeenCalled();
    expect(d.grants.addActions).not.toHaveBeenCalled();
  });
});

describe('B-M2 / A-M2: el paso extra rige en TODAS las rutas que otorgan o amplían', () => {
  const stale = () => ({
    assertFresh: mockFn().mockRejectedValue(
      Object.assign(new Error('STEP_UP_REQUIRED'), {
        reason: 'STEP_UP_REQUIRED',
      }),
    ),
  });
  const fresh = () => ({ assertFresh: mockFn().mockResolvedValue(undefined) });

  it('POST /org/support-engagements/:id/grants sin paso extra: 403 y no se crea nada', async () => {
    const d = build(guardOk(), undefined, stale());
    await expect(
      d.inTenant(() =>
        d.service.addGrant(
          'eng-1',
          { targetKind: 'ALL', actions: ['agenda.appointment.view'] } as any,
          ADMIN,
        ),
      ),
    ).rejects.toMatchObject({ reason: 'STEP_UP_REQUIRED' });
    expect(d.grants.create).not.toHaveBeenCalled();
  });

  it('con el sello vigente otorga y comprueba al actor correcto', async () => {
    const stepUp = fresh();
    const d = build(guardOk(), undefined, stepUp);
    await d.inTenant(() =>
      d.service.addGrant(
        'eng-1',
        { targetKind: 'ALL', actions: ['agenda.appointment.view'] } as any,
        ADMIN,
      ),
    );
    expect(stepUp.assertFresh).toHaveBeenCalledWith(d.tx, ADMIN);
    expect(d.grants.create).toHaveBeenCalled();
  });

  it('una prohibición (DENY) solo restringe: no pide el paso extra', async () => {
    const d = build(guardOk(), undefined, stale());
    await d.inTenant(() =>
      d.service.addGrant(
        'eng-1',
        {
          targetKind: 'ALL',
          actions: ['agenda.appointment.view'],
          effect: 'DENY',
        } as any,
        ADMIN,
      ),
    );
    expect(d.grants.create).toHaveBeenCalled();
  });

  it('PATCH …/grants que no es quitar (acciones, vigencia, condición o expansionMode) pide el paso extra', async () => {
    for (const change of [
      { actions: ['agenda.appointment.view'] },
      { validTo: new Date(Date.now() + 86_400_000).toISOString() },
      { expansionMode: 'DYNAMIC' },
    ]) {
      const d = build(guardOk(), undefined, stale());
      await expect(
        d.inTenant(() =>
          d.service.updateGrant(
            'eng-1',
            { grantId: 'g1', ...change } as any,
            ADMIN,
          ),
        ),
      ).rejects.toMatchObject({ reason: 'STEP_UP_REQUIRED' });
    }
  });

  it('quitar un permiso nunca pide el paso extra (reducir acceso no se frena)', async () => {
    const d = build(guardOk(), undefined, stale());
    await d.inTenant(() =>
      d.service.updateGrant(
        'eng-1',
        { grantId: 'g1', revoke: true } as any,
        ADMIN,
      ),
    );
    expect(d.grantRow.statusConceptId).toBe(DELEG.SUPPORT_GRANT_REVOKED);
  });
});

describe('B-M3: GRANT_CHANGE (cuatro ojos del servidor) para permisos CRÍTICA', () => {
  const critical = {
    targetKind: 'ALL',
    actions: ['billing.receipt.void'],
    validTo: new Date(Date.now() + 30 * 86_400_000).toISOString(),
  } as any;
  const pending = () => ({
    requestGrantChange: mockFn(async (_tx: any, input: any) => ({
      id: 'fe-1',
      expiresAt: new Date('2026-11-10T00:00:00Z'),
      input,
    })),
  });
  const heldCritical = [
    {
      grant: {
        id: 'g-held',
        organizationUserAssignmentId: 'eng-1',
        statusConceptId: DELEG.SUPPORT_GRANT_ACTIVE,
        targetKindConceptId: DELEG.SUPPORT_TARGET_ALL,
        expansionModeConceptId: DELEG.SUPPORT_EXPANSION_DYNAMIC,
        effectConceptId: AUTHZ.EFFECT_ALLOW,
      },
      permissionIds: [permissionAtomId('billing.receipt.void')],
      actions: [
        {
          permissionId: permissionAtomId('billing.receipt.void'),
          conditionJson: null,
        },
      ],
    },
  ];

  it('otorgar un átomo CRÍTICA no escribe nada: pide la aprobación de otra persona y responde PENDING_APPROVAL', async () => {
    const fe = pending();
    const d = build(guardOk(), undefined, undefined, fe);
    const out: any = await d.inTenant(() =>
      d.service.addGrant('eng-1', critical, ADMIN),
    );
    expect(out).toMatchObject({
      status: 'PENDING_APPROVAL',
      approvalId: 'fe-1',
    });
    expect(d.grants.create).not.toHaveBeenCalled();
    const input = fe.requestGrantChange.mock.calls[0][1];
    expect(input).toMatchObject({
      tenantId: TENANT,
      subjectUserId: 'user-ana',
      engagementId: 'eng-1',
      permissionCode: 'billing.receipt.void',
    });
    expect(input.payload).toMatchObject({
      op: 'ADD',
      engagementId: 'eng-1',
      grant: expect.objectContaining({
        targetKind: 'ALL',
        actions: ['billing.receipt.void'],
        effect: 'ALLOW',
      }),
    });
  });

  it('si no hay a quién pedirle la segunda aprobación (un solo administrador de seguridad, D-11) falla cerrado y no escribe', async () => {
    const fe = {
      requestGrantChange: mockFn().mockRejectedValue(
        Object.assign(new Error('sin aprobador'), {
          reason: Reason.FOUR_EYES_NO_APPROVER,
        }),
      ),
    };
    const d = build(guardOk(), undefined, undefined, fe);
    await expect(
      d.inTenant(() => d.service.addGrant('eng-1', critical, ADMIN)),
    ).rejects.toMatchObject({ reason: Reason.FOUR_EYES_NO_APPROVER });
    expect(d.grants.create).not.toHaveBeenCalled();
  });

  it('lo que no es CRÍTICA, una prohibición o un átomo CRÍTICA que la persona ya tenía se escriben directo', async () => {
    const fe = pending();
    const plain = build(guardOk(), undefined, undefined, fe);
    await plain.inTenant(() =>
      plain.service.addGrant(
        'eng-1',
        { targetKind: 'ALL', actions: ['agenda.appointment.view'] } as any,
        ADMIN,
      ),
    );
    expect(plain.grants.create).toHaveBeenCalled();
    const deny = build(guardOk(), undefined, undefined, fe);
    await deny.inTenant(() =>
      deny.service.addGrant('eng-1', { ...critical, effect: 'DENY' }, ADMIN),
    );
    expect(deny.grants.create).toHaveBeenCalled();
    const again = build(guardOk(), undefined, undefined, fe, heldCritical);
    await again.inTenant(() =>
      again.service.addGrant('eng-1', critical, ADMIN),
    );
    expect(again.grants.create).toHaveBeenCalled();
    expect(fe.requestGrantChange).not.toHaveBeenCalled();
  });

  it('editar un permiso para AGREGARLE un átomo CRÍTICA también pasa por cuatro ojos; editar otra cosa, no', async () => {
    const fe = pending();
    const d = build(guardOk(), undefined, undefined, fe);
    const out: any = await d.inTenant(() =>
      d.service.updateGrant(
        'eng-1',
        {
          grantId: 'g1',
          actions: ['billing.payment.refund'],
          validTo: critical.validTo,
        } as any,
        ADMIN,
      ),
    );
    expect(out.status).toBe('PENDING_APPROVAL');
    expect(fe.requestGrantChange.mock.calls[0][1].payload).toMatchObject({
      op: 'UPDATE',
      grantId: 'g1',
      change: expect.objectContaining({ actions: ['billing.payment.refund'] }),
    });
    const other = build(guardOk(), undefined, undefined, fe);
    const ok: any = await other.inTenant(() =>
      other.service.updateGrant(
        'eng-1',
        { grantId: 'g1', validTo: critical.validTo } as any,
        ADMIN,
      ),
    );
    expect(ok).toEqual({ ok: true });
  });

  it('al aprobar, el ejecutor RE-VALIDA con el guardián y otorga con quien pidió y quien aprobó', async () => {
    const guard = guardOk();
    const d = build(guard, undefined, undefined, pending());
    const approver = { id: 'gonzalo-2', roles: ['SECURITY_ADMIN'] } as any;
    const out = await d.inTenant(() =>
      d.service.executeApprovedGrantChange(
        d.tx,
        TENANT,
        {
          op: 'ADD',
          engagementId: 'eng-1',
          assignmentRowVersion: 0,
          grant: {
            targetKind: 'ALL',
            actions: ['billing.receipt.void'],
            effect: 'ALLOW',
            expansionMode: 'DYNAMIC',
            validTo: critical.validTo,
          },
        } as any,
        'admin-1',
        approver,
      ),
    );
    expect(guard.assertCanWrite).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({ actor: approver, userId: 'user-ana' }),
    );
    expect(d.grants.create).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        approvedByUserId: 'gonzalo-2',
        actorUserId: 'admin-1',
      }),
    );
    expect(out).toMatchObject({ grantId: 'g-new' });
  });

  it('si el vínculo cambió o ya no es válido, el ejecutor responde 409 FOUR_EYES_PAYLOAD_INVALID y no escribe', async () => {
    const approver = { id: 'gonzalo-2', roles: ['SECURITY_ADMIN'] } as any;
    const payload = {
      op: 'ADD',
      engagementId: 'eng-1',
      assignmentRowVersion: 7,
      grant: {
        targetKind: 'ALL',
        actions: ['billing.receipt.void'],
        effect: 'ALLOW',
        expansionMode: 'DYNAMIC',
        validTo: critical.validTo,
      },
    } as any;
    const stale = build(guardOk(), undefined, undefined, pending());
    await expect(
      stale.inTenant(() =>
        stale.service.executeApprovedGrantChange(
          stale.tx,
          TENANT,
          payload,
          'admin-1',
          approver,
        ),
      ),
    ).rejects.toMatchObject({ reason: Reason.FOUR_EYES_PAYLOAD_INVALID });
    const invalid = build(
      {
        assertCanWrite: mockFn().mockRejectedValue(new Error('SOD')),
      },
      undefined,
      undefined,
      pending(),
    );
    await expect(
      invalid.inTenant(() =>
        invalid.service.executeApprovedGrantChange(
          invalid.tx,
          TENANT,
          { ...payload, assignmentRowVersion: 0 },
          'admin-1',
          approver,
        ),
      ),
    ).rejects.toMatchObject({ reason: Reason.FOUR_EYES_PAYLOAD_INVALID });
    expect(invalid.grants.create).not.toHaveBeenCalled();
  });
});

describe('V-3: ampliar un átomo CRÍTICA que la persona YA tenía también pide cuatro ojos', () => {
  const IN_30 = new Date(Date.now() + 30 * 86_400_000);
  const IN_5 = new Date(Date.now() + 5 * 86_400_000);
  const pending = () => ({
    requestGrantChange: mockFn(async (_tx: any, input: any) => ({
      id: 'fe-1',
      expiresAt: new Date('2026-11-10T00:00:00Z'),
      input,
    })),
  });
  /** billing.receipt.void sobre UNA agenda (la del Dr. Pérez), aprobado por dos. */
  const heldOnOneAgenda = (over: Record<string, unknown> = {}) => [
    {
      grant: {
        id: 'g-held',
        organizationUserAssignmentId: 'eng-1',
        statusConceptId: DELEG.SUPPORT_GRANT_ACTIVE,
        targetKindConceptId: DELEG.SUPPORT_TARGET_PRACTITIONER,
        practitionerRoleAssignmentId: 'pra-1',
        expansionModeConceptId: DELEG.SUPPORT_EXPANSION_DYNAMIC,
        effectConceptId: AUTHZ.EFFECT_ALLOW,
        validTo: IN_30,
        ...over,
      },
      permissionIds: [permissionAtomId('billing.receipt.void')],
      actions: [
        {
          permissionId: permissionAtomId('billing.receipt.void'),
          conditionJson: null,
        },
      ],
    },
  ];
  const wide = {
    targetKind: 'ALL',
    actions: ['billing.receipt.void'],
    validTo: IN_30.toISOString(),
  } as any;

  it('(A) pasar de una agenda a TODA la organización: 202, SCOPE_WIDENED y no se escribe nada hasta aprobar', async () => {
    const fe = pending();
    const d = build(guardOk(), undefined, undefined, fe, heldOnOneAgenda());
    const out: any = await d.inTenant(() =>
      d.service.addGrant('eng-1', wide, ADMIN),
    );
    expect(out).toMatchObject({
      status: 'PENDING_APPROVAL',
      reasons: ['SCOPE_WIDENED'],
      criticalAtoms: ['billing.receipt.void'],
    });
    expect(d.grants.create).not.toHaveBeenCalled();
    const input = fe.requestGrantChange.mock.calls[0][1];
    expect(input.permissionCode).toBe('billing.receipt.void');
    // Lo que ve el aprobador viaja firmado en el cuerpo.
    expect(input.payload).toMatchObject({
      op: 'ADD',
      reasons: ['SCOPE_WIDENED'],
      criticalAtoms: ['billing.receipt.void'],
    });
  });

  it('(A) el mismo objetivo que ya tenía, con vigencia igual o menor, se sigue escribiendo directo', async () => {
    const fe = pending();
    const d = build(guardOk(), undefined, undefined, fe, heldOnOneAgenda());
    await d.inTenant(() =>
      d.service.addGrant(
        'eng-1',
        {
          targetKind: 'PRACTITIONER',
          practitionerRoleAssignmentId: 'pra-1',
          actions: ['billing.receipt.void'],
          validTo: IN_5.toISOString(),
        } as any,
        ADMIN,
      ),
    );
    expect(d.grants.create).toHaveBeenCalled();
    expect(fe.requestGrantChange).not.toHaveBeenCalled();
  });

  it('(B) PATCH validTo más allá de lo ya aprobado en un permiso crítico: 202 VALIDITY_EXTENDED', async () => {
    const fe = pending();
    const d = build(
      guardOk(),
      undefined,
      undefined,
      fe,
      heldOnOneAgenda({ validTo: IN_5 }),
    );
    const out: any = await d.inTenant(() =>
      d.service.updateGrant(
        'eng-1',
        {
          grantId: 'g-held',
          validTo: new Date(Date.now() + 80 * 86_400_000).toISOString(),
        } as any,
        ADMIN,
      ),
    );
    expect(out).toMatchObject({
      status: 'PENDING_APPROVAL',
      reasons: ['VALIDITY_EXTENDED'],
    });
    expect(fe.requestGrantChange.mock.calls[0][1].payload).toMatchObject({
      op: 'UPDATE',
      grantId: 'g-held',
    });
  });

  it('(B) acortar la vigencia o dejarla igual no pide nada', async () => {
    const fe = pending();
    const d = build(guardOk(), undefined, undefined, fe, heldOnOneAgenda());
    const out: any = await d.inTenant(() =>
      d.service.updateGrant(
        'eng-1',
        { grantId: 'g-held', validTo: IN_5.toISOString() } as any,
        ADMIN,
      ),
    );
    expect(out).toEqual({ ok: true });
    expect(fe.requestGrantChange).not.toHaveBeenCalled();
  });

  it('(B) PATCH expansionMode DYNAMIC sobre un permiso FIXED con críticos amplía: 202 SCOPE_WIDENED', async () => {
    const fe = pending();
    const d = build(
      guardOk(),
      undefined,
      undefined,
      fe,
      heldOnOneAgenda({
        expansionModeConceptId: DELEG.SUPPORT_EXPANSION_FIXED,
        // La foto congelada: el doctor en UN servicio (no todo lo del doctor).
        fixedSnapshotJson: {
          rows: [
            {
              practitionerRoleAssignmentId: 'pra-1',
              healthcareServiceId: 'svc-eco',
            },
          ],
        },
      }),
    );
    const out: any = await d.inTenant(() =>
      d.service.updateGrant(
        'eng-1',
        { grantId: 'g-held', expansionMode: 'DYNAMIC' } as any,
        ADMIN,
      ),
    );
    expect(out).toMatchObject({
      status: 'PENDING_APPROVAL',
      reasons: ['SCOPE_WIDENED'],
    });
  });

  it('(B) editar solo una condición de un permiso crítico no amplía nada: se escribe directo', async () => {
    const fe = pending();
    const d = build(guardOk(), undefined, undefined, fe, heldOnOneAgenda());
    const out: any = await d.inTenant(() =>
      d.service.updateGrant(
        'eng-1',
        {
          grantId: 'g-held',
          condition: { schemaVersion: 1, network: { require: 'ORG_RULES' } },
        } as any,
        ADMIN,
      ),
    );
    expect(out).toEqual({ ok: true });
    expect(fe.requestGrantChange).not.toHaveBeenCalled();
  });
});

describe('N-2: GRANT_CHANGE revalida a quien lo pidió al ejecutar', () => {
  const approver = { id: 'gonzalo-2', roles: ['SECURITY_ADMIN'] } as any;
  const payload = (over: Record<string, unknown> = {}) =>
    ({
      op: 'ADD',
      engagementId: 'eng-1',
      assignmentRowVersion: 0,
      grant: {
        targetKind: 'ALL',
        actions: ['billing.receipt.void'],
        effect: 'ALLOW',
        expansionMode: 'DYNAMIC',
        validTo: new Date(Date.now() + 30 * 86_400_000).toISOString(),
      },
      ...over,
    }) as any;
  const run = (
    d: ReturnType<typeof build>,
    requester = 'admin-1',
    p = payload(),
  ) =>
    d.inTenant(() =>
      d.service.executeApprovedGrantChange(
        d.tx,
        TENANT,
        p,
        requester,
        approver,
      ),
    );

  it('si quien pidió sigue siendo administrador de seguridad vivo, ejecuta', async () => {
    const d = build(guardOk(), undefined, undefined, undefined);
    await expect(run(d)).resolves.toMatchObject({ grantId: 'g-new' });
    expect(d.isSecurityAdmin).toHaveBeenCalledWith(
      d.tx,
      'admin-1',
      TENANT,
      expect.any(Date),
    );
  });

  it('si en los 7 días dejó de ser administrador (ni delegado): 409 FOUR_EYES_PAYLOAD_INVALID y no se escribe nada', async () => {
    const d = build(guardOk(), undefined, undefined, undefined, [], {
      securityAdmin: false,
    });
    await expect(run(d)).rejects.toMatchObject({
      reason: Reason.FOUR_EYES_PAYLOAD_INVALID,
    });
    expect(d.grants.create).not.toHaveBeenCalled();
  });

  it('quien pidió no puede estar ahora sobre su propio vínculo (nadie se otorga a sí mismo)', async () => {
    const d = build(guardOk());
    await expect(run(d, 'user-ana')).rejects.toMatchObject({
      reason: Reason.FOUR_EYES_PAYLOAD_INVALID,
    });
    expect(d.grants.create).not.toHaveBeenCalled();
  });

  it('un delegado que pidió: si su alcance ya no cubre lo pedido, 409 y no se escribe', async () => {
    const d = build(guardOk(), undefined, undefined, undefined, [], {
      securityAdmin: false,
      delegated: {
        userId: 'sofia',
        tenantId: TENANT,
        engagementIds: ['eng-s'],
        atoms: new Set(['team.grants.assign']),
        targets: new Map(),
        // su alcance es UNA agenda; lo pedido es toda la organización
        assignGrants: [
          {
            target: {
              targetKind: 'PRACTITIONER',
              expansionMode: 'DYNAMIC',
              practitionerRoleAssignmentId: 'pra-1',
            },
            ceiling: {},
          },
        ],
      },
    });
    await expect(run(d, 'sofia')).rejects.toMatchObject({
      reason: Reason.FOUR_EYES_PAYLOAD_INVALID,
    });
    expect(d.grants.create).not.toHaveBeenCalled();
  });
});

describe('N-1: describeGrantChanges arma lo que ve quien aprueba', () => {
  it('ADD: todos los átomos, el objetivo por nombre, la vigencia y las condiciones, sin tocar al paciente', async () => {
    const d = build(guardOk());
    const activity = (d.service as any).activity;
    activity.doctorNamesByRoleAssignment = mockFn(
      async () => new Map([['pra-1', { profileId: 'p-1', name: 'Dr. Pérez' }]]),
    );
    activity.serviceNames = mockFn(
      async () => new Map([['svc-eco', 'Ecografía']]),
    );
    const out = await d.service.describeGrantChanges(d.tx, [
      {
        id: 'fe-1',
        payloadJson: {
          op: 'ADD',
          engagementId: 'eng-1',
          assignmentRowVersion: 0,
          reasons: ['NEW_CRITICAL_ATOMS'],
          criticalAtoms: ['billing.payment.refund', 'billing.receipt.void'],
          grant: {
            targetKind: 'PRACTITIONER_SERVICE',
            practitionerRoleAssignmentId: 'pra-1',
            healthcareServiceId: 'svc-eco',
            actions: ['billing.receipt.void', 'billing.payment.refund'],
            effect: 'ALLOW',
            expansionMode: 'DYNAMIC',
            validTo: '2026-12-01T00:00:00.000Z',
          },
        },
      },
    ] as any);
    expect(out.get('fe-1')).toMatchObject({
      op: 'ADD',
      reasons: ['NEW_CRITICAL_ATOMS'],
      target: {
        kind: 'PRACTITIONER_SERVICE',
        practitionerName: 'Dr. Pérez',
        serviceName: 'Ecografía',
      },
      validTo: '2026-12-01T00:00:00.000Z',
      conditions: [],
    });
    expect(out.get('fe-1')!.criticalAtoms.map((a) => a.code)).toEqual([
      'billing.payment.refund',
      'billing.receipt.void',
    ]);
  });

  it('UPDATE: se arma sobre el permiso de hoy y dice qué cambia', async () => {
    const d = build(guardOk());
    d.grants.findById.mockResolvedValue({
      id: 'g1',
      organizationUserAssignmentId: 'eng-1',
      targetKindConceptId: DELEG.SUPPORT_TARGET_ALL,
      expansionModeConceptId: DELEG.SUPPORT_EXPANSION_FIXED,
      validTo: new Date('2026-11-10T00:00:00Z'),
    });
    d.grants.findLiveActions.mockResolvedValue([
      {
        permissionId: permissionAtomId('billing.receipt.void'),
        conditionJson: null,
      },
    ]);
    const out = await d.service.describeGrantChanges(d.tx, [
      {
        id: 'fe-2',
        payloadJson: {
          op: 'UPDATE',
          engagementId: 'eng-1',
          grantId: 'g1',
          assignmentRowVersion: 0,
          reasons: ['SCOPE_WIDENED'],
          criticalAtoms: ['billing.receipt.void'],
          change: { expansionMode: 'DYNAMIC' },
        },
      },
    ] as any);
    expect(out.get('fe-2')).toMatchObject({
      op: 'UPDATE',
      target: { kind: 'ALL', expansionMode: 'DYNAMIC' },
      validTo: '2026-11-10T00:00:00.000Z',
      changes: ['expansionMode'],
    });
    expect(out.get('fe-2')!.atoms.map((a) => a.code)).toEqual([
      'billing.receipt.void',
    ]);
  });

  it('un cuerpo ilegible no figura (no rompe el listado)', async () => {
    const d = build(guardOk());
    const out = await d.service.describeGrantChanges(d.tx, [
      { id: 'fe-3', payloadJson: { raro: true } },
    ] as any);
    expect(out.size).toBe(0);
  });
});
