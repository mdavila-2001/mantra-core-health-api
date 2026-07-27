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
      serviceLevelObjectiveId: string;
      measuredAt: Date;
      windowStart: Date;
      windowEnd: Date;
      goodEvents: string;
      totalEvents: string;
      attainedValue: string;
      statusConceptId: string;
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

  findPolicyById(
    em: EntityManager,
    id: string,
  ): Promise<ErrorBudgetPolicies | null> {
    return em.findOne(ErrorBudgetPolicies, { id });
  }

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
      errorBudgetPolicyId: string;
      occurredAt: Date;
      windowSeconds: string;
      burnRate: string;
      remainingBudgetPercent: string;
      severityConceptId: string;
      healthIncidentId?: string;
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
      capacityPlanId: string;
      measuredAt: Date;
      metricConceptId: string;
      observedValue: string;
      capacityValue: string;
      utilizationPercent: string;
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
