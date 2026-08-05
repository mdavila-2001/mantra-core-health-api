import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  PaymentChannelCatalog,
  PlanEligibilityRules,
  PlanFeatures,
  PlanPrices,
  PlanQuotas,
  SubscriptionUsageCounters,
} from '../entities';

/**
 * Acceso de solo-catálogo a la configuración de planes de suscripción y al
 * catálogo de canales de pago (`payments.plan_*` y
 * `payments.payment_channel_catalog`). Métodos stateless que reciben el
 * `EntityManager`/transacción activa como primer parámetro; sin lógica de
 * negocio, solo lecturas por clave lógica.
 */
@Injectable()
export class PaymentsSubscriptionPlansRepository {
  // ---------------------------------------------------------------------------
  // payment_channel_catalog
  // ---------------------------------------------------------------------------

  /** Canal de pago por id. */
  findChannelById(
    em: EntityManager,
    id: string,
  ): Promise<PaymentChannelCatalog | null> {
    return em.findOne(PaymentChannelCatalog, { id });
  }

  /** Canal de pago por su código de negocio (columna `code`, único). */
  findChannelByCode(
    em: EntityManager,
    code: string,
  ): Promise<PaymentChannelCatalog | null> {
    return em.findOne(PaymentChannelCatalog, { code });
  }

  /** Canales de pago en un estado dado (p. ej. activos), ordenados por código. */
  listChannelsByState(
    em: EntityManager,
    stateConceptId: string,
  ): Promise<PaymentChannelCatalog[]> {
    return em.find(
      PaymentChannelCatalog,
      { stateConceptId },
      { orderBy: { code: 'asc' } },
    );
  }

  // ---------------------------------------------------------------------------
  // plan_prices
  // ---------------------------------------------------------------------------

  /** Precio de plan por id. */
  findPriceById(em: EntityManager, id: string): Promise<PlanPrices | null> {
    return em.findOne(PlanPrices, { id });
  }

  /** Precios definidos para un plan. */
  listPricesByPlan(em: EntityManager, planId: string): Promise<PlanPrices[]> {
    return em.find(PlanPrices, { planId });
  }

  // ---------------------------------------------------------------------------
  // plan_features
  // ---------------------------------------------------------------------------

  /** Feature de plan por id. */
  findFeatureById(em: EntityManager, id: string): Promise<PlanFeatures | null> {
    return em.findOne(PlanFeatures, { id });
  }

  /** Features configuradas para un plan. */
  listFeaturesByPlan(
    em: EntityManager,
    planId: string,
  ): Promise<PlanFeatures[]> {
    return em.find(PlanFeatures, { planId });
  }

  // ---------------------------------------------------------------------------
  // plan_quotas
  // ---------------------------------------------------------------------------

  /** Cuota de plan por id. */
  findQuotaById(em: EntityManager, id: string): Promise<PlanQuotas | null> {
    return em.findOne(PlanQuotas, { id });
  }

  /** Cuotas (límites por métrica) configuradas para un plan. */
  listQuotasByPlan(em: EntityManager, planId: string): Promise<PlanQuotas[]> {
    return em.find(PlanQuotas, { planId });
  }

  // ---------------------------------------------------------------------------
  // plan_eligibility_rules
  // ---------------------------------------------------------------------------

  /** Regla de elegibilidad por id. */
  findEligibilityRuleById(
    em: EntityManager,
    id: string,
  ): Promise<PlanEligibilityRules | null> {
    return em.findOne(PlanEligibilityRules, { id });
  }

  /** Reglas de elegibilidad definidas para un plan. */
  listEligibilityRulesByPlan(
    em: EntityManager,
    planId: string,
  ): Promise<PlanEligibilityRules[]> {
    return em.find(PlanEligibilityRules, { planId });
  }

  // ---------------------------------------------------------------------------
  // subscription_usage_counters
  // ---------------------------------------------------------------------------

  /** Contador de uso por id. */
  findUsageCounterById(
    em: EntityManager,
    id: string,
  ): Promise<SubscriptionUsageCounters | null> {
    return em.findOne(SubscriptionUsageCounters, { id });
  }

  /** Contadores de uso de una suscripción, más recientes primero. */
  findUsageCountersBySubscription(
    em: EntityManager,
    subscriptionId: string,
  ): Promise<SubscriptionUsageCounters[]> {
    return em.find(
      SubscriptionUsageCounters,
      { subscriptionId },
      { orderBy: { periodStart: 'desc' } },
    );
  }
}
