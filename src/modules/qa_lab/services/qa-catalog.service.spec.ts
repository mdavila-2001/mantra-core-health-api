import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { QaCatalogService } from './qa-catalog.service';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';

const actor = { id: 'user-1', roles: ['QA_ADMIN'] };
const SUITE = '11111111-1111-1111-1111-111111111111';
const ENVIRONMENT = '22222222-2222-2222-2222-222222222222';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn() };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const catalogRepo = {
    createEnvironment: mockFn(),
    findEnvironmentById: mockFn(),
    findEnvironmentByCode: mockFn(),
    findSuiteById: mockFn(),
    findSuiteForUpdate: mockFn(),
    createCase: mockFn(),
    findCaseById: mockFn(),
    findCaseByCode: mockFn(),
    findCasesBySuite: mockFn(),
    findCasesBySuiteForUpdate: mockFn(),
    countActiveCases: mockFn(),
    createAssertion: mockFn(),
    findAssertionsByCase: mockFn(),
    createSchedule: mockFn(),
    findScheduleByCode: mockFn(),
    claimDueSchedules: mockFn(),
  };
  const runsRepo = {
    findRunsInProgress: mockFn(),
    createRun: mockFn(),
    findLastRun: mockFn(),
    findRunByNumber: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new QaCatalogService(
    em as any,
    catalogRepo,
    runsRepo as any,
    logger as any,
  );
  return { service, tx, catalogRepo, runsRepo };
}

describe('QaCatalogService', () => {
  describe('createEnvironment (UC-36-01)', () => {
    const dto = {
      code: 'ENV-STG',
      name: 'Staging',
      environment: 'STAGING' as const,
    };

    it('registers the environment as active', async () => {
      const d = build();
      d.catalogRepo.findEnvironmentByCode.mockResolvedValue(null);
      d.catalogRepo.createEnvironment.mockReturnValue({ id: ENVIRONMENT });

      const res = await d.service.createEnvironment(dto, actor);

      expect(res).toMatchObject({
        id: ENVIRONMENT,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
        isProductionSafe: false,
      });
    });

    it('rejects a duplicate code', async () => {
      const d = build();
      d.catalogRepo.findEnvironmentByCode.mockResolvedValue({ id: 'other' });

      await expect(
        d.service.createEnvironment(dto, actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('refuses to declare a production environment safe for payload capture', async () => {
      const d = build();
      d.catalogRepo.findEnvironmentByCode.mockResolvedValue(null);

      await expect(
        d.service.createEnvironment(
          {
            ...dto,
            environment: 'PRODUCTION' as const,
            isProductionSafe: true,
          },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('accepts a safe staging environment', async () => {
      const d = build();
      d.catalogRepo.findEnvironmentByCode.mockResolvedValue(null);
      d.catalogRepo.createEnvironment.mockReturnValue({ id: ENVIRONMENT });

      const res = await d.service.createEnvironment(
        { ...dto, isProductionSafe: true },
        actor,
      );

      expect(res.isProductionSafe).toBe(true);
    });
  });

  describe('createTestCase (UC-36-02)', () => {
    /**
     * Ejecuta la operación dto.
     *
     * @param overrides - Valor de overrides requerido por la operación.
     * @returns Resultado de dto conforme al contrato `any`.
     */
    function dto(overrides: Record<string, unknown> = {}): any {
      return {
        code: 'CASE-01',
        name: 'Crea la cita',
        assertions: [
          { assertionType: 'STATUS_CODE' as const, expectedValue: '201' },
        ],
        ...overrides,
      };
    }

    /**
     * Ejecuta la operación wire.
     *
     * @param d - Valor de d requerido por la operación.
     * @param existingCases - Valor de existing cases requerido por la operación.
     * @returns Resultado de wire.
     */
    function wire(d: ReturnType<typeof build>, existingCases: any[] = []) {
      d.catalogRepo.findSuiteForUpdate.mockResolvedValue({ id: SUITE });
      d.catalogRepo.findCaseByCode.mockResolvedValue(null);
      d.catalogRepo.findCasesBySuite.mockResolvedValue(existingCases);
      d.catalogRepo.createCase.mockReturnValue({ id: 'case-1' });
      d.catalogRepo.createAssertion.mockReturnValue({ id: 'assert-1' });
    }

    it('creates the case in draft with its assertions', async () => {
      const d = build();
      wire(d);

      const res = await d.service.createTestCase(SUITE, dto(), actor);

      expect(res).toMatchObject({
        id: 'case-1',
        stateConceptId: CONCEPTS.CASE_DRAFT,
        ordinal: 1,
        assertionIds: ['assert-1'],
      });
    });

    it('continues the ordinal from the cases already in the suite', async () => {
      const d = build();
      wire(d, [{ id: 'a' }, { id: 'b' }]);

      const res = await d.service.createTestCase(SUITE, dto(), actor);

      expect(res.ordinal).toBe(3);
    });

    it('rejects a duplicate case code in the suite', async () => {
      const d = build();
      wire(d);
      d.catalogRepo.findCaseByCode.mockResolvedValue({ id: 'case-existing' });

      await expect(
        d.service.createTestCase(SUITE, dto(), actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('requires a path on a JSON_PATH assertion', async () => {
      const d = build();

      await expect(
        d.service.createTestCase(
          SUITE,
          dto({
            assertions: [
              { assertionType: 'JSON_PATH' as const, expectedValue: 'x' },
            ],
          }),
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('requires an expected value except for the EXISTS operator', async () => {
      const d = build();

      await expect(
        d.service.createTestCase(
          SUITE,
          dto({ assertions: [{ assertionType: 'STATUS_CODE' as const }] }),
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('accepts an EXISTS assertion with no expected value', async () => {
      const d = build();
      wire(d);

      const res = await d.service.createTestCase(
        SUITE,
        dto({
          assertions: [
            {
              assertionType: 'JSON_PATH' as const,
              jsonPath: '$.id',
              operator: 'EXISTS' as const,
            },
          ],
        }),
        actor,
      );

      expect(res.assertionIds).toEqual(['assert-1']);
    });

    it('fails when the suite does not exist', async () => {
      const d = build();
      d.catalogRepo.findSuiteForUpdate.mockResolvedValue(null);

      await expect(
        d.service.createTestCase(SUITE, dto(), actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('publishSuite (UC-36-03)', () => {
    it('activates the draft cases and bumps the version', async () => {
      const d = build();
      const suite: any = {
        id: SUITE,
        version: 2,
        stateConceptId: CONCEPTS.SUITE_DRAFT,
      };
      d.catalogRepo.findSuiteForUpdate.mockResolvedValue(suite);
      const testCase: any = {
        id: 'case-1',
        stateConceptId: CONCEPTS.CASE_DRAFT,
      };
      d.catalogRepo.findCasesBySuiteForUpdate.mockResolvedValue([testCase]);

      const res = await d.service.publishSuite(SUITE, {}, actor);

      expect(res).toMatchObject({
        version: 3,
        stateConceptId: CONCEPTS.SUITE_ACTIVE,
        casesActivated: 1,
      });
      expect(testCase.stateConceptId).toBe(CONCEPTS.CASE_ACTIVE);
      expect(suite.version).toBe(3);
    });

    it('does not re-activate a case that was already active', async () => {
      const d = build();
      d.catalogRepo.findSuiteForUpdate.mockResolvedValue({
        id: SUITE,
        version: 1,
        stateConceptId: CONCEPTS.SUITE_ACTIVE,
      });
      d.catalogRepo.findCasesBySuiteForUpdate.mockResolvedValue([
        { id: 'case-1', stateConceptId: CONCEPTS.CASE_ACTIVE },
      ]);

      const res = await d.service.publishSuite(SUITE, {}, actor);

      expect(res.casesActivated).toBe(0);
    });

    it('refuses to publish a suite with no cases', async () => {
      const d = build();
      d.catalogRepo.findSuiteForUpdate.mockResolvedValue({
        id: SUITE,
        version: 1,
      });
      d.catalogRepo.findCasesBySuiteForUpdate.mockResolvedValue([]);

      await expect(
        d.service.publishSuite(SUITE, {}, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('createSchedule (UC-36-11)', () => {
    const dto = {
      suiteId: SUITE,
      environmentId: ENVIRONMENT,
      code: 'NIGHTLY',
      name: 'Nocturna',
      cronExpression: '0 2 * * *',
      firstRunAt: '2026-08-01T02:00:00Z',
    };

    /**
     * Ejecuta la operación wire.
     *
     * @param d - Valor de d requerido por la operación.
     * @returns Resultado de wire.
     */
    function wire(d: ReturnType<typeof build>) {
      d.catalogRepo.findSuiteById.mockResolvedValue({
        id: SUITE,
        stateConceptId: CONCEPTS.SUITE_ACTIVE,
      });
      d.catalogRepo.findEnvironmentById.mockResolvedValue({
        id: ENVIRONMENT,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
      });
      d.catalogRepo.findScheduleByCode.mockResolvedValue(null);
      d.catalogRepo.createSchedule.mockReturnValue({ id: 'sched-1' });
    }

    it('schedules the suite with its first run', async () => {
      const d = build();
      wire(d);

      const res = await d.service.createSchedule(dto, actor);

      expect(res).toMatchObject({
        id: 'sched-1',
        nextRunAt: '2026-08-01T02:00:00.000Z',
        stateConceptId: CONCEPTS.STATE_ACTIVE,
      });
    });

    it('defaults the concurrency policy to forbidding overlaps', async () => {
      const d = build();
      wire(d);

      await d.service.createSchedule(dto, actor);

      expect(d.catalogRepo.createSchedule).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          concurrencyPolicyConceptId: CONCEPTS.CONCURRENCY_FORBID,
        }),
      );
    });

    it('refuses an unpublished suite', async () => {
      const d = build();
      wire(d);
      d.catalogRepo.findSuiteById.mockResolvedValue({
        id: SUITE,
        stateConceptId: CONCEPTS.SUITE_DRAFT,
      });

      await expect(
        d.service.createSchedule(dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects a duplicate code for the suite and environment', async () => {
      const d = build();
      wire(d);
      d.catalogRepo.findScheduleByCode.mockResolvedValue({
        id: 'sched-existing',
      });

      await expect(
        d.service.createSchedule(dto, actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('fails when the environment does not exist', async () => {
      const d = build();
      wire(d);
      d.catalogRepo.findEnvironmentById.mockResolvedValue(null);

      await expect(
        d.service.createSchedule(dto, actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('runDueSchedules (tick de disparo programado)', () => {
    /**
     * Programación vencida de referencia, apta para disparar.
     *
     * @param overrides - Valor de overrides requerido por la operación.
     * @returns Resultado de schedule conforme al contrato `any`.
     */
    function schedule(overrides: Record<string, unknown> = {}): any {
      return {
        id: 'sched-1',
        suiteId: SUITE,
        environmentId: ENVIRONMENT,
        tenantId: undefined,
        cronExpression: '0 2 * * *',
        timezone: 'UTC',
        concurrencyPolicyConceptId: CONCEPTS.CONCURRENCY_FORBID,
        nextRunAt: new Date('2026-08-01T02:00:00Z'),
        isEnabled: true,
        ...overrides,
      };
    }

    /**
     * Ejecuta la operación wire.
     *
     * @param d - Valor de d requerido por la operación.
     * @returns Resultado de wire.
     */
    function wire(d: ReturnType<typeof build>) {
      d.catalogRepo.findSuiteById.mockResolvedValue({
        id: SUITE,
        code: 'SMOKE',
        stateConceptId: CONCEPTS.SUITE_ACTIVE,
      });
      d.catalogRepo.findEnvironmentById.mockResolvedValue({
        id: ENVIRONMENT,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
      });
      d.runsRepo.findRunsInProgress.mockResolvedValue([]);
      d.catalogRepo.countActiveCases.mockResolvedValue(3);
      d.runsRepo.findLastRun.mockResolvedValue(null);
      d.runsRepo.findRunByNumber.mockResolvedValue(null);
      d.runsRepo.createRun.mockReturnValue({ id: 'run-1' });
    }

    it('queues a run for a due schedule and advances next_run_at', async () => {
      const d = build();
      wire(d);
      const due = schedule();
      d.catalogRepo.claimDueSchedules.mockResolvedValue([due]);

      const res = await d.service.runDueSchedules({}, actor);

      expect(res.claimed).toBe(1);
      expect(res.queued).toBe(1);
      expect(res.skipped).toBe(0);
      expect(res.results[0]).toMatchObject({
        scheduleId: 'sched-1',
        runId: 'run-1',
      });
      expect(d.runsRepo.createRun).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          suiteId: SUITE,
          environmentId: ENVIRONMENT,
          triggerConceptId: CONCEPTS.QA_TRIGGER_SCHEDULED,
        }),
      );
      // La próxima marca de `0 2 * * *` desde el 2026-08-01T02:00Z es el día siguiente.
      expect(due.nextRunAt.toISOString()).toBe('2026-08-02T02:00:00.000Z');
      expect(due.lastRunId).toBe('run-1');
    });

    it('skips but still reschedules when the suite is not published', async () => {
      const d = build();
      wire(d);
      d.catalogRepo.findSuiteById.mockResolvedValue({
        id: SUITE,
        code: 'SMOKE',
        stateConceptId: CONCEPTS.SUITE_DRAFT,
      });
      const due = schedule();
      d.catalogRepo.claimDueSchedules.mockResolvedValue([due]);

      const res = await d.service.runDueSchedules({}, actor);

      expect(res.queued).toBe(0);
      expect(res.skipped).toBe(1);
      expect(res.results[0].skippedReason).toBe('SUITE_NOT_ACTIVE');
      expect(d.runsRepo.createRun).not.toHaveBeenCalled();
      expect(due.nextRunAt.toISOString()).toBe('2026-08-02T02:00:00.000Z');
    });

    it('skips when the suite already has a run in progress under FORBID', async () => {
      const d = build();
      wire(d);
      d.runsRepo.findRunsInProgress.mockResolvedValue([{ id: 'run-existing' }]);
      d.catalogRepo.claimDueSchedules.mockResolvedValue([schedule()]);

      const res = await d.service.runDueSchedules({}, actor);

      expect(res.results[0].skippedReason).toBe('SUITE_ALREADY_RUNNING');
      expect(d.runsRepo.createRun).not.toHaveBeenCalled();
    });

    it('skips when the suite has no active cases', async () => {
      const d = build();
      wire(d);
      d.catalogRepo.countActiveCases.mockResolvedValue(0);
      d.catalogRepo.claimDueSchedules.mockResolvedValue([schedule()]);

      const res = await d.service.runDueSchedules({}, actor);

      expect(res.results[0].skippedReason).toBe('NO_ACTIVE_CASES');
      expect(d.runsRepo.createRun).not.toHaveBeenCalled();
    });

    it('disables the schedule when it has no cron expression to compute the next mark', async () => {
      const d = build();
      wire(d);
      const originalNextRunAt = new Date('2026-08-01T02:00:00Z');
      const due = schedule({
        cronExpression: undefined,
        nextRunAt: originalNextRunAt,
      });
      d.catalogRepo.claimDueSchedules.mockResolvedValue([due]);

      const res = await d.service.runDueSchedules({}, actor);

      expect(res.results[0].skippedReason).toBe('NO_CRON_EXPRESSION');
      expect(due.isEnabled).toBe(false);
      // Sin cron no hay marca que calcular: `next_run_at` queda tal como estaba.
      expect(due.nextRunAt).toBe(originalNextRunAt);
    });

    it('returns an empty batch when nothing is due', async () => {
      const d = build();
      d.catalogRepo.claimDueSchedules.mockResolvedValue([]);

      const res = await d.service.runDueSchedules({ limit: 5 }, actor);

      expect(res).toEqual({ claimed: 0, queued: 0, skipped: 0, results: [] });
      expect(d.catalogRepo.claimDueSchedules).toHaveBeenCalledWith(
        d.tx,
        expect.any(Date),
        CONCEPTS.STATE_ACTIVE,
        5,
      );
    });
  });
});
