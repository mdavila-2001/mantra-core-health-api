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
  /**
   * Obtiene find framework by code version.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param code - Valor de code requerido por la operación.
   * @param version - Valor de version requerido por la operación.
   * @returns Resultado de find framework by code version conforme al contrato `Promise<OperationalFrameworks | null>`.
   */
  findFrameworkByCodeVersion(
    em: EntityManager,
    code: string,
    version: string,
  ): Promise<OperationalFrameworks | null> {
    return em.findOne(OperationalFrameworks, { code, version });
  }

  /**
   * Obtiene find framework by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find framework by id conforme al contrato `Promise<OperationalFrameworks | null>`.
   */
  findFrameworkById(
    em: EntityManager,
    id: string,
  ): Promise<OperationalFrameworks | null> {
    return em.findOne(OperationalFrameworks, { id });
  }

  /**
   * Crea create framework.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create framework conforme al contrato `OperationalFrameworks`.
   */
  createFramework(
    em: EntityManager,
    data: {
      /**
       * Valor de code mantenido por la instancia.
       */
      code: string;
      /**
       * Valor de name mantenido por la instancia.
       */
      name: string;
      /**
       * Identificador asociado a provider concept.
       */
      providerConceptId: string;
      /**
       * Valor de version mantenido por la instancia.
       */
      version: string;
      /**
       * Valor de source url mantenido por la instancia.
       */
      sourceUrl?: string;
      /**
       * Valor de published at mantenido por la instancia.
       */
      publishedAt: Date;
      /**
       * Identificador asociado a state concept.
       */
      stateConceptId: string;
      /**
       * Identificador asociado a actor user.
       */
      actorUserId?: string;
    },
  ): OperationalFrameworks {
    const { actorUserId, ...rest } = data;
    return em.create(
      OperationalFrameworks,
      { ...rest, ...createdBy(actorUserId) },
      { partial: true },
    );
  }

  /**
   * Crea create control.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create control conforme al contrato `OperationalFrameworkControls`.
   */
  createControl(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a operational framework.
       */
      operationalFrameworkId: string;
      /**
       * Identificador asociado a parent control.
       */
      parentControlId?: string;
      /**
       * Valor de control code mantenido por la instancia.
       */
      controlCode: string;
      /**
       * Valor de title mantenido por la instancia.
       */
      title: string;
      /**
       * Identificador asociado a pillar concept.
       */
      pillarConceptId?: string;
      /**
       * Valor de objective text mantenido por la instancia.
       */
      objectiveText?: string;
      /**
       * Valor de evidence requirements json mantenido por la instancia.
       */
      evidenceRequirementsJson?: unknown;
      /**
       * Valor de assessment guidance json mantenido por la instancia.
       */
      assessmentGuidanceJson?: unknown;
      /**
       * Identificador asociado a state concept.
       */
      stateConceptId: string;
      /**
       * Identificador asociado a actor user.
       */
      actorUserId?: string;
    },
  ): OperationalFrameworkControls {
    const { actorUserId, ...rest } = data;
    return em.create(
      OperationalFrameworkControls,
      { ...rest, ...createdBy(actorUserId) },
      { partial: true },
    );
  }

  /**
   * Obtiene find control by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find control by id conforme al contrato `Promise<OperationalFrameworkControls | null>`.
   */
  findControlById(
    em: EntityManager,
    id: string,
  ): Promise<OperationalFrameworkControls | null> {
    return em.findOne(OperationalFrameworkControls, { id });
  }

  // --- Evaluaciones y resultados ---
  /**
   * Obtiene find assessment by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find assessment by id conforme al contrato `Promise<WorkloadAssessments | null>`.
   */
  findAssessmentById(
    em: EntityManager,
    id: string,
  ): Promise<WorkloadAssessments | null> {
    return em.findOne(WorkloadAssessments, { id });
  }

  /**
   * Crea create assessment.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create assessment conforme al contrato `WorkloadAssessments`.
   */
  createAssessment(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a tenant.
       */
      tenantId: string;
      /**
       * Identificador asociado a operational framework.
       */
      operationalFrameworkId: string;
      /**
       * Valor de workload code mantenido por la instancia.
       */
      workloadCode: string;
      /**
       * Valor de workload name mantenido por la instancia.
       */
      workloadName: string;
      /**
       * Identificador asociado a assessment type concept.
       */
      assessmentTypeConceptId: string;
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
      /**
       * Valor de assessment period start mantenido por la instancia.
       */
      assessmentPeriodStart?: Date;
      /**
       * Valor de assessment period end mantenido por la instancia.
       */
      assessmentPeriodEnd?: Date;
      /**
       * Identificador asociado a facilitator user.
       */
      facilitatorUserId?: string;
      /**
       * Identificador asociado a actor user.
       */
      actorUserId?: string;
    },
  ): WorkloadAssessments {
    const { actorUserId, ...rest } = data;
    return em.create(
      WorkloadAssessments,
      { ...rest, ...createdBy(actorUserId) },
      { partial: true },
    );
  }

  /**
   * Obtiene find control result.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param workloadAssessmentId - Identificador de workload assessment.
   * @param operationalFrameworkControlId - Identificador de operational framework control.
   * @returns Resultado de find control result conforme al contrato `Promise<AssessmentControlResults | null>`.
   */
  findControlResult(
    em: EntityManager,
    workloadAssessmentId: string,
    operationalFrameworkControlId: string,
  ): Promise<AssessmentControlResults | null> {
    return em.findOne(AssessmentControlResults, {
      workloadAssessmentId,
      operationalFrameworkControlId,
    });
  }

  /**
   * Crea create control result.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create control result conforme al contrato `AssessmentControlResults`.
   */
  createControlResult(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a workload assessment.
       */
      workloadAssessmentId: string;
      /**
       * Identificador asociado a operational framework control.
       */
      operationalFrameworkControlId: string;
      /**
       * Identificador asociado a result concept.
       */
      resultConceptId: string;
      /**
       * Identificador asociado a maturity level concept.
       */
      maturityLevelConceptId?: string;
      /**
       * Valor de evidence summary mantenido por la instancia.
       */
      evidenceSummary?: string;
      /**
       * Valor de evidence links json mantenido por la instancia.
       */
      evidenceLinksJson?: unknown;
      /**
       * Identificador asociado a assessor user.
       */
      assessorUserId?: string;
      /**
       * Identificador asociado a actor user.
       */
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
  /**
   * Obtiene find finding by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find finding by id conforme al contrato `Promise<AssessmentFindings | null>`.
   */
  findFindingById(
    em: EntityManager,
    id: string,
  ): Promise<AssessmentFindings | null> {
    return em.findOne(AssessmentFindings, { id });
  }

  /**
   * Obtiene find finding by code.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param workloadAssessmentId - Identificador de workload assessment.
   * @param findingCode - Valor de finding code requerido por la operación.
   * @returns Resultado de find finding by code conforme al contrato `Promise<AssessmentFindings | null>`.
   */
  findFindingByCode(
    em: EntityManager,
    workloadAssessmentId: string,
    findingCode: string,
  ): Promise<AssessmentFindings | null> {
    return em.findOne(AssessmentFindings, {
      workloadAssessmentId,
      findingCode,
    });
  }

  /**
   * Crea create finding.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create finding conforme al contrato `AssessmentFindings`.
   */
  createFinding(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a workload assessment.
       */
      workloadAssessmentId: string;
      /**
       * Identificador asociado a assessment control result.
       */
      assessmentControlResultId?: string;
      /**
       * Valor de finding code mantenido por la instancia.
       */
      findingCode: string;
      /**
       * Valor de title mantenido por la instancia.
       */
      title: string;
      /**
       * Valor de description mantenido por la instancia.
       */
      description?: string;
      /**
       * Identificador asociado a severity concept.
       */
      severityConceptId: string;
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
      /**
       * Valor de owner team mantenido por la instancia.
       */
      ownerTeam?: string;
      /**
       * Valor de due at mantenido por la instancia.
       */
      dueAt?: Date;
      /**
       * Identificador asociado a actor user.
       */
      actorUserId?: string;
    },
  ): AssessmentFindings {
    const { actorUserId, ...rest } = data;
    return em.create(
      AssessmentFindings,
      { ...rest, ...createdBy(actorUserId) },
      { partial: true },
    );
  }

  /**
   * Obtiene find plan by code.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Identificador de tenant.
   * @param code - Valor de code requerido por la operación.
   * @returns Resultado de find plan by code conforme al contrato `Promise<RemediationPlans | null>`.
   */
  findPlanByCode(
    em: EntityManager,
    tenantId: string,
    code: string,
  ): Promise<RemediationPlans | null> {
    return em.findOne(RemediationPlans, { tenantId, code });
  }

  /**
   * Crea create plan.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create plan conforme al contrato `RemediationPlans`.
   */
  createPlan(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a tenant.
       */
      tenantId: string;
      /**
       * Identificador asociado a workload assessment.
       */
      workloadAssessmentId: string;
      /**
       * Valor de code mantenido por la instancia.
       */
      code: string;
      /**
       * Valor de name mantenido por la instancia.
       */
      name: string;
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
      /**
       * Identificador asociado a owner user.
       */
      ownerUserId?: string;
      /**
       * Valor de target completion at mantenido por la instancia.
       */
      targetCompletionAt?: Date;
      /**
       * Identificador asociado a actor user.
       */
      actorUserId?: string;
    },
  ): RemediationPlans {
    const { actorUserId, ...rest } = data;
    return em.create(
      RemediationPlans,
      { ...rest, ...createdBy(actorUserId) },
      { partial: true },
    );
  }

  /**
   * Crea create action.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create action conforme al contrato `RemediationActions`.
   */
  createAction(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a remediation plan.
       */
      remediationPlanId: string;
      /**
       * Identificador asociado a assessment finding.
       */
      assessmentFindingId: string;
      /**
       * Valor de action code mantenido por la instancia.
       */
      actionCode: string;
      /**
       * Valor de description mantenido por la instancia.
       */
      description: string;
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
      /**
       * Identificador asociado a assigned user.
       */
      assignedUserId?: string;
      /**
       * Valor de assigned team mantenido por la instancia.
       */
      assignedTeam?: string;
      /**
       * Valor de due at mantenido por la instancia.
       */
      dueAt?: Date;
      /**
       * Identificador asociado a actor user.
       */
      actorUserId?: string;
    },
  ): RemediationActions {
    const { actorUserId, ...rest } = data;
    return em.create(
      RemediationActions,
      { ...rest, ...createdBy(actorUserId) },
      { partial: true },
    );
  }

  /**
   * Obtiene find action by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find action by id conforme al contrato `Promise<RemediationActions | null>`.
   */
  findActionById(
    em: EntityManager,
    id: string,
  ): Promise<RemediationActions | null> {
    return em.findOne(RemediationActions, { id });
  }

  /**
   * Obtiene find plan by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find plan by id conforme al contrato `Promise<RemediationPlans | null>`.
   */
  findPlanById(
    em: EntityManager,
    id: string,
  ): Promise<RemediationPlans | null> {
    return em.findOne(RemediationPlans, { id });
  }

  /** Cuenta acciones del plan cuyo estado NO está en la lista dada (p. ej. no verificadas). */
  countActionsNotIn(
    em: EntityManager,
    remediationPlanId: string,
    statusConceptIds: string[],
  ): Promise<number> {
    return em.count(RemediationActions, {
      remediationPlanId,
      statusConceptId: { $nin: statusConceptIds },
    });
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
