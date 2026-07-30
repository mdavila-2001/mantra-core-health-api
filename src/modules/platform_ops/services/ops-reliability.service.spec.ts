import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { OpsReliabilityService } from './ops-reliability.service';
import {
  CONCEPTS,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';

const actor = { id: 'user-1', roles: ['SRE'] };
const SLO = '11111111-1111-1111-1111-111111111111';
const POLICY = '22222222-2222-2222-2222-222222222222';
const PLAN = '33333333-3333-3333-3333-333333333333';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn() };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const reliabilityRepo = {
    findSloById: mockFn(),
    createSloMeasurement: mockFn(() => ({ id: 'measurement-1' })),
    findMeasurementByWindow: mockFn(() => Promise.resolve(null)),
    findLatestMeasurement: mockFn(() =>
      Promise.resolve({ id: 'measurement-prev' }),
    ),
    findPolicyById: mockFn(),
    findPolicyForUpdate: mockFn(),
    createBurnEvent: mockFn(() => ({ id: 'burn-1' })),
    findLatestBurnEvent: mockFn(),
    findFreezingPolicies: mockFn(() => Promise.resolve([])),
    findCapacityPlanForUpdate: mockFn(),
    createCapacityMeasurement: mockFn(() => ({ id: 'capacity-1' })),
    findLatestCapacityMeasurement: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new OpsReliabilityService(
    em as any,
    reliabilityRepo,
    logger as any,
  );
  return { service, tx, reliabilityRepo, logger };
}

/**
 * Ejecuta la operación active slo.
 *
 * @param overrides - Valor de overrides requerido por la operación.
 * @returns Resultado de active slo conforme al contrato `any`.
 */
function activeSlo(overrides: Record<string, unknown> = {}): any {
  return {
    id: SLO,
    stateConceptId: CONCEPTS.STATE_ACTIVE,
    targetValue: '0.99900000',
    warningThreshold: '0.99500000',
    effectiveFrom: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('OpsReliabilityService', () => {
  describe('recordSloMeasurement (UC-46-09)', () => {
    const dto: any = {
      windowStart: '2026-07-01T00:00:00.000Z',
      windowEnd: '2026-07-08T00:00:00.000Z',
      goodEvents: '999000',
      totalEvents: '1000000',
    };

    it('computes attainment exactly and marks it passing', async () => {
      const d = build();
      d.reliabilityRepo.findSloById.mockResolvedValue(activeSlo());

      const res = await d.service.recordSloMeasurement(SLO, dto, actor);

      expect(res).toEqual({
        id: 'measurement-1',
        attainedValue: '0.99900000',
        statusConceptId: CONCEPTS.SLO_PASS,
        duplicate: false,
      });
    });

    it('marks the window as warning between the threshold and the target', async () => {
      const d = build();
      d.reliabilityRepo.findSloById.mockResolvedValue(activeSlo());

      const res = await d.service.recordSloMeasurement(
        SLO,
        { ...dto, goodEvents: '997000' },
        actor,
      );

      expect(res.statusConceptId).toBe(CONCEPTS.SLO_WARN);
    });

    it('marks the window as failed below the warning threshold', async () => {
      const d = build();
      d.reliabilityRepo.findSloById.mockResolvedValue(activeSlo());

      const res = await d.service.recordSloMeasurement(
        SLO,
        { ...dto, goodEvents: '900000' },
        actor,
      );

      expect(res.statusConceptId).toBe(CONCEPTS.SLO_FAIL);
      expect(d.logger.warn).toHaveBeenCalled();
    });

    it('has no amber zone when the objective declares no warning threshold', async () => {
      const d = build();
      d.reliabilityRepo.findSloById.mockResolvedValue(
        activeSlo({ warningThreshold: undefined }),
      );

      const res = await d.service.recordSloMeasurement(
        SLO,
        { ...dto, goodEvents: '997000' },
        actor,
      );

      expect(res.statusConceptId).toBe(CONCEPTS.SLO_FAIL);
    });

    it('keeps precision on counts beyond what a double holds', async () => {
      const d = build();
      d.reliabilityRepo.findSloById.mockResolvedValue(activeSlo());

      const res = await d.service.recordSloMeasurement(
        SLO,
        {
          ...dto,
          goodEvents: '9007199254740993',
          totalEvents: '9007199254740993',
        },
        actor,
      );

      expect(res.attainedValue).toBe('1.00000000');
    });

    it('returns the existing measurement when the window was already recorded', async () => {
      const d = build();
      d.reliabilityRepo.findSloById.mockResolvedValue(activeSlo());
      d.reliabilityRepo.findMeasurementByWindow.mockResolvedValue({
        id: 'measurement-prev',
        attainedValue: '0.99800000',
        statusConceptId: CONCEPTS.SLO_WARN,
      });

      const res = await d.service.recordSloMeasurement(SLO, dto, actor);

      expect(res).toEqual({
        id: 'measurement-prev',
        attainedValue: '0.99800000',
        statusConceptId: CONCEPTS.SLO_WARN,
        duplicate: true,
      });
      expect(d.reliabilityRepo.createSloMeasurement).not.toHaveBeenCalled();
    });

    it('rejects an inverted window', async () => {
      const d = build();

      await expect(
        d.service.recordSloMeasurement(
          SLO,
          { ...dto, windowEnd: '2026-06-01T00:00:00.000Z' },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects a window with no events', async () => {
      const d = build();

      await expect(
        d.service.recordSloMeasurement(
          SLO,
          { ...dto, goodEvents: '0', totalEvents: '0' },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects more good events than total', async () => {
      const d = build();

      await expect(
        d.service.recordSloMeasurement(
          SLO,
          { ...dto, goodEvents: '2000000' },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects a window outside the objective validity', async () => {
      const d = build();
      d.reliabilityRepo.findSloById.mockResolvedValue(
        activeSlo({ effectiveTo: new Date('2026-06-01T00:00:00.000Z') }),
      );

      await expect(
        d.service.recordSloMeasurement(SLO, dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects a window before the objective took effect', async () => {
      const d = build();
      d.reliabilityRepo.findSloById.mockResolvedValue(
        activeSlo({ effectiveFrom: new Date('2026-12-01T00:00:00.000Z') }),
      );

      await expect(
        d.service.recordSloMeasurement(SLO, dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses an inactive objective', async () => {
      const d = build();
      d.reliabilityRepo.findSloById.mockResolvedValue(
        activeSlo({ stateConceptId: CONCEPTS.STATE_REVOKED }),
      );

      await expect(
        d.service.recordSloMeasurement(SLO, dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('fails when the objective does not exist', async () => {
      const d = build();
      d.reliabilityRepo.findSloById.mockResolvedValue(null);

      await expect(
        d.service.recordSloMeasurement(SLO, dto, actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('recordBurnEvent (UC-46-10)', () => {
    const dto: any = {
      windowSeconds: '3600',
      burnRate: '4.500000',
      remainingBudgetPercent: '20.00000',
    };

    /**
     * Ejecuta la operación active policy.
     *
     * @param overrides - Valor de overrides requerido por la operación.
     * @returns Resultado de active policy conforme al contrato `any`.
     */
    function activePolicy(overrides: Record<string, unknown> = {}): any {
      return {
        id: POLICY,
        serviceLevelObjectiveId: SLO,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
        burnRateWarning: '2.000000',
        burnRateCritical: '6.000000',
        deploymentFreezeOnExhaustion: true,
        ...overrides,
      };
    }

    it('records a warning burn without freezing anything', async () => {
      const d = build();
      d.reliabilityRepo.findPolicyForUpdate.mockResolvedValue(activePolicy());

      const res = await d.service.recordBurnEvent(POLICY, dto, actor);

      expect(res).toEqual({
        id: 'burn-1',
        severityConceptId: CONCEPTS.BURN_SEV_WARNING,
        deploymentFreezeActive: false,
      });
    });

    it('escalates to critical above the critical rate', async () => {
      const d = build();
      d.reliabilityRepo.findPolicyForUpdate.mockResolvedValue(activePolicy());

      const res = await d.service.recordBurnEvent(
        POLICY,
        { ...dto, burnRate: '9.000000' },
        actor,
      );

      expect(res.severityConceptId).toBe(CONCEPTS.BURN_SEV_CRITICAL);
    });

    it('freezes deployments when the budget runs out', async () => {
      const d = build();
      d.reliabilityRepo.findPolicyForUpdate.mockResolvedValue(activePolicy());

      const res = await d.service.recordBurnEvent(
        POLICY,
        { ...dto, remainingBudgetPercent: '0.00000' },
        actor,
      );

      expect(res.severityConceptId).toBe(CONCEPTS.BURN_SEV_EXHAUSTED);
      expect(res.deploymentFreezeActive).toBe(true);
    });

    it('exhausts the budget without freezing when the policy does not ask for it', async () => {
      const d = build();
      d.reliabilityRepo.findPolicyForUpdate.mockResolvedValue(
        activePolicy({ deploymentFreezeOnExhaustion: false }),
      );

      const res = await d.service.recordBurnEvent(
        POLICY,
        { ...dto, remainingBudgetPercent: '-2.00000' },
        actor,
      );

      expect(res.severityConceptId).toBe(CONCEPTS.BURN_SEV_EXHAUSTED);
      expect(res.deploymentFreezeActive).toBe(false);
    });

    it('refuses a burn rate below the warning threshold', async () => {
      const d = build();
      d.reliabilityRepo.findPolicyForUpdate.mockResolvedValue(activePolicy());

      await expect(
        d.service.recordBurnEvent(
          POLICY,
          { ...dto, burnRate: '0.500000' },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses evaluating a policy with no measurement behind it', async () => {
      const d = build();
      d.reliabilityRepo.findPolicyForUpdate.mockResolvedValue(activePolicy());
      d.reliabilityRepo.findLatestMeasurement.mockResolvedValue(null);

      await expect(
        d.service.recordBurnEvent(POLICY, dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses an inactive policy', async () => {
      const d = build();
      d.reliabilityRepo.findPolicyForUpdate.mockResolvedValue(
        activePolicy({ stateConceptId: CONCEPTS.STATE_REVOKED }),
      );

      await expect(
        d.service.recordBurnEvent(POLICY, dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('fails when the policy does not exist', async () => {
      const d = build();
      d.reliabilityRepo.findPolicyForUpdate.mockResolvedValue(null);

      await expect(
        d.service.recordBurnEvent(POLICY, dto, actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('recordCapacityMeasurement (UC-46-11)', () => {
    const dto: any = {
      metric: 'CPU',
      observedValue: '72.000000',
      capacityValue: '100.000000',
      measuredAt: '2026-07-15T00:00:00.000Z',
    };

    /**
     * Ejecuta la operación active plan.
     *
     * @param overrides - Valor de overrides requerido por la operación.
     * @returns Resultado de active plan conforme al contrato `any`.
     */
    function activePlan(overrides: Record<string, unknown> = {}): any {
      return {
        id: PLAN,
        statusConceptId: CONCEPTS.CAPACITY_PLAN_ACTIVE,
        planningHorizonStart: new Date('2026-01-01T00:00:00.000Z'),
        planningHorizonEnd: new Date('2026-12-31T00:00:00.000Z'),
        costGuardrailsJson: { maxUtilizationPercent: 80 },
        ...overrides,
      };
    }

    it('records the measurement with the utilisation computed', async () => {
      const d = build();
      d.reliabilityRepo.findCapacityPlanForUpdate.mockResolvedValue(
        activePlan(),
      );

      const res = await d.service.recordCapacityMeasurement(PLAN, dto, actor);

      expect(res).toEqual({
        id: 'capacity-1',
        utilizationPercent: '72.00000',
        guardrailCrossed: false,
        planUpdated: false,
      });
      expect(d.reliabilityRepo.createCapacityMeasurement).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          metricConceptId: CONCEPTS.CAPACITY_METRIC_CPU,
        }),
      );
    });

    it('flags crossing the declared guardrail', async () => {
      const d = build();
      d.reliabilityRepo.findCapacityPlanForUpdate.mockResolvedValue(
        activePlan(),
      );

      const res = await d.service.recordCapacityMeasurement(
        PLAN,
        { ...dto, observedValue: '85.000000' },
        actor,
      );

      expect(res.guardrailCrossed).toBe(true);
      expect(res.planUpdated).toBe(false);
      expect(d.logger.warn).toHaveBeenCalled();
    });

    it('recomputes the plan when the guardrail is crossed and there is new data', async () => {
      const d = build();
      const plan = activePlan();
      d.reliabilityRepo.findCapacityPlanForUpdate.mockResolvedValue(plan);

      const res = await d.service.recordCapacityMeasurement(
        PLAN,
        {
          ...dto,
          observedValue: '90.000000',
          scalingPolicyJson: { replicas: 8 },
        },
        actor,
      );

      expect(res.planUpdated).toBe(true);
      expect(plan.scalingPolicyJson).toEqual({ replicas: 8 });
    });

    it('does not touch the plan when the guardrail holds', async () => {
      const d = build();
      const plan = activePlan();
      d.reliabilityRepo.findCapacityPlanForUpdate.mockResolvedValue(plan);

      const res = await d.service.recordCapacityMeasurement(
        PLAN,
        { ...dto, scalingPolicyJson: { replicas: 8 } },
        actor,
      );

      expect(res.planUpdated).toBe(false);
      expect(plan.scalingPolicyJson).toBeUndefined();
    });

    it('reports no guardrail when the plan declares none', async () => {
      const d = build();
      d.reliabilityRepo.findCapacityPlanForUpdate.mockResolvedValue(
        activePlan({ costGuardrailsJson: undefined }),
      );

      const res = await d.service.recordCapacityMeasurement(
        PLAN,
        { ...dto, observedValue: '99.000000' },
        actor,
      );

      expect(res.guardrailCrossed).toBe(false);
    });

    it('rejects a capacity of zero', async () => {
      const d = build();

      await expect(
        d.service.recordCapacityMeasurement(
          PLAN,
          { ...dto, capacityValue: '0.000000' },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects a measurement outside the planning horizon', async () => {
      const d = build();
      d.reliabilityRepo.findCapacityPlanForUpdate.mockResolvedValue(
        activePlan(),
      );

      await expect(
        d.service.recordCapacityMeasurement(
          PLAN,
          { ...dto, measuredAt: '2027-03-01T00:00:00.000Z' },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses a plan that is not active', async () => {
      const d = build();
      d.reliabilityRepo.findCapacityPlanForUpdate.mockResolvedValue(
        activePlan({ statusConceptId: CONCEPTS.CAPACITY_PLAN_CLOSED }),
      );

      await expect(
        d.service.recordCapacityMeasurement(PLAN, dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('fails when the plan does not exist', async () => {
      const d = build();
      d.reliabilityRepo.findCapacityPlanForUpdate.mockResolvedValue(null);

      await expect(
        d.service.recordCapacityMeasurement(PLAN, dto, actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });
});
