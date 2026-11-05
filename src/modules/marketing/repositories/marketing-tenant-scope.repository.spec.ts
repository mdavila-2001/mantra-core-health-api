import { jest } from '@jest/globals';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import { MarketingCampaignsRepository } from './marketing-campaigns.repository';
import { MarketingJourneysRepository } from './marketing-journeys.repository';

const TENANT = 'tenant-a';

/**
 * Construye un EntityManager simulado que registra las consultas.
 *
 * @returns El EntityManager y sus espías.
 */
function fakeEm() {
  const findOne: any = (jest.fn as any)(async () => null);
  const find: any = (jest.fn as any)(async () => []);
  return { em: { findOne, find } as unknown as EntityManager, findOne, find };
}

describe('MarketingCampaignsRepository · alcance por tenant (MKT-01)', () => {
  const repo = new MarketingCampaignsRepository();

  it('busca el segmento por id y tenant', async () => {
    const { em, findOne } = fakeEm();
    await repo.findSegmentById(em, TENANT, 'seg-1');
    expect(findOne).toHaveBeenCalledWith(expect.anything(), {
      id: 'seg-1',
      tenantId: TENANT,
    });
  });

  it('bloquea el segmento y la campaña sólo dentro del tenant', async () => {
    const { em, findOne } = fakeEm();
    await repo.findSegmentForUpdate(em, TENANT, 'seg-1');
    await repo.findCampaignForUpdate(em, TENANT, 'cmp-1');
    expect(findOne).toHaveBeenNthCalledWith(
      1,
      expect.anything(),
      { id: 'seg-1', tenantId: TENANT },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
    expect(findOne).toHaveBeenNthCalledWith(
      2,
      expect.anything(),
      { id: 'cmp-1', tenantId: TENANT },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  });

  it('resuelve las plantillas por id y tenant', async () => {
    const { em, findOne } = fakeEm();
    await repo.findPublishedTemplate(em, TENANT, 'tpl-1', 'published');
    await repo.findTemplateById(em, TENANT, 'tpl-1');
    expect(findOne).toHaveBeenNthCalledWith(1, expect.anything(), {
      id: 'tpl-1',
      tenantId: TENANT,
      statusConceptId: 'published',
    });
    expect(findOne).toHaveBeenNthCalledWith(2, expect.anything(), {
      id: 'tpl-1',
      tenantId: TENANT,
    });
  });

  it('la campaña referida por touchpoints y enlaces se resuelve por id o por su campaña publicitaria, siempre del tenant', async () => {
    const { em, findOne } = fakeEm();
    await repo.findCampaignByIdOrAdRef(em, TENANT, 'ads-1');
    expect(findOne).toHaveBeenCalledWith(expect.anything(), {
      tenantId: TENANT,
      $or: [{ id: 'ads-1' }, { adCampaignRefId: 'ads-1' }],
    });
  });
});

describe('MarketingJourneysRepository · alcance por tenant (MKT-01)', () => {
  const repo = new MarketingJourneysRepository();

  it('busca y bloquea el journey sólo dentro del tenant', async () => {
    const { em, findOne } = fakeEm();
    await repo.findJourneyById(em, TENANT, 'j-1');
    await repo.findJourneyForUpdate(em, TENANT, 'j-1');
    expect(findOne).toHaveBeenNthCalledWith(1, expect.anything(), {
      id: 'j-1',
      tenantId: TENANT,
    });
    expect(findOne).toHaveBeenNthCalledWith(
      2,
      expect.anything(),
      { id: 'j-1', tenantId: TENANT },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  });

  it('conserva sólo los touchpoints de campañas o journeys del tenant', async () => {
    const find: any = (jest.fn as any)(async (_entity: unknown, where: any) => {
      if (where.$or) {
        return [{ id: 'cmp-own', adCampaignRefId: 'ads-own' }];
      }
      return [{ id: 'j-own' }];
    });
    const em = { find } as unknown as EntityManager;
    const touchpoints: any[] = [
      { id: 't1', campaignId: 'cmp-own' },
      { id: 't2', campaignId: 'ads-own' },
      { id: 't3', journeyId: 'j-own' },
      { id: 't4', campaignId: 'cmp-ajena' },
      { id: 't5', journeyId: 'j-ajeno' },
      { id: 't6' },
    ];

    const kept = await repo.keepTouchpointsOfTenant(em, TENANT, touchpoints);

    expect(kept.map((t) => t.id)).toEqual(['t1', 't2', 't3']);
    // Ambas consultas se acotan al tenant.
    for (const call of find.mock.calls) {
      expect(call[1].tenantId).toBe(TENANT);
    }
  });

  it('sin touchpoints no consulta nada', async () => {
    const { em, find } = fakeEm();
    expect(await repo.keepTouchpointsOfTenant(em, TENANT, [])).toEqual([]);
    expect(find).not.toHaveBeenCalled();
  });
});
