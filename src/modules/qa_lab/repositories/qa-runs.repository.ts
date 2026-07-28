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

/**
 * Describe el contrato estructural de create run data.
 */
export interface CreateRunData {
  /**
   * Identificador asociado a suite.
   */
  suiteId: string;
  /**
   * Identificador asociado a environment.
   */
  environmentId: string;
  /**
   * Identificador asociado a tenant.
   */
  tenantId?: string;
  /**
   * Valor de run number mantenido por la instancia.
   */
  runNumber: string;
  /**
   * Identificador asociado a trigger concept.
   */
  triggerConceptId: string;
  /**
   * Identificador asociado a triggered by user.
   */
  triggeredByUserId?: string;
  /**
   * Valor de git ref mantenido por la instancia.
   */
  gitRef?: string;
  /**
   * Valor de total cases mantenido por la instancia.
   */
  totalCases: number;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create defect data.
 */
export interface CreateDefectData {
  /**
   * Identificador asociado a tenant.
   */
  tenantId?: string;
  /**
   * Identificador asociado a test case.
   */
  testCaseId: string;
  /**
   * Identificador asociado a test case result.
   */
  testCaseResultId?: string;
  /**
   * Valor de defect number mantenido por la instancia.
   */
  defectNumber: string;
  /**
   * Identificador asociado a defect type concept.
   */
  defectTypeConceptId: string;
  /**
   * Identificador asociado a severity concept.
   */
  severityConceptId: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Valor de failure signature hash mantenido por la instancia.
   */
  failureSignatureHash: string;
  /**
   * Valor de title mantenido por la instancia.
   */
  title: string;
  /**
   * Valor de description mantenido por la instancia.
   */
  description?: string;
  /**
   * Identificador asociado a state concept.
   */
  stateConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Acceso a la ejecución de pruebas de `qa_lab.*`: corridas, resultados,
 * aserciones evaluadas, payloads, artefactos y defectos.
 */
@Injectable()
export class QaRunsRepository {
  // --- Corridas (UC-36-04, UC-36-07, UC-36-12) ---

  /**
   * Crea create run.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create run conforme al contrato `TestRuns`.
   */
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

  /**
   * Obtiene find run by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find run by id conforme al contrato `Promise<TestRuns | null>`.
   */
  findRunById(em: EntityManager, id: string): Promise<TestRuns | null> {
    return em.findOne(TestRuns, { id });
  }

  /**
   * Obtiene find run for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find run for update conforme al contrato `Promise<TestRuns | null>`.
   */
  findRunForUpdate(em: EntityManager, id: string): Promise<TestRuns | null> {
    return em.findOne(
      TestRuns,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /**
   * Obtiene find run by number.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param runNumber - Valor de run number requerido por la operación.
   * @returns Resultado de find run by number conforme al contrato `Promise<TestRuns | null>`.
   */
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

  /**
   * Crea create case result.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create case result conforme al contrato `TestCaseResults`.
   */
  createCaseResult(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a test run.
       */
      testRunId: string;
      /**
       * Identificador asociado a test case.
       */
      testCaseId: string;
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
      /**
       * Valor de duration ms mantenido por la instancia.
       */
      durationMs?: number;
      /**
       * Identificador asociado a error type concept.
       */
      errorTypeConceptId?: string;
      /**
       * Valor de error text mantenido por la instancia.
       */
      errorText?: string;
      /**
       * Valor de stack trace mantenido por la instancia.
       */
      stackTrace?: string;
      /**
       * Valor de started at mantenido por la instancia.
       */
      startedAt?: Date;
      /**
       * Identificador asociado a actor user.
       */
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

  /**
   * Obtiene find case result by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find case result by id conforme al contrato `Promise<TestCaseResults | null>`.
   */
  findCaseResultById(
    em: EntityManager,
    id: string,
  ): Promise<TestCaseResults | null> {
    return em.findOne(TestCaseResults, { id });
  }

  /**
   * Obtiene find case result for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find case result for update conforme al contrato `Promise<TestCaseResults | null>`.
   */
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
      /**
       * Identificador asociado a test case result.
       */
      testCaseResultId: string;
      /**
       * Identificador asociado a test assertion.
       */
      testAssertionId: string;
      /**
       * Valor de passed mantenido por la instancia.
       */
      passed: boolean;
      /**
       * Valor de actual value mantenido por la instancia.
       */
      actualValue?: string;
      /**
       * Valor de message mantenido por la instancia.
       */
      message?: string;
      /**
       * Identificador asociado a recorded by user.
       */
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

  /**
   * Ejecuta la operación count assertion results.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param testCaseResultId - Identificador de test case result.
   * @returns Resultado de count assertion results conforme al contrato `Promise<number>`.
   */
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
      /**
       * Identificador asociado a test case result.
       */
      testCaseResultId: string;
      /**
       * Identificador asociado a direction concept.
       */
      directionConceptId: string;
      /**
       * Valor de sequence no mantenido por la instancia.
       */
      sequenceNo: number;
      /**
       * Identificador asociado a http method concept.
       */
      httpMethodConceptId?: string;
      /**
       * Valor de target url mantenido por la instancia.
       */
      targetUrl?: string;
      /**
       * Valor de headers json mantenido por la instancia.
       */
      headersJson?: unknown;
      /**
       * Valor de body json mantenido por la instancia.
       */
      bodyJson: unknown;
      /**
       * Valor de body hash mantenido por la instancia.
       */
      bodyHash?: string;
      /**
       * Valor de size bytes mantenido por la instancia.
       */
      sizeBytes?: number;
      /**
       * Identificador asociado a recorded by user.
       */
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

  /**
   * Crea create response payload.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create response payload conforme al contrato `ResponsePayloads`.
   */
  createResponsePayload(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a test case result.
       */
      testCaseResultId: string;
      /**
       * Identificador asociado a request payload.
       */
      requestPayloadId?: string;
      /**
       * Valor de http status mantenido por la instancia.
       */
      httpStatus?: number;
      /**
       * Valor de headers json mantenido por la instancia.
       */
      headersJson?: unknown;
      /**
       * Valor de body json mantenido por la instancia.
       */
      bodyJson: unknown;
      /**
       * Valor de body hash mantenido por la instancia.
       */
      bodyHash?: string;
      /**
       * Valor de latency ms mantenido por la instancia.
       */
      latencyMs?: number;
      /**
       * Valor de size bytes mantenido por la instancia.
       */
      sizeBytes?: number;
      /**
       * Identificador asociado a recorded by user.
       */
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

  /**
   * Crea create artifact.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create artifact conforme al contrato `RunArtifacts`.
   */
  createArtifact(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a test run.
       */
      testRunId: string;
      /**
       * Identificador asociado a test case result.
       */
      testCaseResultId?: string;
      /**
       * Identificador asociado a artifact type concept.
       */
      artifactTypeConceptId: string;
      /**
       * Identificador asociado a file.
       */
      fileId?: string;
      /**
       * Valor de label mantenido por la instancia.
       */
      label?: string;
      /**
       * Identificador asociado a actor user.
       */
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

  /**
   * Crea create defect.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create defect conforme al contrato `TestDefects`.
   */
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

  /**
   * Obtiene find defect for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find defect for update conforme al contrato `Promise<TestDefects | null>`.
   */
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

  /**
   * Obtiene find defect by number.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param defectNumber - Valor de defect number requerido por la operación.
   * @returns Resultado de find defect by number conforme al contrato `Promise<TestDefects | null>`.
   */
  findDefectByNumber(
    em: EntityManager,
    defectNumber: string,
  ): Promise<TestDefects | null> {
    return em.findOne(TestDefects, { defectNumber });
  }

  /**
   * Ejecuta la operación count defects.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @returns Resultado de count defects conforme al contrato `Promise<number>`.
   */
  countDefects(em: EntityManager): Promise<number> {
    return em.count(TestDefects, {});
  }
}
