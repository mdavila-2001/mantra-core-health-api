import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  AssessmentControlResults,
  AssessmentFindings,
  OperationalFrameworkControls,
  OperationalFrameworks,
  RemediationActions,
  RemediationPlans,
  WorkloadAssessments,
} from '../entities';
import { createdBy } from '../../../common';

/**
 * Acceso a datos del ciclo de assurance operativo: frameworks y sus controles
 * (UC-11-11), evaluaciones de workload y resultados de control (UC-11-12),
 * hallazgos, planes y acciones de remediación (UC-11-13/14).
 */
@Injectable()
export class AssessmentRepository {
  // --- Frameworks y controles ---
  findFrameworkByCodeVersion(
    em: EntityManager,
    code: string,
    version: string,
  ): Promise<OperationalFrameworks | null> {
    return em.findOne(OperationalFrameworks, { code, version });
  }

  findFrameworkById(em: EntityManager, id: string): Promise<OperationalFrameworks | null> {
    return em.findOne(OperationalFrameworks, { id });
  }

  createFramework(
    em: EntityManager,
    data: {
      code: string;
      name: string;
      providerConceptId: string;
      version: string;
      sourceUrl?: string;
      publishedAt: Date;
      stateConceptId: string;
      actorUserId?: string;
    },
  ): OperationalFrameworks {
    const { actorUserId, ...rest } = data;
    return em.create(OperationalFrameworks, { ...rest, ...createdBy(actorUserId) }, { partial: true });
  }

  createControl(
    em: EntityManager,
    data: {
      operationalFrameworkId: string;
      parentControlId?: string;
      controlCode: string;
      title: string;
      pillarConceptId?: string;
      objectiveText?: string;
      evidenceRequirementsJson?: unknown;
      assessmentGuidanceJson?: unknown;
      stateConceptId: string;
      actorUserId?: string;
    },
  ): OperationalFrameworkControls {
    const { actorUserId, ...rest } = data;
    return em.create(OperationalFrameworkControls, { ...rest, ...createdBy(actorUserId) }, { partial: true });
  }

  findControlById(em: EntityManager, id: string): Promise<OperationalFrameworkControls | null> {
    return em.findOne(OperationalFrameworkControls, { id });
  }

  // --- Evaluaciones y resultados ---
  findAssessmentById(em: EntityManager, id: string): Promise<WorkloadAssessments | null> {
    return em.findOne(WorkloadAssessments, { id });
  }

  createAssessment(
    em: EntityManager,
    data: {
      tenantId: string;
      operationalFrameworkId: string;
      workloadCode: string;
      workloadName: string;
      assessmentTypeConceptId: string;
      statusConceptId: string;
      assessmentPeriodStart?: Date;
      assessmentPeriodEnd?: Date;
      facilitatorUserId?: string;
      actorUserId?: string;
    },
  ): WorkloadAssessments {
    const { actorUserId, ...rest } = data;
    return em.create(WorkloadAssessments, { ...rest, ...createdBy(actorUserId) }, { partial: true });
  }

  findControlResult(
    em: EntityManager,
    workloadAssessmentId: string,
    operationalFrameworkControlId: string,
  ): Promise<AssessmentControlResults | null> {
    return em.findOne(AssessmentControlResults, { workloadAssessmentId, operationalFrameworkControlId });
  }

  createControlResult(
    em: EntityManager,
    data: {
      workloadAssessmentId: string;
      operationalFrameworkControlId: string;
      resultConceptId: string;
      maturityLevelConceptId?: string;
      evidenceSummary?: string;
      evidenceLinksJson?: unknown;
      assessorUserId?: string;
      actorUserId?: string;
    },
  ): AssessmentControlResults {
    const { actorUserId, ...rest } = data;
    return em.create(
      AssessmentControlResults,
      { ...rest, assessedAt: new Date(), ...createdBy(actorUserId) },
      { partial: true },
    );
  }

  // --- Hallazgos, planes y acciones ---
  findFindingById(em: EntityManager, id: string): Promise<AssessmentFindings | null> {
    return em.findOne(AssessmentFindings, { id });
  }

  findFindingByCode(
    em: EntityManager,
    workloadAssessmentId: string,
    findingCode: string,
  ): Promise<AssessmentFindings | null> {
    return em.findOne(AssessmentFindings, { workloadAssessmentId, findingCode });
  }

  createFinding(
    em: EntityManager,
    data: {
      workloadAssessmentId: string;
      assessmentControlResultId?: string;
      findingCode: string;
      title: string;
      description?: string;
      severityConceptId: string;
      statusConceptId: string;
      ownerTeam?: string;
      dueAt?: Date;
      actorUserId?: string;
    },
  ): AssessmentFindings {
    const { actorUserId, ...rest } = data;
    return em.create(AssessmentFindings, { ...rest, ...createdBy(actorUserId) }, { partial: true });
  }

  findPlanByCode(em: EntityManager, tenantId: string, code: string): Promise<RemediationPlans | null> {
    return em.findOne(RemediationPlans, { tenantId, code });
  }

  createPlan(
    em: EntityManager,
    data: {
      tenantId: string;
      workloadAssessmentId: string;
      code: string;
      name: string;
      statusConceptId: string;
      ownerUserId?: string;
      targetCompletionAt?: Date;
      actorUserId?: string;
    },
  ): RemediationPlans {
    const { actorUserId, ...rest } = data;
    return em.create(RemediationPlans, { ...rest, ...createdBy(actorUserId) }, { partial: true });
  }

  createAction(
    em: EntityManager,
    data: {
      remediationPlanId: string;
      assessmentFindingId: string;
      actionCode: string;
      description: string;
      statusConceptId: string;
      assignedUserId?: string;
      assignedTeam?: string;
      dueAt?: Date;
      actorUserId?: string;
    },
  ): RemediationActions {
    const { actorUserId, ...rest } = data;
    return em.create(RemediationActions, { ...rest, ...createdBy(actorUserId) }, { partial: true });
  }

  findActionById(em: EntityManager, id: string): Promise<RemediationActions | null> {
    return em.findOne(RemediationActions, { id });
  }

  findPlanById(em: EntityManager, id: string): Promise<RemediationPlans | null> {
    return em.findOne(RemediationPlans, { id });
  }

  /** Cuenta acciones del plan cuyo estado NO está en la lista dada (p. ej. no verificadas). */
  countActionsNotIn(em: EntityManager, remediationPlanId: string, statusConceptIds: string[]): Promise<number> {
    return em.count(RemediationActions, { remediationPlanId, statusConceptId: { $nin: statusConceptIds } });
  }

  /** Cuenta acciones de un hallazgo cuyo estado NO está en la lista dada. */
  countFindingActionsNotIn(
    em: EntityManager,
    assessmentFindingId: string,
    statusConceptIds: string[],
  ): Promise<number> {
    return em.count(RemediationActions, {
      assessmentFindingId,
      statusConceptId: { $nin: statusConceptIds },
    });
  }
}
