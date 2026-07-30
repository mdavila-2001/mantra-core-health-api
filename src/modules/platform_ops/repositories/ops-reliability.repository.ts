import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  ServiceLevelObjectives,
  SloMeasurements,
  ErrorBudgetPolicies,
  ErrorBudgetBurnEvents,
  CapacityPlans,
  CapacityMeasurements,
} from '../entities';

/**
 * Acceso a la parte de fiabilidad de `platform_ops.*`: objetivos de nivel de
 * servicio y sus mediciones, políticas de error budget con su quema, y planes
 * de capacidad con sus mediciones.
 */
@Injectable()
export class OpsReliabilityRepository {
  // --- SLO (UC-46-09) ---

  /**
   * Obtiene find slo by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find slo by id conforme al contrato `Promise<ServiceLevelObjectives | null>`.
   */
  findSloById(
    em: EntityManager,
    id: string,
  ): Promise<ServiceLevelObjectives | null> {
    return em.findOne(ServiceLevelObjectives, { id });
  }

  /** Log append-only: una ventana medida no se recalcula, se mide de nuevo. */
  createSloMeasurement(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a service level objective.
       */
      serviceLevelObjectiveId: string;
      /**
       * Valor de measured at mantenido por la instancia.
       */
      measuredAt: Date;
      /**
       * Valor de window start mantenido por la instancia.
       */
      windowStart: Date;
      /**
       * Valor de window end mantenido por la instancia.
       */
      windowEnd: Date;
      /**
       * Valor de good events mantenido por la instancia.
       */
      goodEvents: string;
      /**
       * Valor de total events mantenido por la instancia.
       */
      totalEvents: string;
      /**
       * Valor de attained value mantenido por la instancia.
       */
      attainedValue: string;
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
      /**
       * Valor de source reference mantenido por la instancia.
       */
      sourceReference?: string;
    },
  ): SloMeasurements {
    return em.create(
      SloMeasurements,
      {
        serviceLevelObjectiveId: data.serviceLevelObjectiveId,
        measuredAt: data.measuredAt,
        windowStart: data.windowStart,
        windowEnd: data.windowEnd,
        goodEvents: data.goodEvents,
        totalEvents: data.totalEvents,
        attainedValue: data.attainedValue,
        statusConceptId: data.statusConceptId,
        sourceReference: data.sourceReference,
      },
      { partial: true },
    );
  }

  /** Idempotencia de la ventana: la misma `window_end` no se inserta dos veces. */
  findMeasurementByWindow(
    em: EntityManager,
    serviceLevelObjectiveId: string,
    windowEnd: Date,
  ): Promise<SloMeasurements | null> {
    return em.findOne(SloMeasurements, { serviceLevelObjectiveId, windowEnd });
  }

  /**
   * Obtiene find latest measurement.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param serviceLevelObjectiveId - Identificador de service level objective.
   * @returns Resultado de find latest measurement conforme al contrato `Promise<SloMeasurements | null>`.
   */
  findLatestMeasurement(
    em: EntityManager,
    serviceLevelObjectiveId: string,
  ): Promise<SloMeasurements | null> {
    return em.findOne(
      SloMeasurements,
      { serviceLevelObjectiveId },
      { orderBy: { windowEnd: 'DESC' } },
    );
  }

  // --- Error budget (UC-46-10) ---

  /**
   * Obtiene find policy by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find policy by id conforme al contrato `Promise<ErrorBudgetPolicies | null>`.
   */
  findPolicyById(
    em: EntityManager,
    id: string,
  ): Promise<ErrorBudgetPolicies | null> {
    return em.findOne(ErrorBudgetPolicies, { id });
  }

  /**
   * Obtiene find policy for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find policy for update conforme al contrato `Promise<ErrorBudgetPolicies | null>`.
   */
  findPolicyForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<ErrorBudgetPolicies | null> {
    return em.findOne(
      ErrorBudgetPolicies,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /** Log append-only de quema: cada evaluación deja su rastro. */
  createBurnEvent(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a error budget policy.
       */
      errorBudgetPolicyId: string;
      /**
       * Valor de occurred at mantenido por la instancia.
       */
      occurredAt: Date;
      /**
       * Valor de window seconds mantenido por la instancia.
       */
      windowSeconds: string;
      /**
       * Valor de burn rate mantenido por la instancia.
       */
      burnRate: string;
      /**
       * Valor de remaining budget percent mantenido por la instancia.
       */
      remainingBudgetPercent: string;
      /**
       * Identificador asociado a severity concept.
       */
      severityConceptId: string;
      /**
       * Identificador asociado a health incident.
       */
      healthIncidentId?: string;
      /**
       * Valor de action taken json mantenido por la instancia.
       */
      actionTakenJson?: unknown;
    },
  ): ErrorBudgetBurnEvents {
    return em.create(
      ErrorBudgetBurnEvents,
      {
        errorBudgetPolicyId: data.errorBudgetPolicyId,
        occurredAt: data.occurredAt,
        windowSeconds: data.windowSeconds,
        burnRate: data.burnRate,
        remainingBudgetPercent: data.remainingBudgetPercent,
        severityConceptId: data.severityConceptId,
        healthIncidentId: data.healthIncidentId,
        actionTakenJson: data.actionTakenJson,
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find latest burn event.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param errorBudgetPolicyId - Identificador de error budget policy.
   * @returns Resultado de find latest burn event conforme al contrato `Promise<ErrorBudgetBurnEvents | null>`.
   */
  findLatestBurnEvent(
    em: EntityManager,
    errorBudgetPolicyId: string,
  ): Promise<ErrorBudgetBurnEvents | null> {
    return em.findOne(
      ErrorBudgetBurnEvents,
      { errorBudgetPolicyId },
      { orderBy: { occurredAt: 'DESC' } },
    );
  }

  /**
   * Políticas activas que congelan al agotarse. El gate del despliegue las
   * recorre para saber si hay congelamiento vigente; el congelamiento no es una
   * fila propia sino el último evento de quema de cada una.
   */
  findFreezingPolicies(
    em: EntityManager,
    activeStateConceptId: string,
  ): Promise<ErrorBudgetPolicies[]> {
    return em.find(ErrorBudgetPolicies, {
      stateConceptId: activeStateConceptId,
      deploymentFreezeOnExhaustion: true,
    });
  }

  // --- Capacidad (UC-46-11) ---

  /**
   * Obtiene find capacity plan for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find capacity plan for update conforme al contrato `Promise<CapacityPlans | null>`.
   */
  findCapacityPlanForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<CapacityPlans | null> {
    return em.findOne(
      CapacityPlans,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /** Log append-only: la medición observada no se ajusta a posteriori. */
  createCapacityMeasurement(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a capacity plan.
       */
      capacityPlanId: string;
      /**
       * Valor de measured at mantenido por la instancia.
       */
      measuredAt: Date;
      /**
       * Identificador asociado a metric concept.
       */
      metricConceptId: string;
      /**
       * Valor de observed value mantenido por la instancia.
       */
      observedValue: string;
      /**
       * Valor de capacity value mantenido por la instancia.
       */
      capacityValue: string;
      /**
       * Valor de utilization percent mantenido por la instancia.
       */
      utilizationPercent: string;
      /**
       * Valor de source reference mantenido por la instancia.
       */
      sourceReference?: string;
    },
  ): CapacityMeasurements {
    return em.create(
      CapacityMeasurements,
      {
        capacityPlanId: data.capacityPlanId,
        measuredAt: data.measuredAt,
        metricConceptId: data.metricConceptId,
        observedValue: data.observedValue,
        capacityValue: data.capacityValue,
        utilizationPercent: data.utilizationPercent,
        sourceReference: data.sourceReference,
      },
      { partial: true },
    );
  }

  /** Última medición de la misma métrica del plan, para comparar tendencia. */
  findLatestCapacityMeasurement(
    em: EntityManager,
    capacityPlanId: string,
    metricConceptId: string,
  ): Promise<CapacityMeasurements | null> {
    return em.findOne(
      CapacityMeasurements,
      { capacityPlanId, metricConceptId },
      { orderBy: { measuredAt: 'DESC' } },
    );
  }
}
