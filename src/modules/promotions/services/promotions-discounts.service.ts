import { randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import {
  PromotionsDiscountsRepository,
  PromotionsLoyaltyRepository,
} from '../repositories';
import { Coupons, DiscountRules, Promotions } from '../entities';
import { REWARD_MEMBER_CONCEPT } from './promotions-loyalty.service';
import {
  CreatePromotionDto,
  PromotionResponseDto,
  IssueCouponsDto,
  IssueCouponsResponseDto,
  ValidateCouponDto,
  ValidateCouponResponseDto,
  CreateRedemptionDto,
  RedemptionResponseDto,
  ApplyDiscountDto,
  ApplyDiscountResponseDto,
  ReverseRedemptionDto,
  ReverseRedemptionResponseDto,
  type PromotionType,
  type DiscountType,
  type DiscountTarget,
  type CouponType,
} from '../dto';

const PROMOTION_TYPE_CONCEPT: Readonly<Record<PromotionType, string>> = {
  AUTOMATIC: CONCEPTS.PROMOTION_TYPE_AUTOMATIC,
  COUPON: CONCEPTS.PROMOTION_TYPE_COUPON,
};

const DISCOUNT_TYPE_CONCEPT: Readonly<Record<DiscountType, string>> = {
  PERCENTAGE: CONCEPTS.DISCOUNT_PERCENTAGE,
  FIXED: CONCEPTS.DISCOUNT_FIXED,
  BOGO: CONCEPTS.DISCOUNT_BOGO,
};

const DISCOUNT_TARGET_CONCEPT: Readonly<Record<DiscountTarget, string>> = {
  ORDER: CONCEPTS.DISCOUNT_TARGET_ORDER,
  ITEM: CONCEPTS.DISCOUNT_TARGET_ITEM,
  CATEGORY: CONCEPTS.DISCOUNT_TARGET_CATEGORY,
};

const COUPON_TYPE_CONCEPT: Readonly<Record<CouponType, string>> = {
  PUBLIC: CONCEPTS.COUPON_PUBLIC,
  SINGLE_USE: CONCEPTS.COUPON_SINGLE_USE,
  PERSONAL: CONCEPTS.COUPON_PERSONAL,
  BATCH: CONCEPTS.COUPON_BATCH,
};

const COUPON_CODE_BYTES = 6;
const MAX_CODE_ATTEMPTS = 5;

/** Resultado de evaluar un cupón contra una orden. */
interface CouponEvaluation {
  /**
   * Valor de coupon mantenido por la instancia.
   */
  coupon: Coupons;
  /**
   * Valor de promotion mantenido por la instancia.
   */
  promotion: Promotions;
  /**
   * Valor de rule mantenido por la instancia.
   */
  rule: DiscountRules;
  /**
   * Valor de discount amount mantenido por la instancia.
   */
  discountAmount: string;
}

/**
 * Promociones, reglas de descuento, cupones y redenciones
 * (UC-51-07 … UC-51-11).
 */
@Injectable()
export class PromotionsDiscountsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param discountsRepo - Valor de discounts repo requerido por la operación.
   * @param loyaltyRepo - Valor de loyalty repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly discountsRepo: PromotionsDiscountsRepository,
    private readonly loyaltyRepo: PromotionsLoyaltyRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PromotionsDiscountsService.name);
  }

  /** UC-51-07: crear la promoción con sus reglas de descuento. */
  async createPromotion(
    dto: CreatePromotionDto,
    actor: AuthenticatedUser,
  ): Promise<PromotionResponseDto> {
    this.logger.info(
      {
        operation: 'promotions.promotion.create',
        tenantId: dto.tenantId,
        code: dto.code,
      },
      'Creating promotion',
    );

    const duplicate = await this.discountsRepo.findPromotionByCode(
      this.em,
      dto.tenantId,
      dto.code,
    );
    if (duplicate) {
      throw new ConflictException('Ya existe una promoción con ese código', {
        tenantId: dto.tenantId,
        code: dto.code,
      });
    }

    const validFrom = new Date(dto.validFrom);
    const validTo = new Date(dto.validTo);
    if (validTo <= validFrom) {
      throw new PreconditionFailedException(
        'La promoción debe terminar después de empezar',
        {
          validFrom: dto.validFrom,
          validTo: dto.validTo,
        },
      );
    }
    dto.rules.forEach((rule) => this.assertRuleShape(rule));

    return this.em.transactional(async (tx) => {
      const promotion = this.discountsRepo.createPromotion(tx, {
        tenantId: dto.tenantId,
        code: dto.code,
        name: dto.name,
        promotionTypeConceptId: PROMOTION_TYPE_CONCEPT[dto.promotionType],
        description: dto.description,
        campaignRefId: dto.campaignRefId,
        priority: dto.priority ?? 0,
        stackable: dto.stackable ?? false,
        budgetAmount: dto.budgetAmount,
        currencyConceptId: dto.currencyConceptId,
        totalRedemptionLimit: dto.totalRedemptionLimit,
        perUserLimit: dto.perUserLimit,
        validFrom,
        validTo,
        // Nace en borrador: emitir cupones o redimir exige activarla, que es lo
        // que separa diseñar una promoción de ponerla a costar dinero.
        statusConceptId: CONCEPTS.PROMOTION_DRAFT,
        actorUserId: actor.id,
      });

      const ruleIds = dto.rules.map(
        (rule) =>
          this.discountsRepo.createDiscountRule(tx, {
            promotionId: promotion.id,
            discountTypeConceptId: DISCOUNT_TYPE_CONCEPT[rule.discountType],
            percentage: rule.percentage,
            fixedAmount: rule.fixedAmount,
            currencyConceptId: rule.currencyConceptId ?? dto.currencyConceptId,
            maxDiscountAmount: rule.maxDiscountAmount,
            minPurchaseAmount: rule.minPurchaseAmount,
            appliesToConceptId: rule.appliesTo
              ? DISCOUNT_TARGET_CONCEPT[rule.appliesTo]
              : CONCEPTS.DISCOUNT_TARGET_ORDER,
            targetFilterJson: rule.targetFilterJson,
            buyQuantity: rule.buyQuantity,
            getQuantity: rule.getQuantity,
            actorUserId: actor.id,
          }).id,
      );

      return {
        id: promotion.id,
        code: dto.code,
        statusConceptId: CONCEPTS.PROMOTION_DRAFT,
        ruleIds,
      };
    });
  }

  /** UC-51-08: emitir un lote de cupones con códigos únicos. */
  async issueCoupons(
    promotionId: string,
    dto: IssueCouponsDto,
    actor: AuthenticatedUser,
  ): Promise<IssueCouponsResponseDto> {
    this.logger.info(
      {
        operation: 'promotions.coupon.issue',
        promotionId,
        quantity: dto.quantity,
      },
      'Issuing coupon batch',
    );

    if (dto.couponType === 'PERSONAL' && !dto.assignedMemberRefId) {
      throw new PreconditionFailedException(
        'Un cupón PERSONAL necesita miembro asignado',
        {
          promotionId,
        },
      );
    }
    // Un lote de cupones personales para un mismo miembro no tiene lectura de
    // negocio: el cupón es suyo, y uno basta.
    if (dto.couponType === 'PERSONAL' && dto.quantity > 1) {
      throw new PreconditionFailedException(
        'Un cupón PERSONAL se emite de uno en uno',
        { promotionId, quantity: dto.quantity },
      );
    }

    return this.em.transactional(async (tx) => {
      const promotion = await this.discountsRepo.findPromotionById(
        tx,
        promotionId,
      );
      if (!promotion) {
        throw new ResourceNotFoundException('Promoción no encontrada', {
          promotionId,
        });
      }
      if (promotion.statusConceptId !== CONCEPTS.PROMOTION_ACTIVE) {
        throw new PreconditionFailedException('La promoción no está activa', {
          promotionId,
          statusConceptId: promotion.statusConceptId,
        });
      }

      const codes = await this.generateCouponCodes(
        tx,
        dto.quantity,
        dto.codePrefix,
      );
      for (const code of codes) {
        this.discountsRepo.createCoupon(tx, {
          promotionId,
          code,
          couponTypeConceptId: COUPON_TYPE_CONCEPT[dto.couponType],
          assignedMemberTypeConceptId: dto.assignedMemberType
            ? REWARD_MEMBER_CONCEPT[dto.assignedMemberType]
            : undefined,
          assignedMemberRefId: dto.assignedMemberRefId,
          maxRedemptions: dto.maxRedemptions ?? 1,
          validFrom: dto.validFrom
            ? new Date(dto.validFrom)
            : promotion.validFrom,
          validTo: dto.validTo ? new Date(dto.validTo) : promotion.validTo,
          statusConceptId: CONCEPTS.COUPON_ACTIVE,
          actorUserId: actor.id,
        });
      }

      return { promotionId, issued: codes.length, codes };
    });
  }

  /**
   * UC-51-09: comprobar si el cupón sirve para la orden. No muta nada: el
   * checkout necesita saberlo antes de cobrar, y muchas veces sin llegar a usarlo.
   */
  async validateCoupon(
    dto: ValidateCouponDto,
  ): Promise<ValidateCouponResponseDto> {
    this.logger.info(
      { operation: 'promotions.coupon.validate', code: dto.code },
      'Validating coupon',
    );

    const coupon = await this.discountsRepo.findCouponByCode(this.em, dto.code);
    if (!coupon) return { valid: false, reason: 'Cupón inexistente' };

    const promotion = await this.discountsRepo.findPromotionById(
      this.em,
      coupon.promotionId,
    );
    if (!promotion) return { valid: false, reason: 'Promoción inexistente' };

    const rejection = this.rejectionReason(coupon, promotion, dto);
    if (rejection) return { valid: false, reason: rejection };

    const rules = await this.discountsRepo.findRulesByPromotion(
      this.em,
      promotion.id,
    );
    const best = this.bestRule(rules, dto.orderAmount);
    if (!best) {
      return {
        valid: false,
        reason: 'Ninguna regla aplica al importe de la orden',
      };
    }

    const perUser = await this.perUserRejection(promotion, dto.redeemerRefId);
    if (perUser) return { valid: false, reason: perUser };

    return {
      valid: true,
      promotionId: promotion.id,
      discountRuleId: best.rule.id,
      discountAmount: best.amount,
    };
  }

  /** UC-51-09: redimir el cupón y dejar registrada la redención. */
  async redeemCoupon(
    dto: CreateRedemptionDto,
    actor: AuthenticatedUser,
  ): Promise<RedemptionResponseDto> {
    this.logger.info(
      { operation: 'promotions.redemption.create', code: dto.code },
      'Redeeming coupon',
    );

    return this.em.transactional(async (tx) => {
      const evaluation = await this.evaluateCouponForUpdate(tx, dto.code, dto);

      evaluation.coupon.redemptionCount =
        (evaluation.coupon.redemptionCount ?? 0) + 1;
      if (
        evaluation.coupon.maxRedemptions &&
        evaluation.coupon.redemptionCount >= evaluation.coupon.maxRedemptions
      ) {
        evaluation.coupon.statusConceptId = CONCEPTS.COUPON_EXHAUSTED;
      }
      touch(evaluation.coupon, actor.id);

      const redemption = this.discountsRepo.createRedemption(tx, {
        promotionId: evaluation.promotion.id,
        couponId: evaluation.coupon.id,
        discountRuleId: evaluation.rule.id,
        redeemerTypeConceptId: REWARD_MEMBER_CONCEPT[dto.redeemerType],
        redeemerRefId: dto.redeemerRefId,
        discountAmount: evaluation.discountAmount,
        currencyConceptId:
          dto.currencyConceptId ??
          evaluation.promotion.currencyConceptId ??
          CONCEPTS.CURRENCY_BOB,
        orderRefType: dto.orderRefType,
        orderRefId: dto.orderRefId,
        paymentIntentId: dto.paymentIntentId,
        statusConceptId: CONCEPTS.REDEMPTION_APPLIED,
        actorUserId: actor.id,
      });

      return {
        id: redemption.id,
        promotionId: evaluation.promotion.id,
        discountAmount: evaluation.discountAmount,
        statusConceptId: CONCEPTS.REDEMPTION_APPLIED,
      };
    });
  }

  /**
   * UC-51-10: aplicar el descuento a un intento de pago. Idempotente por el par
   * intento-promoción: reintentar el checkout no descuenta dos veces.
   */
  async applyDiscount(
    orderId: string,
    dto: ApplyDiscountDto,
    actor: AuthenticatedUser,
  ): Promise<ApplyDiscountResponseDto> {
    this.logger.info(
      {
        operation: 'promotions.checkout.apply-discount',
        orderId,
        paymentIntentId: dto.paymentIntentId,
      },
      'Applying discount to checkout',
    );

    if (!dto.couponCode && !dto.promotionId) {
      throw new PreconditionFailedException(
        'Hay que indicar el cupón o la promoción automática a aplicar',
        { orderId },
      );
    }

    return this.em.transactional(async (tx) => {
      let promotion: Promotions;
      let rule: DiscountRules;
      let coupon: Coupons | undefined;
      let discountAmount: string;

      if (dto.couponCode) {
        const evaluation = await this.evaluateCouponForUpdate(
          tx,
          dto.couponCode,
          {
            orderAmount: dto.orderAmount,
            redeemerType: dto.redeemerType,
            redeemerRefId: dto.redeemerRefId,
          },
        );
        ({ promotion, rule, coupon, discountAmount } = {
          promotion: evaluation.promotion,
          rule: evaluation.rule,
          coupon: evaluation.coupon,
          discountAmount: evaluation.discountAmount,
        });
      } else {
        const found = await this.discountsRepo.findPromotionForUpdate(
          tx,
          dto.promotionId!,
        );
        if (!found) {
          throw new ResourceNotFoundException('Promoción no encontrada', {
            promotionId: dto.promotionId,
          });
        }
        this.assertPromotionUsable(found);
        const rules = await this.discountsRepo.findRulesByPromotion(
          tx,
          found.id,
        );
        const best = this.bestRule(rules, dto.orderAmount);
        if (!best) {
          throw new PreconditionFailedException(
            'Ninguna regla de la promoción aplica al importe de la orden',
            { promotionId: found.id, orderAmount: dto.orderAmount },
          );
        }
        await this.assertLimits(tx, found, dto.redeemerRefId);
        promotion = found;
        rule = best.rule;
        discountAmount = best.amount;
      }

      const existing = await this.discountsRepo.findRedemptionByIntent(
        tx,
        dto.paymentIntentId,
        promotion.id,
      );
      if (existing) {
        return {
          redemptionId: existing.id,
          paymentIntentId: dto.paymentIntentId,
          discountAmount: existing.discountAmount,
          netAmount: this.round(
            Number(dto.orderAmount) - Number(existing.discountAmount),
          ),
          duplicate: true,
        };
      }

      if (coupon) {
        coupon.redemptionCount = (coupon.redemptionCount ?? 0) + 1;
        if (
          coupon.maxRedemptions &&
          coupon.redemptionCount >= coupon.maxRedemptions
        ) {
          coupon.statusConceptId = CONCEPTS.COUPON_EXHAUSTED;
        }
        touch(coupon, actor.id);
      }

      const redemption = this.discountsRepo.createRedemption(tx, {
        promotionId: promotion.id,
        couponId: coupon?.id,
        discountRuleId: rule.id,
        redeemerTypeConceptId: REWARD_MEMBER_CONCEPT[dto.redeemerType],
        redeemerRefId: dto.redeemerRefId,
        discountAmount,
        currencyConceptId:
          dto.currencyConceptId ??
          promotion.currencyConceptId ??
          CONCEPTS.CURRENCY_BOB,
        orderRefType: 'checkout_order',
        orderRefId: orderId,
        paymentIntentId: dto.paymentIntentId,
        statusConceptId: CONCEPTS.REDEMPTION_APPLIED,
        actorUserId: actor.id,
      });

      return {
        redemptionId: redemption.id,
        paymentIntentId: dto.paymentIntentId,
        discountAmount,
        netAmount: this.round(Number(dto.orderAmount) - Number(discountAmount)),
        duplicate: false,
      };
    });
  }

  /**
   * UC-51-11: revertir la redención. El cupón recupera su uso y, si el canje fue
   * por puntos, se compensa con una entrada de ajuste: el ledger es append-only,
   * así que se corrige sumando, nunca borrando la entrada original.
   */
  async reverseRedemption(
    redemptionId: string,
    dto: ReverseRedemptionDto,
    actor: AuthenticatedUser,
  ): Promise<ReverseRedemptionResponseDto> {
    this.logger.info(
      {
        operation: 'promotions.redemption.reverse',
        redemptionId,
        reason: dto.reason,
      },
      'Reversing redemption',
    );

    return this.em.transactional(async (tx) => {
      const redemption = await this.discountsRepo.findRedemptionForUpdate(
        tx,
        redemptionId,
      );
      if (!redemption) {
        throw new ResourceNotFoundException('Redención no encontrada', {
          redemptionId,
        });
      }
      if (redemption.statusConceptId !== CONCEPTS.REDEMPTION_APPLIED) {
        throw new ConflictException('La redención ya no está aplicada', {
          redemptionId,
          statusConceptId: redemption.statusConceptId,
        });
      }

      if (redemption.couponId) {
        const coupon = await this.discountsRepo.findCouponForUpdate(
          tx,
          redemption.couponId,
        );
        if (coupon) {
          coupon.redemptionCount = Math.max(
            (coupon.redemptionCount ?? 1) - 1,
            0,
          );
          // Liberar un uso devuelve el cupón a la circulación.
          if (coupon.statusConceptId === CONCEPTS.COUPON_EXHAUSTED) {
            coupon.statusConceptId = CONCEPTS.COUPON_ACTIVE;
          }
          touch(coupon, actor.id);
        }
      }

      let ledgerEntryId: string | undefined;
      if (
        dto.membershipId &&
        dto.restorePoints &&
        Number(dto.restorePoints) > 0
      ) {
        const key = `reverse:${redemptionId}`;
        const previous = await this.loyaltyRepo.findLedgerEntryByKey(tx, key);
        if (previous) {
          ledgerEntryId = previous.id;
        } else {
          const membership = await this.loyaltyRepo.findMembershipForUpdate(
            tx,
            dto.membershipId,
          );
          if (!membership) {
            throw new ResourceNotFoundException('Membresía no encontrada', {
              membershipId: dto.membershipId,
            });
          }
          const balanceAfter = this.round(
            Number(membership.pointsBalance ?? '0') + Number(dto.restorePoints),
          );
          const entry = this.loyaltyRepo.createLedgerEntry(tx, {
            loyaltyMembershipId: membership.id,
            directionConceptId: CONCEPTS.POINTS_ADJUST,
            points: dto.restorePoints,
            reasonConceptId: CONCEPTS.REASON_MANUAL,
            balanceAfter,
            sourceType: 'redemption',
            sourceRefId: redemptionId,
            idempotencyKey: key,
            recordedByUserId: actor.id,
          });
          membership.pointsBalance = balanceAfter;
          touch(membership, actor.id);
          ledgerEntryId = entry.id;
        }
      }

      redemption.statusConceptId = CONCEPTS.REDEMPTION_REVERSED;
      touch(redemption, actor.id);

      return {
        redemptionId,
        statusConceptId: CONCEPTS.REDEMPTION_REVERSED,
        ledgerEntryId,
      };
    });
  }

  // --- Apoyo ---

  /** Toma el cupón bloqueado y comprueba todo lo que impediría redimirlo. */
  private async evaluateCouponForUpdate(
    tx: EntityManager,
    code: string,
    context: {
      /**
       * Valor de order amount mantenido por la instancia.
       */
      orderAmount: string;
      /**
       * Valor de redeemer type mantenido por la instancia.
       */
      redeemerType: string;
      /**
       * Identificador asociado a redeemer ref.
       */
      redeemerRefId: string;
    },
  ): Promise<CouponEvaluation> {
    const coupon = await this.discountsRepo.findCouponByCodeForUpdate(tx, code);
    if (!coupon) {
      throw new ResourceNotFoundException('Cupón no encontrado', { code });
    }

    const promotion = await this.discountsRepo.findPromotionForUpdate(
      tx,
      coupon.promotionId,
    );
    if (!promotion) {
      throw new ResourceNotFoundException('Promoción del cupón no encontrada', {
        promotionId: coupon.promotionId,
      });
    }

    const rejection = this.rejectionReason(coupon, promotion, {
      redeemerRefId: context.redeemerRefId,
    });
    if (rejection) {
      throw new PreconditionFailedException(rejection, { code });
    }

    const rules = await this.discountsRepo.findRulesByPromotion(
      tx,
      promotion.id,
    );
    const best = this.bestRule(rules, context.orderAmount);
    if (!best) {
      throw new PreconditionFailedException(
        'Ninguna regla aplica al importe de la orden',
        { code, orderAmount: context.orderAmount },
      );
    }

    await this.assertLimits(tx, promotion, context.redeemerRefId);

    return {
      coupon,
      promotion,
      rule: best.rule,
      discountAmount: best.amount,
    };
  }

  /** Motivo por el que el cupón no sirve, o `undefined` si sí sirve. */
  private rejectionReason(
    coupon: Coupons,
    promotion: Promotions,
    context: {
      /**
       * Identificador asociado a redeemer ref.
       */
      redeemerRefId: string;
    },
  ): string | undefined {
    const now = new Date();
    if (coupon.statusConceptId !== CONCEPTS.COUPON_ACTIVE)
      return 'Cupón no activo';
    if (coupon.validFrom && coupon.validFrom > now)
      return 'Cupón aún no vigente';
    if (coupon.validTo && coupon.validTo < now) return 'Cupón vencido';
    if (
      coupon.maxRedemptions &&
      (coupon.redemptionCount ?? 0) >= coupon.maxRedemptions
    ) {
      return 'Cupón agotado';
    }
    // Un cupón personal es intransferible: usarlo con otra identidad sería
    // exactamente la fuga que el tipo pretende evitar.
    if (
      coupon.assignedMemberRefId &&
      coupon.assignedMemberRefId !== context.redeemerRefId
    ) {
      return 'Cupón asignado a otro miembro';
    }
    if (promotion.statusConceptId !== CONCEPTS.PROMOTION_ACTIVE)
      return 'Promoción no activa';
    if (promotion.validFrom && promotion.validFrom > now)
      return 'Promoción aún no vigente';
    if (promotion.validTo && promotion.validTo < now)
      return 'Promoción vencida';
    return undefined;
  }

  /**
   * Valida assert promotion usable.
   *
   * @param promotion - Valor de promotion requerido por la operación.
   * @throws Error de dominio cuando no se cumplen las precondiciones de la operación.
   */
  private assertPromotionUsable(promotion: Promotions): void {
    const now = new Date();
    if (promotion.statusConceptId !== CONCEPTS.PROMOTION_ACTIVE) {
      throw new PreconditionFailedException('La promoción no está activa', {
        promotionId: promotion.id,
      });
    }
    if (
      (promotion.validFrom && promotion.validFrom > now) ||
      (promotion.validTo && promotion.validTo < now)
    ) {
      throw new PreconditionFailedException(
        'La promoción está fuera de vigencia',
        {
          promotionId: promotion.id,
        },
      );
    }
  }

  /** Topes total y por usuario, y presupuesto de la promoción. */
  private async assertLimits(
    tx: EntityManager,
    promotion: Promotions,
    redeemerRefId: string,
  ): Promise<void> {
    const applied = await this.discountsRepo.findAppliedRedemptions(
      tx,
      promotion.id,
      CONCEPTS.REDEMPTION_APPLIED,
    );

    if (
      promotion.totalRedemptionLimit &&
      applied.length >= promotion.totalRedemptionLimit
    ) {
      throw new PreconditionFailedException(
        'La promoción alcanzó su límite de redenciones',
        {
          promotionId: promotion.id,
          totalRedemptionLimit: promotion.totalRedemptionLimit,
        },
      );
    }

    if (promotion.perUserLimit) {
      const mine = applied.filter((r) => r.redeemerRefId === redeemerRefId);
      if (mine.length >= promotion.perUserLimit) {
        throw new PreconditionFailedException(
          'El usuario alcanzó su límite de redenciones en la promoción',
          { promotionId: promotion.id, perUserLimit: promotion.perUserLimit },
        );
      }
    }

    if (promotion.budgetAmount) {
      const consumed = applied.reduce(
        (sum, r) => sum + Number(r.discountAmount),
        0,
      );
      if (consumed >= Number(promotion.budgetAmount)) {
        throw new PreconditionFailedException(
          'La promoción agotó su presupuesto',
          {
            promotionId: promotion.id,
            budgetAmount: promotion.budgetAmount,
          },
        );
      }
    }
  }

  /** Versión no lanzadora del tope por usuario, para la validación previa. */
  private async perUserRejection(
    promotion: Promotions,
    redeemerRefId: string,
  ): Promise<string | undefined> {
    if (!promotion.perUserLimit) return undefined;
    const mine = await this.discountsRepo.findRedemptionsByRedeemer(
      this.em,
      promotion.id,
      redeemerRefId,
      CONCEPTS.REDEMPTION_APPLIED,
    );
    return mine.length >= promotion.perUserLimit
      ? 'El usuario alcanzó su límite de redenciones'
      : undefined;
  }

  /** De las reglas aplicables, la que más descuenta. */
  private bestRule(
    rules: DiscountRules[],
    orderAmount: string,
  ):
    | {
        /**
         * Valor de rule mantenido por la instancia.
         */
        rule: DiscountRules; /**
         * Valor de amount mantenido por la instancia.
         */
        amount: string;
      }
    | undefined {
    let best:
      | {
          /**
           * Valor de rule mantenido por la instancia.
           */
          rule: DiscountRules; /**
           * Valor de amount mantenido por la instancia.
           */
          amount: string;
        }
      | undefined;
    for (const rule of rules) {
      const amount = this.discountFor(rule, orderAmount);
      if (amount === undefined) continue;
      if (!best || Number(amount) > Number(best.amount))
        best = { rule, amount };
    }
    return best;
  }

  /**
   * Descuento que produce la regla, o `undefined` si no aplica. Nunca supera el
   * importe de la orden: un descuento mayor convertiría el cobro en un pago.
   */
  private discountFor(
    rule: DiscountRules,
    orderAmount: string,
  ): string | undefined {
    const amount = Number(orderAmount);
    if (rule.minPurchaseAmount && amount < Number(rule.minPurchaseAmount))
      return undefined;

    let discount: number;
    if (rule.discountTypeConceptId === CONCEPTS.DISCOUNT_PERCENTAGE) {
      if (!rule.percentage) return undefined;
      discount = (amount * Number(rule.percentage)) / 100;
    } else if (rule.discountTypeConceptId === CONCEPTS.DISCOUNT_FIXED) {
      if (!rule.fixedAmount) return undefined;
      discount = Number(rule.fixedAmount);
    } else {
      // BOGO: el descuento equivale a las unidades bonificadas sobre el lote.
      if (!rule.buyQuantity || !rule.getQuantity) return undefined;
      const lot = rule.buyQuantity + rule.getQuantity;
      discount = (amount * rule.getQuantity) / lot;
    }

    if (rule.maxDiscountAmount)
      discount = Math.min(discount, Number(rule.maxDiscountAmount));
    discount = Math.min(discount, amount);
    return discount > 0 ? this.round(discount) : undefined;
  }

  /**
   * Valida assert rule shape.
   *
   * @param rule - Valor de rule requerido por la operación.
   * @throws Error de dominio cuando no se cumplen las precondiciones de la operación.
   */
  private assertRuleShape(rule: {
    /**
     * Valor de discount type mantenido por la instancia.
     */
    discountType: DiscountType;
    /**
     * Valor de percentage mantenido por la instancia.
     */
    percentage?: string;
    /**
     * Valor de fixed amount mantenido por la instancia.
     */
    fixedAmount?: string;
    /**
     * Valor de buy quantity mantenido por la instancia.
     */
    buyQuantity?: number;
    /**
     * Valor de get quantity mantenido por la instancia.
     */
    getQuantity?: number;
  }): void {
    if (rule.discountType === 'PERCENTAGE') {
      if (!rule.percentage) {
        throw new PreconditionFailedException(
          'Una regla PERCENTAGE necesita porcentaje',
          {},
        );
      }
      const pct = Number(rule.percentage);
      if (pct <= 0 || pct > 100) {
        throw new PreconditionFailedException(
          'El porcentaje debe estar entre 0 y 100',
          {
            percentage: rule.percentage,
          },
        );
      }
    }
    if (rule.discountType === 'FIXED' && !rule.fixedAmount) {
      throw new PreconditionFailedException(
        'Una regla FIXED necesita importe',
        {},
      );
    }
    if (
      rule.discountType === 'BOGO' &&
      (!rule.buyQuantity || !rule.getQuantity)
    ) {
      throw new PreconditionFailedException(
        'Una regla BOGO necesita buyQuantity y getQuantity',
        {},
      );
    }
  }

  /** Códigos únicos para el lote; se reintenta si alguno ya existe. */
  private async generateCouponCodes(
    tx: EntityManager,
    quantity: number,
    prefix?: string,
  ): Promise<string[]> {
    const codes = new Set<string>();
    for (
      let attempt = 0;
      attempt < MAX_CODE_ATTEMPTS && codes.size < quantity;
      attempt += 1
    ) {
      while (codes.size < quantity) {
        const suffix = randomBytes(COUPON_CODE_BYTES)
          .toString('base64url')
          .toUpperCase();
        codes.add(prefix ? `${prefix}-${suffix}` : suffix);
      }
      const taken = await this.discountsRepo.findCouponsByCodes(tx, [...codes]);
      if (taken.length === 0) return [...codes];
      taken.forEach((c) => codes.delete(c.code));
    }
    throw new ConflictException(
      'No se pudieron generar códigos de cupón libres',
      { quantity },
    );
  }

  /** Los importes se transportan como cadena decimal con 2 decimales. */
  private round(value: number): string {
    return value.toFixed(2);
  }
}
