import { jest } from '@jest/globals';
import { DELEG } from '../delegated_access.concepts';
import { AccessReviewCampaigns, AccessReviewItems } from '../entities';
import { AccessReviewRepository } from './access-review.repository';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
const NOW = new Date('2026-11-02T12:00:00Z');
const HASH = 'b'.repeat(64);

function build(rows: unknown[] = []) {
  const em: any = {
    find: mockFn().mockResolvedValue(rows),
    findOne: mockFn().mockResolvedValue(rows[0] ?? null),
    count: mockFn().mockResolvedValue(rows.length),
    create: mockFn((_e: unknown, data: unknown) => data),
  };
  return { repo: new AccessReviewRepository(), em };
}

describe('AccessReviewRepository: campañas', () => {
  it('crea una campaña en borrador con los valores por omisión del contrato', () => {
    const { repo, em } = build();

    const row: any = repo.createCampaign(em, {
      tenantId: 't1',
      name: 'Recertificación noviembre',
      kindConceptId: DELEG.REVIEW_KIND_RECERTIFICATION,
      scope: { allEngagements: true },
      scopeSchemaVersion: 1,
      dueAt: new Date(NOW.getTime() + 14 * 86_400_000),
      uncertifiedActionConceptId: DELEG.UNCERTIFIED_REVOKE,
      actorUserId: 'admin-1',
    });

    expect(em.create.mock.calls[0][0]).toBe(AccessReviewCampaigns);
    expect(row).toMatchObject({
      tenantId: 't1',
      statusConceptId: DELEG.REVIEW_CAMPAIGN_DRAFT,
      scopeJson: { allEngagements: true },
      scopeSchemaVersion: 1,
      graceDays: 7,
      reminderDaysBeforeJson: [7, 3, 1],
      escalateAfterDays: 3,
      createdByUserId: 'admin-1',
    });
    expect(row.ownerUserId).toBeUndefined();
  });

  it('lista las campañas de una organización por estado, con las más próximas primero', async () => {
    const { repo, em } = build([]);
    await repo.findCampaigns(em, 't1', [DELEG.REVIEW_CAMPAIGN_OPEN]);
    const [entity, where, opts] = em.find.mock.calls[0];
    expect(entity).toBe(AccessReviewCampaigns);
    expect(where).toEqual({
      tenantId: 't1',
      statusConceptId: { $in: [DELEG.REVIEW_CAMPAIGN_OPEN] },
    });
    expect(opts.orderBy).toEqual({ dueAt: 'asc', id: 'asc' });
  });

  it('el barrido lee las campañas abiertas de todas las organizaciones', async () => {
    const { repo, em } = build([{ id: 'c1' }]);
    await repo.findOpenCampaignsAcrossTenants(em, 200);
    const [, where, opts] = em.find.mock.calls[0];
    expect(where).toEqual({ statusConceptId: DELEG.REVIEW_CAMPAIGN_OPEN });
    expect(opts.limit).toBe(200);
  });
});

describe('AccessReviewRepository: ítems', () => {
  it('crea los ítems pendientes con evidencia y hash, sin decidir', () => {
    const { repo, em } = build();

    const [row]: any[] = repo.createItems(em, [
      {
        tenantId: 't1',
        campaignId: 'c1',
        organizationUserAssignmentId: 'v1',
        supportScopeGrantId: 'g1',
        reviewerUserId: 'doc-1',
        reviewerKindConceptId: DELEG.REVIEWER_KIND_DOCTOR_OWNER,
        evidence: { atoms: ['agenda.appointment.view'], lastUsedAt: null },
        evidenceHash: HASH,
        dueAt: NOW,
        actorUserId: 'admin-1',
      },
    ]);

    expect(em.create.mock.calls[0][0]).toBe(AccessReviewItems);
    expect(row).toMatchObject({
      accessReviewCampaignId: 'c1',
      supportScopeGrantId: 'g1',
      decisionConceptId: DELEG.REVIEW_ITEM_PENDING,
      evidenceJson: { atoms: ['agenda.appointment.view'], lastUsedAt: null },
      evidenceHash: HASH,
      reminderCount: 0,
    });
    expect(row.decidedAt).toBeUndefined();
  });

  it('un ítem de vínculo (sin permiso) no lleva support_scope_grant_id', () => {
    const { repo, em } = build();
    const [row]: any[] = repo.createItems(em, [
      {
        tenantId: 't1',
        campaignId: 'c1',
        organizationUserAssignmentId: 'v1',
        reviewerKindConceptId: DELEG.REVIEWER_KIND_ADMIN,
        evidence: {},
        evidenceHash: HASH,
        dueAt: NOW,
      },
    ]);
    expect(row.supportScopeGrantId).toBeUndefined();
  });

  it('la bandeja de un revisor son sus ítems pendientes, los más urgentes primero', async () => {
    const { repo, em } = build([]);
    await repo.findPendingForReviewer(em, 't1', 'doc-1');
    const [entity, where, opts] = em.find.mock.calls[0];
    expect(entity).toBe(AccessReviewItems);
    expect(where).toEqual({
      tenantId: 't1',
      reviewerUserId: 'doc-1',
      decisionConceptId: DELEG.REVIEW_ITEM_PENDING,
    });
    expect(opts.orderBy).toEqual({ dueAt: 'asc', id: 'asc' });
  });

  it('cuenta las decisiones de una campaña por concepto', async () => {
    const { repo, em } = build([
      { decisionConceptId: DELEG.REVIEW_ITEM_PENDING },
      { decisionConceptId: DELEG.REVIEW_ITEM_PENDING },
      { decisionConceptId: DELEG.REVIEW_ITEM_CERTIFIED },
    ]);

    const tally = await repo.decisionTally(em, 'c1');

    expect(tally).toEqual({
      [DELEG.REVIEW_ITEM_PENDING]: 2,
      [DELEG.REVIEW_ITEM_CERTIFIED]: 1,
    });
    expect(em.find.mock.calls[0][2]).toMatchObject({
      fields: ['decisionConceptId'],
    });
  });

  it('el barrido lee los ítems pendientes vencidos en todas las organizaciones', async () => {
    const { repo, em } = build([{ id: 'i1' }]);
    await repo.findOverdueItemsAcrossTenants(em, NOW, 500);
    const [, where, opts] = em.find.mock.calls[0];
    expect(where).toEqual({
      decisionConceptId: DELEG.REVIEW_ITEM_PENDING,
      dueAt: { $lte: NOW },
    });
    expect(opts.limit).toBe(500);
  });

  it('registra una decisión con quién y cuándo', () => {
    const { repo } = build();
    const row: any = { decisionConceptId: DELEG.REVIEW_ITEM_PENDING };

    repo.decide(row, {
      decisionConceptId: DELEG.REVIEW_ITEM_REVOKED,
      decidedByUserId: 'doc-1',
      comment: 'Ya no trabaja con este doctor',
      now: NOW,
    });

    expect(row).toMatchObject({
      decisionConceptId: DELEG.REVIEW_ITEM_REVOKED,
      decidedAt: NOW,
      decidedByUserId: 'doc-1',
      decisionCommentText: 'Ya no trabaja con este doctor',
      updatedByUserId: 'doc-1',
    });
  });
});
