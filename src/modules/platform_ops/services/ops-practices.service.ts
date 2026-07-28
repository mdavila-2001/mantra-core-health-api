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
import {
  OpsPracticesRepository,
  OpsIncidentsRepository,
  OpsImprovementsRepository,
} from '../repositories';
import {
  CompleteReadinessReviewDto,
  ReadinessReviewResponseDto,
  PublishRunbookVersionDto,
  RunbookVersionResponseDto,
  RecordRunbookExecutionDto,
  RunbookExecutionResponseDto,
  CompleteResilienceExerciseDto,
  ResilienceExerciseResponseDto,
  type ExecutionMode,
  type ExecutionResult,
} from '../dto';

const EXECUTION_MODE_CONCEPT: Readonly<Record<ExecutionMode, string>> = {
  MANUAL: CONCEPTS.RUNBOOK_EXEC_MANUAL,
  ASSISTED: CONCEPTS.RUNBOOK_EXEC_ASSISTED,
  AUTOMATED: CONCEPTS.RUNBOOK_EXEC_AUTOMATED,
};

const EXECUTION_RESULT_CONCEPT: Readonly<Record<ExecutionResult, string>> = {
  SUCCESS: CONCEPTS.RUNBOOK_RESULT_SUCCESS,
  PARTIAL: CONCEPTS.RUNBOOK_RESULT_PARTIAL,
  FAILED: CONCEPTS.RUNBOOK_RESULT_FAILED,
  ABORTED: CONCEPTS.RUNBOOK_RESULT_ABORTED,
};

/** Severidades de hallazgo que impiden aprobar la revisión con "go". */
const BLOCKING_FINDING_SEVERITIES: readonly string[] = [
  CONCEPTS.FINDING_SEV_CRITICAL,
  CONCEPTS.FINDING_SEV_HIGH,
];

/**
 * Prácticas operativas: revisión de preparación como puerta previa al
 * despliegue, versiones y ejecuciones de runbook, y ejercicios de resiliencia
 * medidos contra los objetivos de recuperación (UC-46-12 … 14).
 */
@Injectable()
export class OpsPracticesService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param practicesRepo - Valor de practices repo requerido por la operación.
   * @param incidentsRepo - Valor de incidents repo requerido por la operación.
   * @param improvementsRepo - Valor de improvements repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly practicesRepo: OpsPracticesRepository,
    private readonly incidentsRepo: OpsIncidentsRepository,
    private readonly improvementsRepo: OpsImprovementsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(OpsPracticesService.name);
  }

  /**
   * UC-46-12: cerrar la revisión con su decisión. Un hallazgo crítico o alto sin
   * resolver impide el "go": es exactamente lo que la revisión existe para
   * detener.
   */
  async completeReadinessReview(
    reviewId: string,
    dto: CompleteReadinessReviewDto,
    actor: AuthenticatedUser,
  ): Promise<ReadinessReviewResponseDto> {
    this.logger.info(
      { operation: 'ops.readiness.complete', reviewId, decision: dto.decision },
      'Completing readiness review',
    );

    return this.em.transactional(async (tx) => {
      const review = await this.practicesRepo.findReviewForUpdate(tx, reviewId);
      if (!review) {
        throw new ResourceNotFoundException(
          'Revisión de preparación no encontrada',
          { reviewId },
        );
      }
      if (review.statusConceptId !== CONCEPTS.ORR_IN_PROGRESS) {
        throw new PreconditionFailedException('La revisión no está en curso', {
          reviewId,
        });
      }

      const findings = await this.practicesRepo.findFindingsForUpdate(
        tx,
        reviewId,
      );
      const byId = new Map(findings.map((finding) => [finding.id, finding]));

      let resolvedCount = 0;
      for (const resolved of dto.resolvedFindings ?? []) {
        const finding = byId.get(resolved.findingId);
        if (!finding) {
          throw new ResourceNotFoundException(
            'El hallazgo no pertenece a esta revisión',
            {
              reviewId,
              findingId: resolved.findingId,
            },
          );
        }
        if (finding.statusConceptId !== CONCEPTS.FINDING_OPEN) {
          throw new ConflictException('El hallazgo ya no está abierto', {
            reviewId,
            findingId: resolved.findingId,
          });
        }
        finding.statusConceptId = CONCEPTS.FINDING_RESOLVED;
        finding.resolvedAt = new Date();
        if (resolved.evidenceJson) finding.evidenceJson = resolved.evidenceJson;
        touch(finding, actor.id);
        resolvedCount += 1;
      }

      const stillOpen = findings.filter(
        (finding) => finding.statusConceptId === CONCEPTS.FINDING_OPEN,
      );
      if (dto.decision === 'GO') {
        const blocking = stillOpen.find((finding) =>
          BLOCKING_FINDING_SEVERITIES.includes(finding.severityConceptId),
        );
        if (blocking) {
          throw new PreconditionFailedException(
            'Quedan hallazgos críticos o altos sin resolver',
            { reviewId, findingId: blocking.id },
          );
        }
      }

      // Lo que queda abierto no se pierde: entra al backlog con dueño, o el
      // cierre de la revisión lo dejaría sin nadie detrás.
      const improvementItemIds = stillOpen.map(
        (finding) =>
          this.improvementsRepo.createImprovementItem(tx, {
            serviceComponentId: review.serviceComponentId,
            readinessReviewFindingId: finding.id,
            sourceTypeConceptId: CONCEPTS.IMPROVEMENT_SOURCE_READINESS,
            title: `${finding.findingCode}: ${finding.title}`.slice(0, 300),
            description: finding.description,
            priorityConceptId: BLOCKING_FINDING_SEVERITIES.includes(
              finding.severityConceptId,
            )
              ? CONCEPTS.IMPROVEMENT_PRIORITY_HIGH
              : CONCEPTS.IMPROVEMENT_PRIORITY_MEDIUM,
            statusConceptId: CONCEPTS.IMPROVEMENT_OPEN,
            ownerUserId: finding.ownerUserId ?? dto.improvementOwnerUserId,
            dueAt: finding.dueAt,
            actorUserId: actor.id,
          }).id,
      );

      review.statusConceptId = CONCEPTS.ORR_COMPLETED;
      review.decisionConceptId =
        dto.decision === 'GO'
          ? CONCEPTS.ORR_DECISION_GO
          : CONCEPTS.ORR_DECISION_NO_GO;
      review.completedAt = new Date();
      if (dto.evidenceJson) review.evidenceJson = dto.evidenceJson;
      touch(review, actor.id);

      if (dto.decision === 'NO_GO') {
        this.logger.warn(
          {
            operation: 'ops.readiness.complete',
            reviewId,
            openFindings: stillOpen.length,
          },
          'Readiness review closed with no-go',
        );
      }

      return {
        id: reviewId,
        statusConceptId: CONCEPTS.ORR_COMPLETED,
        decisionConceptId: review.decisionConceptId,
        resolvedCount,
        improvementItemIds,
      };
    });
  }

  /**
   * UC-46-13: publicar una versión del runbook. La versión es inmutable y pasa
   * a ser la vigente; corregir es publicar otra, no reescribir la anterior, que
   * es la que quedó registrada en las ejecuciones ya hechas.
   */
  async publishRunbookVersion(
    runbookId: string,
    dto: PublishRunbookVersionDto,
    actor: AuthenticatedUser,
  ): Promise<RunbookVersionResponseDto> {
    this.logger.info(
      { operation: 'ops.runbook.publish', runbookId },
      'Publishing runbook version',
    );

    return this.em.transactional(async (tx) => {
      const runbook = await this.practicesRepo.findRunbookForUpdate(
        tx,
        runbookId,
      );
      if (!runbook) {
        throw new ResourceNotFoundException('Runbook no encontrado', {
          runbookId,
        });
      }
      if (runbook.stateConceptId !== CONCEPTS.STATE_ACTIVE) {
        throw new PreconditionFailedException('El runbook no está activo', {
          runbookId,
        });
      }

      const latest = await this.practicesRepo.findLatestRunbookVersion(
        tx,
        runbookId,
      );
      const versionNumber = (latest?.versionNumber ?? 0) + 1;
      const taken = await this.practicesRepo.findRunbookVersion(
        tx,
        runbookId,
        versionNumber,
      );
      if (taken) {
        throw new ConflictException('Esa versión del runbook ya existe', {
          runbookId,
          versionNumber,
        });
      }

      const version = this.practicesRepo.createRunbookVersion(tx, {
        runbookId,
        versionNumber,
        contentMarkdown: dto.contentMarkdown,
        automationDefinitionJson: dto.automationDefinitionJson,
        approvedByUserId: actor.id,
      });

      runbook.currentVersionId = version.id;
      touch(runbook, actor.id);

      return { id: version.id, versionNumber, runbookId };
    });
  }

  /**
   * UC-46-13: registrar la ejecución de un runbook. Si se ejecutó dentro de un
   * incidente, queda además en su timeline: reconstruir la respuesta sin saber
   * qué se ejecutó es la mitad de la historia.
   */
  async recordRunbookExecution(
    dto: RecordRunbookExecutionDto,
    actor: AuthenticatedUser,
  ): Promise<RunbookExecutionResponseDto> {
    this.logger.info(
      {
        operation: 'ops.runbook.execute',
        runbookVersionId: dto.runbookVersionId,
      },
      'Recording runbook execution',
    );

    const startedAt = new Date(dto.startedAt);
    const endedAt = dto.endedAt ? new Date(dto.endedAt) : undefined;
    if (endedAt && endedAt < startedAt) {
      throw new PreconditionFailedException(
        'La ejecución termina antes de empezar',
        {
          runbookVersionId: dto.runbookVersionId,
        },
      );
    }

    return this.em.transactional(async (tx) => {
      const version = await this.practicesRepo.findRunbookVersionById(
        tx,
        dto.runbookVersionId,
      );
      if (!version) {
        throw new ResourceNotFoundException(
          'Versión de runbook no encontrada',
          {
            runbookVersionId: dto.runbookVersionId,
          },
        );
      }

      if (dto.healthIncidentId) {
        const incident = await this.incidentsRepo.findIncidentById(
          tx,
          dto.healthIncidentId,
        );
        if (!incident) {
          throw new ResourceNotFoundException('Incidente no encontrado', {
            healthIncidentId: dto.healthIncidentId,
          });
        }
      }

      const resultConceptId = EXECUTION_RESULT_CONCEPT[dto.result];
      const execution = this.practicesRepo.createRunbookExecution(tx, {
        runbookVersionId: dto.runbookVersionId,
        healthIncidentId: dto.healthIncidentId,
        changeRequestId: dto.changeRequestId,
        executionModeConceptId: EXECUTION_MODE_CONCEPT[dto.mode],
        startedAt,
        endedAt,
        resultConceptId,
        initiatedByUserId: actor.id,
        executionLogUri: dto.executionLogUri,
        outputJson: dto.outputJson,
      });

      let timelineEventId: string | undefined;
      if (dto.healthIncidentId) {
        timelineEventId = this.incidentsRepo.createTimelineEvent(tx, {
          healthIncidentId: dto.healthIncidentId,
          eventTypeConceptId: CONCEPTS.TIMELINE_RUNBOOK_EXECUTED,
          actorUserId: actor.id,
          summary: `Runbook v${version.versionNumber} ejecutado en modo ${dto.mode}: ${dto.result}`,
          sourceReference: execution.id,
        }).id;
      }

      if (dto.result === 'FAILED' || dto.result === 'ABORTED') {
        this.logger.warn(
          {
            operation: 'ops.runbook.execute',
            executionId: execution.id,
            result: dto.result,
          },
          'Runbook execution did not complete',
        );
      }

      return { id: execution.id, resultConceptId, timelineEventId };
    });
  }

  /**
   * UC-46-14: cerrar el ejercicio comparando lo observado con el objetivo de
   * recuperación. El resultado se deriva de esa comparación, no se declara:
   * dejar que quien ejecuta el simulacro se ponga la nota lo vaciaría de valor.
   */
  async completeResilienceExercise(
    exerciseId: string,
    dto: CompleteResilienceExerciseDto,
    actor: AuthenticatedUser,
  ): Promise<ResilienceExerciseResponseDto> {
    this.logger.info(
      { operation: 'ops.resilience.complete', exerciseId },
      'Completing resilience exercise',
    );

    const startedAt = new Date(dto.startedAt);
    const endedAt = new Date(dto.endedAt);
    if (endedAt < startedAt) {
      throw new PreconditionFailedException(
        'El ejercicio termina antes de empezar',
        {
          exerciseId,
        },
      );
    }

    return this.em.transactional(async (tx) => {
      const exercise = await this.practicesRepo.findExerciseForUpdate(
        tx,
        exerciseId,
      );
      if (!exercise) {
        throw new ResourceNotFoundException(
          'Ejercicio de resiliencia no encontrado',
          {
            exerciseId,
          },
        );
      }
      if (exercise.resultConceptId) {
        throw new ConflictException('El ejercicio ya está cerrado', {
          exerciseId,
        });
      }

      const objective = await this.practicesRepo.findRecoveryObjectiveForUpdate(
        tx,
        exercise.serviceComponentId,
        CONCEPTS.STATE_ACTIVE,
      );
      // Sin objetivo no hay contra qué medir, y un ejercicio sin criterio de
      // éxito no dice si el servicio se recupera a tiempo o no.
      if (!objective) {
        throw new PreconditionFailedException(
          'El componente no tiene objetivo de recuperación vigente',
          { exerciseId, serviceComponentId: exercise.serviceComponentId },
        );
      }

      // Los segundos son `bigint`: se comparan como tales para que un objetivo
      // muy largo no pierda precisión al pasar por `number`.
      const rtoBreached =
        BigInt(dto.observedRtoSeconds) > BigInt(objective.rtoSeconds);
      const rpoBreached =
        dto.observedRpoSeconds !== undefined &&
        BigInt(dto.observedRpoSeconds) > BigInt(objective.rpoSeconds);
      const resultConceptId =
        rtoBreached || rpoBreached
          ? CONCEPTS.RESILIENCE_FAIL
          : CONCEPTS.RESILIENCE_PASS;

      exercise.startedAt = startedAt;
      exercise.endedAt = endedAt;
      exercise.resultConceptId = resultConceptId;
      exercise.observedRtoSeconds = dto.observedRtoSeconds;
      exercise.observedRpoSeconds = dto.observedRpoSeconds;
      exercise.evidenceUri = dto.evidenceUri;
      exercise.findingsJson = dto.findingsJson;
      touch(exercise, actor.id);

      let improvementItemId: string | undefined;
      if (rtoBreached || rpoBreached) {
        improvementItemId = this.improvementsRepo.createImprovementItem(tx, {
          tenantId: exercise.tenantId,
          serviceComponentId: exercise.serviceComponentId,
          sourceTypeConceptId: CONCEPTS.IMPROVEMENT_SOURCE_RESILIENCE,
          title:
            `Recuperación fuera de objetivo en ${exercise.scenarioName}`.slice(
              0,
              300,
            ),
          description: rtoBreached
            ? `RTO observado ${dto.observedRtoSeconds}s frente a objetivo ${objective.rtoSeconds}s`
            : `RPO observado ${dto.observedRpoSeconds}s frente a objetivo ${objective.rpoSeconds}s`,
          priorityConceptId: CONCEPTS.IMPROVEMENT_PRIORITY_HIGH,
          statusConceptId: CONCEPTS.IMPROVEMENT_OPEN,
          ownerUserId: dto.improvementOwnerUserId,
          actorUserId: actor.id,
        }).id;

        this.logger.warn(
          {
            operation: 'ops.resilience.complete',
            exerciseId,
            rtoBreached,
            rpoBreached,
          },
          'Resilience exercise missed its recovery objective',
        );
      }

      return {
        id: exerciseId,
        resultConceptId,
        rtoBreached,
        rpoBreached,
        improvementItemId,
      };
    });
  }
}
