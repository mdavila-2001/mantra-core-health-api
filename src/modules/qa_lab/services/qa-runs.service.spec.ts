import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { QaRunsService } from './qa-runs.service';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  runWithTenant,
} from '../../../common';
import { QaLabErrorReason } from '../qa_lab.error-reasons';

const TENANT_A = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const TENANT_B = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

/**
 * Devuelve el servicio de modo que cada llamada corra con `tenantId` como
 * tenant activo, igual que lo deja el `TenantContextInterceptor`.
 *
 * @param service - Servicio bajo prueba.
 * @param tenantId - Tenant del contexto de la petición.
 * @returns Un proxy que ejecuta cada método dentro de `runWithTenant`.
 */
function inTenant<T extends object>(service: T, tenantId: string): T {
  return new Proxy(service, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver);
      if (typeof value !== 'function') return value;
      return (...args: unknown[]) =>
        runWithTenant(tenantId, () => value.apply(target, args));
    },
  });
}

const actor = { id: 'user-1', roles: ['QA_ENGINEER'] };
const SUITE = '11111111-1111-1111-1111-111111111111';
const ENVIRONMENT = '22222222-2222-2222-2222-222222222222';
const RUN = '33333333-3333-3333-3333-333333333333';
const CASE = '44444444-4444-4444-4444-444444444444';
const RESULT = '55555555-5555-5555-5555-555555555555';
const DEFECT = '66666666-6666-6666-6666-666666666666';
const FILE = '77777777-7777-7777-7777-777777777777';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn() };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const runsRepo = {
    createRun: mockFn(),
    findRunById: mockFn(),
    findRunForUpdate: mockFn(),
    findRunByNumber: mockFn(),
    findLastRun: mockFn(),
    findRunsInProgress: mockFn(),
    createCaseResult: mockFn(),
    findCaseResultById: mockFn(),
    findCaseResultForUpdate: mockFn(),
    findCaseResult: mockFn(),
    findResultsByRun: mockFn(),
    createAssertionResult: mockFn(),
    countAssertionResults: mockFn(),
    createRequestPayload: mockFn(),
    createResponsePayload: mockFn(),
    createArtifact: mockFn(),
    findArtifactsByRun: mockFn(),
    createDefect: mockFn(),
    findDefectForUpdate: mockFn(),
    findDefectBySignatureForUpdate: mockFn(),
    findDefectByNumber: mockFn(),
    countDefects: mockFn(),
  };
  const catalogRepo = {
    findSuiteForUpdate: mockFn(),
    // Por defecto la suite del caso es del tenant activo.
    findSuiteById: mockFn().mockResolvedValue({
      id: SUITE,
      tenantId: TENANT_A,
    }),
    findEnvironmentById: mockFn(),
    countActiveCases: mockFn(),
    findCaseById: mockFn(),
    findAssertionsByCase: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new QaRunsService(
    em as any,
    runsRepo,
    catalogRepo as any,
    logger as any,
  );
  return {
    service: inTenant(service, TENANT_A),
    raw: service,
    tx,
    runsRepo,
    catalogRepo,
    logger,
  };
}

describe('QaRunsService', () => {
  describe('createRun (UC-36-04)', () => {
    const dto = {
      suiteId: SUITE,
      environmentId: ENVIRONMENT,
      trigger: 'MANUAL' as const,
    };

    /**
     * Ejecuta la operación wire.
     *
     * @param d - Valor de d requerido por la operación.
     * @returns Resultado de wire.
     */
    function wire(d: ReturnType<typeof build>) {
      d.catalogRepo.findSuiteForUpdate.mockResolvedValue({
        id: SUITE,
        tenantId: TENANT_A,
        code: 'SUITE-A',
        stateConceptId: CONCEPTS.SUITE_ACTIVE,
      });
      d.catalogRepo.findEnvironmentById.mockResolvedValue({
        id: ENVIRONMENT,
        tenantId: TENANT_A,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
      });
      d.catalogRepo.countActiveCases.mockResolvedValue(5);
      d.runsRepo.findLastRun.mockResolvedValue(null);
      d.runsRepo.findRunByNumber.mockResolvedValue(null);
      d.runsRepo.createRun.mockReturnValue({ id: RUN });
    }

    it('queues the run with a sequential number and the active case count', async () => {
      const d = build();
      wire(d);

      const res = await d.service.createRun(dto, actor);

      expect(res).toMatchObject({
        id: RUN,
        runNumber: 'SUITE-A-00001',
        statusConceptId: CONCEPTS.RUN_QUEUED,
        totalCases: 5,
      });
    });

    it('continues the numbering from the previous run', async () => {
      const d = build();
      wire(d);
      d.runsRepo.findLastRun.mockResolvedValue({ runNumber: 'SUITE-A-00007' });

      const res = await d.service.createRun(dto, actor);

      expect(res.runNumber).toBe('SUITE-A-00008');
    });

    it('refuses a concurrent run when the policy forbids it', async () => {
      const d = build();
      wire(d);
      d.runsRepo.findRunsInProgress.mockResolvedValue([{ id: 'run-running' }]);

      await expect(
        d.service.createRun(
          { ...dto, concurrencyPolicy: 'FORBID' as const },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('allows a concurrent run when the policy permits it', async () => {
      const d = build();
      wire(d);

      const res = await d.service.createRun(
        { ...dto, concurrencyPolicy: 'ALLOW' as const },
        actor,
      );

      expect(res.id).toBe(RUN);
      expect(d.runsRepo.findRunsInProgress).not.toHaveBeenCalled();
    });

    it('refuses a suite with no active cases', async () => {
      const d = build();
      wire(d);
      d.catalogRepo.countActiveCases.mockResolvedValue(0);

      await expect(
        d.service.createRun(dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses an unpublished suite', async () => {
      const d = build();
      wire(d);
      d.catalogRepo.findSuiteForUpdate.mockResolvedValue({
        id: SUITE,
        tenantId: TENANT_A,
        code: 'SUITE-A',
        stateConceptId: CONCEPTS.SUITE_DRAFT,
      });

      await expect(
        d.service.createRun(dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('executeCase (UC-36-05)', () => {
    const dto = {
      requestBodyJson: { patientId: 'abc', note: 'dolor de cabeza' },
      responseBodyJson: { id: '1', status: 'created' },
      httpStatus: 201,
      latencyMs: 42,
    };

    /**
     * Ejecuta la operación wire.
     *
     * @param d - Valor de d requerido por la operación.
     * @param isProductionSafe - Valor de is production safe requerido por la operación.
     * @returns Resultado de wire.
     */
    function wire(d: ReturnType<typeof build>, isProductionSafe = true) {
      const run: any = {
        id: RUN,
        tenantId: TENANT_A,
        suiteId: SUITE,
        environmentId: ENVIRONMENT,
        statusConceptId: CONCEPTS.RUN_QUEUED,
      };
      d.runsRepo.findRunForUpdate.mockResolvedValue(run);
      d.catalogRepo.findCaseById.mockResolvedValue({
        id: CASE,
        suiteId: SUITE,
      });
      d.runsRepo.findCaseResult.mockResolvedValue(null);
      d.catalogRepo.findEnvironmentById.mockResolvedValue({
        id: ENVIRONMENT,
        tenantId: TENANT_A,
        isProductionSafe,
      });
      d.runsRepo.createCaseResult.mockReturnValue({ id: RESULT });
      d.runsRepo.createRequestPayload.mockReturnValue({ id: 'req-1' });
      d.runsRepo.createResponsePayload.mockReturnValue({ id: 'res-1' });
      return run;
    }

    it('captures the payloads and hashes the response body', async () => {
      const d = build();
      wire(d);

      const res = await d.service.executeCase(RUN, CASE, dto, actor);

      expect(res).toMatchObject({
        id: RESULT,
        requestPayloadId: 'req-1',
        responsePayloadId: 'res-1',
        masked: false,
      });
      expect(res.responseBodyHash).toHaveLength(64);
    });

    it('moves the run to running on the first captured case', async () => {
      const d = build();
      const run = wire(d);

      await d.service.executeCase(RUN, CASE, dto, actor);

      expect(run.statusConceptId).toBe(CONCEPTS.RUN_STATUS_RUNNING);
      expect(run.startedAt).toBeInstanceOf(Date);
    });

    it('masks the payloads when the environment is not production-safe', async () => {
      const d = build();
      wire(d, false);

      const res = await d.service.executeCase(RUN, CASE, dto, actor);

      expect(res.masked).toBe(true);
      const persisted = d.runsRepo.createRequestPayload.mock.calls[0][1];
      expect(persisted.bodyJson).toEqual({ patientId: '***', note: '***' });
    });

    it('hashes the original body even when the stored copy is masked', async () => {
      const d = build();
      wire(d, false);

      const res = await d.service.executeCase(RUN, CASE, dto, actor);

      const unmaskedHash = await (async () => {
        const dd = build();
        wire(dd, true);
        return (await dd.service.executeCase(RUN, CASE, dto, actor))
          .responseBodyHash;
      })();
      expect(res.responseBodyHash).toBe(unmaskedHash);
    });

    it('rejects executing the same case twice in the run', async () => {
      const d = build();
      wire(d);
      d.runsRepo.findCaseResult.mockResolvedValue({ id: 'result-prev' });

      await expect(
        d.service.executeCase(RUN, CASE, dto, actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('refuses a case that belongs to another suite', async () => {
      const d = build();
      wire(d);
      d.catalogRepo.findCaseById.mockResolvedValue({
        id: CASE,
        suiteId: 'other-suite',
      });
      d.catalogRepo.findSuiteById.mockResolvedValue({
        id: 'other-suite',
        tenantId: TENANT_A,
      });

      await expect(
        d.service.executeCase(RUN, CASE, dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects capturing into a closed run', async () => {
      const d = build();
      d.runsRepo.findRunForUpdate.mockResolvedValue({
        id: RUN,
        tenantId: TENANT_A,
        statusConceptId: CONCEPTS.RUN_PASSED,
      });

      await expect(
        d.service.executeCase(RUN, CASE, dto, actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('evaluateResult (UC-36-06)', () => {
    /**
     * Ejecuta la operación wire.
     *
     * @param d - Valor de d requerido por la operación.
     * @param assertions - Valor de assertions requerido por la operación.
     * @returns Resultado de wire.
     */
    function wire(d: ReturnType<typeof build>, assertions: any[]) {
      const result: any = { id: RESULT, testRunId: RUN, testCaseId: CASE };
      // El resultado no lleva tenant: su alcance es el de su corrida.
      d.runsRepo.findCaseResultById.mockResolvedValue(result);
      d.runsRepo.findRunById.mockResolvedValue({ id: RUN, tenantId: TENANT_A });
      d.runsRepo.findCaseResultForUpdate.mockResolvedValue(result);
      d.runsRepo.countAssertionResults.mockResolvedValue(0);
      d.catalogRepo.findAssertionsByCase.mockResolvedValue(assertions);
      return result;
    }

    it('passes the case when every assertion holds', async () => {
      const d = build();
      const result = wire(d, [
        { id: 'a-1', ordinal: 1, expectedValue: '201' },
        { id: 'a-2', ordinal: 2, operatorConceptId: CONCEPTS.OPERATOR_EXISTS },
      ]);

      const res = await d.service.evaluateResult(RESULT, actor);

      expect(res).toMatchObject({
        statusConceptId: CONCEPTS.CASE_RESULT_PASSED,
        assertionsTotal: 2,
        assertionsPassed: 2,
        assertionsFailed: 0,
        failureSignatureHash: undefined,
      });
      expect(result.statusConceptId).toBe(CONCEPTS.CASE_RESULT_PASSED);
    });

    it('fails the case and returns a failure signature', async () => {
      const d = build();
      const result = wire(d, [
        { id: 'a-1', ordinal: 1, expectedValue: '201' },
        { id: 'a-2', ordinal: 2 },
      ]);

      const res = await d.service.evaluateResult(RESULT, actor);

      expect(res).toMatchObject({
        statusConceptId: CONCEPTS.CASE_RESULT_FAILED,
        assertionsPassed: 1,
        assertionsFailed: 1,
      });
      expect(res.failureSignatureHash).toHaveLength(64);
      expect(result.errorTypeConceptId).toBe(CONCEPTS.ERROR_ASSERTION);
    });

    it('records one assertion result per assertion', async () => {
      const d = build();
      wire(d, [
        { id: 'a-1', ordinal: 1, expectedValue: '201' },
        { id: 'a-2', ordinal: 2, expectedValue: 'ok' },
      ]);

      await d.service.evaluateResult(RESULT, actor);

      expect(d.runsRepo.createAssertionResult).toHaveBeenCalledTimes(2);
    });

    it('rejects evaluating twice', async () => {
      const d = build();
      wire(d, [{ id: 'a-1', expectedValue: 'x' }]);
      d.runsRepo.countAssertionResults.mockResolvedValue(1);

      await expect(
        d.service.evaluateResult(RESULT, actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('refuses to evaluate a case that failed in transport', async () => {
      const d = build();
      const transportFailure = {
        id: RESULT,
        testRunId: RUN,
        testCaseId: CASE,
        errorTypeConceptId: CONCEPTS.ERROR_TRANSPORT,
      };
      d.runsRepo.findCaseResultById.mockResolvedValue(transportFailure);
      d.runsRepo.findRunById.mockResolvedValue({ id: RUN, tenantId: TENANT_A });
      d.runsRepo.findCaseResultForUpdate.mockResolvedValue(transportFailure);
      d.runsRepo.countAssertionResults.mockResolvedValue(0);

      await expect(
        d.service.evaluateResult(RESULT, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses a case with no assertions', async () => {
      const d = build();
      wire(d, []);

      await expect(
        d.service.evaluateResult(RESULT, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('finalizeRun (UC-36-07)', () => {
    /**
     * Ejecuta la operación wire.
     *
     * @param d - Valor de d requerido por la operación.
     * @param results - Valor de results requerido por la operación.
     * @param totalCases - Valor de total cases requerido por la operación.
     * @returns Resultado de wire.
     */
    function wire(d: ReturnType<typeof build>, results: any[], totalCases = 3) {
      const run: any = {
        id: RUN,
        tenantId: TENANT_A,
        statusConceptId: CONCEPTS.RUN_STATUS_RUNNING,
        totalCases,
        startedAt: new Date(Date.now() - 5000),
      };
      d.runsRepo.findRunForUpdate.mockResolvedValue(run);
      d.runsRepo.findResultsByRun.mockResolvedValue(results);
      return run;
    }

    it('passes the run when nothing failed', async () => {
      const d = build();
      wire(
        d,
        [
          { statusConceptId: CONCEPTS.CASE_RESULT_PASSED },
          { statusConceptId: CONCEPTS.CASE_RESULT_PASSED },
          { statusConceptId: CONCEPTS.CASE_RESULT_PASSED },
        ],
        3,
      );

      const res = await d.service.finalizeRun(RUN, actor);

      expect(res).toMatchObject({
        statusConceptId: CONCEPTS.RUN_PASSED,
        totalPassed: 3,
        totalFailed: 0,
        totalSkipped: 0,
      });
      expect(res.durationMs).toBeGreaterThan(0);
    });

    it('fails the run and warns when a case failed', async () => {
      const d = build();
      wire(
        d,
        [
          { statusConceptId: CONCEPTS.CASE_RESULT_PASSED },
          { statusConceptId: CONCEPTS.CASE_RESULT_FAILED },
        ],
        2,
      );

      const res = await d.service.finalizeRun(RUN, actor);

      expect(res.statusConceptId).toBe(CONCEPTS.RUN_FAILED_STATUS);
      expect(d.logger.warn).toHaveBeenCalled();
    });

    it('counts the cases nobody executed as skipped', async () => {
      const d = build();
      wire(d, [{ statusConceptId: CONCEPTS.CASE_RESULT_PASSED }], 4);

      const res = await d.service.finalizeRun(RUN, actor);

      expect(res).toMatchObject({
        totalPassed: 1,
        totalFailed: 0,
        totalSkipped: 3,
      });
    });

    it('does not pass a run where nothing was executed', async () => {
      const d = build();
      wire(d, [], 3);

      const res = await d.service.finalizeRun(RUN, actor);

      expect(res).toMatchObject({
        statusConceptId: CONCEPTS.RUN_FAILED_STATUS,
        totalPassed: 0,
        totalSkipped: 3,
      });
    });

    it('rejects closing a run twice', async () => {
      const d = build();
      d.runsRepo.findRunForUpdate.mockResolvedValue({
        id: RUN,
        tenantId: TENANT_A,
        statusConceptId: CONCEPTS.RUN_PASSED,
      });

      await expect(
        d.service.finalizeRun(RUN, actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('attachArtifact (UC-36-08)', () => {
    const dto = { artifactType: 'JUNIT' as const, fileId: FILE };

    it('attaches the artifact to the run', async () => {
      const d = build();
      d.runsRepo.findRunById.mockResolvedValue({ id: RUN, tenantId: TENANT_A });
      d.runsRepo.createArtifact.mockReturnValue({ id: 'art-1' });

      const res = await d.service.attachArtifact(RUN, dto, actor);

      expect(res).toMatchObject({ id: 'art-1', testRunId: RUN });
    });

    it('refuses a case result from another run', async () => {
      const d = build();
      d.runsRepo.findRunById.mockResolvedValue({ id: RUN, tenantId: TENANT_A });
      d.runsRepo.findCaseResultById.mockResolvedValue({
        id: RESULT,
        testRunId: 'other-run',
      });

      await expect(
        d.service.attachArtifact(
          RUN,
          { ...dto, testCaseResultId: RESULT },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('fails when the run does not exist', async () => {
      const d = build();
      d.runsRepo.findRunById.mockResolvedValue(null);

      await expect(
        d.service.attachArtifact(RUN, dto, actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('registerDefect (UC-36-09)', () => {
    const dto = {
      testCaseId: CASE,
      failureSignatureHash: 'sig-abc',
      defectType: 'BUG' as const,
      severity: 'HIGH' as const,
      title: 'La cita no se crea',
    };

    it('opens a new defect when the signature is unseen', async () => {
      const d = build();
      d.catalogRepo.findCaseById.mockResolvedValue({
        id: CASE,
        suiteId: SUITE,
      });
      d.runsRepo.findDefectBySignatureForUpdate.mockResolvedValue(null);
      d.runsRepo.countDefects.mockResolvedValue(3);
      d.runsRepo.findDefectByNumber.mockResolvedValue(null);
      d.runsRepo.createDefect.mockReturnValue({ id: DEFECT });

      const res = await d.service.registerDefect(dto, actor);

      expect(res).toMatchObject({
        id: DEFECT,
        defectNumber: 'DEF-00004',
        statusConceptId: CONCEPTS.DEFECT_OPEN,
        occurrencesCount: 1,
        deduplicated: false,
      });
    });

    it('bumps the counter instead of opening a duplicate', async () => {
      const d = build();
      d.catalogRepo.findCaseById.mockResolvedValue({
        id: CASE,
        suiteId: SUITE,
      });
      const existing: any = {
        id: DEFECT,
        tenantId: TENANT_A,
        defectNumber: 'DEF-00001',
        statusConceptId: CONCEPTS.DEFECT_TRIAGED,
        occurrencesCount: 4,
      };
      d.runsRepo.findDefectBySignatureForUpdate.mockResolvedValue(existing);

      const res = await d.service.registerDefect(dto, actor);

      expect(res).toMatchObject({ occurrencesCount: 5, deduplicated: true });
      expect(d.runsRepo.createDefect).not.toHaveBeenCalled();
    });

    it('reopens a defect that had been resolved', async () => {
      const d = build();
      d.catalogRepo.findCaseById.mockResolvedValue({
        id: CASE,
        suiteId: SUITE,
      });
      const existing: any = {
        id: DEFECT,
        tenantId: TENANT_A,
        defectNumber: 'DEF-00001',
        statusConceptId: CONCEPTS.DEFECT_RESOLVED,
        occurrencesCount: 1,
      };
      d.runsRepo.findDefectBySignatureForUpdate.mockResolvedValue(existing);

      const res = await d.service.registerDefect(dto, actor);

      expect(res.statusConceptId).toBe(CONCEPTS.DEFECT_OPEN);
      expect(existing.statusConceptId).toBe(CONCEPTS.DEFECT_OPEN);
    });

    it('fails when the case does not exist', async () => {
      const d = build();
      d.catalogRepo.findCaseById.mockResolvedValue(null);

      await expect(
        d.service.registerDefect(dto, actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('triageDefect (UC-36-10)', () => {
    /**
     * Ejecuta la operación open defect.
     *
     * @param overrides - Valor de overrides requerido por la operación.
     * @returns Resultado de open defect conforme al contrato `any`.
     */
    function openDefect(overrides: Record<string, unknown> = {}): any {
      return {
        id: DEFECT,
        tenantId: TENANT_A,
        statusConceptId: CONCEPTS.DEFECT_OPEN,
        severityConceptId: CONCEPTS.DEFECT_SEVERITY_HIGH,
        ...overrides,
      };
    }

    it('moves the defect through an allowed transition', async () => {
      const d = build();
      const defect = openDefect();
      d.runsRepo.findDefectForUpdate.mockResolvedValue(defect);

      const res = await d.service.triageDefect(
        DEFECT,
        { status: 'TRIAGED' as const },
        actor,
      );

      expect(res.statusConceptId).toBe(CONCEPTS.DEFECT_TRIAGED);
      expect(defect.statusConceptId).toBe(CONCEPTS.DEFECT_TRIAGED);
    });

    it('rejects a transition that is not allowed', async () => {
      const d = build();
      d.runsRepo.findDefectForUpdate.mockResolvedValue(openDefect());

      await expect(
        d.service.triageDefect(
          DEFECT,
          { status: 'CLOSED' as const },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses to put a defect in progress with no owner', async () => {
      const d = build();
      d.runsRepo.findDefectForUpdate.mockResolvedValue(
        openDefect({ statusConceptId: CONCEPTS.DEFECT_TRIAGED }),
      );

      await expect(
        d.service.triageDefect(
          DEFECT,
          { status: 'IN_PROGRESS' as const },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('accepts the in-progress transition with an assignee', async () => {
      const d = build();
      const defect = openDefect({ statusConceptId: CONCEPTS.DEFECT_TRIAGED });
      d.runsRepo.findDefectForUpdate.mockResolvedValue(defect);

      const res = await d.service.triageDefect(
        DEFECT,
        { status: 'IN_PROGRESS' as const, assignedToUserId: actor.id },
        actor,
      );

      expect(res.assignedToUserId).toBe(actor.id);
    });

    it('reclassifies the severity when asked', async () => {
      const d = build();
      const defect = openDefect();
      d.runsRepo.findDefectForUpdate.mockResolvedValue(defect);

      const res = await d.service.triageDefect(
        DEFECT,
        { status: 'TRIAGED' as const, severity: 'CRITICAL' as const },
        actor,
      );

      expect(res.severityConceptId).toBe(CONCEPTS.DEFECT_SEVERITY_CRITICAL);
    });

    it('rejects reopening a closed defect', async () => {
      const d = build();
      d.runsRepo.findDefectForUpdate.mockResolvedValue(
        openDefect({ statusConceptId: CONCEPTS.DEFECT_CLOSED }),
      );

      await expect(
        d.service.triageDefect(
          DEFECT,
          { status: 'OPEN' as const },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('linkRelease (UC-36-12)', () => {
    const dto = { gitRef: 'refs/tags/v1.2.0' };

    it('links the evidence and seals it with a hash', async () => {
      const d = build();
      const run: any = {
        id: RUN,
        tenantId: TENANT_A,
        statusConceptId: CONCEPTS.RUN_PASSED,
      };
      d.runsRepo.findRunForUpdate.mockResolvedValue(run);
      d.runsRepo.findArtifactsByRun.mockResolvedValue([
        { id: 'art-1' },
        { id: 'art-2' },
      ]);

      const res = await d.service.linkRelease(RUN, dto, actor);

      expect(res).toMatchObject({ gitRef: dto.gitRef, artifactCount: 2 });
      expect(res.evidenceHash).toHaveLength(64);
      expect(run.gitRef).toBe(dto.gitRef);
    });

    it('refuses a run that did not pass', async () => {
      const d = build();
      d.runsRepo.findRunForUpdate.mockResolvedValue({
        id: RUN,
        tenantId: TENANT_A,
        statusConceptId: CONCEPTS.RUN_FAILED_STATUS,
      });

      await expect(
        d.service.linkRelease(RUN, dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses a run with no evidence attached', async () => {
      const d = build();
      d.runsRepo.findRunForUpdate.mockResolvedValue({
        id: RUN,
        tenantId: TENANT_A,
        statusConceptId: CONCEPTS.RUN_PASSED,
      });
      d.runsRepo.findArtifactsByRun.mockResolvedValue([]);

      await expect(
        d.service.linkRelease(RUN, dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });
});

/** Aserciones del 404 uniforme de QALAB-01. */
async function expectOutOfScope(promise: Promise<unknown>, message: string) {
  const error = await promise.then(
    () => null,
    (e: unknown) => e,
  );
  expect(error).toBeInstanceOf(ResourceNotFoundException);
  const exception = error as ResourceNotFoundException;
  expect(exception.getStatus()).toBe(404);
  expect(exception.message).toBe(message);
  expect(exception.reason).toBe(QaLabErrorReason.QA_LAB_RESOURCE_OUT_OF_SCOPE);
  expect(exception.details).toBeUndefined();
  return exception;
}

describe('QaRunsService · alcance de tenant (QALAB-01)', () => {
  const system = { id: 'worker-1', roles: ['SYSTEM'] };
  const foreignRun = (overrides: Record<string, unknown> = {}): any => ({
    id: RUN,
    tenantId: TENANT_B,
    suiteId: SUITE,
    environmentId: ENVIRONMENT,
    statusConceptId: CONCEPTS.RUN_QUEUED,
    ...overrides,
  });

  describe('createRun', () => {
    const dto = {
      suiteId: SUITE,
      environmentId: ENVIRONMENT,
      trigger: 'MANUAL' as const,
      tenantId: TENANT_B,
    };

    it('la corrida hereda el tenant de la suite acotada e ignora el del cuerpo', async () => {
      const d = build();
      d.catalogRepo.findSuiteForUpdate.mockResolvedValue({
        id: SUITE,
        tenantId: TENANT_A,
        code: 'SUITE-A',
        stateConceptId: CONCEPTS.SUITE_ACTIVE,
      });
      d.catalogRepo.findEnvironmentById.mockResolvedValue({
        id: ENVIRONMENT,
        tenantId: TENANT_A,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
      });
      d.catalogRepo.countActiveCases.mockResolvedValue(2);
      d.runsRepo.findLastRun.mockResolvedValue(null);
      d.runsRepo.findRunByNumber.mockResolvedValue(null);
      d.runsRepo.createRun.mockReturnValue({ id: RUN });

      await d.service.createRun(dto as any, actor);

      expect(d.catalogRepo.findSuiteForUpdate).toHaveBeenCalledWith(
        d.tx,
        SUITE,
        TENANT_A,
      );
      expect(d.runsRepo.createRun.mock.calls[0][1].tenantId).toBe(TENANT_A);
    });

    it('suite de otro tenant: 404 uniforme, igual que inexistente, sin corrida', async () => {
      const d = build();
      d.catalogRepo.findSuiteForUpdate.mockResolvedValue({
        id: SUITE,
        tenantId: TENANT_B,
        code: 'SUITE-B',
        stateConceptId: CONCEPTS.SUITE_ACTIVE,
      });
      const foreign = await expectOutOfScope(
        d.service.createRun(dto as any, actor),
        'Suite no encontrada',
      );
      d.catalogRepo.findSuiteForUpdate.mockResolvedValue(null);
      const missing = await expectOutOfScope(
        d.service.createRun(dto as any, actor),
        'Suite no encontrada',
      );

      expect(foreign.getResponse()).toEqual(missing.getResponse());
      expect(d.runsRepo.createRun).not.toHaveBeenCalled();
    });

    it('entorno de otro tenant colgado de una suite propia: 404 uniforme, sin corrida', async () => {
      const d = build();
      d.catalogRepo.findSuiteForUpdate.mockResolvedValue({
        id: SUITE,
        tenantId: TENANT_A,
        code: 'SUITE-A',
        stateConceptId: CONCEPTS.SUITE_ACTIVE,
      });
      d.catalogRepo.findEnvironmentById.mockResolvedValue({
        id: ENVIRONMENT,
        tenantId: TENANT_B,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
      });

      await expectOutOfScope(
        d.service.createRun(dto as any, actor),
        'Entorno no encontrado',
      );
      expect(d.runsRepo.createRun).not.toHaveBeenCalled();
    });

    it('sin tenant en el contexto un actor de tenant se rechaza antes de tocar la base', async () => {
      const d = build();

      await expect(d.raw.createRun(dto as any, actor)).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
      expect(d.catalogRepo.findSuiteForUpdate).not.toHaveBeenCalled();
    });

    it('el worker SYSTEM sin tenant en contexto crea la corrida de cualquier suite, pero no mezcla entornos de otro tenant', async () => {
      const d = build();
      d.catalogRepo.findSuiteForUpdate.mockResolvedValue({
        id: SUITE,
        tenantId: TENANT_B,
        code: 'SUITE-B',
        stateConceptId: CONCEPTS.SUITE_ACTIVE,
      });
      d.catalogRepo.findEnvironmentById.mockResolvedValue({
        id: ENVIRONMENT,
        tenantId: TENANT_A,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
      });

      await expectOutOfScope(
        d.raw.createRun(dto as any, system),
        'Entorno no encontrado',
      );
      expect(d.catalogRepo.findSuiteForUpdate).toHaveBeenCalledWith(
        d.tx,
        SUITE,
        undefined,
      );
      expect(d.runsRepo.createRun).not.toHaveBeenCalled();
    });
  });

  describe('operaciones por UUID de corrida / resultado / defecto', () => {
    it('finalizar la corrida de otro tenant: 404 uniforme; el estado de B no cambia', async () => {
      const d = build();
      const run = foreignRun();
      d.runsRepo.findRunForUpdate.mockResolvedValue(run);

      await expectOutOfScope(
        d.service.finalizeRun(RUN, actor),
        'Corrida no encontrada',
      );

      expect(run.statusConceptId).toBe(CONCEPTS.RUN_QUEUED);
      expect(d.runsRepo.findResultsByRun).not.toHaveBeenCalled();
      expect(d.runsRepo.findRunForUpdate).toHaveBeenCalledWith(
        d.tx,
        RUN,
        TENANT_A,
      );
    });

    it('adjuntar un artefacto a la corrida de otro tenant: 404 uniforme y no persiste', async () => {
      const d = build();
      d.runsRepo.findRunById.mockResolvedValue(foreignRun());

      await expectOutOfScope(
        d.service.attachArtifact(
          RUN,
          { artifactType: 'LOG' as const, fileId: FILE },
          actor,
        ),
        'Corrida no encontrada',
      );

      expect(d.runsRepo.createArtifact).not.toHaveBeenCalled();
    });

    it('adjuntar el resultado de la corrida de otro tenant a una corrida propia: 404, no «es de otra corrida»', async () => {
      const d = build();
      d.runsRepo.findRunById.mockImplementation((_tx: unknown, id: string) =>
        Promise.resolve(
          id === RUN
            ? { id: RUN, tenantId: TENANT_A }
            : { id, tenantId: TENANT_B },
        ),
      );
      d.runsRepo.findCaseResultById.mockResolvedValue({
        id: RESULT,
        testRunId: 'run-de-b',
      });

      await expectOutOfScope(
        d.service.attachArtifact(
          RUN,
          {
            artifactType: 'LOG' as const,
            fileId: FILE,
            testCaseResultId: RESULT,
          },
          actor,
        ),
        'Resultado no encontrado',
      );

      expect(d.runsRepo.createArtifact).not.toHaveBeenCalled();
    });

    it('enlazar a un release la corrida de otro tenant: 404 uniforme', async () => {
      const d = build();
      d.runsRepo.findRunForUpdate.mockResolvedValue(
        foreignRun({ statusConceptId: CONCEPTS.RUN_PASSED }),
      );

      await expectOutOfScope(
        d.service.linkRelease(
          RUN,
          { gitRef: 'abc', releaseRef: 'v1' } as any,
          actor,
        ),
        'Corrida no encontrada',
      );
      expect(d.runsRepo.findArtifactsByRun).not.toHaveBeenCalled();
    });

    it('ejecutar un caso en la corrida de otro tenant: 404 uniforme, sin evidencia', async () => {
      const d = build();
      d.runsRepo.findRunForUpdate.mockResolvedValue(foreignRun());

      await expectOutOfScope(
        d.service.executeCase(
          RUN,
          CASE,
          {
            requestBodyJson: {},
            responseBodyJson: {},
            httpStatus: 200,
            latencyMs: 1,
          } as any,
          actor,
        ),
        'Corrida no encontrada',
      );

      expect(d.runsRepo.createCaseResult).not.toHaveBeenCalled();
      expect(d.runsRepo.createRequestPayload).not.toHaveBeenCalled();
    });

    it('un caso de la suite de otro tenant no se revela como «de otra suite»: 404 uniforme', async () => {
      const d = build();
      d.runsRepo.findRunForUpdate.mockResolvedValue({
        id: RUN,
        tenantId: TENANT_A,
        suiteId: SUITE,
        statusConceptId: CONCEPTS.RUN_QUEUED,
      });
      d.catalogRepo.findCaseById.mockResolvedValue({
        id: CASE,
        suiteId: 'suite-de-b',
      });
      d.catalogRepo.findSuiteById.mockResolvedValue({
        id: 'suite-de-b',
        tenantId: TENANT_B,
      });

      await expectOutOfScope(
        d.service.executeCase(
          RUN,
          CASE,
          {
            requestBodyJson: {},
            responseBodyJson: {},
            httpStatus: 200,
            latencyMs: 1,
          } as any,
          actor,
        ),
        'Caso no encontrado',
      );
    });

    it('evaluar el resultado de la corrida de otro tenant: 404 uniforme; no se bloquea ni se evalúa', async () => {
      const d = build();
      d.runsRepo.findCaseResultById.mockResolvedValue({
        id: RESULT,
        testRunId: RUN,
        testCaseId: CASE,
      });
      d.runsRepo.findRunById.mockResolvedValue(foreignRun());

      await expectOutOfScope(
        d.service.evaluateResult(RESULT, actor),
        'Resultado no encontrado',
      );

      expect(d.runsRepo.findCaseResultForUpdate).not.toHaveBeenCalled();
      expect(d.runsRepo.createAssertionResult).not.toHaveBeenCalled();
    });

    it('evaluar un resultado inexistente responde igual que uno ajeno', async () => {
      const d = build();
      d.runsRepo.findCaseResultById.mockResolvedValue({
        id: RESULT,
        testRunId: RUN,
      });
      d.runsRepo.findRunById.mockResolvedValue(foreignRun());
      const foreign = await expectOutOfScope(
        d.service.evaluateResult(RESULT, actor),
        'Resultado no encontrado',
      );

      d.runsRepo.findCaseResultById.mockResolvedValue(null);
      const missing = await expectOutOfScope(
        d.service.evaluateResult(RESULT, actor),
        'Resultado no encontrado',
      );

      expect(foreign.getResponse()).toEqual(missing.getResponse());
    });

    it('registrar un defecto sobre el caso de otro tenant: 404 uniforme y no persiste', async () => {
      const d = build();
      d.catalogRepo.findCaseById.mockResolvedValue({
        id: CASE,
        suiteId: 'suite-de-b',
      });
      d.catalogRepo.findSuiteById.mockResolvedValue({
        id: 'suite-de-b',
        tenantId: TENANT_B,
      });

      await expectOutOfScope(
        d.service.registerDefect(
          {
            testCaseId: CASE,
            failureSignatureHash: 'sig',
            defectType: 'BUG' as const,
            severity: 'HIGH' as const,
            title: 'x',
            tenantId: TENANT_B,
          } as any,
          actor,
        ),
        'Caso no encontrado',
      );

      expect(d.runsRepo.findDefectBySignatureForUpdate).not.toHaveBeenCalled();
      expect(d.runsRepo.createDefect).not.toHaveBeenCalled();
    });

    it('el defecto nuevo hereda el tenant de la suite, no el del cuerpo', async () => {
      const d = build();
      d.catalogRepo.findCaseById.mockResolvedValue({
        id: CASE,
        suiteId: SUITE,
      });
      d.runsRepo.findDefectBySignatureForUpdate.mockResolvedValue(null);
      d.runsRepo.countDefects.mockResolvedValue(0);
      d.runsRepo.findDefectByNumber.mockResolvedValue(null);
      d.runsRepo.createDefect.mockReturnValue({ id: DEFECT });

      await d.service.registerDefect(
        {
          testCaseId: CASE,
          failureSignatureHash: 'sig',
          defectType: 'BUG' as const,
          severity: 'HIGH' as const,
          title: 'x',
          tenantId: TENANT_B,
        } as any,
        actor,
      );

      expect(d.runsRepo.createDefect.mock.calls[0][1].tenantId).toBe(TENANT_A);
    });

    it('enlazar al defecto el resultado de una corrida de otro tenant: 404 uniforme', async () => {
      const d = build();
      d.catalogRepo.findCaseById.mockResolvedValue({
        id: CASE,
        suiteId: SUITE,
      });
      d.runsRepo.findCaseResultById.mockResolvedValue({
        id: RESULT,
        testRunId: RUN,
        testCaseId: CASE,
      });
      d.runsRepo.findRunById.mockResolvedValue(foreignRun());

      await expectOutOfScope(
        d.service.registerDefect(
          {
            testCaseId: CASE,
            testCaseResultId: RESULT,
            failureSignatureHash: 'sig',
            defectType: 'BUG' as const,
            severity: 'HIGH' as const,
            title: 'x',
          } as any,
          actor,
        ),
        'Resultado no encontrado',
      );
      expect(d.runsRepo.createDefect).not.toHaveBeenCalled();
    });

    it('triage del defecto de otro tenant: 404 uniforme; estado y asignación de B no cambian', async () => {
      const d = build();
      const defect: any = {
        id: DEFECT,
        tenantId: TENANT_B,
        statusConceptId: CONCEPTS.DEFECT_OPEN,
      };
      d.runsRepo.findDefectForUpdate.mockResolvedValue(defect);

      const foreign = await expectOutOfScope(
        d.service.triageDefect(
          DEFECT,
          { status: 'TRIAGED' as const, assignedToUserId: 'u-1' } as any,
          actor,
        ),
        'Defecto no encontrado',
      );
      d.runsRepo.findDefectForUpdate.mockResolvedValue(null);
      const missing = await expectOutOfScope(
        d.service.triageDefect(
          DEFECT,
          { status: 'TRIAGED' as const } as any,
          actor,
        ),
        'Defecto no encontrado',
      );

      expect(foreign.getResponse()).toEqual(missing.getResponse());
      expect(defect.statusConceptId).toBe(CONCEPTS.DEFECT_OPEN);
      expect(defect.assignedToUserId).toBeUndefined();
      expect(d.runsRepo.findDefectForUpdate).toHaveBeenCalledWith(
        d.tx,
        DEFECT,
        TENANT_A,
      );
    });

    it('el worker SYSTEM sin tenant en contexto opera sobre cualquier corrida (barrido global explícito)', async () => {
      const d = build();
      const run = foreignRun({
        statusConceptId: CONCEPTS.RUN_STATUS_RUNNING,
        totalCases: 1,
      });
      d.runsRepo.findRunForUpdate.mockResolvedValue(run);
      d.runsRepo.findResultsByRun.mockResolvedValue([
        { statusConceptId: CONCEPTS.CASE_RESULT_PASSED },
      ]);

      const res = await d.raw.finalizeRun(RUN, system);

      expect(res.statusConceptId).toBe(CONCEPTS.RUN_PASSED);
      expect(d.runsRepo.findRunForUpdate).toHaveBeenCalledWith(
        d.tx,
        RUN,
        undefined,
      );
    });

    it('el worker SYSTEM que declara tenant queda acotado a él', async () => {
      const d = build();
      d.runsRepo.findRunForUpdate.mockResolvedValue(foreignRun());

      await expectOutOfScope(
        inTenant(d.raw, TENANT_A).finalizeRun(RUN, system),
        'Corrida no encontrada',
      );
    });
  });
});
