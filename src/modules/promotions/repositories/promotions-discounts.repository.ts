import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import { Promotions, DiscountRules, Coupons, Redemptions } from '../entities';
import { createdBy } from '../../../common';

export interface CreatePromotionData {
  tenantId: string;
  code: string;
  name: string;
  promotionTypeConceptId: string;
  description?: string;
  campaignRefId?: string;
  priority: number;
  stackable: boolean;
  budgetAmount?: string;
  currencyConceptId?: string;
  totalRedemptionLimit?: number;
  perUserLimit?: number;
  validFrom?: Date;
  validTo?: Date;
  statusConceptId: string;
  actorUserId?: string;
}

export interface CreateDiscountRuleData {
  promotionId: string;
  discountTypeConceptId: string;
  percentage?: string;
  fixedAmount?: string;
  currencyConceptId?: string;
  maxDiscountAmount?: string;
  minPurchaseAmount?: string;
  appliesToConceptId?: string;
  targetFilterJson?: unknown;
  buyQuantity?: number;
  getQuantity?: number;
  actorUserId?: string;
}

export interface CreateCouponData {
  promotionId: string;
  code: string;
  couponTypeConceptId: string;
  assignedMemberTypeConceptId?: string;
  assignedMemberRefId?: string;
  maxRedemptions?: number;
  validFrom?: Date;
  validTo?: Date;
  statusConceptId: string;
  actorUserId?: string;
}

export interface CreateRedemptionData {
  promotionId: string;
  couponId?: string;
  discountRuleId?: string;
  redeemerTypeConceptId: string;
  redeemerRefId: string;
  discountAmount: string;
  currencyConceptId: string;
  orderRefType?: string;
  orderRefId?: string;
  paymentIntentId?: string;
  statusConceptId: string;
  actorUserId?: string;
}

/**
 * Acceso a la parte de descuentos de `promotions.*`: promociones, reglas de
 * descuento, cupones y redenciones. Sin reglas de negocio.
 */
@Injectable()
export class PromotionsDiscountsRepository {
  // --- Promociones y reglas (UC-51-07) ---

  createPromotion(em: EntityManager, data: CreatePromotionData): Promotions {
    return em.create(
      Promotions,
      {
        tenantId: data.tenantId,
        code: data.code,
        name: data.name,
        promotionTypeConceptId: data.promotionTypeConceptId,
        description: data.description,
        campaignRefId: data.campaignRefId,
        priority: data.priority,
        stackable: data.stackable,
        budgetAmount: data.budgetAmount,
        currencyConceptId: data.currencyConceptId,
        totalRedemptionLimit: data.totalRedemptionLimit,
        perUserLimit: data.perUserLimit,
        validFrom: data.validFrom,
        validTo: data.validTo,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  findPromotionById(em: EntityManager, id: string): Promise<Promotions | null> {
    return em.findOne(Promotions, { id });
  }

  findPromotionForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<Promotions | null> {
    return em.findOne(
      Promotions,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  findPromotionByCode(
    em: EntityManager,
    tenantId: string,
    code: string,
  ): Promise<Promotions | null> {
    return em.findOne(Promotions, { tenantId, code });
  }

  createDiscountRule(
    em: EntityManager,
    data: CreateDiscountRuleData,
  ): DiscountRules {
    return em.create(
      DiscountRules,
      {
        promotionId: data.promotionId,
        discountTypeConceptId: data.discountTypeConceptId,
        percentage: data.percentage,
        fixedAmount: data.fixedAmount,
        currencyConceptId: data.currencyConceptId,
        maxDiscountAmount: data.maxDiscountAmount,
        minPurchaseAmount: data.minPurchaseAmount,
        appliesToConceptId: data.appliesToConceptId,
        targetFilterJson: data.targetFilterJson,
        buyQuantity: data.buyQuantity,
        getQuantity: data.getQuantity,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  findRulesByPromotion(
    em: EntityManager,
    promotionId: string,
  ): Promise<DiscountRules[]> {
    return em.find(DiscountRules, { promotionId });
  }

  // --- Cupones (UC-51-08, UC-51-09) ---

  createCoupon(em: EntityManager, data: CreateCouponData): Coupons {
    return em.create(
      Coupons,
      {
        promotionId: data.promotionId,
        code: data.code,
        couponTypeConceptId: data.couponTypeConceptId,
        assignedMemberTypeConceptId: data.assignedMemberTypeConceptId,
        assignedMemberRefId: data.assignedMemberRefId,
        maxRedemptions: data.maxRedemptions,
        redemptionCount: 0,
        validFrom: data.validFrom,
        validTo: data.validTo,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  findCouponByCode(em: EntityManager, code: string): Promise<Coupons | null> {
    return em.findOne(Coupons, { code });
  }

  /** Redimir compite con otras cajas: el cupón se toma bloqueado para no sobre-redimir. */
  findCouponByCodeForUpdate(
    em: EntityManager,
    code: string,
  ): Promise<Coupons | null> {
    return em.findOne(
      Coupons,
      { code },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  findCouponForUpdate(em: EntityManager, id: string): Promise<Coupons | null> {
    return em.findOne(
      Coupons,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /** Códigos ya usados en el lote: la generación reintenta si colisiona. */
  findCouponsByCodes(em: EntityManager, codes: string[]): Promise<Coupons[]> {
    return em.find(Coupons, { code: { $in: codes } });
  }

  // --- Redenciones (UC-51-09, UC-51-10, UC-51-11) ---

  createRedemption(em: EntityManager, data: CreateRedemptionData): Redemptions {
    return em.create(
      Redemptions,
      {
        promotionId: data.promotionId,
        couponId: data.couponId,
        discountRuleId: data.discountRuleId,
        redeemerTypeConceptId: data.redeemerTypeConceptId,
        redeemerRefId: data.redeemerRefId,
        discountAmount: data.discountAmount,
        currencyConceptId: data.currencyConceptId,
        orderRefType: data.orderRefType,
        orderRefId: data.orderRefId,
        paymentIntentId: data.paymentIntentId,
        redeemedAt: new Date(),
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  findRedemptionForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<Redemptions | null> {
    return em.findOne(
      Redemptions,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /** Redenciones de la promoción por un mismo usuario, para el tope por usuario. */
  findRedemptionsByRedeemer(
    em: EntityManager,
    promotionId: string,
    redeemerRefId: string,
    appliedStatusConceptId: string,
  ): Promise<Redemptions[]> {
    return em.find(Redemptions, {
      promotionId,
      redeemerRefId,
      statusConceptId: appliedStatusConceptId,
    });
  }

  /** Redenciones vigentes de la promoción: dan el tope total y el presupuesto consumido. */
  findAppliedRedemptions(
    em: EntityManager,
    promotionId: string,
    appliedStatusConceptId: string,
  ): Promise<Redemptions[]> {
    return em.find(Redemptions, {
      promotionId,
      statusConceptId: appliedStatusConceptId,
    });
  }

  /** Redención ya registrada para el par intento-promoción: hace idempotente UC-51-10. */
  findRedemptionByIntent(
    em: EntityManager,
    paymentIntentId: string,
    promotionId: string,
  ): Promise<Redemptions | null> {
    return em.findOne(Redemptions, { paymentIntentId, promotionId });
  }
}
