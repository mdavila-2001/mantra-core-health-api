import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  CONCEPTS,
  PreconditionFailedException,
  requireTenantId,
  type AuthenticatedUser,
} from '../../../common';
import type { CatalogConcepts } from '../../terminology/entities';
import type { Coupons, DiscountRules, Promotions } from '../entities';
import type {
  MyPromotionDto,
  MyPromotionsResponseDto,
  PromotionConceptDto,
} from '../dto';
import { PromotionsDiscountsRepository } from '../repositories';

/**
 * La cara de lectura del paciente sobre promociones (B-REAL-13):
 * `GET /promotions/me`.
 *
 * ## Qué es «vigente para mí»
 *
 * - Una promoción **automática** (`PROMO_AUTO`) activa y dentro de su ventana
 *   rige para cualquiera del tenant: se sirve.
 * - Una promoción **de cupón** (`PROMO_COUPON`) sólo se sirve si el titular
 *   tiene un cupón **personal** suyo, activo y vigente para ella — y se sirve
 *   con ese código. Los códigos públicos o de lote no se publican acá:
 *   repartirlos es decisión de quien arma la campaña, no de esta lectura.
 *
 * ## Qué no hace
 *
 * No segmenta por dato clínico ni infiere nada de la salud de nadie: el único
 * filtro por persona es «el cupón está asignado a su perfil de paciente», que
 * sale del token, nunca de la URL.
 */
@Injectable()
export class PromotionsReadService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param discountsRepo - Acceso a promociones, reglas y cupones.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly discountsRepo: PromotionsDiscountsRepository,
  ) {}

  /**
   * Las promociones vigentes para el paciente autenticado, en el tenant del
   * contexto.
   *
   * @param actor - El titular (del token).
   */
  async listMine(actor: AuthenticatedUser): Promise<MyPromotionsResponseDto> {
    const tenantId = requireTenantId();
    const patientProfileId = actor.patientProfileId;
    if (!patientProfileId) {
      throw new PreconditionFailedException(
        'La cuenta no tiene perfil de paciente',
      );
    }

    const em = this.em.fork();
    const now = new Date();
    const promotions = await this.discountsRepo.findCurrentPromotions(
      em,
      tenantId,
      now,
    );
    if (promotions.length === 0) return { items: [], count: 0 };

    const promotionIds = promotions.map((promotion) => promotion.id);
    const [rules, coupons] = await Promise.all([
      this.discountsRepo.findRulesByPromotions(em, promotionIds),
      this.discountsRepo.findPersonalCoupons(
        em,
        promotionIds,
        CONCEPTS.REWARD_MEMBER_PATIENT,
        patientProfileId,
        now,
      ),
    ]);

    const couponsByPromotion = groupBy(coupons, (coupon) => coupon.promotionId);
    const visible = promotions.filter(
      (promotion) =>
        promotion.promotionTypeConceptId !== CONCEPTS.PROMOTION_TYPE_COUPON ||
        couponsByPromotion.has(promotion.id),
    );
    if (visible.length === 0) return { items: [], count: 0 };

    const concepts = await this.discountsRepo.findConcepts(
      em,
      unique(
        [
          ...visible.map((promotion) => promotion.promotionTypeConceptId),
          ...rules.flatMap((rule) => [
            rule.discountTypeConceptId,
            rule.currencyConceptId,
            rule.appliesToConceptId,
          ]),
        ].filter((id): id is string => Boolean(id)),
      ),
    );
    const conceptById = new Map(
      concepts.map((concept) => [concept.id, concept]),
    );
    const rulesByPromotion = groupBy(rules, (rule) => rule.promotionId);

    const items = visible.map((promotion) =>
      toMyPromotion(
        promotion,
        rulesByPromotion.get(promotion.id) ?? [],
        couponsByPromotion.get(promotion.id) ?? [],
        conceptById,
      ),
    );
    return { items, count: items.length };
  }
}

/** Una promoción en palabras, con sus reglas y los cupones del titular. */
function toMyPromotion(
  promotion: Promotions,
  rules: readonly DiscountRules[],
  coupons: readonly Coupons[],
  concepts: ReadonlyMap<string, CatalogConcepts>,
): MyPromotionDto {
  return {
    id: promotion.id,
    code: promotion.code,
    name: promotion.name,
    description: promotion.description ?? null,
    type: optionalConcept(concepts, promotion.promotionTypeConceptId),
    validFrom: promotion.validFrom?.toISOString() ?? null,
    validTo: promotion.validTo?.toISOString() ?? null,
    discounts: rules.map((rule) => ({
      type: optionalConcept(concepts, rule.discountTypeConceptId),
      percentage: rule.percentage ?? null,
      fixedAmount: rule.fixedAmount ?? null,
      currency: optionalConcept(concepts, rule.currencyConceptId),
      minPurchaseAmount: rule.minPurchaseAmount ?? null,
      maxDiscountAmount: rule.maxDiscountAmount ?? null,
      appliesTo: optionalConcept(concepts, rule.appliesToConceptId),
    })),
    coupons: coupons.map((coupon) => ({
      code: coupon.code,
      validTo: coupon.validTo?.toISOString() ?? null,
    })),
  };
}

function optionalConcept(
  concepts: ReadonlyMap<string, CatalogConcepts>,
  id: string | null | undefined,
): PromotionConceptDto | null {
  const value = id ? concepts.get(id) : undefined;
  return value ? { code: value.code, display: value.display } : null;
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}

function groupBy<T>(
  rows: readonly T[],
  keyOf: (row: T) => string,
): Map<string, T[]> {
  const result = new Map<string, T[]>();
  for (const row of rows) {
    const key = keyOf(row);
    const bucket = result.get(key) ?? [];
    bucket.push(row);
    result.set(key, bucket);
  }
  return result;
}
