import { DELEG } from '../delegated_access.concepts';
import { AccessReviewItemFactory } from './access-review-item.factory';
import {
  NOW,
  engagement,
  fakeEm,
  grant,
  ids,
  loggerStub,
  mockFn,
  worldOf,
} from './governance-world.testing';

/**
 * Hallazgo del humo real (caso 28): la campaña se crea con `em.create` y la fábrica crea los ítems en el
 * MISMO flush. `access_review_items.access_review_campaign_id` es una FK sin relación mapeada en el ORM, así que
 * el orden del commit entre tablas no está garantizado y la base real responde 23503 (el barrido de la organización
 * fallaba entero). La campaña se confirma ANTES de crear los ítems.
 */
describe('AccessReviewItemFactory.open: la campaña existe antes que sus ítems', () => {
  function build() {
    const order: string[] = [];
    const tx = fakeEm();
    tx.flush = mockFn(async () => {
      order.push('flush');
    });
    const repo: any = {
      createItems: mockFn(() => {
        order.push('createItems');
        return [];
      }),
    };
    const queries: any = {
      usageByGrant: mockFn().mockResolvedValue(new Map()),
    };
    const anomalies: any = { findByTenant: mockFn().mockResolvedValue([]) };
    const events: any = { publish: mockFn().mockResolvedValue(undefined) };
    const factory = new AccessReviewItemFactory(
      repo,
      queries,
      anomalies,
      events,
      loggerStub as any,
    );
    return { factory, tx, repo, order };
  }

  it('confirma la campaña (flush) y recién después crea los ítems', async () => {
    const { factory, tx, order } = build();
    const world = worldOf([
      engagement({
        engagementId: 'e-ana',
        subjectUserId: ids.ana,
        grants: [
          grant({ grantId: 'g1', actions: ['agenda.appointment.view'] }),
        ],
      }),
    ]);
    const campaign: any = {
      id: 'camp-1',
      dueAt: new Date(NOW.getTime() + 86_400_000),
      statusConceptId: DELEG.REVIEW_CAMPAIGN_DRAFT,
    };
    await factory.open(
      tx,
      campaign,
      world,
      [
        {
          engagementId: 'e-ana',
          subjectUserId: ids.ana,
          grantId: 'g1',
          reviewerKind: 'ADMIN',
          reviewerUserIds: [ids.admin],
          unresolvedReviewer: false,
          maxSensitivity: 'MEDIUM',
          suggestRevoke: false,
        } as any,
      ],
      NOW,
      { activate: true },
    );
    const firstCreate = order.indexOf('createItems');
    expect(order.indexOf('flush')).toBeGreaterThanOrEqual(0);
    expect(order.indexOf('flush')).toBeLessThan(firstCreate);
    expect(campaign.statusConceptId).toBe(DELEG.REVIEW_CAMPAIGN_OPEN);
  });
});
