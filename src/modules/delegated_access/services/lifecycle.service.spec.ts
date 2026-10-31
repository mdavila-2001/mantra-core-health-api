import { jest } from '@jest/globals';
import { ResourceNotFoundException, runWithTenant } from '../../../common';
import { DIR } from '../../directory/directory.concepts';
import { DELEG } from '../delegated_access.concepts';
import { DelegatedAccessErrorReason as Reason } from '../delegated_access.error-reasons';
import { checklistFor } from '../domain';
import { LifecycleRepository } from '../repositories/lifecycle.repository';
import { STATUS } from './concept-maps';
import { DelegationScopeService } from './delegation-scope.service';
import { LifecycleService } from './lifecycle.service';
import { memoryEm } from './lifecycle.testing';
import { DEFAULT_LIFECYCLE_SETTINGS } from './support-lifecycle-settings';

/** Mock laxo: evita el tipado estricto `Mock<never>` del runtime de jest. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const TENANT = 'org-1';
const NOW = new Date('2026-11-03T14:30:00Z');
const ADMIN = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;
const GATE_ON = {
  ...DEFAULT_LIFECYCLE_SETTINGS,
  onboardingRequired: true,
  onboardingRequiredSince: new Date('2026-11-02T04:00:00Z'),
};

/** Vínculo de Nora, creado tras la compuerta y sin dueño (caso L-06). */
function build(
  opts: { settings?: any; candidate?: any; identity?: boolean } = {},
) {
  const assignment: any = {
    id: 'eng-nora',
    statusConceptId: STATUS.ACTIVE,
    supervisorUserId: undefined,
    createdAt: new Date('2026-11-02T10:00:00Z'),
    nextRecertificationAt: new Date('2027-11-02'),
    tenantMembershipId: 'mem-nora',
  };
  const record = {
    assignment,
    tenantId: TENANT,
    userId: 'nora',
    membershipStatusConceptId: DIR.MEMBERSHIP_ACTIVE,
  };
  const { em, tables } = memoryEm(mockFn);
  const access = {
    findEngagements: mockFn(async (_em: any, f: any) =>
      f.ids && !f.ids.includes(assignment.id) ? [] : [record],
    ),
  };
  const settings = {
    forTenant: mockFn().mockResolvedValue(opts.settings ?? GATE_ON),
  };
  const directory = {
    ownerCandidate: mockFn().mockResolvedValue(
      opts.candidate ?? {
        userId: 'mendez',
        membershipLive: true,
        isSecurityAdmin: false,
        isOrgDoctor: true,
        isLiveDelegatedAdmin: false,
      },
    ),
  };
  const facts = {
    platformIdentityVerified: mockFn().mockResolvedValue(opts.identity ?? true),
    mfaEnrolled: mockFn().mockResolvedValue(true),
    doctorAcceptances: mockFn().mockResolvedValue({ pending: 0, total: 1 }),
  };
  const outbox = { publishDomainEvent: mockFn().mockResolvedValue({}) };
  const audit = { record: mockFn().mockResolvedValue(undefined) };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new LifecycleService(
    em,
    new LifecycleRepository(),
    access as any,
    settings as any,
    directory as any,
    facts as any,
    outbox as any,
    audit as any,
    new DelegationScopeService({} as any, {} as any, {} as any, {} as any),
    logger as any,
  );
  const inTenant = <T>(fn: () => T): T => runWithTenant(TENANT, fn);
  return {
    service,
    em,
    tables,
    assignment,
    record,
    access,
    directory,
    facts,
    outbox,
    audit,
    settings,
    inTenant,
  };
}

describe('LifecycleService · ingreso (joiner)', () => {
  it('abre el caso JOINER con la lista deducida de los hechos y sin completar el vínculo', async () => {
    const t = build();
    const c = await t.service.openJoiner(
      t.em,
      {
        engagement: t.assignment,
        tenantId: TENANT,
        userId: 'nora',
        actorUserId: 'admin-1',
      },
      NOW,
    );
    expect(c.kindConceptId).toBe(DELEG.LIFECYCLE_JOINER);
    expect(c.statusConceptId).toBe(DELEG.LIFECYCLE_OPEN);
    const list = c.checklistJson as any[];
    const state = Object.fromEntries(list.map((i) => [i.code, i.status]));
    expect(state.IDENTITY_VERIFIED).toBe('DONE'); // identidad de plataforma: automático
    expect(state.CONFIDENTIALITY_ACK).toBe('PENDING');
    expect(state.SUPERVISOR_ASSIGNED).toBe('PENDING');
    expect(state.FIRST_REVIEW_SCHEDULED).toBe('DONE');
    expect(c.dueAt?.toISOString()).toBe('2026-11-09T10:00:00.000Z'); // 7 días desde que nació el vínculo
    expect(t.assignment.onboardingCompletedAt).toBeUndefined();
    const [, event] = t.outbox.publishDomainEvent.mock.calls[0];
    expect(event.eventType).toBe('delegated_access.lifecycle.joiner_opened');
    expect(JSON.stringify(event.payloadJson)).not.toMatch(/nora@|document/i);
  });

  it('refreshJoiner completa el caso y fija onboarding_completed_at cuando no falta nada obligatorio', async () => {
    const t = build();
    const c = await t.service.openJoiner(
      t.em,
      { engagement: t.assignment, tenantId: TENANT, userId: 'nora' },
      NOW,
    );
    // La persona acepta el compromiso y el administrador asigna dueño.
    (c.checklistJson as any[]).find(
      (i) => i.code === 'CONFIDENTIALITY_ACK',
    ).status = 'DONE';
    (c.checklistJson as any[]).find(
      (i) => i.code === 'CONFIDENTIALITY_ACK',
    ).completedAt = NOW.toISOString();
    t.assignment.supervisorUserId = 'mendez';
    await t.service.refreshJoiner(t.em, 'eng-nora', NOW);
    expect(c.statusConceptId).toBe(DELEG.LIFECYCLE_COMPLETED);
    expect(c.completedAt).toEqual(NOW);
    expect(t.assignment.onboardingCompletedAt).toEqual(NOW);
    const types = t.outbox.publishDomainEvent.mock.calls.map(
      (x: any[]) => x[1].eventType,
    );
    expect(types).toContain('delegated_access.lifecycle.joiner_completed');
  });

  it('un vínculo que ya completó el ingreso no se vuelve a evaluar', async () => {
    const t = build();
    t.assignment.onboardingCompletedAt = new Date('2026-10-01');
    await t.service.refreshJoiner(t.em, 'eng-nora', NOW);
    expect(t.outbox.publishDomainEvent).not.toHaveBeenCalled();
  });
});

describe('LifecycleService · dueño de la cuenta (D-07)', () => {
  it('asignar dueño: PUT owner completa el ingreso de Nora (caso 35)', async () => {
    const t = build();
    const c = await t.service.openJoiner(
      t.em,
      { engagement: t.assignment, tenantId: TENANT, userId: 'nora' },
      NOW,
    );
    const item = (c.checklistJson as any[]).find(
      (i) => i.code === 'CONFIDENTIALITY_ACK',
    );
    item.status = 'DONE';
    item.completedAt = NOW.toISOString();
    await t.inTenant(() =>
      t.service.setOwner('eng-nora', { supervisorUserId: 'mendez' }, ADMIN),
    );
    expect(t.assignment.supervisorUserId).toBe('mendez');
    expect(t.assignment.onboardingCompletedAt).toBeDefined();
    expect(c.statusConceptId).toBe(DELEG.LIFECYCLE_COMPLETED);
  });

  it('nadie es dueño de su propia cuenta (GP-8): 422 GUARDRAIL_SELF_SUPERVISION', async () => {
    const t = build({
      candidate: {
        userId: 'nora',
        membershipLive: true,
        isSecurityAdmin: true,
        isOrgDoctor: false,
        isLiveDelegatedAdmin: false,
      },
    });
    await expect(
      t.inTenant(() =>
        t.service.setOwner('eng-nora', { supervisorUserId: 'nora' }, ADMIN),
      ),
    ).rejects.toMatchObject({ reason: Reason.GUARDRAIL_SELF_SUPERVISION });
    expect(t.assignment.supervisorUserId).toBeUndefined();
  });

  it('un candidato que no es administrador, doctor ni delegado vivo: 422 OWNER_NOT_ELIGIBLE', async () => {
    const t = build({
      candidate: {
        userId: 'lucia',
        membershipLive: true,
        isSecurityAdmin: false,
        isOrgDoctor: false,
        isLiveDelegatedAdmin: false,
      },
    });
    const err: any = await t
      .inTenant(() =>
        t.service.setOwner('eng-nora', { supervisorUserId: 'lucia' }, ADMIN),
      )
      .catch((e) => e);
    expect(err.getStatus()).toBe(422);
    expect(err.reason).toBe(Reason.OWNER_NOT_ELIGIBLE);
    expect(t.assignment.supervisorUserId).toBeUndefined();
  });

  it('un vínculo ajeno responde como inexistente', async () => {
    const t = build();
    t.access.findEngagements.mockResolvedValue([]);
    await expect(
      t.inTenant(() =>
        t.service.setOwner('otro', { supervisorUserId: 'mendez' }, ADMIN),
      ),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  it('al asignar dueño a una cuenta huérfana de una baja con traspaso pendiente, completa el caso de la baja (caso 31)', async () => {
    const t = build();
    const lifecycle = new LifecycleRepository();
    const leaver = lifecycle.createCase(t.em, {
      tenantId: TENANT,
      organizationUserAssignmentId: 'eng-ricardo',
      subjectUserId: 'ricardo',
      kindConceptId: DELEG.LIFECYCLE_LEAVER,
      openedAt: NOW,
      checklist: checklistFor('LEAVER'),
    });
    const [pending] = lifecycle.createHandoverItems(t.em, [
      {
        tenantId: TENANT,
        lifecycleCaseId: leaver.id,
        itemKindConceptId: DELEG.HANDOVER_SUPERVISED_ENGAGEMENT,
        sourceId: 'eng-nora',
        fromUserId: 'ricardo',
      },
    ]);
    await t.inTenant(() =>
      t.service.setOwner('eng-nora', { supervisorUserId: 'mendez' }, ADMIN),
    );
    expect(pending.statusConceptId).toBe(DELEG.HANDOVER_REASSIGNED);
    expect(pending.toUserId).toBe('mendez');
    expect(leaver.statusConceptId).toBe(DELEG.LIFECYCLE_COMPLETED);
  });
});

describe('LifecycleService · baja con traspaso pendiente sobre una base real (hallazgo del humo, caso 31)', () => {
  it('el conteo de pendientes solo ve lo confirmado: se hace flush antes de contar y el caso de la baja se completa', async () => {
    const t = build();
    const lifecycle = new LifecycleRepository();
    const leaver = lifecycle.createCase(t.em, {
      tenantId: TENANT,
      organizationUserAssignmentId: 'eng-ricardo',
      subjectUserId: 'ricardo',
      kindConceptId: DELEG.LIFECYCLE_LEAVER,
      openedAt: NOW,
      checklist: checklistFor('LEAVER'),
    });
    const [pending] = lifecycle.createHandoverItems(t.em, [
      {
        tenantId: TENANT,
        lifecycleCaseId: leaver.id,
        itemKindConceptId: DELEG.HANDOVER_SUPERVISED_ENGAGEMENT,
        sourceId: 'eng-nora',
        fromUserId: 'ricardo',
      },
    ]);
    // Una base real: `count` lee lo confirmado con `flush`, no lo que el contexto tiene en memoria.
    const committed = new Map<string, string>([
      [pending.id, pending.statusConceptId],
    ]);
    const countInMemory = t.em.count;
    t.em.flush = (jest.fn as any)(async () => {
      for (const row of t.tables.HandoverItems)
        committed.set(row.id, row.statusConceptId);
    });
    t.em.count = (jest.fn as any)(async (entity: any, where: any) =>
      entity.name === 'HandoverItems'
        ? t.tables.HandoverItems.filter(
            (r: any) =>
              r.lifecycleCaseId === where.lifecycleCaseId &&
              committed.get(r.id) === where.statusConceptId,
          ).length
        : countInMemory(entity, where),
    );
    await t.inTenant(() =>
      t.service.setOwner('eng-nora', { supervisorUserId: 'mendez' }, ADMIN),
    );
    expect(pending.statusConceptId).toBe(DELEG.HANDOVER_REASSIGNED);
    expect(leaver.statusConceptId).toBe(DELEG.LIFECYCLE_COMPLETED);
  });
});

describe('LifecycleService · lista de verificación', () => {
  async function withCase() {
    const t = build();
    const c = await t.service.openJoiner(
      t.em,
      { engagement: t.assignment, tenantId: TENANT, userId: 'nora' },
      NOW,
    );
    return { t, c };
  }

  it('un ítem automático no se marca a mano: 409 LIFECYCLE_ITEM_AUTOMATIC', async () => {
    const { t, c } = await withCase();
    const err: any = await t
      .inTenant(() => t.service.completeItem(c.id, 'MFA_ENROLLED', ADMIN))
      .catch((e) => e);
    expect(err.reason).toBe(Reason.LIFECYCLE_ITEM_AUTOMATIC);
    expect(err.getStatus()).toBe(409);
  });

  it('un código desconocido y un caso ajeno responden 404', async () => {
    const { t, c } = await withCase();
    await expect(
      t.inTenant(() => t.service.completeItem(c.id, 'NO_EXISTE', ADMIN)),
    ).rejects.toMatchObject({ reason: Reason.LIFECYCLE_ITEM_UNKNOWN });
    await expect(
      t.inTenant(() =>
        t.service.completeItem('otro-caso', 'IDENTITY_VERIFIED', ADMIN),
      ),
    ).rejects.toMatchObject({ reason: Reason.LIFECYCLE_CASE_NOT_FOUND });
  });

  it('B-M5: el compromiso de confidencialidad solo lo acepta la propia persona: ni un administrador ni un delegado lo marcan (409 LIFECYCLE_ITEM_AUTOMATIC)', async () => {
    const { t, c } = await withCase();
    const err: any = await t
      .inTenant(() =>
        t.service.completeItem(c.id, 'CONFIDENTIALITY_ACK', ADMIN),
      )
      .catch((e) => e);
    expect(err.reason).toBe(Reason.LIFECYCLE_ITEM_AUTOMATIC);
    expect(err.getStatus()).toBe(409);
    const detail = await t.inTenant(() => t.service.getCase(c.id));
    expect(
      detail.checklist.find((i) => i.code === 'CONFIDENTIALITY_ACK')?.status,
    ).toBe('PENDING');
  });

  it('el detalle del caso trae la lista y los traspasos', async () => {
    const { t, c } = await withCase();
    const detail = await t.inTenant(() => t.service.getCase(c.id));
    expect(detail).toMatchObject({
      id: c.id,
      kind: 'JOINER',
      status: 'OPEN',
      engagementId: 'eng-nora',
    });
    expect(detail.checklist.length).toBe(7);
    expect(detail.handover).toEqual([]);
  });
});

describe('LifecycleService · registro de transferencia exportable', () => {
  it('lleva la lista y los traspasos, un hash de 64 hex y deja el asiento de la exportación', async () => {
    const t = build();
    const c = await t.service.openJoiner(
      t.em,
      { engagement: t.assignment, tenantId: TENANT, userId: 'nora' },
      NOW,
    );
    const out = await t.inTenant(() => t.service.exportCase(c.id, ADMIN));
    expect(out.case.id).toBe(c.id);
    expect(out.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(out.exportedAt).toBeInstanceOf(Date);
    expect(t.audit.record).toHaveBeenCalledWith(
      t.em,
      ADMIN,
      expect.objectContaining({
        action: 'GOVERNANCE_REPORT_EXPORTED',
        entity: 'lifecycle_case',
        entityId: c.id,
        tenantId: TENANT,
        success: true,
      }),
    );
  });
});

describe('LifecycleService · compromiso de confidencialidad de la persona', () => {
  it('lo acepta quien es la persona del vínculo y deja la fecha en la lista del ingreso', async () => {
    const t = build();
    const c = await t.service.openJoiner(
      t.em,
      { engagement: t.assignment, tenantId: TENANT, userId: 'nora' },
      NOW,
    );
    const out = await t.service.confidentialityAckMine('eng-nora', {
      id: 'nora',
    } as any);
    expect(out).toMatchObject({ ok: true, tenantId: TENANT });
    const item = (c.checklistJson as any[]).find(
      (i) => i.code === 'CONFIDENTIALITY_ACK',
    );
    expect(item.status).toBe('DONE');
  });

  it('no acepta por otra persona: el vínculo ajeno responde como inexistente', async () => {
    const t = build();
    await expect(
      t.service.confidentialityAckMine('eng-nora', { id: 'intruso' } as any),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  it('un vínculo terminado responde 422 SUPPORT_ENGAGEMENT_NOT_ACTIVE', async () => {
    const t = build();
    t.assignment.statusConceptId = STATUS.REVOKED;
    await expect(
      t.service.confidentialityAckMine('eng-nora', { id: 'nora' } as any),
    ).rejects.toMatchObject({ reason: Reason.SUPPORT_ENGAGEMENT_NOT_ACTIVE });
  });
});

describe('LifecycleService · verificación de identidad', () => {
  it('un administrador la registra con método y nota; el ingreso se reevalúa', async () => {
    const t = build({ identity: false });
    await t.service.openJoiner(
      t.em,
      { engagement: t.assignment, tenantId: TENANT, userId: 'nora' },
      NOW,
    );
    await t.inTenant(() =>
      t.service.identityVerification(
        'eng-nora',
        { method: 'IN_PERSON', note: 'Cédula vista en persona' },
        ADMIN,
      ),
    );
    expect(t.assignment.identityVerifiedAt).toBeInstanceOf(Date);
    expect(t.assignment.identityVerifiedByUserId).toBe('admin-1');
    expect(t.assignment.identityMethodConceptId).toBe(
      DELEG.IDENTITY_METHOD_IN_PERSON,
    );
  });
});

describe('LifecycleService · cuentas sin dueño', () => {
  it('lista el vínculo vivo sin dueño y el cuyo dueño dejó de ser elegible', async () => {
    const t = build();
    const sinDueno = {
      assignment: { ...t.assignment, id: 'e1' },
      tenantId: TENANT,
      userId: 'u1',
      membershipStatusConceptId: DIR.MEMBERSHIP_ACTIVE,
    };
    const dueñoCaído = {
      assignment: { ...t.assignment, id: 'e2', supervisorUserId: 'ricardo' },
      tenantId: TENANT,
      userId: 'u2',
      membershipStatusConceptId: DIR.MEMBERSHIP_ACTIVE,
    };
    const conDueño = {
      assignment: { ...t.assignment, id: 'e3', supervisorUserId: 'mendez' },
      tenantId: TENANT,
      userId: 'u3',
      membershipStatusConceptId: DIR.MEMBERSHIP_ACTIVE,
    };
    t.access.findEngagements.mockResolvedValue([
      sinDueno,
      dueñoCaído,
      conDueño,
    ]);
    t.directory.ownerCandidate.mockImplementation(
      async (_e: any, userId: string) => ({
        userId,
        membershipLive: userId === 'mendez',
        isSecurityAdmin: false,
        isOrgDoctor: userId === 'mendez',
        isLiveDelegatedAdmin: false,
      }),
    );
    const out = await t.service.listOwnerless(t.em, TENANT, NOW);
    expect(out).toEqual([
      { engagementId: 'e1', userId: 'u1', reasons: ['NO_OWNER'] },
      { engagementId: 'e2', userId: 'u2', reasons: ['OWNER_NOT_ELIGIBLE'] },
    ]);
  });
});
