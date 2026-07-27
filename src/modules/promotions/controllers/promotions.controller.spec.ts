import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { LoyaltyController } from './loyalty.controller';
import { PromotionsController } from './promotions.controller';

const actor = { id: 'user-1', roles: ['PROMOTIONS_ADMIN'] };
const ID = '11111111-1111-1111-1111-111111111111';

function build() {
  const loyaltyService = {
    createProgram: mockFn(),
    enrollMember: mockFn(),
    earnPoints: mockFn(),
    redeemPoints: mockFn(),
    recomputeBalance: mockFn(),
    expirePoints: mockFn(),
    createReferral: mockFn(),
    qualifyReferral: mockFn(),
  };
  const discountsService = {
    createPromotion: mockFn(),
    issueCoupons: mockFn(),
    validateCoupon: mockFn(),
    redeemCoupon: mockFn(),
    applyDiscount: mockFn(),
    reverseRedemption: mockFn(),
  };
  return {
    loyalty: new LoyaltyController(loyaltyService as any),
    promotions: new PromotionsController(discountsService as any),
    loyaltyService,
    discountsService,
  };
}

describe('LoyaltyController', () => {
  it('delegates program creation (UC-51-01)', async () => {
    const d = build();
    const dto = { code: 'LOY-01' } as any;
    d.loyaltyService.createProgram.mockResolvedValue({ id: 'prog-1' });

    await d.loyalty.createProgram(dto, actor);

    expect(d.loyaltyService.createProgram).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates enrollment with the route id (UC-51-02)', async () => {
    const d = build();
    const dto = { memberType: 'USER' } as any;
    d.loyaltyService.enrollMember.mockResolvedValue({ id: ID });

    await d.loyalty.enrollMember(ID, dto, actor);

    expect(d.loyaltyService.enrollMember).toHaveBeenCalledWith(ID, dto, actor);
  });

  it('delegates earn and redeem (UC-51-03, UC-51-04)', async () => {
    const d = build();
    const earnDto = { earningRuleId: ID, idempotencyKey: 'k' } as any;
    const redeemDto = { points: '10', idempotencyKey: 'k2' } as any;
    d.loyaltyService.earnPoints.mockResolvedValue({ ledgerEntryId: 'led-1' });
    d.loyaltyService.redeemPoints.mockResolvedValue({ ledgerEntryId: 'led-2' });

    await d.loyalty.earnPoints(ID, earnDto, actor);
    await d.loyalty.redeemPoints(ID, redeemDto, actor);

    expect(d.loyaltyService.earnPoints).toHaveBeenCalledWith(
      ID,
      earnDto,
      actor,
    );
    expect(d.loyaltyService.redeemPoints).toHaveBeenCalledWith(
      ID,
      redeemDto,
      actor,
    );
  });

  it('delegates the balance recompute (UC-51-05)', async () => {
    const d = build();
    d.loyaltyService.recomputeBalance.mockResolvedValue({ membershipId: ID });

    await d.loyalty.recomputeBalance(ID, actor);

    expect(d.loyaltyService.recomputeBalance).toHaveBeenCalledWith(ID, actor);
  });

  it('delegates the expiry sweep (UC-51-06)', async () => {
    const d = build();
    const dto = { loyaltyProgramId: ID } as any;
    d.loyaltyService.expirePoints.mockResolvedValue({ scanned: 0 });

    await d.loyalty.expirePoints(dto, actor);

    expect(d.loyaltyService.expirePoints).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates referral creation and qualification (UC-51-12, UC-51-13)', async () => {
    const d = build();
    const createDto = {} as any;
    const qualifyDto = { refereeUserId: ID } as any;
    d.loyaltyService.createReferral.mockResolvedValue({ id: ID });
    d.loyaltyService.qualifyReferral.mockResolvedValue({ referralId: ID });

    await d.loyalty.createReferral(ID, createDto, actor);
    await d.loyalty.qualifyReferral(ID, qualifyDto, actor);

    expect(d.loyaltyService.createReferral).toHaveBeenCalledWith(
      ID,
      createDto,
      actor,
    );
    expect(d.loyaltyService.qualifyReferral).toHaveBeenCalledWith(
      ID,
      qualifyDto,
      actor,
    );
  });
});

describe('PromotionsController', () => {
  it('delegates promotion creation (UC-51-07)', async () => {
    const d = build();
    const dto = { code: 'PROMO-01' } as any;
    d.discountsService.createPromotion.mockResolvedValue({ id: ID });

    await d.promotions.createPromotion(dto, actor);

    expect(d.discountsService.createPromotion).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates coupon issuance (UC-51-08)', async () => {
    const d = build();
    const dto = { couponType: 'BATCH', quantity: 5 } as any;
    d.discountsService.issueCoupons.mockResolvedValue({ issued: 5 });

    await d.promotions.issueCoupons(ID, dto, actor);

    expect(d.discountsService.issueCoupons).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });

  it('delegates validation without an actor: it mutates nothing (UC-51-09)', async () => {
    const d = build();
    const dto = { code: 'SALUD10' } as any;
    d.discountsService.validateCoupon.mockResolvedValue({ valid: true });

    await d.promotions.validateCoupon(dto);

    expect(d.discountsService.validateCoupon).toHaveBeenCalledWith(dto);
  });

  it('delegates redemption (UC-51-09)', async () => {
    const d = build();
    const dto = { code: 'SALUD10' } as any;
    d.discountsService.redeemCoupon.mockResolvedValue({ id: ID });

    await d.promotions.redeemCoupon(dto, actor);

    expect(d.discountsService.redeemCoupon).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates the checkout discount with the order id (UC-51-10)', async () => {
    const d = build();
    const dto = { paymentIntentId: ID } as any;
    d.discountsService.applyDiscount.mockResolvedValue({ redemptionId: ID });

    await d.promotions.applyDiscount(ID, dto, actor);

    expect(d.discountsService.applyDiscount).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });

  it('delegates the reversal (UC-51-11)', async () => {
    const d = build();
    const dto = { reason: 'REFUND' } as any;
    d.discountsService.reverseRedemption.mockResolvedValue({
      redemptionId: ID,
    });

    await d.promotions.reverseRedemption(ID, dto, actor);

    expect(d.discountsService.reverseRedemption).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });

  it('propagates service errors instead of swallowing them', async () => {
    const d = build();
    d.discountsService.createPromotion.mockRejectedValue(new Error('boom'));

    await expect(
      d.promotions.createPromotion({} as any, actor as any),
    ).rejects.toThrow('boom');
  });
});
