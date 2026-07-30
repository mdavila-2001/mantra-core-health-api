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
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new QaCatalogService(em as any, catalogRepo, logger as any);
  return { service, tx, catalogRepo };
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
});
