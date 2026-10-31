import { jest } from '@jest/globals';
import { ResourceNotFoundException, runWithTenant } from '../../../common';
import { DIR } from '../../directory/directory.concepts';
import { DELEG } from '../delegated_access.concepts';
import { DelegatedAccessErrorReason as Reason } from '../delegated_access.error-reasons';
import { hashPayload, permissionAtomId } from '../domain';
import { LifecycleRepository } from '../repositories/lifecycle.repository';
import { simulationTokenOf } from './access-explain.support';
import { STATUS } from './concept-maps';
import { DelegationScopeService } from './delegation-scope.service';
import { EngagementMoveService } from './engagement-move.service';
import { memoryEm } from './lifecycle.testing';

/** Mock laxo: evita el tipado estricto `Mock<never>` del runtime de jest. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const TENANT = 'org-1';
const ADMIN = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;
const NOW = new Date('2026-11-03T14:30:00Z');

const grantRow = (id: string, over: Record<string, unknown> = {}): any => ({
  id,
  tenantId: TENANT,
  organizationUserAssignmentId: 'eng-marcos',
  targetKindConceptId: DELEG.SUPPORT_TARGET_SERVICE,
  healthcareServiceId: `svc-${id}`,
  expansionModeConceptId: DELEG.SUPPORT_EXPANSION_DYNAMIC,
  statusConceptId: DELEG.SUPPORT_GRANT_ACTIVE,
  ...over,
});

function build(
  opts: {
    current?: Array<{ grant: any; atoms: string[] }>;
    validatorIssues?: any[];
    assignment?: Record<string, unknown>;
  } = {},
) {
  const assignment: any = {
    id: 'eng-marcos',
    statusConceptId: STATUS.ACTIVE,
    roleTemplateId: 'tpl-call-center',
    assignmentRoleConceptId: 'role-old',
    supervisorUserId: 'sofia',
    rowVersion: 3,
    nextRecertificationAt: new Date('2027-05-01'),
    tenantMembershipId: 'mem-marcos',
    ...opts.assignment,
  };
  const record = {
    assignment,
    tenantId: TENANT,
    userId: 'marcos',
    membershipStatusConceptId: DIR.MEMBERSHIP_ACTIVE,
  };
  const current = opts.current ?? [
    { grant: grantRow('eco'), atoms: ['agenda.appointment.view'] },
    {
      grant: grantRow('norte', {
        targetKindConceptId: DELEG.SUPPORT_TARGET_PRACTITIONER_LOCATION,
        practitionerRoleAssignmentId: 'role-suarez',
        careSpaceId: 'space-norte',
        healthcareServiceId: undefined,
      }),
      atoms: ['agenda.appointment.view'],
    },
  ];
  const { em, tables } = memoryEm(mockFn);
  const access = {
    findEngagements: mockFn(async (_e: any, f: any) =>
      f.ids && !f.ids.includes('eng-marcos') ? [] : [record],
    ),
    findGrantsWithActions: mockFn().mockResolvedValue(
      current.map((c) => ({
        grant: c.grant,
        permissionIds: c.atoms.map(permissionAtomId),
        actions: c.atoms.map((a) => ({ permissionId: permissionAtomId(a) })),
      })),
    ),
    findRoleAssignments: mockFn().mockResolvedValue(new Map()),
  };
  const created: any[] = [];
  const grants = {
    findByEngagement: mockFn().mockResolvedValue(current.map((c) => c.grant)),
    create: mockFn((_e: any, data: any) => {
      const row = { id: `new-${created.length + 1}`, ...data };
      created.push(row);
      return row;
    }),
    addActions: mockFn(),
  };
  const templates = {
    findEffectiveByCode: mockFn().mockResolvedValue({
      id: 'tpl-front',
      code: 'FRONT_DESK',
    }),
    findById: mockFn().mockResolvedValue({
      id: 'tpl-call-center',
      code: 'CALL_CENTER',
    }),
  };
  const targets = {
    assertTarget: mockFn().mockResolvedValue({}),
    buildSnapshot: mockFn().mockResolvedValue({ rows: [] }),
  };
  const validator = {
    validate: mockFn().mockResolvedValue(opts.validatorIssues ?? []),
  };
  const fourEyes = {
    request: mockFn().mockResolvedValue({
      approvalId: 'ap-1',
      expiresAt: new Date('2026-11-10T14:30:00Z'),
    }),
  };
  const review = {
    open: mockFn().mockResolvedValue({ campaignId: 'camp-1', itemCount: 1 }),
  };
  const effective = { refreshTenant: mockFn().mockResolvedValue({}) };
  const directory = {
    ownerCandidate: mockFn().mockResolvedValue({
      userId: 'sofia',
      membershipLive: true,
      isSecurityAdmin: false,
      isOrgDoctor: false,
      isLiveDelegatedAdmin: true,
    }),
  };
  const stepUp = { assertFresh: mockFn().mockResolvedValue(undefined) };
  const reviewers = {
    resolveForMove: mockFn(
      async (_tx: any, _tenant: string, _e: any, gs: any[]) =>
        gs.map((g: any) =>
          g.targetKind === 'PRACTITIONER'
            ? {
                kind: 'DOCTOR_OWNER',
                userIds: ['dr-suarez'],
                excludedUserIds: [],
                unresolved: false,
              }
            : {
                kind: 'SUPERVISOR',
                userIds: ['sofia'],
                excludedUserIds: [],
                unresolved: false,
              },
        ),
    ),
  };
  const outbox = { publishDomainEvent: mockFn().mockResolvedValue({}) };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new EngagementMoveService(
    em,
    access as any,
    grants as any,
    templates as any,
    targets as any,
    validator as any,
    new LifecycleRepository(),
    fourEyes as any,
    review as any,
    effective as any,
    directory as any,
    stepUp as any,
    outbox as any,
    new DelegationScopeService({} as any, {} as any, {} as any, {} as any),
    logger as any,
    reviewers as any,
  );
  const inTenant = <T>(fn: () => T): T => runWithTenant(TENANT, fn);
  return {
    service,
    em,
    tables,
    assignment,
    access,
    grants,
    created,
    templates,
    targets,
    validator,
    fourEyes,
    review,
    effective,
    directory,
    stepUp,
    reviewers,
    outbox,
    inTenant,
  };
}

const pisoDos = {
  targetKind: 'LOCATION' as const,
  careSpaceId: 'space-piso-2',
  actions: ['agenda.appointment.view', 'agenda.appointment.check_in'],
};

describe('EngagementMoveService · cambio de rol sin cuatro ojos (L-03)', () => {
  it('lo anterior vence en effectiveAt, nace lo nuevo, cambia la plantilla y se abre la campaña MOVER', async () => {
    const t = build();
    const out: any = await t.inTenant(() =>
      t.service.move(
        'eng-marcos',
        {
          reason: 'Pasa a recepción del Piso 2',
          newTemplateCode: 'FRONT_DESK',
          grants: [pisoDos],
        },
        ADMIN,
        NOW,
      ),
    );
    expect(out.status).toBe('EXECUTED');
    // Las dos concesiones anteriores quedan REVOKED con valid_to = ahora (mínimo privilegio).
    const revoked = (
      await t.access.findGrantsWithActions.mock.results[0].value
    ).map((x: any) => x.grant);
    expect(revoked.map((g: any) => g.statusConceptId)).toEqual([
      DELEG.SUPPORT_GRANT_REVOKED,
      DELEG.SUPPORT_GRANT_REVOKED,
    ]);
    expect(
      revoked.every((g: any) => g.validTo?.getTime() === NOW.getTime()),
    ).toBe(true);
    // Nace la nueva con sus acciones.
    expect(t.created).toHaveLength(1);
    expect(t.created[0]).toMatchObject({
      careSpaceId: 'space-piso-2',
      statusConceptId: DELEG.SUPPORT_GRANT_ACTIVE,
      approvedByUserId: 'admin-1',
    });
    expect(t.grants.addActions).toHaveBeenCalledTimes(1);
    expect(t.grants.addActions.mock.calls[0][2]).toEqual([
      permissionAtomId('agenda.appointment.check_in'),
      permissionAtomId('agenda.appointment.view'),
    ]);
    // Plantilla y rol del vínculo.
    expect(t.assignment.roleTemplateId).toBe('tpl-front');
    expect(t.assignment.assignmentRoleConceptId).not.toBe('role-old');
    // Acceso derivado refrescado y campaña MOVER abierta con 1 ítem para su dueño.
    expect(t.effective.refreshTenant).toHaveBeenCalledWith(
      TENANT,
      expect.objectContaining({ userId: 'marcos' }),
    );
    const review = t.review.open.mock.calls[0][1];
    expect(review).toMatchObject({
      kind: 'MOVER',
      reviewerUserId: 'sofia',
      engagementId: 'eng-marcos',
    });
    expect(review.items).toHaveLength(1);
    expect(out.campaignId).toBe('camp-1');
    // No pidió cuatro ojos: el puntaje sube 1 punto (menos de 10) y no aparece ningún átomo de sensibilidad alta.
    expect(t.fourEyes.request).not.toHaveBeenCalled();
    expect(out.delta).toBeLessThanOrEqual(10);
    expect(out.fourEyesReasons).toEqual([]);
    // Caso MOVER completado y evento del cambio.
    const kase = t.tables.LifecycleCases[0];
    expect(kase.kindConceptId).toBe(DELEG.LIFECYCLE_MOVER);
    expect(kase.statusConceptId).toBe(DELEG.LIFECYCLE_COMPLETED);
    const types = t.outbox.publishDomainEvent.mock.calls.map(
      (c: any[]) => c[1].eventType,
    );
    expect(types).toContain('delegated_access.governance.engagement_moved');
  });

  describe('simulationToken (pendiente 11: lo simulado es lo que se mueve)', () => {
    const draft = {
      mode: 'REPLACE',
      templateCode: 'FRONT_DESK',
      grants: [
        {
          effect: 'ALLOW',
          actions: [...pisoDos.actions],
          targetKind: 'LOCATION',
          careSpaceId: 'space-piso-2',
        },
      ],
      removeGrantIds: [],
    };
    const dto = {
      reason: 'Pasa a recepción del Piso 2',
      newTemplateCode: 'FRONT_DESK',
      grants: [pisoDos],
    };

    it('el token del mismo borrador deja ejecutar el cambio', async () => {
      const t = build();
      const out: any = await t.inTenant(() =>
        t.service.move(
          'eng-marcos',
          {
            ...dto,
            simulationToken: simulationTokenOf('eng-marcos', draft as any, NOW),
          },
          ADMIN,
          NOW,
        ),
      );
      expect(out.status).toBe('EXECUTED');
    });

    it('un token de OTRO borrador: 409 SIMULATION_STALE y no se toca nada', async () => {
      const t = build();
      const other = {
        ...draft,
        grants: [{ ...draft.grants[0], actions: ['agenda.appointment.view'] }],
      };
      const err: any = await t
        .inTenant(() =>
          t.service.move(
            'eng-marcos',
            {
              ...dto,
              simulationToken: simulationTokenOf(
                'eng-marcos',
                other as any,
                NOW,
              ),
            },
            ADMIN,
            NOW,
          ),
        )
        .catch((e: unknown) => e);
      expect(err.getStatus()).toBe(409);
      expect(err.reason).toBe(Reason.SIMULATION_STALE);
      expect(t.created).toHaveLength(0);
      expect(t.fourEyes.request).not.toHaveBeenCalled();
    });

    it('un token vencido (más de 10 minutos): 409 SIMULATION_STALE', async () => {
      const t = build();
      const old = new Date(NOW.getTime() - 11 * 60_000);
      const err: any = await t
        .inTenant(() =>
          t.service.move(
            'eng-marcos',
            {
              ...dto,
              simulationToken: simulationTokenOf(
                'eng-marcos',
                draft as any,
                old,
              ),
            },
            ADMIN,
            NOW,
          ),
        )
        .catch((e: unknown) => e);
      expect(err.reason).toBe(Reason.SIMULATION_STALE);
    });

    it('un token de otro vínculo no vale', async () => {
      const t = build();
      const err: any = await t
        .inTenant(() =>
          t.service.move(
            'eng-marcos',
            {
              ...dto,
              simulationToken: simulationTokenOf('eng-otro', draft as any, NOW),
            },
            ADMIN,
            NOW,
          ),
        )
        .catch((e: unknown) => e);
      expect(err.reason).toBe(Reason.SIMULATION_STALE);
    });
  });

  it('campaña MOVER: la concesión de un doctor la revisa ese doctor y el resto su dueño (pendiente 12)', async () => {
    const t = build();
    await t.inTenant(() =>
      t.service.move(
        'eng-marcos',
        {
          reason: 'Pasa a recepción y apoya a Suárez',
          grants: [
            pisoDos,
            {
              targetKind: 'PRACTITIONER',
              practitionerRoleAssignmentId: 'role-suarez',
              actions: ['agenda.appointment.view'],
            },
          ],
        },
        ADMIN,
        NOW,
      ),
    );
    expect(t.reviewers.resolveForMove).toHaveBeenCalledTimes(1);
    const [, tenant, subject, grants] =
      t.reviewers.resolveForMove.mock.calls[0];
    expect(tenant).toBe(TENANT);
    expect(subject).toMatchObject({
      subjectUserId: 'marcos',
      supervisorUserId: 'sofia',
    });
    expect(grants.map((g: any) => g.targetKind)).toEqual([
      'LOCATION',
      'PRACTITIONER',
    ]);
    const opened = t.review.open.mock.calls[0][1];
    expect(opened.reviewerUserId).toBe('sofia');
    expect(
      opened.items.map((i: any) => [i.reviewerUserId, i.reviewerKind]),
    ).toEqual([
      ['sofia', 'SUPERVISOR'],
      ['dr-suarez', 'DOCTOR_OWNER'],
    ]);
  });

  it('el cambio exige el paso extra del administrador antes de tocar nada', async () => {
    const t = build();
    t.stepUp.assertFresh.mockRejectedValue(
      Object.assign(new Error('paso extra'), { reason: 'STEP_UP_REQUIRED' }),
    );
    await expect(
      t.inTenant(() =>
        t.service.move(
          'eng-marcos',
          { reason: 'x', grants: [pisoDos] },
          ADMIN,
          NOW,
        ),
      ),
    ).rejects.toMatchObject({ reason: 'STEP_UP_REQUIRED' });
    expect(t.created).toHaveLength(0);
  });

  it('con un permiso idéntico lo conserva: no lo revoca ni lo duplica', async () => {
    const t = build({
      current: [
        {
          grant: grantRow('piso2', {
            targetKindConceptId: DELEG.SUPPORT_TARGET_LOCATION,
            careSpaceId: 'space-piso-2',
            healthcareServiceId: undefined,
          }),
          atoms: ['agenda.appointment.check_in', 'agenda.appointment.view'],
        },
      ],
    });
    const out: any = await t.inTenant(() =>
      t.service.move(
        'eng-marcos',
        { reason: 'Ajuste', grants: [pisoDos] },
        ADMIN,
        NOW,
      ),
    );
    expect(t.created).toHaveLength(0);
    expect(out.revokedGrantIds).toEqual([]);
    expect(t.review.open).not.toHaveBeenCalled();
  });

  it('un vínculo ajeno responde como inexistente y uno terminado, 422', async () => {
    const t = build();
    t.access.findEngagements.mockResolvedValue([]);
    await expect(
      t.inTenant(() =>
        t.service.move('otro', { reason: 'x', grants: [pisoDos] }, ADMIN, NOW),
      ),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
    const u = build({ assignment: { statusConceptId: STATUS.SUSPENDED } });
    await expect(
      u.inTenant(() =>
        u.service.move(
          'eng-marcos',
          { reason: 'x', grants: [pisoDos] },
          ADMIN,
          NOW,
        ),
      ),
    ).rejects.toMatchObject({ reason: Reason.SUPPORT_ENGAGEMENT_NOT_ACTIVE });
  });

  it('un error de barandilla, condición o funciones: 422 con la lista y sin escribir nada', async () => {
    const t = build({
      validatorIssues: [
        {
          code: 'GUARDRAIL_CEILING_EXCEEDED',
          httpStatus: 422,
          grantIndex: 0,
          atom: 'billing.receipt.void',
          message: 'No cabe en el techo',
        },
      ],
    });
    const err: any = await t
      .inTenant(() =>
        t.service.move(
          'eng-marcos',
          { reason: 'x', grants: [pisoDos] },
          ADMIN,
          NOW,
        ),
      )
      .catch((e) => e);
    expect(err.getStatus()).toBe(422);
    expect(err.reason).toBe('GUARDRAIL_CEILING_EXCEEDED');
    expect(err.details.issues).toHaveLength(1);
    expect(t.created).toHaveLength(0);
    expect(t.fourEyes.request).not.toHaveBeenCalled();
  });

  it('un cambio con fecha futura no corta hoy: lo anterior sigue activo hasta effectiveAt y lo nuevo empieza ahí', async () => {
    const t = build();
    const later = new Date('2026-11-10T12:00:00Z');
    await t.inTenant(() =>
      t.service.move(
        'eng-marcos',
        {
          reason: 'Cambio programado',
          effectiveAt: later.toISOString(),
          grants: [pisoDos],
        },
        ADMIN,
        NOW,
      ),
    );
    const rows = (
      await t.access.findGrantsWithActions.mock.results[0].value
    ).map((x: any) => x.grant);
    expect(
      rows.every((g: any) => g.statusConceptId === DELEG.SUPPORT_GRANT_ACTIVE),
    ).toBe(true);
    expect(
      rows.every((g: any) => g.validTo?.getTime() === later.getTime()),
    ).toBe(true);
    expect(t.created[0].validFrom).toEqual(later);
  });
});

describe('EngagementMoveService · cuatro ojos por puntaje (L-04)', () => {
  const norah = {
    targetKind: 'PRACTITIONER' as const,
    practitionerRoleAssignmentId: 'role-mendez',
    actions: [
      'agenda.appointment.view',
      'agenda.appointment.view.patient_document',
      'patients.profile.view.document_full',
      'patients.clinical.request_temporary_access',
    ],
  };
  const current = () => [
    {
      grant: grantRow('mendez', {
        targetKindConceptId: DELEG.SUPPORT_TARGET_PRACTITIONER,
        practitionerRoleAssignmentId: 'role-mendez',
        healthcareServiceId: undefined,
      }),
      atoms: ['agenda.appointment.view'],
    },
  ];

  it('sube 15 puntos y aparecen átomos de sensibilidad ALTA: 202 y no cambia nada hasta que otra persona apruebe', async () => {
    const t = build({ current: current() });
    const out: any = await t.inTenant(() =>
      t.service.move(
        'eng-marcos',
        { reason: 'Coordina enfermería', grants: [norah] },
        ADMIN,
        NOW,
      ),
    );
    expect(out).toMatchObject({
      status: 'PENDING_APPROVAL',
      approvalId: 'ap-1',
      scoreBefore: 1,
      scoreAfter: 16,
    });
    expect(out.delta).toBe(15);
    expect(t.fourEyes.request).toHaveBeenCalledTimes(1);
    const req = t.fourEyes.request.mock.calls[0][1];
    expect(req).toMatchObject({
      kind: 'ENGAGEMENT_MOVE',
      actor: ADMIN,
      subjectUserId: 'marcos',
      engagementId: 'eng-marcos',
      tenantId: TENANT,
    });
    expect(req.payload.assignmentRowVersion).toBe(3);
    expect(req.payload.grants[0].actions).toEqual([...norah.actions].sort());
    expect(t.created).toHaveLength(0);
    expect(t.review.open).not.toHaveBeenCalled();
  });

  it('agregar solo facturas y cobertura (+4) se ejecuta directo, sin cuatro ojos', async () => {
    const t = build({ current: current() });
    const out: any = await t.inTenant(() =>
      t.service.move(
        'eng-marcos',
        {
          reason: 'Consulta cobros',
          grants: [
            {
              targetKind: 'PRACTITIONER',
              practitionerRoleAssignmentId: 'role-mendez',
              actions: [
                'agenda.appointment.view',
                'billing.invoice.view',
                'patients.coverage.view',
              ],
            },
          ],
        },
        ADMIN,
        NOW,
      ),
    );
    expect(out.status).toBe('EXECUTED');
    expect(t.fourEyes.request).not.toHaveBeenCalled();
  });

  it('aprobado: ejecuta con el cuerpo firmado y deja constancia de quién pidió y quién aprobó', async () => {
    const t = build({ current: current() });
    const out: any = await t.inTenant(() =>
      t.service.move(
        'eng-marcos',
        { reason: 'Coordina enfermería', grants: [norah] },
        ADMIN,
        NOW,
      ),
    );
    const payload = t.fourEyes.request.mock.calls[0][1].payload;
    expect(out.status).toBe('PENDING_APPROVAL');
    const result = await t.service.executeApproved(
      t.em,
      TENANT,
      payload,
      'admin-1',
      'gonzalo',
      NOW,
    );
    expect(result.status).toBe('EXECUTED');
    expect(t.created).toHaveLength(1);
    expect(t.created[0].approvedByUserId).toBe('gonzalo');
    const kase = t.tables.LifecycleCases[0];
    expect(kase.openedByUserId).toBe('admin-1');
    expect(JSON.stringify(kase.detailsJson)).toContain('gonzalo');
    expect(hashPayload(payload)).toMatch(/^[0-9a-f]{64}$/);
  });

  it('si el vínculo cambió entre el pedido y la aprobación: 409 FOUR_EYES_PAYLOAD_INVALID', async () => {
    const t = build({ current: current() });
    await t.inTenant(() =>
      t.service.move(
        'eng-marcos',
        { reason: 'Coordina enfermería', grants: [norah] },
        ADMIN,
        NOW,
      ),
    );
    const payload = t.fourEyes.request.mock.calls[0][1].payload;
    t.assignment.rowVersion = 4;
    await expect(
      t.service.executeApproved(
        t.em,
        TENANT,
        payload,
        'admin-1',
        'gonzalo',
        NOW,
      ),
    ).rejects.toMatchObject({ reason: Reason.FOUR_EYES_PAYLOAD_INVALID });
    expect(t.created).toHaveLength(0);
  });

  it('si lo propuesto ya no es válido al aprobar (barandilla), 409 FOUR_EYES_PAYLOAD_INVALID', async () => {
    const t = build({ current: current() });
    await t.inTenant(() =>
      t.service.move(
        'eng-marcos',
        { reason: 'Coordina enfermería', grants: [norah] },
        ADMIN,
        NOW,
      ),
    );
    const payload = t.fourEyes.request.mock.calls[0][1].payload;
    t.validator.validate.mockResolvedValue([
      {
        code: 'GUARDRAIL_CEILING_EXCEEDED',
        httpStatus: 422,
        grantIndex: 0,
        message: 'x',
      },
    ]);
    await expect(
      t.service.executeApproved(
        t.em,
        TENANT,
        payload,
        'admin-1',
        'gonzalo',
        NOW,
      ),
    ).rejects.toMatchObject({ reason: Reason.FOUR_EYES_PAYLOAD_INVALID });
  });
});
