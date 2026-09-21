import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { ResourceNotFoundException } from '../../../common';
import { conceptCode } from '../../../common/constants/concept-code';
import {
  AssertionResults,
  TestAssertions,
  TestCaseResults,
  TestCases,
  TestDefects,
  TestEnvironments,
  TestRuns,
  TestSuites,
} from '../entities';

const iso = (date: Date | null | undefined) =>
  date ? date.toISOString() : null;
const MAX_LIST = 200;

/**
 * Lecturas del laboratorio para el portal. Devuelve códigos de concepto
 * legibles, no uuids, y nunca cuerpos de payload: la evidencia completa sigue
 * en sus tablas (enmascarada según el entorno) y se consulta por separado.
 */
@Injectable()
export class QaLabReadService {
  constructor(private readonly em: EntityManager) {}

  async listEnvironments() {
    const rows = await this.em.find(
      TestEnvironments,
      {},
      { orderBy: { code: 'asc' } },
    );
    return rows.map((env) => ({
      id: env.id,
      code: env.code,
      name: env.name,
      kind: conceptCode(env.environmentConceptId),
      baseUrl: env.baseUrl ?? null,
      isProductionSafe: env.isProductionSafe ?? false,
      state: conceptCode(env.stateConceptId),
    }));
  }

  async listSuites() {
    const suites = await this.em.find(
      TestSuites,
      {},
      { orderBy: { code: 'asc' }, limit: MAX_LIST },
    );
    const cases = await this.em.find(TestCases, {
      suiteId: { $in: suites.map((s) => s.id) },
    });
    const lastRuns = await this.em.getConnection().execute<
      Array<{
        suite_id: string;
        id: string;
        run_number: string;
        status_concept_id: string;
        finished_at: Date | null;
      }>
    >(
      `SELECT DISTINCT ON (suite_id) suite_id, id, run_number, status_concept_id, finished_at
         FROM qa_lab.test_runs ORDER BY suite_id, created_at DESC`,
      [],
      'all',
    );
    const lastBySuite = new Map(lastRuns.map((row) => [row.suite_id, row]));
    return suites.map((suite) => {
      const suiteCases = cases.filter((c) => c.suiteId === suite.id);
      const last = lastBySuite.get(suite.id);
      return {
        id: suite.id,
        code: suite.code,
        name: suite.name,
        description: suite.description ?? null,
        version: suite.version,
        state: conceptCode(suite.stateConceptId),
        type: conceptCode(suite.suiteTypeConceptId),
        ownerTeam: suite.ownerTeam ?? null,
        cases: suiteCases.length,
        activeCases: suiteCases.filter(
          (c) => conceptCode(c.stateConceptId) === 'CASE_ACTIVE',
        ).length,
        lastRun: last
          ? {
              id: last.id,
              runNumber: last.run_number,
              status: conceptCode(last.status_concept_id),
              finishedAt: last.finished_at
                ? new Date(last.finished_at).toISOString()
                : null,
            }
          : null,
      };
    });
  }

  async getSuite(suiteId: string) {
    const suite = await this.em.findOne(TestSuites, { id: suiteId });
    if (!suite)
      throw new ResourceNotFoundException('Suite no encontrada', { suiteId });
    const cases = await this.em.find(
      TestCases,
      { suiteId },
      { orderBy: { ordinal: 'asc', code: 'asc' } },
    );
    const assertions = await this.em.find(
      TestAssertions,
      { testCaseId: { $in: cases.map((c) => c.id) } },
      { orderBy: { ordinal: 'asc' } },
    );
    return {
      id: suite.id,
      code: suite.code,
      name: suite.name,
      version: suite.version,
      state: conceptCode(suite.stateConceptId),
      cases: cases.map((testCase) => ({
        id: testCase.id,
        code: testCase.code,
        name: testCase.name,
        type: conceptCode(testCase.caseTypeConceptId),
        // El verbo HTTP a secas (GET), no el código del concepto (HTTP_GET).
        method:
          conceptCode(testCase.httpMethodConceptId)?.replace(/^HTTP_/, '') ??
          null,
        requestPath: testCase.requestPath ?? null,
        expectedHttpStatus: testCase.expectedHttpStatus ?? null,
        isCritical: testCase.isCritical ?? false,
        state: conceptCode(testCase.stateConceptId),
        assertions: assertions
          .filter((a) => a.testCaseId === testCase.id)
          .map((a) => ({
            id: a.id,
            type: conceptCode(a.assertionTypeConceptId),
            path: a.jsonPath ?? null,
            operator: conceptCode(a.operatorConceptId),
            expected: a.expectedValue ?? null,
            tolerance: a.tolerance ?? null,
          })),
      })),
    };
  }

  async listRuns(filters: { suiteId?: string; limit?: number }) {
    const runs = await this.em.find(
      TestRuns,
      filters.suiteId ? { suiteId: filters.suiteId } : {},
      {
        orderBy: { createdAt: 'desc', id: 'desc' },
        limit: Math.min(filters.limit ?? 50, 100),
      },
    );
    return runs.map((run) => this.runSummary(run));
  }

  private runSummary(run: TestRuns) {
    return {
      id: run.id,
      runNumber: run.runNumber,
      suiteId: run.suiteId,
      environmentId: run.environmentId,
      trigger: conceptCode(run.triggerConceptId),
      status: conceptCode(run.statusConceptId),
      startedAt: iso(run.startedAt),
      finishedAt: iso(run.finishedAt),
      durationMs: run.durationMs ?? null,
      totals: {
        cases: run.totalCases ?? 0,
        passed: run.totalPassed ?? 0,
        failed: run.totalFailed ?? 0,
        skipped: run.totalSkipped ?? 0,
      },
    };
  }

  async getRun(runId: string) {
    const run = await this.em.findOne(TestRuns, { id: runId });
    if (!run)
      throw new ResourceNotFoundException('Corrida no encontrada', { runId });
    const results = await this.em.find(
      TestCaseResults,
      { testRunId: runId },
      { orderBy: { createdAt: 'asc' } },
    );
    const verdicts = await this.em.find(AssertionResults, {
      testCaseResultId: { $in: results.map((r) => r.id) },
    });
    const cases = await this.em.find(TestCases, {
      id: { $in: results.map((r) => r.testCaseId) },
    });
    const caseCode = new Map(cases.map((c) => [c.id, c.code]));
    return {
      ...this.runSummary(run),
      results: results.map((result) => ({
        id: result.id,
        caseId: result.testCaseId,
        caseCode: caseCode.get(result.testCaseId) ?? null,
        status: conceptCode(result.statusConceptId),
        errorType: conceptCode(result.errorTypeConceptId),
        errorText: result.errorText ?? null,
        durationMs: result.durationMs ?? null,
        assertions: verdicts
          .filter((v) => v.testCaseResultId === result.id)
          .map((v) => ({
            assertionId: v.testAssertionId,
            passed: v.passed,
            actualValue: v.actualValue ?? null,
            message: v.message ?? null,
          })),
      })),
    };
  }

  async listDefects(filters: { status?: string }) {
    const defects = await this.em.find(
      TestDefects,
      {},
      { orderBy: { lastSeenAt: 'desc' }, limit: MAX_LIST },
    );
    return defects
      .map((defect) => ({
        id: defect.id,
        defectNumber: defect.defectNumber,
        testCaseId: defect.testCaseId ?? null,
        type: conceptCode(defect.defectTypeConceptId),
        severity: conceptCode(defect.severityConceptId),
        status: conceptCode(defect.statusConceptId),
        isFlaky: defect.isFlaky ?? false,
        occurrences: defect.occurrencesCount ?? 1,
        firstSeenAt: iso(defect.firstSeenAt),
        lastSeenAt: iso(defect.lastSeenAt),
        externalIssueRef: defect.externalIssueRef ?? null,
        assignedToUserId: defect.assignedToUserId ?? null,
      }))
      .filter((defect) => !filters.status || defect.status === filters.status);
  }
}
