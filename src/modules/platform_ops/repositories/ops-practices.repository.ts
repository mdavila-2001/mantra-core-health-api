import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  OperationalReadinessReviews,
  ReadinessReviewFindings,
  Runbooks,
  RunbookVersions,
  RunbookExecutions,
  ResilienceExercises,
  RecoveryObjectives,
} from '../entities';
import { createdBy } from '../../../common';

/**
 * Acceso a las prácticas operativas de `platform_ops.*`: revisiones de
 * preparación con sus hallazgos, runbooks con sus versiones y ejecuciones, y
 * ejercicios de resiliencia contra los objetivos de recuperación.
 */
@Injectable()
export class OpsPracticesRepository {
  // --- Revisión de preparación (UC-46-12) ---

  findReviewForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<OperationalReadinessReviews | null> {
    return em.findOne(
      OperationalReadinessReviews,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /**
   * Revisión completada con decisión "go" del componente en el entorno dado.
   * Es la precondición del despliegue a producción.
   */
  findGoReview(
    em: EntityManager,
    serviceComponentId: string,
    completedStateConceptId: string,
    goDecisionConceptId: string,
  ): Promise<OperationalReadinessReviews | null> {
    return em.findOne(
      OperationalReadinessReviews,
      {
        serviceComponentId,
        statusConceptId: completedStateConceptId,
        decisionConceptId: goDecisionConceptId,
      },
      { orderBy: { completedAt: 'DESC' } },
    );
  }

  /** Hallazgos de la revisión, bloqueados: cerrarlos es una operación en bloque. */
  findFindingsForUpdate(
    em: EntityManager,
    operationalReadinessReviewId: string,
  ): Promise<ReadinessReviewFindings[]> {
    return em.find(
      ReadinessReviewFindings,
      { operationalReadinessReviewId },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  // --- Runbooks (UC-46-13) ---

  findRunbookForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<Runbooks | null> {
    return em.findOne(
      Runbooks,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /** Versión inmutable: el checksum fija el contenido publicado. */
  createRunbookVersion(
    em: EntityManager,
    data: {
      runbookId: string;
      versionNumber: number;
      contentMarkdown: string;
      automationDefinitionJson?: unknown;
      approvedByUserId: string;
    },
  ): RunbookVersions {
    return em.create(
      RunbookVersions,
      {
        runbookId: data.runbookId,
        versionNumber: data.versionNumber,
        contentMarkdown: data.contentMarkdown,
        automationDefinitionJson: data.automationDefinitionJson,
        approvedByUserId: data.approvedByUserId,
        approvedAt: new Date(),
      },
      { partial: true },
    );
  }

  findRunbookVersion(
    em: EntityManager,
    runbookId: string,
    versionNumber: number,
  ): Promise<RunbookVersions | null> {
    return em.findOne(RunbookVersions, { runbookId, versionNumber });
  }

  findRunbookVersionById(
    em: EntityManager,
    id: string,
  ): Promise<RunbookVersions | null> {
    return em.findOne(RunbookVersions, { id });
  }

  findLatestRunbookVersion(
    em: EntityManager,
    runbookId: string,
  ): Promise<RunbookVersions | null> {
    return em.findOne(
      RunbookVersions,
      { runbookId },
      { orderBy: { versionNumber: 'DESC' } },
    );
  }

  /** Log append-only de ejecuciones: lo ejecutado queda como ocurrió. */
  createRunbookExecution(
    em: EntityManager,
    data: {
      runbookVersionId: string;
      healthIncidentId?: string;
      changeRequestId?: string;
      executionModeConceptId: string;
      startedAt: Date;
      endedAt?: Date;
      resultConceptId: string;
      initiatedByUserId: string;
      executionLogUri?: string;
      outputJson?: unknown;
    },
  ): RunbookExecutions {
    return em.create(
      RunbookExecutions,
      {
        runbookVersionId: data.runbookVersionId,
        healthIncidentId: data.healthIncidentId,
        changeRequestId: data.changeRequestId,
        executionModeConceptId: data.executionModeConceptId,
        startedAt: data.startedAt,
        endedAt: data.endedAt,
        resultConceptId: data.resultConceptId,
        initiatedByUserId: data.initiatedByUserId,
        executionLogUri: data.executionLogUri,
        outputJson: data.outputJson,
      },
      { partial: true },
    );
  }

  // --- Resiliencia (UC-46-14) ---

  findExerciseForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<ResilienceExercises | null> {
    return em.findOne(
      ResilienceExercises,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /**
   * Objetivo de recuperación vigente del componente, bloqueado: el ejercicio se
   * mide contra él y no debe cambiar mientras se compara.
   */
  findRecoveryObjectiveForUpdate(
    em: EntityManager,
    serviceComponentId: string,
    activeStateConceptId: string,
  ): Promise<RecoveryObjectives | null> {
    return em.findOne(
      RecoveryObjectives,
      { serviceComponentId, stateConceptId: activeStateConceptId },
      {
        lockMode: LockMode.PESSIMISTIC_WRITE,
        orderBy: { effectiveFrom: 'DESC' },
      },
    );
  }
}
