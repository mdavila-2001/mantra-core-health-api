import { GovernanceSweepService } from './governance-sweep.service';
import { CONCEPTS } from '../../../common';
import { DELEG } from '../delegated_access.concepts';
import {
  DAY,
  NOW,
  engagement,
  fakeEm,
  grant,
  ids,
  loggerStub,
  mockFn,
  worldOf,
} from './governance-world.testing';

const SYSTEM: any = { id: 'sys', roles: ['SYSTEM'] };
const T2 = '22222222-2222-4222-8222-222222222222';

function build(
  opts: {
    tenants?: string[];
    openCampaigns?: any[];
    pendingFourEyes?: any[];
    approvedOverdue?: Array<{ id: string; tenantId: string }>;
    dueSod?: any[];
    settings?: Partial<any>;
    world?: any;
    /** B-B12: `false` = otro proceso tiene el cerrojo del barrido. */
    locked?: boolean;
  } = {},
) {
  const em = fakeEm();
  const campaignsRepo: any = {
    findCampaigns: mockFn(async (_e: any, tenantId: string) =>
      (opts.openCampaigns ?? []).filter((c) => c.tenantId === tenantId),
    ),
  };
  const fourEyes: any = {
    findExpiredPendingAcrossTenants: mockFn().mockResolvedValue(
      opts.pendingFourEyes ?? [],
    ),
    findById: mockFn(
      async (_e: any, _t: string, id: string) =>
        (opts.pendingFourEyes ?? []).find((r) => r.id === id) ?? null,
    ),
    markExpired: mockFn((row: any) => {
      row.statusConceptId = DELEG.FOUR_EYES_EXPIRED;
    }),
    expireApproved: mockFn().mockResolvedValue(true),
  };
  const sod: any = {
    findDueExceptionsAcrossTenants: mockFn().mockResolvedValue(
      opts.dueSod ?? [],
    ),
    findExceptionById: mockFn(
      async (_e: any, _t: string, id: string) =>
        (opts.dueSod ?? []).find((r) => r.id === id) ?? null,
    ),
  };
  const queries: any = {
    // B-B12: exclusión mutua. Por omisión el cerrojo se obtiene y se ejecuta el trabajo.
    withExclusiveLock: mockFn(async (_e: any, _k: string, work: any) =>
      opts.locked === false
        ? { acquired: false }
        : { acquired: true, value: await work() },
    ),
    tenantsWithEngagements: mockFn().mockResolvedValue(
      opts.tenants ?? [ids.tenant],
    ),
    findOverdueApprovedAcrossTenants: mockFn().mockResolvedValue(
      opts.approvedOverdue ?? [],
    ),
    lastPermitByUser: mockFn().mockResolvedValue(new Map()),
    lastLoginByUser: mockFn().mockResolvedValue(new Map()),
  };
  const usage: any = { purgeBefore: mockFn().mockResolvedValue(7) };
  const campaigns: any = {
    closeCampaign: mockFn().mockResolvedValue({
      closed: true,
      autoRevoked: 3,
      skipped: 0,
    }),
  };
  const automation: any = {
    remindAndEscalate: mockFn().mockResolvedValue({
      reminders: 2,
      escalations: 1,
    }),
    openRecertificationItems: mockFn().mockResolvedValue({
      campaigns: 1,
      items: 4,
    }),
    openPeriodicCampaigns: mockFn().mockResolvedValue({ created: 1 }),
    openRemediation: mockFn().mockResolvedValue({ campaigns: 1, items: 2 }),
    expireSodExceptions: mockFn(
      async (_t: any, _tenant: string, rows: any[]) => ({
        expired: rows.length,
        remediationItems: rows.length,
      }),
    ),
  };
  const anomalies: any = {
    scan: mockFn().mockResolvedValue({
      created: 2,
      byKind: { ANOMALY_SEARCH_SPIKE: 2 },
    }),
  };
  const settings: any = {
    read: mockFn().mockResolvedValue({
      unusedDays: 60,
      inactivityDays: 45,
      autoSuspendInactiveDays: null,
      reviewCadenceMonths: null,
      creepThreshold: 15,
      onboardingRequired: true,
      ...(opts.settings ?? {}),
    }),
  };
  const loader: any = {
    load: mockFn().mockResolvedValue(opts.world ?? worldOf([])),
  };
  const events = { publish: mockFn().mockResolvedValue(undefined) };
  const audit = { seal: mockFn().mockResolvedValue(undefined) };
  const effective = { refreshTenant: mockFn().mockResolvedValue({ rows: 0 }) };
  const suspension: any = {
    suspendSystem: mockFn().mockResolvedValue({ ok: true, caseId: 'case-1' }),
  };
  const zone = { timeZoneOf: mockFn().mockResolvedValue('America/La_Paz') };
  const service = new GovernanceSweepService(
    em,
    campaignsRepo,
    fourEyes,
    sod,
    queries,
    usage,
    campaigns,
    automation,
    anomalies,
    settings,
    loader,
    events as any,
    audit as any,
    suspension,
    zone as any,
    loggerStub as any,
  );
  return {
    service,
    em,
    campaignsRepo,
    fourEyes,
    sod,
    queries,
    usage,
    campaigns,
    automation,
    anomalies,
    events,
    audit,
    effective,
    suspension,
    loader,
  };
}

const campaign = (over: Partial<any> = {}) => ({
  id: 'c1',
  tenantId: ids.tenant,
  name: 'Certificación Q4-2026',
  statusConceptId: DELEG.REVIEW_CAMPAIGN_OPEN,
  ...over,
});

describe('GovernanceSweepService · B-B12 (exclusión mutua)', () => {
  it('con otro barrido diario en curso no hace nada: sin cierres, sin recordatorios, sin campañas periódicas', async () => {
    const c = build({ openCampaigns: [campaign()], locked: false });
    const r = await c.service.runDaily(SYSTEM, NOW);
    expect(r.counts.skippedBusy).toBe(1);
    expect(r.counts.tenants).toBe(0);
    expect(c.queries.tenantsWithEngagements).not.toHaveBeenCalled();
    expect(c.fourEyes.findExpiredPendingAcrossTenants).not.toHaveBeenCalled();
    expect(c.campaigns.closeCampaign).not.toHaveBeenCalled();
    expect(c.automation.openPeriodicCampaigns).not.toHaveBeenCalled();
    expect(c.usage.purgeBefore).not.toHaveBeenCalled();
  });

  it('con otro escaneo de anomalías en curso tampoco escanea', async () => {
    const c = build({ locked: false });
    const r = await c.service.runAnomalyScan(NOW);
    expect(r.counts.skippedBusy).toBe(1);
    expect(c.anomalies.scan).not.toHaveBeenCalled();
  });

  it('cada barrido toma SU cerrojo (el diario y el de anomalías no se bloquean entre sí)', async () => {
    const c = build();
    await c.service.runDaily(SYSTEM, NOW);
    await c.service.runAnomalyScan(NOW);
    const keys = c.queries.withExclusiveLock.mock.calls.map((x: any[]) => x[1]);
    expect(keys).toEqual([
      'governance-sweep:daily',
      'governance-sweep:anomaly-scan',
    ]);
  });

  it('con el cerrojo obtenido corre normal y NO marca skippedBusy', async () => {
    const c = build({ openCampaigns: [campaign()] });
    const r = await c.service.runDaily(SYSTEM, NOW);
    expect(r.counts.skippedBusy).toBeUndefined();
    expect(r.counts.tenants).toBe(1);
  });
});

describe('GovernanceSweepService.runDaily', () => {
  it('K-03: cierra cada campaña vencida (acción por defecto, no manual) y cuenta lo auto-revocado', async () => {
    const c = build({ openCampaigns: [campaign()] });
    const r = await c.service.runDaily(SYSTEM, NOW);
    expect(c.campaigns.closeCampaign).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ id: 'c1' }),
      NOW,
      expect.objectContaining({ manual: false, actor: SYSTEM }),
    );
    expect(r.counts).toMatchObject({ campaignsClosed: 1, itemsAutoRevoked: 3 });
    // Una campaña que se cerró ya no recibe recordatorios.
    expect(c.automation.remindAndEscalate).not.toHaveBeenCalled();
  });

  it('si la campaña aún no cierra, manda recordatorios y escala', async () => {
    const c = build({ openCampaigns: [campaign()] });
    c.campaigns.closeCampaign.mockResolvedValue({
      closed: false,
      reason: 'NOT_DUE',
      autoRevoked: 0,
      skipped: 0,
    });
    const r = await c.service.runDaily(SYSTEM, NOW);
    expect(c.automation.remindAndEscalate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ id: 'c1' }),
      NOW,
      SYSTEM,
    );
    expect(r.counts).toMatchObject({
      campaignsClosed: 0,
      reminders: 2,
      escalations: 1,
    });
  });

  it('abre ítems de recertificación, periódicas y remediación por organización', async () => {
    const c = build();
    const r = await c.service.runDaily(SYSTEM, NOW);
    expect(c.automation.openRecertificationItems).toHaveBeenCalledWith(
      expect.anything(),
      ids.tenant,
      NOW,
      'America/La_Paz',
    );
    expect(c.automation.openPeriodicCampaigns).toHaveBeenCalledWith(
      expect.anything(),
      ids.tenant,
      NOW,
    );
    expect(c.automation.openRemediation).toHaveBeenCalledWith(
      expect.anything(),
      ids.tenant,
      NOW,
    );
    expect(r.counts).toMatchObject({
      recertificationItems: 4,
      periodicCampaigns: 1,
      remediationItems: 2,
      tenants: 1,
      tenantErrors: 0,
    });
  });

  it('vence los cuatro ojos pendientes y las aprobaciones sin usar, con aviso', async () => {
    const pending = [
      {
        id: 'f1',
        tenantId: ids.tenant,
        requesterUserId: ids.ana,
        statusConceptId: DELEG.FOUR_EYES_PENDING,
      },
    ];
    const c = build({
      pendingFourEyes: pending,
      approvedOverdue: [{ id: 'f2', tenantId: ids.tenant }],
    });
    const r = await c.service.runDaily(SYSTEM, NOW);
    expect(c.fourEyes.markExpired).toHaveBeenCalledWith(pending[0], NOW);
    expect(c.fourEyes.expireApproved).toHaveBeenCalledWith(
      expect.anything(),
      'f2',
      NOW,
    );
    expect(r.counts.fourEyesExpired).toBe(2);
    expect(c.events.publish).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ type: 'delegated_access.four_eyes.expired' }),
    );
  });

  it('S-03: vence las excepciones SoD por organización', async () => {
    const due = [
      {
        id: 'x1',
        tenantId: ids.tenant,
        statusConceptId: CONCEPTS.STATE_ACTIVE,
      },
      { id: 'x2', tenantId: T2, statusConceptId: CONCEPTS.STATE_ACTIVE },
      {
        id: 'x3',
        tenantId: ids.tenant,
        statusConceptId: CONCEPTS.STATE_ACTIVE,
      },
    ];
    const c = build({ dueSod: due, tenants: [] });
    const r = await c.service.runDaily(SYSTEM, NOW);
    expect(c.automation.expireSodExceptions).toHaveBeenCalledTimes(2);
    const byTenant = new Map(
      c.automation.expireSodExceptions.mock.calls.map((call: any[]) => [
        call[1],
        call[2].map((x: any) => x.id),
      ]),
    );
    expect(byTenant.get(ids.tenant)).toEqual(['x1', 'x3']);
    expect(byTenant.get(T2)).toEqual(['x2']);
    expect(r.counts).toMatchObject({
      sodExceptionsExpired: 3,
      sodRemediationItems: 3,
    });
  });

  it('un fallo en una organización no detiene a las demás y se cuenta', async () => {
    const c = build({ tenants: [ids.tenant, T2] });
    c.automation.openRecertificationItems.mockImplementationOnce(async () => {
      throw new Error('boom');
    });
    const r = await c.service.runDaily(SYSTEM, NOW);
    expect(r.counts).toMatchObject({ tenants: 2, tenantErrors: 1 });
    expect(c.automation.openRemediation).toHaveBeenCalledWith(
      expect.anything(),
      T2,
      NOW,
    );
    expect(loggerStub.error).toHaveBeenCalled();
  });

  it('purga la estadística de uso de más de 400 días y NO toca access_decision_log (WORM)', async () => {
    const c = build();
    const r = await c.service.runDaily(SYSTEM, NOW);
    expect(c.usage.purgeBefore).toHaveBeenCalledWith(
      expect.anything(),
      new Date(NOW.getTime() - 400 * DAY),
    );
    expect(r.counts.usageRowsPurged).toBe(7);
  });

  it('refresca last_active_at con el último PERMIT o inicio de sesión (solo si es más reciente)', async () => {
    const world = worldOf([
      engagement({
        engagementId: 'e1',
        subjectUserId: ids.ana,
        grants: [grant({ grantId: 'g', actions: ['agenda.appointment.view'] })],
      }),
    ]);
    const c = build({ world });
    const assignment: any = {
      id: 'e1',
      lastActiveAt: new Date(NOW.getTime() - 10 * DAY),
    };
    c.em.find = mockFn().mockResolvedValue([assignment]);
    c.queries.lastPermitByUser.mockResolvedValue(
      new Map([[ids.ana, new Date(NOW.getTime() - DAY)]]),
    );
    const r = await c.service.runDaily(SYSTEM, NOW);
    expect(assignment.lastActiveAt).toEqual(new Date(NOW.getTime() - DAY));
    expect(r.counts.lastActiveRefreshed).toBe(1);
  });

  it('con autoSuspendInactiveDays DELEGA en EngagementSuspensionService.suspendSystem (pendientes 13 y 23): un solo camino de suspensión', async () => {
    const world = worldOf([
      engagement({
        engagementId: 'e1',
        subjectUserId: ids.ana,
        createdAt: new Date(NOW.getTime() - 200 * DAY),
        grants: [grant({ grantId: 'g', actions: ['agenda.appointment.view'] })],
      }),
    ]);
    const c = build({ world, settings: { autoSuspendInactiveDays: 90 } });
    const assignment: any = { id: 'e1', tenantMembershipId: 'mem-1' };
    c.em.find = mockFn().mockResolvedValue([assignment]);
    const r = await c.service.runDaily(SYSTEM, NOW);
    expect(r.counts.inactiveSuspended).toBe(1);
    expect(c.suspension.suspendSystem).toHaveBeenCalledTimes(1);
    expect(c.suspension.suspendSystem).toHaveBeenCalledWith(
      expect.anything(),
      ids.tenant,
      'e1',
      'INACTIVITY',
      NOW,
    );
    // El barrido ya no toca el vínculo por su cuenta: lo hace el servicio.
    expect(assignment.suspendedAt).toBeUndefined();
    expect(assignment.suspensionReasonConceptId).toBeUndefined();
  });

  it('si otro camino ya suspendió al vínculo, el barrido lo salta sin fallar ni contarlo', async () => {
    const world = worldOf([
      engagement({
        engagementId: 'e1',
        subjectUserId: ids.ana,
        createdAt: new Date(NOW.getTime() - 200 * DAY),
        grants: [grant({ grantId: 'g', actions: ['agenda.appointment.view'] })],
      }),
    ]);
    const c = build({ world, settings: { autoSuspendInactiveDays: 90 } });
    c.em.find = mockFn().mockResolvedValue([{ id: 'e1' }]);
    c.suspension.suspendSystem.mockRejectedValue(
      Object.assign(new Error('ya suspendida'), {
        reason: 'ENGAGEMENT_ALREADY_SUSPENDED',
      }),
    );
    const r = await c.service.runDaily(SYSTEM, NOW);
    expect(r.counts.inactiveSuspended).toBe(0);
  });

  it('sin autoSuspendInactiveDays (por defecto) nunca suspende', async () => {
    const world = worldOf([
      engagement({
        engagementId: 'e1',
        subjectUserId: ids.ana,
        createdAt: new Date(NOW.getTime() - 400 * DAY),
        grants: [grant({ grantId: 'g', actions: ['agenda.appointment.view'] })],
      }),
    ]);
    const c = build({ world });
    const r = await c.service.runDaily(SYSTEM, NOW);
    expect(r.counts.inactiveSuspended).toBe(0);
  });
});

describe('GovernanceSweepService.runAnomalyScan', () => {
  it('recorre las organizaciones y suma lo detectado', async () => {
    const c = build({ tenants: [ids.tenant, T2] });
    const r = await c.service.runAnomalyScan(NOW);
    expect(c.anomalies.scan).toHaveBeenCalledTimes(2);
    expect(r.counts).toMatchObject({
      tenants: 2,
      anomaliesCreated: 4,
      tenantErrors: 0,
    });
  });

  it('un fallo en una organización no detiene el barrido', async () => {
    const c = build({ tenants: [ids.tenant, T2] });
    c.anomalies.scan.mockImplementationOnce(async () => {
      throw new Error('boom');
    });
    const r = await c.service.runAnomalyScan(NOW);
    expect(r.counts).toMatchObject({ anomaliesCreated: 2, tenantErrors: 1 });
  });
});
