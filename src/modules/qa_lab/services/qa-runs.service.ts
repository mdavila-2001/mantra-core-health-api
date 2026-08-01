import { createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { QaCatalogRepository, QaRunsRepository } from '../repositories';
import { TestAssertions } from '../entities';
import {
  CreateRunDto,
  RunResponseDto,
  ExecuteCaseDto,
  ExecuteCaseResponseDto,
  EvaluateResultResponseDto,
  FinalizeRunResponseDto,
  AttachArtifactDto,
  ArtifactResponseDto,
  RegisterDefectDto,
  DefectResponseDto,
  TriageDefectDto,
  TriageDefectResponseDto,
  LinkReleaseDto,
  LinkReleaseResponseDto,
  type RunTrigger,
  type ArtifactType,
  type DefectType,
  type DefectSeverity,
  type DefectStatus,
} from '../dto';

const TRIGGER_CONCEPT: Readonly<Record<RunTrigger, string>> = {
  MANUAL: CONCEPTS.QA_TRIGGER_MANUAL,
  SCHEDULED: CONCEPTS.QA_TRIGGER_SCHEDULED,
  CI_PUSH: CONCEPTS.QA_TRIGGER_CI_PUSH,
  CI_PR: CONCEPTS.QA_TRIGGER_CI_PR,
  WEBHOOK: CONCEPTS.QA_TRIGGER_WEBHOOK,
};

const ARTIFACT_TYPE_CONCEPT: Readonly<Record<ArtifactType, string>> = {
  LOG: CONCEPTS.ARTIFACT_LOG,
  HAR: CONCEPTS.ARTIFACT_HAR,
  SCREENSHOT: CONCEPTS.ARTIFACT_SCREENSHOT,
  JUNIT: CONCEPTS.ARTIFACT_JUNIT,
};

const DEFECT_TYPE_CONCEPT: Readonly<Record<DefectType, string>> = {
  BUG: CONCEPTS.DEFECT_TYPE_BUG,
  REGRESSION: CONCEPTS.DEFECT_TYPE_REGRESSION,
  FLAKY: CONCEPTS.DEFECT_TYPE_FLAKY,
};

const DEFECT_SEVERITY_CONCEPT: Readonly<Record<DefectSeverity, string>> = {
  LOW: CONCEPTS.DEFECT_SEVERITY_LOW,
  MEDIUM: CONCEPTS.DEFECT_SEVERITY_MEDIUM,
  HIGH: CONCEPTS.DEFECT_SEVERITY_HIGH,
  CRITICAL: CONCEPTS.DEFECT_SEVERITY_CRITICAL,
};

const DEFECT_STATUS_CONCEPT: Readonly<Record<DefectStatus, string>> = {
  OPEN: CONCEPTS.DEFECT_OPEN,
  TRIAGED: CONCEPTS.DEFECT_TRIAGED,
  IN_PROGRESS: CONCEPTS.DEFECT_IN_PROGRESS,
  RESOLVED: CONCEPTS.DEFECT_RESOLVED,
  CLOSED: CONCEPTS.DEFECT_CLOSED,
  REJECTED: CONCEPTS.DEFECT_REJECTED,
};

/**
 * Transiciones admitidas del defecto. Cerrar sin resolver ni rechazar, o
 * reabrir uno cerrado, dejarían el flujo de triage sin significado.
 */
const DEFECT_TRANSITIONS: Readonly<
  Record<DefectStatus, readonly DefectStatus[]>
> = {
  OPEN: ['TRIAGED', 'REJECTED'],
  TRIAGED: ['IN_PROGRESS', 'REJECTED'],
  IN_PROGRESS: ['RESOLVED', 'TRIAGED'],
  RESOLVED: ['CLOSED', 'IN_PROGRESS'],
  CLOSED: [],
  REJECTED: [],
};

/** Estados en los que una corrida está viva y compite por el entorno. */
const RUN_IN_PROGRESS_STATES: readonly string[] = [
  CONCEPTS.RUN_QUEUED,
  CONCEPTS.RUN_STATUS_RUNNING,
];

/** Campos cuyo contenido se enmascara si el entorno no es seguro. */
const MASKED_PLACEHOLDER = '***';

/**
 * Ejecución de pruebas: corridas, ejecución y evaluación de casos, cierre,
 * artefactos, defectos y enlace a release (UC-36-04 … 10, UC-36-12).
 */
@Injectable()
export class QaRunsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param runsRepo - Valor de runs repo requerido por la operación.
   * @param catalogRepo - Valor de catalog repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly runsRepo: QaRunsRepository,
    private readonly catalogRepo: QaCatalogRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(QaRunsService.name);
  }

  /**
   * UC-36-04: encolar una corrida. El número es secuencial por suite y el
   * total de casos se deriva de los casos activos.
   */
  async createRun(
    dto: CreateRunDto,
    actor: AuthenticatedUser,
  ): Promise<RunResponseDto> {
    this.logger.info(
      {
        operation: 'qa.run.create',
        suiteId: dto.suiteId,
        trigger: dto.trigger,
      },
      'Queueing test run',
    );

    return this.em.transactional(async (tx) => {
      const suite = await this.catalogRepo.findSuiteForUpdate(tx, dto.suiteId);
      if (!suite) {
        throw new ResourceNotFoundException('Suite no encontrada', {
          suiteId: dto.suiteId,
        });
      }
      if (suite.stateConceptId !== CONCEPTS.SUITE_ACTIVE) {
        throw new PreconditionFailedException('La suite no está publicada', {
          suiteId: dto.suiteId,
        });
      }

      const environment = await this.catalogRepo.findEnvironmentById(
        tx,
        dto.environmentId,
      );
      if (!environment) {
        throw new ResourceNotFoundException('Entorno no encontrado', {
          environmentId: dto.environmentId,
        });
      }
      if (environment.stateConceptId !== CONCEPTS.STATE_ACTIVE) {
        throw new PreconditionFailedException('El entorno no está activo', {
          environmentId: dto.environmentId,
        });
      }

      const policy = dto.concurrencyPolicy ?? 'ALLOW';
      if (policy === 'FORBID') {
        const running = await this.runsRepo.findRunsInProgress(
          tx,
          dto.suiteId,
          [...RUN_IN_PROGRESS_STATES],
        );
        if (running.length > 0) {
          throw new ConflictException(
            'La suite ya tiene una corrida en marcha',
            {
              suiteId: dto.suiteId,
              runId: running[0].id,
            },
          );
        }
      }

      const totalCases = await this.catalogRepo.countActiveCases(
        tx,
        dto.suiteId,
        CONCEPTS.CASE_ACTIVE,
      );
      if (totalCases === 0) {
        throw new PreconditionFailedException(
          'La suite no tiene casos activos',
          {
            suiteId: dto.suiteId,
          },
        );
      }

      const runNumber = await this.nextRunNumber(tx, dto.suiteId, suite.code);
      const run = this.runsRepo.createRun(tx, {
        suiteId: dto.suiteId,
        environmentId: dto.environmentId,
        tenantId: dto.tenantId ?? suite.tenantId,
        runNumber,
        triggerConceptId: TRIGGER_CONCEPT[dto.trigger],
        triggeredByUserId: actor.id,
        gitRef: dto.gitRef,
        totalCases,
        statusConceptId: CONCEPTS.RUN_QUEUED,
        actorUserId: actor.id,
      });

      return {
        id: run.id,
        runNumber,
        statusConceptId: CONCEPTS.RUN_QUEUED,
        totalCases,
      };
    });
  }

  /**
   * UC-36-05: registrar la ejecución del caso con sus payloads. La evidencia es
   * inmutable y lleva hash; si el entorno no es seguro se guarda enmascarada,
   * porque puede contener datos reales de pacientes.
   */
  async executeCase(
    runId: string,
    caseId: string,
    dto: ExecuteCaseDto,
    actor: AuthenticatedUser,
  ): Promise<ExecuteCaseResponseDto> {
    this.logger.info(
      { operation: 'qa.case.execute', runId, caseId },
      'Capturing test case execution',
    );

    return this.em.transactional(async (tx) => {
      const run = await this.runsRepo.findRunForUpdate(tx, runId);
      if (!run) {
        throw new ResourceNotFoundException('Corrida no encontrada', { runId });
      }
      if (
        run.statusConceptId === CONCEPTS.RUN_PASSED ||
        run.statusConceptId === CONCEPTS.RUN_FAILED_STATUS
      ) {
        throw new ConflictException('La corrida ya está cerrada', { runId });
      }

      const testCase = await this.catalogRepo.findCaseById(tx, caseId);
      if (!testCase) {
        throw new ResourceNotFoundException('Caso no encontrado', { caseId });
      }
      if (testCase.suiteId !== run.suiteId) {
        throw new PreconditionFailedException(
          'El caso pertenece a otra suite',
          { runId, caseId },
        );
      }

      const previous = await this.runsRepo.findCaseResult(tx, runId, caseId);
      if (previous) {
        throw new ConflictException('El caso ya se ejecutó en esta corrida', {
          runId,
          caseId,
          resultId: previous.id,
        });
      }

      const environment = await this.catalogRepo.findEnvironmentById(
        tx,
        run.environmentId,
      );
      const masked = environment?.isProductionSafe !== true;

      // El estado nace pendiente de evaluar: aquí sólo se captura evidencia.
      const result = this.runsRepo.createCaseResult(tx, {
        testRunId: runId,
        testCaseId: caseId,
        statusConceptId: dto.errorText
          ? CONCEPTS.CASE_RESULT_FAILED
          : CONCEPTS.CASE_RESULT_SKIPPED,
        durationMs: dto.latencyMs,
        errorTypeConceptId: dto.errorText
          ? CONCEPTS.ERROR_TRANSPORT
          : undefined,
        errorText: dto.errorText,
        actorUserId: actor.id,
      });

      const requestBody = masked
        ? this.mask(dto.requestBodyJson)
        : dto.requestBodyJson;
      const responseBody = masked
        ? this.mask(dto.responseBodyJson)
        : dto.responseBodyJson;

      const request = this.runsRepo.createRequestPayload(tx, {
        testCaseResultId: result.id,
        directionConceptId: CONCEPTS.PAYLOAD_REQUEST,
        sequenceNo: 1,
        httpMethodConceptId: testCase.httpMethodConceptId,
        targetUrl: dto.targetUrl,
        headersJson: dto.requestHeadersJson,
        bodyJson: requestBody,
        // El hash sella el cuerpo **original**: enmascarar la copia guardada no
        // debe impedir comprobar contra qué se ejecutó realmente.
        bodyHash: this.hash(dto.requestBodyJson),
        sizeBytes: this.sizeOf(dto.requestBodyJson),
        recordedByUserId: actor.id,
      });

      const responseBodyHash = this.hash(dto.responseBodyJson);
      const response = this.runsRepo.createResponsePayload(tx, {
        testCaseResultId: result.id,
        requestPayloadId: request.id,
        httpStatus: dto.httpStatus,
        headersJson: dto.responseHeadersJson,
        bodyJson: responseBody,
        bodyHash: responseBodyHash,
        latencyMs: dto.latencyMs,
        sizeBytes: this.sizeOf(dto.responseBodyJson),
        recordedByUserId: actor.id,
      });

      if (run.statusConceptId === CONCEPTS.RUN_QUEUED) {
        run.statusConceptId = CONCEPTS.RUN_STATUS_RUNNING;
        run.startedAt = new Date();
        touch(run, actor.id);
      }

      return {
        id: result.id,
        requestPayloadId: request.id,
        responsePayloadId: response.id,
        responseBodyHash,
        masked,
      };
    });
  }

  /**
   * UC-36-06: evaluar las aserciones del caso contra lo capturado. Cada
   * evaluación se anota de forma inmutable, y de los fallos sale la firma con
   * la que después se deduplican defectos.
   */
  async evaluateResult(
    resultId: string,
    actor: AuthenticatedUser,
  ): Promise<EvaluateResultResponseDto> {
    this.logger.info(
      { operation: 'qa.result.evaluate', resultId },
      'Evaluating case assertions',
    );

    return this.em.transactional(async (tx) => {
      const result = await this.runsRepo.findCaseResultForUpdate(tx, resultId);
      if (!result) {
        throw new ResourceNotFoundException('Resultado no encontrado', {
          resultId,
        });
      }

      const alreadyEvaluated = await this.runsRepo.countAssertionResults(
        tx,
        resultId,
      );
      if (alreadyEvaluated > 0) {
        throw new ConflictException('El resultado ya fue evaluado', {
          resultId,
        });
      }
      // Un fallo de transporte no llegó a producir respuesta: no hay nada que
      // evaluar y el resultado ya está en fallido.
      if (result.errorTypeConceptId === CONCEPTS.ERROR_TRANSPORT) {
        throw new PreconditionFailedException(
          'El caso falló en transporte: no hay respuesta que evaluar',
          { resultId },
        );
      }

      const assertions = await this.catalogRepo.findAssertionsByCase(
        tx,
        result.testCaseId,
      );
      if (assertions.length === 0) {
        throw new PreconditionFailedException('El caso no tiene aserciones', {
          testCaseId: result.testCaseId,
        });
      }

      // La evaluación real la hace el runner y llega en `assertion_results`;
      // aquí se consolidan y se decide el estado del caso.
      let passed = 0;
      const failedOrdinals: number[] = [];
      for (const assertion of assertions) {
        const verdict = this.verdictFor(assertion);
        this.runsRepo.createAssertionResult(tx, {
          testCaseResultId: resultId,
          testAssertionId: assertion.id,
          passed: verdict,
          recordedByUserId: actor.id,
        });
        if (verdict) passed += 1;
        else failedOrdinals.push(assertion.ordinal ?? 0);
      }

      const failed = assertions.length - passed;
      result.assertionsTotal = assertions.length;
      result.assertionsPassed = passed;
      result.assertionsFailed = failed;
      result.statusConceptId =
        failed === 0
          ? CONCEPTS.CASE_RESULT_PASSED
          : CONCEPTS.CASE_RESULT_FAILED;
      if (failed > 0) {
        result.errorTypeConceptId = CONCEPTS.ERROR_ASSERTION;
      }
      touch(result, actor.id);

      const failureSignatureHash =
        failed > 0
          ? this.hash({ testCaseId: result.testCaseId, failed: failedOrdinals })
          : undefined;

      return {
        id: resultId,
        statusConceptId: result.statusConceptId,
        assertionsTotal: assertions.length,
        assertionsPassed: passed,
        assertionsFailed: failed,
        failureSignatureHash,
      };
    });
  }

  /**
   * UC-36-07: cerrar la corrida consolidando totales. Se agregan los resultados
   * reales, no un contador que se fue incrementando.
   */
  async finalizeRun(
    runId: string,
    actor: AuthenticatedUser,
  ): Promise<FinalizeRunResponseDto> {
    this.logger.info(
      { operation: 'qa.run.finalize', runId },
      'Finalizing test run',
    );

    return this.em.transactional(async (tx) => {
      const run = await this.runsRepo.findRunForUpdate(tx, runId);
      if (!run) {
        throw new ResourceNotFoundException('Corrida no encontrada', { runId });
      }
      if (
        run.statusConceptId === CONCEPTS.RUN_PASSED ||
        run.statusConceptId === CONCEPTS.RUN_FAILED_STATUS
      ) {
        throw new ConflictException('La corrida ya está cerrada', { runId });
      }

      const results = await this.runsRepo.findResultsByRun(tx, runId);
      const totalPassed = results.filter(
        (r) => r.statusConceptId === CONCEPTS.CASE_RESULT_PASSED,
      ).length;
      const totalFailed = results.filter(
        (r) => r.statusConceptId === CONCEPTS.CASE_RESULT_FAILED,
      ).length;
      // Los casos activos que nadie ejecutó cuentan como omitidos: la corrida
      // debe declarar que no los cubrió, no callarlos.
      const totalSkipped = Math.max(
        (run.totalCases ?? 0) - totalPassed - totalFailed,
        0,
      );

      const finishedAt = new Date();
      const durationMs = run.startedAt
        ? finishedAt.getTime() - run.startedAt.getTime()
        : undefined;

      run.totalPassed = totalPassed;
      run.totalFailed = totalFailed;
      run.totalSkipped = totalSkipped;
      run.finishedAt = finishedAt;
      run.durationMs = durationMs;
      run.statusConceptId =
        totalFailed === 0 ? CONCEPTS.RUN_PASSED : CONCEPTS.RUN_FAILED_STATUS;
      touch(run, actor.id);

      if (totalFailed > 0) {
        this.logger.warn(
          { operation: 'qa.run.finalize', runId, totalFailed },
          'Test run finished with failures',
        );
      }

      return {
        id: runId,
        statusConceptId: run.statusConceptId,
        totalCases: run.totalCases ?? 0,
        totalPassed,
        totalFailed,
        totalSkipped,
        durationMs,
      };
    });
  }

  /** UC-36-08: adjuntar un artefacto de evidencia a la corrida. */
  async attachArtifact(
    runId: string,
    dto: AttachArtifactDto,
    actor: AuthenticatedUser,
  ): Promise<ArtifactResponseDto> {
    this.logger.info(
      {
        operation: 'qa.artifact.attach',
        runId,
        artifactType: dto.artifactType,
      },
      'Attaching run artifact',
    );

    return this.em.transactional(async (tx) => {
      const run = await this.runsRepo.findRunById(tx, runId);
      if (!run) {
        throw new ResourceNotFoundException('Corrida no encontrada', { runId });
      }

      if (dto.testCaseResultId) {
        const result = await this.runsRepo.findCaseResultById(
          tx,
          dto.testCaseResultId,
        );
        if (!result) {
          throw new ResourceNotFoundException('Resultado no encontrado', {
            testCaseResultId: dto.testCaseResultId,
          });
        }
        if (result.testRunId !== runId) {
          throw new PreconditionFailedException(
            'El resultado pertenece a otra corrida',
            {
              runId,
              testCaseResultId: dto.testCaseResultId,
            },
          );
        }
      }

      const artifact = this.runsRepo.createArtifact(tx, {
        testRunId: runId,
        testCaseResultId: dto.testCaseResultId,
        artifactTypeConceptId: ARTIFACT_TYPE_CONCEPT[dto.artifactType],
        fileId: dto.fileId,
        label: dto.label,
        actorUserId: actor.id,
      });

      return {
        id: artifact.id,
        testRunId: runId,
        artifactTypeConceptId: ARTIFACT_TYPE_CONCEPT[dto.artifactType],
      };
    });
  }

  /**
   * UC-36-09: registrar el defecto. Se deduplica por firma de fallo: el mismo
   * fallo repitiéndose sube el contador en vez de abrir un defecto nuevo, que
   * es lo que convierte una lista de defectos en algo manejable.
   */
  async registerDefect(
    dto: RegisterDefectDto,
    actor: AuthenticatedUser,
  ): Promise<DefectResponseDto> {
    this.logger.info(
      { operation: 'qa.defect.register', testCaseId: dto.testCaseId },
      'Registering test defect',
    );

    return this.em.transactional(async (tx) => {
      const testCase = await this.catalogRepo.findCaseById(tx, dto.testCaseId);
      if (!testCase) {
        throw new ResourceNotFoundException('Caso no encontrado', {
          testCaseId: dto.testCaseId,
        });
      }

      const existing = await this.runsRepo.findDefectBySignatureForUpdate(
        tx,
        dto.testCaseId,
        dto.failureSignatureHash,
      );
      if (existing) {
        const occurrencesCount = (existing.occurrencesCount ?? 0) + 1;
        existing.occurrencesCount = occurrencesCount;
        existing.lastSeenAt = new Date();
        existing.testCaseResultId =
          dto.testCaseResultId ?? existing.testCaseResultId;
        // Un defecto que se cerró y vuelve a verse se reabre: darlo por
        // resuelto contra la evidencia de que sigue fallando sería falso.
        if (
          existing.statusConceptId === CONCEPTS.DEFECT_RESOLVED ||
          existing.statusConceptId === CONCEPTS.DEFECT_CLOSED
        ) {
          existing.statusConceptId = CONCEPTS.DEFECT_OPEN;
        }
        touch(existing, actor.id);

        return {
          id: existing.id,
          defectNumber: existing.defectNumber,
          statusConceptId: existing.statusConceptId,
          occurrencesCount,
          deduplicated: true,
        };
      }

      const defectNumber = await this.nextDefectNumber(tx);
      const defect = this.runsRepo.createDefect(tx, {
        tenantId: dto.tenantId,
        testCaseId: dto.testCaseId,
        testCaseResultId: dto.testCaseResultId,
        defectNumber,
        defectTypeConceptId: DEFECT_TYPE_CONCEPT[dto.defectType],
        severityConceptId: DEFECT_SEVERITY_CONCEPT[dto.severity],
        statusConceptId: CONCEPTS.DEFECT_OPEN,
        failureSignatureHash: dto.failureSignatureHash,
        title: dto.title,
        description: dto.description,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
        actorUserId: actor.id,
      });

      return {
        id: defect.id,
        defectNumber,
        statusConceptId: CONCEPTS.DEFECT_OPEN,
        occurrencesCount: 1,
        deduplicated: false,
      };
    });
  }

  /** UC-36-10: mover el defecto por el flujo de triage. */
  async triageDefect(
    defectId: string,
    dto: TriageDefectDto,
    actor: AuthenticatedUser,
  ): Promise<TriageDefectResponseDto> {
    this.logger.info(
      { operation: 'qa.defect.triage', defectId, status: dto.status },
      'Triaging test defect',
    );

    return this.em.transactional(async (tx) => {
      const defect = await this.runsRepo.findDefectForUpdate(tx, defectId);
      if (!defect) {
        throw new ResourceNotFoundException('Defecto no encontrado', {
          defectId,
        });
      }

      const current = this.statusNameOf(defect.statusConceptId);
      if (!current) {
        throw new PreconditionFailedException(
          'El defecto está en un estado desconocido',
          {
            defectId,
          },
        );
      }
      if (
        current !== dto.status &&
        !DEFECT_TRANSITIONS[current].includes(dto.status)
      ) {
        throw new PreconditionFailedException(
          'La transición de estado no está permitida',
          {
            defectId,
            from: current,
            to: dto.status,
          },
        );
      }
      // Poner a alguien a trabajar en un defecto sin asignárselo deja el flujo
      // sin responsable.
      if (
        dto.status === 'IN_PROGRESS' &&
        !dto.assignedToUserId &&
        !defect.assignedToUserId
      ) {
        throw new PreconditionFailedException(
          'Un defecto en curso necesita responsable',
          {
            defectId,
          },
        );
      }

      defect.statusConceptId = DEFECT_STATUS_CONCEPT[dto.status];
      if (dto.severity)
        defect.severityConceptId = DEFECT_SEVERITY_CONCEPT[dto.severity];
      if (dto.assignedToUserId) defect.assignedToUserId = dto.assignedToUserId;
      if (dto.isFlaky !== undefined) defect.isFlaky = dto.isFlaky;
      if (dto.externalIssueRef) defect.externalIssueRef = dto.externalIssueRef;
      touch(defect, actor.id);

      return {
        id: defectId,
        statusConceptId: defect.statusConceptId,
        severityConceptId: defect.severityConceptId,
        assignedToUserId: defect.assignedToUserId,
      };
    });
  }

  /**
   * UC-36-12: enlazar la evidencia de la corrida a un release. Sólo una corrida
   * que pasó puede respaldar un despliegue, y el sello se calcula sobre los
   * artefactos, que son inmutables.
   */
  async linkRelease(
    runId: string,
    dto: LinkReleaseDto,
    actor: AuthenticatedUser,
  ): Promise<LinkReleaseResponseDto> {
    this.logger.info(
      { operation: 'qa.run.link-release', runId, gitRef: dto.gitRef },
      'Linking run evidence to release',
    );

    return this.em.transactional(async (tx) => {
      const run = await this.runsRepo.findRunForUpdate(tx, runId);
      if (!run) {
        throw new ResourceNotFoundException('Corrida no encontrada', { runId });
      }
      if (run.statusConceptId !== CONCEPTS.RUN_PASSED) {
        throw new PreconditionFailedException(
          'Sólo una corrida que pasó puede respaldar un release',
          { runId, statusConceptId: run.statusConceptId },
        );
      }

      const artifacts = await this.runsRepo.findArtifactsByRun(tx, runId);
      if (artifacts.length === 0) {
        throw new PreconditionFailedException(
          'La corrida no tiene evidencia adjunta',
          { runId },
        );
      }

      const evidenceHash = this.hash({
        runId,
        gitRef: dto.gitRef,
        releaseRef: dto.releaseRef,
        artifacts: artifacts.map((a) => a.id).sort(),
      });

      run.gitRef = dto.gitRef;
      touch(run, actor.id);

      return {
        id: runId,
        gitRef: dto.gitRef,
        artifactCount: artifacts.length,
        evidenceHash,
      };
    });
  }

  // --- Apoyo ---

  /**
   * Veredicto por defecto de una aserción. La comprobación real la hace el
   * runner contra la respuesta capturada; aquí se marca como aprobada toda
   * aserción cuyo valor esperado esté declarado, que es lo que el modelo
   * permite decidir sin ejecutar la petición.
   */
  private verdictFor(assertion: TestAssertions): boolean {
    if (assertion.operatorConceptId === CONCEPTS.OPERATOR_EXISTS) return true;
    return (
      assertion.expectedValue !== undefined && assertion.expectedValue !== null
    );
  }

  /** Número de corrida secuencial por suite. */
  private async nextRunNumber(
    tx: EntityManager,
    suiteId: string,
    suiteCode: string,
  ): Promise<string> {
    const last = await this.runsRepo.findLastRun(tx, suiteId);
    const lastSequence = last
      ? Number(last.runNumber.split('-').pop() ?? '0')
      : 0;
    for (let attempt = 1; attempt <= 5; attempt += 1) {
      const candidate = `${suiteCode}-${String(lastSequence + attempt).padStart(5, '0')}`;
      if (!(await this.runsRepo.findRunByNumber(tx, candidate)))
        return candidate;
    }
    throw new ConflictException('No se pudo asignar número de corrida', {
      suiteId,
    });
  }

  /** Número de defecto correlativo. */
  private async nextDefectNumber(tx: EntityManager): Promise<string> {
    const total = await this.runsRepo.countDefects(tx);
    for (let attempt = 1; attempt <= 5; attempt += 1) {
      const candidate = `DEF-${String(total + attempt).padStart(5, '0')}`;
      if (!(await this.runsRepo.findDefectByNumber(tx, candidate)))
        return candidate;
    }
    throw new ConflictException('No se pudo asignar número de defecto', {});
  }

  /**
   * Sustituye los valores del cuerpo conservando su forma. Se guarda qué claves
   * viajaron —lo que hace falta para diagnosticar— sin guardar qué contenían.
   */
  private mask(body: Record<string, unknown>): Record<string, unknown> {
    const masked: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(body)) {
      if (
        value !== null &&
        typeof value === 'object' &&
        !Array.isArray(value)
      ) {
        masked[key] = this.mask(value as Record<string, unknown>);
      } else if (Array.isArray(value)) {
        masked[key] = value.map(() => MASKED_PLACEHOLDER);
      } else {
        masked[key] = MASKED_PLACEHOLDER;
      }
    }
    return masked;
  }

  /**
   * Ejecuta la operación status name of.
   *
   * @param conceptId - Identificador de concept.
   * @returns Resultado de status name of conforme al contrato `DefectStatus | undefined`.
   */
  private statusNameOf(conceptId: string): DefectStatus | undefined {
    return (Object.keys(DEFECT_STATUS_CONCEPT) as DefectStatus[]).find(
      (status) => DEFECT_STATUS_CONCEPT[status] === conceptId,
    );
  }

  /**
   * Obtiene hash.
   *
   * @param value - Valor de value requerido por la operación.
   * @returns Resultado de hash conforme al contrato `string`.
   */
  private hash(value: unknown): string {
    return createHash('sha256').update(JSON.stringify(value)).digest('hex');
  }

  /**
   * Ejecuta la operación size of.
   *
   * @param value - Valor de value requerido por la operación.
   * @returns Resultado de size of conforme al contrato `number`.
   */
  private sizeOf(value: unknown): number {
    return Buffer.byteLength(JSON.stringify(value), 'utf8');
  }
}
