import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import { Promotions, DiscountRules, Coupons, Redemptions } from '../entities';
import { createdBy } from '../../../common';

/**
 * Describe el contrato estructural de create promotion data.
 */
export interface CreatePromotionData {
  /**
   * Identificador asociado a tenant.
   */
  tenantId: string;
  /**
   * Valor de code mantenido por la instancia.
   */
  code: string;
  /**
   * Valor de name mantenido por la instancia.
   */
  name: string;
  /**
   * Identificador asociado a promotion type concept.
   */
  promotionTypeConceptId: string;
  /**
   * Valor de description mantenido por la instancia.
   */
  description?: string;
  /**
   * Identificador asociado a campaign ref.
   */
  campaignRefId?: string;
  /**
   * Valor de priority mantenido por la instancia.
   */
  priority: number;
  /**
   * Valor de stackable mantenido por la instancia.
   */
  stackable: boolean;
  /**
   * Valor de budget amount mantenido por la instancia.
   */
  budgetAmount?: string;
  /**
   * Identificador asociado a currency concept.
   */
  currencyConceptId?: string;
  /**
   * Valor de total redemption limit mantenido por la instancia.
   */
  totalRedemptionLimit?: number;
  /**
   * Valor de per user limit mantenido por la instancia.
   */
  perUserLimit?: number;
  /**
   * Valor de valid from mantenido por la instancia.
   */
  validFrom?: Date;
  /**
   * Valor de valid to mantenido por la instancia.
   */
  validTo?: Date;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create discount rule data.
 */
export interface CreateDiscountRuleData {
  /**
   * Identificador asociado a promotion.
   */
  promotionId: string;
  /**
   * Identificador asociado a discount type concept.
   */
  discountTypeConceptId: string;
  /**
   * Valor de percentage mantenido por la instancia.
   */
  percentage?: string;
  /**
   * Valor de fixed amount mantenido por la instancia.
   */
  fixedAmount?: string;
  /**
   * Identificador asociado a currency concept.
   */
  currencyConceptId?: string;
  /**
   * Valor de max discount amount mantenido por la instancia.
   */
  maxDiscountAmount?: string;
  /**
   * Valor de min purchase amount mantenido por la instancia.
   */
  minPurchaseAmount?: string;
  /**
   * Identificador asociado a applies to concept.
   */
  appliesToConceptId?: string;
  /**
   * Valor de target filter json mantenido por la instancia.
   */
  targetFilterJson?: unknown;
  /**
   * Valor de buy quantity mantenido por la instancia.
   */
  buyQuantity?: number;
  /**
   * Valor de get quantity mantenido por la instancia.
   */
  getQuantity?: number;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create coupon data.
 */
export interface CreateCouponData {
  /**
   * Identificador asociado a promotion.
   */
  promotionId: string;
  /**
   * Valor de code mantenido por la instancia.
   */
  code: string;
  /**
   * Identificador asociado a coupon type concept.
   */
  couponTypeConceptId: string;
  /**
   * Identificador asociado a assigned member type concept.
   */
  assignedMemberTypeConceptId?: string;
  /**
   * Identificador asociado a assigned member ref.
   */
  assignedMemberRefId?: string;
  /**
   * Valor de max redemptions mantenido por la instancia.
   */
  maxRedemptions?: number;
  /**
   * Valor de valid from mantenido por la instancia.
   */
  validFrom?: Date;
  /**
   * Valor de valid to mantenido por la instancia.
   */
  validTo?: Date;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create redemption data.
 */
export interface CreateRedemptionData {
  /**
   * Identificador asociado a promotion.
   */
  promotionId: string;
  /**
   * Identificador asociado a coupon.
   */
  couponId?: string;
  /**
   * Identificador asociado a discount rule.
   */
  discountRuleId?: string;
  /**
   * Identificador asociado a redeemer type concept.
   */
  redeemerTypeConceptId: string;
  /**
   * Identificador asociado a redeemer ref.
   */
  redeemerRefId: string;
  /**
   * Valor de discount amount mantenido por la instancia.
   */
  discountAmount: string;
  /**
   * Identificador asociado a currency concept.
   */
  currencyConceptId: string;
  /**
   * Valor de order ref type mantenido por la instancia.
   */
  orderRefType?: string;
  /**
   * Identificador asociado a order ref.
   */
  orderRefId?: string;
  /**
   * Identificador asociado a payment intent.
   */
  paymentIntentId?: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Acceso a la parte de descuentos de `promotions.*`: promociones, reglas de
 * descuento, cupones y redenciones. Sin reglas de negocio.
 */
@Injectable()
export class PromotionsDiscountsRepository {
  // --- Promociones y reglas (UC-51-07) ---

  /**
   * Crea create promotion.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create promotion conforme al contrato `Promotions`.
   */
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

  /**
   * Obtiene find promotion by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find promotion by id conforme al contrato `Promise<Promotions | null>`.
   */
  findPromotionById(em: EntityManager, id: string): Promise<Promotions | null> {
    return em.findOne(Promotions, { id });
  }

  /**
   * Obtiene find promotion for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find promotion for update conforme al contrato `Promise<Promotions | null>`.
   */
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

  /**
   * Obtiene find promotion by code.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Identificador de tenant.
   * @param code - Valor de code requerido por la operación.
   * @returns Resultado de find promotion by code conforme al contrato `Promise<Promotions | null>`.
   */
  findPromotionByCode(
    em: EntityManager,
    tenantId: string,
    code: string,
  ): Promise<Promotions | null> {
    return em.findOne(Promotions, { tenantId, code });
  }

  /**
   * Crea create discount rule.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create discount rule conforme al contrato `DiscountRules`.
   */
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

  /**
   * Obtiene find rules by promotion.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param promotionId - Identificador de promotion.
   * @returns Resultado de find rules by promotion conforme al contrato `Promise<DiscountRules[]>`.
   */
  findRulesByPromotion(
    em: EntityManager,
    promotionId: string,
  ): Promise<DiscountRules[]> {
    return em.find(DiscountRules, { promotionId });
  }

  // --- Cupones (UC-51-08, UC-51-09) ---

  /**
   * Crea create coupon.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create coupon conforme al contrato `Coupons`.
   */
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

  /**
   * Obtiene find coupon by code.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param code - Valor de code requerido por la operación.
   * @returns Resultado de find coupon by code conforme al contrato `Promise<Coupons | null>`.
   */
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

  /**
   * Obtiene find coupon for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find coupon for update conforme al contrato `Promise<Coupons | null>`.
   */
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

  /**
   * Crea create redemption.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create redemption conforme al contrato `Redemptions`.
   */
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

  /**
   * Obtiene find redemption for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find redemption for update conforme al contrato `Promise<Redemptions | null>`.
   */
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
