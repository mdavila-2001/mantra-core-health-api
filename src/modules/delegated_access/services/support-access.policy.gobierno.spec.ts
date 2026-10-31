import { jest } from '@jest/globals';
import { SupportAccessPolicy } from './support-access.policy';
import { SupportAccessReason, SUPPORT_TEMPLATE_DEFAULTS } from '../domain';
import { DELEG } from '../delegated_access.concepts';
import { DIR } from '../../directory/directory.concepts';
import { STATUS } from './concept-maps';
import { supportPermissionId } from '../domain/support-actions';
import { RoleTemplates } from '../entities';

/** Mock laxo: evita el tipado estricto `Mock<never>` del runtime de jest. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const TENANT = 'tenant-hospital';
const ANA = 'user-ana';

const engagement = {
  assignment: {
    id: 'eng-ana',
    statusConceptId: STATUS.ACTIVE,
    validFrom: new Date('2026-01-01'),
    roleTemplateId: 'tpl-secretary',
  },
  tenantId: TENANT,
  userId: ANA,
  membershipStatusConceptId: DIR.MEMBERSHIP_ACTIVE,
  membershipEndDate: undefined,
};
const grant = {
  grant: {
    id: 'g-perez',
    organizationUserAssignmentId: 'eng-ana',
    targetKindConceptId: DELEG.SUPPORT_TARGET_PRACTITIONER,
    practitionerRoleAssignmentId: 'pra-perez',
    expansionModeConceptId: DELEG.SUPPORT_EXPANSION_DYNAMIC,
    statusConceptId: DELEG.SUPPORT_GRANT_ACTIVE,
  },
  permissionIds: SUPPORT_TEMPLATE_DEFAULTS.SECRETARY.map(supportPermissionId),
};
const delegation = {
  delegate: {
    id: 'del-1',
    delegateUserAssignmentId: 'eng-ana',
    acceptedAt: new Date('2026-02-01'),
    statusConceptId: STATUS.ACTIVE,
    mayReplyOnBehalf: true,
  },
  practitionerProfileId: 'prof-perez',
};

function build(rules: any[] = []) {
  const repo = {
    findEngagements: mockFn().mockResolvedValue([engagement]),
    findGrantsWithActions: mockFn().mockResolvedValue([grant]),
    findDelegationsOfEngagements: mockFn().mockResolvedValue([delegation]),
    findRoleAssignments: mockFn().mockResolvedValue(
      new Map([
        [
          'pra-perez',
          {
            id: 'pra-perez',
            practitionerProfileId: 'prof-perez',
            tenantId: TENANT,
          },
        ],
      ]),
    ),
    findRoleAssignmentsOfPractitioner: mockFn().mockResolvedValue([
      {
        id: 'pra-perez',
        practitionerProfileId: 'prof-perez',
        tenantId: TENANT,
      },
    ]),
    findRoleAssignmentsOfTenant: mockFn().mockResolvedValue([
      {
        id: 'pra-perez',
        practitionerProfileId: 'prof-perez',
        tenantId: TENANT,
      },
    ]),
    findRoleAssignmentsOfProfile: mockFn().mockResolvedValue([
      {
        id: 'pra-perez',
        practitionerProfileId: 'prof-perez',
        tenantId: TENANT,
      },
    ]),
    findCareSpaceIdsOfTenant: mockFn().mockResolvedValue([]),
    findServices: mockFn().mockResolvedValue(new Map()),
    findCareSpaces: mockFn().mockResolvedValue(new Map()),
  };
  const decision = {
    allowed: true,
    effect: 'PERMIT',
    reason: 'ALLOWED',
    grantId: 'g-perez',
  };
  const trace = { steps: [], candidates: [], decidedByStep: 1 };
  const pipeline = {
    evaluate: mockFn().mockResolvedValue({
      decision,
      trace,
      obligations: {},
      usage: { consume: [], readings: [] },
    }),
    evaluateStructure: mockFn().mockResolvedValue(decision),
    prepareListing: mockFn().mockResolvedValue(() => decision),
    rulesFor: mockFn().mockResolvedValue(rules),
    recordEarlyDeny: mockFn().mockResolvedValue(undefined),
    filterPatients: mockFn().mockResolvedValue(new Set(['pac-ok'])),
  };
  const reader: any = {
    find: mockFn().mockResolvedValue([
      { id: 'tpl-secretary', code: 'SECRETARY' },
    ]),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const em = { fork: mockFn().mockReturnValue(reader) };
  const policy = new SupportAccessPolicy(
    em as any,
    repo as any,
    logger as any,
    pipeline as any,
  );
  return { policy, repo, pipeline, reader };
}

describe('SupportAccessPolicy con el gobierno de accesos (pipeline)', () => {
  it('can() delega en el pipeline con el contexto, los vínculos y el objetivo resuelto', async () => {
    const d = build();
    const completeContext = async () => ({
      appointmentStartAt: new Date('2026-11-04T14:30:00Z'),
    });
    const result = await d.policy.can({
      userId: ANA,
      tenantId: TENANT,
      action: 'agenda.appointment.cancel',
      practitionerProfileId: 'prof-perez',
      context: {
        patientProfileId: 'pac-1',
        proof: { reasonText: 'Motivo real' },
      },
      completeContext,
    });
    expect(result).toMatchObject({
      allowed: true,
      effect: 'PERMIT',
      grantId: 'g-perez',
    });
    const call = d.pipeline.evaluate.mock.calls[0][0];
    expect(call).toMatchObject({
      tenantId: TENANT,
      userId: ANA,
      completeContext,
    });
    expect(call.query).toMatchObject({
      action: 'agenda.appointment.cancel',
      practitionerProfileId: 'prof-perez',
      practitionerRoleAssignmentIds: ['pra-perez'],
      context: { patientProfileId: 'pac-1' },
    });
    expect(call.engagements[0]).toMatchObject({
      engagementId: 'eng-ana',
      userId: ANA,
    });
  });

  it('con explain devuelve la traza; sin él no', async () => {
    const d = build();
    const base = {
      userId: ANA,
      tenantId: TENANT,
      action: 'schedule.view' as const,
      practitionerProfileId: 'prof-perez',
    };
    expect((await d.policy.can(base)).trace).toBeUndefined();
    expect(
      (await d.policy.can({ ...base, explain: true })).trace,
    ).toBeDefined();
  });

  it('un DENY previo al motor (sin vínculo, objetivo ajeno) también deja su asiento', async () => {
    const d = build();
    d.repo.findEngagements.mockResolvedValue([]);
    const none = await d.policy.can({
      userId: 'rosa',
      tenantId: TENANT,
      action: 'schedule.view',
      practitionerProfileId: 'prof-perez',
    });
    expect(none).toMatchObject({
      allowed: false,
      reason: SupportAccessReason.NO_ENGAGEMENT,
      effect: 'DENY',
    });
    expect(d.pipeline.recordEarlyDeny).toHaveBeenCalledTimes(1);
    d.repo.findEngagements.mockResolvedValue([engagement]);
    d.repo.findRoleAssignmentsOfPractitioner.mockResolvedValue([]);
    await d.policy.can({
      userId: ANA,
      tenantId: TENANT,
      action: 'schedule.view',
      practitionerProfileId: 'prof-fuera',
    });
    expect(d.pipeline.recordEarlyDeny).toHaveBeenCalledTimes(2);
    expect(d.pipeline.evaluate).not.toHaveBeenCalled();
  });

  it('canReplyOnBehalf (elegibilidad) NO tiene efectos; canReplyOnBehalfActing (la respuesta real) sí, con canales y paciente', async () => {
    const d = build();
    await d.policy.canReplyOnBehalf(ANA, 'prof-perez', undefined, TENANT);
    expect(d.pipeline.evaluate.mock.calls[0][0]).toMatchObject({
      sideEffects: false,
    });
    expect(d.pipeline.evaluate.mock.calls[0][0].query.action).toBe(
      'messages.conversation.reply_on_behalf',
    );
    const real = await d.policy.canReplyOnBehalfActing(
      ANA,
      'prof-perez',
      undefined,
      TENANT,
      { channels: ['CHAT', 'EMAIL'], patientProfileId: 'pac-1' },
    );
    const call = d.pipeline.evaluate.mock.calls[1][0];
    expect(call.sideEffects).toBe(true);
    expect(call.query.context).toEqual({
      channels: ['CHAT', 'EMAIL'],
      patientProfileId: 'pac-1',
    });
    expect(real).toMatchObject({
      allowed: true,
      delegateAssignmentId: 'del-1',
    });
  });

  it('los listados (bandeja, a quién asignar) mantienen al doctor si solo una condición de contexto hoy no se cumple', async () => {
    const d = build();
    d.pipeline.evaluateStructure.mockResolvedValue({
      allowed: false,
      effect: 'DENY',
      reason: 'TIME_WINDOW',
      unmet: [{ key: 'time', code: 'TIME_WINDOW', status: 'F' }],
    });
    expect((await d.policy.replyersOfDoctor(TENANT, 'prof-perez')).length).toBe(
      1,
    );
    d.pipeline.evaluateStructure.mockResolvedValue({
      allowed: false,
      effect: 'DENY',
      reason: 'ORG_RULE_DENY',
    });
    expect(await d.policy.replyersOfDoctor(TENANT, 'prof-perez')).toEqual([]);
    d.pipeline.evaluateStructure.mockResolvedValue({
      allowed: false,
      effect: 'DENY',
      reason: 'EXPLICIT_DENY',
    });
    expect(await d.policy.replyersOfDoctor(TENANT, 'prof-perez')).toEqual([]);
  });

  it('evaluatorFor: estructura al crearlo y, tras prime, los hechos de los pacientes en lote', async () => {
    const d = build();
    const evaluate = await d.policy.evaluatorFor(ANA, TENANT);
    expect(d.pipeline.prepareListing.mock.calls[0][0]).toMatchObject({
      withFacts: false,
      patientProfileIds: [],
    });
    await evaluate.prime?.(['pac-1', 'pac-2']);
    expect(d.pipeline.prepareListing.mock.calls[1][0]).toMatchObject({
      withFacts: true,
      patientProfileIds: ['pac-1', 'pac-2'],
      practitionerProfileIds: ['prof-perez'],
    });
    expect(
      evaluate({ action: 'schedule.view', practitionerProfileId: 'prof-perez' })
        .allowed,
    ).toBe(true);
  });

  it('canSearchPatients: una regla DENY_PERMISSION de la organización para la plantilla del vínculo la cierra', async () => {
    const rule = {
      id: 'r1',
      kind: 'DENY_PERMISSION',
      roleTemplateCode: 'SECRETARY',
      permissionPattern: 'patients.*',
    };
    const denied = build([rule]);
    expect(await denied.policy.canSearchPatients(ANA, TENANT)).toBe(false);
    const free = build([]);
    expect(await free.policy.canSearchPatients(ANA, TENANT)).toBe(true);
    const other = build([{ ...rule, roleTemplateCode: 'FRONT_DESK' }]);
    expect(await other.policy.canSearchPatients(ANA, TENANT)).toBe(true);
  });

  it('AC-12: el código de plantilla solo se consulta si una regla lo necesita; sin reglas por plantilla, cero consultas de más', async () => {
    const without = build([
      {
        id: 'r',
        kind: 'REQUIRE_CONDITION',
        permissionPattern: 'agenda.*',
        condition: { schemaVersion: 1 },
      },
    ]);
    await without.policy.can({
      userId: ANA,
      tenantId: TENANT,
      action: 'schedule.view',
      practitionerProfileId: 'prof-perez',
    });
    expect(without.reader.find).not.toHaveBeenCalled();
    const withRule = build([
      {
        id: 'r',
        kind: 'DENY_PERMISSION',
        roleTemplateCode: 'FRONT_DESK',
        permissionPattern: 'billing.*',
      },
    ]);
    await withRule.policy.can({
      userId: ANA,
      tenantId: TENANT,
      action: 'schedule.view',
      practitionerProfileId: 'prof-perez',
    });
    expect(withRule.reader.find).toHaveBeenCalledTimes(1);
    expect(withRule.reader.find.mock.calls[0][0]).toBe(RoleTemplates);
    expect(
      withRule.pipeline.evaluate.mock.calls[0][0].engagements[0].templateCode,
    ).toBe('SECRETARY');
  });

  it('filterSearchResults delega en el pipeline y sin él devuelve la lista tal cual', async () => {
    const d = build();
    expect([
      ...(await d.policy.filterSearchResults(ANA, TENANT, [
        'pac-ok',
        'pac-fuera',
      ])),
    ]).toEqual(['pac-ok']);
    const logger = { setContext: mockFn(), info: mockFn() };
    const bare = new SupportAccessPolicy(
      { fork: () => ({}) } as any,
      {} as any,
      logger as any,
    );
    expect([
      ...(await bare.filterSearchResults(ANA, TENANT, ['a', 'b'])),
    ]).toEqual(['a', 'b']);
  });
});
