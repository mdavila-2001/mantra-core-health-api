import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  TestRuns,
  TestCaseResults,
  AssertionResults,
  RequestPayloads,
  ResponsePayloads,
  RunArtifacts,
  TestDefects,
} from '../entities';
import { createdBy } from '../../../common';

export interface CreateRunData {
  suiteId: string;
  environmentId: string;
  tenantId?: string;
  runNumber: string;
  triggerConceptId: string;
  triggeredByUserId?: string;
  gitRef?: string;
  totalCases: number;
  statusConceptId: string;
  actorUserId?: string;
}

export interface CreateDefectData {
  tenantId?: string;
  testCaseId: string;
  testCaseResultId?: string;
  defectNumber: string;
  defectTypeConceptId: string;
  severityConceptId: string;
  statusConceptId: string;
  failureSignatureHash: string;
  title: string;
  description?: string;
  stateConceptId: string;
  actorUserId?: string;
}

/**
 * Acceso a la ejecución de pruebas de `qa_lab.*`: corridas, resultados,
 * aserciones evaluadas, payloads, artefactos y defectos.
 */
@Injectable()
export class QaRunsRepository {
  // --- Corridas (UC-36-04, UC-36-07, UC-36-12) ---

  createRun(em: EntityManager, data: CreateRunData): TestRuns {
    return em.create(
      TestRuns,
      {
        suiteId: data.suiteId,
        environmentId: data.environmentId,
        tenantId: data.tenantId,
        runNumber: data.runNumber,
        triggerConceptId: data.triggerConceptId,
        triggeredByUserId: data.triggeredByUserId,
        gitRef: data.gitRef,
        totalCases: data.totalCases,
        // Los totales son derivados: se consolidan al cerrar la corrida.
        totalPassed: 0,
        totalFailed: 0,
        totalSkipped: 0,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  findRunById(em: EntityManager, id: string): Promise<TestRuns | null> {
    return em.findOne(TestRuns, { id });
  }

  findRunForUpdate(em: EntityManager, id: string): Promise<TestRuns | null> {
    return em.findOne(
      TestRuns,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  findRunByNumber(
    em: EntityManager,
    runNumber: string,
  ): Promise<TestRuns | null> {
    return em.findOne(TestRuns, { runNumber });
  }

  /** Última corrida de la suite: de su número sale el siguiente. */
  findLastRun(em: EntityManager, suiteId: string): Promise<TestRuns | null> {
    return em.findOne(
      TestRuns,
      { suiteId },
      { orderBy: { createdAt: 'DESC' } },
    );
  }

  /**
   * Corridas de la suite en curso. La política de concurrencia del calendario
   * decide qué hacer con ellas: permitir, prohibir o encolar.
   */
  findRunsInProgress(
    em: EntityManager,
    suiteId: string,
    inProgressStatusConceptIds: string[],
  ): Promise<TestRuns[]> {
    return em.find(TestRuns, {
      suiteId,
      statusConceptId: { $in: inProgressStatusConceptIds },
    });
  }

  // --- Resultados de caso (UC-36-05, UC-36-06) ---

  createCaseResult(
    em: EntityManager,
    data: {
      testRunId: string;
      testCaseId: string;
      statusConceptId: string;
      durationMs?: number;
      errorTypeConceptId?: string;
      errorText?: string;
      stackTrace?: string;
      startedAt?: Date;
      actorUserId?: string;
    },
  ): TestCaseResults {
    return em.create(
      TestCaseResults,
      {
        testRunId: data.testRunId,
        testCaseId: data.testCaseId,
        statusConceptId: data.statusConceptId,
        durationMs: data.durationMs,
        errorTypeConceptId: data.errorTypeConceptId,
        errorText: data.errorText,
        stackTrace: data.stackTrace,
        startedAt: data.startedAt ?? new Date(),
        finishedAt: new Date(),
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  findCaseResultById(
    em: EntityManager,
    id: string,
  ): Promise<TestCaseResults | null> {
    return em.findOne(TestCaseResults, { id });
  }

  findCaseResultForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<TestCaseResults | null> {
    return em.findOne(
      TestCaseResults,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /** Resultado ya registrado del caso en la corrida: ejecutar es idempotente. */
  findCaseResult(
    em: EntityManager,
    testRunId: string,
    testCaseId: string,
  ): Promise<TestCaseResults | null> {
    return em.findOne(TestCaseResults, { testRunId, testCaseId });
  }

  /** Resultados de la corrida: de ellos se consolidan los totales. */
  findResultsByRun(
    em: EntityManager,
    testRunId: string,
  ): Promise<TestCaseResults[]> {
    return em.find(TestCaseResults, { testRunId });
  }

  /** Evaluación inmutable de una aserción: se anota, nunca se corrige. */
  createAssertionResult(
    em: EntityManager,
    data: {
      testCaseResultId: string;
      testAssertionId: string;
      passed: boolean;
      actualValue?: string;
      message?: string;
      recordedByUserId?: string;
    },
  ): AssertionResults {
    return em.create(
      AssertionResults,
      {
        testCaseResultId: data.testCaseResultId,
        testAssertionId: data.testAssertionId,
        passed: data.passed,
        actualValue: data.actualValue,
        message: data.message,
        recordedAt: new Date(),
        recordedByUserId: data.recordedByUserId,
      },
      { partial: true },
    );
  }

  countAssertionResults(
    em: EntityManager,
    testCaseResultId: string,
  ): Promise<number> {
    return em.count(AssertionResults, { testCaseResultId });
  }

  // --- Payloads (UC-36-05) ---

  /** Evidencia inmutable: la petición se guarda tal como salió. */
  createRequestPayload(
    em: EntityManager,
    data: {
      testCaseResultId: string;
      directionConceptId: string;
      sequenceNo: number;
      httpMethodConceptId?: string;
      targetUrl?: string;
      headersJson?: unknown;
      bodyJson: unknown;
      bodyHash?: string;
      sizeBytes?: number;
      recordedByUserId?: string;
    },
  ): RequestPayloads {
    return em.create(
      RequestPayloads,
      {
        testCaseResultId: data.testCaseResultId,
        directionConceptId: data.directionConceptId,
        sequenceNo: data.sequenceNo,
        httpMethodConceptId: data.httpMethodConceptId,
        targetUrl: data.targetUrl,
        headersJson: data.headersJson,
        bodyJson: data.bodyJson,
        bodyHash: data.bodyHash,
        sizeBytes: data.sizeBytes,
        sentAt: new Date(),
        recordedAt: new Date(),
        recordedByUserId: data.recordedByUserId,
      },
      { partial: true },
    );
  }

  createResponsePayload(
    em: EntityManager,
    data: {
      testCaseResultId: string;
      requestPayloadId?: string;
      httpStatus?: number;
      headersJson?: unknown;
      bodyJson: unknown;
      bodyHash?: string;
      latencyMs?: number;
      sizeBytes?: number;
      recordedByUserId?: string;
    },
  ): ResponsePayloads {
    return em.create(
      ResponsePayloads,
      {
        testCaseResultId: data.testCaseResultId,
        requestPayloadId: data.requestPayloadId,
        httpStatus: data.httpStatus,
        headersJson: data.headersJson,
        bodyJson: data.bodyJson,
        bodyHash: data.bodyHash,
        latencyMs: data.latencyMs,
        sizeBytes: data.sizeBytes,
        receivedAt: new Date(),
        recordedAt: new Date(),
        recordedByUserId: data.recordedByUserId,
      },
      { partial: true },
    );
  }

  // --- Artefactos (UC-36-08, UC-36-12) ---

  createArtifact(
    em: EntityManager,
    data: {
      testRunId: string;
      testCaseResultId?: string;
      artifactTypeConceptId: string;
      fileId?: string;
      label?: string;
      actorUserId?: string;
    },
  ): RunArtifacts {
    return em.create(
      RunArtifacts,
      {
        testRunId: data.testRunId,
        testCaseResultId: data.testCaseResultId,
        artifactTypeConceptId: data.artifactTypeConceptId,
        fileId: data.fileId,
        label: data.label,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /** Artefactos de la corrida: son el paquete de evidencia del release. */
  findArtifactsByRun(
    em: EntityManager,
    testRunId: string,
  ): Promise<RunArtifacts[]> {
    return em.find(RunArtifacts, { testRunId });
  }

  // --- Defectos (UC-36-09, UC-36-10) ---

  createDefect(em: EntityManager, data: CreateDefectData): TestDefects {
    return em.create(
      TestDefects,
      {
        tenantId: data.tenantId,
        testCaseId: data.testCaseId,
        testCaseResultId: data.testCaseResultId,
        defectNumber: data.defectNumber,
        defectTypeConceptId: data.defectTypeConceptId,
        severityConceptId: data.severityConceptId,
        statusConceptId: data.statusConceptId,
        isFlaky: false,
        failureSignatureHash: data.failureSignatureHash,
        occurrencesCount: 1,
        firstSeenAt: new Date(),
        lastSeenAt: new Date(),
        title: data.title,
        description: data.description,
        stateConceptId: data.stateConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  findDefectForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<TestDefects | null> {
    return em.findOne(
      TestDefects,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /**
   * Defecto con la misma firma de fallo en el mismo caso, bloqueado. Es la
   * deduplicación: un fallo que se repite sube el contador en vez de abrir otro.
   */
  findDefectBySignatureForUpdate(
    em: EntityManager,
    testCaseId: string,
    failureSignatureHash: string,
  ): Promise<TestDefects | null> {
    return em.findOne(
      TestDefects,
      { testCaseId, failureSignatureHash },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  findDefectByNumber(
    em: EntityManager,
    defectNumber: string,
  ): Promise<TestDefects | null> {
    return em.findOne(TestDefects, { defectNumber });
  }

  countDefects(em: EntityManager): Promise<number> {
    return em.count(TestDefects, {});
  }
}
