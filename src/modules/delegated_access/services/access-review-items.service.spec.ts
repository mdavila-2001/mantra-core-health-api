import { AccessReviewItemsService } from './access-review-items.service';
import { ReviewerResolverService } from './reviewer-resolver.service';
import { AccessReviewRepository } from '../repositories';
import { DELEG } from '../delegated_access.concepts';
import { permissionAtomId, supportPermissionId } from '../domain';
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

const sofiaActor = staff(ids.sofia);
const adminActor = securityAdmin();

interface ItemSeed {
  id: string;
  engagementId: string;
  grantId?: string;
  reviewerUserId?: string;
  reviewers: string[];
  kind?: string;
}

function build(opts: {
  engagements: any[];
  items: ItemSeed[];
  campaignOpen?: boolean;
}) {
  const em = fakeEm();
  const campaign: any = {
    id: 'camp-1',
    tenantId: ids.tenant,
    name: 'Ecografía',
    kindConceptId: DELEG.REVIEW_KIND_PERIODIC,
    ownerUserId: ids.admin,
    statusConceptId:
      opts.campaignOpen === false
        ? DELEG.REVIEW_CAMPAIGN_CLOSED
        : DELEG.REVIEW_CAMPAIGN_OPEN,
  };
  const rows: any[] = opts.items.map((i) => ({
    id: i.id,
    tenantId: ids.tenant,
    accessReviewCampaignId: 'camp-1',
    organizationUserAssignmentId: i.engagementId,
    supportScopeGrantId: i.grantId,
    reviewerUserId: i.reviewerUserId ?? i.reviewers[0],
    reviewerKindConceptId: DELEG.REVIEWER_KIND_ADMIN,
    decisionConceptId: DELEG.REVIEW_ITEM_PENDING,
    evidenceJson: {
      atoms: [],
      _routing: { reviewerKind: 'ADMIN', reviewerUserIds: i.reviewers },
    },
    evidenceHash: 'a'.repeat(64),
    dueAt: new Date(NOW.getTime() + 10 * DAY),
    reminderCount: 0,
  }));
  const repo = new AccessReviewRepository();
  repo.findItemById = mockFn(
    async (_e: any, _t: string, id: string) =>
      rows.find((r) => r.id === id) ?? null,
  );
  repo.findCampaignById = mockFn(async () => campaign);
  // B-B3: el ítem se bloquea (FOR UPDATE) antes de validarlo; B-B2: cuántos ítems del vínculo en la campaña siguen sin decidir.
  repo.lockItem = mockFn(
    async (_e: any, _t: string, id: string) =>
      rows.find((r) => r.id === id) ?? null,
  );
  repo.countUndecidedOfEngagement = mockFn(
    async (_e: any, _t: string, campaignId: string, engagementId: string) =>
      rows.filter(
        (r) =>
          r.accessReviewCampaignId === campaignId &&
          r.organizationUserAssignmentId === engagementId &&
          r.decisionConceptId === DELEG.REVIEW_ITEM_PENDING,
      ).length,
  );
  const grantRows = new Map<string, any>();
  for (const e of opts.engagements)
    for (const g of e.grants)
      grantRows.set(g.grantId, {
        id: g.grantId,
        tenantId: ids.tenant,
        statusConceptId: DELEG.SUPPORT_GRANT_ACTIVE,
        organizationUserAssignmentId: e.engagementId,
      });
  const liveActions: any[] = [];
  const grants = {
    findById: mockFn(async (_e: any, id: string) => grantRows.get(id) ?? null),
    findLiveActions: mockFn(async () => liveActions),
    markSuperseded: mockFn(),
    addActions: mockFn(),
  };
  const loader = {
    load: mockFn(async (_e: any, _t: string, _n: Date, only?: string[]) =>
      worldOf(
        opts.engagements.filter((e) => !only || only.includes(e.engagementId)),
      ),
    ),
  };
  const queries: any = {
    securityAdminUserIds: mockFn().mockResolvedValue([ids.admin, ids.admin2]),
    pendingItemIdsOfReviewer: mockFn(
      async (_e: any, _t: string, userId: string) =>
        rows
          .filter((r) =>
            r.evidenceJson._routing.reviewerUserIds.includes(userId),
          )
          .map((r) => r.id),
    ),
  };
  const engagements = {
    recertify: mockFn().mockResolvedValue({ ok: true }),
    end: mockFn().mockResolvedValue({ ok: true }),
  };
  const assignment: any = { id: 'e-marcos' };
  em.findOne = mockFn(async () => assignment);
  const effective = { refreshTenant: mockFn().mockResolvedValue({ rows: 0 }) };
  const events = { publish: mockFn().mockResolvedValue(undefined) };
  const audit = { seal: mockFn().mockResolvedValue(undefined) };
  const scope = { resolveTenant: mockFn().mockReturnValue(ids.tenant) };
  const activity = { userNames: mockFn().mockResolvedValue(new Map()) };
  const service = new AccessReviewItemsService(
    em,
    repo,
    grants as any,
    loader as any,
    queries,
    new ReviewerResolverService(queries),
    engagements as any,
    effective as any,
    events as any,
    audit as any,
    scope as any,
    activity as any,
    loggerStub as any,
  );
  return {
    service,
    repo,
    audit,
    rows,
    grantRows,
    grants,
    engagements,
    effective,
    events,
    assignment,
    liveActions,
  };
}

const marcosGrant = grant({
  grantId: 'g-marcos',
  actions: ['agenda.appointment.cancel', 'agenda.appointment.view'],
  grantedByUserId: ids.admin,
});
const sofiaGrant = grant({
  grantId: 'g-sofia',
  actions: ['team.grants.assign', 'agenda.appointment.view'],
  grantedByUserId: ids.admin2,
});
const pilot = () => [
  engagement({
    engagementId: 'e-marcos',
    subjectUserId: ids.marcos,
    templateCode: 'CALL_CENTER',
    grants: [marcosGrant],
  }),
  engagement({
    engagementId: 'e-sofia',
    subjectUserId: ids.sofia,
    templateCode: 'ORG_MANAGEMENT',
    grants: [sofiaGrant],
  }),
];

describe('AccessReviewItemsService.decide (K-02)', () => {
  it('Sofía certifica el ítem de Marcos (MEDIA y con uso reciente) sin comentario: 200 y last_certified_at', async () => {
    const ctx = build({
      engagements: pilot(),
      items: [
        {
          id: 'i-marcos',
          engagementId: 'e-marcos',
          grantId: 'g-marcos',
          reviewers: [ids.sofia],
        },
      ],
    });
    const r = await ctx.service.decide(
      'i-marcos',
      { decision: 'CERTIFY' },
      sofiaActor,
    );
    expect(r).toEqual({ ok: true, state: 'CERTIFIED' });
    expect(ctx.rows[0].decisionConceptId).toBe(DELEG.REVIEW_ITEM_CERTIFIED);
    expect(ctx.rows[0].decidedByUserId).toBe(ids.sofia);
    expect(ctx.assignment.lastCertifiedAt).toBeInstanceOf(Date);
    expect(ctx.audit.seal).toHaveBeenCalledWith(
      expect.anything(),
      sofiaActor,
      ids.tenant,
      'ACCESS_REVIEW_ITEM_CERTIFIED',
      'access_review_item',
      'i-marcos',
    );
    expect(ctx.events.publish).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        type: 'delegated_access.access_review.item_decided',
      }),
    );
  });

  it('el administrador certifica el ítem de Sofía (ALTA): sin comentario 422; con comentario 200', async () => {
    const ctx = build({
      engagements: pilot(),
      items: [
        {
          id: 'i-sofia',
          engagementId: 'e-sofia',
          grantId: 'g-sofia',
          reviewers: [ids.admin],
        },
      ],
    });
    await expect(
      ctx.service.decide('i-sofia', { decision: 'CERTIFY' }, adminActor),
    ).rejects.toMatchObject({
      reason: Reason.REVIEW_COMMENT_REQUIRED,
      status: 422,
    });
    expect(ctx.rows[0].decisionConceptId).toBe(DELEG.REVIEW_ITEM_PENDING);
    await expect(
      ctx.service.decide(
        'i-sofia',
        { decision: 'CERTIFY', comment: 'Sigue a cargo de Ecografía.' },
        adminActor,
      ),
    ).resolves.toEqual({ ok: true, state: 'CERTIFIED' });
  });

  it('un ajuste que AGREGA un átomo es 422 REVIEW_ADJUST_CANNOT_BROADEN y no toca nada', async () => {
    const ctx = build({
      engagements: pilot(),
      items: [
        {
          id: 'i-marcos',
          engagementId: 'e-marcos',
          grantId: 'g-marcos',
          reviewers: [ids.sofia],
        },
      ],
    });
    await expect(
      ctx.service.decide(
        'i-marcos',
        {
          decision: 'ADJUST',
          comment: 'Que también cobre, por favor.',
          adjustment: {
            atoms: ['agenda.appointment.cancel', 'billing.payment.collect'],
          },
        },
        sofiaActor,
      ),
    ).rejects.toMatchObject({
      reason: Reason.REVIEW_ADJUST_CANNOT_BROADEN,
      status: 422,
    });
    expect(ctx.grants.markSuperseded).not.toHaveBeenCalled();
    expect(ctx.rows[0].decisionConceptId).toBe(DELEG.REVIEW_ITEM_PENDING);
  });

  it('B-M6: la condición del ajuste pasa por validateCondition (tamaño, clave desconocida, versión)', async () => {
    const mk = () =>
      build({
        engagements: pilot(),
        items: [
          {
            id: 'i-marcos',
            engagementId: 'e-marcos',
            grantId: 'g-marcos',
            reviewers: [ids.sofia],
          },
        ],
      });
    const cases: Array<[Record<string, unknown>, string]> = [
      [{ junk: 'x'.repeat(900_000) }, 'CONDITION_TOO_LARGE'],
      [{ clavesDesconocida: true }, 'CONDITION_UNKNOWN_KEY'],
      [{ schemaVersion: 99 }, 'CONDITION_SCHEMA_VERSION_UNSUPPORTED'],
    ];
    for (const [condition, reason] of cases) {
      const ctx = mk();
      await expect(
        ctx.service.decide(
          'i-marcos',
          {
            decision: 'ADJUST',
            comment: 'Solo en horario de la mañana.',
            adjustment: { condition },
          } as any,
          sofiaActor,
        ),
      ).rejects.toMatchObject({ reason, status: 422 });
      expect(ctx.rows[0].decisionConceptId).toBe(DELEG.REVIEW_ITEM_PENDING);
    }
  });

  it('B-M6: una condición válida que solo agrega restricciones se aplica', async () => {
    const ctx = build({
      engagements: pilot(),
      items: [
        {
          id: 'i-marcos',
          engagementId: 'e-marcos',
          grantId: 'g-marcos',
          reviewers: [ids.sofia],
        },
      ],
    });
    const r = await ctx.service.decide(
      'i-marcos',
      {
        decision: 'ADJUST',
        comment: 'Solo en horario de la mañana.',
        adjustment: {
          condition: {
            time: { windows: [{ days: [1, 2], from: '08:00', to: '12:00' }] },
          },
        },
      } as any,
      sofiaActor,
    );
    expect(r.state).toBe('ADJUSTED');
  });

  it('un ajuste que QUITA agenda.appointment.cancel se aplica: reemplaza el alias por átomos y refresca el acceso', async () => {
    const ctx = build({
      engagements: pilot(),
      items: [
        {
          id: 'i-marcos',
          engagementId: 'e-marcos',
          grantId: 'g-marcos',
          reviewers: [ids.sofia],
        },
      ],
    });
    const aliasRow = {
      id: 'a1',
      permissionId: supportPermissionId('schedule.cancel'),
    };
    ctx.liveActions.push(aliasRow, {
      id: 'a2',
      permissionId: permissionAtomId('agenda.appointment.view'),
    });
    const r = await ctx.service.decide(
      'i-marcos',
      {
        decision: 'ADJUST',
        comment: 'Solo necesita ver la agenda.',
        adjustment: { atoms: ['agenda.appointment.view'] },
      },
      sofiaActor,
    );
    expect(r.state).toBe('ADJUSTED');
    expect(ctx.rows[0].decisionConceptId).toBe(DELEG.REVIEW_ITEM_ADJUSTED);
    expect(ctx.rows[0].adjustmentJson).toEqual({
      atoms: ['agenda.appointment.view'],
    });
    expect(ctx.grants.markSuperseded).toHaveBeenCalledWith(
      [aliasRow],
      expect.any(Date),
      ids.sofia,
    );
    expect(ctx.effective.refreshTenant).toHaveBeenCalledWith(
      ids.tenant,
      expect.objectContaining({ userId: ids.marcos }),
    );
  });

  it('revocar exige comentario y deja la concesión REVOKED con valid_to = ahora', async () => {
    const ctx = build({
      engagements: pilot(),
      items: [
        {
          id: 'i-marcos',
          engagementId: 'e-marcos',
          grantId: 'g-marcos',
          reviewers: [ids.sofia],
        },
      ],
    });
    await expect(
      ctx.service.decide('i-marcos', { decision: 'REVOKE' }, sofiaActor),
    ).rejects.toMatchObject({
      reason: Reason.REVIEW_COMMENT_REQUIRED,
    });
    await ctx.service.decide(
      'i-marcos',
      { decision: 'REVOKE', comment: 'Ya no atiende en Ecografía.' },
      sofiaActor,
    );
    expect(ctx.grantRows.get('g-marcos').statusConceptId).toBe(
      DELEG.SUPPORT_GRANT_REVOKED,
    );
    expect(ctx.grantRows.get('g-marcos').validTo).toBeInstanceOf(Date);
    expect(ctx.rows[0].decisionConceptId).toBe(DELEG.REVIEW_ITEM_REVOKED);
  });

  it('S-04: quien otorgó el permiso no lo certifica aunque figure como revisor: 403 REVIEW_NOT_REVIEWER', async () => {
    const mine = grant({
      grantId: 'g-nuevo',
      actions: ['agenda.appointment.view'],
      grantedByUserId: ids.sofia,
    });
    const ctx = build({
      engagements: [
        engagement({
          engagementId: 'e-ana',
          subjectUserId: ids.ana,
          grants: [mine],
        }),
      ],
      items: [
        {
          id: 'i-ana',
          engagementId: 'e-ana',
          grantId: 'g-nuevo',
          reviewers: [ids.admin, ids.sofia],
        },
      ],
    });
    await expect(
      ctx.service.decide('i-ana', { decision: 'CERTIFY' }, sofiaActor),
    ).rejects.toMatchObject({
      reason: Reason.REVIEW_NOT_REVIEWER,
      status: 403,
    });
  });

  it('una campaña cerrada es 409 REVIEW_CAMPAIGN_NOT_OPEN; un ítem decidido, 409 REVIEW_ALREADY_DECIDED', async () => {
    const closed = build({
      engagements: pilot(),
      items: [
        {
          id: 'i-marcos',
          engagementId: 'e-marcos',
          grantId: 'g-marcos',
          reviewers: [ids.sofia],
        },
      ],
      campaignOpen: false,
    });
    await expect(
      closed.service.decide('i-marcos', { decision: 'CERTIFY' }, sofiaActor),
    ).rejects.toMatchObject({
      reason: Reason.REVIEW_CAMPAIGN_NOT_OPEN,
    });
    const open = build({
      engagements: pilot(),
      items: [
        {
          id: 'i-marcos',
          engagementId: 'e-marcos',
          grantId: 'g-marcos',
          reviewers: [ids.sofia],
        },
      ],
    });
    await open.service.decide('i-marcos', { decision: 'CERTIFY' }, sofiaActor);
    await expect(
      open.service.decide('i-marcos', { decision: 'CERTIFY' }, sofiaActor),
    ).rejects.toMatchObject({
      reason: Reason.REVIEW_ALREADY_DECIDED,
    });
  });

  it('un ítem inexistente es 404 REVIEW_ITEM_NOT_FOUND', async () => {
    const ctx = build({ engagements: pilot(), items: [] });
    await expect(
      ctx.service.decide('nope', { decision: 'CERTIFY' }, sofiaActor),
    ).rejects.toMatchObject({
      reason: Reason.REVIEW_ITEM_NOT_FOUND,
      status: 404,
    });
  });
});

describe('AccessReviewItemsService.decide · B-B2 (last_certified_at del vínculo)', () => {
  const g1 = grant({
    grantId: 'g-uno',
    actions: ['agenda.appointment.view'],
    grantedByUserId: ids.admin,
  });
  const g2 = grant({
    grantId: 'g-dos',
    actions: ['agenda.appointment.view'],
    grantedByUserId: ids.admin,
  });
  const two = () =>
    engagement({
      engagementId: 'e-marcos',
      subjectUserId: ids.marcos,
      templateCode: 'CALL_CENTER',
      grants: [g1, g2],
    });

  it('certificar UNA concesión no mueve last_certified_at mientras queden ítems del vínculo sin decidir', async () => {
    const ctx = build({
      engagements: [two()],
      items: [
        {
          id: 'i-1',
          engagementId: 'e-marcos',
          grantId: 'g-uno',
          reviewers: [ids.sofia],
        },
        {
          id: 'i-2',
          engagementId: 'e-marcos',
          grantId: 'g-dos',
          reviewers: [ids.sofia],
        },
      ],
    });
    await ctx.service.decide('i-1', { decision: 'CERTIFY' }, sofiaActor);
    expect(ctx.assignment.lastCertifiedAt).toBeUndefined();
    await ctx.service.decide('i-2', { decision: 'CERTIFY' }, sofiaActor);
    expect(ctx.assignment.lastCertifiedAt).toBeInstanceOf(Date);
  });

  it('certificar la última concesión pendiente cuando las demás se revocaron SÍ certifica el vínculo (ya no queda nada sin revisar)', async () => {
    const ctx = build({
      engagements: [two()],
      items: [
        {
          id: 'i-1',
          engagementId: 'e-marcos',
          grantId: 'g-uno',
          reviewers: [ids.sofia],
        },
        {
          id: 'i-2',
          engagementId: 'e-marcos',
          grantId: 'g-dos',
          reviewers: [ids.sofia],
        },
      ],
    });
    await ctx.service.decide(
      'i-1',
      { decision: 'REVOKE', comment: 'Ya no la necesita para nada.' },
      sofiaActor,
    );
    expect(ctx.assignment.lastCertifiedAt).toBeUndefined();
    await ctx.service.decide('i-2', { decision: 'CERTIFY' }, sofiaActor);
    expect(ctx.assignment.lastCertifiedAt).toBeInstanceOf(Date);
  });
});

describe('AccessReviewItemsService: ítems de vínculo (recertificación)', () => {
  const e = engagement({
    engagementId: 'e-ana',
    subjectUserId: ids.ana,
    grants: [grant({ grantId: 'g-ana', actions: ['agenda.appointment.view'] })],
  });

  it('CERTIFY de un ítem de vínculo llama a recertify existente y deja el ítem CERTIFIED con el comentario', async () => {
    const ctx = build({
      engagements: [e],
      items: [{ id: 'i-vinc', engagementId: 'e-ana', reviewers: [ids.admin] }],
    });
    const r = await ctx.service.decide(
      'i-vinc',
      { decision: 'CERTIFY', comment: 'Sigue trabajando aquí.' },
      adminActor,
    );
    expect(r.state).toBe('CERTIFIED');
    expect(ctx.engagements.recertify).toHaveBeenCalledWith(
      'e-ana',
      {},
      adminActor,
    );
    expect(ctx.rows[0].decisionConceptId).toBe(DELEG.REVIEW_ITEM_CERTIFIED);
    expect(ctx.rows[0].decisionCommentText).toBe('Sigue trabajando aquí.');
  });

  it('si recertify ya cerró el ítem (la ruta antigua), solo se anota el comentario', async () => {
    const ctx = build({
      engagements: [e],
      items: [{ id: 'i-vinc', engagementId: 'e-ana', reviewers: [ids.admin] }],
    });
    ctx.engagements.recertify.mockImplementation(async () => {
      ctx.rows[0].decisionConceptId = DELEG.REVIEW_ITEM_CERTIFIED;
      ctx.rows[0].decidedAt = NOW;
      ctx.rows[0].decidedByUserId = ids.admin;
    });
    await ctx.service.decide(
      'i-vinc',
      { decision: 'CERTIFY', comment: 'Confirmada hoy.' },
      adminActor,
    );
    expect(ctx.rows[0].decisionCommentText).toBe('Confirmada hoy.');
    expect(ctx.rows[0].decidedAt).toEqual(NOW);
  });

  it('B-B3: el ítem se bloquea y se ANOTA antes de ejecutar el efecto (quien llegue después ve la decisión y no repite el efecto)', async () => {
    const ctx = build({
      engagements: [e],
      items: [{ id: 'i-vinc', engagementId: 'e-ana', reviewers: [ids.admin] }],
    });
    let stateAtEffect: string | undefined;
    ctx.engagements.recertify.mockImplementation(async () => {
      stateAtEffect = ctx.rows[0].decisionConceptId;
      return { ok: true };
    });
    await ctx.service.decide(
      'i-vinc',
      { decision: 'CERTIFY', comment: 'Sigue trabajando aquí.' },
      adminActor,
    );
    expect((ctx.repo as any).lockItem).toHaveBeenCalledWith(
      expect.anything(),
      ids.tenant,
      'i-vinc',
    );
    expect(stateAtEffect).toBe(DELEG.REVIEW_ITEM_CERTIFIED);
    // el segundo revisor (doble clic u otro revisor) ya no pasa: 409 y NO se ejecuta otro efecto
    await expect(
      ctx.service.decide(
        'i-vinc',
        { decision: 'REVOKE', comment: 'Ya no trabaja con nosotros.' },
        adminActor,
      ),
    ).rejects.toMatchObject({ reason: Reason.REVIEW_ALREADY_DECIDED });
    expect(ctx.engagements.end).not.toHaveBeenCalled();
    expect(ctx.engagements.recertify).toHaveBeenCalledTimes(1);
  });

  it('B-B3: si el efecto falla, la anotación se deshace (el ítem vuelve a PENDING) y el error sale tal cual', async () => {
    const ctx = build({
      engagements: [e],
      items: [{ id: 'i-vinc', engagementId: 'e-ana', reviewers: [ids.admin] }],
    });
    ctx.engagements.end.mockRejectedValue(new Error('no se pudo terminar'));
    await expect(
      ctx.service.decide(
        'i-vinc',
        { decision: 'REVOKE', comment: 'Ya no trabaja con nosotros.' },
        adminActor,
      ),
    ).rejects.toThrow('no se pudo terminar');
    expect(ctx.rows[0].decisionConceptId).toBe(DELEG.REVIEW_ITEM_PENDING);
    expect(ctx.rows[0].decidedAt).toBeUndefined();
    expect(ctx.rows[0].decidedByUserId).toBeUndefined();
    expect(ctx.rows[0].decisionCommentText).toBeUndefined();
    expect(ctx.events.publish).not.toHaveBeenCalled();
  });

  it('REVOKE de un ítem de vínculo termina el vínculo con el comentario como motivo', async () => {
    const ctx = build({
      engagements: [e],
      items: [{ id: 'i-vinc', engagementId: 'e-ana', reviewers: [ids.admin] }],
    });
    await ctx.service.decide(
      'i-vinc',
      { decision: 'REVOKE', comment: 'Ya no trabaja con nosotros.' },
      adminActor,
    );
    expect(ctx.engagements.end).toHaveBeenCalledWith(
      'e-ana',
      { reason: 'Ya no trabaja con nosotros.' },
      adminActor,
    );
    expect(ctx.rows[0].decisionConceptId).toBe(DELEG.REVIEW_ITEM_REVOKED);
  });

  it('ADJUST no aplica a un ítem de vínculo: 422 REVIEW_ADJUST_NOT_APPLICABLE', async () => {
    const ctx = build({
      engagements: [e],
      items: [{ id: 'i-vinc', engagementId: 'e-ana', reviewers: [ids.admin] }],
    });
    await expect(
      ctx.service.decide(
        'i-vinc',
        {
          decision: 'ADJUST',
          comment: 'Reducir un poco todo.',
          adjustment: { atoms: [] },
        },
        adminActor,
      ),
    ).rejects.toMatchObject({ reason: Reason.REVIEW_ADJUST_NOT_APPLICABLE });
    expect(ctx.engagements.recertify).not.toHaveBeenCalled();
  });
});

describe('AccessReviewItemsService.bulk (K-05)', () => {
  /** 5 ítems de bajo riesgo con uso reciente y 1 ítem ALTA, todos para Sofía. */
  function world6() {
    const low = [1, 2, 3, 4, 5].map((n) =>
      engagement({
        engagementId: `e-${n}`,
        subjectUserId: `u-${n}`,
        grants: [
          grant({ grantId: `g-${n}`, actions: ['agenda.appointment.cancel'] }),
        ],
      }),
    );
    const high = engagement({
      engagementId: 'e-6',
      subjectUserId: 'u-6',
      grants: [grant({ grantId: 'g-6', actions: ['billing.payment.collect'] })],
    });
    return {
      engagements: [...low, high],
      items: [1, 2, 3, 4, 5, 6].map((n) => ({
        id: `i-${n}`,
        engagementId: `e-${n}`,
        grantId: `g-${n}`,
        reviewers: [ids.sofia],
      })),
    };
  }

  it('5 de bajo riesgo + 1 ALTA: 422 REVIEW_BULK_NOT_ALLOWED con itemIds = [el ALTA] y NO se aplica ninguno', async () => {
    const { engagements, items } = world6();
    const ctx = build({ engagements, items });
    await expect(
      ctx.service.bulk(
        { itemIds: items.map((i) => i.id), decision: 'CERTIFY' },
        sofiaActor,
      ),
    ).rejects.toMatchObject({
      reason: Reason.REVIEW_BULK_NOT_ALLOWED,
      status: 422,
      response: { details: { itemIds: ['i-6'] } },
    });
    expect(
      ctx.rows.every((r) => r.decisionConceptId === DELEG.REVIEW_ITEM_PENDING),
    ).toBe(true);
  });

  it('los 5 de bajo riesgo se certifican juntos', async () => {
    const { engagements, items } = world6();
    const ctx = build({ engagements, items });
    const r = await ctx.service.bulk(
      { itemIds: items.slice(0, 5).map((i) => i.id), decision: 'CERTIFY' },
      sofiaActor,
    );
    expect(r).toEqual({ ok: true, decided: 5 });
    expect(
      ctx.rows
        .slice(0, 5)
        .every((x) => x.decisionConceptId === DELEG.REVIEW_ITEM_CERTIFIED),
    ).toBe(true);
  });

  it('el lote solo admite CERTIFY y no admite ítems de vínculo', async () => {
    const { engagements, items } = world6();
    const ctx = build({ engagements, items });
    await expect(
      ctx.service.bulk(
        {
          itemIds: ['i-1'],
          decision: 'REVOKE',
          comment: 'x'.repeat(12),
        } as any,
        sofiaActor,
      ),
    ).rejects.toMatchObject({ reason: Reason.REVIEW_BULK_NOT_ALLOWED });
    const linked = build({
      engagements: [engagements[0]],
      items: [{ id: 'i-v', engagementId: 'e-1', reviewers: [ids.sofia] }],
    });
    await expect(
      linked.service.bulk(
        { itemIds: ['i-v'], decision: 'CERTIFY' },
        sofiaActor,
      ),
    ).rejects.toMatchObject({ reason: Reason.REVIEW_BULK_NOT_ALLOWED });
  });
});

describe('AccessReviewItemsService.list y get', () => {
  it('mis ítems pendientes: solo los míos, con subject y campaña, sin evidencia en la lista', async () => {
    const ctx = build({
      engagements: pilot(),
      items: [
        {
          id: 'i-marcos',
          engagementId: 'e-marcos',
          grantId: 'g-marcos',
          reviewers: [ids.sofia],
        },
        {
          id: 'i-sofia',
          engagementId: 'e-sofia',
          grantId: 'g-sofia',
          reviewers: [ids.admin],
        },
      ],
    });
    const r = await ctx.service.list(sofiaActor);
    expect(r.count).toBe(1);
    expect(r.items[0]).toMatchObject({
      id: 'i-marcos',
      subjectUserId: ids.marcos,
      campaignName: 'Ecografía',
    });
    expect(r.items[0].evidence).toBeUndefined();
  });

  it('el detalle trae la evidencia sin el enrutamiento; uno ajeno es 404 uniforme', async () => {
    const ctx = build({
      engagements: pilot(),
      items: [
        {
          id: 'i-sofia',
          engagementId: 'e-sofia',
          grantId: 'g-sofia',
          reviewers: [ids.admin],
        },
      ],
    });
    const mine = await ctx.service.get('i-sofia', adminActor);
    expect(mine.evidence).toEqual({ atoms: [] });
    expect(mine.evidenceHash).toMatch(/^[0-9a-f]{64}$/);
    await expect(ctx.service.get('i-sofia', sofiaActor)).rejects.toMatchObject({
      reason: Reason.REVIEW_ITEM_NOT_FOUND,
      status: 404,
    });
  });
});
