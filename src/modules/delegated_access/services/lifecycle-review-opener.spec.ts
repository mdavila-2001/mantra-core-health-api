import { jest } from '@jest/globals';
import { DELEG } from '../delegated_access.concepts';
import { AccessReviewRepository } from '../repositories/access-review.repository';
import { LifecycleReviewOpener } from './lifecycle-review-opener';
import { memoryEm } from './lifecycle.testing';

/** Mock laxo: evita el tipado estricto `Mock<never>` del runtime de jest. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const NOW = new Date('2026-11-03T14:30:00Z');

describe('LifecycleReviewOpener', () => {
  function build() {
    const { em, tables } = memoryEm(mockFn);
    const outbox = { publishDomainEvent: mockFn().mockResolvedValue({}) };
    return {
      em,
      tables,
      outbox,
      opener: new LifecycleReviewOpener(
        new AccessReviewRepository(),
        outbox as any,
      ),
    };
  }

  it('cambio de rol: campaña MOVER abierta con un ítem por concesión nueva, 14 días y solo escala', async () => {
    const t = build();
    const out = await t.opener.open(
      t.em,
      {
        tenantId: 'org-1',
        kind: 'MOVER',
        name: 'Cambio de rol de Marcos',
        dueDays: 14,
        engagementId: 'eng-marcos',
        reviewerUserId: 'sofia',
        actorUserId: 'admin-1',
        items: [
          {
            grantId: 'g-new-1',
            evidence: { atoms: ['agenda.appointment.view'], scoreAfter: 3 },
          },
        ],
      },
      NOW,
    );
    const [campaign] = t.tables.AccessReviewCampaigns;
    expect(out).toEqual({ campaignId: campaign.id, itemCount: 1 });
    expect(campaign.kindConceptId).toBe(DELEG.REVIEW_KIND_MOVER);
    expect(campaign.uncertifiedActionConceptId).toBe(
      DELEG.UNCERTIFIED_ESCALATE,
    );
    expect(campaign.statusConceptId).toBe(DELEG.REVIEW_CAMPAIGN_OPEN);
    expect(campaign.launchedAt).toEqual(NOW);
    expect(campaign.dueAt.toISOString()).toBe('2026-11-17T14:30:00.000Z');
    const [item] = t.tables.AccessReviewItems;
    expect(item).toMatchObject({
      accessReviewCampaignId: campaign.id,
      organizationUserAssignmentId: 'eng-marcos',
      supportScopeGrantId: 'g-new-1',
      reviewerUserId: 'sofia',
      reviewerKindConceptId: DELEG.REVIEWER_KIND_SUPERVISOR,
      decisionConceptId: DELEG.REVIEW_ITEM_PENDING,
    });
    expect(item.evidenceHash).toMatch(/^[0-9a-f]{64}$/);
    const [, event] = t.outbox.publishDomainEvent.mock.calls[0];
    expect(event.eventType).toBe(
      'delegated_access.access_review.campaign_launched',
    );
  });

  it('cada ítem puede traer su propio revisor: el doctor de una concesión de doctor, el dueño en el resto (pendiente 12)', async () => {
    const t = build();
    await t.opener.open(
      t.em,
      {
        tenantId: 'org-1',
        kind: 'MOVER',
        name: 'Cambio de rol de Marcos',
        dueDays: 14,
        engagementId: 'eng-marcos',
        reviewerUserId: 'sofia',
        actorUserId: 'admin-1',
        items: [
          {
            grantId: 'g-loc',
            evidence: { atoms: ['agenda.appointment.view'] },
          },
          {
            grantId: 'g-doc',
            evidence: { atoms: ['agenda.appointment.view'] },
            reviewerUserId: 'dr-suarez',
            reviewerKind: 'DOCTOR_OWNER',
          },
        ],
      },
      NOW,
    );
    const [loc, doc] = t.tables.AccessReviewItems;
    expect(loc).toMatchObject({
      reviewerUserId: 'sofia',
      reviewerKindConceptId: DELEG.REVIEWER_KIND_SUPERVISOR,
    });
    expect(doc).toMatchObject({
      reviewerUserId: 'dr-suarez',
      reviewerKindConceptId: DELEG.REVIEWER_KIND_DOCTOR_OWNER,
    });
  });

  it('sin dueño asignado, el ítem va al administrador (clase ADMIN, sin persona)', async () => {
    const t = build();
    await t.opener.open(
      t.em,
      {
        tenantId: 'org-1',
        kind: 'TARGETED',
        name: 'Reactivación de Ana',
        dueDays: 7,
        engagementId: 'eng-ana',
        items: [{ evidence: { suspendedDays: 90 } }],
      },
      NOW,
    );
    const [campaign] = t.tables.AccessReviewCampaigns;
    expect(campaign.kindConceptId).toBe(DELEG.REVIEW_KIND_TARGETED);
    expect(campaign.dueAt.toISOString()).toBe('2026-11-10T14:30:00.000Z');
    const [item] = t.tables.AccessReviewItems;
    expect(item.reviewerUserId).toBeUndefined();
    expect(item.reviewerKindConceptId).toBe(DELEG.REVIEWER_KIND_ADMIN);
    expect(item.supportScopeGrantId).toBeUndefined();
  });

  it('sin ítems no abre campaña', async () => {
    const t = build();
    const out = await t.opener.open(
      t.em,
      {
        tenantId: 'org-1',
        kind: 'MOVER',
        name: 'x',
        dueDays: 14,
        engagementId: 'e',
        items: [],
      },
      NOW,
    );
    expect(out).toEqual({ campaignId: undefined, itemCount: 0 });
    expect(t.tables.AccessReviewCampaigns ?? []).toHaveLength(0);
  });
});
