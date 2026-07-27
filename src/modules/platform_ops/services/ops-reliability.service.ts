import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { OpsReliabilityRepository } from '../repositories';
import {
  RecordSloMeasurementDto,
  SloMeasurementResponseDto,
  RecordBurnEventDto,
  BurnEventResponseDto,
  RecordCapacityMeasurementDto,
  CapacityMeasurementResponseDto,
  type CapacityMetric,
} from '../dto';

const CAPACITY_METRIC_CONCEPT: Readonly<Record<CapacityMetric, string>> = {
  CPU: CONCEPTS.CAPACITY_METRIC_CPU,
  MEMORY: CONCEPTS.CAPACITY_METRIC_MEMORY,
  STORAGE: CONCEPTS.CAPACITY_METRIC_STORAGE,
  THROUGHPUT: CONCEPTS.CAPACITY_METRIC_THROUGHPUT,
  CONNECTIONS: CONCEPTS.CAPACITY_METRIC_CONNECTIONS,
};

/** Decimales de `slo_measurements.attained_value` (`numeric(12,8)`). */
const ATTAINMENT_SCALE = 8;

/** Decimales de `capacity_measurements.utilization_percent` (`numeric(8,5)`). */
const UTILIZATION_SCALE = 5;

/**
 * Clave que el plan de capacidad usa dentro de `cost_guardrails_json` para
 * declarar su techo de utilización. El modelo guarda el guardrail como JSON
 * libre, así que la convención se documenta aquí en lugar de adivinarse en
 * cada lectura.
 */
const GUARDRAIL_KEY = 'maxUtilizationPercent';

/**
 * Fiabilidad: mediciones de SLO, quema de error budget con congelamiento de
 * despliegues, y mediciones de capacidad (UC-46-09 … 11).
 */
@Injectable()
export class OpsReliabilityService {
  constructor(
    private readonly em: EntityManager,
    private readonly reliabilityRepo: OpsReliabilityRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(OpsReliabilityService.name);
  }

  /**
   * UC-46-09: registrar la medición de una ventana. Es idempotente por
   * `window_end`: el evaluador reintenta, y una ventana medida dos veces
   * duplicaría el histórico sobre el que se calcula la quema.
   */
  async recordSloMeasurement(
    sloId: string,
    dto: RecordSloMeasurementDto,
    actor: AuthenticatedUser,
  ): Promise<SloMeasurementResponseDto> {
    this.logger.info(
      // `slo_measurements` no tiene columnas de auditoría —es un log de sólo
      // inserción—, así que quién lo registró se deja aquí.
      {
        operation: 'ops.slo.measure',
        sloId,
        windowEnd: dto.windowEnd,
        actorUserId: actor.id,
      },
      'Recording SLO measurement',
    );

    const windowStart = new Date(dto.windowStart);
    const windowEnd = new Date(dto.windowEnd);
    if (windowEnd <= windowStart) {
      throw new PreconditionFailedException(
        'La ventana de medición está invertida',
        {
          sloId,
          windowStart: dto.windowStart,
          windowEnd: dto.windowEnd,
        },
      );
    }

    const totalEvents = BigInt(dto.totalEvents);
    const goodEvents = BigInt(dto.goodEvents);
    if (totalEvents <= 0n) {
      throw new PreconditionFailedException(
        'Una ventana sin eventos no mide nada',
        { sloId },
      );
    }
    if (goodEvents > totalEvents) {
      throw new PreconditionFailedException(
        'Los eventos buenos no pueden superar a los totales',
        { sloId, goodEvents: dto.goodEvents, totalEvents: dto.totalEvents },
      );
    }

    return this.em.transactional(async (tx) => {
      const slo = await this.reliabilityRepo.findSloById(tx, sloId);
      if (!slo) {
        throw new ResourceNotFoundException(
          'Objetivo de nivel de servicio no encontrado',
          {
            sloId,
          },
        );
      }
      if (slo.stateConceptId !== CONCEPTS.STATE_ACTIVE) {
        throw new PreconditionFailedException('El objetivo no está activo', {
          sloId,
        });
      }
      // Medir fuera de la vigencia del objetivo produciría un dato que no
      // corresponde a lo que se comprometió en esa fecha.
      if (windowEnd <= slo.effectiveFrom) {
        throw new PreconditionFailedException(
          'La ventana precede a la vigencia del objetivo',
          {
            sloId,
          },
        );
      }
      if (slo.effectiveTo && windowEnd > slo.effectiveTo) {
        throw new PreconditionFailedException(
          'La ventana excede la vigencia del objetivo',
          {
            sloId,
          },
        );
      }

      const duplicate = await this.reliabilityRepo.findMeasurementByWindow(
        tx,
        sloId,
        windowEnd,
      );
      if (duplicate) {
        return {
          id: duplicate.id,
          attainedValue: duplicate.attainedValue,
          statusConceptId: duplicate.statusConceptId,
          duplicate: true,
        };
      }

      const attainedValue = this.ratio(
        goodEvents,
        totalEvents,
        ATTAINMENT_SCALE,
      );
      const statusConceptId = this.attainmentStatus(
        attainedValue,
        slo.targetValue,
        slo.warningThreshold,
      );

      const measurement = this.reliabilityRepo.createSloMeasurement(tx, {
        serviceLevelObjectiveId: sloId,
        measuredAt: new Date(),
        windowStart,
        windowEnd,
        goodEvents: goodEvents.toString(),
        totalEvents: totalEvents.toString(),
        attainedValue,
        statusConceptId,
        sourceReference: dto.sourceReference,
      });

      if (statusConceptId === CONCEPTS.SLO_FAIL) {
        this.logger.warn(
          { operation: 'ops.slo.measure', sloId, attainedValue },
          'SLO breached in window',
        );
      }

      return {
        id: measurement.id,
        attainedValue,
        statusConceptId,
        duplicate: false,
      };
    });
  }

  /**
   * UC-46-10: registrar la quema del presupuesto de error. Agotarlo con la
   * política puesta a congelar bloquea los despliegues: seguir desplegando
   * mientras el servicio incumple es exactamente lo que el presupuesto evita.
   */
  async recordBurnEvent(
    policyId: string,
    dto: RecordBurnEventDto,
    actor: AuthenticatedUser,
  ): Promise<BurnEventResponseDto> {
    this.logger.info(
      // Igual que las mediciones: el evento de quema es append-only sin auditoría.
      {
        operation: 'ops.error-budget.burn',
        policyId,
        burnRate: dto.burnRate,
        actorUserId: actor.id,
      },
      'Recording error budget burn event',
    );

    return this.em.transactional(async (tx) => {
      const policy = await this.reliabilityRepo.findPolicyForUpdate(
        tx,
        policyId,
      );
      if (!policy) {
        throw new ResourceNotFoundException(
          'Política de error budget no encontrada',
          { policyId },
        );
      }
      if (policy.stateConceptId !== CONCEPTS.STATE_ACTIVE) {
        throw new PreconditionFailedException('La política no está activa', {
          policyId,
        });
      }

      // La quema se evalúa contra una medición real: sin ella el ritmo no sale
      // de ningún sitio comprobable.
      const measurement = await this.reliabilityRepo.findLatestMeasurement(
        tx,
        policy.serviceLevelObjectiveId,
      );
      if (!measurement) {
        throw new PreconditionFailedException(
          'La política no tiene ninguna medición del objetivo sobre la que evaluar',
          { policyId },
        );
      }

      const burnRate = Number(dto.burnRate);
      const remaining = Number(dto.remainingBudgetPercent);
      const warning = Number(policy.burnRateWarning);
      const critical = Number(policy.burnRateCritical);

      const exhausted = remaining <= 0;
      if (!exhausted && burnRate < warning) {
        throw new PreconditionFailedException(
          'El ritmo de quema no alcanza el umbral de aviso de la política',
          { policyId, burnRate: dto.burnRate },
        );
      }

      const severityConceptId = exhausted
        ? CONCEPTS.BURN_SEV_EXHAUSTED
        : burnRate >= critical
          ? CONCEPTS.BURN_SEV_CRITICAL
          : CONCEPTS.BURN_SEV_WARNING;

      const event = this.reliabilityRepo.createBurnEvent(tx, {
        errorBudgetPolicyId: policyId,
        occurredAt: new Date(),
        windowSeconds: dto.windowSeconds,
        burnRate: dto.burnRate,
        remainingBudgetPercent: dto.remainingBudgetPercent,
        severityConceptId,
        healthIncidentId: dto.healthIncidentId,
        actionTakenJson: dto.actionTakenJson,
      });

      const deploymentFreezeActive =
        exhausted && policy.deploymentFreezeOnExhaustion === true;

      this.logger.warn(
        {
          operation: 'ops.error-budget.burn',
          policyId,
          severityConceptId,
          deploymentFreezeActive,
        },
        'Error budget burn recorded',
      );

      return { id: event.id, severityConceptId, deploymentFreezeActive };
    });
  }

  /**
   * UC-46-11: registrar la medición de capacidad y recomputar el plan si la
   * utilización cruza el guardrail declarado.
   */
  async recordCapacityMeasurement(
    planId: string,
    dto: RecordCapacityMeasurementDto,
    actor: AuthenticatedUser,
  ): Promise<CapacityMeasurementResponseDto> {
    this.logger.info(
      { operation: 'ops.capacity.measure', planId, metric: dto.metric },
      'Recording capacity measurement',
    );

    const observed = Number(dto.observedValue);
    const capacity = Number(dto.capacityValue);
    if (capacity <= 0) {
      throw new PreconditionFailedException(
        'La capacidad debe ser mayor que cero',
        {
          planId,
          capacityValue: dto.capacityValue,
        },
      );
    }

    const measuredAt = dto.measuredAt ? new Date(dto.measuredAt) : new Date();

    return this.em.transactional(async (tx) => {
      const plan = await this.reliabilityRepo.findCapacityPlanForUpdate(
        tx,
        planId,
      );
      if (!plan) {
        throw new ResourceNotFoundException('Plan de capacidad no encontrado', {
          planId,
        });
      }
      if (plan.statusConceptId !== CONCEPTS.CAPACITY_PLAN_ACTIVE) {
        throw new PreconditionFailedException(
          'El plan de capacidad no está activo',
          { planId },
        );
      }
      if (
        measuredAt < plan.planningHorizonStart ||
        measuredAt > plan.planningHorizonEnd
      ) {
        throw new PreconditionFailedException(
          'La medición cae fuera del horizonte del plan',
          {
            planId,
            measuredAt: measuredAt.toISOString(),
          },
        );
      }

      const utilizationPercent = ((observed / capacity) * 100).toFixed(
        UTILIZATION_SCALE,
      );
      const measurement = this.reliabilityRepo.createCapacityMeasurement(tx, {
        capacityPlanId: planId,
        measuredAt,
        metricConceptId: CAPACITY_METRIC_CONCEPT[dto.metric],
        observedValue: dto.observedValue,
        capacityValue: dto.capacityValue,
        utilizationPercent,
        sourceReference: dto.sourceReference,
      });

      const guardrail = this.readGuardrail(plan.costGuardrailsJson);
      const guardrailCrossed =
        guardrail !== undefined && Number(utilizationPercent) >= guardrail;

      // El plan sólo se toca si hay algo nuevo que escribir: recomputarlo sin
      // datos nuevos generaría una versión idéntica y una entrada de historia
      // que no cuenta nada.
      let planUpdated = false;
      if (
        guardrailCrossed &&
        (dto.demandForecastJson || dto.scalingPolicyJson)
      ) {
        if (dto.demandForecastJson)
          plan.demandForecastJson = dto.demandForecastJson;
        if (dto.scalingPolicyJson)
          plan.scalingPolicyJson = dto.scalingPolicyJson;
        touch(plan, actor.id);
        planUpdated = true;
      }

      if (guardrailCrossed) {
        this.logger.warn(
          {
            operation: 'ops.capacity.measure',
            planId,
            utilizationPercent,
            guardrail,
          },
          'Capacity guardrail crossed',
        );
      }

      return {
        id: measurement.id,
        utilizationPercent,
        guardrailCrossed,
        planUpdated,
      };
    });
  }

  // --- Apoyo ---

  /**
   * Cociente exacto con `scale` decimales. Se calcula con `BigInt` porque los
   * contadores de eventos son `bigint`: pasarlos por `number` perdería precisión
   * justo en las ventanas grandes, que son las que deciden si el SLO se cumple.
   */
  private ratio(numerator: bigint, denominator: bigint, scale: number): string {
    const factor = 10n ** BigInt(scale);
    const scaled = (numerator * factor) / denominator;
    const whole = scaled / factor;
    const fraction = (scaled % factor).toString().padStart(scale, '0');
    return `${whole}.${fraction}`;
  }

  private attainmentStatus(
    attained: string,
    target: string,
    warningThreshold?: string,
  ): string {
    const value = Number(attained);
    if (value >= Number(target)) return CONCEPTS.SLO_PASS;
    // Sin umbral de aviso el objetivo sólo se cumple o no: no hay zona ámbar
    // que inventar.
    if (warningThreshold !== undefined && value >= Number(warningThreshold)) {
      return CONCEPTS.SLO_WARN;
    }
    return CONCEPTS.SLO_FAIL;
  }

  private readGuardrail(costGuardrailsJson: unknown): number | undefined {
    if (!costGuardrailsJson || typeof costGuardrailsJson !== 'object')
      return undefined;
    const raw = (costGuardrailsJson as Record<string, unknown>)[GUARDRAIL_KEY];
    const value = Number(raw);
    return Number.isFinite(value) ? value : undefined;
  }
}
