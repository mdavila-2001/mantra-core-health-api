import { AccessReviewCampaignsService } from './access-review-campaigns.service';
import { AccessReviewClosureService } from './access-review-closure.service';
import { AccessReviewItemFactory } from './access-review-item.factory';
import { GovernanceAccessService } from './governance-access.service';
import { ReviewerResolverService } from './reviewer-resolver.service';
import { AccessReviewRepository } from '../repositories';
import { DELEG } from '../delegated_access.concepts';
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
  staff,
  worldOf,
} from './governance-world.testing';

/** Hospital piloto reducido: Sofía (jefa de Ecografía) y Marcos (Ecografía). */
function pilotWorld() {
  const sofiaGrant = grant({
    grantId: 'g-sofia',
    actions: ['team.grants.assign', 'agenda.appointment.view'],
    grantedByUserId: ids.admin2,
  });
  const marcosGrant = grant({
    grantId: 'g-marcos',
    actions: ['agenda.appointment.cancel'],
    grantedByUserId: ids.admin,
  });
  return worldOf([
    engagement({
      engagementId: 'e-sofia',
      subjectUserId: ids.sofia,
      templateCode: 'ORG_MANAGEMENT',
      grants: [sofiaGrant],
    }),
    engagement({
      engagementId: 'e-marcos',
      subjectUserId: ids.marcos,
      templateCode: 'CALL_CENTER',
      grants: [marcosGrant],
    }),
  ]);
}

function build(world = pilotWorld()) {
  const em = fakeEm();
  const campaigns: any[] = [];
  const items: any[] = [];
  const repo = new AccessReviewRepository();
  repo.findCampaignById = mockFn(
    async (_em: any, _t: string, id: string) =>
      campaigns.find((c) => c.id === id) ?? null,
  );
  repo.findCampaigns = mockFn(async () => campaigns);
  repo.createCampaign = mockFn((_em: any, data: any) => {
    const row = {
      id: `c-${campaigns.length + 1}`,
      tenantId: data.tenantId,
      name: data.name,
      kindConceptId: data.kindConceptId,
      scopeJson: data.scope,
      scopeSchemaVersion: data.scopeSchemaVersion,
      filtersJson: data.filters,
      dueAt: data.dueAt,
      graceDays: data.graceDays ?? 7,
      reminderDaysBeforeJson: data.reminderDaysBefore ?? [7, 3, 1],
      escalateAfterDays: data.escalateAfterDays ?? 3,
      uncertifiedActionConceptId: data.uncertifiedActionConceptId,
      ownerUserId: data.ownerUserId,
      statusConceptId: DELEG.REVIEW_CAMPAIGN_DRAFT,
    };
    campaigns.push(row);
    return row;
  });
  repo.createItems = mockFn((_em: any, data: any[]) =>
    data.map((d) => {
      const row = {
        id: `i-${items.length + 1}`,
        tenantId: d.tenantId,
        accessReviewCampaignId: d.campaignId,
        organizationUserAssignmentId: d.organizationUserAssignmentId,
        supportScopeGrantId: d.supportScopeGrantId,
        reviewerUserId: d.reviewerUserId,
        reviewerKindConceptId: d.reviewerKindConceptId,
        decisionConceptId: DELEG.REVIEW_ITEM_PENDING,
        evidenceJson: d.evidence,
        evidenceHash: d.evidenceHash,
        dueAt: d.dueAt,
        reminderCount: 0,
      };
      items.push(row);
      return row;
    }),
  );
  repo.findItemsByCampaign = mockFn(async (_em: any, id: string) =>
    items.filter((i) => i.accessReviewCampaignId === id),
  );
  const grantRows = new Map<string, any>();
  for (const e of world.engagements)
    for (const g of e.grants)
      grantRows.set(g.grantId, {
        id: g.grantId,
        statusConceptId: DELEG.SUPPORT_GRANT_ACTIVE,
        organizationUserAssignmentId: e.engagementId,
        tenantId: world.tenantId,
      });
  const grants = {
    findById: mockFn(async (_em: any, id: string) => grantRows.get(id) ?? null),
  };
  const loader = { load: mockFn().mockResolvedValue(world) };
  const queries: any = {
    securityAdminUserIds: mockFn().mockResolvedValue([ids.admin, ids.admin2]),
    usageByGrant: mockFn().mockResolvedValue([
      {
        grantId: 'g-marcos',
        permissionCode: 'agenda.appointment.cancel',
        permit: 12,
        deny: 1,
        lastUsedAt: new Date(NOW.getTime() - 2 * DAY),
      },
    ]),
  };
  const anomalies = { findByTenant: mockFn().mockResolvedValue([]) };
  const events = { publish: mockFn().mockResolvedValue(undefined) };
  const effective = { refreshTenant: mockFn().mockResolvedValue({ rows: 0 }) };
  const scope = { resolveTenant: mockFn().mockReturnValue(ids.tenant) };
  const activity = { userNames: mockFn().mockResolvedValue(new Map()) };
  const resolver = new ReviewerResolverService(queries);
  const accessSvc = new GovernanceAccessService(loader as any);
  const factory = new AccessReviewItemFactory(
    repo,
    queries,
    anomalies as any,
    events as any,
    loggerStub as any,
  );
  const closure = new AccessReviewClosureService(
    repo,
    grants as any,
    loader as any,
    resolver,
    events as any,
    { seal: mockFn().mockResolvedValue(undefined) } as any,
    effective as any,
    loggerStub as any,
  );
  const service = new AccessReviewCampaignsService(
    em,
    repo,
    loader as any,
    resolver,
    accessSvc,
    factory,
    closure,
    scope as any,
    activity as any,
    loggerStub as any,
  );
  return {
    service,
    em,
    repo,
    campaigns,
    items,
    grantRows,
    events,
    effective,
    queries,
    loader,
  };
}

const due = new Date(NOW.getTime() + 30 * DAY).toISOString();
const serviceScope = { kind: 'SERVICE', healthcareServiceIds: [ids.svcEco] };

describe('AccessReviewCampaignsService.preview (K-01)', () => {
  it('ALTA: un ítem, la concesión de Sofía, revisor ADMIN (ella es el sujeto)', async () => {
    const { service } = build();
    const r = await service.preview(
      {
        name: 'Ecografía ALTA',
        kind: 'PERIODIC',
        scope: serviceScope,
        filters: { minSensitivity: 'ALTA' },
        dueAt: due,
      } as any,
      securityAdmin(),
    );
    expect(r.total).toBe(1);
    expect(r.items[0]).toMatchObject({
      grantId: 'g-sofia',
      reviewerKind: 'ADMIN',
    });
    expect(r.items[0].reviewerUserIds).toEqual([ids.admin]);
  });

  it('MEDIA: dos ítems; Marcos-Ecografía lo revisa Sofía como jefa de servicio', async () => {
    const { service } = build();
    const r = await service.preview(
      {
        name: 'Ecografía MEDIA',
        kind: 'PERIODIC',
        scope: serviceScope,
        filters: { minSensitivity: 'MEDIA' },
        dueAt: due,
      } as any,
      securityAdmin(),
    );
    expect(r.total).toBe(2);
    const marcos = r.items.find((i) => i.grantId === 'g-marcos')!;
    expect(marcos.reviewerKind).toBe('SERVICE_HEAD');
    expect(marcos.reviewerUserIds).toEqual([ids.sofia]);
    expect(r.byReviewerKind).toMatchObject({ ADMIN: 1, SERVICE_HEAD: 1 });
  });

  it('un alcance sin objetivos es 422 REVIEW_SCOPE_EMPTY', async () => {
    const { service } = build();
    await expect(
      service.preview(
        {
          name: 'Vacía',
          kind: 'PERIODIC',
          scope: { kind: 'SERVICE' },
          dueAt: due,
        } as any,
        securityAdmin(),
      ),
    ).rejects.toMatchObject({ reason: Reason.REVIEW_SCOPE_EMPTY });
  });

  it('un administrador delegado sin team.campaigns.manage recibe 403 ADMIN_CEILING_EXCEEDED', async () => {
    const { service } = build();
    await expect(
      service.preview(
        { name: 'X', kind: 'PERIODIC', scope: serviceScope, dueAt: due } as any,
        { id: ids.marcos, roles: ['SUPPORT_STAFF'] } as any,
      ),
    ).rejects.toMatchObject({ reason: Reason.ADMIN_CEILING_EXCEEDED });
  });
});

describe('AccessReviewCampaignsService.create y launch', () => {
  const dto = {
    name: 'Certificación Q4-2026',
    kind: 'PERIODIC',
    scope: serviceScope,
    dueAt: due,
  } as any;

  it('crea el borrador del tenant del contexto, con la acción por defecto REVOKE', async () => {
    const { service, campaigns } = build();
    const r = await service.create(dto, securityAdmin());
    expect(r.id).toBe('c-1');
    expect(campaigns[0]).toMatchObject({
      tenantId: ids.tenant,
      ownerUserId: ids.admin,
      uncertifiedActionConceptId: DELEG.UNCERTIFIED_REVOKE,
    });
  });

  it('las campañas de cambio de rol (MOVER) solo escalan por defecto (D-09)', async () => {
    const { service, campaigns } = build();
    await service.create(
      { ...dto, kind: 'MOVER', name: 'Cambio' },
      securityAdmin(),
    );
    expect(campaigns[0].uncertifiedActionConceptId).toBe(
      DELEG.UNCERTIFIED_ESCALATE,
    );
  });

  it('409 REVIEW_CAMPAIGN_DUPLICATE con el mismo nombre en borrador o abierta', async () => {
    const { service } = build();
    await service.create(dto, securityAdmin());
    await expect(service.create(dto, securityAdmin())).rejects.toMatchObject({
      reason: Reason.REVIEW_CAMPAIGN_DUPLICATE,
    });
  });

  it('al lanzar: ítems con evidencia (uso de 90 días) y evidence_hash de 64 hex; campaña abierta; evento', async () => {
    const { service, campaigns, items, events } = build();
    await service.create(
      { ...dto, filters: { minSensitivity: 'MEDIA' } },
      securityAdmin(),
    );
    const r = await service.launch('c-1', securityAdmin());
    expect(r).toMatchObject({ ok: true, items: 2 });
    expect(campaigns[0].statusConceptId).toBe(DELEG.REVIEW_CAMPAIGN_OPEN);
    expect(campaigns[0].launchedAt).toBeInstanceOf(Date);
    const marcos = items.find((i) => i.supportScopeGrantId === 'g-marcos');
    expect(marcos.evidenceHash).toMatch(/^[0-9a-f]{64}$/);
    expect(marcos.evidenceJson.usage90d).toEqual([
      expect.objectContaining({
        atom: 'agenda.appointment.cancel',
        permit: 12,
      }),
    ]);
    expect(marcos.reviewerUserId).toBe(ids.sofia);
    expect(marcos.reviewerKindConceptId).toBe(DELEG.REVIEWER_KIND_SERVICE_HEAD);
    // El enrutamiento viaja aparte del hash.
    expect(marcos.evidenceJson._routing.reviewerUserIds).toEqual([ids.sofia]);
    expect(events.publish).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        type: 'delegated_access.access_review.campaign_launched',
        aggregateId: 'c-1',
      }),
    );
  });

  it('lanzar una campaña que no está en borrador es 409 REVIEW_CAMPAIGN_NOT_DRAFT', async () => {
    const { service } = build();
    await service.create(dto, securityAdmin());
    await service.launch('c-1', securityAdmin());
    await expect(service.launch('c-1', securityAdmin())).rejects.toMatchObject({
      reason: Reason.REVIEW_CAMPAIGN_NOT_DRAFT,
    });
  });

  it('una campaña ajena o inexistente es 404 REVIEW_CAMPAIGN_NOT_FOUND', async () => {
    const { service } = build();
    await expect(
      service.launch('no-existe', securityAdmin()),
    ).rejects.toMatchObject({
      reason: Reason.REVIEW_CAMPAIGN_NOT_FOUND,
    });
  });
});

describe('AccessReviewCampaignsService.closeCampaign (K-03, D-09)', () => {
  /** Campaña abierta del piloto, vencida el 2026-10-30, con 3 ítems ya escalados. */
  function openCampaign() {
    const grantsOf = ['g-a', 'g-b', 'g-c'];
    const world = worldOf(
      grantsOf.map((g, i) =>
        engagement({
          engagementId: `e-${i}`,
          subjectUserId: `u-${i}`,
          supervisorUserId: `owner-${i}`,
          grants: [
            grant({ grantId: g, actions: ['agenda.appointment.cancel'] }),
          ],
        }),
      ),
    );
    const ctx = build(world);
    ctx.campaigns.push({
      id: 'c-q4',
      tenantId: ids.tenant,
      name: 'Certificación Q4-2026',
      kindConceptId: DELEG.REVIEW_KIND_PERIODIC,
      scopeJson: { kind: 'ORGANIZATION' },
      dueAt: new Date('2026-10-30T14:30:00Z'),
      graceDays: 7,
      escalateAfterDays: 3,
      reminderDaysBeforeJson: [7, 3, 1],
      uncertifiedActionConceptId: DELEG.UNCERTIFIED_REVOKE,
      statusConceptId: DELEG.REVIEW_CAMPAIGN_OPEN,
      launchedAt: new Date('2026-10-01T14:30:00Z'),
    });
    grantsOf.forEach((g, i) =>
      ctx.items.push({
        id: `it-${i}`,
        tenantId: ids.tenant,
        accessReviewCampaignId: 'c-q4',
        organizationUserAssignmentId: `e-${i}`,
        supportScopeGrantId: g,
        reviewerKindConceptId: DELEG.REVIEWER_KIND_ADMIN,
        decisionConceptId: DELEG.REVIEW_ITEM_PENDING,
        dueAt: new Date('2026-10-30T14:30:00Z'),
        escalatedAt: new Date('2026-11-02T14:30:00Z'),
      }),
    );
    return ctx;
  }

  it('a due + 7 días revoca lo no certificado: concesiones REVOKED, vínculos intactos, eventos y campaña CLOSED', async () => {
    const ctx = openCampaign();
    const now = new Date('2026-11-06T14:30:00Z');
    const r = await ctx.service.closeCampaign(ctx.em, ctx.campaigns[0], now, {
      manual: false,
    });
    expect(r).toMatchObject({ closed: true, autoRevoked: 3, skipped: 0 });
    for (const row of ctx.items) {
      expect(row.decisionConceptId).toBe(DELEG.REVIEW_ITEM_AUTO_REVOKED);
      expect(row.decisionCommentText).toBe(
        'No certificada en la campaña Certificación Q4-2026',
      );
      expect(row.decidedAt).toEqual(now);
      expect(row.decidedByUserId).toBeUndefined();
    }
    for (const g of ['g-a', 'g-b', 'g-c']) {
      expect(ctx.grantRows.get(g).statusConceptId).toBe(
        DELEG.SUPPORT_GRANT_REVOKED,
      );
      expect(ctx.grantRows.get(g).validTo).toEqual(now);
    }
    expect(ctx.campaigns[0].statusConceptId).toBe(DELEG.REVIEW_CAMPAIGN_CLOSED);
    expect(ctx.campaigns[0].closedAt).toEqual(now);
    const types = ctx.events.publish.mock.calls.map((c: any[]) => c[1].type);
    expect(
      types.filter(
        (t: string) => t === 'delegated_access.access_review.auto_revoked',
      ),
    ).toHaveLength(3);
    expect(types).toContain('delegated_access.access_review.campaign_closed');
    const first = ctx.events.publish.mock.calls.find(
      (c: any[]) => c[1].type === 'delegated_access.access_review.auto_revoked',
    )[1];
    // Se avisa a la persona y a su dueño (solo identificadores).
    expect(first.payload.notifyUserIds).toEqual(
      expect.arrayContaining(['u-0', 'owner-0']),
    );
    expect(ctx.effective.refreshTenant).toHaveBeenCalled();
  });

  it('antes de los días de gracia no cierra ni revoca nada', async () => {
    const ctx = openCampaign();
    const r = await ctx.service.closeCampaign(
      ctx.em,
      ctx.campaigns[0],
      new Date('2026-11-05T14:30:00Z'),
      { manual: false },
    );
    expect(r.closed).toBe(false);
    expect(ctx.grantRows.get('g-a').statusConceptId).toBe(
      DELEG.SUPPORT_GRANT_ACTIVE,
    );
    expect(ctx.campaigns[0].statusConceptId).toBe(DELEG.REVIEW_CAMPAIGN_OPEN);
  });

  it('con UNCERTIFIED_ESCALATE el barrido no cierra sola: solo a mano, sin cambiar nada', async () => {
    const ctx = openCampaign();
    ctx.campaigns[0].uncertifiedActionConceptId = DELEG.UNCERTIFIED_ESCALATE;
    const auto = await ctx.service.closeCampaign(
      ctx.em,
      ctx.campaigns[0],
      new Date('2026-12-01T00:00:00Z'),
      { manual: false },
    );
    expect(auto.closed).toBe(false);
    const manual = await ctx.service.closeCampaign(
      ctx.em,
      ctx.campaigns[0],
      new Date('2026-12-01T00:00:00Z'),
      { manual: true },
    );
    expect(manual).toMatchObject({ closed: true, autoRevoked: 0 });
    expect(ctx.grantRows.get('g-a').statusConceptId).toBe(
      DELEG.SUPPORT_GRANT_ACTIVE,
    );
  });

  it('un ítem de un vínculo ya terminado se omite (SKIPPED) y su concesión no se toca', async () => {
    const ctx = openCampaign();
    ctx.loader.load.mockResolvedValue(
      worldOf([
        engagement({
          engagementId: 'e-0',
          subjectUserId: 'u-0',
          state: 'ENDED',
          grants: [
            grant({ grantId: 'g-a', actions: ['agenda.appointment.cancel'] }),
          ],
        }),
        engagement({
          engagementId: 'e-1',
          subjectUserId: 'u-1',
          grants: [
            grant({ grantId: 'g-b', actions: ['agenda.appointment.cancel'] }),
          ],
        }),
        engagement({
          engagementId: 'e-2',
          subjectUserId: 'u-2',
          grants: [
            grant({ grantId: 'g-c', actions: ['agenda.appointment.cancel'] }),
          ],
        }),
      ]),
    );
    const r = await ctx.service.closeCampaign(
      ctx.em,
      ctx.campaigns[0],
      new Date('2026-11-06T14:30:00Z'),
      { manual: false },
    );
    expect(r).toMatchObject({ autoRevoked: 2, skipped: 1 });
    expect(ctx.items[0].decisionConceptId).toBe(DELEG.REVIEW_ITEM_SKIPPED);
  });
});

describe('AccessReviewCampaignsService.cancel y results', () => {
  it('cancelar no revoca nada: los pendientes se omiten', async () => {
    const ctx = build();
    await ctx.service.create(
      { name: 'C', kind: 'PERIODIC', scope: serviceScope, dueAt: due } as any,
      securityAdmin(),
    );
    await ctx.service.launch('c-1', securityAdmin());
    await ctx.service.cancel('c-1', {}, securityAdmin());
    expect(ctx.campaigns[0].statusConceptId).toBe(
      DELEG.REVIEW_CAMPAIGN_CANCELLED,
    );
    expect(
      ctx.items.every((i) => i.decisionConceptId === DELEG.REVIEW_ITEM_SKIPPED),
    ).toBe(true);
    for (const row of ctx.grantRows.values())
      expect(row.statusConceptId).toBe(DELEG.SUPPORT_GRANT_ACTIVE);
  });

  it('results: conteos por decisión, revisor y sensibilidad y cobertura', async () => {
    const ctx = build();
    await ctx.service.create(
      { name: 'R', kind: 'PERIODIC', scope: serviceScope, dueAt: due } as any,
      securityAdmin(),
    );
    await ctx.service.launch('c-1', securityAdmin());
    ctx.items[0].decisionConceptId = DELEG.REVIEW_ITEM_CERTIFIED;
    ctx.items[0].decidedAt = new Date(NOW.getTime() + 3_600_000);
    const r = await ctx.service.results('c-1', securityAdmin());
    expect(r.total).toBe(2);
    expect(r.byDecision.CERTIFIED).toBe(1);
    expect(r.pending).toBe(1);
    expect(r.coveragePercent).toBe(50);
  });
});

describe('B-A1: un administrador delegado con team.campaigns.manage solo gobierna SUS campañas', () => {
  /** Sofía (Ecografía) administra campañas; Marcos es de Ecografía, Mario de Cardiología. */
  function delegateWorld() {
    return worldOf([
      engagement({
        engagementId: 'e-sofia',
        subjectUserId: ids.sofia,
        templateCode: 'ORG_MANAGEMENT',
        grants: [
          grant({
            grantId: 'g-sofia',
            actions: ['team.campaigns.manage', 'agenda.appointment.view'],
          }),
        ],
      }),
      engagement({
        engagementId: 'e-marcos',
        subjectUserId: ids.marcos,
        templateCode: 'CALL_CENTER',
        grants: [
          grant({
            grantId: 'g-marcos',
            actions: ['agenda.appointment.cancel'],
          }),
        ],
      }),
      engagement({
        engagementId: 'e-mario',
        subjectUserId: ids.mario,
        templateCode: 'CALL_CENTER',
        grants: [
          grant({
            grantId: 'g-mario',
            healthcareServiceId: ids.svcCardio,
            actions: ['agenda.appointment.cancel'],
          }),
        ],
      }),
    ]);
  }

  /** Campaña ABIERTA de la organización que lanzó el administrador de seguridad. */
  function withAdminCampaign() {
    const ctx = build(delegateWorld());
    ctx.campaigns.push({
      id: 'c-admin',
      tenantId: ids.tenant,
      name: 'Certificación de toda la organización',
      kindConceptId: DELEG.REVIEW_KIND_PERIODIC,
      scopeJson: { kind: 'ORGANIZATION' },
      dueAt: new Date(Date.now() - 30 * DAY),
      graceDays: 7,
      escalateAfterDays: 3,
      reminderDaysBeforeJson: [7, 3, 1],
      uncertifiedActionConceptId: DELEG.UNCERTIFIED_REVOKE,
      statusConceptId: DELEG.REVIEW_CAMPAIGN_OPEN,
      launchedAt: new Date(Date.now() - 60 * DAY),
      ownerUserId: ids.admin,
    });
    ctx.items.push({
      id: 'it-m',
      tenantId: ids.tenant,
      accessReviewCampaignId: 'c-admin',
      organizationUserAssignmentId: 'e-marcos',
      supportScopeGrantId: 'g-marcos',
      reviewerKindConceptId: DELEG.REVIEWER_KIND_ADMIN,
      decisionConceptId: DELEG.REVIEW_ITEM_PENDING,
      dueAt: new Date(Date.now() - 30 * DAY),
    });
    return ctx;
  }

  const sofia = staff(ids.sofia);
  const notFound = { reason: Reason.REVIEW_CAMPAIGN_NOT_FOUND };

  it('cerrar, cancelar, ver, ver resultados, editar, lanzar y listar ítems de una campaña ajena responden 404 y no tocan nada', async () => {
    const ctx = withAdminCampaign();
    await expect(ctx.service.close('c-admin', sofia)).rejects.toMatchObject(
      notFound,
    );
    await expect(
      ctx.service.cancel('c-admin', {}, sofia),
    ).rejects.toMatchObject(notFound);
    await expect(ctx.service.get('c-admin', sofia)).rejects.toMatchObject(
      notFound,
    );
    await expect(ctx.service.results('c-admin', sofia)).rejects.toMatchObject(
      notFound,
    );
    await expect(ctx.service.items('c-admin', sofia)).rejects.toMatchObject(
      notFound,
    );
    await expect(
      ctx.service.update('c-admin', { name: 'Otro' } as any, sofia),
    ).rejects.toMatchObject(notFound);
    await expect(ctx.service.launch('c-admin', sofia)).rejects.toMatchObject(
      notFound,
    );
    expect(ctx.campaigns[0].statusConceptId).toBe(DELEG.REVIEW_CAMPAIGN_OPEN);
    expect(ctx.grantRows.get('g-marcos').statusConceptId).toBe(
      DELEG.SUPPORT_GRANT_ACTIVE,
    );
    expect(ctx.items[0].decisionConceptId).toBe(DELEG.REVIEW_ITEM_PENDING);
  });

  it('list solo trae las suyas; el administrador de seguridad las ve todas', async () => {
    const ctx = withAdminCampaign();
    ctx.campaigns.push({
      ...ctx.campaigns[0],
      id: 'c-sofia',
      name: 'Mi equipo',
      ownerUserId: ids.sofia,
    });
    const mine = await ctx.service.list(sofia);
    expect(mine.items.map((c) => c.id)).toEqual(['c-sofia']);
    const all = await ctx.service.list(securityAdmin());
    expect(all.items.map((c) => c.id).sort()).toEqual(['c-admin', 'c-sofia']);
  });

  it('el administrador de seguridad sí cierra la campaña de toda la organización', async () => {
    const ctx = withAdminCampaign();
    const out = await ctx.service.close('c-admin', securityAdmin());
    expect(out.ok).toBe(true);
    expect(ctx.campaigns[0].statusConceptId).toBe(DELEG.REVIEW_CAMPAIGN_CLOSED);
  });

  it('su propia campaña no se cierra a mano antes de la fecha y la gracia (no se adelanta a los revisores)', async () => {
    const ctx = withAdminCampaign();
    ctx.campaigns[0].ownerUserId = ids.sofia;
    ctx.campaigns[0].dueAt = new Date(Date.now() + 10 * DAY);
    await expect(ctx.service.close('c-admin', sofia)).rejects.toMatchObject({
      reason: Reason.REVIEW_CAMPAIGN_NOT_DUE,
    });
    expect(ctx.campaigns[0].statusConceptId).toBe(DELEG.REVIEW_CAMPAIGN_OPEN);
    // Vencida y pasada la gracia ya puede cerrarla.
    ctx.campaigns[0].dueAt = new Date(Date.now() - 30 * DAY);
    const out = await ctx.service.close('c-admin', sofia);
    expect(out.ok).toBe(true);
  });

  it('un delegado no lanza una campaña que vence en minutos: mínimo de 7 días para la fecha y 3 de gracia', async () => {
    const ctx = build(delegateWorld());
    const base = {
      name: 'Rápida',
      kind: 'PERIODIC',
      scope: serviceScope,
    } as any;
    const soon = new Date(Date.now() + 2 * DAY).toISOString();
    await expect(
      ctx.service.create({ ...base, dueAt: soon }, sofia),
    ).rejects.toMatchObject({ reason: Reason.REVIEW_SCHEDULE_TOO_SHORT });
    await expect(
      ctx.service.create({ ...base, dueAt: due, graceDays: 0 }, sofia),
    ).rejects.toMatchObject({ reason: Reason.REVIEW_SCHEDULE_TOO_SHORT });
    const ok = await ctx.service.create({ ...base, dueAt: due }, sofia);
    expect(ok.id).toBe('c-1');
    // El administrador de seguridad conserva su libertad.
    const admin = build(delegateWorld());
    await admin.service.create(
      { ...base, dueAt: soon, graceDays: 0 },
      securityAdmin(),
    );
    expect(admin.campaigns).toHaveLength(1);
  });
});

describe('N-9: un delegado sin team.grants.revoke no obtiene revocación por vencimiento', () => {
  /** Sofía administra campañas; con `withRevoke` también puede quitar permisos. */
  function world(withRevoke: boolean) {
    return worldOf([
      engagement({
        engagementId: 'e-sofia',
        subjectUserId: ids.sofia,
        templateCode: 'ORG_MANAGEMENT',
        grants: [
          grant({
            grantId: 'g-sofia',
            actions: [
              'team.campaigns.manage',
              ...(withRevoke ? ['team.grants.revoke'] : []),
              'agenda.appointment.view',
            ],
          }),
        ],
      }),
      engagement({
        engagementId: 'e-marcos',
        subjectUserId: ids.marcos,
        templateCode: 'CALL_CENTER',
        grants: [
          grant({
            grantId: 'g-marcos',
            actions: ['agenda.appointment.cancel'],
          }),
        ],
      }),
    ]);
  }
  const sofia = staff(ids.sofia);
  const base = {
    name: 'Mi equipo',
    kind: 'PERIODIC',
    scope: serviceScope,
    dueAt: new Date(NOW.getTime() + 30 * DAY).toISOString(),
  } as any;

  it('sin team.grants.revoke lo que no se indica queda en ESCALATE (no se revoca a nombre del delegado)', async () => {
    const ctx = build(world(false));
    await ctx.service.create(base, sofia);
    expect(ctx.campaigns[0].uncertifiedActionConceptId).toBe(
      DELEG.UNCERTIFIED_ESCALATE,
    );
  });

  it('sin team.grants.revoke pedir UNCERTIFIED_REVOKE es 403 ADMIN_CEILING_EXCEEDED y no se crea nada', async () => {
    const ctx = build(world(false));
    await expect(
      ctx.service.create(
        { ...base, uncertifiedAction: 'UNCERTIFIED_REVOKE' },
        sofia,
      ),
    ).rejects.toMatchObject({ reason: Reason.ADMIN_CEILING_EXCEEDED });
    expect(ctx.campaigns).toHaveLength(0);
  });

  it('sin team.grants.revoke, editar un borrador para que revoque también se rechaza', async () => {
    const ctx = build(world(false));
    await ctx.service.create(base, sofia);
    await expect(
      ctx.service.update(
        'c-1',
        { uncertifiedAction: 'UNCERTIFIED_REVOKE' } as any,
        sofia,
      ),
    ).rejects.toMatchObject({ reason: Reason.ADMIN_CEILING_EXCEEDED });
    expect(ctx.campaigns[0].uncertifiedActionConceptId).toBe(
      DELEG.UNCERTIFIED_ESCALATE,
    );
  });

  it('un borrador que ya quedó en REVOKE (de cuando tenía el átomo) no se lanza si lo perdió', async () => {
    const ctx = build(world(false));
    await ctx.service.create(base, sofia);
    ctx.campaigns[0].uncertifiedActionConceptId = DELEG.UNCERTIFIED_REVOKE;
    await expect(ctx.service.launch('c-1', sofia)).rejects.toMatchObject({
      reason: Reason.ADMIN_CEILING_EXCEEDED,
    });
    expect(ctx.campaigns[0].statusConceptId).toBe(DELEG.REVIEW_CAMPAIGN_DRAFT);
  });

  it('con team.grants.revoke el delegado conserva la revocación por vencimiento (por defecto y explícita)', async () => {
    const ctx = build(world(true));
    await ctx.service.create(base, sofia);
    await ctx.service.create(
      { ...base, name: 'Otra', uncertifiedAction: 'UNCERTIFIED_REVOKE' },
      sofia,
    );
    expect(ctx.campaigns.map((c) => c.uncertifiedActionConceptId)).toEqual([
      DELEG.UNCERTIFIED_REVOKE,
      DELEG.UNCERTIFIED_REVOKE,
    ]);
  });

  it('el administrador de seguridad no cambia: REVOKE por defecto', async () => {
    const ctx = build(world(false));
    await ctx.service.create(base, securityAdmin());
    expect(ctx.campaigns[0].uncertifiedActionConceptId).toBe(
      DELEG.UNCERTIFIED_REVOKE,
    );
  });
});
