import { AccessReviewAutomationService } from './access-review-automation.service';
import { AccessReviewItemFactory } from './access-review-item.factory';
import { ReviewerResolverService } from './reviewer-resolver.service';
import { AccessReviewRepository } from '../repositories';
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
  reviewRepoFake,
  worldOf,
} from './governance-world.testing';

const SYSTEM: any = { id: 'sys', roles: ['SYSTEM'] };

function build(world: any, opts: { settings?: any } = {}) {
  const em = fakeEm();
  const { repo, campaigns, items } = reviewRepoFake(
    AccessReviewRepository as any,
    {
      draft: DELEG.REVIEW_CAMPAIGN_DRAFT,
      open: DELEG.REVIEW_CAMPAIGN_OPEN,
      pending: DELEG.REVIEW_ITEM_PENDING,
    },
  );
  const loader = {
    load: mockFn(async (_e: any, _t: string, _n: Date, only?: string[]) => ({
      ...world,
      engagements: world.engagements.filter(
        (e: any) => !only || only.includes(e.engagementId),
      ),
    })),
  };
  const queries: any = {
    securityAdminUserIds: mockFn().mockResolvedValue([ids.admin, ids.admin2]),
    usageByGrant: mockFn().mockResolvedValue([]),
  };
  const events = { publish: mockFn().mockResolvedValue(undefined) };
  const audit = { seal: mockFn().mockResolvedValue(undefined) };
  const factory = new AccessReviewItemFactory(
    repo,
    queries,
    { findByTenant: mockFn().mockResolvedValue([]) } as any,
    events as any,
    loggerStub as any,
  );
  const sod = {
    markExpired: mockFn((row: any) => {
      row.statusConceptId = 'expired';
    }),
  };
  const settings = {
    read: mockFn().mockResolvedValue(
      opts.settings ?? {
        unusedDays: 60,
        inactivityDays: 45,
        autoSuspendInactiveDays: null,
        reviewCadenceMonths: null,
        creepThreshold: 15,
        onboardingRequired: true,
      },
    ),
  };
  const service = new AccessReviewAutomationService(
    repo,
    sod as any,
    loader as any,
    new ReviewerResolverService(queries),
    factory,
    events as any,
    audit as any,
    settings as any,
    loggerStub as any,
  );
  return { service, em, repo, campaigns, items, events, audit, sod, loader };
}

describe('openRecertificationItems (K-04)', () => {
  const ana = () =>
    engagement({
      engagementId: 'e-ana',
      subjectUserId: ids.ana,
      nextRecertificationAt: new Date('2026-11-23T14:30:00Z'),
      recertifyEveryMonths: 6,
      grants: [
        grant({ grantId: 'g-ana', actions: ['agenda.appointment.view'] }),
      ],
    });

  it('abre un ítem de vínculo en «Recertificación 2026-11» con vencimiento = next_recertification_at', async () => {
    const ctx = build(worldOf([ana()]));
    const r = await ctx.service.openRecertificationItems(
      ctx.em,
      ids.tenant,
      NOW,
      'America/La_Paz',
    );
    expect(r).toEqual({ campaigns: 1, items: 1 });
    expect(ctx.campaigns[0]).toMatchObject({
      name: 'Recertificación 2026-11',
      kindConceptId: DELEG.REVIEW_KIND_RECERTIFICATION,
      statusConceptId: DELEG.REVIEW_CAMPAIGN_OPEN,
      ownerUserId: undefined,
    });
    expect(ctx.campaigns[0].dueAt).toEqual(new Date('2026-11-23T14:30:00Z'));
    expect(ctx.items[0]).toMatchObject({
      organizationUserAssignmentId: 'e-ana',
      supportScopeGrantId: undefined,
      dueAt: new Date('2026-11-23T14:30:00Z'),
    });
    expect(ctx.items[0].evidenceHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('es idempotente: un segundo barrido no duplica el ítem ni la campaña', async () => {
    const ctx = build(worldOf([ana()]));
    await ctx.service.openRecertificationItems(
      ctx.em,
      ids.tenant,
      NOW,
      'America/La_Paz',
    );
    const again = await ctx.service.openRecertificationItems(
      ctx.em,
      ids.tenant,
      NOW,
      'America/La_Paz',
    );
    expect(again).toEqual({ campaigns: 0, items: 0 });
    expect(ctx.items).toHaveLength(1);
    expect(ctx.campaigns).toHaveLength(1);
  });

  it('un vínculo con recertificación a más de 30 días no entra todavía', async () => {
    const far = engagement({
      engagementId: 'e-far',
      subjectUserId: ids.marcos,
      nextRecertificationAt: new Date(NOW.getTime() + 45 * DAY),
      grants: [grant({ grantId: 'g', actions: ['agenda.appointment.view'] })],
    });
    const ctx = build(worldOf([far]));
    expect(
      (
        await ctx.service.openRecertificationItems(
          ctx.em,
          ids.tenant,
          NOW,
          'America/La_Paz',
        )
      ).items,
    ).toBe(0);
  });

  it('un nuevo vencimiento del mismo mes se suma a la campaña abierta y extiende su fecha', async () => {
    const ctx = build(worldOf([ana()]));
    await ctx.service.openRecertificationItems(
      ctx.em,
      ids.tenant,
      NOW,
      'America/La_Paz',
    );
    ctx.loader.load.mockImplementation(async () =>
      worldOf([
        ana(),
        engagement({
          engagementId: 'e-tarde',
          subjectUserId: ids.marcos,
          nextRecertificationAt: new Date('2026-11-28T14:30:00Z'),
          grants: [
            grant({ grantId: 'g2', actions: ['agenda.appointment.view'] }),
          ],
        }),
      ]),
    );
    const r = await ctx.service.openRecertificationItems(
      ctx.em,
      ids.tenant,
      NOW,
      'America/La_Paz',
    );
    expect(r).toEqual({ campaigns: 0, items: 1 });
    expect(ctx.campaigns).toHaveLength(1);
    expect(ctx.campaigns[0].dueAt).toEqual(new Date('2026-11-28T14:30:00Z'));
  });
});

describe('remindAndEscalate', () => {
  function openCampaign(over: Partial<any> = {}) {
    const world = worldOf([
      engagement({
        engagementId: 'e-m',
        subjectUserId: ids.marcos,
        grants: [
          grant({
            grantId: 'g-m',
            actions: ['agenda.appointment.cancel'],
            grantedByUserId: ids.admin,
          }),
        ],
      }),
    ]);
    const ctx = build(world);
    const campaign: any = {
      id: 'c-1',
      tenantId: ids.tenant,
      name: 'Q4',
      kindConceptId: DELEG.REVIEW_KIND_PERIODIC,
      ownerUserId: ids.admin,
      dueAt: new Date(NOW.getTime() + 3 * DAY),
      reminderDaysBeforeJson: [7, 3, 1],
      escalateAfterDays: 3,
      graceDays: 7,
      statusConceptId: DELEG.REVIEW_CAMPAIGN_OPEN,
      launchedAt: new Date(NOW.getTime() - 20 * DAY),
      ...over,
    };
    ctx.campaigns.push(campaign);
    ctx.items.push({
      id: 'it-1',
      tenantId: ids.tenant,
      accessReviewCampaignId: 'c-1',
      organizationUserAssignmentId: 'e-m',
      supportScopeGrantId: 'g-m',
      reviewerUserId: ids.admin2,
      reviewerKindConceptId: DELEG.REVIEWER_KIND_ADMIN,
      decisionConceptId: DELEG.REVIEW_ITEM_PENDING,
      evidenceJson: {
        _routing: { reviewerKind: 'ADMIN', reviewerUserIds: [ids.admin2] },
      },
      dueAt: campaign.dueAt,
      reminderCount: 0,
      ...(over.item ?? {}),
    });
    return { ctx, campaign };
  }

  it('a 3 días del vencimiento envía el recordatorio una sola vez (evento con identificadores)', async () => {
    const { ctx, campaign } = openCampaign();
    const first = await ctx.service.remindAndEscalate(
      ctx.em,
      campaign,
      NOW,
      SYSTEM,
    );
    expect(first.reminders).toBe(1);
    expect(ctx.items[0].reminderCount).toBe(1);
    expect(ctx.items[0].lastRemindedAt).toBeInstanceOf(Date);
    expect(ctx.events.publish).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        type: 'delegated_access.access_review.reminder_due',
        payload: expect.objectContaining({
          itemId: 'it-1',
          reviewerUserIds: [ids.admin2],
        }),
      }),
    );
    const second = await ctx.service.remindAndEscalate(
      ctx.em,
      campaign,
      NOW,
      SYSTEM,
    );
    expect(second.reminders).toBe(0);
    expect(ctx.items[0].reminderCount).toBe(1);
  });

  it('a los escalate_after_days del vencimiento escala una sola vez: nuevo revisor, ambos pueden decidir', async () => {
    const { ctx, campaign } = openCampaign({
      dueAt: new Date(NOW.getTime() - 4 * DAY),
    });
    ctx.items[0].dueAt = campaign.dueAt;
    const r = await ctx.service.remindAndEscalate(
      ctx.em,
      campaign,
      NOW,
      SYSTEM,
    );
    expect(r.escalations).toBe(1);
    const row = ctx.items[0];
    expect(row.escalatedAt).toEqual(NOW);
    expect(row.escalatedToUserId).toBeDefined();
    // El escalado nunca es quien otorgó la concesión (admin) ni la persona revisada.
    expect([ids.admin, ids.marcos]).not.toContain(row.escalatedToUserId);
    expect(row.evidenceJson._routing.reviewerUserIds).toEqual(
      expect.arrayContaining([ids.admin2, row.escalatedToUserId]),
    );
    expect(ctx.audit.seal).toHaveBeenCalledWith(
      expect.anything(),
      SYSTEM,
      ids.tenant,
      'ACCESS_REVIEW_ITEM_ESCALATED',
      'access_review_item',
      'it-1',
    );
    const again = await ctx.service.remindAndEscalate(
      ctx.em,
      campaign,
      NOW,
      SYSTEM,
    );
    expect(again.escalations).toBe(0);
  });

  it('un ítem ya decidido no recibe recordatorios ni escalamientos', async () => {
    const { ctx, campaign } = openCampaign({
      item: { decisionConceptId: DELEG.REVIEW_ITEM_CERTIFIED },
    });
    const r = await ctx.service.remindAndEscalate(
      ctx.em,
      campaign,
      NOW,
      SYSTEM,
    );
    expect(r).toEqual({ reminders: 0, escalations: 0 });
  });
});

describe('openPeriodicCampaigns (D-08)', () => {
  const world = () =>
    worldOf([
      engagement({
        engagementId: 'e1',
        subjectUserId: ids.ana,
        grants: [
          grant({ grantId: 'g1', actions: ['agenda.appointment.view'] }),
        ],
      }),
    ]);
  const cfg = (months: number | null) => ({
    unusedDays: 60,
    inactivityDays: 45,
    autoSuspendInactiveDays: null,
    reviewCadenceMonths: months,
    creepThreshold: 15,
    onboardingRequired: true,
  });

  it('sin cadencia configurada solo hay campañas manuales', async () => {
    const ctx = build(world(), { settings: cfg(null) });
    expect(
      await ctx.service.openPeriodicCampaigns(ctx.em, ids.tenant, NOW),
    ).toEqual({ created: 0 });
  });

  it('con cadencia de 6 meses y ninguna campaña previa crea y lanza la periódica del mes', async () => {
    const ctx = build(world(), { settings: cfg(6) });
    const r = await ctx.service.openPeriodicCampaigns(ctx.em, ids.tenant, NOW);
    expect(r.created).toBe(1);
    expect(ctx.campaigns[0]).toMatchObject({
      name: 'Certificación periódica 2026-11',
      kindConceptId: DELEG.REVIEW_KIND_PERIODIC,
      statusConceptId: DELEG.REVIEW_CAMPAIGN_OPEN,
      uncertifiedActionConceptId: DELEG.UNCERTIFIED_REVOKE,
    });
    expect(ctx.campaigns[0].dueAt.getTime()).toBe(NOW.getTime() + 30 * DAY);
  });

  it('si la última se lanzó hace menos de la cadencia, no crea otra', async () => {
    const ctx = build(world(), { settings: cfg(6) });
    ctx.campaigns.push({
      id: 'old',
      tenantId: ids.tenant,
      name: 'Certificación periódica 2026-09',
      kindConceptId: DELEG.REVIEW_KIND_PERIODIC,
      statusConceptId: DELEG.REVIEW_CAMPAIGN_CLOSED,
      launchedAt: new Date('2026-09-01T00:00:00Z'),
    });
    expect(
      (await ctx.service.openPeriodicCampaigns(ctx.em, ids.tenant, NOW))
        .created,
    ).toBe(0);
  });

  it('con cadencia de 12 meses las concesiones ALTA/CRÍTICA se revisan cada 6 en una campaña propia', async () => {
    const ctx = build(world(), { settings: cfg(12) });
    ctx.campaigns.push({
      id: 'org',
      tenantId: ids.tenant,
      name: 'Certificación periódica 2026-06',
      kindConceptId: DELEG.REVIEW_KIND_PERIODIC,
      statusConceptId: DELEG.REVIEW_CAMPAIGN_CLOSED,
      launchedAt: new Date('2026-06-01T00:00:00Z'),
    });
    const r = await ctx.service.openPeriodicCampaigns(ctx.em, ids.tenant, NOW);
    expect(r.created).toBe(0); // la de toda la organización va cada 12 meses; sin concesiones ALTA no hay campaña de riesgo
  });
});

describe('openRemediation', () => {
  it('abre una campaña REMEDIATION (14 días) con las concesiones sobre el techo; no repite lo ya abierto', async () => {
    const above = grant({
      grantId: 'g-top',
      actions: ['billing.receipt.void'],
      aboveCeiling: true,
    });
    const fine = grant({
      grantId: 'g-ok',
      actions: ['agenda.appointment.view'],
    });
    const ctx = build(
      worldOf([
        engagement({
          engagementId: 'e1',
          subjectUserId: ids.ana,
          grants: [above, fine],
        }),
      ]),
    );
    const r = await ctx.service.openRemediation(ctx.em, ids.tenant, NOW);
    expect(r).toEqual({ campaigns: 1, items: 1 });
    expect(ctx.campaigns[0]).toMatchObject({
      kindConceptId: DELEG.REVIEW_KIND_REMEDIATION,
      statusConceptId: DELEG.REVIEW_CAMPAIGN_OPEN,
    });
    expect(ctx.campaigns[0].dueAt.getTime()).toBe(NOW.getTime() + 14 * DAY);
    expect(ctx.items[0].supportScopeGrantId).toBe('g-top');
    const again = await ctx.service.openRemediation(ctx.em, ids.tenant, NOW);
    expect(again).toEqual({ campaigns: 0, items: 0 });
  });

  it('también marca condiciones ilegibles y concesiones a un doctor dado de baja', async () => {
    const ctx = build(
      worldOf([
        engagement({
          engagementId: 'e1',
          subjectUserId: ids.ana,
          grants: [
            grant({
              grantId: 'g-bad',
              actions: ['agenda.appointment.view'],
              unreadable: true,
            }),
            grant({
              grantId: 'g-gone',
              actions: ['agenda.appointment.view'],
              doctorGone: true,
            }),
          ],
        }),
      ]),
    );
    const r = await ctx.service.openRemediation(ctx.em, ids.tenant, NOW);
    expect(r.items).toBe(2);
  });

  it('sin hallazgos no crea nada', async () => {
    const ctx = build(
      worldOf([
        engagement({
          engagementId: 'e1',
          subjectUserId: ids.ana,
          grants: [
            grant({ grantId: 'g', actions: ['agenda.appointment.view'] }),
          ],
        }),
      ]),
    );
    expect(await ctx.service.openRemediation(ctx.em, ids.tenant, NOW)).toEqual({
      campaigns: 0,
      items: 0,
    });
  });
});

describe('expireSodExceptions (S-03)', () => {
  const finding = (over: Partial<any> = {}) => ({
    ruleCode: 'SOD-GOV-03',
    ruleName: 'x',
    scope: 'PERSON',
    action: 'REQUIRE_APPROVAL',
    isHard: false,
    outcome: 'EXCEPTION_REQUIRED',
    atomsA: [],
    atomsB: [],
    grantIdsA: ['g-viejo'],
    grantIdsB: ['g-nuevo'],
    admitsException: true,
    ...over,
  });
  const world = () =>
    worldOf([
      engagement({
        engagementId: 'e-ric',
        subjectUserId: ids.mario,
        sodFindings: [finding()] as any,
        grants: [
          grant({
            grantId: 'g-viejo',
            actions: ['team.sessionpolicy.manage'],
            createdAt: new Date('2026-01-01T00:00:00Z'),
          }),
          grant({
            grantId: 'g-nuevo',
            actions: ['billing.payment.collect'],
            createdAt: new Date('2026-06-01T00:00:00Z'),
          }),
        ],
      }),
    ]);
  const exceptionRow = () => ({
    id: 'exc-1',
    tenantId: ids.tenant,
    organizationUserAssignmentId: 'e-ric',
    sodRuleId: 'rule-1',
    statusConceptId: DELEG.STATE_SUSPENDED,
    validTo: new Date('2026-12-31T23:59:59Z'),
  });

  it('vence la excepción, avisa y abre un ítem de remediación (7 días) de la concesión MÁS RECIENTE', async () => {
    const ctx = build(world());
    const now = new Date('2027-01-01T06:30:00Z');
    const r = await ctx.service.expireSodExceptions(
      ctx.em,
      ids.tenant,
      [exceptionRow() as any],
      now,
      SYSTEM,
    );
    expect(r).toEqual({ expired: 1, remediationItems: 1 });
    expect(ctx.sod.markExpired).toHaveBeenCalled();
    expect(ctx.events.publish).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        type: 'delegated_access.sod.exception_expired',
      }),
    );
    expect(ctx.campaigns[0]).toMatchObject({
      kindConceptId: DELEG.REVIEW_KIND_REMEDIATION,
      graceDays: 0,
      uncertifiedActionConceptId: DELEG.UNCERTIFIED_REVOKE,
    });
    expect(ctx.campaigns[0].dueAt.getTime()).toBe(now.getTime() + 7 * DAY);
    expect(ctx.items).toHaveLength(1);
    expect(ctx.items[0].supportScopeGrantId).toBe('g-nuevo');
  });

  it('si el conflicto ya no existe tras vencer (no hay hallazgo), solo vence la excepción', async () => {
    const empty = worldOf([
      engagement({
        engagementId: 'e-ric',
        subjectUserId: ids.mario,
        grants: [],
      }),
    ]);
    const ctx = build(empty);
    const r = await ctx.service.expireSodExceptions(
      ctx.em,
      ids.tenant,
      [exceptionRow() as any],
      NOW,
      SYSTEM,
    );
    expect(r).toEqual({ expired: 1, remediationItems: 0 });
    expect(ctx.campaigns).toHaveLength(0);
  });
});
