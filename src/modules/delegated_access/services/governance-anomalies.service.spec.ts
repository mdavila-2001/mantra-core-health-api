import { GovernanceAnomaliesService } from './governance-anomalies.service';
import { GovernanceAccessService } from './governance-access.service';
import { DELEG } from '../delegated_access.concepts';
import { SUPPORT_TEMPLATE_DEFAULTS_V2 } from '../domain';
import { DelegatedAccessErrorReason as Reason } from '../delegated_access.error-reasons';
import {
  DAY,
  NOW,
  engagement,
  fakeEm,
  grant,
  ids,
  loggerStub,
  mockFn,
  securityAdmin,
  worldOf,
} from './governance-world.testing';

const HOUR = 3_600_000;
/** La última hora completa antes de NOW (10:30 La Paz): 09:00-10:00 La Paz = 13:00-14:00Z. */
const WINDOW_START = new Date('2026-11-03T13:00:00Z');

function usageRow(over: Partial<any>): any {
  return {
    tenantId: ids.tenant,
    userId: ids.marcos,
    supportScopeGrantId: 'g1',
    permissionCode: 'patients.search.exact',
    bucketStart: WINDOW_START,
    permitCount: 0,
    denyCount: 0,
    challengeCount: 0,
    offHoursCount: 0,
    distinctPatientsInBucket: 0,
    ...over,
  };
}

/** Línea base: 40 horas con 4 búsquedas en los 28 días previos (p95 horario = 4). */
function baseline(): any[] {
  return Array.from({ length: 40 }, (_, i) =>
    usageRow({
      bucketStart: new Date(WINDOW_START.getTime() - (i + 2) * HOUR),
      permitCount: 4,
    }),
  );
}

function build(
  opts: {
    engagements?: any[];
    usage?: any[];
    denied?: any[];
    created?: boolean;
    anomalyRow?: any;
  } = {},
) {
  const em = fakeEm();
  const world = worldOf(
    opts.engagements ?? [
      engagement({
        engagementId: 'e-marcos',
        subjectUserId: ids.marcos,
        supervisorUserId: ids.sofia,
        templateCode: 'CALL_CENTER',
        grants: [grant({ grantId: 'g1', actions: ['patients.search.exact'] })],
      }),
    ],
  );
  const loader = { load: mockFn().mockResolvedValue(world) };
  const repo: any = {
    createIfAbsent: mockFn().mockResolvedValue(opts.created ?? true),
    findByTenant: mockFn().mockResolvedValue([]),
    findById: mockFn().mockResolvedValue(opts.anomalyRow ?? null),
    resolve: mockFn((row: any, r: any) => {
      row.statusConceptId = r.statusConceptId;
      row.resolutionCommentText = r.comment;
      row.acknowledgedByUserId = r.byUserId;
    }),
  };
  const queries: any = {
    securityAdminUserIds: mockFn().mockResolvedValue([ids.admin]),
    anomalyIdByWindow: mockFn().mockResolvedValue('an-new'),
    deniedDecisions: mockFn().mockResolvedValue(opts.denied ?? []),
    viewedPatients: mockFn().mockResolvedValue([]),
    lastPermitByUser: mockFn().mockResolvedValue(
      new Map([[ids.marcos, new Date(NOW.getTime() - DAY)]]),
    ),
    lastLoginByUser: mockFn().mockResolvedValue(new Map()),
  };
  const usage = { findSince: mockFn().mockResolvedValue(opts.usage ?? []) };
  const settings = {
    read: mockFn().mockResolvedValue({
      unusedDays: 60,
      inactivityDays: 45,
      autoSuspendInactiveDays: null,
      reviewCadenceMonths: null,
      creepThreshold: 15,
      onboardingRequired: true,
    }),
  };
  const events = { publish: mockFn().mockResolvedValue(undefined) };
  const audit = { seal: mockFn().mockResolvedValue(undefined) };
  const lifecycle = {
    findOpenCase: mockFn().mockResolvedValue(null),
    createCase: mockFn().mockReturnValue({ id: 'case-1' }),
  };
  const zone = { timeZoneOf: mockFn().mockResolvedValue('America/La_Paz') };
  const scope = { resolveTenant: mockFn().mockReturnValue(ids.tenant) };
  const activity = { userNames: mockFn().mockResolvedValue(new Map()) };
  const service = new GovernanceAnomaliesService(
    em,
    repo,
    loader as any,
    new GovernanceAccessService(loader as any),
    queries,
    usage as any,
    settings as any,
    activity as any,
    events as any,
    audit as any,
    lifecycle as any,
    undefined,
    zone as any,
    scope as any,
    loggerStub as any,
  );
  return { service, em, repo, queries, events, audit, lifecycle, loader };
}

describe('GovernanceAnomaliesService.scan: ANOMALY_SEARCH_SPIKE (M-01)', () => {
  it('18 búsquedas en la última hora con p95 = 4: 18 > max(15, 3×4) abre la anomalía con su evidencia', async () => {
    const ctx = build({
      usage: [...baseline(), usageRow({ permitCount: 18 })],
    });
    const r = await ctx.service.scan(ctx.em, ids.tenant, NOW);
    expect(r.created).toBe(1);
    expect(ctx.repo.createIfAbsent).toHaveBeenCalledTimes(1);
    const [, anomaly] = ctx.repo.createIfAbsent.mock.calls[0];
    expect(anomaly).toMatchObject({
      tenantId: ids.tenant,
      userId: ids.marcos,
      organizationUserAssignmentId: 'e-marcos',
      kindConceptId: DELEG.ANOMALY_SEARCH_SPIKE,
      observedValue: '18.00',
      thresholdValue: '15.00',
    });
    expect(anomaly.windowStart).toEqual(WINDOW_START);
    expect(anomaly.evidence).toMatchObject({
      permitsInWindow: 18,
      p95Hourly: 4,
    });
    // Sin PHI: solo números y el átomo.
    expect(JSON.stringify(anomaly.evidence)).not.toMatch(
      /paciente|nombre|document/i,
    );
  });

  it('15 búsquedas no superan el umbral: no hay anomalía', async () => {
    const ctx = build({
      usage: [...baseline(), usageRow({ permitCount: 15 })],
    });
    const r = await ctx.service.scan(ctx.em, ids.tenant, NOW);
    expect(r.created).toBe(0);
    expect(ctx.repo.createIfAbsent).not.toHaveBeenCalled();
  });

  it('es idempotente: si la ventana ya estaba, no cuenta ni avisa de nuevo', async () => {
    const ctx = build({
      usage: [...baseline(), usageRow({ permitCount: 18 })],
      created: false,
    });
    const r = await ctx.service.scan(ctx.em, ids.tenant, NOW);
    expect(r.created).toBe(0);
    expect(ctx.events.publish).not.toHaveBeenCalled();
  });

  it('al abrirla avisa a quien administra a la persona (su dueño de cuenta), solo con identificadores', async () => {
    const ctx = build({
      usage: [...baseline(), usageRow({ permitCount: 18 })],
    });
    await ctx.service.scan(ctx.em, ids.tenant, NOW);
    expect(ctx.events.publish).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        type: 'delegated_access.anomaly.detected',
        payload: expect.objectContaining({
          userId: ids.marcos,
          notifyUserIds: [ids.sofia],
        }),
      }),
    );
  });

  it('sin dueño, el aviso va a los administradores de seguridad', async () => {
    const ctx = build({
      usage: [...baseline(), usageRow({ permitCount: 18 })],
      engagements: [
        engagement({
          engagementId: 'e-marcos',
          subjectUserId: ids.marcos,
          supervisorUserId: null,
          grants: [
            grant({ grantId: 'g1', actions: ['patients.search.exact'] }),
          ],
        }),
      ],
    });
    await ctx.service.scan(ctx.em, ids.tenant, NOW);
    expect(ctx.events.publish.mock.calls[0][1].payload.notifyUserIds).toEqual([
      ids.admin,
    ]);
  });
});

describe('GovernanceAnomaliesService.scan: otras reglas', () => {
  it('ráfaga de denegaciones: 10 DENY/CHALLENGE en 10 minutos', async () => {
    const t0 = NOW.getTime() - 40 * 60_000;
    const denied = Array.from({ length: 10 }, (_, i) => ({
      userId: ids.marcos,
      recordedAt: new Date(t0 + i * 30_000),
    }));
    const ctx = build({ denied });
    const r = await ctx.service.scan(ctx.em, ids.tenant, NOW);
    expect(r.created).toBe(1);
    expect(ctx.repo.createIfAbsent.mock.calls[0][1]).toMatchObject({
      kindConceptId: DELEG.ANOMALY_DENIED_BURST,
      observedValue: '10.00',
    });
  });

  it('fuera de horario: 5 acciones de sensibilidad MEDIA o más fuera de 07:00-20:00 en el día', async () => {
    // 23:00 La Paz del lunes 2026-11-02 = 03:00Z del 11-03; aún cae en el día local de NOW? No: usamos el día de NOW.
    const night = new Date('2026-11-03T04:00:00Z'); // 00:00 La Paz del 11-03
    const ctx = build({
      usage: [
        usageRow({
          permissionCode: 'agenda.appointment.cancel',
          bucketStart: night,
          permitCount: 5,
          offHoursCount: 5,
        }),
      ],
    });
    const r = await ctx.service.scan(ctx.em, ids.tenant, NOW);
    expect(r.byKind.ANOMALY_OFF_HOURS).toBe(1);
  });

  it('cuenta inactiva con acceso vivo: sin PERMIT ni inicio de sesión en 45 días', async () => {
    const ctx = build();
    ctx.queries.lastPermitByUser.mockResolvedValue(new Map());
    const r = await ctx.service.scan(ctx.em, ids.tenant, NOW);
    expect(r.byKind.ANOMALY_INACTIVE_ACCOUNT).toBe(1);
    expect(
      ctx.repo.createIfAbsent.mock.calls.map((c: any[]) => c[1].kindConceptId),
    ).toContain(DELEG.ANOMALY_INACTIVE_ACCOUNT);
  });

  it('acumulación de privilegios: deriva ≥ umbral', async () => {
    const base = [...SUPPORT_TEMPLATE_DEFAULTS_V2.BILLING_CASHIER];
    const ctx = build({
      engagements: [
        engagement({
          engagementId: 'e-mario',
          subjectUserId: ids.mario,
          templateCode: 'BILLING_CASHIER',
          lastCertifiedAt: NOW,
          grants: [
            grant({
              grantId: 'm',
              actions: [
                ...base,
                'billing.discount.apply',
                'billing.cashbox.close',
                'reports.billing.export',
              ],
            }),
          ],
        }),
      ],
    });
    ctx.queries.lastPermitByUser.mockResolvedValue(new Map([[ids.mario, NOW]]));
    const r = await ctx.service.scan(ctx.em, ids.tenant, NOW);
    expect(r.byKind.ANOMALY_PRIVILEGE_CREEP).toBe(1);
  });

  it('una persona suspendida o dada de baja no se analiza', async () => {
    const ctx = build({
      engagements: [
        engagement({
          engagementId: 'e1',
          subjectUserId: ids.marcos,
          state: 'SUSPENDED',
          grants: [
            grant({ grantId: 'g1', actions: ['patients.search.exact'] }),
          ],
        }),
      ],
      usage: [...baseline(), usageRow({ permitCount: 99 })],
    });
    expect((await ctx.service.scan(ctx.em, ids.tenant, NOW)).created).toBe(0);
  });
});

describe('GovernanceAnomaliesService.ack', () => {
  const row = (over: Partial<any> = {}): any => ({
    id: 'an-1',
    tenantId: ids.tenant,
    userId: ids.marcos,
    organizationUserAssignmentId: 'e-marcos',
    statusConceptId: DELEG.ANOMALY_OPEN,
    ...over,
  });

  it('reconocer deja ACKNOWLEDGED con quién y el sello ANOMALY_ACKNOWLEDGED', async () => {
    const ctx = build({ anomalyRow: row() });
    const r = await ctx.service.ack(
      'an-1',
      { status: 'ACKNOWLEDGED', comment: 'Era una campaña de recordatorios.' },
      securityAdmin(),
    );
    expect(r).toEqual({ ok: true, status: 'ACKNOWLEDGED' });
    expect(ctx.repo.resolve).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'an-1' }),
      expect.objectContaining({
        statusConceptId: DELEG.ANOMALY_ACKNOWLEDGED,
        byUserId: ids.admin,
      }),
    );
    expect(ctx.audit.seal).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      ids.tenant,
      'ANOMALY_ACKNOWLEDGED',
      'access_anomaly',
      'an-1',
    );
  });

  it('descartar exige comentario de 10 caracteres: 422 ANOMALY_COMMENT_REQUIRED', async () => {
    const ctx = build({ anomalyRow: row() });
    await expect(
      ctx.service.ack(
        'an-1',
        { status: 'DISMISSED', comment: 'corto' },
        securityAdmin(),
      ),
    ).rejects.toMatchObject({
      reason: Reason.ANOMALY_COMMENT_REQUIRED,
      status: 422,
    });
    expect(ctx.repo.resolve).not.toHaveBeenCalled();
  });

  it('escalar abre una suspensión sugerida (caso de ciclo de vida SUSPENSION) una sola vez', async () => {
    const ctx = build({ anomalyRow: row() });
    await ctx.service.ack(
      'an-1',
      { status: 'ESCALATED', comment: 'Revisar con el dueño de la cuenta.' },
      securityAdmin(),
    );
    expect(ctx.lifecycle.createCase).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        tenantId: ids.tenant,
        organizationUserAssignmentId: 'e-marcos',
        subjectUserId: ids.marcos,
        kindConceptId: DELEG.LIFECYCLE_SUSPENSION,
      }),
    );
    const again = build({ anomalyRow: row() });
    again.lifecycle.findOpenCase.mockResolvedValue({ id: 'ya' });
    await again.service.ack('an-1', { status: 'ESCALATED' }, securityAdmin());
    expect(again.lifecycle.createCase).not.toHaveBeenCalled();
  });

  it('una anomalía ya resuelta es 409; una ajena o inexistente, 404', async () => {
    const resolved = build({
      anomalyRow: row({ statusConceptId: DELEG.ANOMALY_DISMISSED }),
    });
    await expect(
      resolved.service.ack('an-1', { status: 'ACKNOWLEDGED' }, securityAdmin()),
    ).rejects.toMatchObject({
      reason: Reason.ANOMALY_ALREADY_RESOLVED,
    });
    const missing = build();
    await expect(
      missing.service.ack('x', { status: 'ACKNOWLEDGED' }, securityAdmin()),
    ).rejects.toMatchObject({
      reason: Reason.ANOMALY_NOT_FOUND,
      status: 404,
    });
  });
});
