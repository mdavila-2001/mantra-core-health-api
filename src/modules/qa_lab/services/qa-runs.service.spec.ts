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
} from '../../../common';

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
  return { service, tx, runsRepo, catalogRepo, logger };
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
        code: 'SUITE-A',
        stateConceptId: CONCEPTS.SUITE_ACTIVE,
      });
      d.catalogRepo.findEnvironmentById.mockResolvedValue({
        id: ENVIRONMENT,
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

      await expect(
        d.service.executeCase(RUN, CASE, dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects capturing into a closed run', async () => {
      const d = build();
      d.runsRepo.findRunForUpdate.mockResolvedValue({
        id: RUN,
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
      const result: any = { id: RESULT, testCaseId: CASE };
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
      d.runsRepo.findCaseResultForUpdate.mockResolvedValue({
        id: RESULT,
        testCaseId: CASE,
        errorTypeConceptId: CONCEPTS.ERROR_TRANSPORT,
      });
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
      d.runsRepo.findRunById.mockResolvedValue({ id: RUN });
      d.runsRepo.createArtifact.mockReturnValue({ id: 'art-1' });

      const res = await d.service.attachArtifact(RUN, dto, actor);

      expect(res).toMatchObject({ id: 'art-1', testRunId: RUN });
    });

    it('refuses a case result from another run', async () => {
      const d = build();
      d.runsRepo.findRunById.mockResolvedValue({ id: RUN });
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
      d.catalogRepo.findCaseById.mockResolvedValue({ id: CASE });
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
      d.catalogRepo.findCaseById.mockResolvedValue({ id: CASE });
      const existing: any = {
        id: DEFECT,
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
      d.catalogRepo.findCaseById.mockResolvedValue({ id: CASE });
      const existing: any = {
        id: DEFECT,
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
      const run: any = { id: RUN, statusConceptId: CONCEPTS.RUN_PASSED };
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
        statusConceptId: CONCEPTS.RUN_PASSED,
      });
      d.runsRepo.findArtifactsByRun.mockResolvedValue([]);

      await expect(
        d.service.linkRelease(RUN, dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });
});
