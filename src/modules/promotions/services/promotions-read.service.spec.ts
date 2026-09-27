import { jest } from '@jest/globals';
import {
  CONCEPTS,
  PreconditionFailedException,
  runWithTenant,
} from '../../../common';
import { PromotionsReadService } from './promotions-read.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const PACIENTE = {
  id: 'user-1',
  roles: ['PATIENT'],
  patientProfileId: 'pat-1',
} as any;

const PORCENTUAL = {
  id: CONCEPTS.DISCOUNT_PERCENTAGE,
  code: 'DISC_PERCENT',
  display: 'Descuento porcentual',
};
const AUTOMATICA = {
  id: CONCEPTS.PROMOTION_TYPE_AUTOMATIC,
  code: 'PROMO_AUTO',
  display: 'Promoción automática',
};

function promo(id: string, extra: Record<string, unknown> = {}) {
  return {
    id,
    tenantId: 'tenant-a',
    code: `P-${id}`,
    name: `Promo ${id}`,
    promotionTypeConceptId: CONCEPTS.PROMOTION_TYPE_AUTOMATIC,
    statusConceptId: CONCEPTS.PROMOTION_ACTIVE,
    validFrom: new Date('2026-09-01T00:00:00Z'),
    validTo: new Date('2026-10-01T00:00:00Z'),
    ...extra,
  } as any;
}

function build() {
  const fork = {};
  const em = { fork: mockFn(() => fork) };
  const repo = {
    findCurrentPromotions: mockFn().mockResolvedValue([]),
    findRulesByPromotions: mockFn().mockResolvedValue([]),
    findPersonalCoupons: mockFn().mockResolvedValue([]),
    findConcepts: mockFn().mockResolvedValue([]),
  };
  const service = new PromotionsReadService(em as any, repo as any);
  return { service, repo, fork };
}

describe('PromotionsReadService.listMine (GET /promotions/me)', () => {
  it('requires the active tenant', async () => {
    const d = build();
    await expect(d.service.listMine(PACIENTE)).rejects.toBeInstanceOf(
      PreconditionFailedException,
    );
  });

  it('requires a patient profile on the token (the holder never comes from the URL)', async () => {
    const d = build();
    await expect(
      runWithTenant('tenant-a', () =>
        d.service.listMine({ id: 'user-2', roles: ['PATIENT'] } as any),
      ),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
    expect(d.repo.findCurrentPromotions).not.toHaveBeenCalled();
  });

  it('serves current automatic promotions with their rules resolved', async () => {
    const d = build();
    d.repo.findCurrentPromotions.mockResolvedValue([
      promo('1', { description: 'En toda la farmacia' }),
    ]);
    d.repo.findRulesByPromotions.mockResolvedValue([
      {
        promotionId: '1',
        discountTypeConceptId: PORCENTUAL.id,
        percentage: '15',
        minPurchaseAmount: '50.00',
      },
    ]);
    d.repo.findConcepts.mockResolvedValue([PORCENTUAL, AUTOMATICA]);

    const result = await runWithTenant('tenant-a', () =>
      d.service.listMine(PACIENTE),
    );

    expect(d.repo.findCurrentPromotions).toHaveBeenCalledWith(
      d.fork,
      'tenant-a',
      expect.any(Date),
    );
    // Los cupones se buscan del titular del token, nunca de otro.
    expect(d.repo.findPersonalCoupons).toHaveBeenCalledWith(
      d.fork,
      ['1'],
      CONCEPTS.REWARD_MEMBER_PATIENT,
      'pat-1',
      expect.any(Date),
    );
    expect(result.count).toBe(1);
    expect(result.items[0]).toEqual({
      id: '1',
      code: 'P-1',
      name: 'Promo 1',
      description: 'En toda la farmacia',
      type: { code: 'PROMO_AUTO', display: 'Promoción automática' },
      validFrom: '2026-09-01T00:00:00.000Z',
      validTo: '2026-10-01T00:00:00.000Z',
      discounts: [
        {
          type: { code: 'DISC_PERCENT', display: 'Descuento porcentual' },
          percentage: '15',
          fixedAmount: null,
          currency: null,
          minPurchaseAmount: '50.00',
          maxDiscountAmount: null,
          appliesTo: null,
        },
      ],
      coupons: [],
    });
  });

  it('serves a coupon promotion only with the holder own coupon', async () => {
    const d = build();
    d.repo.findCurrentPromotions.mockResolvedValue([
      promo('mia', {
        promotionTypeConceptId: CONCEPTS.PROMOTION_TYPE_COUPON,
        validTo: undefined,
      }),
      promo('ajena', {
        promotionTypeConceptId: CONCEPTS.PROMOTION_TYPE_COUPON,
      }),
    ]);
    d.repo.findPersonalCoupons.mockResolvedValue([
      { promotionId: 'mia', code: 'ANA-7Q2X', validTo: undefined },
    ]);

    const result = await runWithTenant('tenant-a', () =>
      d.service.listMine(PACIENTE),
    );

    // La de cupón sin cupón suyo no es «para mí»: no se sirve.
    expect(result.items.map((item: { id: string }) => item.id)).toEqual([
      'mia',
    ]);
    expect(result.items[0].coupons).toEqual([
      { code: 'ANA-7Q2X', validTo: null },
    ]);
    expect(result.items[0].validTo).toBeNull();
  });

  it('answers empty without further queries when nothing is current', async () => {
    const d = build();

    const result = await runWithTenant('tenant-a', () =>
      d.service.listMine(PACIENTE),
    );

    expect(result).toEqual({ items: [], count: 0 });
    expect(d.repo.findRulesByPromotions).not.toHaveBeenCalled();
    expect(d.repo.findConcepts).not.toHaveBeenCalled();
  });
});
