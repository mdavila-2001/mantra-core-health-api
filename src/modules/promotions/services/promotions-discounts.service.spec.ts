import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { PromotionsDiscountsService } from './promotions-discounts.service';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';

const actor = { id: 'user-1', roles: ['PROMOTIONS_ADMIN'] };
const TENANT = '11111111-1111-1111-1111-111111111111';
const PROMOTION = '22222222-2222-2222-2222-222222222222';
const REDEEMER = '33333333-3333-3333-3333-333333333333';
const INTENT = '44444444-4444-4444-4444-444444444444';
const ORDER = '55555555-5555-5555-5555-555555555555';
const REDEMPTION = '66666666-6666-6666-6666-666666666666';
const MEMBERSHIP = '77777777-7777-7777-7777-777777777777';

function build() {
  const tx = { flush: mockFn() };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const discountsRepo = {
    createPromotion: mockFn(),
    findPromotionById: mockFn(),
    findPromotionForUpdate: mockFn(),
    findPromotionByCode: mockFn(),
    createDiscountRule: mockFn(),
    findRulesByPromotion: mockFn(),
    createCoupon: mockFn(),
    findCouponByCode: mockFn(),
    findCouponByCodeForUpdate: mockFn(),
    findCouponForUpdate: mockFn(),
    findCouponsByCodes: mockFn(),
    createRedemption: mockFn(),
    findRedemptionForUpdate: mockFn(),
    findRedemptionsByRedeemer: mockFn(),
    findAppliedRedemptions: mockFn(),
    findRedemptionByIntent: mockFn(),
  };
  const loyaltyRepo = {
    findLedgerEntryByKey: mockFn(),
    findMembershipForUpdate: mockFn(),
    createLedgerEntry: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new PromotionsDiscountsService(
    em as any,
    discountsRepo,
    loyaltyRepo as any,
    logger as any,
  );
  return { service, tx, discountsRepo, loyaltyRepo };
}

function activePromotion(overrides: Record<string, unknown> = {}): any {
  return {
    id: PROMOTION,
    statusConceptId: CONCEPTS.PROMOTION_ACTIVE,
    validFrom: new Date('2020-01-01T00:00:00Z'),
    validTo: new Date('2099-01-01T00:00:00Z'),
    currencyConceptId: CONCEPTS.CURRENCY_BOB,
    ...overrides,
  };
}

function activeCoupon(overrides: Record<string, unknown> = {}): any {
  return {
    id: 'coupon-1',
    promotionId: PROMOTION,
    code: 'SALUD10',
    statusConceptId: CONCEPTS.COUPON_ACTIVE,
    maxRedemptions: 1,
    redemptionCount: 0,
    validFrom: new Date('2020-01-01T00:00:00Z'),
    validTo: new Date('2099-01-01T00:00:00Z'),
    ...overrides,
  };
}

function percentageRule(overrides: Record<string, unknown> = {}): any {
  return {
    id: 'rule-1',
    discountTypeConceptId: CONCEPTS.DISCOUNT_PERCENTAGE,
    percentage: '10',
    ...overrides,
  };
}

describe('PromotionsDiscountsService', () => {
  describe('createPromotion (UC-51-07)', () => {
    const dto = {
      tenantId: TENANT,
      code: 'PROMO-01',
      name: 'Chequeo 10%',
      promotionType: 'COUPON' as const,
      validFrom: '2026-01-01T00:00:00Z',
      validTo: '2026-12-31T00:00:00Z',
      rules: [{ discountType: 'PERCENTAGE' as const, percentage: '10' }],
    };

    it('creates the promotion in draft with its rules', async () => {
      const d = build();
      d.discountsRepo.findPromotionByCode.mockResolvedValue(null);
      d.discountsRepo.createPromotion.mockReturnValue({ id: PROMOTION });
      d.discountsRepo.createDiscountRule.mockReturnValue({ id: 'rule-1' });

      const res = await d.service.createPromotion(dto, actor);

      expect(res.statusConceptId).toBe(CONCEPTS.PROMOTION_DRAFT);
      expect(res.ruleIds).toEqual(['rule-1']);
    });

    it('rejects a duplicate code in the tenant', async () => {
      const d = build();
      d.discountsRepo.findPromotionByCode.mockResolvedValue({ id: 'other' });

      await expect(
        d.service.createPromotion(dto, actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects a window that ends before it starts', async () => {
      const d = build();
      d.discountsRepo.findPromotionByCode.mockResolvedValue(null);

      await expect(
        d.service.createPromotion(
          {
            ...dto,
            validFrom: '2026-12-31T00:00:00Z',
            validTo: '2026-01-01T00:00:00Z',
          },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects a percentage outside 0-100', async () => {
      const d = build();
      d.discountsRepo.findPromotionByCode.mockResolvedValue(null);

      await expect(
        d.service.createPromotion(
          {
            ...dto,
            rules: [{ discountType: 'PERCENTAGE' as const, percentage: '150' }],
          },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects a BOGO rule without quantities', async () => {
      const d = build();
      d.discountsRepo.findPromotionByCode.mockResolvedValue(null);

      await expect(
        d.service.createPromotion(
          { ...dto, rules: [{ discountType: 'BOGO' as const }] },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('issueCoupons (UC-51-08)', () => {
    const dto = { couponType: 'BATCH' as const, quantity: 3 };

    it('issues the requested amount of unique codes', async () => {
      const d = build();
      d.discountsRepo.findPromotionById.mockResolvedValue(activePromotion());
      d.discountsRepo.findCouponsByCodes.mockResolvedValue([]);

      const res = await d.service.issueCoupons(PROMOTION, dto, actor);

      expect(res.issued).toBe(3);
      expect(new Set(res.codes).size).toBe(3);
      expect(d.discountsRepo.createCoupon).toHaveBeenCalledTimes(3);
    });

    it('prefixes the codes when asked', async () => {
      const d = build();
      d.discountsRepo.findPromotionById.mockResolvedValue(activePromotion());
      d.discountsRepo.findCouponsByCodes.mockResolvedValue([]);

      const res = await d.service.issueCoupons(
        PROMOTION,
        { ...dto, quantity: 1, codePrefix: 'SALUD' },
        actor,
      );

      expect(res.codes[0].startsWith('SALUD-')).toBe(true);
    });

    it('refuses to issue on a promotion that is not active', async () => {
      const d = build();
      d.discountsRepo.findPromotionById.mockResolvedValue(
        activePromotion({ statusConceptId: CONCEPTS.PROMOTION_DRAFT }),
      );

      await expect(
        d.service.issueCoupons(PROMOTION, dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('requires an assignee for a personal coupon', async () => {
      const d = build();

      await expect(
        d.service.issueCoupons(
          PROMOTION,
          { couponType: 'PERSONAL' as const, quantity: 1 },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses a batch of personal coupons for the same member', async () => {
      const d = build();

      await expect(
        d.service.issueCoupons(
          PROMOTION,
          {
            couponType: 'PERSONAL' as const,
            quantity: 5,
            assignedMemberRefId: REDEEMER,
          },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('validateCoupon (UC-51-09)', () => {
    const dto = {
      code: 'SALUD10',
      orderAmount: '200.00',
      redeemerType: 'USER' as const,
      redeemerRefId: REDEEMER,
    };

    it('reports the discount without mutating anything', async () => {
      const d = build();
      d.discountsRepo.findCouponByCode.mockResolvedValue(activeCoupon());
      d.discountsRepo.findPromotionById.mockResolvedValue(activePromotion());
      d.discountsRepo.findRulesByPromotion.mockResolvedValue([
        percentageRule(),
      ]);

      const res = await d.service.validateCoupon(dto);

      expect(res).toMatchObject({ valid: true, discountAmount: '20.00' });
      expect(d.discountsRepo.createRedemption).not.toHaveBeenCalled();
    });

    it('picks the rule that discounts the most', async () => {
      const d = build();
      d.discountsRepo.findCouponByCode.mockResolvedValue(activeCoupon());
      d.discountsRepo.findPromotionById.mockResolvedValue(activePromotion());
      d.discountsRepo.findRulesByPromotion.mockResolvedValue([
        percentageRule(),
        {
          id: 'rule-2',
          discountTypeConceptId: CONCEPTS.DISCOUNT_FIXED,
          fixedAmount: '50.00',
        },
      ]);

      const res = await d.service.validateCoupon(dto);

      expect(res).toMatchObject({
        discountRuleId: 'rule-2',
        discountAmount: '50.00',
      });
    });

    it('caps the discount at maxDiscountAmount', async () => {
      const d = build();
      d.discountsRepo.findCouponByCode.mockResolvedValue(activeCoupon());
      d.discountsRepo.findPromotionById.mockResolvedValue(activePromotion());
      d.discountsRepo.findRulesByPromotion.mockResolvedValue([
        percentageRule({ percentage: '50', maxDiscountAmount: '30.00' }),
      ]);

      const res = await d.service.validateCoupon(dto);

      expect(res.discountAmount).toBe('30.00');
    });

    it('never discounts more than the order is worth', async () => {
      const d = build();
      d.discountsRepo.findCouponByCode.mockResolvedValue(activeCoupon());
      d.discountsRepo.findPromotionById.mockResolvedValue(activePromotion());
      d.discountsRepo.findRulesByPromotion.mockResolvedValue([
        {
          id: 'rule-1',
          discountTypeConceptId: CONCEPTS.DISCOUNT_FIXED,
          fixedAmount: '999.00',
        },
      ]);

      const res = await d.service.validateCoupon({
        ...dto,
        orderAmount: '100.00',
      });

      expect(res.discountAmount).toBe('100.00');
    });

    it('rejects a rule whose minimum purchase is not met', async () => {
      const d = build();
      d.discountsRepo.findCouponByCode.mockResolvedValue(activeCoupon());
      d.discountsRepo.findPromotionById.mockResolvedValue(activePromotion());
      d.discountsRepo.findRulesByPromotion.mockResolvedValue([
        percentageRule({ minPurchaseAmount: '500.00' }),
      ]);

      const res = await d.service.validateCoupon(dto);

      expect(res.valid).toBe(false);
    });

    it('rejects an exhausted coupon', async () => {
      const d = build();
      d.discountsRepo.findCouponByCode.mockResolvedValue(
        activeCoupon({ redemptionCount: 1, maxRedemptions: 1 }),
      );
      d.discountsRepo.findPromotionById.mockResolvedValue(activePromotion());

      const res = await d.service.validateCoupon(dto);

      expect(res).toMatchObject({ valid: false, reason: 'Cupón agotado' });
    });

    it('rejects a personal coupon presented by someone else', async () => {
      const d = build();
      d.discountsRepo.findCouponByCode.mockResolvedValue(
        activeCoupon({ assignedMemberRefId: 'someone-else' }),
      );
      d.discountsRepo.findPromotionById.mockResolvedValue(activePromotion());

      const res = await d.service.validateCoupon(dto);

      expect(res).toMatchObject({
        valid: false,
        reason: 'Cupón asignado a otro miembro',
      });
    });

    it('rejects an unknown code without throwing', async () => {
      const d = build();
      d.discountsRepo.findCouponByCode.mockResolvedValue(null);

      const res = await d.service.validateCoupon(dto);

      expect(res).toEqual({ valid: false, reason: 'Cupón inexistente' });
    });
  });

  describe('redeemCoupon (UC-51-09)', () => {
    const dto = {
      code: 'SALUD10',
      orderAmount: '200.00',
      redeemerType: 'USER' as const,
      redeemerRefId: REDEEMER,
    };

    it('consumes one use and records the redemption as applied', async () => {
      const d = build();
      const coupon = activeCoupon();
      d.discountsRepo.findCouponByCodeForUpdate.mockResolvedValue(coupon);
      d.discountsRepo.findPromotionForUpdate.mockResolvedValue(
        activePromotion(),
      );
      d.discountsRepo.findRulesByPromotion.mockResolvedValue([
        percentageRule(),
      ]);
      d.discountsRepo.findAppliedRedemptions.mockResolvedValue([]);
      d.discountsRepo.createRedemption.mockReturnValue({ id: REDEMPTION });

      const res = await d.service.redeemCoupon(dto, actor);

      expect(res).toMatchObject({
        id: REDEMPTION,
        discountAmount: '20.00',
        statusConceptId: CONCEPTS.REDEMPTION_APPLIED,
      });
      expect(coupon.redemptionCount).toBe(1);
      // Agotado el único uso, el cupón sale de circulación.
      expect(coupon.statusConceptId).toBe(CONCEPTS.COUPON_EXHAUSTED);
    });

    it('keeps a multi-use coupon active while it has uses left', async () => {
      const d = build();
      const coupon = activeCoupon({ maxRedemptions: 3 });
      d.discountsRepo.findCouponByCodeForUpdate.mockResolvedValue(coupon);
      d.discountsRepo.findPromotionForUpdate.mockResolvedValue(
        activePromotion(),
      );
      d.discountsRepo.findRulesByPromotion.mockResolvedValue([
        percentageRule(),
      ]);
      d.discountsRepo.findAppliedRedemptions.mockResolvedValue([]);
      d.discountsRepo.createRedemption.mockReturnValue({ id: REDEMPTION });

      await d.service.redeemCoupon(dto, actor);

      expect(coupon.statusConceptId).toBe(CONCEPTS.COUPON_ACTIVE);
    });

    it('refuses once the promotion hit its total redemption limit', async () => {
      const d = build();
      d.discountsRepo.findCouponByCodeForUpdate.mockResolvedValue(
        activeCoupon(),
      );
      d.discountsRepo.findPromotionForUpdate.mockResolvedValue(
        activePromotion({ totalRedemptionLimit: 1 }),
      );
      d.discountsRepo.findRulesByPromotion.mockResolvedValue([
        percentageRule(),
      ]);
      d.discountsRepo.findAppliedRedemptions.mockResolvedValue([
        { id: 'r1', redeemerRefId: 'other', discountAmount: '10.00' },
      ]);

      await expect(
        d.service.redeemCoupon(dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses once the user hit their per-user limit', async () => {
      const d = build();
      d.discountsRepo.findCouponByCodeForUpdate.mockResolvedValue(
        activeCoupon(),
      );
      d.discountsRepo.findPromotionForUpdate.mockResolvedValue(
        activePromotion({ perUserLimit: 1 }),
      );
      d.discountsRepo.findRulesByPromotion.mockResolvedValue([
        percentageRule(),
      ]);
      d.discountsRepo.findAppliedRedemptions.mockResolvedValue([
        { id: 'r1', redeemerRefId: REDEEMER, discountAmount: '10.00' },
      ]);

      await expect(
        d.service.redeemCoupon(dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses once the promotion burned its budget', async () => {
      const d = build();
      d.discountsRepo.findCouponByCodeForUpdate.mockResolvedValue(
        activeCoupon(),
      );
      d.discountsRepo.findPromotionForUpdate.mockResolvedValue(
        activePromotion({ budgetAmount: '100.00' }),
      );
      d.discountsRepo.findRulesByPromotion.mockResolvedValue([
        percentageRule(),
      ]);
      d.discountsRepo.findAppliedRedemptions.mockResolvedValue([
        { id: 'r1', redeemerRefId: 'other', discountAmount: '100.00' },
      ]);

      await expect(
        d.service.redeemCoupon(dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('fails when the code does not exist', async () => {
      const d = build();
      d.discountsRepo.findCouponByCodeForUpdate.mockResolvedValue(null);

      await expect(
        d.service.redeemCoupon(dto, actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('applyDiscount (UC-51-10)', () => {
    const dto = {
      paymentIntentId: INTENT,
      orderAmount: '200.00',
      redeemerType: 'USER' as const,
      redeemerRefId: REDEEMER,
      couponCode: 'SALUD10',
    };

    it('registers the redemption and reports the net amount', async () => {
      const d = build();
      d.discountsRepo.findCouponByCodeForUpdate.mockResolvedValue(
        activeCoupon(),
      );
      d.discountsRepo.findPromotionForUpdate.mockResolvedValue(
        activePromotion(),
      );
      d.discountsRepo.findRulesByPromotion.mockResolvedValue([
        percentageRule(),
      ]);
      d.discountsRepo.findAppliedRedemptions.mockResolvedValue([]);
      d.discountsRepo.findRedemptionByIntent.mockResolvedValue(null);
      d.discountsRepo.createRedemption.mockReturnValue({ id: REDEMPTION });

      const res = await d.service.applyDiscount(ORDER, dto, actor);

      expect(res).toMatchObject({
        redemptionId: REDEMPTION,
        discountAmount: '20.00',
        netAmount: '180.00',
        duplicate: false,
      });
    });

    it('is idempotent for the same intent and promotion', async () => {
      const d = build();
      d.discountsRepo.findCouponByCodeForUpdate.mockResolvedValue(
        activeCoupon(),
      );
      d.discountsRepo.findPromotionForUpdate.mockResolvedValue(
        activePromotion(),
      );
      d.discountsRepo.findRulesByPromotion.mockResolvedValue([
        percentageRule(),
      ]);
      d.discountsRepo.findAppliedRedemptions.mockResolvedValue([]);
      d.discountsRepo.findRedemptionByIntent.mockResolvedValue({
        id: 'redemption-prev',
        discountAmount: '20.00',
      });

      const res = await d.service.applyDiscount(ORDER, dto, actor);

      expect(res).toMatchObject({
        redemptionId: 'redemption-prev',
        netAmount: '180.00',
        duplicate: true,
      });
      expect(d.discountsRepo.createRedemption).not.toHaveBeenCalled();
    });

    it('applies an automatic promotion with no coupon', async () => {
      const d = build();
      d.discountsRepo.findPromotionForUpdate.mockResolvedValue(
        activePromotion(),
      );
      d.discountsRepo.findRulesByPromotion.mockResolvedValue([
        percentageRule(),
      ]);
      d.discountsRepo.findAppliedRedemptions.mockResolvedValue([]);
      d.discountsRepo.findRedemptionByIntent.mockResolvedValue(null);
      d.discountsRepo.createRedemption.mockReturnValue({ id: REDEMPTION });

      const res = await d.service.applyDiscount(
        ORDER,
        { ...dto, couponCode: undefined, promotionId: PROMOTION },
        actor,
      );

      expect(res.discountAmount).toBe('20.00');
      expect(d.discountsRepo.findCouponByCodeForUpdate).not.toHaveBeenCalled();
    });

    it('requires either a coupon or a promotion', async () => {
      const d = build();

      await expect(
        d.service.applyDiscount(
          ORDER,
          { ...dto, couponCode: undefined },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses an automatic promotion that is out of its window', async () => {
      const d = build();
      d.discountsRepo.findPromotionForUpdate.mockResolvedValue(
        activePromotion({ validTo: new Date('2020-01-02T00:00:00Z') }),
      );

      await expect(
        d.service.applyDiscount(
          ORDER,
          { ...dto, couponCode: undefined, promotionId: PROMOTION },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('reverseRedemption (UC-51-11)', () => {
    function appliedRedemption(overrides: Record<string, unknown> = {}): any {
      return {
        id: REDEMPTION,
        promotionId: PROMOTION,
        couponId: 'coupon-1',
        statusConceptId: CONCEPTS.REDEMPTION_APPLIED,
        discountAmount: '20.00',
        ...overrides,
      };
    }

    it('reverses the redemption and gives the coupon use back', async () => {
      const d = build();
      const redemption = appliedRedemption();
      d.discountsRepo.findRedemptionForUpdate.mockResolvedValue(redemption);
      const coupon = activeCoupon({
        redemptionCount: 1,
        statusConceptId: CONCEPTS.COUPON_EXHAUSTED,
      });
      d.discountsRepo.findCouponForUpdate.mockResolvedValue(coupon);

      const res = await d.service.reverseRedemption(
        REDEMPTION,
        { reason: 'REFUND' as const },
        actor,
      );

      expect(res.statusConceptId).toBe(CONCEPTS.REDEMPTION_REVERSED);
      expect(coupon.redemptionCount).toBe(0);
      expect(coupon.statusConceptId).toBe(CONCEPTS.COUPON_ACTIVE);
    });

    it('compensates the points with an adjustment entry instead of deleting', async () => {
      const d = build();
      d.discountsRepo.findRedemptionForUpdate.mockResolvedValue(
        appliedRedemption(),
      );
      d.discountsRepo.findCouponForUpdate.mockResolvedValue(activeCoupon());
      d.loyaltyRepo.findLedgerEntryByKey.mockResolvedValue(null);
      const membership: any = { id: MEMBERSHIP, pointsBalance: '10.00' };
      d.loyaltyRepo.findMembershipForUpdate.mockResolvedValue(membership);
      d.loyaltyRepo.createLedgerEntry.mockReturnValue({ id: 'led-adjust' });

      const res = await d.service.reverseRedemption(
        REDEMPTION,
        {
          reason: 'CANCEL' as const,
          membershipId: MEMBERSHIP,
          restorePoints: '30',
        },
        actor,
      );

      expect(res.ledgerEntryId).toBe('led-adjust');
      expect(membership.pointsBalance).toBe('40.00');
      expect(d.loyaltyRepo.createLedgerEntry).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ directionConceptId: CONCEPTS.POINTS_ADJUST }),
      );
    });

    it('does not restore the points twice on a repeated reversal attempt', async () => {
      const d = build();
      d.discountsRepo.findRedemptionForUpdate.mockResolvedValue(
        appliedRedemption(),
      );
      d.discountsRepo.findCouponForUpdate.mockResolvedValue(activeCoupon());
      d.loyaltyRepo.findLedgerEntryByKey.mockResolvedValue({
        id: 'led-existing',
      });

      const res = await d.service.reverseRedemption(
        REDEMPTION,
        {
          reason: 'CANCEL' as const,
          membershipId: MEMBERSHIP,
          restorePoints: '30',
        },
        actor,
      );

      expect(res.ledgerEntryId).toBe('led-existing');
      expect(d.loyaltyRepo.createLedgerEntry).not.toHaveBeenCalled();
    });

    it('rejects reversing a redemption that is already reversed', async () => {
      const d = build();
      d.discountsRepo.findRedemptionForUpdate.mockResolvedValue(
        appliedRedemption({ statusConceptId: CONCEPTS.REDEMPTION_REVERSED }),
      );

      await expect(
        d.service.reverseRedemption(
          REDEMPTION,
          { reason: 'REFUND' as const },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('fails when the redemption does not exist', async () => {
      const d = build();
      d.discountsRepo.findRedemptionForUpdate.mockResolvedValue(null);

      await expect(
        d.service.reverseRedemption(
          REDEMPTION,
          { reason: 'REFUND' as const },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });
});
